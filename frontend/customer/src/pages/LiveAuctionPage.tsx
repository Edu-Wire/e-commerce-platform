import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useWalletSummary } from '../hooks/useWallet';


import SmartAlternatives from '../components/auction/SmartAlternatives';
import MyBids from '../components/auction/MyBids';
import Winning from '../components/auction/Winning';
import Payments from '../components/auction/Payments';
import Wallet from '../components/auction/Wallet';
import Settings from '../components/auction/Settings';
import HelpSupport from '../components/auction/HelpSupport';
import TermsConditions from '../components/auction/TermsConditions';
import AuctionDetail from '../components/auction/AuctionDetail';
import {
  retainAuctionSocket,
  releaseAuctionSocket,
  joinAuctionRoom,
  placeBidViaSocket,
  onBidUpdate,
  onGlobalActivity,
  onBidError,
  getAuctionSocket,
} from '../lib/auctionSocket';
import { applyBidToAuctionList } from '../lib/applyBidUpdate';

interface Activity {
  id: string;
  type: 'new_bid' | 'ending_soon' | 'reserve_met';
  product_name: string;
  amount?: number;
  bidder_id?: number;
  bidder_name?: string;
  previous_bidder_id?: number;
  timestamp: string;
}

const formatAuctionDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timePart = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
};

function FeaturedLiveCard({ auction, customer, bidAmounts, handleBidChange, handlePlaceBid, navigate, onOpenAlternatives }: any) {
  let images: any[] = [];
  try {
    images = typeof auction.product_images === 'string' ? JSON.parse(auction.product_images) : auction.product_images;
  } catch (e) { }
  const mainImageObj = images?.[0];
  let mainImage = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');
  if (mainImage && mainImage.startsWith('/')) mainImage = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${mainImage}`;

  const currentBid = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');
  const startingPrice = parseFloat(auction.reserve_price || auction.product_mrp || '0');
  const buyNow = auction.buy_now_price || null;
  const minSpread = parseFloat(auction.minimum_spread || '1.00');
  const minNextBid = currentBid + minSpread;
  const isWinning = customer?.id && auction.highest_bidder_id === customer.id;
  const hasUserBid = auction.user_has_bid;
  const userBidValue = parseFloat(auction.user_highest_bid || '0');

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex-1 flex gap-4 items-start min-w-0">
          <div className="w-24 h-20 sm:w-36 sm:h-28 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
            <img src={mainImage} alt={auction.product_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2">{auction.product_name}</h3>
            <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-3 items-center">
              <span>Electronics</span>
              <span>•</span>
              <span>SKU: {auction.product_sku || `AUC-${auction.id}`}</span>
              {hasUserBid && (
                <>
                  <span>•</span>
                  <div className="flex gap-1.5 items-center">
                    {isWinning ? (
                      <span className="bg-green-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">Winning</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">Outbid</span>
                        <button
                          onClick={() => onOpenAlternatives(auction)}
                          className="bg-green-50 hover:bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold border border-green-200 transition-all cursor-pointer"
                        >
                          Smart Alternatives
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full sm:w-auto flex-shrink-0">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center sm:min-w-[180px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Time Remaining</div>
            <div className="text-xl font-bold text-red-500 mt-1"><Timer endTime={auction.end_time!} startTime={auction.start_time!} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100 text-sm">
        <div>
          <div className={`text-xs font-semibold ${isWinning ? 'text-green-700' : hasUserBid ? 'text-red-500' : 'text-slate-500'}`}>Current Highest Bid</div>
          <div className={`font-bold text-base ${isWinning ? 'text-green-700' : hasUserBid ? 'text-red-500' : 'text-slate-800'}`}>₹{currentBid.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Starting Price</div>
          <div className="font-bold text-slate-900">₹{startingPrice.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Reserve Price</div>
          <div className="font-bold text-slate-900">₹{(auction.reserve_price || 0).toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Buy Now Price</div>
          <div className="font-bold text-slate-900">{buyNow ? `₹${parseFloat(buyNow).toLocaleString('en-IN')}` : '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 text-[13px] text-slate-500">
        <div>
          <div className="text-xs text-slate-400">Auction ID</div>
          <div className="font-medium text-slate-800">AUC-{auction.id}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Start Time</div>
          <div className="font-medium text-slate-800">{auction.start_time ? formatAuctionDate(auction.start_time) : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Auction Type</div>
          <div className="font-medium text-slate-800">Standard Auction</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Bidders</div>
          <div className="font-medium text-slate-800">{auction.total_bids || 0}</div>
        </div>
      </div>

      {/* Place Bid Section */}
      <div className="mt-4 bg-white p-4 rounded-lg border border-slate-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 font-medium">DESCRIPTION</div>
            <p className="text-sm text-slate-700 mt-1 line-clamp-2">{auction.product_description || 'No description available'}</p>
          </div>

          <div className="w-full sm:w-72 flex items-center gap-2">
            <input
              type="number"
              placeholder={`Min ₹${minNextBid.toFixed(0)}`}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 font-medium"
              value={bidAmounts[auction.id!] !== undefined && bidAmounts[auction.id!] !== '' ? bidAmounts[auction.id!] : minNextBid.toFixed(0)}
              onChange={(e) => handleBidChange(auction.id!, e.target.value)}
            />
            <button
              onClick={() => handlePlaceBid(auction.id!, auction.current_highest_bid || auction.reserve_price || '0', auction.minimum_spread || '1.00')}
              className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
            >
              Place Bid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Auction {
  product_id: number;
  product_name: string;
  product_images: string | string[];
  product_mrp: string;
  product_description: string;
  id: number | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  reserve_price: string | null;
  current_highest_bid: string | null;
  minimum_spread: string | null;
  quantity: number | null;
  total_bids: number | null;
  highest_bidder_id?: number | null;
  user_has_bid?: boolean;
  user_highest_bid?: string | null;
  outbid_purchase_markup_percent?: number | null;
}

interface ProductGroup {
  product_id: number;
  product_name: string;
  product_images: string | string[];
  product_mrp: string;
  product_description: string;
  auctions: Auction[];
}

export default function LiveAuctionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTabMap: Record<string, string> = {
    '/live-auction': 'Live Auctions',
    '/live-auction/my-bids': 'My Bids',
    '/live-auction/winning': 'Winning',
    '/live-auction/payments': 'Payments',
    '/live-auction/wallet': 'Wallet',
    '/live-auction/settings': 'Settings',
    '/live-auction/help-support': 'Help & Support',
    '/live-auction/terms-conditions': 'Terms & Conditions',
  };

  const auctionIdFromPath = useMemo(() => {
    const match = location.pathname.match(/^\/live-auction\/(\d+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const activeTab = auctionIdFromPath
    ? 'Auction Detail'
    : activeTabMap[location.pathname] || 'Live Auctions';

  const [activeContentTab, setActiveContentTab] = useState('Live Auctions');
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<any[]>([]);
  const [wonAuctions, setWonAuctions] = useState<any[]>([]);

  const upcomingGroups = useMemo(() => {
    const groups: Record<number, any> = {};
    upcomingAuctions.forEach(item => {
      if (!groups[item.product_id]) {
        groups[item.product_id] = {
          ...item,
          count: 1,
          earliest_start: item.start_time
        };
      } else {
        groups[item.product_id].count += 1;
        if (new Date(item.start_time) < new Date(groups[item.product_id].earliest_start)) {
          groups[item.product_id].earliest_start = item.start_time;
        }
      }
    });
    return Object.values(groups).sort((a, b) => new Date(a.earliest_start).getTime() - new Date(b.earliest_start).getTime());
  }, [upcomingAuctions]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [bidAmounts, setBidAmounts] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);

  const [selectedAlternativeAuction, setSelectedAlternativeAuction] = useState<{
    productId: number;
    currentAuctionId: number;
    productName: string;
    mrp: number;
    catalogPrice: number;
    outbidMarkupPercent?: number | null;
    currentHighestBid: number;
    isCompleted: boolean;
  } | null>(null);

  const handleOpenAlternatives = (auc: any) => {
    setSelectedAlternativeAuction({
      productId: auc.product_id,
      currentAuctionId: auc.id!,
      productName: auc.product_name,
      mrp: parseFloat(auc.product_mrp || '0') * 1.25,
      catalogPrice: parseFloat(auc.product_mrp || '0'),
      outbidMarkupPercent: auc.outbid_purchase_markup_percent ?? 30,
      currentHighestBid: parseFloat(auc.current_highest_bid || auc.reserve_price || '0'),
      isCompleted: auc.status === 'completed'
    });
  };

  const [priceFilter, setPriceFilter] = useState('All Prices');
  const [timeFilter, setTimeFilter] = useState('All Times');
  const [sortFilter, setSortFilter] = useState('Recently Updated');
  const [groupByProduct, setGroupByProduct] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const customer = useAuthStore(state => state.customer);
  const token = useAuthStore(state => state.token);
  const logout = useAuthStore(state => state.logout);
  const { data: walletSummary } = useWalletSummary(!!token);
  const walletBalance = walletSummary ? walletSummary.balance : 0;
  useEffect(() => {
    retainAuctionSocket();

    const unsubBid = onBidUpdate((data) => {
      setAuctions((prev) => {
        const found = prev.find(a => a.id === data.auction_id);
        if (found && customer?.id) {
          const wasHighest = found.highest_bidder_id === customer.id;
          const isNoLongerHighest = data.highest_bidder_id !== customer.id;
          if (wasHighest && isNoLongerHighest) {
            toast.error(
              (t) => (
                <div className="flex flex-col gap-1 text-left">
                  <span className="font-bold text-slate-800">⚠️ You've been outbid!</span>
                  <span className="text-xs text-slate-500">Someone bid higher on {data.product_name || found.product_name}.</span>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      setSelectedAlternativeAuction({
                        productId: found.product_id,
                        currentAuctionId: found.id!,
                        productName: found.product_name,
                        mrp: parseFloat(found.product_mrp || '0') * 1.25,
                        catalogPrice: parseFloat(found.product_mrp || '0'),
                        outbidMarkupPercent: found.outbid_purchase_markup_percent ?? 30,
                        currentHighestBid: data.current_highest_bid,
                        isCompleted: false
                      });
                    }}
                    className="mt-1.5 self-start bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                  >
                    View Alternatives
                  </button>
                </div>
              ),
              { duration: 8000 }
            );
          }
        }
        return applyBidToAuctionList(prev, data, customer?.id);
      });
    });
    const unsubActivity = onGlobalActivity((data) => {
      setActivities((prev) => [
        { ...data, id: Math.random().toString(36).slice(2) } as Activity,
        ...prev,
      ].slice(0, 10));
    });
    const unsubError = onBidError((data) => {
      toast.error(data.error || 'Failed to place bid');
    });

    return () => {
      unsubBid();
      unsubActivity();
      unsubError();
      releaseAuctionSocket();
    };
  }, [customer?.id]);

  const fetchAuctions = async () => {
    const authToken = useAuthStore.getState().token;
    try {
      const [activeRes, upcomingRes, activityRes, wonRes] = await Promise.all([
        api.get('/auctions/active'),
        api.get('/auctions/upcoming').catch(() => ({ data: { data: [] } })),
        api.get('/auctions/activity').catch(() => ({ data: { data: [] } })),
        authToken
          ? api.get('/auctions/won').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      const data = activeRes.data.data;
      setAuctions(Array.isArray(data) ? data : []);

      const upcomingData = upcomingRes?.data?.data;
      setUpcomingAuctions(Array.isArray(upcomingData) ? upcomingData : []);

      const wonData = wonRes?.data?.data;
      setWonAuctions(Array.isArray(wonData) ? wonData : []);

      const activityData = activityRes?.data?.data;
      if (Array.isArray(activityData)) {
        setActivities(prev => {
          // Only set if empty to avoid overriding socket updates during intervals
          if (prev.length === 0) return activityData;
          return prev;
        });
      }

      if (Array.isArray(data)) {
        data.forEach((a: { id?: number | null }) => {
          if (a.id) joinAuctionRoom(a.id);
        });
      }
    } catch (err) {
      console.error('Failed to fetch auctions:', err);
      toast.error('Failed to load live auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBidChange = (id: number, val: string) => {
    setBidAmounts(prev => ({ ...prev, [id]: val }));
  };

  const handlePlaceBid = async (auctionId: number, currentBidStr: string, minSpreadStr: string) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error('You must be logged in to place a bid');
      return;
    }

    const currentBid = parseFloat(currentBidStr);
    const minSpread = parseFloat(minSpreadStr || '1.00');
    const minNextBid = currentBid + minSpread;

    const amountStr = bidAmounts[auctionId] !== undefined && bidAmounts[auctionId] !== ''
      ? bidAmounts[auctionId]
      : minNextBid.toFixed(0);

    const amount = parseFloat(amountStr);

    if (amount < currentBid + minSpread) {
      toast.error(`Bid must be at least ₹${(currentBid + minSpread).toFixed(2)}`);
      return;
    }

    joinAuctionRoom(auctionId);

    if (getAuctionSocket().connected) {
      placeBidViaSocket(auctionId, amount, token);
      setBidAmounts((prev) => ({ ...prev, [auctionId]: '' }));
      return;
    }

    try {
      await api.post('/auctions/bid', { auction_id: auctionId, bid_amount: amount });
      setBidAmounts((prev) => ({ ...prev, [auctionId]: '' }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to place bid';
      toast.error(msg);
    }
  };

  const activeAuctions = useMemo(() => auctions.filter(a => a.id !== null), [auctions]);

  const { filteredAuctions, productGroups } = useMemo(() => {
    const groups: Record<number, ProductGroup> = {};
    const sourceAuctions = activeContentTab === 'Won Bids' ? wonAuctions : auctions;

    let filtered = sourceAuctions.filter(auction => {
      if (!auction.id) return false;

      // Tab filter
      if (activeContentTab === 'Live Auctions' && auction.status !== 'active') return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = auction.product_name?.toLowerCase().includes(query);
        const matchesDesc = auction.product_description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Price Filter
      if (priceFilter !== 'All Prices') {
        const highestBid = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');
        if (priceFilter === 'Under ₹1,000' && highestBid >= 1000) return false;
        if (priceFilter === '₹1,000 - ₹5,000' && (highestBid < 1000 || highestBid > 5000)) return false;
        if (priceFilter === 'Over ₹5,000' && highestBid <= 5000) return false;
      }

      // Time Filter
      if (timeFilter !== 'All Times' && auction.end_time) {
        const now = new Date().getTime();
        const end = new Date(auction.end_time).getTime();
        const hoursLeft = (end - now) / (1000 * 60 * 60);

        if (timeFilter === '< 1 Hour' && hoursLeft >= 1) return false;
        if (timeFilter === '< 24 Hours' && hoursLeft >= 24) return false;
        if (timeFilter === '> 24 Hours' && hoursLeft <= 24) return false;
      }

      return true;
    });

    filtered.forEach((auction) => {
      if (!groups[auction.product_id]) {
        groups[auction.product_id] = {
          product_id: auction.product_id,
          product_name: auction.product_name,
          product_images: auction.product_images,
          product_mrp: auction.product_mrp,
          product_description: auction.product_description,
          auctions: [auction],
        };
      } else {
        groups[auction.product_id].auctions.push(auction);
      }
    });

    let groupsArr = Object.values(groups);

    // Sort groups
    if (sortFilter === 'Price: Low to High') {
      groupsArr.sort((a, b) => Math.max(...a.auctions.map(x => parseFloat(x.current_highest_bid || x.reserve_price || '0'))) - Math.max(...b.auctions.map(x => parseFloat(x.current_highest_bid || x.reserve_price || '0'))));
      filtered.sort((a, b) => parseFloat(a.current_highest_bid || a.reserve_price || '0') - parseFloat(b.current_highest_bid || b.reserve_price || '0'));
    } else if (sortFilter === 'Price: High to Low') {
      groupsArr.sort((a, b) => Math.max(...b.auctions.map(x => parseFloat(x.current_highest_bid || x.reserve_price || '0'))) - Math.max(...a.auctions.map(x => parseFloat(x.current_highest_bid || x.reserve_price || '0'))));
      filtered.sort((a, b) => parseFloat(b.current_highest_bid || b.reserve_price || '0') - parseFloat(a.current_highest_bid || a.reserve_price || '0'));
    } else if (sortFilter === 'Ending Soonest') {
      groupsArr.sort((a, b) => Math.min(...a.auctions.map(x => new Date(x.end_time!).getTime())) - Math.min(...b.auctions.map(x => new Date(x.end_time!).getTime())));
      filtered.sort((a, b) => new Date(a.end_time!).getTime() - new Date(b.end_time!).getTime());
    }

    return { filteredAuctions: filtered, productGroups: groupsArr };
  }, [auctions, wonAuctions, searchQuery, activeContentTab, priceFilter, timeFilter, sortFilter]);

  const activeBidsCount = useMemo(() => activeAuctions.filter(a => new Date(a.start_time!).getTime() <= new Date().getTime()).length, [activeAuctions]);

  const liveBids = useMemo(() => {
    // All items in filteredAuctions already have status='active' — show them all.
    // Don't exclude by start_time: an admin-started auction should be visible immediately.
    return filteredAuctions;
  }, [filteredAuctions]);

  const upcomingBids = useMemo(() => {
    const filtered = upcomingAuctions.filter(auction => {
      if (!auction.id) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = auction.product_name?.toLowerCase().includes(query);
        const matchesDesc = auction.product_description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Price Filter
      if (priceFilter !== 'All Prices') {
        const highestBid = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');
        if (priceFilter === 'Under ₹1,000' && highestBid >= 1000) return false;
        if (priceFilter === '₹1,000 - ₹5,000' && (highestBid < 1000 || highestBid > 5000)) return false;
        if (priceFilter === 'Over ₹5,000' && highestBid <= 5000) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime());
  }, [upcomingAuctions, searchQuery, priceFilter]);

  const { winningBidsCount, outbidAuctionsCount, totalParticipated } = useMemo(() => {
    if (!customer?.id) return { winningBidsCount: 0, outbidAuctionsCount: 0, totalParticipated: 0 };

    let winning = 0;
    let outbid = 0;
    let participated = 0;

    activeAuctions.forEach(a => {
      if (a.user_has_bid) {
        participated++;
        if (a.highest_bidder_id === customer.id) {
          winning++;
        } else {
          outbid++;
        }
      }
    });

    return { winningBidsCount: winning, outbidAuctionsCount: outbid, totalParticipated: participated };
  }, [activeAuctions, customer]);

  const wonAuctionsValue = useMemo(() => {
    let sum = 0;
    wonAuctions.forEach(a => {
      sum += parseFloat(a.current_highest_bid || '0');
    });
    return sum.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }, [wonAuctions]);

  const winningProbability = useMemo(() => {
    if (totalParticipated === 0) return null;
    return Math.round((winningBidsCount / totalParticipated) * 100);
  }, [winningBidsCount, totalParticipated]);

  const comparisonAuction = useMemo(() => {
    if (!customer?.id) return null;
    const activeAndStarted = activeAuctions.filter(a => new Date(a.start_time!).getTime() <= new Date().getTime());
    if (activeAndStarted.length === 0) return null;

    let selected = activeAndStarted.find(a => a.user_has_bid && a.highest_bidder_id !== customer.id);
    if (!selected) selected = activeAndStarted.find(a => a.user_has_bid && a.highest_bidder_id === customer.id);
    if (!selected) selected = activeAndStarted[0];

    return selected;
  }, [activeAuctions, customer]);

  const endingSoonCount = useMemo(() => {
    const now = new Date().getTime();
    return activeAuctions.filter(a => {
      const end = new Date(a.end_time!).getTime();
      return end - now > 0 && end - now < 30 * 60 * 1000;
    }).length;
  }, [activeAuctions]);

  const totalAmountBid = useMemo(() => {
    let sum = 0;
    activeAuctions.forEach(a => {
      if (a.user_has_bid && a.user_highest_bid) {
        sum += parseFloat(a.user_highest_bid);
      }
    });
    return sum.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }, [activeAuctions]);

  const sidebarItems = [
    { icon: '🔴', label: 'Live Auctions', path: '/live-auction' },
    { icon: '🎯', label: 'My Bids', path: '/live-auction/my-bids' },
    { icon: '🏆', label: 'Winning', badge: wonAuctions.length > 0 ? wonAuctions.length.toString() : undefined, path: '/live-auction/winning' },
    { icon: '💳', label: 'Payments', path: '/live-auction/payments' },
    { icon: '💼', label: 'Wallet', path: '/live-auction/wallet' },
    { icon: '⚙️', label: 'Settings', path: '/live-auction/settings' },
    { icon: '❓', label: 'Help & Support', path: '/live-auction/help-support' },
    { icon: '📝', label: 'Terms & Conditions', path: '/live-auction/terms-conditions' },
  ];

  const isLiveAuctionHome = activeTab === 'Live Auctions' && !auctionIdFromPath;
  if (loading && isLiveAuctionHome) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        {/* Navbar Skeleton */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4 animate-pulse">
          <div className="w-32 h-6 bg-gray-200 rounded"></div>
        </div>

        <div className="flex-1 max-w-[1500px] w-full mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
          {/* Sidebar Skeleton */}
          <div className="w-full lg:w-64 bg-white border border-slate-100 rounded-2xl p-5 flex flex-col flex-shrink-0 shadow-sm animate-pulse">
            <div className="w-20 h-3 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="mt-8 h-32 bg-gray-100 rounded-2xl w-full"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="animate-pulse">
                <div className="w-40 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-64 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-32 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Stats Cards Row Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 min-h-[120px] shadow-sm animate-pulse flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div>
                    <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Content List Skeleton */}
            <div className="space-y-4">
              <div className="w-full h-14 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm animate-pulse flex flex-col sm:flex-row gap-4">
                  <div className="w-24 h-20 sm:w-36 sm:h-28 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 flex flex-col">
                    <div className="w-3/4 h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="w-1/2 h-3 bg-gray-200 rounded mb-6"></div>
                    <div className="grid grid-cols-4 gap-4 mt-auto">
                      <div className="w-full h-10 bg-gray-200 rounded"></div>
                      <div className="w-full h-10 bg-gray-200 rounded"></div>
                      <div className="w-full h-10 bg-gray-200 rounded"></div>
                      <div className="w-full h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 max-w-[1500px] w-full mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] overflow-y-auto flex-shrink-0 shadow-sm">
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dashboard</span>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map(item => (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.label}
                  badge={item.badge}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </nav>
          </div>

          <div className="mt-6 relative overflow-hidden bg-[#F4FDF9] border border-[#D5E6CD]/30 p-5 rounded-2xl flex flex-col gap-3 shadow-sm min-h-[200px]">
            {/* Pedestal and Diamond SVG illustration */}
            <div className="absolute bottom-0 right-0 left-0 h-16 pointer-events-none flex justify-end items-end opacity-90">
              <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
                {/* Pedestal */}
                <path d="M30 50 L70 50 L65 58 L35 58 Z" fill="#E2F0D9" stroke="#A2E0C1" strokeWidth="1.5" />
                <rect x="42" y="44" width="16" height="6" fill="#A2E0C1" />
                {/* Diamond */}
                <path d="M50 20 L62 30 L50 44 L38 30 Z" fill="#D2F1E4" stroke="#0FA86E" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M50 20 L50 44" stroke="#0FA86E" strokeWidth="1" />
                <path d="M38 30 L62 30" stroke="#0FA86E" strokeWidth="1" />
                {/* Sparkles */}
                <path d="M25 15 L27 18 L30 19 L27 20 L25 23 L23 20 L20 19 L23 18 Z" fill="#F0A85E" />
                <path d="M75 22 L77 24 L79 25 L77 26 L75 28 L73 26 L71 25 L73 24 Z" fill="#F0A85E" />
                {/* Leaves */}
                <path d="M10 50 Q20 35 30 48" stroke="#A2E0C1" strokeWidth="1.5" fill="none" />
                <path d="M80 48 Q90 32 95 46" stroke="#A2E0C1" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2 mb-1 z-10">
              <span className="text-lg">👑</span>
              <span className="font-black text-sm text-slate-800">Premium Member</span>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed z-10 max-w-[85%]">
              You're saving more with lower fees and exclusive benefits!
            </p>
            
            <button className="w-full py-2.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold rounded-xl transition-all shadow-sm z-10">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Main Content */}
          <main className="flex-grow space-y-6 overflow-y-auto">
            {auctionIdFromPath ? (
              <AuctionDetail auctionId={auctionIdFromPath} />
            ) : activeTab === 'Live Auctions' ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bid Overview</h1>
                    <p className="text-xs text-slate-500 mt-1">Place your bids, check wallet balance, and track status.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-100 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                      <span>{activeBidsCount} Live Auctions</span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {/* Wallet Balance Card */}
                  <div className="bg-[#EBF7F2] border border-[#D5E6CD]/30 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Wallet Balance</span>
                      <div className="w-8 h-8 rounded-xl bg-[#0FA86E]/10 flex items-center justify-center text-[#0FA86E]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M16 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><circle cx="16" cy="12" r="1" /></svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800">₹{walletBalance.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Available to bid</p>
                    </div>
                  </div>

                  {/* Winning Bids Card */}
                  <div className="bg-[#FFF9EC] border border-[#FFE8CC]/30 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Winning Bids</span>
                      <div className="w-8 h-8 rounded-xl bg-[#F0A85E]/10 flex items-center justify-center text-[#F0A85E]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" /><path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" /></svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800">{wonAuctions.length}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Total Value ₹{wonAuctionsValue}</p>
                    </div>
                  </div>

                  {/* Total Amount Bid Card */}
                  <div className="bg-[#F3F2FD] border border-[#E1DFFC]/30 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
                    {/* Faint line graph background */}
                    <div className="absolute bottom-0 right-0 left-0 h-12 opacity-25 pointer-events-none">
                      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M0,25 Q15,10 30,22 T60,5 T90,20 L100,10 L100,30 L0,30 Z" fill="url(#purpleGrad)" />
                        <path d="M0,25 Q15,10 30,22 T60,5 T90,20 L100,10" fill="none" stroke="#6366F1" strokeWidth="1.5" />
                        <defs>
                          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#FFFFFF" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    <div className="flex items-center justify-between mb-4 z-10">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Amount Bid</span>
                      <div className="w-8 h-8 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M16 8H12a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H12" /></svg>
                      </div>
                    </div>
                    <div className="z-10">
                      <p className="text-2xl font-black text-slate-800">₹{totalAmountBid}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">+₹0 today</p>
                    </div>
                  </div>
                </div>

                {/* Tabs & Filters Bar */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between mb-6">
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                    {['Live Auctions', 'Won Bids'].map(tab => {
                      const isActive = tab === activeContentTab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveContentTab(tab)}
                          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            isActive
                              ? 'bg-[#0FA86E] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <div className="relative inline-block">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                        <span>All Auctions</span>
                        <span className="text-[10px] text-slate-400">▼</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bid List Container / Big Card */}
                {activeContentTab === 'Won Bids' ? (
                  <div className="space-y-4">
                    {filteredAuctions.length === 0 ? (
                      <div className="text-center p-8 bg-white rounded-xl border border-slate-100">
                        <p className="text-slate-500">No won auctions found.</p>
                      </div>
                    ) : (
                      filteredAuctions.map((auction) => {
                        const currentBid = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');
                        let images: any[] = [];
                        try {
                          images = typeof auction.product_images === 'string' ? JSON.parse(auction.product_images) : auction.product_images;
                        } catch (e) { }
                        const mainImageObj = images?.[0];
                        let mainImage = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');
                        if (mainImage.startsWith('/')) {
                          mainImage = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${mainImage}`;
                        }

                        return (
                          <div key={auction.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="w-20 h-16 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
                                <img
                                  src={mainImage}
                                  alt={auction.product_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>'; }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-slate-800 truncate text-sm md:text-base">{auction.product_name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{auction.product_description || 'No description'}</p>
                                <div className="flex flex-wrap gap-2.5 mt-1.5 items-center">
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Auction #{auction.id}</span>
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Won</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 justify-end flex-shrink-0">
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Winning Bid</p>
                                <p className="font-bold text-slate-800 text-sm md:text-base">₹{currentBid.toLocaleString('en-IN')}</p>
                              </div>
                              <a
                                href="/orders"
                                className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                              >
                                Pay Now
                              </a>
                              <button
                                type="button"
                                onClick={() => navigate(`/live-auction/${auction.id}`)}
                                className="text-xs text-blue-500 font-semibold hover:underline px-2.5 py-1.5 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (liveBids.length === 0 && upcomingBids.length === 0) ? (
                  <>
                    {/* Two-column Empty State Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Card: Live Bids */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col min-h-[420px] shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-[#0FA86E] rounded-full animate-pulse"></span>
                            Live Bids
                          </h2>
                          <span className="text-[11px] bg-[#EBF7F2] text-[#0FA86E] px-2.5 py-0.5 rounded-full font-bold">
                            0 Active
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                          {/* Hammer Vector Illustration */}
                          <div className="w-40 h-32 mb-4 relative flex items-center justify-center">
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                              {/* Sound block */}
                              <ellipse cx="60" cy="85" rx="30" ry="10" fill="#EBF7F2" />
                              <path d="M35 85 C35 89 46 92 60 92 C74 92 85 89 85 85" stroke="#0FA86E" strokeWidth="3" strokeLinecap="round" />
                              {/* Gavel head */}
                              <path d="M42 45 L62 25 L82 45 L62 65 Z" fill="#E2F0D9" stroke="#0FA86E" strokeWidth="3.5" strokeLinejoin="round" />
                              {/* Gavel handle */}
                              <path d="M52 55 L25 82" stroke="#0FA86E" strokeWidth="4.5" strokeLinecap="round" />
                              {/* Sparkles */}
                              <path d="M22 30 L25 35 L30 36 L25 37 L22 42 L20 37 L15 36 L20 35 Z" fill="#A2E0C1" />
                              <path d="M92 25 L94 28 L97 29 L94 30 L92 33 L90 30 L87 29 L90 28 Z" fill="#A2E0C1" />
                              <path d="M85 70 L87 73 L90 74 L87 75 L85 78 L83 75 L80 74 L83 73 Z" fill="#A2E0C1" />
                            </svg>
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-base">No Live Auctions</h3>
                          <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
                            There are currently no live auctions.<br />Check back later for exciting deals!
                          </p>
                          <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                            Browse Categories
                          </button>
                        </div>
                      </div>

                      {/* Right Card: Upcoming Bids */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col min-h-[420px] shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-[#F0A85E] rounded-full"></span>
                            Upcoming Bids
                          </h2>
                          <span className="text-[11px] bg-[#FFF9EC] text-[#F0A85E] px-2.5 py-0.5 rounded-full font-bold">
                            0 Scheduled
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                          {/* Calendar Vector Illustration */}
                          <div className="w-40 h-32 mb-4 relative flex items-center justify-center">
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                              {/* Calendar background shadow */}
                              <rect x="35" y="35" width="50" height="50" rx="10" fill="#FFF9EC" />
                              {/* Calendar border */}
                              <rect x="35" y="35" width="50" height="50" rx="10" stroke="#F0A85E" strokeWidth="3.5" />
                              {/* Header bar */}
                              <path d="M35 48 H85" stroke="#F0A85E" strokeWidth="3.5" />
                              {/* Ring binders */}
                              <rect x="44" y="27" width="5" height="12" rx="2" fill="#F0A85E" />
                              <rect x="71" y="27" width="5" height="12" rx="2" fill="#F0A85E" />
                              {/* Calendar Grid lines */}
                              <circle cx="48" cy="60" r="2.5" fill="#F0A85E" />
                              <circle cx="60" cy="60" r="2.5" fill="#F0A85E" />
                              <circle cx="72" cy="60" r="2.5" fill="#F0A85E" />
                              <circle cx="48" cy="72" r="2.5" fill="#F0A85E" />
                              <circle cx="60" cy="72" r="2.5" fill="#F0A85E" />
                              {/* Orange Clock Overlay */}
                              <circle cx="75" cy="75" r="14" fill="white" stroke="#F0A85E" strokeWidth="3" />
                              <path d="M75 68 V75 L79 79" stroke="#F0A85E" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-base">No Upcoming Auctions</h3>
                          <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
                            You don't have any upcoming<br />auctions scheduled.
                          </p>
                          <button onClick={() => navigate('/live-auction')} className="mt-6 px-6 py-2.5 border border-[#F0A85E] hover:bg-[#FFF9EC] text-[#F0A85E] text-xs font-bold rounded-xl transition-all">
                            View All Auctions
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Footer Highlights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">Secure Bidding</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">100% safe and secure transactions</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">Best Deals</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Win amazing products at lowest prices</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">Real-time Updates</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Stay updated with live bidding</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">24/7 Support</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">We're here to help you anytime</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Big Card Container for Live & Upcoming Bids */
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-10 min-h-[550px]">
                    {/* Left Pane: Live Bids (70%) */}
                    <div className="lg:col-span-7 p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100">
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                          Live Bids
                        </h2>
                        <span className="text-xs bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full font-semibold">
                          {liveBids.length} Active
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-4">
                        {liveBids.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <span className="text-4xl mb-2">🔨</span>
                            <p className="text-slate-500 font-medium">No live bids</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are no active live auctions matching your filters right now.</p>
                          </div>
                        ) : (
                          <>
                            <FeaturedLiveCard
                              auction={liveBids[0]}
                              customer={customer}
                              bidAmounts={bidAmounts}
                              handleBidChange={handleBidChange}
                              handlePlaceBid={handlePlaceBid}
                              navigate={navigate}
                              onOpenAlternatives={handleOpenAlternatives}
                            />

                            <div className="overflow-y-auto space-y-4 pr-1">
                              {liveBids.slice(1).map((auction) => (
                                <AuctionCard
                                  key={auction.id}
                                  auction={auction}
                                  isUpcoming={false}
                                  customer={customer}
                                  bidAmounts={bidAmounts}
                                  handleBidChange={handleBidChange}
                                  handlePlaceBid={handlePlaceBid}
                                  navigate={navigate}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Pane: Upcoming Bids (30%) */}
                    <div className="lg:col-span-3 p-6 flex flex-col bg-slate-50/20 border-l border-slate-100">
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                          Upcoming Bids
                        </h2>
                        <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full font-semibold">
                          {upcomingBids.length} Scheduled
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4">
                        {upcomingBids.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <span className="text-3xl mb-2">⏰</span>
                            <p className="text-slate-500 font-medium text-sm">No upcoming bids</p>
                            <p className="text-xs text-slate-400 mt-1">Check back later for new scheduled auctions.</p>
                          </div>
                        ) : (
                          upcomingBids.map((auction) => (
                            <AuctionCard
                              key={auction.id}
                              auction={auction}
                              isUpcoming={true}
                              customer={customer}
                              bidAmounts={bidAmounts}
                              handleBidChange={handleBidChange}
                              handlePlaceBid={handlePlaceBid}
                              navigate={navigate}
                              isMini={true}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}


              </>
            ) : activeTab === 'My Bids' ? (
              <MyBids />
            ) : activeTab === 'Winning' ? (
              <Winning />
            ) : activeTab === 'Payments' ? (
              <Payments />
            ) : activeTab === 'Wallet' ? (
              <Wallet />
            ) : activeTab === 'Settings' ? (
              <Settings />
            ) : activeTab === 'Help & Support' ? (
              <HelpSupport />
            ) : activeTab === 'Terms & Conditions' ? (
              <TermsConditions />
            ) : null}
          </main>

          {/* Right Sidebar */}
          {activeTab === 'Live Auctions' && (
            <aside className="w-80 border-l border-slate-100 bg-white p-6 flex flex-col gap-6 overflow-y-auto hidden xl:block h-[calc(100vh-64px)] sticky top-16">
              {/* Live Activity */}
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-extrabold text-slate-800 text-sm">Live Activity</h2>
                  <button className="text-xs text-[#0FA86E] font-bold hover:underline">View All</button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No recent activity.</p>
                  ) : (
                    activities.map(activity => {
                      const isMe = customer?.id && activity.bidder_id === customer.id;
                      const outbidMe = customer?.id && activity.previous_bidder_id === customer.id;

                      let title = "New Highest Bid";
                      let titleColor = "text-[#0FA86E]";
                      let icon = "🔨";
                      let iconBg = "bg-[#EBF7F2] text-[#0FA86E]";

                      if (isMe) {
                        title = "You're Winning";
                        titleColor = "text-[#0FA86E]";
                        icon = "🏆";
                        iconBg = "bg-[#EBF7F2] text-[#0FA86E]";
                      } else if (outbidMe) {
                        title = "Outbid";
                        titleColor = "text-red-500";
                        icon = "⚠️";
                        iconBg = "bg-red-50 text-red-500";
                      }

                      const timeAgo = Math.floor((new Date().getTime() - new Date(activity.timestamp).getTime()) / 60000);
                      const timeStr = timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`;

                      return (
                        <div key={activity.id} className="flex gap-3 items-start">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${iconBg}`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-bold text-xs ${titleColor}`}>{title}</p>
                              <span className="text-[10px] text-slate-400 font-semibold">{timeStr}</span>
                            </div>
                            {isMe ? (
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                You are the highest bidder on <span className="font-semibold text-slate-700">{activity.product_name}</span> at <span className="font-semibold text-slate-800">₹{activity.amount?.toLocaleString('en-IN')}</span>
                              </p>
                            ) : outbidMe ? (
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                You were outbid by <span className="font-semibold text-slate-700">{activity.bidder_name || 'Someone'}</span> on <span className="font-semibold text-slate-700">{activity.product_name}</span> with <span className="font-semibold text-slate-800">₹{activity.amount?.toLocaleString('en-IN')}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                <span className="font-semibold text-slate-700">{activity.bidder_name || 'Someone'}</span> bid <span className="font-semibold text-slate-800">₹{activity.amount?.toLocaleString('en-IN')}</span> on <span className="font-semibold text-slate-700">{activity.product_name}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all text-center">
                  View All Activity
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for timer
function Timer({ endTime, startTime }: { endTime: string, startTime?: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = startTime ? new Date(startTime).getTime() : 0;
      const end = new Date(endTime).getTime();

      if (start > now) {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeStr = 'Starts in ';
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0) timeStr += `${hours}h `;
        timeStr += `${minutes}m ${seconds}s`;
        setTimeLeft(timeStr);
      } else {
        const diff = end - now;

        if (diff <= 0) {
          setTimeLeft('Ended');
          clearInterval(interval);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          let timeStr = '';
          if (days > 0) timeStr += `${days}d `;
          if (hours > 0) timeStr += `${hours}h `;
          timeStr += `${minutes}m ${seconds}s`;
          setTimeLeft(timeStr);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, startTime]);

  return <span>{timeLeft}</span>;
}

// Helper Components
function SidebarItem({ icon, label, active, badge, onClick }: { icon: string, label: string, active?: boolean, badge?: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-[#0FA86E] text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
      <div className="flex items-center gap-3">
        <span className={`text-lg transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-white text-[#0FA86E]' : 'bg-slate-100 text-slate-600'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, iconBg, iconColor, highlight }: { title: string, value: string, subtitle: string, icon: string, iconBg: string, iconColor: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-green-200 bg-green-50/40' : 'border-slate-100 bg-white'} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{title}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`text-sm font-bold pb-2 whitespace-nowrap transition-colors ${active ? 'text-green-700 border-b-2 border-green-700' : 'text-slate-500 hover:text-slate-700'}`}>
      {label}
    </button>
  );
}

function FilterDropdown({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-7 py-1 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-green-600 cursor-pointer whitespace-nowrap"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">▼</span>
    </div>
  );
}

// Helper Component for Auction Card row/mini version
function AuctionCard({
  auction,
  isUpcoming,
  customer,
  bidAmounts,
  handleBidChange,
  handlePlaceBid,
  navigate,
  isMini = false
}: {
  auction: any;
  isUpcoming: boolean;
  customer: any;
  bidAmounts: Record<number, string>;
  handleBidChange: (id: number, val: string) => void;
  handlePlaceBid: (id: number, current: string, spread: string) => void;
  navigate: any;
  isMini?: boolean;
}) {
  const currentBid = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');
  const minSpread = parseFloat(auction.minimum_spread || '1.00');
  const minNextBid = currentBid + minSpread;

  let images: any[] = [];
  try {
    images = typeof auction.product_images === 'string' ? JSON.parse(auction.product_images) : auction.product_images;
  } catch (e) { }
  const mainImageObj = images?.[0];
  let mainImage = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');
  if (mainImage.startsWith('/')) {
    mainImage = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${mainImage}`;
  }

  const isWinning = auction.highest_bidder_id === customer?.id;
  const hasUserBid = auction.user_has_bid;
  const userBidValue = parseFloat(auction.user_highest_bid || '0');

  if (isMini) {
    // Styling for the 30% column (Upcoming)
    return (
      <div className="bg-white rounded-xl border border-slate-100 hover:border-green-200 p-4 transition-all hover:shadow-sm flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
            <img
              src={mainImage}
              alt={auction.product_name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>'; }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-800 text-sm truncate">{auction.product_name}</h4>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">{auction.product_description || 'No description'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center text-[10px]">
          <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{auction.id}</span>
          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Upcoming</span>
        </div>

        <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between text-xs gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider truncate">Starting Price</span>
            <span className="font-bold text-slate-700">₹{currentBid.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-right min-w-0 flex-1">
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider truncate">Starts In</span>
            <span className="font-semibold text-green-700 text-[11px] block truncate"><Timer endTime={auction.end_time!} startTime={auction.start_time!} /></span>
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => navigate(`/live-auction/${auction.id}`)}
            className="flex-1 text-center text-xs text-green-700 font-semibold py-2 bg-green-50 hover:bg-green-100/80 rounded-lg transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    );
  }

  // Styling for the 70% column (Live)
  return (
    <div className="bg-white rounded-xl border border-slate-100 hover:border-green-100 p-4 transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Side: Product Info */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-20 h-16 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
          <img
            src={mainImage}
            alt={auction.product_name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>'; }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-800 truncate text-sm md:text-base">{auction.product_name}</h3>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{auction.product_description || 'No description'}</p>
          <div className="flex flex-wrap gap-2 mt-1.5 items-center">
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Auction #{auction.id}</span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <span className="text-[10px]">⏰</span>
              <Timer endTime={auction.end_time!} startTime={auction.start_time!} />
            </span>
            <div className="flex gap-1.5">
              <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Live</span>
              {isWinning ? (
                <span className="bg-green-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">Winning</span>
              ) : hasUserBid ? (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">Outbid</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Bid Details & Placing Bid */}
      <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 items-center justify-between md:justify-end flex-shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
        <div className="text-left md:text-center min-w-[75px]">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Highest</p>
          <p className="font-bold text-slate-800 text-sm md:text-base">₹{currentBid.toLocaleString('en-IN')}</p>
        </div>

        <div className="text-left md:text-center min-w-[75px]">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Your Bid</p>
          <p className={`font-bold text-sm md:text-base ${userBidValue > 0 ? 'text-green-500' : 'text-slate-400'}`}>
            ₹{userBidValue.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`Min ₹${minNextBid.toFixed(0)}`}
            className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 font-medium"
            value={bidAmounts[auction.id!] !== undefined && bidAmounts[auction.id!] !== '' ? bidAmounts[auction.id!] : minNextBid.toFixed(0)}
            onChange={(e) => handleBidChange(auction.id!, e.target.value)}
          />
          <button
            onClick={() => handlePlaceBid(auction.id!, auction.current_highest_bid || auction.reserve_price || '0', auction.minimum_spread || '1.00')}
            className="bg-green-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-green-800 transition-colors whitespace-nowrap"
          >
            Bid
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/live-auction/${auction.id}`)}
          className="text-xs text-green-700 font-semibold hover:underline px-2.5 py-1.5 hover:bg-green-50 rounded-lg transition-all"
        >
          Details
        </button>
      </div>
    </div>
  );
}
