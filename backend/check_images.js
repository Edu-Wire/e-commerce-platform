const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ecom'
});

async function main() {
  await client.connect();
  console.log('Connected to DB!');
  
  const res = await client.query('SELECT id, name, images FROM products WHERE id IN (406, 123) OR id IN (SELECT (json_array_elements(items::json)::json->>\'product_id\')::int FROM orders LIMIT 5)');
  console.log(JSON.stringify(res.rows, null, 2));
  
  const orders = await client.query('SELECT id, items FROM orders LIMIT 2');
  console.log('Orders:', JSON.stringify(orders.rows, null, 2));

  await client.end();
}

main().catch(console.error);
