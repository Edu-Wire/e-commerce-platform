import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkLogs() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT * FROM bulk_upload_logs ORDER BY created_at DESC LIMIT 5"
    );
    console.log('Latest Bulk Upload Logs:');
    res.rows.forEach(r => {
      console.log(`- ID: ${r.id}, Status: ${r.status}, Success: ${r.success_count}, Failed: ${r.failed_count}`);
      if (r.errors && r.errors.length > 0) {
        console.log(`  Errors: ${JSON.stringify(r.errors.slice(0, 2))}`);
      }
    });
  } finally {
    client.release();
    await pool.end();
  }
}

checkLogs();
