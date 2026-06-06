import { query } from './config/database';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const auctions = await query<any>(
      `SELECT * FROM auctions ORDER BY id DESC LIMIT 10`
    );
    console.log("RECENT AUCTIONS:", JSON.stringify(auctions, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run().then(() => process.exit(0));
