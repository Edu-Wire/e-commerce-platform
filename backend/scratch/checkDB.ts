import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, name, images FROM products WHERE name ILIKE '%Marks & Spencer%' LIMIT 1");
    if (res.rows.length === 0) {
      console.log('Product not found');
    } else {
      console.log('Product:', res.rows[0].name);
      console.log('Images Column Type:', typeof res.rows[0].images);
      console.log('Images Data:', JSON.stringify(res.rows[0].images, null, 2));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

check();
