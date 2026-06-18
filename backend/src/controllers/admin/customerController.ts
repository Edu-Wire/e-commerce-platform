import { Request, Response } from 'express';
import { query } from '../../config/database';
import { success, error } from '../../utils/helpers';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const customers = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.email, 
        c.phone, 
        c.is_active, 
        c.created_at, 
        NULL as last_login,
        (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) as total_orders,
        (SELECT COALESCE(SUM(o.total_selling_price), 0) FROM orders o WHERE o.customer_id = c.id AND o.status NOT IN ('cancelled', 'refunded')) as total_spent
      FROM customers c 
      ORDER BY c.created_at DESC
    `);
    
    const formatted = customers.map(c => ({
      ...c,
      total_orders: parseInt(c.total_orders as any) || 0,
      total_spent: parseFloat(c.total_spent as any) || 0,
    }));
    
    res.json(success(formatted));
  } catch (err) {
    console.error('admin getAll customers error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
