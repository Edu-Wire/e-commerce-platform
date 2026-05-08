import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../../config/database';
import { PoolClient } from 'pg';
import { delCache, delCachePattern } from '../../config/redis';
import { success, error, slugify } from '../../utils/helpers';
import { Category, SpecTemplate } from '../../types';

function buildTree(categories: Category[]): Category[] {
  const map = new Map<number, Category>();
  const roots: Category[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of map.values()) {
    if (cat.parent_id === null) {
      roots.push(cat);
    } else {
      const parent = map.get(cat.parent_id);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(cat);
      }
    }
  }

  return roots;
}

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const categories = await query<Category & { parent_name: string | null }>(
      `SELECT c.*, p.name as parent_name
       FROM categories c
       LEFT JOIN categories p ON p.id = c.parent_id
       ORDER BY c.id ASC`
    );
    res.json(success(categories));
  } catch (err) {
    console.error('admin getAll categories error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getTree(req: Request, res: Response): Promise<void> {
  try {
    const categories = await query<Category>(
      'SELECT id, name, slug, parent_id, icon_url, is_active, created_at FROM categories ORDER BY id ASC'
    );
    const tree = buildTree(categories);
    res.json(success(tree));
  } catch (err) {
    console.error('admin getTree error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, parent_id, icon_url } = req.body;
    if (!name) {
      res.status(400).json(error('name is required'));
      return;
    }

    const slug = slugify(name);
    const existing = await queryOne('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing) {
      res.status(409).json(error('A category with this name/slug already exists'));
      return;
    }

    if (parent_id) {
      const parent = await queryOne('SELECT id FROM categories WHERE id = $1', [parent_id]);
      if (!parent) {
        res.status(400).json(error('Parent category not found'));
        return;
      }
    }

    const rows = await query<Category>(
      `INSERT INTO categories (name, slug, parent_id, icon_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, parent_id || null, icon_url || null]
    );

    await delCache('categories:tree');
    res.status(201).json(success(rows[0]));
  } catch (err) {
    console.error('admin create category error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, parent_id, icon_url, is_active } = req.body;

    const existing = await queryOne<Category>('SELECT * FROM categories WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Category not found'));
      return;
    }

    const newName = name ?? existing.name;
    const newSlug = name ? slugify(name) : existing.slug;

    if (name && newSlug !== existing.slug) {
      const slugConflict = await queryOne('SELECT id FROM categories WHERE slug = $1 AND id != $2', [newSlug, id]);
      if (slugConflict) {
        res.status(409).json(error('A category with this slug already exists'));
        return;
      }
    }

    const rows = await query<Category>(
      `UPDATE categories SET
         name = $1,
         slug = $2,
         parent_id = $3,
         icon_url = $4,
         is_active = $5
       WHERE id = $6
       RETURNING *`,
      [
        newName,
        newSlug,
        parent_id !== undefined ? parent_id : existing.parent_id,
        icon_url !== undefined ? icon_url : existing.icon_url,
        is_active !== undefined ? is_active : existing.is_active,
        id,
      ]
    );

    await delCache('categories:tree');
    res.json(success(rows[0]));
  } catch (err) {
    console.error('admin update category error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await queryOne('SELECT id FROM categories WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Category not found'));
      return;
    }

    const hasProducts = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [id]
    );
    if (hasProducts && parseInt(hasProducts.count) > 0) {
      res.status(400).json(error('Cannot delete category: it has associated products'));
      return;
    }

    const hasChildren = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [id]
    );
    if (hasChildren && parseInt(hasChildren.count) > 0) {
      res.status(400).json(error('Cannot delete category: it has sub-categories'));
      return;
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);
    await delCache('categories:tree');

    res.json(success({ message: 'Category deleted successfully' }));
  } catch (err) {
    console.error('admin delete category error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getSpecTemplates(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const templates = await query<SpecTemplate>(
      `SELECT * FROM category_spec_templates WHERE category_id = $1 ORDER BY sort_order ASC`,
      [id]
    );
    res.json(success(templates));
  } catch (err) {
    console.error('getSpecTemplates error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function upsertSpecTemplates(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { templates } = req.body;

    if (!Array.isArray(templates)) {
      res.status(400).json(error('templates must be an array'));
      return;
    }

    const category = await queryOne('SELECT id FROM categories WHERE id = $1', [id]);
    if (!category) {
      res.status(404).json(error('Category not found'));
      return;
    }

    const result = await withTransaction(async (client: PoolClient) => {
      await client.query('DELETE FROM category_spec_templates WHERE category_id = $1', [id]);

      const inserted: SpecTemplate[] = [];
      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        if (!t.spec_key || !t.spec_label || !t.spec_type) {
          throw new Error(`Template at index ${i} is missing spec_key, spec_label, or spec_type`);
        }
        const rows = await client.query<SpecTemplate>(
          `INSERT INTO category_spec_templates (category_id, spec_key, spec_label, spec_type, spec_options, is_required, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            id,
            t.spec_key,
            t.spec_label,
            t.spec_type,
            t.spec_options ? JSON.stringify(t.spec_options) : null,
            t.is_required ?? false,
            t.sort_order ?? i,
          ]
        );
        inserted.push(rows.rows[0]);
      }
      return inserted;
    });

    res.json(success(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes('missing ')) {
      res.status(400).json(error(message));
    } else {
      console.error('upsertSpecTemplates error:', err);
      res.status(500).json(error('Internal server error'));
    }
  }
}

// Export deleteCategory with the route-expected name
export { deleteCategory as deleteOne };
