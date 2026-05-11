import { Request, Response } from 'express';
import path from 'path';
import { query, queryOne } from '../../config/database';
import { delCachePattern, delCache } from '../../config/redis';
import { success, error, slugify } from '../../utils/helpers';
import { getPaginationParams, getPaginationMeta, getOffset } from '../../utils/pagination';
import { Product } from '../../types';

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const { category, condition, low_stock, is_b2b, is_b2c, search } = req.query;
    const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
    const offset = getOffset(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`c.slug = $${paramIdx++}`);
      params.push(category);
    }
    if (condition) {
      conditions.push(`p.condition = $${paramIdx++}`);
      params.push(condition);
    }
    if (low_stock === 'true') {
      conditions.push('p.stock_quantity <= p.minimum_stock_alert');
    }
    if (is_b2b === 'true') {
      conditions.push('p.is_b2b_available = true');
    }
    if (is_b2c === 'true') {
      conditions.push('p.is_b2c_available = true');
    }
    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx} OR p.brand ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM products p JOIN categories c ON c.id = p.category_id ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    const products = await query<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    const meta = getPaginationMeta(total, page, limit);
    res.json(success({ products, meta }));
  } catch (err) {
    console.error('admin getAll products error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const product = await queryOne<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );
    if (!product) {
      res.status(404).json(error('Product not found'));
      return;
    }
    res.json(success(product));
  } catch (err) {
    console.error('admin getById product error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const {
      category_id, name, description, sku, brand,
      mrp, buying_price, selling_price, condition,
      damage_description, defect_description,
      stock_quantity, minimum_stock_alert,
      is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
      images, specifications, weight_grams, dimensions_cm, tags,
      is_active, is_featured,
    } = req.body;

    const required = ['category_id', 'name', 'sku', 'mrp', 'buying_price', 'selling_price', 'condition'];
    for (const field of required) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        res.status(400).json(error(`${field} is required`));
        return;
      }
    }

    if (parseFloat(selling_price) > parseFloat(mrp)) {
      res.status(400).json(error('selling_price cannot exceed mrp'));
      return;
    }
    if (parseFloat(buying_price) <= 0) {
      res.status(400).json(error('buying_price must be greater than 0'));
      return;
    }

    const validConditions = ['new', 'new_with_minor_damage', 'new_with_defect'];
    if (!validConditions.includes(condition)) {
      res.status(400).json(error(`condition must be one of: ${validConditions.join(', ')}`));
      return;
    }

    const category = await queryOne('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (!category) {
      res.status(400).json(error('Category not found'));
      return;
    }

    const skuExists = await queryOne('SELECT id FROM products WHERE sku = $1', [sku]);
    if (skuExists) {
      res.status(409).json(error('SKU already exists'));
      return;
    }

    const slug = slugify(name);
    const slugExists = await queryOne('SELECT id FROM products WHERE slug = $1', [slug]);
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const adminId = req.admin?.id || null;

    const rows = await query<Product>(
      `INSERT INTO products (
         category_id, name, slug, description, sku, brand,
         mrp, buying_price, selling_price,
         condition, damage_description, defect_description,
         stock_quantity, minimum_stock_alert,
         is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
         images, specifications, weight_grams, dimensions_cm, tags,
         is_active, is_featured, created_by
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
       ) RETURNING *`,
      [
        category_id, name, finalSlug, description || null, sku, brand || null,
        mrp, buying_price, selling_price,
        condition, damage_description || null, defect_description || null,
        stock_quantity ?? 0, minimum_stock_alert ?? 5,
        is_b2b_available ?? false, is_b2c_available ?? true,
        b2b_price || null, b2b_minimum_quantity ?? 1,
        JSON.stringify(images || []),
        JSON.stringify(specifications || {}),
        weight_grams || null,
        dimensions_cm ? JSON.stringify(dimensions_cm) : null,
        tags || [],
        is_active ?? true, is_featured ?? false,
        adminId,
      ]
    );

    await delCachePattern('products:list:*');
    res.status(201).json(success(rows[0]));
  } catch (err) {
    console.error('admin create product error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await queryOne<Product>('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Product not found'));
      return;
    }

    const {
      category_id, name, description, brand,
      mrp, buying_price, selling_price, condition,
      damage_description, defect_description,
      stock_quantity, minimum_stock_alert,
      is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
      images, specifications, weight_grams, dimensions_cm, tags,
      is_active, is_featured,
    } = req.body;

    const newMrp = mrp !== undefined ? parseFloat(mrp) : existing.mrp;
    const newSelling = selling_price !== undefined ? parseFloat(selling_price) : existing.selling_price;
    const newBuying = buying_price !== undefined ? parseFloat(buying_price) : existing.buying_price;

    if (newSelling > newMrp) {
      res.status(400).json(error('selling_price cannot exceed mrp'));
      return;
    }
    if (newBuying <= 0) {
      res.status(400).json(error('buying_price must be greater than 0'));
      return;
    }

    const newName = name ?? existing.name;
    let newSlug = existing.slug;
    if (name && name !== existing.name) {
      newSlug = slugify(name);
      const slugConflict = await queryOne('SELECT id FROM products WHERE slug = $1 AND id != $2', [newSlug, id]);
      if (slugConflict) newSlug = `${newSlug}-${Date.now()}`;
    }

    const rows = await query<Product>(
      `UPDATE products SET
         category_id = $1, name = $2, slug = $3, description = $4, brand = $5,
         mrp = $6, buying_price = $7, selling_price = $8,
         condition = $9, damage_description = $10, defect_description = $11,
         stock_quantity = $12, minimum_stock_alert = $13,
         is_b2b_available = $14, is_b2c_available = $15, b2b_price = $16, b2b_minimum_quantity = $17,
         images = $18, specifications = $19, weight_grams = $20, dimensions_cm = $21, tags = $22,
         is_active = $23, is_featured = $24
       WHERE id = $25
       RETURNING *`,
      [
        category_id ?? existing.category_id,
        newName, newSlug,
        description !== undefined ? description : existing.description,
        brand !== undefined ? brand : existing.brand,
        newMrp, newBuying, newSelling,
        condition ?? existing.condition,
        damage_description !== undefined ? damage_description : existing.damage_description,
        defect_description !== undefined ? defect_description : existing.defect_description,
        stock_quantity !== undefined ? stock_quantity : existing.stock_quantity,
        minimum_stock_alert !== undefined ? minimum_stock_alert : existing.minimum_stock_alert,
        is_b2b_available !== undefined ? is_b2b_available : existing.is_b2b_available,
        is_b2c_available !== undefined ? is_b2c_available : existing.is_b2c_available,
        b2b_price !== undefined ? b2b_price : existing.b2b_price,
        b2b_minimum_quantity !== undefined ? b2b_minimum_quantity : existing.b2b_minimum_quantity,
        images !== undefined ? JSON.stringify(images) : JSON.stringify(existing.images),
        specifications !== undefined ? JSON.stringify(specifications) : JSON.stringify(existing.specifications),
        weight_grams !== undefined ? weight_grams : existing.weight_grams,
        dimensions_cm !== undefined ? JSON.stringify(dimensions_cm) : (existing.dimensions_cm ? JSON.stringify(existing.dimensions_cm) : null),
        tags !== undefined ? tags : existing.tags,
        is_active !== undefined ? is_active : existing.is_active,
        is_featured !== undefined ? is_featured : existing.is_featured,
        id,
      ]
    );

    await delCachePattern('products:list:*');
    await delCache(`products:slug:${existing.slug}`);
    if (newSlug !== existing.slug) await delCache(`products:slug:${newSlug}`);

    res.json(success(rows[0]));
  } catch (err) {
    console.error('admin update product error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await queryOne<Product>('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Product not found'));
      return;
    }

    await query('UPDATE products SET is_active = false WHERE id = $1', [id]);
    await delCachePattern('products:list:*');
    await delCache(`products:slug:${existing.slug}`);

    res.json(success({ message: 'Product deactivated successfully' }));
  } catch (err) {
    console.error('admin delete product error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function uploadImages(req: Request, res: Response): Promise<void> {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json(error('No images uploaded'));
      return;
    }

    const urls = (req.files as Express.Multer.File[]).map((file) => {
      return `/uploads/products/${path.basename(file.filename)}`;
    });

    res.json(success({ urls }));
  } catch (err) {
    console.error('uploadImages error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
