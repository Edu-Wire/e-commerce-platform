import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { query, queryOne } from '../../config/database';
import { delCachePattern } from '../../config/redis';
import { success, error, slugify } from '../../utils/helpers';
import { getPaginationParams, getPaginationMeta, getOffset } from '../../utils/pagination';
import { BulkUploadLog } from '../../types';

const VALID_CONDITIONS = ['new', 'new_with_minor_damage', 'new_with_defect'];
const REQUIRED_FIELDS: string[] = [];

interface RawRow {
  name?: string;
  sku?: string;
  category_slug?: string;
  brand?: string;
  description?: string;
  mrp?: string;
  buying_price?: string;
  selling_price?: string;
  condition?: string;
  damage_description?: string;
  defect_description?: string;
  stock_quantity?: string;
  minimum_stock_alert?: string;
  is_b2b_available?: string;
  b2b_price?: string;
  b2b_minimum_quantity?: string;
  weight_grams?: string;
  tags?: string;
  image_urls?: string;
  specifications?: string;
  [key: string]: string | undefined;
}

interface RowError {
  row: number;
  sku: string;
  message: string;
}

async function parseCsvFile(filePath: string): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const results: RawRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: RawRow) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseXlsxFile(filePath: string): RawRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
}

async function validateAndInsertRow(
  row: RawRow,
  rowNum: number,
  adminId: number | null,
  categoryCache: Map<string, number>
): Promise<{ success: boolean; error?: string; sku?: string }> {
  let sku = row.sku ? String(row.sku).trim() : '';

  // 1. Resolve name
  let name = row.name ? String(row.name).trim() : '';
  if (!name) {
    name = `Product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // 2. Resolve category_slug / categoryId
  const categorySlug = row.category_slug ? String(row.category_slug).trim() : '';
  let categoryId: number | undefined;

  if (categorySlug) {
    categoryId = categoryCache.get(categorySlug);
    if (categoryId === undefined) {
      const cat = await queryOne<{ id: number }>('SELECT id FROM categories WHERE slug = $1', [categorySlug]);
      if (cat) {
        categoryId = cat.id;
        categoryCache.set(categorySlug, categoryId);
      }
    }
  }

  if (categoryId === undefined) {
    // Look for "uncategorized" or first category
    const existing = await queryOne<{ id: number }>(
      "SELECT id FROM categories WHERE slug = 'uncategorized' OR name ILIKE '%uncategorized%' LIMIT 1"
    );
    if (existing) {
      categoryId = existing.id;
    } else {
      const firstCat = await queryOne<{ id: number }>('SELECT id FROM categories ORDER BY id ASC LIMIT 1');
      if (firstCat) {
        categoryId = firstCat.id;
      } else {
        const insert = await queryOne<{ id: number }>(
          "INSERT INTO categories (name, slug) VALUES ('Uncategorized', 'uncategorized') RETURNING id"
        );
        categoryId = insert!.id;
      }
    }
  }

  // 3. Resolve MRP, selling price, and buying price
  let mrp = row.mrp ? parseFloat(String(row.mrp)) : 0;
  let sellingPrice = row.selling_price ? parseFloat(String(row.selling_price)) : 0;

  if (isNaN(mrp) || mrp < 0) mrp = 0;
  if (isNaN(sellingPrice) || sellingPrice < 0) sellingPrice = 0;

  if (mrp === 0 && sellingPrice > 0) {
    mrp = sellingPrice;
  } else if (sellingPrice === 0 && mrp > 0) {
    sellingPrice = mrp;
  }

  // Prevent division by zero (mrp must be > 0)
  if (mrp <= 0) {
    mrp = 1.00;
  }
  if (sellingPrice <= 0) {
    sellingPrice = mrp;
  }

  if (sellingPrice > mrp) {
    return { success: false, error: 'selling_price cannot exceed mrp', sku };
  }

  let buyingPrice = sellingPrice;
  if (row.buying_price !== undefined && String(row.buying_price).trim() !== '') {
    const parsed = parseFloat(String(row.buying_price));
    if (isNaN(parsed) || parsed < 0) {
      return { success: false, error: 'buying_price must be a positive number', sku };
    }
    buyingPrice = parsed;
  }

  // 4. Resolve Condition
  let condition = row.condition ? String(row.condition).trim() : 'new';
  if (!VALID_CONDITIONS.includes(condition)) {
    condition = 'new';
  }

  // Check SKU uniqueness / auto-generate if missing
  if (!sku) {
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
      const timePart = Date.now().toString().slice(-4);
      sku = `SKU-${randomPart}-${timePart}`;
      
      const exists = await queryOne('SELECT id FROM products WHERE sku = $1', [sku]);
      if (!exists) {
        isUnique = true;
      }
      attempts++;
    }
  } else {
    const skuExists = await queryOne('SELECT id FROM products WHERE sku = $1', [sku]);
    if (skuExists) return { success: false, error: `SKU "${sku}" already exists`, sku };
  }

  const slug = slugify(name);
  const slugExists = await queryOne('SELECT id FROM products WHERE slug = $1', [slug]);
  const finalSlug = slugExists ? `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : slug;

  const stockQty = row.stock_quantity ? parseInt(String(row.stock_quantity)) : 0;
  const minStockAlert = row.minimum_stock_alert ? parseInt(String(row.minimum_stock_alert)) : 5;
  const isB2b = String(row.is_b2b_available).toLowerCase() === 'true';
  const b2bPrice = row.b2b_price && String(row.b2b_price).trim() !== '' ? parseFloat(String(row.b2b_price)) : null;
  const b2bMinQty = row.b2b_minimum_quantity ? parseInt(String(row.b2b_minimum_quantity)) : 1;
  const weightGrams = row.weight_grams ? parseInt(String(row.weight_grams)) : null;
  const tagsRaw = row.tags ? String(row.tags).split(';').map((t) => t.trim()).filter(Boolean) : [];

  const imageUrls = row.image_urls ? String(row.image_urls).split(';').map((url) => url.trim()).filter(Boolean) : [];
  const productImages = imageUrls.map((url, idx) => ({
    url,
    is_primary: idx === 0,
    sort_order: idx
  }));

  const STANDARD_FIELDS = [
    'name', 'sku', 'category_slug', 'brand', 'description',
    'mrp', 'buying_price', 'selling_price', 'condition',
    'damage_description', 'defect_description', 'stock_quantity',
    'minimum_stock_alert', 'is_b2b_available', 'b2b_price',
    'b2b_minimum_quantity', 'weight_grams', 'tags', 'image_urls',
    'specifications'
  ];

  let specifications: Record<string, unknown> = {};
  if (row.specifications) {
    try {
      specifications = JSON.parse(String(row.specifications));
    } catch {
      // ignore parse errors
    }
  }

  // Merge any custom columns into specifications
  Object.keys(row).forEach((key) => {
    if (!STANDARD_FIELDS.includes(key) && row[key] !== undefined && String(row[key]).trim() !== '') {
      specifications[key] = String(row[key]).trim();
    }
  });

  await query(
    `INSERT INTO products (
       category_id, name, slug, description, sku, brand,
       mrp, buying_price, selling_price,
       condition, damage_description, defect_description,
       stock_quantity, minimum_stock_alert,
       is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
       images, specifications, weight_grams, tags,
       is_active, created_by
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,$16,$17,$18,$19,$20,$21,true,$22
     )`,
    [
      categoryId, name, finalSlug,
      row.description ? String(row.description).trim() : null,
      sku,
      row.brand ? String(row.brand).trim() : null,
      mrp, buyingPrice, sellingPrice,
      condition,
      row.damage_description ? String(row.damage_description).trim() : null,
      row.defect_description ? String(row.defect_description).trim() : null,
      isNaN(stockQty) ? 0 : stockQty,
      isNaN(minStockAlert) ? 5 : minStockAlert,
      isB2b,
      b2bPrice,
      isNaN(b2bMinQty) ? 1 : b2bMinQty,
      JSON.stringify(productImages),
      JSON.stringify(specifications),
      isNaN(weightGrams as number) ? null : weightGrams,
      tagsRaw,
      adminId,
    ]
  );

  return { success: true };
}

export async function downloadTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { columns } = req.query;
    if (!columns) {
      const templatePath = path.join(__dirname, '../../../seeds/template.csv');
      if (!fs.existsSync(templatePath)) {
        res.status(404).json(error('Template file not found'));
        return;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="product-upload-template.csv"');
      fs.createReadStream(templatePath).pipe(res);
      return;
    }

    const headers = String(columns).split(',');
    const sampleValues: Record<string, string> = {
      name: 'Sample Product Name',
      sku: 'SKU-SAMPLE-101',
      category_slug: 'clothing',
      brand: 'Sample Brand',
      description: 'A premium sample product description.',
      mrp: '999.00',
      buying_price: '400.00',
      selling_price: '699.00',
      condition: 'new',
      damage_description: '',
      defect_description: '',
      stock_quantity: '50',
      minimum_stock_alert: '5',
      is_b2b_available: 'true',
      b2b_price: '599.00',
      b2b_minimum_quantity: '10',
      weight_grams: '250',
      tags: 'cotton;summer;casual',
      image_urls: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
      specifications: '{"size":"M","color":"Blue"}'
    };

    const rowValues = headers.map((h) => {
      if (sampleValues[h] !== undefined) {
        return `"${sampleValues[h].replace(/"/g, '""')}"`;
      }
      return '"Sample Value"';
    });

    const csvContent = [headers.join(','), rowValues.join(',')].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="product-upload-template.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('downloadTemplate error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json(error('No file uploaded'));
      return;
    }

    const filePath = req.file.path;
    const filename = req.file.originalname;
    const ext = path.extname(filename).toLowerCase();
    const adminId = req.admin?.id || null;

    let rows: RawRow[] = [];
    if (ext === '.csv') {
      rows = await parseCsvFile(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      rows = parseXlsxFile(filePath);
    } else {
      res.status(400).json(error('Unsupported file format. Use CSV or XLSX'));
      return;
    }

    const totalRows = rows.length;
    let successCount = 0;
    const errors: RowError[] = [];
    const categoryCache = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const result = await validateAndInsertRow(rows[i], i + 2, adminId, categoryCache);
      if (result.success) {
        successCount++;
      } else {
        errors.push({
          row: i + 2,
          sku: result.sku || 'N/A',
          message: result.error!
        });
      }
    }

    // Log to bulk_upload_logs
    await query(
      `INSERT INTO bulk_upload_logs (uploaded_by, filename, total_rows, success_count, error_count, errors)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, filename, totalRows, successCount, errors.length, JSON.stringify(errors)]
    );

    // Invalidate product cache
    if (successCount > 0) {
      await delCachePattern('products:list:*');
    }

    // Clean up uploaded file
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }

    res.json(success({ total_rows: totalRows, success_count: successCount, error_count: errors.length, errors }));
  } catch (err) {
    console.error('uploadFile error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getUploadHistory(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
    const offset = getOffset(page, limit);

    const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM bulk_upload_logs');
    const total = parseInt(countResult[0].count);

    const logs = await query<BulkUploadLog & { uploader_name: string | null; uploader_email: string | null }>(
      `SELECT b.*, a.name as uploader_name, a.email as uploader_email
       FROM bulk_upload_logs b
       LEFT JOIN admin_users a ON a.id = b.uploaded_by
       ORDER BY b.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const meta = getPaginationMeta(total, page, limit);
    res.json(success(logs, meta as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('getUploadHistory error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
