import { query } from './config/database';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Listing queued products...");
  const res = await query<any>(`
    SELECT id, name, is_auction_ready, auction_priority
    FROM products
    WHERE is_auction_ready = true
    ORDER BY auction_priority DESC, id ASC
  `);
  console.table(res);
}

main().then(() => process.exit(0)).catch(console.error);
