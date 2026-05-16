import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:4000';

export interface BidUpdatePayload {
  auction_id: number;
  product_id?: number;
  product_name?: string;
  current_highest_bid: number;
  highest_bidder_id: number;
  total_bids: number;
  minimum_spread?: number;
  bid: {
    id: number;
    customer_id: number;
    customer_name: string;
    bid_amount: string;
    created_at: string;
  };
}

type BidUpdateHandler = (data: BidUpdatePayload) => void;
type GlobalActivityHandler = (data: Record<string, unknown>) => void;
type BidSuccessHandler = (data: { message?: string }) => void;
type BidErrorHandler = (data: { error?: string }) => void;

let socket: Socket | null = null;
let refCount = 0;

const bidUpdateHandlers = new Set<BidUpdateHandler>();
const globalActivityHandlers = new Set<GlobalActivityHandler>();
const bidSuccessHandlers = new Set<BidSuccessHandler>();
const bidErrorHandlers = new Set<BidErrorHandler>();

const joinedAuctions = new Set<number>();

function attachSocketListeners(s: Socket) {
  s.on('bid_update', (data: BidUpdatePayload) => {
    bidUpdateHandlers.forEach((fn) => fn(data));
  });
  s.on('global_activity', (data: Record<string, unknown>) => {
    globalActivityHandlers.forEach((fn) => fn(data));
  });
  s.on('bid_success', (data: { message?: string }) => {
    bidSuccessHandlers.forEach((fn) => fn(data));
  });
  s.on('bid_error', (data: { error?: string }) => {
    bidErrorHandlers.forEach((fn) => fn(data));
  });
  s.on('connect', () => {
    s.emit('join_live_auctions');
    joinedAuctions.forEach((id) => s.emit('join_auction', id));
  });
}

export function getAuctionSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });
    attachSocketListeners(socket);
  }
  return socket;
}

export function retainAuctionSocket(): void {
  refCount += 1;
  getAuctionSocket();
}

export function releaseAuctionSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
    joinedAuctions.clear();
  }
}

export function joinAuctionRoom(auctionId: number): void {
  joinedAuctions.add(auctionId);
  const s = getAuctionSocket();
  if (s.connected) s.emit('join_auction', auctionId);
}

export function placeBidViaSocket(auctionId: number, bidAmount: number, token: string): void {
  getAuctionSocket().emit('place_bid', {
    auction_id: auctionId,
    bid_amount: bidAmount,
    token,
  });
}

export function onBidUpdate(handler: BidUpdateHandler): () => void {
  bidUpdateHandlers.add(handler);
  return () => bidUpdateHandlers.delete(handler);
}

export function onGlobalActivity(handler: GlobalActivityHandler): () => void {
  globalActivityHandlers.add(handler);
  return () => globalActivityHandlers.delete(handler);
}

export function onBidSuccess(handler: BidSuccessHandler): () => void {
  bidSuccessHandlers.add(handler);
  return () => bidSuccessHandlers.delete(handler);
}

export function onBidError(handler: BidErrorHandler): () => void {
  bidErrorHandlers.add(handler);
  return () => bidErrorHandlers.delete(handler);
}
