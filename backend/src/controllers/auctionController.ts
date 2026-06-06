import { Request, Response } from 'express';
import { query, queryOne } from '../config/database';
import { success, error } from '../utils/helpers';
import { processPlaceBid, BidError } from '../services/auctionBidService';
import { firstProductImage, parseOrderItems } from '../utils/orderHelpers';
import { syncMissingAuctionWinOrders } from '../services/auctionOrderService';

export async function getActiveAuction(req: Request, res: Response): Promise<void> {
  try {
    const customerId = (req as any).customer?.id || 0;
    
    const auctions = await query<any>(
      `SELECT p.id as product_id, p.name as product_name, p.images as product_images, p.selling_price as product_mrp, p.description as product_description,
              a.id as id, a.start_time, a.end_time, a.status, a.reserve_price, a.current_highest_bid, a.minimum_spread, a.quantity, a.highest_bidder_id,
              (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id)::int as total_bids,
              EXISTS(SELECT 1 FROM auction_bids WHERE auction_id = a.id AND customer_id = $1) as user_has_bid,
              (SELECT MAX(bid_amount) FROM auction_bids WHERE auction_id = a.id AND customer_id = $1) as user_highest_bid
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       WHERE a.status = 'active' 
         AND a.start_time <= NOW() 
         AND a.end_time > NOW()`,
       [customerId]
    );
    
    res.json(success(auctions));
  } catch (err) {
    console.error('getActiveAuction error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
export async function getUpcomingAuctions(req: Request, res: Response): Promise<void> {
  try {
    const auctions = await query<any>(
      `SELECT p.id as product_id, p.name as product_name, p.images as product_images, p.selling_price as product_mrp, p.description as product_description,
              a.id as id, a.start_time, a.end_time, a.status, a.reserve_price, a.current_highest_bid, a.minimum_spread, a.quantity, a.highest_bidder_id,
              0::int as total_bids
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       WHERE a.status = 'active' 
         AND a.start_time > NOW()
         AND a.start_time <= NOW() + INTERVAL '24 HOURS'
       ORDER BY a.start_time ASC`
    );
    res.json(success(auctions));
  } catch (err) {
    console.error('getUpcomingAuctions error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getQueuedAuctions(req: Request, res: Response): Promise<void> {
  try {
    const products = await query<any>(
      `SELECT id as product_id, name as product_name, images as product_images, selling_price as product_mrp, description as product_description, auction_priority
       FROM products
       WHERE is_auction_ready = true AND stock_quantity > 0
       ORDER BY auction_priority ASC, id ASC`
    );
    res.json(success(products));
  } catch (err) {
    console.error('getQueuedAuctions error:', err);
    res.status(500).json(error('Internal server error'));
  }
}


export async function placeBid(req: Request, res: Response): Promise<void> {
  try {
    const { auction_id, bid_amount } = req.body;
    const customer_id = req.customer?.id;

    if (!customer_id) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    const payload = await processPlaceBid(
      Number(auction_id),
      customer_id,
      parseFloat(bid_amount),
      req.app.get('io')
    );

    res.json(
      success({
        message: 'Bid placed successfully',
        ...payload,
      })
    );
  } catch (err: unknown) {
    if (err instanceof BidError) {
      res.status(err.statusCode).json(error(err.message));
      return;
    }
    console.error('placeBid error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getAuctionDetails(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const auction = await queryOne<any>(
      `SELECT a.*, p.name as product_name, p.images as product_images, p.selling_price as product_mrp, p.description as product_description,
              (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id)::int as total_bids
       FROM auctions a 
       JOIN products p ON a.product_id = p.id 
       WHERE a.id = $1`,
      [id]
    );
    
    if (!auction) {
      res.status(404).json(error('Auction not found'));
      return;
    }
    
    const bids = await query<any>(
      `SELECT b.*, c.name as customer_name 
       FROM auction_bids b
       JOIN customers c ON b.customer_id = c.id
       WHERE b.auction_id = $1
       ORDER BY b.created_at DESC`,
      [id]
    );
    
    res.json(success({ ...auction, bids }));
  } catch (err) {
    console.error('getAuctionDetails error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  try {
    const activities = await query<any>(`
      SELECT 
        b.id::text as id,
        'new_bid' as type,
        p.name as product_name,
        b.bid_amount as amount,
        b.customer_id as bidder_id,
        c.name as bidder_name,
        (
          SELECT customer_id 
          FROM auction_bids b2 
          WHERE b2.auction_id = b.auction_id 
            AND b2.created_at < b.created_at 
          ORDER BY b2.created_at DESC 
          LIMIT 1
        ) as previous_bidder_id,
        b.created_at as timestamp
      FROM auction_bids b
      JOIN auctions a ON b.auction_id = a.id
      JOIN products p ON a.product_id = p.id
      JOIN customers c ON b.customer_id = c.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);
    res.json(success(activities));
  } catch (err) {
    console.error('getRecentActivity error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getMyBids(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    const bids = await query<any>(
      `SELECT p.id as product_id, p.name as product_name, p.images as product_images,
              p.selling_price as product_mrp, p.description as product_description,
              a.id, a.start_time, a.end_time, a.status, a.reserve_price,
              a.current_highest_bid, a.minimum_spread, a.quantity, a.highest_bidder_id,
              (SELECT COUNT(*)::int FROM auction_bids WHERE auction_id = a.id) as total_bids,
              (SELECT MAX(bid_amount) FROM auction_bids WHERE auction_id = a.id AND customer_id = $1) as user_highest_bid
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       WHERE a.status = 'active'
         AND a.start_time <= NOW()
         AND a.end_time > NOW()
         AND EXISTS (
           SELECT 1 FROM auction_bids b
           WHERE b.auction_id = a.id AND b.customer_id = $1
         )
       ORDER BY
         CASE WHEN a.highest_bidder_id = $1 THEN 0 ELSE 1 END,
         a.end_time ASC`,
      [customerId]
    );

    res.json(success(bids));
  } catch (err) {
    console.error('getMyBids error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

const winningSelect = `
  p.id as product_id, p.name as product_name, p.images as product_images,
  p.selling_price as product_mrp, p.description as product_description,
  a.id, a.start_time, a.end_time, a.status, a.reserve_price,
  a.current_highest_bid, a.minimum_spread, a.quantity, a.highest_bidder_id,
  (SELECT COUNT(*)::int FROM auction_bids WHERE auction_id = a.id) as total_bids
`;

export async function getWinningDashboard(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    await syncMissingAuctionWinOrders(customerId);

    const liveWinning = await query<any>(
      `SELECT ${winningSelect},
              (SELECT MAX(bid_amount) FROM auction_bids WHERE auction_id = a.id AND customer_id = $1) as user_highest_bid
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       WHERE a.status = 'active'
         AND a.end_time > NOW()
         AND a.start_time <= NOW()
         AND a.highest_bidder_id = $1
       ORDER BY a.end_time ASC`,
      [customerId]
    );

    const won = await query<any>(
      `SELECT ${winningSelect},
              ord.id as order_id,
              ord.status as order_status,
              ord.created_at as order_created_at,
              ord.total_selling_price as order_total
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       LEFT JOIN LATERAL (
         SELECT o.id, o.status, o.created_at, o.total_selling_price
         FROM orders o
         WHERE o.customer_id = $1
           AND o.notes = 'AUCTION_WIN'
           AND EXISTS (
             SELECT 1 FROM jsonb_array_elements(o.items) AS item
             WHERE (item->>'product_id')::int = p.id
           )
         ORDER BY o.created_at DESC
         LIMIT 1
       ) ord ON true
       WHERE a.status = 'completed' AND a.highest_bidder_id = $1
       ORDER BY a.end_time DESC`,
      [customerId]
    );

    const stats = {
      live_count: liveWinning.length,
      won_count: won.length,
      pending_payment: won.filter((w: { order_status?: string }) => !w.order_status || w.order_status === 'pending').length,
      shipped: won.filter((w: { order_status?: string }) =>
        w.order_status === 'shipped' || w.order_status === 'delivered'
      ).length,
      total_won_value: won.reduce(
        (sum: number, w: { current_highest_bid?: string }) =>
          sum + parseFloat(w.current_highest_bid || '0'),
        0
      ),
      total_savings: won.reduce(
        (sum: number, w: { product_mrp?: string; current_highest_bid?: string }) =>
          sum + Math.max(0, parseFloat(w.product_mrp || '0') - parseFloat(w.current_highest_bid || '0')),
        0
      ),
    };

    res.json(success({ live_winning: liveWinning, won, stats }));
  } catch (err) {
    console.error('getWinningDashboard error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

const PAYMENT_WINDOW_MS = 6 * 60 * 60 * 1000;

export async function getPendingPayments(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    await syncMissingAuctionWinOrders(customerId);

    const rows = await query<{
      id: number;
      status: string;
      created_at: string;
      total_selling_price: string;
      total_mrp: string;
      items: unknown;
      product_id: number | null;
      product_name: string | null;
      product_images: unknown;
      auction_id: number | null;
      auction_end_time: string | null;
    }>(
      `SELECT o.id, o.status, o.created_at, o.total_selling_price, o.total_mrp, o.items,
              p.id AS product_id, p.name AS product_name, p.images AS product_images,
              a.id AS auction_id, a.end_time AS auction_end_time
       FROM orders o
       LEFT JOIN LATERAL (
         SELECT (elem->>'product_id')::int AS pid
         FROM jsonb_array_elements(o.items) AS elem
         LIMIT 1
       ) item ON true
       LEFT JOIN products p ON p.id = item.pid
       LEFT JOIN LATERAL (
         SELECT au.id, au.end_time
         FROM auctions au
         WHERE au.product_id = p.id
           AND au.status = 'completed'
           AND au.highest_bidder_id = o.customer_id
         ORDER BY au.end_time DESC
         LIMIT 1
       ) a ON true
       WHERE o.customer_id = $1
         AND o.notes = 'AUCTION_WIN'
         AND o.status = 'pending'
         AND COALESCE(a.end_time, o.created_at) >= NOW() - INTERVAL '6 hours'
       ORDER BY COALESCE(a.end_time, o.created_at) ASC`,
      [customerId]
    );

    const payments = rows.map((row) => {
      const items = parseOrderItems(row.items);
      const first = items[0];
      const amount = parseFloat(row.total_selling_price || '0');
      const windowStart = row.auction_end_time
        ? new Date(row.auction_end_time).getTime()
        : new Date(row.created_at).getTime();
      const expiresAt = new Date(windowStart + PAYMENT_WINDOW_MS).toISOString();

      return {
        id: row.id,
        auction_id: row.auction_id,
        order_number: String(row.id),
        total_amount: amount,
        created_at: row.created_at,
        expires_at: expiresAt,
        is_expired: Date.now() > windowStart + PAYMENT_WINDOW_MS,
        items: [
          {
            product_id: first?.product_id ?? row.product_id,
            product_name: row.product_name || first?.name || 'Auction Item',
            product_image: firstProductImage(row.product_images),
            unit_price: first?.selling_price ?? amount,
            quantity: first?.quantity ?? 1,
          },
        ],
      };
    });

    res.json(success(payments));
  } catch (err) {
    console.error('getPendingPayments error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getWonAuctions(req: Request, res: Response): Promise<void> {
  try {
    const customerId = (req as any).customer?.id;
    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    const wonAuctions = await query<any>(
      `SELECT ${winningSelect}
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       WHERE a.status = 'completed' AND a.highest_bidder_id = $1
       ORDER BY a.end_time DESC`,
      [customerId]
    );

    res.json(success(wonAuctions));
  } catch (err) {
    console.error('getWonAuctions error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getOutbidOffers(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer?.id;
    if (!customerId) {
      res.status(401).json(error('Unauthorized'));
      return;
    }

    const offers = await query<any>(
      `SELECT p.id as product_id, p.name as product_name, p.images as product_images,
              p.selling_price as product_mrp, p.description as product_description,
              a.id, a.start_time, a.end_time, a.status, a.reserve_price,
              a.current_highest_bid, a.minimum_spread, a.quantity, a.highest_bidder_id,
              a.outbid_purchase_markup_percent,
              (SELECT COUNT(*)::int FROM auction_bids WHERE auction_id = a.id) as total_bids
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       WHERE a.status = 'completed'
         AND a.highest_bidder_id != $1
         AND EXISTS (
           SELECT 1 FROM auction_bids b
           WHERE b.auction_id = a.id AND b.customer_id = $1
         )
         AND NOT EXISTS (
           SELECT 1 
           FROM orders o,
                jsonb_array_elements(o.items) AS elem
           WHERE o.customer_id = $1
             AND (elem->>'auction_id')::int = a.id
         )
       ORDER BY a.end_time DESC`,
      [customerId]
    );

    res.json(success(offers));
  } catch (err) {
    console.error('getOutbidOffers error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

