import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query('SELECT items FROM orders ORDER BY id DESC LIMIT 1;');
    if (res.rows.length > 0) {
      console.log('Latest Order Items structure:', JSON.stringify(res.rows[0].items, null, 2));
    } else {
      console.log('No orders found in database.');
    }
  } catch (err) {
    console.error('Error fetching order items:', err);
  } finally {
    await pool.end();
  }
}

run();
