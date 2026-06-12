import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query('ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS product_reviews_product_id_customer_id_key;');
    console.log('Successfully dropped unique constraint on product_id and customer_id');
  } catch (err) {
    console.error('Failed to drop constraint:', err);
  } finally {
    await pool.end();
  }
}

run();
