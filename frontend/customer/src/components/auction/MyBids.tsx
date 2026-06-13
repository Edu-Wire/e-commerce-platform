import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMyBids, type MyBidAuction } from '../../hooks/useMyBids';
import { api } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';

function parseImages(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
}

function productImageUrl(raw: string | string[] | undefined): string {
  const images = parseImages(raw);
  const first = images[0];
  let url = typeof first === 'string' ? first : (first as { url?: string })?.url || '/placeholder.png';
  if (url.startsWith('/')) url = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${url}`;
  return url;
}

function isWinning(bid: MyBidAuction, customerId?: number): boolean {
  if (!customerId || bid.highest_bidder_id == null) return false;
  return Number(bid.highest_bidder_id) === Number(customerId);
}

export default function MyBids() {
  const navigate = useNavigate();
  const customer = useAuthStore((s) => s.customer);
  const token = useAuthStore((s) => s.token);
  const [activeTab, setActiveTab] = useState<'All Bids' | 'Winning' | 'Outbid'>('All Bids');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bids = [], isLoading, isError, refetch } = useMyBids(!!token, customer?.id);

  const { data: recommendations = [] } = useQuery({
    queryKey: ['auctions', 'recommendations'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: MyBidAuction[] }>('/auctions/active');
      const all = Array.isArray(res.data.data) ? res.data.data : [];
      return all
        .filter((a: { id?: number | null; user_has_bid?: boolean }) => a.id && !a.user_has_bid)
        .slice(0, 4) as MyBidAuction[];
    },
    enabled: !!token,
  });

  const stats = useMemo(() => {
    let winning = 0;
    let outbid = 0;
    bids.forEach((b) => {
      if (isWinning(b, customer?.id)) winning++;
      else outbid++;
    });
    return { active: bids.length, winning, outbid };
  }, [bids, customer?.id]);

  const filteredBids = useMemo(() => {
    return bids.filter((bid) => {
      if (activeTab === 'Winning' && !isWinning(bid, customer?.id)) return false;
      if (activeTab === 'Outbid' && isWinning(bid, customer?.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!bid.product_name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [bids, activeTab, searchQuery, customer?.id]);

  const totalBidValue = bids.reduce((acc, b) => acc + parseFloat(b.user_highest_bid || '0'), 0);

  if (!token) {
    return (
      <div className="font-sans">
        <Header />
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm mt-6">
          <div className="w-16 h-16 bg-[#EBF7F2] text-[#0FA86E] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎯</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view your bids</h2>
          <p className="text-sm text-slate-500 mb-6">Track winning and outbid auctions in one place.</p>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: '/live-auction/my-bids' } })}
            className="bg-[#0FA86E] hover:bg-[#0d9561] text-white font-bold px-6 py-2.5 rounded-lg text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="font-sans">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0FA86E]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-sans">
        <Header />
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center mt-6">
          <p className="text-slate-700 font-medium mb-4">Could not load your bids.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="bg-[#0FA86E] text-white text-sm font-bold px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <Header />
        <div className="flex gap-4">
          <StatPill label="Total Bid Value" value={`₹${totalBidValue.toLocaleString('en-IN')}`} color="green" subtitle="Across all auctions" />
          <StatPill label="Active Bids" value={String(stats.active)} color="purple" subtitle="Live now" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 border-b border-slate-100 flex-wrap gap-4">
          <div className="flex gap-8">
            {(['All Bids', 'Winning', 'Outbid'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count = tab === 'All Bids' ? stats.active : tab === 'Winning' ? stats.winning : stats.outbid;
              
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-extrabold transition-all relative flex items-center gap-2 ${
                    isActive
                      ? 'text-[#0FA86E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#0FA86E]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      isActive ? 'bg-[#EBF7F2] text-[#0FA86E]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 py-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, product or auction..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0FA86E] w-64 transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            
            {/* Filter icon button */}
            <button className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            </button>
          </div>
        </div>

        <div className="p-2">
          {filteredBids.length === 0 ? (
            <EmptyState hasBids={bids.length > 0} activeTab={activeTab} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Product Detail</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Current Bid</th>
                    <th className="px-4 py-3">Your Bid</th>
                    <th className="px-4 py-3">Time Left</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBids.map((bid) => (
                    <BidRow key={bid.id} bid={bid} customerId={customer?.id} onOpen={() => navigate(`/live-auction/${bid.id}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Middle Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#F4FDF9] border border-[#D5E6CD]/30 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#0FA86E]/10 flex items-center justify-center text-[#0FA86E] flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800">Live Auctions</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Join live auctions and compete in real-time</p>
          </div>
        </div>

        <div className="bg-[#EBF3FC] border border-[#D1E2F5]/30 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#2F80ED]/10 flex items-center justify-center text-[#2F80ED] flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800">Secure Bidding</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Your bids are safe and secure with us</p>
          </div>
        </div>

        <div className="bg-[#FFF9EC] border border-[#FFE8CC]/30 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#F0A85E]/10 flex items-center justify-center text-[#F0A85E] flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800">Best Deals</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Win amazing products at lowest prices</p>
          </div>
        </div>

        <div className="bg-[#FBF4FC] border border-[#ECD9F7]/30 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#9B51E0]/10 flex items-center justify-center text-[#9B51E0] flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800">Track Easily</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Track all your bids in one place</p>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {recommendations.map((item: MyBidAuction & { id: number }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/live-auction/${item.id}`)}
                className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-left hover:shadow-md transition-all"
              >
                <div className="aspect-video bg-slate-50 rounded-lg mb-3 overflow-hidden">
                  <img
                    src={productImageUrl(item.product_images)}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png';
                    }}
                  />
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate mb-1">{item.product_name}</h4>
                <p className="text-[11px] font-bold text-[#0FA86E]">
                  ₹{parseFloat(item.current_highest_bid || item.reserve_price || '0').toLocaleString('en-IN')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Footer Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800">100% Secure</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Your transactions are safe with us</p>
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
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800">Trusted Platform</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Thousands of happy customers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5 font-medium">
        <Link to="/live-auction" className="hover:text-[#0FA86E] transition-colors">
          Home
        </Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-700">My Bids</span>
      </div>
      <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Bidding Activity</h1>
      <p className="text-xs text-slate-500 mt-1">Track and manage all auctions you are participating in.</p>
    </div>
  );
}

function StatPill({ label, value, color, subtitle }: { label: string; value: string; color: 'green' | 'purple'; subtitle: string }) {
  const bg = color === 'green' ? 'bg-[#F4FDF9] border border-[#D5E6CD]/30' : 'bg-[#F6F5FF] border border-[#E1DFFC]/30';
  const iconBg = color === 'green' ? 'bg-[#0FA86E]/10 text-[#0FA86E]' : 'bg-[#6366F1]/10 text-[#6366F1]';
  const icon = color === 'green' ? '₹' : '🔨';
  
  return (
    <div className={`px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[200px] shadow-sm ${bg}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-slate-800 mt-0.5">{value}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ hasBids, activeTab }: { hasBids: boolean; activeTab: string }) {
  const navigate = useNavigate();
  return (
    <div className="py-16 text-center flex flex-col items-center justify-center">
      {/* Clipboard / Magnifying Glass SVG Vector Illustration */}
      <div className="w-52 h-40 mb-6 relative flex items-center justify-center">
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
          {/* Target in background */}
          <circle cx="50" cy="50" r="25" fill="#EBF7F2" />
          <circle cx="50" cy="50" r="18" fill="white" />
          <circle cx="50" cy="50" r="10" stroke="#A2E0C1" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="4" fill="#0FA86E" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="#A2E0C1" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="#A2E0C1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Plant/Leaves */}
          <path d="M125 90 C120 75 110 70 100 80 C95 85 92 90 95 95 C100 100 115 100 125 90 Z" fill="#E2F0D9" opacity="0.7" />
          <path d="M132 82 C135 68 145 65 152 75 C155 80 155 88 150 92 C142 96 135 90 132 82 Z" fill="#A2E0C1" opacity="0.5" />

          {/* Clipboard shadow */}
          <rect x="73" y="38" width="44" height="58" rx="6" fill="#F8FAFC" />
          
          {/* Clipboard board */}
          <rect x="70" y="35" width="44" height="58" rx="6" stroke="#94A3B8" strokeWidth="3" fill="white" />
          
          {/* Clip */}
          <rect x="83" y="27" width="18" height="12" rx="3" fill="#64748B" />
          <circle cx="92" cy="31" r="2.5" fill="white" />
          
          {/* Document Lines */}
          <line x1="78" y1="50" x2="106" y2="50" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="78" y1="60" x2="100" y2="60" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="78" y1="70" x2="106" y2="70" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="78" y1="80" x2="94" y2="80" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Magnifying Glass */}
          {/* Glass circle */}
          <circle cx="110" cy="70" r="16" fill="white" stroke="#0FA86E" strokeWidth="3.5" />
          {/* Glass shine */}
          <path d="M100 66 A 10 10 0 0 1 114 58" stroke="#A2E0C1" strokeWidth="2" strokeLinecap="round" />
          {/* Handle */}
          <path d="M122 82 L132 92" stroke="#64748B" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="text-slate-800 font-extrabold text-lg">
        {hasBids ? 'No bids match this filter' : 'No active bids yet'}
      </h3>
      <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
        {hasBids
          ? 'Try another tab or clear your search query.'
          : 'You haven\'t placed any bids in live auctions.\nExplore auctions and place your first bid to get started!'}
      </p>

      {!hasBids && (
        <button
          onClick={() => navigate('/live-auction')}
          className="mt-6 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <span>Explore Live Auctions</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
      )}
    </div>
  );
}

function BidRow({
  bid,
  customerId,
  onOpen,
}: {
  bid: MyBidAuction;
  customerId?: number;
  onOpen: () => void;
}) {
  const winning = isWinning(bid, customerId);
  const currentBid = parseFloat(bid.current_highest_bid || bid.reserve_price || '0');
  const minNext = currentBid + parseFloat(bid.minimum_spread || '1');

  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
            <img
              src={productImageUrl(bid.product_images)}
              alt={bid.product_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.png';
              }}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 group-hover:text-[#0FA86E] transition-colors truncate max-w-[200px]">
              {bid.product_name}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Auction #{bid.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        {winning ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF7F2] text-[#0FA86E] text-[10px] font-bold border border-[#D5E6CD]/30">
            <span className="w-1.5 h-1.5 bg-[#0FA86E] rounded-full animate-pulse" />
            Winning
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Outbid
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="text-sm font-bold text-slate-900">₹{currentBid.toLocaleString('en-IN')}</p>
        <p className="text-[10px] text-slate-400 font-medium">{bid.total_bids || 0} total bids</p>
      </td>
      <td className="px-4 py-4">
        <p className={`text-sm font-bold ${winning ? 'text-[#0FA86E]' : 'text-slate-900'}`}>
          ₹{parseFloat(bid.user_highest_bid || '0').toLocaleString('en-IN')}
        </p>
        {!winning && <p className="text-[10px] text-red-400 font-medium italic mt-0.5">Min next: ₹{minNext.toLocaleString('en-IN')}</p>}
      </td>
      <td className="px-4 py-4">
        <Timer endTime={bid.end_time} />
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="p-2 text-slate-400 hover:text-[#0FA86E] hover:bg-[#EBF7F2] rounded-lg transition-all"
            title="View Details"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="bg-[#0FA86E] hover:bg-[#0d9561] text-white text-[11px] font-bold px-4 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            {winning ? 'Manage Bid' : 'Re-bid'}
          </button>
        </div>
      </td>
    </tr>
  );
}

function Timer({ endTime }: { endTime?: string }) {
  const [timeLeft, setTimeLeft] = useState('—');

  useEffect(() => {
    if (!endTime) {
      setTimeLeft('—');
      return;
    }

    const calculateTime = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const isEndingSoon = timeLeft.startsWith('0h') && timeLeft !== 'Ended' && timeLeft !== '—';

  return (
    <div className={`text-[11px] font-bold ${isEndingSoon ? 'text-red-500' : 'text-slate-600'}`}>{timeLeft}</div>
  );
}
