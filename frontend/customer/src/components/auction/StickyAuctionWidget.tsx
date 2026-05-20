import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  retainAuctionSocket,
  releaseAuctionSocket,
  joinAuctionRoom,
  onBidUpdate,
} from '../../lib/auctionSocket';

interface Auction {
  id: number;
  product_id: number;
  product_name: string;
  product_images: string | string[];
  product_mrp: string;
  product_description: string;
  start_time: string;
  end_time: string;
  status: string;
  reserve_price: string;
  current_highest_bid: string | null;
  minimum_spread: string;
  total_bids: number;
}

export default function StickyAuctionWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [timeLeft, setTimeLeft] = useState('00:00:00');

  const isAuctionPage = location.pathname.startsWith('/live-auction') || 
                        location.pathname.startsWith('/login') || 
                        location.pathname.startsWith('/register');

  useEffect(() => {
    if (isAuctionPage) return;

    const fetchActiveAuction = async () => {
      try {
        const response = await api.get('/auctions/active');
        const data = response.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          const activeAuction = data.find((item: any) => item.status === 'active' && item.id !== null);
          if (activeAuction) {
            setAuction(activeAuction);
            retainAuctionSocket();
            joinAuctionRoom(activeAuction.id);
          } else {
            setAuction(null);
          }
        } else {
          setAuction(null);
        }
      } catch (err) {
        console.error('StickyAuctionWidget: Error fetching active auctions:', err);
      }
    };

    fetchActiveAuction();
    const pollInterval = setInterval(fetchActiveAuction, 30000);

    return () => {
      clearInterval(pollInterval);
      if (auction) {
        releaseAuctionSocket();
      }
    };
  }, [isAuctionPage]);

  useEffect(() => {
    if (!auction) return;

    const unsubscribe = onBidUpdate((data) => {
      if (data.auction_id === auction.id) {
        setAuction((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            current_highest_bid: String(data.current_highest_bid),
            total_bids: data.total_bids,
          };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auction]);

  useEffect(() => {
    if (!auction) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(auction.end_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Ended');
        setAuction(null);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const hStr = String(hours).padStart(2, '0');
        const mStr = String(minutes).padStart(2, '0');
        const sStr = String(seconds).padStart(2, '0');

        setTimeLeft(`${hStr} : ${mStr} : ${sStr}`);
      }
    };

    updateTimer();
    const clockInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(clockInterval);
  }, [auction]);

  if (isAuctionPage || !auction) return null;

  let images: any[] = [];
  try {
    images = typeof auction.product_images === 'string' 
      ? JSON.parse(auction.product_images) 
      : auction.product_images;
  } catch (e) {}
  const normalizedImages = images
    .map((item) => {
      const url = typeof item === 'string' ? item : item?.url;
      if (!url) return '';
      return url.startsWith('/') ? `http://localhost:4000${url}` : url;
    })
    .filter(Boolean) as string[];

  const uniqueImages = Array.from(new Set(normalizedImages));
  const mainImage = uniqueImages[0] || '/placeholder.png';
  const sideImagePool = uniqueImages.slice(1);

  const fallbackProductImages = [
    'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=400&q=80',
  ];

  const sideImageUrls: string[] = [];
  for (let i = 0; sideImageUrls.length < 4; i += 1) {
    if (sideImagePool[i]) {
      sideImageUrls.push(sideImagePool[i]);
    } else {
      sideImageUrls.push(fallbackProductImages[sideImageUrls.length % fallbackProductImages.length]);
    }
  }

  const leftImages = sideImageUrls.slice(0, 2);
  const rightImages = sideImageUrls.slice(2, 4);

  const handleJoin = () => {
    navigate(`/live-auction/${auction.id}`);
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[9999] cursor-pointer bg-slate-100 text-slate-700 flex items-center gap-2 px-3 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
        <span className="text-[11px] font-semibold tracking-wider uppercase">Live Auction</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center select-none animate-slide-from-right font-sans">
      {/* 1. Live Auction Pill Banner */}
      <div className="z-20 bg-white/90 text-orange-700 font-semibold text-[10px] tracking-wider px-3.5 py-1 rounded-full uppercase shadow-sm flex items-center gap-1.5 border border-orange-200 translate-y-3.5">
        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
        LIVE AUCTION
      </div>

      {/* Close/Minimize Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsMinimized(true);
        }}
        className="absolute top-4 right-3 z-30 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-all shadow-sm"
        title="Minimize"
      >
        ✕
      </button>

      {/* 2. Main Central Card Content (White Theme, no black container/fanned cards) */}
      <div 
        onClick={handleJoin}
        className="w-[225px] border border-orange-100/80 rounded-3xl p-3.5 pt-7 shadow-sm flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow duration-200 bg-transparent backdrop-blur-sm"
      >
        {/* Product Image Wrapper */}
        <div className="relative w-40 h-28 mt-2 flex items-center justify-center">
          {/* Left side cards */}
          {leftImages.map((src, idx) => (
            <img
              key={`left-${idx}`}
              src={src}
              alt={`side-${idx}`}
              className={`absolute w-20 h-16 object-cover rounded-3xl border border-white/80 shadow-sm transition-transform duration-500 ${idx === 0 ? 'left-[-1.5rem] top-1 rotate-[-16deg]' : 'left-[-0.75rem] top-8 rotate-[-8deg]'}`}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
          ))}

          {/* Main product image */}
          <div className="relative z-20 w-32 h-24 rounded-[28px] overflow-hidden border border-slate-200 shadow-xl bg-white">
            <img 
              src={mainImage} 
              alt={auction.product_name} 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
          </div>

          {/* Right side cards */}
          {rightImages.map((src, idx) => (
            <img
              key={`right-${idx}`}
              src={src}
              alt={`side-${idx}`}
              className={`absolute w-20 h-16 object-cover rounded-3xl border border-white/80 shadow-sm transition-transform duration-500 ${idx === 0 ? 'right-[-0.75rem] top-3 rotate-[10deg]' : 'right-[-1.5rem] top-10 rotate-[18deg]'}`}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
          ))}
        </div>

        {/* Product Title */}
        <h4 className="mt-3 text-slate-900 font-semibold text-xs tracking-wide line-clamp-1 w-full px-1 bg-white/90 rounded-md inline-block">
          {auction.product_name}
        </h4>

        {/* Information Section */}
        <div className="w-full flex flex-col items-center mt-3 gap-2">
          {/* Ends in */}
          <div className="flex flex-col items-center mb-3">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-white/90 rounded-full px-2 py-0.5">
              Ends in
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1 bg-orange-100/90 text-orange-700 rounded-full px-3 py-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-orange-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleJoin();
          }}
          className="w-full border border-orange-200 text-orange-700 font-semibold text-[11px] py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm bg-white/90 hover:bg-orange-50"
        >
          <span>Live Auction</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
