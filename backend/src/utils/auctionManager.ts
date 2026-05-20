import { withTransaction } from '../config/database';
import { PoolClient } from 'pg';
import { sendOutbidPurchaseOffer, sendAuctionWinnerNotification } from '../services/emailService';
import { env } from '../config/env';

export async function checkAndRotateAuctions() {
  try {
    await withTransaction(async (client: PoolClient) => {
      // 1. Check for active auctions
      const activeAuctionsRes = await client.query(
        "SELECT * FROM auctions WHERE status = 'active' FOR UPDATE"
      );
      const activeAuctions = activeAuctionsRes.rows;

      const now = new Date();

      for (const activeAuction of activeAuctions) {
        const endTime = new Date(activeAuction.end_time);

        if (now >= endTime) {
          console.log(`[Auction] Auction ${activeAuction.id} expired. Processing...`);

          // Update status to completed
          await client.query(
            "UPDATE auctions SET status = 'completed' WHERE id = $1",
            [activeAuction.id]
          );

          // If there was a winner, reduce stock and create an order
          if (activeAuction.highest_bidder_id) {
            await client.query(
              "UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = $1",
              [activeAuction.product_id]
            );
            console.log(`[Auction] Product ${activeAuction.product_id} stock reduced by 1.`);
            
            // Fetch product and customer details to create the order
            const productRes = await client.query("SELECT * FROM products WHERE id = $1", [activeAuction.product_id]);
            const customerRes = await client.query("SELECT * FROM customers WHERE id = $1", [activeAuction.highest_bidder_id]);
            
            if (productRes.rows[0] && customerRes.rows[0]) {
              const product = productRes.rows[0];
              const customer = customerRes.rows[0];
              const unitPrice = parseFloat(activeAuction.current_highest_bid);
              
              const items = [{
                product_id: product.id,
                sku: product.sku,
                name: product.name,
                quantity: 1,
                mrp: product.mrp,
                selling_price: unitPrice
              }];
              
              await client.query(
                `INSERT INTO orders (customer_id, order_type, status, total_mrp, total_selling_price, total_savings, items, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                  customer.id,
                  customer.customer_type,
                  'pending',
                  product.mrp,
                  unitPrice,
                  product.mrp - unitPrice,
                  JSON.stringify(items),
                  'AUCTION_WIN'
                ]
              );
              console.log(`[Auction] Order created for winner ${customer.id}`);

              const auctionUrl = `${env.frontendCustomerUrl.replace(/\/$/, '')}/live-auction/${activeAuction.id}`;

              // Send email to the winner
              if (customer.email) {
                try {
                  await sendAuctionWinnerNotification(
                    customer.email,
                    customer.name || 'Customer',
                    product.name,
                    unitPrice,
                    auctionUrl
                  );
                  console.log(`[Auction] Sent winner notification to customer ${customer.id} for auction ${activeAuction.id}`);
                } catch (sendErr) {
                  console.error(`[Auction] Failed to send winner notification to customer ${customer.id}:`, sendErr);
                }
              }

              const quantityLimit = parseInt(activeAuction.quantity ?? '1', 10) || 1;
              const markupPercent = activeAuction.outbid_purchase_markup_percent !== null && activeAuction.outbid_purchase_markup_percent !== undefined
                ? parseFloat(activeAuction.outbid_purchase_markup_percent)
                : 50;
              const offerPrice = Math.round(unitPrice * (1 + markupPercent / 100));

              const losingBiddersRes = await client.query(
                `SELECT b.customer_id,
                        MAX(b.bid_amount)::numeric AS max_bid,
                        c.email,
                        c.name
                 FROM auction_bids b
                 JOIN customers c ON c.id = b.customer_id
                 WHERE b.auction_id = $1
                   AND b.customer_id != $2
                 GROUP BY b.customer_id, c.email, c.name
                 ORDER BY MAX(b.bid_amount) DESC
                 LIMIT $3`,
                [activeAuction.id, activeAuction.highest_bidder_id, quantityLimit]
              );

              for (const loser of losingBiddersRes.rows) {
                if (!loser.email) continue;
                try {
                  await sendOutbidPurchaseOffer(
                    loser.email,
                    loser.name || 'Customer',
                    product.name,
                    offerPrice,
                    auctionUrl
                  );
                  console.log(`[Auction] Sent second-chance offer to customer ${loser.customer_id} for auction ${activeAuction.id}`);
                } catch (sendErr) {
                  console.error(`[Auction] Failed to send second-chance offer to customer ${loser.customer_id}:`, sendErr);
                }
              }
            }
          }
        }
      }

      // 2. Cancel unpaid auction orders older than 6 hours
      const expiredOrdersRes = await client.query(
        `SELECT id, items FROM orders 
         WHERE status = 'pending' 
           AND notes = 'AUCTION_WIN' 
           AND created_at < NOW() - INTERVAL '6 hours' FOR UPDATE`
      );
      
      for (const order of expiredOrdersRes.rows) {
        // Cancel the order
        await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.id]);
        
        // Restore stock
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        for (const item of items) {
          if (item.product_id && item.quantity) {
            await client.query(
              "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
              [item.quantity, item.product_id]
            );
          }
        }
        console.log(`[Auction] Expired unpaid auction order ${order.id} cancelled. Stock restored.`);
      }

      // Check if we need to start the next auction from queue
      // Only if no auctions are active now
      const stillActiveRes = await client.query(
        "SELECT COUNT(*) FROM auctions WHERE status = 'active'"
      );
      const stillActive = parseInt(stillActiveRes.rows[0].count, 10);

      if (stillActive === 0) {
        await startNextAuction(client);
      }
    });
  } catch (error) {
    console.error('[Auction Error] Failed to rotate auctions:', error);
  }
}

async function startNextAuction(client: PoolClient) {
  // Read duration setting
  const settingRes = await client.query(
    "SELECT value FROM system_settings WHERE key = 'auction_duration_minutes'"
  );
  const durationMinutes = parseInt(settingRes.rows[0]?.value || '60', 10);

  // Check if there is any scheduled/upcoming non-cancelled auction in the future
  const nextScheduledRes = await client.query(
    `SELECT start_time FROM auctions 
     WHERE status != 'cancelled' AND start_time > NOW() 
     ORDER BY start_time ASC LIMIT 1`
  );
  const nextScheduled = nextScheduledRes.rows[0];

  let calculatedDurationMinutes = durationMinutes;
  if (nextScheduled) {
    const nextStart = new Date(nextScheduled.start_time);
    const now = new Date();
    const diffMs = nextStart.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes <= 1) {
      console.log('[Auction] Next scheduled auction starts too soon. Skipping queue start.');
      return;
    }
    if (diffMinutes < calculatedDurationMinutes) {
      calculatedDurationMinutes = diffMinutes;
      console.log(`[Auction] Capped rotated auction duration to ${calculatedDurationMinutes} minutes to avoid overlap with scheduled auction at ${nextStart.toISOString()}.`);
    }
  }

  // Find the next product marked for auction with stock > 0
  const nextProductRes = await client.query(
    `SELECT id FROM products 
     WHERE is_auction_ready = true AND stock_quantity > 0 
     ORDER BY auction_priority ASC, id ASC 
     LIMIT 1 FOR UPDATE`
  );
  const nextProduct = nextProductRes.rows[0];

  if (nextProduct) {
    console.log(`[Auction] Starting new auction for Product ID: ${nextProduct.id} for ${calculatedDurationMinutes} minutes.`);

    // Create new auction with dynamic duration
    await client.query(
      `INSERT INTO auctions (product_id, start_time, end_time, status) 
       VALUES ($1, NOW(), NOW() + ($2 || ' minutes')::interval, 'active')`,
      [nextProduct.id, calculatedDurationMinutes]
    );

    // Mark the product as no longer ready
    await client.query(
      "UPDATE products SET is_auction_ready = false WHERE id = $1",
      [nextProduct.id]
    );
  } else {
    console.log('[Auction] No products available in queue for auction.');
  }
}
