import { query } from './config/database';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const result = await query<any>(
      `UPDATE auctions SET status = 'cancelled' WHERE status = 'active'`
    );
    console.log("CLEANED ACTIVE AUCTIONS:", result);
  } catch (err) {
    console.error(err);
  }
}
run().then(() => process.exit(0));
