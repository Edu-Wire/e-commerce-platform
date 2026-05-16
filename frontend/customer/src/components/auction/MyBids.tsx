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
  if (url.startsWith('/')) url = `http://localhost:4000${url}`;
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
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎯</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view your bids</h2>
          <p className="text-sm text-slate-500 mb-6">Track winning and outbid auctions in one place.</p>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: '/live-auction/my-bids' } })}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm"
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
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
            className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg"
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
        <div className="flex gap-3">
          <StatPill label="Total Bid Value" value={`₹${totalBidValue.toLocaleString('en-IN')}`} color="blue" />
          <StatPill label="Active Bids" value={String(stats.active)} color="orange" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center justify-between px-6 border-b border-slate-50 flex-wrap gap-3">
          <div className="flex gap-8">
            {(['All Bids', 'Winning', 'Outbid'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-bold transition-all relative ${
                  activeTab === tab
                    ? 'text-orange-500 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-orange-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                <span
                  className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab === 'All Bids' ? stats.active : tab === 'Winning' ? stats.winning : stats.outbid}
                </span>
              </button>
            ))}
          </div>
          <div className="relative py-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name..."
              className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 w-48"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
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

      {recommendations.length > 0 && (
        <div>
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
                <p className="text-[11px] font-bold text-orange-500">
                  ₹{parseFloat(item.current_highest_bid || item.reserve_price || '0').toLocaleString('en-IN')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-2">
        <Link to="/live-auction" className="hover:text-blue-600">
          Home
        </Link>
        <span className="mx-1">&gt;</span>
        <span className="text-slate-700">My Bids</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">My Bidding Activity</h1>
      <p className="text-sm text-slate-500 mt-1">Track and manage all auctions you are participating in.</p>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: 'blue' | 'orange' }) {
  const bg = color === 'blue' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500';
  return (
    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
        <span className="text-xs font-bold">{color === 'blue' ? '₹' : '⏱'}</span>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ hasBids, activeTab }: { hasBids: boolean; activeTab: string }) {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 text-2xl">
        🎯
      </div>
      <h3 className="text-slate-900 font-bold">{hasBids ? 'No bids match this filter' : 'No active bids yet'}</h3>
      <p className="text-slate-500 text-xs mt-1">
        {hasBids
          ? `Try another tab or clear your search.`
          : 'Place a bid on a live auction to see it here.'}
      </p>
      {!hasBids && (
        <Link
          to="/live-auction"
          className="mt-4 inline-block bg-orange-500 text-white text-xs font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Browse Auctions
        </Link>
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
            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">
              {bid.product_name}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Auction #{bid.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        {winning ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold border border-green-100">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
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
        <p className={`text-sm font-bold ${winning ? 'text-green-600' : 'text-slate-900'}`}>
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
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
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
            className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg transition-colors shadow-sm shadow-orange-100"
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
