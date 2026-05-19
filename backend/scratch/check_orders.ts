import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrders() {
  const client = await pool.connect();
  try {
    // 1. List all tables
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log('Tables in database:', tables.rows.map(r => r.table_name));

    // 2. Count rows in orders table if it exists
    const ordersCount = await client.query('SELECT COUNT(*) as count FROM orders');
    console.log('Number of orders in database:', ordersCount.rows[0].count);

    // 3. Select a sample order
    if (parseInt(ordersCount.rows[0].count) > 0) {
      const sample = await client.query('SELECT * FROM orders LIMIT 3');
      console.log('Sample orders:', JSON.stringify(sample.rows, null, 2));
    }
  } catch (err: any) {
    console.error('Error during DB inspection:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkOrders();
