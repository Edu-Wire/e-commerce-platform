import { Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { getCache, setCache } from '../../config/redis';
import { success, error } from '../../utils/helpers';

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const cacheKey = 'admin:dashboard:stats';
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Product stats
    const productStats = await queryOne<{
      total_products: string;
      active_products: string;
      low_stock_count: string;
    }>(
      `SELECT
         COUNT(*) as total_products,
         COUNT(*) FILTER (WHERE is_active = true) as active_products,
         COUNT(*) FILTER (WHERE stock_quantity <= minimum_stock_alert) as low_stock_count
       FROM products`
    );

    // Today's orders
    const todayOrders = await queryOne<{ today_orders: string }>(
      `SELECT COUNT(*) as today_orders FROM orders WHERE created_at >= CURRENT_DATE`
    );

    // Total revenue
    const revenueStats = await queryOne<{ total_revenue: string }>(
      `SELECT COALESCE(SUM(total_selling_price), 0) as total_revenue FROM orders WHERE status NOT IN ('cancelled', 'refunded')`
    );

    // Total customers
    const customerStats = await queryOne<{ total_customers: string }>(
      `SELECT COUNT(*) as total_customers FROM customers WHERE is_active = true`
    );

    // Sales by category
    const salesByCategory = await query<{ category_name: string; total_sales: string; order_count: string }>(
      `SELECT
         c.name as category_name,
         COALESCE(SUM((item->>'selling_price')::numeric * (item->>'quantity')::numeric), 0) as total_sales,
         COUNT(DISTINCT o.id) as order_count
       FROM orders o
       CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
       JOIN products p ON p.id = (item->>'product_id')::int
       JOIN categories c ON c.id = p.category_id
       WHERE o.status NOT IN ('cancelled', 'refunded')
       GROUP BY c.id, c.name
       ORDER BY total_sales DESC
       LIMIT 10`
    );

    // Orders last 30 days
    const ordersLast30Days = await query<{ date: string; count: string; revenue: string }>(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as count,
         COALESCE(SUM(total_selling_price), 0) as revenue
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Condition breakdown
    const conditionBreakdown = await query<{ condition: string; count: string }>(
      `SELECT condition, COUNT(*) as count FROM products WHERE is_active = true GROUP BY condition ORDER BY count DESC`
    );

    // Recent orders with customer name
    const recentOrders = await query<{
      id: number;
      order_type: string;
      status: string;
      total_selling_price: string;
      created_at: Date;
      customer_name: string | null;
      customer_email: string | null;
    }>(
      `SELECT
         o.id, o.order_type, o.status, o.total_selling_price, o.created_at,
         c.name as customer_name,
         c.email as customer_email
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    const result = success({
      // flat fields matching frontend DashboardStats type
      total_products:  parseInt(productStats?.total_products  || '0'),
      active_products: parseInt(productStats?.active_products || '0'),
      low_stock_items: parseInt(productStats?.low_stock_count || '0'),
      todays_orders:   parseInt(todayOrders?.today_orders     || '0'),
      total_revenue:   parseFloat(revenueStats?.total_revenue || '0'),
      total_customers: parseInt(customerStats?.total_customers || '0'),

      // chart: category → "category", total_sales → "revenue"
      sales_by_category: salesByCategory.map((r) => ({
        category: r.category_name,
        revenue:  parseFloat(r.total_sales),
        order_count: parseInt(r.order_count),
      })),

      // chart: count → "orders"
      orders_last_30_days: ordersLast30Days.map((r) => ({
        date:    r.date,
        orders:  parseInt(r.count),
        revenue: parseFloat(r.revenue),
      })),

      condition_breakdown: conditionBreakdown.map((r) => ({
        condition: r.condition,
        count: parseInt(r.count),
      })),

      // recent orders: normalise field names
      recent_orders: recentOrders.map((o) => ({
        ...o,
        order_number:  `#${o.id}`,
        total_amount:  parseFloat(String(o.total_selling_price)),
      })),
    });

    await setCache(cacheKey, result, 120); // 2 minutes
    res.json(result);
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
