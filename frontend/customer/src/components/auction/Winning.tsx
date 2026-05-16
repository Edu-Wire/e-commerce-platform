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
  if (url.startsWith('/')) url = `http://localhost:4000${url}`;
  return url;
}

function paymentLabel(auction: WinningAuction): { label: string; className: string } {
  const status = auction.order_status;
  if (!status || status === 'pending') {
    return { label: 'Payment Pending', className: 'bg-orange-50 text-orange-600 border-orange-100' };
  }
  if (status === 'confirmed' || status === 'processing') {
    return { label: 'Paid', className: 'bg-blue-50 text-blue-600 border-blue-100' };
  }
  if (status === 'shipped') {
    return { label: 'Shipped', className: 'bg-purple-50 text-purple-600 border-purple-100' };
  }
  if (status === 'delivered') {
    return { label: 'Delivered', className: 'bg-green-50 text-green-600 border-green-100' };
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
        <PageHeader />
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
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
          <button type="button" onClick={() => refetch()} className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-lg">
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

          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setTab('live')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                tab === 'live' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Currently Winning ({liveWinning.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('won')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                tab === 'won' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Won Auctions ({won.length})
            </button>
          </div>

          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm gap-3 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs w-48 focus:ring-1 focus:ring-orange-500 outline-none"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <button type="button" onClick={handleExport} className="border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50">
              Export CSV
            </button>
          </div>

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

        <Sidebar stats={stats} onBidMore={() => navigate('/live-auction')} pendingPayment={stats?.pending_payment ?? 0} />
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200 text-xl">
        🏆
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-1">
          <Link to="/live-auction" className="hover:text-blue-600">Home</Link>
          <span className="mx-1">&gt;</span>
          <span className="text-slate-700">Winning</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Winning Bids</h1>
        <p className="text-sm text-slate-500 mt-0.5">Live wins and completed auction victories.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-500',
    blue: 'bg-blue-50 text-blue-500',
    orange: 'bg-orange-50 text-orange-500',
    purple: 'bg-purple-50 text-purple-500',
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>
        <span className="text-sm font-bold">●</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="font-bold text-slate-900 text-lg leading-tight">{value}</p>
        <p className="text-[9px] text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: 'live' | 'won' }) {
  return (
    <div className="bg-white rounded-xl p-16 text-center border border-slate-100 shadow-sm">
      <div className="text-4xl mb-4">🏆</div>
      <h3 className="text-slate-900 font-bold">{tab === 'live' ? 'No live winning bids' : 'No won auctions yet'}</h3>
      <p className="text-slate-500 text-xs mt-1">
        {tab === 'live' ? 'Place the highest bid on a live auction to appear here.' : 'Win an auction to see it here with payment options.'}
      </p>
      <Link to="/live-auction" className="mt-4 inline-block bg-orange-500 text-white text-xs font-bold py-2 px-6 rounded-lg hover:bg-orange-600">
        Explore Auctions
      </Link>
    </div>
  );
}

function LiveWinningCard({ auction, onOpen }: { auction: WinningAuction; onOpen: () => void }) {
  const amount = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');

  return (
    <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
      <div className="relative w-32 h-24 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden">
        <span className="absolute top-2 left-2 bg-green-500 text-white px-1.5 py-0.5 rounded text-[8px] font-bold z-10">WINNING</span>
        <img src={parseImageUrl(auction.product_images)} alt={auction.product_name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 text-sm truncate">{auction.product_name}</h3>
        <p className="text-[10px] text-slate-500">Auction #{auction.id} · {auction.total_bids ?? 0} bids</p>
        <p className="text-lg font-bold text-green-600 mt-2">₹{amount.toLocaleString('en-IN')}</p>
      </div>
      <div className="text-center min-w-[120px]">
        <p className="text-[10px] text-slate-400 mb-1">Ends in</p>
        <Countdown endTime={auction.end_time} />
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={onOpen} className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-[11px] font-bold hover:bg-orange-600 w-28">
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
        <span className="absolute top-2 left-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[8px] font-bold border border-green-200 z-10">WON</span>
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
            <p className="font-bold text-green-600">₹{savings.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
      <div className="text-right min-w-[120px] border-r border-slate-100 pr-4">
        <p className="text-[10px] text-slate-400">Winning Bid</p>
        <p className="font-bold text-slate-900">₹{won.toLocaleString('en-IN')}</p>
        <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 rounded mt-1 inline-block">Saved {savingsPercent}%</span>
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
          <button type="button" onClick={onPay} className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-[11px] font-bold hover:bg-orange-600 w-28">
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
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 text-sm">Winning Summary</h3>
        <div className="space-y-3 text-sm">
          <Row label="Won Auctions" value={String(stats?.won_count ?? 0)} />
          <Row label="Total Value" value={`₹${(stats?.total_won_value ?? 0).toLocaleString('en-IN')}`} />
          <Row label="Total Savings" value={`₹${(stats?.total_savings ?? 0).toLocaleString('en-IN')}`} valueClass="text-green-600" />
          <Row label="Pending Payment" value={String(pendingPayment)} valueClass={pendingPayment > 0 ? 'text-orange-600' : ''} />
        </div>
      </div>
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800">
        <h3 className="font-bold mb-1">Keep Winning!</h3>
        <p className="text-xs text-slate-300 mb-4">Browse live auctions and place your best bid.</p>
        <button type="button" onClick={onBidMore} className="bg-orange-500 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 w-full">
          Bid More
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
