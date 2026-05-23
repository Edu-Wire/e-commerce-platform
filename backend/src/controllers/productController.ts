import { Request, Response } from 'express';
import { query, queryOne } from '../config/database';
import { getCache, setCache } from '../config/redis';
import { success, error } from '../utils/helpers';
import { getPaginationParams, getPaginationMeta, getOffset } from '../utils/pagination';
import { Product } from '../types';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, search, condition, min_price, max_price, customer_type, sort_by, discount, in_stock_only, b2b_only } = req.query;
    const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
    const offset = getOffset(page, limit);

    // Build cache key from all query params
    const cacheKey = `products:list:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const conditions: string[] = ['p.is_active = true'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`p.category_id IN (
        WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE slug = $${paramIdx++}
          UNION ALL
          SELECT c.id FROM categories c JOIN cat_tree ct ON ct.id = c.parent_id
        )
        SELECT id FROM cat_tree
      )`);
      params.push(category);
    }
    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.brand ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (condition) {
      conditions.push(`p.condition = $${paramIdx++}`);
      params.push(condition);
    }
    if (min_price) {
      conditions.push(`p.selling_price >= $${paramIdx++}`);
      params.push(parseFloat(String(min_price)));
    }
    if (max_price) {
      conditions.push(`p.selling_price <= $${paramIdx++}`);
      params.push(parseFloat(String(max_price)));
    }
    if (discount && discount !== 'all') {
      conditions.push(`p.discount_percentage >= $${paramIdx++}`);
      params.push(parseFloat(String(discount)));
    }
    if (in_stock_only === 'true') {
      conditions.push(`p.stock_quantity > 0`);
    }
    if (b2b_only === 'true') {
      conditions.push(`p.is_b2b_available = true`);
    }

    if (customer_type === 'b2c') {
      conditions.push('p.is_b2c_available = true');
    } else if (customer_type === 'b2b') {
      conditions.push('p.is_b2b_available = true');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'p.is_featured DESC, p.created_at DESC';
    if (sort_by === 'price_asc') orderBy = 'p.selling_price ASC, p.created_at DESC';
    else if (sort_by === 'price_desc') orderBy = 'p.selling_price DESC, p.created_at DESC';
    else if (sort_by === 'newest') orderBy = 'p.created_at DESC';
    else if (sort_by === 'rating') orderBy = 'p.is_featured DESC, p.created_at DESC'; // Fallback until ratings DB table exists

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    const products = await query<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*,
              a.id AS active_auction_id,
              a.end_time AS auction_end_time,
              a.reserve_price AS auction_reserve_price,
              a.current_highest_bid AS auction_current_highest_bid,
              a.minimum_spread AS auction_minimum_spread,
              a.quantity AS auction_quantity,
              a.outbid_purchase_markup_percent AS auction_outbid_purchase_markup_percent,
              c.name as category_name,
              c.slug as category_slug
       FROM products p
       LEFT JOIN auctions a ON a.product_id = p.id AND a.status = 'active' AND a.end_time > NOW()
       JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    // Safety: Parse images if they are stored as JSON string or handle string arrays
    const formattedProducts = products.map(p => {
      let images = p.images;
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch { images = []; }
      }
      
      // Ensure each image is an object { url: string }
      if (Array.isArray(images)) {
        images = images.map(img => typeof img === 'string' ? { url: img, is_primary: true } : img);
      } else {
        images = [];
      }

      return { ...p, images };
    });

    const meta = getPaginationMeta(total, page, limit);
    const result = success(formattedProducts, meta as unknown as Record<string, unknown>);

    await setCache(cacheKey, result, 300); // 5 minutes

    res.json(result);
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const cacheKey = `products:slug:${slug}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const product = await queryOne<Product & { category_name: string; category_slug: string; category_parent_id: number | null }>(
      `SELECT p.*,
              a.id AS active_auction_id,
              a.end_time AS auction_end_time,
              a.reserve_price AS auction_reserve_price,
              a.current_highest_bid AS auction_current_highest_bid,
              a.minimum_spread AS auction_minimum_spread,
              a.quantity AS auction_quantity,
              a.outbid_purchase_markup_percent AS auction_outbid_purchase_markup_percent,
              c.name as category_name,
              c.slug as category_slug,
              c.parent_id as category_parent_id
       FROM products p
       LEFT JOIN auctions a ON a.product_id = p.id AND a.status = 'active' AND a.end_time > NOW()
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );

    if (!product) {
      res.status(404).json(error('Product not found'));
      return;
    }

    // Safety: Parse images
    let images = product.images;
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = []; }
    }
    if (Array.isArray(images)) {
      images = images.map(img => typeof img === 'string' ? { url: img, is_primary: true } : img);
    } else {
      images = [];
    }
    const formattedProduct = { ...product, images };

    const specTemplates = await query(
      `SELECT id, spec_key, spec_label, spec_type, spec_options, is_required, sort_order
       FROM category_spec_templates
       WHERE category_id = $1
       ORDER BY sort_order ASC`,
      [product.category_id]
    );

    const result = success({ ...formattedProduct, spec_templates: specTemplates });
    await setCache(cacheKey, result, 300);

    res.json(result);
  } catch (err) {
    console.error('getProductBySlug error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getSuggestedProducts(req: Request, res: Response): Promise<void> {
  try {
    const { productIds } = req.query;
    if (!productIds) {
      res.json(success([]));
      return;
    }

    const ids = String(productIds)
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    if (ids.length === 0) {
      res.json(success([]));
      return;
    }

    const products = await query<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*,
              c.name as category_name,
              c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.category_id IN (
         SELECT category_id FROM products WHERE id = ANY($1)
       )
       AND p.id != ANY($1)
       AND p.is_active = true
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT 4`,
      [ids]
    );

    const formattedProducts = products.map(p => {
      let images = p.images;
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch { images = [] as any; }
      }
      if (Array.isArray(images)) {
        images = images.map(img => typeof img === 'string' ? { url: img, is_primary: true } : img);
      } else {
        images = [];
      }
      return { ...p, images };
    });

    res.json(success(formattedProducts));
  } catch (err) {
    console.error('getSuggestedProducts error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

