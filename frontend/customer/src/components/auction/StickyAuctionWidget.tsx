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
  const mainImageObj = images?.[0];
  let mainImage = typeof mainImageObj === 'string' 
    ? mainImageObj 
    : (mainImageObj?.url || '/placeholder.png');
  
  if (mainImage && mainImage.startsWith('/')) {
    mainImage = `http://localhost:4000${mainImage}`;
  }

  const currentBid = parseFloat(auction.current_highest_bid || auction.reserve_price || '0');

  const handleJoin = () => {
    navigate(`/live-auction/${auction.id}`);
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-[9999] cursor-pointer bg-gradient-to-r from-red-600 to-orange-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="text-xs font-bold tracking-wider uppercase">Live Auction</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center select-none animate-slide-from-right font-sans">
      {/* 1. Live Auction Pill Banner */}
      <div className="z-20 bg-white text-red-600 font-extrabold text-[10px] tracking-wider px-3.5 py-1 rounded-full uppercase shadow-md flex items-center gap-1.5 border border-slate-100 translate-y-3.5">
        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
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
        className="w-[220px] bg-white border border-slate-100 rounded-2xl p-4 pt-6 shadow-2xl flex flex-col items-center text-center cursor-pointer hover:scale-[1.02] hover:shadow-3xl transition-all duration-300"
      >
        {/* Product Image Wrapper with Fanned Images */}
        <div className="relative w-36 h-28 mt-2 flex items-center justify-center group">
          {/* Fanned Image 1 (Far Left) */}
          <img 
            src={mainImage} 
            alt=""
            className="absolute max-w-[85%] max-h-[85%] object-contain transform -rotate-[22deg] -translate-x-6 opacity-25 transition-transform duration-500 pointer-events-none"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
          {/* Fanned Image 2 (Mid Left) */}
          <img 
            src={mainImage} 
            alt=""
            className="absolute max-w-[90%] max-h-[90%] object-contain transform -rotate-[12deg] -translate-x-3 opacity-55 transition-transform duration-500 pointer-events-none"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
          {/* Fanned Image 3 (Mid Right) */}
          <img 
            src={mainImage} 
            alt=""
            className="absolute max-w-[90%] max-h-[90%] object-contain transform rotate-[12deg] translate-x-3 opacity-55 transition-transform duration-500 pointer-events-none"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
          {/* Fanned Image 4 (Far Right) */}
          <img 
            src={mainImage} 
            alt=""
            className="absolute max-w-[85%] max-h-[85%] object-contain transform rotate-[22deg] translate-x-6 opacity-25 transition-transform duration-500 pointer-events-none"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
          
          {/* Central Main Product Image */}
          <img 
            src={mainImage} 
            alt={auction.product_name} 
            className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105" 
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
        </div>

        {/* Product Title */}
        <h4 className="mt-3 text-slate-900 font-bold text-xs tracking-wide line-clamp-1 w-full px-1">
          {auction.product_name}
        </h4>

        {/* Information Section */}
        <div className="w-full flex flex-col items-center mt-3 gap-2">
          {/* Current Bid */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Current Bid</span>
            <span className="text-base font-black text-orange-500 mt-0.5">
              ₹{currentBid.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Ends in */}
          <div className="flex flex-col items-center mb-3">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Ends in</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
              {/* Clock Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-700">
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
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
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
