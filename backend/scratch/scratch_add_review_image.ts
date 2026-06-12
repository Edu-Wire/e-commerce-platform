import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query('ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);');
    console.log('Successfully added image_url column to product_reviews table');
  } catch (err) {
    console.error('Failed to add column:', err);
  } finally {
    await pool.end();
  }
}

run();
