const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ecom'
});

// Mock database query functions
const query = async (text, params) => {
  const res = await client.query(text, params);
  return res.rows;
};

const queryOne = async (text, params) => {
  const res = await client.query(text, params);
  return res.rows[0];
};

function parseOrderItems(items) {
  if (typeof items === 'string') {
    return JSON.parse(items);
  }
  return items;
}

async function enrichOrderForCustomer(order) {
  const items = parseOrderItems(order.items);
  const enrichedItems = [];
  for (const item of items) {
    const product = await queryOne(
      'SELECT slug, images FROM products WHERE id = $1',
      [item.product_id]
    );
    let firstImage = null;
    if (product?.images) {
      const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        const first = parsedImages[0];
        if (first && typeof first === 'object' && 'url' in first) {
          firstImage = first.url;
        } else if (typeof first === 'string') {
          firstImage = first;
        }
      } else if (typeof parsedImages === 'string') {
        firstImage = parsedImages;
      }
    }
    enrichedItems.push({
      id: item.product_id,
      product_id: item.product_id,
      sku: item.sku || '',
      product_name: item.name || 'Product',
      product_slug: product?.slug || '',
      product_image: firstImage,
      quantity: item.quantity ?? 1,
      unit_price: parseFloat(String(item.selling_price || 0)),
      mrp: parseFloat(String(item.mrp || 0)),
    });
  }

  return {
    ...order,
    order_number: String(order.id),
    total_amount: parseFloat(String(order.total_selling_price ?? 0)),
    subtotal_mrp: parseFloat(String(order.total_mrp ?? 0)),
    subtotal_price: parseFloat(String(order.total_selling_price ?? 0)),
    discount_amount: parseFloat(String(order.total_savings ?? 0)),
    shipping_charge: 0,
    payment_status: order.status === 'pending' ? 'pending' : 'paid',
    items: enrichedItems,
  };
}

async function main() {
  await client.connect();
  const order = await queryOne('SELECT * FROM orders WHERE id = 124');
  if (!order) {
    console.log('Order 124 not found');
  } else {
    const enriched = await enrichOrderForCustomer(order);
    console.log('Enriched items:', JSON.stringify(enriched.items, null, 2));
  }
  await client.end();
}

main().catch(console.error);
