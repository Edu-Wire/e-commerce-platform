import type { BidUpdatePayload } from './auctionSocket';

export function applyBidToAuctionList<T extends {
  id: number | null;
  current_highest_bid?: string | null;
  total_bids?: number | null;
  highest_bidder_id?: number | null;
  user_has_bid?: boolean;
  user_highest_bid?: string | null;
}>(auctions: T[], data: BidUpdatePayload, customerId?: number): T[] {
  return auctions.map((a) => {
    if (a.id !== data.auction_id) return a;
    const isMe = customerId != null && data.highest_bidder_id === customerId;
    return {
      ...a,
      current_highest_bid: String(data.current_highest_bid),
      total_bids: data.total_bids,
      highest_bidder_id: data.highest_bidder_id,
      user_has_bid: Boolean(a.user_has_bid || isMe),
      user_highest_bid: isMe ? String(data.current_highest_bid) : a.user_highest_bid,
    };
  });
}

export function applyBidToAuctionDetail<
  T extends {
    id: number;
    current_highest_bid: string | null;
    highest_bidder_id: number | null;
    total_bids?: number;
    bids: Array<{ id: number; customer_id: number; customer_name: string; bid_amount: string; created_at: string }>;
  },
>(auction: T, data: BidUpdatePayload): T {
  const bidExists = auction.bids.some((b) => b.id === data.bid.id);
  return {
    ...auction,
    current_highest_bid: String(data.current_highest_bid),
    highest_bidder_id: data.highest_bidder_id,
    total_bids: data.total_bids,
    bids: bidExists ? auction.bids : [data.bid, ...auction.bids],
  };
}
