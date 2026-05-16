import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
  retainAuctionSocket,
  releaseAuctionSocket,
  joinAuctionRoom,
  placeBidViaSocket,
  onBidUpdate,
  onBidSuccess,
  onBidError,
  getAuctionSocket,
  type BidUpdatePayload,
} from '../../lib/auctionSocket';
import { applyBidToAuctionDetail } from '../../lib/applyBidUpdate';
import { useWalletSummary } from '../../hooks/useWallet';

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '';

interface Bid {
  id: number;
  customer_id: number;
  customer_name: string;
  bid_amount: string;
  created_at: string;
}

interface Auction {
  id: number;
  product_id: number;
  start_time: string;
  end_time: string;
  status: string;
  reserve_price: string;
  current_highest_bid: string | null;
  minimum_spread: string;
  highest_bidder_id: number | null;
  product_name: string;
  product_images: string | string[];
  product_mrp: string;
  product_description: string;
  total_bids?: number;
  bids: Bid[];
}

function parseImageUrl(raw: string | string[] | undefined): string {
  if (!raw) return '/placeholder.png';
  let images: unknown[] = [];
  try {
    images = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
  } catch {
    return '/placeholder.png';
  }
  const first = images[0];
  let url = typeof first === 'string' ? first : (first as { url?: string })?.url || '/placeholder.png';
  if (url.startsWith('/')) url = `${API_BASE || 'http://localhost:4000'}${url}`;
  return url;
}

export default function AuctionDetail({ auctionId }: { auctionId: string }) {
  const customer = useAuthStore((s) => s.customer);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [auctionState, setAuctionState] = useState<'upcoming' | 'active' | 'ended'>('active');
  const [bidInput, setBidInput] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const { data: walletSummary } = useWalletSummary(!!customer);

  const loadAuction = useCallback(async () => {
    try {
      const res = await api.get(`/auctions/${auctionId}`);
      setAuction(res.data.data);
    } catch {
      toast.error('Failed to load auction details');
      setAuction(null);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    setLoading(true);
    loadAuction();
  }, [loadAuction]);

  useEffect(() => {
    if (!auctionId) return;

    retainAuctionSocket();
    joinAuctionRoom(parseInt(auctionId, 10));

    const applyUpdate = (data: BidUpdatePayload) => {
      if (String(data.auction_id) !== auctionId) return;
      setAuction((prev) => (prev ? applyBidToAuctionDetail(prev, data) : prev));
    };

    const unsubBid = onBidUpdate(applyUpdate);
    const unsubSuccess = onBidSuccess(() => {
      setPlacingBid(false);
      setBidInput('');
    });
    const unsubError = onBidError((data) => {
      setPlacingBid(false);
      toast.error(data?.error || 'Failed to place bid');
    });

    return () => {
      unsubBid();
      unsubSuccess();
      unsubError();
      releaseAuctionSocket();
    };
  }, [auctionId]);

  useEffect(() => {
    if (!auction) return;

    const updateCountdown = () => {
      const now = Date.now();
      const start = new Date(auction.start_time).getTime();
      const end = new Date(auction.end_time).getTime();

      if (end <= now) {
        setAuctionState('ended');
        setTimeLeft('Ended');
        return;
      }
      if (start > now) {
        setAuctionState('upcoming');
        const diff = start - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`Starts in ${h > 0 ? `${h}h ` : ''}${m}m ${s}s`);
        return;
      }

      setAuctionState('active');
      const diff = end - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s left`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  const currentBid = parseFloat(auction?.current_highest_bid || auction?.reserve_price || '0');
  const minSpread = parseFloat(auction?.minimum_spread || '1');
  const minNextBid = Math.round((currentBid + minSpread) * 100) / 100;
  const isWinning = Boolean(customer?.id && auction?.highest_bidder_id === customer.id);

  const validateBid = (amount: number): string | null => {
    if (Number.isNaN(amount) || amount <= 0) return 'Enter a valid bid amount';
    if (amount < minNextBid) {
      return `Bid must be at least ₹${minNextBid.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (current + increment)`;
    }
    return null;
  };

  const submitBid = async (amount: number) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error('You must be logged in to place a bid');
      return;
    }
    if (!auction) return;
    if (auctionState !== 'active') {
      toast.error('This auction is not live right now');
      return;
    }

    const validationError = validateBid(amount);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const balance = walletSummary?.balance || 0;
    const required = amount * 0.10;
    if (balance < required) {
      toast.error(`Insufficient wallet balance. You need at least ₹${required.toFixed(2)} (10% of bid) in your wallet. Current balance: ₹${balance.toFixed(2)}.`);
      return;
    }

    setPlacingBid(true);
    joinAuctionRoom(auction.id);

    if (getAuctionSocket().connected) {
      placeBidViaSocket(auction.id, amount, token);
      return;
    }

    try {
      await api.post('/auctions/bid', {
        auction_id: auction.id,
        bid_amount: amount,
      });
      toast.success('Bid placed successfully!');
      setBidInput('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to place bid';
      toast.error(msg);
    } finally {
      setPlacingBid(false);
    }
  };

  const handlePlaceBid = () => submitBid(parseFloat(bidInput));

  const handleQuickBid = () => {
    setBidInput(String(minNextBid));
    void submitBid(minNextBid);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-100 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Auction not found</h2>
        <Link to="/live-auction" className="text-blue-600 hover:underline text-sm">
          Back to Live Auctions
        </Link>
      </div>
    );
  }

  const mainImage = parseImageUrl(auction.product_images);
  const bidCount = auction.total_bids ?? auction.bids?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/live-auction" className="text-sm text-blue-600 hover:underline">
          ← Back to Live Auctions
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Auction #{auction.id}</h1>
        <p className="text-sm text-slate-500">Enter your bid manually — it must be higher than the current bid.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 aspect-[4/3] bg-slate-50 rounded-xl flex items-center justify-center p-4">
                <img
                  src={mainImage}
                  alt={auction.product_name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      auctionState === 'active'
                        ? 'bg-green-100 text-green-700'
                        : auctionState === 'upcoming'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {auctionState === 'active' ? '● Live' : auctionState === 'upcoming' ? 'Upcoming' : 'Ended'}
                  </span>
                  <span className="text-xs font-mono text-red-600">{timeLeft}</span>
                  <span className="text-xs text-slate-500">Min increment: ₹{minSpread}</span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-1">{auction.product_name}</h2>
                <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                  {auction.product_description || 'No description'}
                </p>

                {isWinning && auctionState === 'active' && (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 font-semibold">
                    You have the highest bid
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Current highest bid</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{currentBid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {bidCount} bid{bidCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {auction.product_mrp && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-bold">MRP</p>
                      <p className="text-lg text-slate-400 line-through">
                        ₹{parseFloat(auction.product_mrp).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>

                {auctionState === 'active' ? (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="bid-amount" className="block text-xs font-semibold text-slate-600 mb-1">
                        Your bid amount (₹)
                      </label>
                      <input
                        id="bid-amount"
                        type="number"
                        step="0.01"
                        min={minNextBid}
                        placeholder={`Min ₹${minNextBid.toFixed(2)}`}
                        value={bidInput}
                        onChange={(e) => setBidInput(e.target.value)}
                        disabled={placingBid || isWinning}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-50"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Minimum bid: ₹{minNextBid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                        (current ₹{currentBid.toFixed(2)} + ₹{minSpread} increment)
                      </p>
                      <p className="text-[10px] text-orange-600 font-semibold mt-0.5">
                        10% wallet balance required (₹{(parseFloat(bidInput || '0') * 0.1).toFixed(2)})
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handlePlaceBid}
                        disabled={placingBid || isWinning || !bidInput}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {placingBid ? 'Placing bid…' : 'Place bid'}
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickBid}
                        disabled={placingBid || isWinning}
                        className="sm:w-40 py-3 border border-orange-200 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-50 disabled:opacity-50"
                      >
                        Bid ₹{minNextBid.toLocaleString('en-IN')}
                      </button>
                    </div>

                    {isWinning && (
                      <p className="text-xs text-slate-500 text-center">
                        You cannot outbid yourself. Wait for another bidder.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    {auctionState === 'upcoming'
                      ? 'Bidding opens when the auction goes live.'
                      : 'This auction has ended. Check Winning or Payments for next steps.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Bid history</h3>
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {auction.bids?.length > 0 ? (
              auction.bids.map((bid) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    bid.customer_id === customer?.id ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {bid.customer_name}
                      {bid.customer_id === customer?.id ? ' (You)' : ''}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(bid.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-orange-600">
                    ₹{parseFloat(bid.bid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No bids yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
