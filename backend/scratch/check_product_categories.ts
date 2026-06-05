import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT DISTINCT p.category_id, c.name, c.slug 
      FROM products p 
      JOIN categories c ON c.id = p.category_id
    `);
    console.log('Distinct Categories of products:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
