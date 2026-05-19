import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testSearch() {
  const client = await pool.connect();
  try {
    const search = 'Sample';
    const res = await client.query(
      "SELECT id, name, sku FROM products WHERE name ILIKE $1 OR sku ILIKE $1",
      [`%${search}%`]
    );
    console.log(`Found ${res.rows.length} products for search "${search}":`);
    res.rows.forEach(r => console.log(`- ${r.name} (${r.sku})`));
  } finally {
    client.release();
    await pool.end();
  }
}

testSearch();
