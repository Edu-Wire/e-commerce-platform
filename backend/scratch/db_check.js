const { Client } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_Be9NIpbw1PWh@ep-odd-king-aptbksxo.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' });

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

client.connect()
  .then(async () => {
    console.log('Fetching category IDs...');
    const catRes = await client.query('SELECT id, slug FROM categories');
    const catMap = {};
    catRes.rows.forEach(r => {
      catMap[r.slug] = r.id;
    });
    console.log('Available categories in DB:', catMap);

    const rows = [];
    fs.createReadStream(path.join(__dirname, 'test_upload.csv'))
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', async () => {
        console.log(`Parsed ${rows.length} rows. Starting insert...`);
        for (const row of rows) {
          const categorySlug = (row.category_slug || 'household').trim().toLowerCase();
          const categoryId = catMap[categorySlug];
          if (!categoryId) {
            console.error(`Category slug "${categorySlug}" not found! Row:`, row.name);
            continue;
          }

          const name = row.name.trim();
          const slug = slugify(name);
          const mrp = parseFloat(row.mrp);
          const buyingPrice = parseFloat(row.buying_price);
          const sellingPrice = parseFloat(row.selling_price);
          const condition = row.condition || 'new';
          const stockQty = parseInt(row.stock_quantity) || 0;
          const minStockAlert = parseInt(row.minimum_stock_alert) || 5;
          const isB2b = String(row.is_b2b_available).toLowerCase() === 'true';
          const b2bPrice = row.b2b_price ? parseFloat(row.b2b_price) : null;
          const b2bMinQty = parseInt(row.b2b_minimum_quantity) || 1;
          const weightGrams = row.weight_grams ? parseInt(row.weight_grams) : null;
          const tagsRaw = row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : [];
          
          const imageUrls = row.image_urls ? row.image_urls.split(';').map(url => url.trim()).filter(Boolean) : [];
          const productImages = imageUrls.map((url, idx) => ({
            url,
            is_primary: idx === 0,
            sort_order: idx
          }));

          let specifications = {};
          if (row.specifications) {
            try {
              specifications = JSON.parse(row.specifications);
            } catch (e) {
              specifications = {};
            }
          }

          const queryText = `
            INSERT INTO products (
              category_id, name, slug, description, sku, brand,
              mrp, buying_price, selling_price,
              condition, damage_description, defect_description,
              stock_quantity, minimum_stock_alert,
              is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
              images, specifications, weight_grams, tags,
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, $17, $18, $19, $20, $21, true)
          `;

          const values = [
            categoryId, name, slug,
            row.description ? row.description.trim() : null,
            row.sku.trim(),
            row.brand ? row.brand.trim() : null,
            mrp, buyingPrice, sellingPrice,
            condition,
            row.damage_description ? row.damage_description.trim() : null,
            row.defect_description ? row.defect_description.trim() : null,
            stockQty, minStockAlert,
            isB2b,
            b2bPrice, b2bMinQty,
            JSON.stringify(productImages),
            JSON.stringify(specifications),
            weightGrams, tagsRaw
          ];

          await client.query(queryText, values);
          console.log(`Inserted product: ${name}`);
        }
        console.log('All products successfully inserted!');
        client.end();
      });
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
