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
const REQUIRED_FIELDS = ['name', 'sku', 'category_slug', 'mrp', 'buying_price', 'selling_price', 'condition'];

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
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || String(row[field]).trim() === '') {
      return { success: false, error: `Missing required field: ${field}`, sku: row.sku };
    }
  }

  const name = String(row.name).trim();
  const sku = String(row.sku).trim();
  const categorySlug = String(row.category_slug).trim();
  const mrp = parseFloat(String(row.mrp));
  const buyingPrice = parseFloat(String(row.buying_price));
  const sellingPrice = parseFloat(String(row.selling_price));
  const condition = String(row.condition).trim();

  if (isNaN(mrp) || mrp <= 0) return { success: false, error: 'mrp must be a positive number' };
  if (isNaN(buyingPrice) || buyingPrice <= 0) return { success: false, error: 'buying_price must be a positive number' };
  if (isNaN(sellingPrice) || sellingPrice <= 0) return { success: false, error: 'selling_price must be a positive number' };
  if (sellingPrice > mrp) return { success: false, error: 'selling_price cannot exceed mrp' };
  if (!VALID_CONDITIONS.includes(condition)) {
    return { success: false, error: `condition must be one of: ${VALID_CONDITIONS.join(', ')}` };
  }

  // Resolve category
  let categoryId = categoryCache.get(categorySlug);
  if (categoryId === undefined) {
    const cat = await queryOne<{ id: number }>('SELECT id FROM categories WHERE slug = $1', [categorySlug]);
    if (!cat) return { success: false, error: `Category with slug "${categorySlug}" not found` };
    categoryId = cat.id;
    categoryCache.set(categorySlug, categoryId);
  }

  // Check SKU uniqueness
  const skuExists = await queryOne('SELECT id FROM products WHERE sku = $1', [sku]);
  if (skuExists) return { success: false, error: `SKU "${sku}" already exists`, sku };

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

  let specifications: Record<string, unknown> = {};
  if (row.specifications) {
    try {
      specifications = JSON.parse(String(row.specifications));
    } catch {
      // ignore parse errors
    }
  }

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
    const templatePath = path.join(__dirname, '../../../seeds/template.csv');
    if (!fs.existsSync(templatePath)) {
      res.status(404).json(error('Template file not found'));
      return;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="product-upload-template.csv"');
    fs.createReadStream(templatePath).pipe(res);
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
