import type { Server } from 'socket.io';
import { query, queryOne } from '../config/database';

export class BidError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BidError';
  }
}

export interface BidUpdatePayload {
  auction_id: number;
  product_id?: number;
  product_name?: string;
  current_highest_bid: number;
  highest_bidder_id: number;
  total_bids: number;
  minimum_spread: number;
  bid: {
    id: number;
    customer_id: number;
    customer_name: string;
    bid_amount: string;
    created_at: string;
  };
}

export async function processPlaceBid(
  auctionId: number,
  customerId: number,
  bidAmount: number,
  io?: Server
): Promise<BidUpdatePayload> {
  const auction = await queryOne<any>(
    `SELECT * FROM auctions 
     WHERE id = $1 
       AND status = 'active'
       AND start_time <= NOW()
       AND end_time > NOW()`,
    [auctionId]
  );

  if (!auction) {
    throw new BidError('No active auction found at this time', 404);
  }

  if (auction.highest_bidder_id === customerId) {
    throw new BidError('You cannot outbid yourself. Wait for someone else to bid.');
  }

  const currentBid = parseFloat(auction.current_highest_bid || auction.reserve_price);
  const minSpread = parseFloat(auction.minimum_spread || '1');
  const newBid = bidAmount;
  console.log(newBid, currentBid, minSpread,"TEST");

  if (newBid < currentBid + minSpread) {
    throw new BidError(`Bid must be at least ₹${(currentBid + minSpread).toFixed(2)}`);
  }

  await query(
    `UPDATE auctions SET current_highest_bid = $1, highest_bidder_id = $2 WHERE id = $3`,
    [newBid, customerId, auctionId]
  );

  const bidRow = await queryOne<{
    id: number;
    bid_amount: string;
    created_at: string;
    customer_name: string;
  }>(
    `INSERT INTO auction_bids (auction_id, customer_id, bid_amount)
     VALUES ($1, $2, $3)
     RETURNING id, bid_amount, created_at,
       (SELECT name FROM customers WHERE id = $2) AS customer_name`,
    [auctionId, customerId, newBid]
  );

  const bidCountRes = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM auction_bids WHERE auction_id = $1`,
    [auctionId]
  );

  const meta = await queryOne<{ product_id: number; product_name: string }>(
    `SELECT p.id AS product_id, p.name AS product_name
     FROM auctions a JOIN products p ON p.id = a.product_id WHERE a.id = $1`,
    [auctionId]
  );

  const payload: BidUpdatePayload = {
    auction_id: auctionId,
    product_id: meta?.product_id,
    product_name: meta?.product_name,
    current_highest_bid: newBid,
    highest_bidder_id: customerId,
    total_bids: parseInt(bidCountRes?.count || '0', 10),
    minimum_spread: minSpread,
    bid: {
      id: bidRow!.id,
      customer_id: customerId,
      customer_name: bidRow!.customer_name,
      bid_amount: String(bidRow!.bid_amount),
      created_at: bidRow!.created_at,
    },
  };

  if (io) {
    broadcastBidUpdate(io, payload, auction.highest_bidder_id);
  }

  return payload;
}

export function broadcastBidUpdate(
  io: Server,
  payload: BidUpdatePayload,
  previousBidderId?: number | null
): void {
  io.to(`auction:${payload.auction_id}`).emit('bid_update', payload);
  io.to('live_auctions').emit('bid_update', payload);

  io.emit('global_activity', {
    type: 'new_bid',
    product_name: payload.product_name,
    bidder_name: payload.bid.customer_name,
    amount: payload.current_highest_bid,
    bidder_id: payload.highest_bidder_id,
    previous_bidder_id: previousBidderId ?? null,
    auction_id: payload.auction_id,
    timestamp: payload.bid.created_at,
  });
}
