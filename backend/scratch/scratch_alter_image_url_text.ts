import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query('ALTER TABLE product_reviews ALTER COLUMN image_url TYPE TEXT;');
    console.log('Successfully altered image_url column type to TEXT');
  } catch (err) {
    console.error('Failed to alter column type:', err);
  } finally {
    await pool.end();
  }
}

run();
