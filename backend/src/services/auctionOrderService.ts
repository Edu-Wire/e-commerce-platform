import { PoolClient } from 'pg';
import { query, withTransaction } from '../config/database';

/** Create pending AUCTION_WIN orders for completed wins that never got an order (e.g. scheduler missed). */
export async function syncMissingAuctionWinOrders(customerId: number): Promise<number> {
  return withTransaction(async (client: PoolClient) => {
    const missing = await client.query<{
      auction_id: number;
      product_id: number;
      current_highest_bid: string;
      sku: string;
      name: string;
      mrp: string;
      customer_type: string;
    }>(
      `SELECT a.id AS auction_id, a.product_id, a.current_highest_bid,
              p.sku, p.name, p.mrp, c.customer_type
       FROM auctions a
       JOIN products p ON p.id = a.product_id
       JOIN customers c ON c.id = a.highest_bidder_id
       WHERE a.status = 'completed'
         AND a.highest_bidder_id = $1
         AND a.end_time >= NOW() - INTERVAL '6 hours'
         AND NOT EXISTS (
           SELECT 1 FROM orders o
           WHERE o.customer_id = $1
             AND o.notes = 'AUCTION_WIN'
             AND o.status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered')
             AND EXISTS (
               SELECT 1 FROM jsonb_array_elements(o.items) AS elem
               WHERE (elem->>'product_id')::int = a.product_id
             )
         )`,
      [customerId]
    );

    let created = 0;
    for (const row of missing.rows) {
      const unitPrice = parseFloat(row.current_highest_bid);
      if (!unitPrice || unitPrice <= 0) continue;

      const items = [
        {
          product_id: row.product_id,
          sku: row.sku,
          name: row.name,
          quantity: 1,
          mrp: parseFloat(row.mrp),
          selling_price: unitPrice,
        },
      ];

      await client.query(
        `INSERT INTO orders (customer_id, order_type, status, total_mrp, total_selling_price, total_savings, items, notes)
         VALUES ($1, $2, 'pending', $3, $4, $5, $6, 'AUCTION_WIN')`,
        [
          customerId,
          row.customer_type,
          parseFloat(row.mrp),
          unitPrice,
          parseFloat(row.mrp) - unitPrice,
          JSON.stringify(items),
        ]
      );
      created += 1;
      console.log(
        `[Auction] Backfilled pending order for customer ${customerId}, auction ${row.auction_id}`
      );
    }

    return created;
  });
}

/** Global backfill for scheduler gaps (optional, called sparingly). */
export async function syncAllMissingAuctionWinOrders(): Promise<number> {
  const rows = await query<{ customer_id: number }>(
    `SELECT DISTINCT a.highest_bidder_id AS customer_id
     FROM auctions a
     WHERE a.status = 'completed'
       AND a.highest_bidder_id IS NOT NULL
       AND a.end_time >= NOW() - INTERVAL '6 hours'`
  );

  let total = 0;
  for (const { customer_id } of rows) {
    total += await syncMissingAuctionWinOrders(customer_id);
  }
  return total;
}
