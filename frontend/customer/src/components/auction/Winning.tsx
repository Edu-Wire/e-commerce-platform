import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useWinning, type WinningAuction } from '../../hooks/useWinning';

function parseImageUrl(raw: string | string[] | undefined): string {
  if (!raw) return '/placeholder.png';
  let images: unknown[] = [];
  try {
    images = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return '/placeholder.png';
  }
  const first = images[0];
  let url = typeof first === 'string' ? first : (first as { url?: string })?.url || '/placeholder.png';
  if (url.startsWith('/')) url = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${url}`;
  return url;
}

function paymentLabel(auction: WinningAuction): { label: string; className: string } {
  const status = auction.order_status;
  if (!status || status === 'pending') {
    return { label: 'Payment Pending', className: 'bg-[#FFF9EC] text-[#F0A85E] border-[#FFE8CC]/30' };
  }
  if (status === 'confirmed' || status === 'processing') {
    return { label: 'Paid', className: 'bg-blue-50 text-blue-600 border-blue-100' };
  }
  if (status === 'shipped') {
    return { label: 'Shipped', className: 'bg-purple-50 text-purple-600 border-purple-100' };
  }
  if (status === 'delivered') {
    return { label: 'Delivered', className: 'bg-[#EBF7F2] text-[#0FA86E] border-[#D5E6CD]/30' };
  }
  if (status === 'cancelled' || status === 'refunded') {
    return { label: 'Cancelled', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  return { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function shippingLabel(auction: WinningAuction): string {
  const status = auction.order_status;
  if (!status || status === 'pending') return 'Awaiting Payment';
  if (status === 'confirmed' || status === 'processing') return 'Preparing Shipment';
  if (status === 'shipped') return 'In Transit';
  if (status === 'delivered') return 'Delivered';
  return '—';
}

export default function Winning() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const customer = useAuthStore((s) => s.customer);
  const [tab, setTab] = useState<'live' | 'won'>('live');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useWinning(!!token, customer?.id);

  const liveWinning = data?.live_winning ?? [];
  const won = data?.won ?? [];
  const stats = data?.stats;

  const filteredLive = useMemo(() => {
    if (!search.trim()) return liveWinning;
    const q = search.toLowerCase();
    return liveWinning.filter((a) => a.product_name?.toLowerCase().includes(q));
  }, [liveWinning, search]);

  const filteredWon = useMemo(() => {
    if (!search.trim()) return won;
    const q = search.toLowerCase();
    return won.filter((a) => a.product_name?.toLowerCase().includes(q));
  }, [won, search]);

  const handleExport = () => {
    const rows = [
      ['Type', 'Auction ID', 'Product', 'Amount', 'Status', 'Ended'],
      ...liveWinning.map((a) => [
        'Live Winning',
        a.id,
        a.product_name,
        a.current_highest_bid,
        'Winning',
        a.end_time,
      ]),
      ...won.map((a) => [
        'Won',
        a.id,
        a.product_name,
        a.current_highest_bid,
        a.order_status || 'pending',
        a.end_time,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'winning-auctions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <div className="font-sans">
        <PageHeader />
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm mt-6">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view your wins</h2>
          <p className="text-sm text-slate-500 mb-6">Track live winning bids and completed auction wins.</p>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: '/live-auction/winning' } })}
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
        <PageHeader />
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0FA86E]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-sans">
        <PageHeader />
        <div className="bg-white rounded-xl border border-red-100 p-8 text-center mt-6">
          <p className="text-slate-700 mb-4">Could not load winning data.</p>
          <button type="button" onClick={() => refetch()} className="bg-[#0FA86E] text-white text-sm font-bold px-4 py-2 rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const list = tab === 'live' ? filteredLive : filteredWon;

  return (
    <div className="font-sans">
      <PageHeader />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Live Winning" value={String(stats?.live_count ?? 0)} sub="Active auctions" color="green" />
            <StatCard label="Won" value={String(stats?.won_count ?? 0)} sub="Completed" color="blue" />
            <StatCard
              label="Saved"
              value={`₹${(stats?.total_savings ?? 0).toLocaleString('en-IN')}`}
              sub="On won items"
              color="orange"
            />
            <StatCard label="Shipped" value={String(stats?.shipped ?? 0)} sub="Orders fulfilled" color="purple" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-6 border-b border-slate-100 flex-wrap gap-4">
              <div className="flex gap-8">
                <button
                  type="button"
                  onClick={() => setTab('live')}
                  className={`py-4 text-sm font-extrabold transition-all relative flex items-center gap-2 ${
                    tab === 'live'
                      ? 'text-[#0FA86E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#0FA86E]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>Currently Winning</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      tab === 'live' ? 'bg-[#EBF7F2] text-[#0FA86E]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {liveWinning.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('won')}
                  className={`py-4 text-sm font-extrabold transition-all relative flex items-center gap-2 ${
                    tab === 'won'
                      ? 'text-[#0FA86E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#0FA86E]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>Won Auctions</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      tab === 'won' ? 'bg-[#EBF7F2] text-[#0FA86E]' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {won.length}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2 py-3">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by product name or keyword..."
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#0FA86E] w-60 transition-all"
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
                
                <select className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 bg-slate-50 outline-none cursor-pointer">
                  <option>All Categories</option>
                  <option>Electronics</option>
                  <option>Footwear</option>
                  <option>Accessories</option>
                </select>

                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-2 border border-[#0FA86E] hover:bg-[#EBF7F2] text-[#0FA86E] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="p-2">
              <div className="space-y-4">
                {list.length === 0 ? (
                  <EmptyState tab={tab} />
                ) : tab === 'live' ? (
                  filteredLive.map((auction) => (
                    <LiveWinningCard key={auction.id} auction={auction} onOpen={() => navigate(`/live-auction/${auction.id}`)} />
                  ))
                ) : (
                  filteredWon.map((auction) => (
                    <WonCard key={auction.id} auction={auction} onPay={() => navigate(`/live-auction/payments?auction=${auction.id}`)} onOpen={() => navigate(`/live-auction/${auction.id}`)} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <Sidebar stats={stats} onBidMore={() => navigate('/live-auction')} pendingPayment={stats?.pending_payment ?? 0} />
      </div>

      {/* Bottom Footer Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" /></svg>
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
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6 flex items-center gap-4">
      {/* Trophy with Laurel Wreath SVG Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[#F4FDF9] border border-[#D5E6CD]/30 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          {/* Laurel Wreath */}
          <path d="M9 24 Q6 18 9 10 Q12 18 9 24 Z" fill="#A2E0C1" />
          <path d="M27 24 Q30 18 27 10 Q24 18 27 24 Z" fill="#A2E0C1" />
          {/* Trophy Cup */}
          <path d="M13 11 H23 V18 C23 21 21 24 18 24 C15 24 13 21 13 18 Z" fill="#F0A85E" stroke="#E07A22" strokeWidth="1.5" />
          {/* Handles */}
          <path d="M13 13 H10 V17 H13" stroke="#E07A22" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M23 13 H26 V17 H23" stroke="#E07A22" strokeWidth="1.5" strokeLinecap="round" />
          {/* Pedestal */}
          <rect x="15" y="27" width="6" height="3" fill="#D5E6CD" />
          <path d="M14 24 H22 V27 H14 Z" fill="#64748B" />
        </svg>
      </div>
      <div>
        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
          <Link to="/live-auction" className="hover:text-[#0FA86E] transition-colors">Home</Link>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600">Winning</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Winning Bids</h1>
        <p className="text-xs text-slate-500 mt-1">Live wins and completed auction victories.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'green' | 'blue' | 'orange' | 'purple' }) {
  const configs = {
    green: {
      bg: 'bg-[#F4FDF9] border-[#D5E6CD]/30',
      iconBg: 'bg-[#0FA86E]/10 text-[#0FA86E]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
          <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
        </svg>
      )
    },
    blue: {
      bg: 'bg-[#F0F4FE] border-[#D0E0FC]/30',
      iconBg: 'bg-[#2F80ED]/10 text-[#2F80ED]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    },
    orange: {
      bg: 'bg-[#FFF9EC] border-[#FFE8CC]/30',
      iconBg: 'bg-[#F0A85E]/10 text-[#F0A85E]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      )
    },
    purple: {
      bg: 'bg-[#F6F5FF] border-[#E1DFFC]/30',
      iconBg: 'bg-[#9B51E0]/10 text-[#9B51E0]',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      )
    }
  };

  const conf = configs[color];

  return (
    <div className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3.5 ${conf.bg}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${conf.iconBg}`}>
        {conf.icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="font-black text-slate-800 text-lg leading-tight mt-0.5">{value}</p>
        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: 'live' | 'won' }) {
  const navigate = useNavigate();
  return (
    <div className="py-16 text-center flex flex-col items-center justify-center">
      {/* Clipboard / Checkmarks Vector SVG Illustration */}
      <div className="w-52 h-40 mb-6 relative flex items-center justify-center">
        <svg width="180" height="140" viewBox="0 0 180 140" fill="none">
          {/* Target / circular graphic */}
          <circle cx="50" cy="50" r="25" fill="#EBF7F2" />
          <circle cx="50" cy="50" r="18" fill="white" />
          <circle cx="50" cy="50" r="10" stroke="#A2E0C1" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="4" fill="#0FA86E" />

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
        </svg>
      </div>

      <h3 className="text-slate-800 font-extrabold text-lg">
        {tab === 'live' ? 'No live winning bids' : 'No won auctions yet'}
      </h3>
      <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
        {tab === 'live' ? 'Place the highest bid on a live auction to appear here.' : 'Win an auction to see it here with payment options.'}
      </p>

      <button
        onClick={() => navigate('/live-auction')}
        className="mt-6 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm"
      >
        Explore Live Auctions
      </button>
    </div>
  );
}

function LiveWinningCard({ auction, onOpen }: { auction: WinningAuction; onOpen: () => void }) {
  const amount = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');

  return (
    <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
      <div className="relative w-32 h-24 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden">
        <span className="absolute top-2 left-2 bg-[#0FA86E] text-white px-1.5 py-0.5 rounded text-[8px] font-bold z-10">WINNING</span>
        <img src={parseImageUrl(auction.product_images)} alt={auction.product_name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 text-sm truncate">{auction.product_name}</h3>
        <p className="text-[10px] text-slate-500">Auction #{auction.id} · {auction.total_bids ?? 0} bids</p>
        <p className="text-lg font-bold text-[#0FA86E] mt-2">₹{amount.toLocaleString('en-IN')}</p>
      </div>
      <div className="text-center min-w-[120px]">
        <p className="text-[10px] text-slate-400 mb-1">Ends in</p>
        <Countdown endTime={auction.end_time} />
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={onOpen} className="px-4 py-1.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white rounded-lg text-[11px] font-bold w-28">
          Manage Bid
        </button>
        <button type="button" onClick={onOpen} className="px-4 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold hover:bg-slate-50 w-28">
          View Details
        </button>
      </div>
    </div>
  );
}

function WonCard({
  auction,
  onPay,
  onOpen,
}: {
  auction: WinningAuction;
  onPay: () => void;
  onOpen: () => void;
}) {
  const pay = paymentLabel(auction);
  const mrp = parseFloat(auction.product_mrp || '0');
  const won = parseFloat(auction.current_highest_bid || '0');
  const savings = Math.max(0, mrp - won);
  const savingsPercent = mrp > 0 ? ((savings / mrp) * 100).toFixed(1) : '0';
  const needsPay = !auction.order_status || auction.order_status === 'pending';
  const paymentWindowMs = 6 * 60 * 60 * 1000;
  const canPay =
    needsPay && Date.now() - new Date(auction.end_time).getTime() < paymentWindowMs;

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
      <div className="relative w-32 h-24 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden">
        <span className="absolute top-2 left-2 bg-[#EBF7F2] text-[#0FA86E] px-1.5 py-0.5 rounded text-[8px] font-bold border border-[#D5E6CD]/30 z-10">WON</span>
        <img src={parseImageUrl(auction.product_images)} alt={auction.product_name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 text-sm truncate">{auction.product_name}</h3>
        <p className="text-[10px] text-slate-500 mb-2">Auction #{auction.id}</p>
        <div className="flex gap-6 text-xs">
          <div>
            <p className="text-slate-400 text-[10px]">Ended</p>
            <p className="font-semibold">{new Date(auction.end_time).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px]">Savings</p>
            <p className="font-bold text-[#0FA86E]">₹{savings.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
      <div className="text-right min-w-[120px] border-r border-slate-100 pr-4">
        <p className="text-[10px] text-slate-400">Winning Bid</p>
        <p className="font-bold text-slate-900">₹{won.toLocaleString('en-IN')}</p>
        <span className="text-[9px] font-bold text-[#0FA86E] bg-[#EBF7F2] px-1 rounded mt-1 inline-block">Saved {savingsPercent}%</span>
      </div>
      <div className="min-w-[130px]">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${pay.className}`}>{pay.label}</span>
        <p className="text-[10px] text-slate-400 mt-2">Shipping</p>
        <p className="text-[11px] font-semibold text-slate-600">{shippingLabel(auction)}</p>
        {needsPay && (
          <p className="text-[10px] text-red-500 mt-1">
            <PaymentExpiry windowStart={auction.end_time} />
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {canPay ? (
          <button type="button" onClick={onPay} className="px-4 py-1.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white rounded-lg text-[11px] font-bold w-28">
            Pay Now
          </button>
        ) : needsPay ? (
          <span className="px-4 py-1.5 text-center text-[10px] text-red-500 font-semibold w-28">
            Payment expired
          </span>
        ) : (
          <button type="button" onClick={() => onPay()} className="px-4 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold w-28 hover:bg-slate-50">
            View Order
          </button>
        )}
        <button type="button" onClick={onOpen} className="px-4 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold hover:bg-slate-50 w-28">
          Details
        </button>
      </div>
    </div>
  );
}

function Sidebar({
  stats,
  onBidMore,
  pendingPayment,
}: {
  stats?: { won_count: number; total_won_value: number; total_savings: number };
  onBidMore: () => void;
  pendingPayment: number;
}) {
  return (
    <div className="xl:col-span-4 space-y-6">
      {/* Winning Summary Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#0FA86E]/10 flex items-center justify-center text-[#0FA86E]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">Winning Summary</h3>
        </div>
        <div className="space-y-4">
          <Row label="Won Auctions" value={String(stats?.won_count ?? 0)} />
          <Row label="Total Value" value={`₹${(stats?.total_won_value ?? 0).toLocaleString('en-IN')}`} />
          <Row label="Total Savings" value={`₹${(stats?.total_savings ?? 0).toLocaleString('en-IN')}`} valueClass="text-[#0FA86E]" />
          <Row label="Pending Payment" value={String(pendingPayment)} valueClass={pendingPayment > 0 ? 'text-red-500' : 'text-slate-800'} />
        </div>
      </div>
      
      {/* Dark Green Promo Banner */}
      <div className="bg-[#052E16] rounded-2xl p-6 text-white border border-[#14532D] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        {/* Sparkles / Podium Background Graphic */}
        <div className="absolute right-2 bottom-2 w-28 h-28 pointer-events-none opacity-90 flex items-end justify-end">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            {/* Podium */}
            <path d="M15 80 L85 80 L75 95 L25 95 Z" fill="#15803D" />
            <rect x="30" y="65" width="40" height="15" fill="#166534" />
            {/* Trophy */}
            <path d="M38 30 H62 V50 C62 57 58 64 50 64 C42 64 38 57 38 50 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
            <path d="M38 35 H32 V44 H38" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M62 35 H68 V44 H62" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            {/* Sparkles */}
            <path d="M20 20 L22 23 L25 24 L22 25 L20 28 L18 25 L15 24 L18 23 Z" fill="#FBBF24" />
            <path d="M80 30 L82 33 L85 34 L82 35 L80 38 L78 35 L75 34 L78 33 Z" fill="#FBBF24" />
          </svg>
        </div>

        <div className="z-10">
          <h3 className="font-extrabold text-base tracking-tight">Keep Winning!</h3>
          <p className="text-xs text-green-200 mt-1 max-w-[70%] leading-relaxed">Browse live auctions and place your best bid.</p>
        </div>
        
        <button
          type="button"
          onClick={onBidMore}
          className="bg-white hover:bg-green-50 text-[#052E16] px-5 py-2.5 rounded-xl text-xs font-bold transition-all w-full flex items-center justify-center gap-1.5 shadow-sm z-10 mt-6"
        >
          <span>Bid More Auctions</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-slate-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 pb-2 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}

function Countdown({ endTime }: { endTime: string }) {
  const [text, setText] = useState('—');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setText('Ended');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return <p className="text-sm font-bold text-orange-600">{text}</p>;
}

function PaymentExpiry({ windowStart }: { windowStart: string }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const tick = () => {
      const expiry = new Date(windowStart).getTime() + 6 * 60 * 60 * 1000;
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setText('Payment expired');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setText(`Pay within ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowStart]);

  return <>{text}</>;
}
