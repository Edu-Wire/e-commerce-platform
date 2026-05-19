import { Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { success, error } from '../../utils/helpers';
import { getPaginationParams, getPaginationMeta, getOffset } from '../../utils/pagination';
import { Order } from '../../types';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { status, order_type, search } = req.query;
    const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
    const offset = getOffset(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`o.status = $${paramIdx++}`);
      params.push(status);
    }
    if (order_type) {
      conditions.push(`o.order_type = $${paramIdx++}`);
      params.push(order_type);
    }
    if (search) {
      conditions.push(`(CAST(o.id AS TEXT) ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx} OR c.email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders o LEFT JOIN customers c ON c.id = o.customer_id ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    const orders = await query<Order & { customer_name: string; customer_email: string; item_count: number }>(
      `SELECT o.*, c.name as customer_name, c.email as customer_email,
        jsonb_array_length(o.items) as item_count
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    const meta = getPaginationMeta(total, page, limit);
    res.json(success({ orders, meta }));
  } catch (err) {
    console.error('admin getAll orders error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await queryOne<Order & { customer_name: string; customer_email: string; items?: any[] }>(
      `SELECT o.*, c.name as customer_name, c.email as customer_email
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [id]
    );
    if (!order) {
      res.status(404).json(error('Order not found'));
      return;
    }
    
    // Enrich items inside JSONB array with real product names & conditions from products table
    const itemsList = order.items || [];
    const enrichedItems = [];
    for (const item of itemsList) {
      const product = await queryOne<{ name: string; condition: string }>(
        'SELECT name, condition FROM products WHERE id = $1',
        [item.product_id]
      );
      enrichedItems.push({
        ...item,
        product_name: product?.name || 'Unknown Product',
        product_sku: item.sku,
        condition: product?.condition || 'new',
        unit_price: parseFloat(String(item.selling_price || 0)),
        total_price: parseFloat(String(item.selling_price || 0)) * (item.quantity || 0)
      });
    }
    
    order.items = enrichedItems;
    res.json(success(order));
  } catch (err) {
    console.error('admin getById order error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json(error(`status must be one of: ${validStatuses.join(', ')}`));
      return;
    }

    const existing = await queryOne<Order>('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Order not found'));
      return;
    }

    const rows = await query<Order>(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    res.json(success(rows[0]));
  } catch (err) {
    console.error('admin updateStatus order error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
