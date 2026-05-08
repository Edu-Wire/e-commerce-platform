import { Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { success, error } from '../../utils/helpers';
import { getPaginationParams, getPaginationMeta, getOffset } from '../../utils/pagination';
import { Product } from '../../types';

export async function getInventory(req: Request, res: Response): Promise<void> {
  try {
    const { low_stock, category, search } = req.query;
    const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
    const offset = getOffset(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`c.slug = $${paramIdx++}`);
      params.push(category);
    }
    if (low_stock === 'true') {
      conditions.push('p.stock_quantity <= p.minimum_stock_alert');
    }
    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM products p JOIN categories c ON c.id = p.category_id ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    const products = await query<{
      id: number;
      name: string;
      sku: string;
      category_name: string;
      category_slug: string;
      stock_quantity: number;
      minimum_stock_alert: number;
      buying_price: number;
      selling_price: number;
      mrp: number;
      condition: string;
      is_active: boolean;
      is_low_stock: boolean;
    }>(
      `SELECT
         p.id, p.name, p.sku,
         c.name as category_name,
         c.slug as category_slug,
         p.stock_quantity,
         p.minimum_stock_alert,
         p.buying_price,
         p.selling_price,
         p.mrp,
         p.condition,
         p.is_active,
         (p.stock_quantity <= p.minimum_stock_alert) as is_low_stock
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY p.stock_quantity ASC, p.name ASC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    const meta = getPaginationMeta(total, page, limit);
    res.json(success(products, meta as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('getInventory error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function updateStock(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { stock_quantity, minimum_stock_alert } = req.body;

    if (stock_quantity === undefined && minimum_stock_alert === undefined) {
      res.status(400).json(error('stock_quantity or minimum_stock_alert is required'));
      return;
    }
    if (stock_quantity !== undefined && (isNaN(parseInt(stock_quantity)) || parseInt(stock_quantity) < 0)) {
      res.status(400).json(error('stock_quantity must be a non-negative integer'));
      return;
    }

    const existing = await queryOne<Product>('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Product not found'));
      return;
    }

    const rows = await query<Product>(
      `UPDATE products SET
         stock_quantity = $1,
         minimum_stock_alert = $2
       WHERE id = $3
       RETURNING id, name, sku, stock_quantity, minimum_stock_alert`,
      [
        stock_quantity !== undefined ? parseInt(stock_quantity) : existing.stock_quantity,
        minimum_stock_alert !== undefined ? parseInt(minimum_stock_alert) : existing.minimum_stock_alert,
        id,
      ]
    );

    res.json(success(rows[0]));
  } catch (err) {
    console.error('updateStock error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function exportCSV(req: Request, res: Response): Promise<void> {
  try {
    const products = await query<{
      name: string;
      sku: string;
      category_name: string;
      stock_quantity: number;
      minimum_stock_alert: number;
      buying_price: number;
      selling_price: number;
      mrp: number;
      condition: string;
      is_active: boolean;
    }>(
      `SELECT
         p.name,
         p.sku,
         c.name as category_name,
         p.stock_quantity,
         p.minimum_stock_alert,
         p.buying_price,
         p.selling_price,
         p.mrp,
         p.condition,
         p.is_active
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.name ASC`
    );

    const headers = ['name', 'sku', 'category', 'stock_quantity', 'minimum_stock_alert', 'buying_price', 'selling_price', 'mrp', 'condition', 'is_active'];

    const csvRows = [
      headers.join(','),
      ...products.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        `"${p.category_name.replace(/"/g, '""')}"`,
        p.stock_quantity,
        p.minimum_stock_alert,
        p.buying_price,
        p.selling_price,
        p.mrp,
        p.condition,
        p.is_active,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('exportCSV error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
