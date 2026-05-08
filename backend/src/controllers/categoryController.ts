import { Request, Response } from 'express';
import { query } from '../config/database';
import { getCache, setCache } from '../config/redis';
import { success, error } from '../utils/helpers';
import { Category } from '../types';

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

export async function getTree(req: Request, res: Response): Promise<void> {
  try {
    const cacheKey = 'categories:tree';
    const cached = await getCache<Category[]>(cacheKey);
    if (cached) {
      res.json(success(cached));
      return;
    }

    const categories = await query<Category>(
      'SELECT id, name, slug, parent_id, icon_url, is_active, created_at FROM categories WHERE is_active = true ORDER BY id ASC'
    );

    const tree = buildTree(categories);
    await setCache(cacheKey, tree, 600); // 10 minutes

    res.json(success(tree));
  } catch (err) {
    console.error('getTree error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
