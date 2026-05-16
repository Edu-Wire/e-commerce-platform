import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../config/database';
import { PoolClient } from 'pg';
import { success, error } from '../utils/helpers';
import { getPaginationParams, getPaginationMeta, getOffset } from '../utils/pagination';
import { Order, Product } from '../types';
import { mapOrderForCustomer, parseOrderItems } from '../utils/orderHelpers';
import { ensureWallet, getHeldAmount, recordTransaction } from '../services/walletService';
import { syncMissingAuctionWinOrders } from '../services/auctionOrderService';

interface OrderItemInput {
  product_id: number;
  quantity: number;
  variant?: string;
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const customer = req.customer!;
    const { items, shipping_address, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json(error('items array is required and must not be empty'));
      return;
    }
    if (!shipping_address) {
      res.status(400).json(error('shipping_address is required'));
      return;
    }

    const orderType = customer.customer_type;

    const order = await withTransaction(async (client: PoolClient) => {
      let totalMrp = 0;
      let totalSellingPrice = 0;
      const orderItems: Array<{
        product_id: number;
        sku: string;
        name: string;
        quantity: number;
        mrp: number;
        selling_price: number;
        variant?: string;
      }> = [];

      for (const item of items as OrderItemInput[]) {
        if (!item.product_id || !item.quantity || item.quantity < 1) {
          throw new Error(`Invalid item: product_id and quantity (>0) are required`);
        }

        const product = await queryOne<Product>(
          'SELECT * FROM products WHERE id = $1 AND is_active = true FOR UPDATE',
          [item.product_id]
        );
        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}`);
        }
        if (orderType === 'b2b' && !product.is_b2b_available) {
          throw new Error(`Product "${product.name}" is not available for B2B`);
        }
        if (orderType === 'b2c' && !product.is_b2c_available) {
          throw new Error(`Product "${product.name}" is not available for B2C`);
        }

        const unitPrice = orderType === 'b2b' && product.is_b2b_available && product.b2b_price
          ? product.b2b_price
          : product.selling_price;

        totalMrp += product.mrp * item.quantity;
        totalSellingPrice += unitPrice * item.quantity;

        orderItems.push({
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          mrp: product.mrp,
          selling_price: unitPrice,
          variant: item.variant,
        });

        // Deduct stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, product.id]
        );
      }

      const totalSavings = totalMrp - totalSellingPrice;

      const result = await client.query<Order>(
        `INSERT INTO orders (customer_id, order_type, status, total_mrp, total_selling_price, total_savings, items, shipping_address, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          customer.id, orderType, 'pending',
          totalMrp, totalSellingPrice, totalSavings,
          JSON.stringify(orderItems),
          JSON.stringify(shipping_address),
          notes || null,
        ]
      );

      return result.rows[0];
    });

    res.status(201).json(success(order));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes('Insufficient stock') || message.includes('not found') || message.includes('not available')) {
      res.status(400).json(error(message));
    } else {
      console.error('createOrder error:', err);
      res.status(500).json(error('Internal server error'));
    }
  }
}

function demoGatewayRef(): string {
  return `DEMO_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const AUCTION_PAYMENT_WINDOW_MS = 6 * 60 * 60 * 1000;

export async function payAuctionOrder(req: Request, res: Response): Promise<void> {
  try {
    const customer = req.customer!;
    const orderId = parseInt(String(req.params.id), 10);
    const { source = 'wallet', payment_method_id } = req.body as {
      source?: 'wallet' | 'demo';
      payment_method_id?: number;
    };

    if (!orderId || Number.isNaN(orderId)) {
      res.status(400).json(error('Invalid order id'));
      return;
    }

    await syncMissingAuctionWinOrders(customer.id);

    const result = await withTransaction(async (client: PoolClient) => {
      const orderRes = await client.query<Order>(
        `SELECT * FROM orders WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
        [orderId, customer.id]
      );
      const order = orderRes.rows[0];

      if (!order) {
        throw new Error('ORDER_NOT_FOUND');
      }
      if (order.notes !== 'AUCTION_WIN') {
        throw new Error('NOT_AUCTION_ORDER');
      }
      if (order.status !== 'pending') {
        throw new Error('ALREADY_PAID');
      }

      const auctionRes = await client.query<{ end_time: string }>(
        `SELECT a.end_time
         FROM auctions a
         JOIN LATERAL (
           SELECT (elem->>'product_id')::int AS pid
           FROM jsonb_array_elements($2::jsonb) AS elem
           LIMIT 1
         ) item ON a.product_id = item.pid
         WHERE a.status = 'completed' AND a.highest_bidder_id = $1
         ORDER BY a.end_time DESC
         LIMIT 1`,
        [customer.id, JSON.stringify(parseOrderItems(order.items))]
      );
      const windowStart = auctionRes.rows[0]?.end_time
        ? new Date(auctionRes.rows[0].end_time).getTime()
        : new Date(order.created_at).getTime();
      if (Date.now() - windowStart > AUCTION_PAYMENT_WINDOW_MS) {
        throw new Error('PAYMENT_EXPIRED');
      }

      const amount = parseFloat(String(order.total_selling_price));
      if (!amount || amount <= 0) {
        throw new Error('INVALID_AMOUNT');
      }

      const items = parseOrderItems(order.items);
      const productName = items[0]?.name || 'Auction Item';
      let gatewayRef = demoGatewayRef();
      let methodLabel = 'Wallet';

      if (source === 'wallet') {
        await ensureWallet(customer.id, client);
        const walletRes = await client.query<{ balance: string }>(
          'SELECT balance FROM customer_wallets WHERE customer_id = $1 FOR UPDATE',
          [customer.id]
        );
        const balance = parseFloat(walletRes.rows[0]?.balance || '0');
        const held = await getHeldAmount(customer.id);
        const available = Math.round((balance - held) * 100) / 100;

        if (amount > available) {
          throw new Error('INSUFFICIENT_WALLET');
        }

        if (payment_method_id) {
          const pmRes = await client.query<{ label: string; last_four: string | null }>(
            'SELECT label, last_four FROM wallet_payment_methods WHERE id = $1 AND customer_id = $2',
            [payment_method_id, customer.id]
          );
          const pm = pmRes.rows[0];
          if (!pm) throw new Error('PAYMENT_METHOD_NOT_FOUND');
          methodLabel = pm.last_four ? `${pm.label} **** ${pm.last_four}` : pm.label;
        }

        await recordTransaction(
          customer.id,
          {
            type: 'payment',
            amount: -amount,
            title: 'Auction Payment',
            description: `Order #${orderId} · ${productName} via ${methodLabel}`,
            status: 'completed',
            payment_method_id: payment_method_id || undefined,
            reference_id: `ORDER_${orderId}`,
          },
          client
        );
      } else {
        if (payment_method_id) {
          const pmRes = await client.query<{ label: string; last_four: string | null }>(
            'SELECT label, last_four FROM wallet_payment_methods WHERE id = $1 AND customer_id = $2',
            [payment_method_id, customer.id]
          );
          const pm = pmRes.rows[0];
          if (!pm) throw new Error('PAYMENT_METHOD_NOT_FOUND');
          methodLabel = pm.last_four ? `${pm.label} **** ${pm.last_four}` : pm.label;
        } else {
          methodLabel = 'Demo Payment Gateway';
        }
        await new Promise((r) => setTimeout(r, 600));
      }

      await client.query(
        `UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
        [orderId]
      );

      const updated = await client.query<Order>('SELECT * FROM orders WHERE id = $1', [orderId]);

      return {
        order: mapOrderForCustomer(updated.rows[0] as unknown as Record<string, unknown>),
        gateway_ref: gatewayRef,
        paid_via: source,
        amount,
      };
    });

    res.json(success(result));
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'ORDER_NOT_FOUND') {
      res.status(404).json(error('Order not found'));
      return;
    }
    if (msg === 'NOT_AUCTION_ORDER') {
      res.status(400).json(error('This order is not an auction win'));
      return;
    }
    if (msg === 'ALREADY_PAID') {
      res.status(400).json(error('This order has already been paid'));
      return;
    }
    if (msg === 'PAYMENT_EXPIRED') {
      res.status(400).json(error('Payment window expired (6 hours)'));
      return;
    }
    if (msg === 'INSUFFICIENT_WALLET') {
      res.status(400).json(error('Insufficient wallet balance. Add funds or pay with card.'));
      return;
    }
    if (msg === 'PAYMENT_METHOD_NOT_FOUND') {
      res.status(400).json(error('Payment method not found'));
      return;
    }
    console.error('payAuctionOrder error:', err);
    res.status(500).json(error('Payment failed. Please try again.'));
  }
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  try {
    const customer = req.customer!;
    const { id } = req.params;

    const order = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
      [id, customer.id]
    );

    if (!order) {
      res.status(404).json(error('Order not found'));
      return;
    }

    res.json(success(mapOrderForCustomer(order as unknown as Record<string, unknown>)));
  } catch (err) {
    console.error('getOrder error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  try {
    const customer = req.customer!;
    const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
    const offset = getOffset(page, limit);

    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = $1',
      [customer.id]
    );
    const total = parseInt(countResult[0].count);

    const orders = await query<Order>(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [customer.id, limit, offset]
    );

    const mapped = orders.map((o) =>
      mapOrderForCustomer(o as unknown as Record<string, unknown>)
    );

    const meta = getPaginationMeta(total, page, limit);
    res.json(success(mapped, meta as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
