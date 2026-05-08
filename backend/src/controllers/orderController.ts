import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../config/database';
import { PoolClient } from 'pg';
import { success, error } from '../utils/helpers';
import { getPaginationParams, getPaginationMeta, getOffset } from '../utils/pagination';
import { Order, Product } from '../types';

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

    res.json(success(order));
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

    const meta = getPaginationMeta(total, page, limit);
    res.json(success(orders, meta as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
