import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';

import MyBids from '../components/auction/MyBids';
import Winning from '../components/auction/Winning';
import Payments from '../components/auction/Payments';
import Wallet from '../components/auction/Wallet';
import Settings from '../components/auction/Settings';
import HelpSupport from '../components/auction/HelpSupport';
import TermsConditions from '../components/auction/TermsConditions';
import AuctionDetail from '../components/auction/AuctionDetail';
import { useWalletSummary } from '../hooks/useWallet';
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
  
  const [priceFilter, setPriceFilter] = useState('All Prices');
  const [timeFilter, setTimeFilter] = useState('All Times');
  const [sortFilter, setSortFilter] = useState('Recently Updated');
  
   const customer = useAuthStore(state => state.customer);
   const token = useAuthStore(state => state.token);
   const logout = useAuthStore(state => state.logout);
  const { data: walletSummary } = useWalletSummary(!!token);
  useEffect(() => {
    retainAuctionSocket();

    const unsubBid = onBidUpdate((data) => {
      setAuctions((prev) => applyBidToAuctionList(prev, data, customer?.id));
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

    const amountStr = bidAmounts[auctionId];
    if (!amountStr) {
      toast.error('Please enter a bid amount');
      return;
    }

    const amount = parseFloat(amountStr);
    const currentBid = parseFloat(currentBidStr);
    const minSpread = parseFloat(minSpreadStr || '1.00');

    if (amount < currentBid + minSpread) {
      toast.error(`Bid must be at least ₹${(currentBid + minSpread).toFixed(2)}`);
      return;
    }

    const balance = walletSummary?.balance || 0;
    const required = amount * 0.10;
    if (balance < required) {
      toast.error(`Insufficient wallet balance. You need at least ₹${required.toFixed(2)} (10% of bid) in your wallet. Current balance: ₹${balance.toFixed(2)}.`);
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
  
  const productGroups = useMemo(() => {
    const groups: Record<number, ProductGroup> = {};
    const sourceAuctions = activeContentTab === 'Won Bids' ? wonAuctions : auctions;
    
    let filteredAuctions = sourceAuctions.filter(auction => {
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

    filteredAuctions.forEach((auction) => {
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
    } else if (sortFilter === 'Price: High to Low') {
      groupsArr.sort((a, b) => Math.max(...b.auctions.map(x => parseFloat(x.current_highest_bid || x.reserve_price || '0'))) - Math.max(...a.auctions.map(x => parseFloat(x.current_highest_bid || x.reserve_price || '0'))));
    } else if (sortFilter === 'Ending Soonest') {
      groupsArr.sort((a, b) => Math.min(...a.auctions.map(x => new Date(x.end_time!).getTime())) - Math.min(...b.auctions.map(x => new Date(x.end_time!).getTime())));
    }
    
    return groupsArr;
  }, [auctions, wonAuctions, searchQuery, activeContentTab, priceFilter, timeFilter, sortFilter]);

  const activeBidsCount = useMemo(() => activeAuctions.filter(a => new Date(a.start_time!).getTime() <= new Date().getTime()).length, [activeAuctions]);
  
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#0F172A] text-white flex flex-col justify-between hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl font-bold text-white">Auction<span className="text-orange-500">Pro</span></span>
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
        
        <div className="p-6">
          <div className="bg-[#1E293B] p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-500">👑</span>
              <span className="font-semibold text-sm">Premium Member</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">You're saving more with lower fees and exclusive auctions.</p>
            <button className="w-full py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors">View Benefits</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden sm:block">
              <input 
                type="text" 
                placeholder="Search for products, categories, auctions..." 
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>{activeBidsCount} Live</span>
            </div>
            
            <div className="relative">
              <div 
                className="cursor-pointer"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span className="text-xl">🔔</span>
                {upcomingAuctions.length > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {upcomingAuctions.length}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    0
                  </span>
                )}
              </div>
              
              {showNotifications && (
                <div className="absolute top-10 right-0 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm">Upcoming Auctions (&lt; 24h)</h3>
                    <span className="text-xs text-orange-500">{upcomingAuctions.length} total</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {upcomingGroups.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No upcoming auctions in the next 24 hours.
                      </div>
                    ) : (
                      upcomingGroups.map(group => {
                        let mainImage = '/placeholder.png';
                        try {
                          const images = typeof group.product_images === 'string' ? JSON.parse(group.product_images) : group.product_images;
                          mainImage = typeof images[0] === 'string' ? images[0] : (images[0]?.url || '/placeholder.png');
                          if (mainImage.startsWith('/')) mainImage = `http://localhost:4000${mainImage}`;
                        } catch (e) {}

                        const startTime = new Date(group.earliest_start);
                        const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dateStr = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

                        return (
                          <div key={group.product_id} className="flex gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                              <img src={mainImage} alt={group.product_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 truncate">{group.product_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                  Starts: {dateStr} at {timeStr}
                                </span>
                                <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                                  {group.count} Auction{group.count > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/live-auction/wallet')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/live-auction/wallet')}
              className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <span className="text-lg">💼</span>
              <div className="text-sm hidden sm:block">
                <span className="text-slate-500 text-xs">Wallet</span>
                <p className="font-semibold text-slate-800">
                  {walletSummary
                    ? `₹${walletSummary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : customer
                      ? '—'
                      : 'Sign in'}
                </p>
              </div>
              <span className="text-xs text-slate-400">▼</span>
            </div>

            {customer ? (
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => navigate('/live-auction/settings')}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold overflow-hidden border border-orange-200 group-hover:border-orange-500 transition-all">
                    {customer.name ? customer.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-sm text-slate-800 group-hover:text-orange-600 transition-colors">{customer.name}</p>
                    <p className="text-xs text-orange-500 font-medium">{customer.customer_type === 'b2b' ? 'B2B Member' : 'Member'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="ml-2 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Logout"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
              </div>
            ) : (
              <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Login / Sign Up
              </a>
            )}
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto space-y-6 bg-[#F8FAFC]">
            {auctionIdFromPath ? (
              <AuctionDetail auctionId={auctionIdFromPath} />
            ) : activeTab === 'Live Auctions' ? (
              <>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-4">Bid Overview</h1>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard title="Active Bids" value={activeBidsCount.toString()} subtitle="+ 0 new today" icon="🔨" iconBg="bg-blue-50" iconColor="text-blue-500" />
                    <StatCard title="Winning Bids" value={wonAuctions.length.toString()} subtitle={`Total Value ₹${wonAuctionsValue}`} icon="🏆" iconBg="bg-green-50" iconColor="text-green-500" />
                    <StatCard title="Upcoming Auctions" value={upcomingAuctions.length.toString()} subtitle="Starting soon" icon="📅" iconBg="bg-blue-50" iconColor="text-blue-500" />
                    <StatCard title="Ending Soon" value={endingSoonCount.toString()} subtitle="Ending within 30m" icon="⏰" iconBg="bg-orange-50" iconColor="text-orange-500" highlight />
                    <StatCard title="Total Amount Bid" value={`₹${totalAmountBid}`} subtitle="+₹0 today" icon="💰" iconBg="bg-purple-50" iconColor="text-purple-500" />
                  </div>
                </div>
                
                {/* Tabs and Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                      {['All Bids', 'Live Auctions', 'Winning', 'Won Bids'].map(tab => (
                        <Tab key={tab} label={tab} active={tab === activeContentTab} onClick={() => setActiveContentTab(tab)} />
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Group by Product</span>
                        <div className="w-10 h-5 bg-orange-500 rounded-full p-0.5 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 border border-slate-200 rounded-lg p-0.5">
                        <button className="p-1 bg-slate-100 rounded">🔲</button>
                        <button className="p-1">☰</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 items-center">
                    <FilterDropdown 
                      value={priceFilter} 
                      options={['All Prices', 'Under ₹1,000', '₹1,000 - ₹5,000', 'Over ₹5,000']} 
                      onChange={setPriceFilter} 
                    />
                    <FilterDropdown 
                      value={timeFilter} 
                      options={['All Times', '< 1 Hour', '< 24 Hours', '> 24 Hours']} 
                      onChange={setTimeFilter} 
                    />
                    <FilterDropdown 
                      value={sortFilter} 
                      options={['Recently Updated', 'Price: Low to High', 'Price: High to Low', 'Ending Soonest']} 
                      onChange={setSortFilter} 
                    />
                    <button 
                      onClick={() => { setPriceFilter('All Prices'); setTimeFilter('All Times'); setSortFilter('Recently Updated'); setSearchQuery(''); }}
                      className="text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap ml-2"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Bid List */}
                <div className="space-y-4">
                  {productGroups.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-xl border border-slate-100">
                      <p className="text-slate-500">No active auctions found.</p>
                    </div>
                  ) : (
                    productGroups.map((group) => {
                      const isExpanded = expandedCards[group.product_id] || false;
                      
                      let images: any[] = [];
                      try {
                        images = typeof group.product_images === 'string' ? JSON.parse(group.product_images) : group.product_images;
                      } catch (e) {
                        console.error('Failed to parse product images:', e);
                      }
                      const mainImageObj = images?.[0];
                      let mainImage = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');
                      if (mainImage.startsWith('/')) {
                        mainImage = `http://localhost:4000${mainImage}`;
                      }

                      const highestBid = Math.max(...group.auctions.map(a => parseFloat(a.current_highest_bid || a.reserve_price || '0')));
                      const yourHighestBidGroup = Math.max(...group.auctions.map(a => parseFloat(a.user_highest_bid || '0')), 0);
                      const activeGroupCount = group.auctions.filter(a => new Date(a.start_time!).getTime() <= new Date().getTime()).length;
                      const upcomingGroupCount = group.auctions.length - activeGroupCount;

                      return (
                        <div key={group.product_id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                          <div className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between cursor-pointer" onClick={() => toggleExpand(group.product_id)}>
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img src={mainImage} alt={group.product_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800">{group.product_name}</h3>
                                <p className="text-xs text-slate-500">{group.product_description || 'No description'}</p>
                                <div className="flex gap-3 mt-1">
                                  {activeGroupCount > 0 && (
                                    <span className="text-xs text-green-500 font-semibold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {activeGroupCount} Active Auction{activeGroupCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {upcomingGroupCount > 0 && (
                                    <span className="text-xs text-orange-500 font-semibold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> {upcomingGroupCount} Upcoming Auction{upcomingGroupCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 md:gap-8 items-center justify-between lg:justify-end">
                              <div className="text-center min-w-[70px]">
                                <p className="text-xs text-slate-400">Highest Bid</p>
                                <p className="font-bold text-slate-800">₹{highestBid.toLocaleString('en-IN')}</p>
                              </div>
                              <div className="text-center min-w-[70px]">
                                <p className="text-xs text-slate-400">Your Highest Bid</p>
                                <p className={`font-bold ${yourHighestBidGroup > 0 ? 'text-green-500' : 'text-slate-400'}`}>₹{yourHighestBidGroup.toLocaleString('en-IN')}</p>
                              </div>
                              <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold text-center min-w-[90px]">
                                Grouped
                                <p className="text-[10px] text-green-500 font-normal">By Product</p>
                              </div>
                              <div className="text-center min-w-[50px]">
                                <p className="font-bold text-slate-800">{group.auctions.length}</p>
                                <p className="text-[10px] text-slate-400">Auctions</p>
                              </div>
                              <span className="text-slate-400 hidden lg:block">{isExpanded ? '▲' : '▼'}</span>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3 overflow-x-auto">
                              {group.auctions.map((auction) => {
                                const currentBid = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');
                                const minSpread = parseFloat(auction.minimum_spread || '1.00');
                                const minNextBid = currentBid + minSpread;
                                const isUpcoming = new Date(auction.start_time!).getTime() > new Date().getTime();

                                return (
                                  <div key={auction.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-3 border-b border-slate-100 last:border-0 gap-2 min-w-[700px]">
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium text-slate-600">Auction #{auction.id}</span>
                                      <span className="text-slate-400"><Timer endTime={auction.end_time!} startTime={auction.start_time!} /></span>
                                      {activeContentTab === 'Won Bids' ? (
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Won</span>
                                      ) : isUpcoming ? (
                                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">Upcoming</span>
                                      ) : (
                                        <div className="flex gap-2">
                                          <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">Live</span>
                                          {auction.highest_bidder_id === customer?.id ? (
                                            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">Winning</span>
                                          ) : auction.user_has_bid ? (
                                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">Outbid</span>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 ml-auto">
                                      <div className="min-w-[60px]">
                                        <p className="text-slate-400 text-[10px]">Current Bid</p>
                                        <p className="font-semibold text-slate-800">₹{currentBid.toLocaleString('en-IN')}</p>
                                      </div>
                                      <div className="min-w-[50px]">
                                        <p className="text-slate-400 text-[10px]">Bids</p>
                                        <p className="font-semibold text-slate-800">{auction.total_bids || 0}</p>
                                      </div>
                                      
                                      {/* Bid Input and Button / Pay Now Button */}
                                      {activeContentTab === 'Won Bids' ? (
                                        <div className="flex items-center gap-2">
                                          <a
                                            href="/orders"
                                            className="bg-green-500 text-white px-4 py-1.5 rounded text-[11px] font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                                          >
                                            Pay Now
                                          </a>
                                        </div>
                                      ) : (
                                          <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                placeholder={`Min ₹${minNextBid.toFixed(2)}`}
                                                className="w-28 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 disabled:bg-slate-50"
                                                value={bidAmounts[auction.id!] || ''}
                                                onChange={(e) => handleBidChange(auction.id!, e.target.value)}
                                                disabled={isUpcoming}
                                              />
                                              <button
                                                onClick={() => handlePlaceBid(auction.id!, auction.current_highest_bid || auction.reserve_price || '0', auction.minimum_spread || '1.00')}
                                                className="bg-orange-500 text-white px-3 py-1 rounded text-[10px] font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:hover:bg-orange-500"
                                                disabled={isUpcoming}
                                              >
                                                Place Bid
                                              </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400">10% wallet balance required</p>
                                          </div>
                                      )}
                                      
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/live-auction/${auction.id}`)}
                                        className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                                      >
                                        Details
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Bar (Ending Soon Carousel) */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 text-xl">⏰</span>
                    <div>
                      <p className="font-semibold">{endingSoonCount} Auctions ending soon</p>
                      <p className="text-xs text-slate-400">Don't miss your chance!</p>
                    </div>
                  </div>
                  
                  <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap">View All Ending Soon</button>
                </div>
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
          <aside className="w-80 border-l border-slate-100 bg-white p-6 space-y-6 overflow-auto hidden xl:block">
            {/* Live Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Live Activity</h2>
                <button className="text-xs text-blue-500 hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500">No recent activity.</p>
                ) : (
                  activities.map(activity => {
                    const isMe = customer?.id && activity.bidder_id === customer.id;
                    const outbidMe = customer?.id && activity.previous_bidder_id === customer.id;
                    
                    let title = "New Highest Bid";
                    let titleColor = "text-green-500";
                    let icon = "🔨";
                    let iconBg = "bg-green-50 text-green-500";
                    
                    if (isMe) {
                      title = "You're Winning";
                      titleColor = "text-green-600";
                      icon = "🏆";
                      iconBg = "bg-green-100 text-green-600";
                    } else if (outbidMe) {
                      title = "Outbid";
                      titleColor = "text-red-500";
                      icon = "⚠️";
                      iconBg = "bg-red-50 text-red-500";
                    }
                    
                    const timeAgo = Math.floor((new Date().getTime() - new Date(activity.timestamp).getTime()) / 60000);
                    const timeStr = timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`;

                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${iconBg}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-xs ${titleColor}`}>{title}</p>
                            <span className="text-[10px] text-slate-400">{timeStr}</span>
                          </div>
                          {isMe ? (
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              You are the highest bidder on <span className="font-semibold text-slate-800">{activity.product_name}</span> at <span className="font-semibold text-slate-800">₹{activity.amount?.toLocaleString('en-IN')}</span>
                            </p>
                          ) : outbidMe ? (
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              You were outbid by <span className="font-semibold text-slate-800">{activity.bidder_name || 'Someone'}</span> on <span className="font-semibold text-slate-800">{activity.product_name}</span> with <span className="font-semibold text-slate-800">₹{activity.amount?.toLocaleString('en-IN')}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              <span className="font-semibold text-slate-800">{activity.bidder_name || 'Someone'}</span> bid <span className="font-semibold text-slate-800">₹{activity.amount?.toLocaleString('en-IN')}</span> on <span className="font-semibold text-slate-800">{activity.product_name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Bid Comparison */}
            <div>
              <div className="mb-4">
                <h2 className="font-bold text-slate-900">Bid Comparison</h2>
              </div>
              
              {!comparisonAuction ? (
                <p className="text-xs text-slate-500">No active auctions to compare.</p>
              ) : (
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <p className="font-medium text-sm text-slate-800 truncate pr-2">{comparisonAuction.product_name}</p>
                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">LIVE</span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Highest Bid */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Highest Bid</span>
                        <span className="font-bold text-slate-800">₹{parseFloat(comparisonAuction.current_highest_bid || comparisonAuction.reserve_price || '0').toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-slate-900 h-full rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    {/* Your Bid */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Your Bid</span>
                        <span className="font-bold text-slate-800">₹{comparisonAuction.user_highest_bid ? parseFloat(comparisonAuction.user_highest_bid).toLocaleString('en-IN') : '0'}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: comparisonAuction.user_highest_bid ? `${Math.min(100, Math.max(5, (parseFloat(comparisonAuction.user_highest_bid) / parseFloat(comparisonAuction.current_highest_bid || comparisonAuction.reserve_price || '1')) * 85))}%` : '0%' }}></div>
                      </div>
                    </div>
                    
                    {/* Recommended Next Bid */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Recommended Next Bid</span>
                        <span className="font-bold text-slate-800">₹{(parseFloat(comparisonAuction.current_highest_bid || comparisonAuction.reserve_price || '0') + parseFloat(comparisonAuction.minimum_spread || '1')).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Winning Probability */}
            <div>
              <h2 className="font-bold text-slate-900 mb-4">Winning Probability</h2>
              <div className="relative w-40 h-20 mx-auto">
                {/* SVG half circle for probability */}
                <svg viewBox="0 0 100 50" className="w-40 h-20 absolute top-0 left-0">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#F1F5F9" strokeWidth="12" strokeLinecap="round" />
                  {winningProbability !== null && (
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke="#22C55E" 
                      strokeWidth="12" 
                      strokeLinecap="round"
                      strokeDasharray="125.6"
                      strokeDashoffset={125.6 - (125.6 * winningProbability) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
                  <span className="text-2xl font-bold text-slate-800">{winningProbability !== null ? `${winningProbability}%` : '0%'}</span>
                  <span className="text-xs text-slate-500 font-semibold">{winningProbability !== null ? 'Your Win Rate' : 'No Data'}</span>
                </div>
              </div>
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
    <div onClick={onClick} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white text-orange-500' : 'bg-slate-700 text-white'}`}>{badge}</span>}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, iconBg, iconColor, highlight }: { title: string, value: string, subtitle: string, icon: string, iconBg: string, iconColor: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-orange-200 bg-orange-50' : 'border-slate-100 bg-white'} shadow-sm`}>
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
    <button onClick={onClick} className={`text-sm font-medium pb-2 whitespace-nowrap transition-colors ${active ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-700'}`}>
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
        className="appearance-none px-3 py-1.5 pr-8 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer whitespace-nowrap"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▼</span>
    </div>
  );
}
