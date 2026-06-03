import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';

// Live Auction Banner Widget
function LiveAuctionBannerWidget({ auction }: { auction: any }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const isUpcoming = new Date(auction.start_time).getTime() > new Date().getTime();

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const targetTime = new Date(isUpcoming ? auction.start_time : auction.end_time).getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [auction.end_time, auction.start_time, isUpcoming]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  let images: any[] = [];
  try {
    images = typeof auction.product_images === 'string' ? JSON.parse(auction.product_images) : auction.product_images;
  } catch (e) { }

  const imageList: string[] = [];
  if (Array.isArray(images) && images.length > 0) {
    images.forEach((img: any) => {
      let url = typeof img === 'string' ? img : (img?.url || '/placeholder.png');
      if (url.startsWith('/')) {
        url = `${(import.meta as any).env.VITE_API_URL || "http://localhost:4000"}${url}`;
      }
      imageList.push(url);
    });
  } else {
    const mainImageObj = images?.[0];
    let mainImage = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');
    if (mainImage && mainImage.startsWith('/')) {
      mainImage = `${(import.meta as any).env.VITE_API_URL || "http://localhost:4000"}${mainImage}`;
    }
    imageList.push(mainImage);
  }

  useEffect(() => {
    if (imageList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
    }, 4000); // Auto slide every 4 seconds
    return () => clearInterval(timer);
  }, [imageList.length]);

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 items-stretch text-slate-800 select-none">
      {/* Middle Panel: Product Image Card (Now on the Left side of widget / middle of hero section) */}
      <div className="w-full md:w-[38%] rounded-[2rem] bg-gradient-to-tr from-[#E6EEF9] via-[#F3F7FC] to-[#FFFFFF] border border-white/80 shadow-lg relative flex items-center justify-center min-h-[270px] md:min-h-[330px] overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-[1.02]">

        {/* Full-bleed Product Image */}
        <img
          key={currentImageIndex}
          src={imageList[currentImageIndex]}
          alt={auction.product_name}
          className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ease-in-out opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).onerror = null;
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>';
          }}
        />

        {/* Left/Right Slider Arrows */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
              }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-slate-100"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-slate-100"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {imageList.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-25 flex gap-1.5 bg-black/35 px-2.5 py-1.5 rounded-full backdrop-blur-xs">
            {imageList.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'
                  }`}
              />
            ))}
          </div>
        )}

        {/* Floating Gold Confetti Over Image */}
        <div className="absolute top-12 right-20 w-3.5 h-1.5 bg-[#D97706]/70 rotate-45 z-10 rounded-xs"></div>
        <div className="absolute top-28 right-8 w-2 h-4 bg-[#F59E0B]/70 -rotate-12 z-10 rounded-xs"></div>
        <div className="absolute bottom-28 left-6 w-3 h-1.5 bg-[#F59E0B]/70 rotate-12 z-10 rounded-xs"></div>
        <div className="absolute bottom-16 right-16 w-4 h-1.5 bg-[#D97706]/60 -rotate-45 z-10 rounded-xs"></div>
        <div className="absolute top-1/3 left-10 w-2.5 h-1.5 bg-[#F59E0B]/80 rotate-[35deg] z-10 rounded-xs"></div>
        <div className="absolute top-10 left-32 w-1.5 h-3.5 bg-[#F59E0B]/70 -rotate-[60deg] z-10 rounded-xs"></div>
        <div className="absolute bottom-12 left-28 w-2 h-2.5 bg-[#D97706]/70 rotate-12 z-10 rounded-xs"></div>

        {/* PREMIUM AUCTION BADGE (Tilted Purple Shield with White Border) */}
        <div className="absolute top-5 left-4 z-20 bg-gradient-to-br from-[#240A5D] to-[#4012A3] text-white py-3 px-3.5 rounded-[1.25rem] shadow-xl border-2 border-white rotate-[-10deg] flex flex-col items-center justify-center text-center max-w-[105px]">
          <svg className="w-5 h-5 text-white mb-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.22 17.56l2.12-2.12 7.07 7.07-2.12 2.12-7.07-7.07zm14.14-11.3l2.83-2.83a1 1 0 000-1.41l-1.41-1.41a1 1 0 00-1.41 0L16.54 4.8l2.82 2.82zM15.13 6.22l-8.49 8.49 2.83 2.83 8.49-8.49-2.83-2.83z" />
          </svg>
          <span className="text-[10px] font-black tracking-wider text-yellow-300 uppercase leading-tight">Premium</span>
          <span className="text-[10px] font-black tracking-wider text-white uppercase leading-none">Auction</span>
          <div className="text-[8px] text-yellow-300 tracking-widest mt-1 font-bold">★★★</div>
        </div>

        {/* Authenticity Pill at Bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap w-[90%] flex justify-center">
          <div className="bg-gradient-to-r from-[#9030FE] via-[#BE5AFE] to-[#E354A8] text-white text-[10px] font-black tracking-wider uppercase py-2.5 px-4 rounded-full shadow-lg border border-white/20 flex items-center justify-center gap-1.5 w-full">
            <svg className="w-4 h-4 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>100% Authentic • Brand New • Seal Pack</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Bidding & Information Card (Now on the Right side of widget / right of hero section) */}
      <div className="flex-1 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-orange-950/5 p-6 flex flex-col justify-between min-h-[330px]">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-1.5 ${isUpcoming ? 'bg-amber-500' : 'bg-[#E02424]'} text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-sm mb-3`}>
                <svg className={`w-3.5 h-3.5 text-white fill-current ${isUpcoming ? 'animate-pulse' : 'animate-bounce'}`} viewBox="0 0 20 20">
                  {isUpcoming ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.655-.389-1.414-.297-2.137a1 1 0 00-1.9-.53c-.07.382-.116.75-.14 1.09-.047.678-.04 1.42.18 2.112a5.4 5.4 0 001.597 2.6c.03.027.06.053.09.08a4.996 4.996 0 003.545 1.514 5.004 5.004 0 005.003-5c0-1.345-.65-2.56-1.554-3.327-.58-.493-1.28-.867-1.907-1.185a19.716 19.716 0 01-1.37-.73zM9.5 17.5a2.5 2.5 0 01-2.5-2.5c0-1.956 1.838-3.319 3.92-3.178a3.001 3.001 0 012.9 2.766c.066.833-.356 1.585-.975 1.992a2.535 2.535 0 01-1.345.42H9.5z" clipRule="evenodd" />
                  )}
                </svg>
                <span>{isUpcoming ? 'Upcoming Auction' : 'Live Auction'}</span>
              </div>
              <h2 className="text-2xl md:text-[26px] font-black text-slate-900 leading-tight">
                {auction.product_name}
              </h2>
              <p className="text-[13px] text-slate-500 mt-1 font-semibold">
                Own the future. Bid now and win big today!
              </p>
            </div>

            {/* Premium Gold Medallion Shield Ribbon Badge */}
            <div className="relative flex items-center justify-center w-[75px] h-[75px] flex-shrink-0 -mt-2 -mr-1">
              <svg className="w-[75px] h-[75px] drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2B2" />
                    <stop offset="30%" stopColor="#F1A80A" />
                    <stop offset="70%" stopColor="#C68904" />
                    <stop offset="100%" stopColor="#8A5A00" />
                  </linearGradient>
                  <linearGradient id="shieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1C1917" />
                    <stop offset="100%" stopColor="#0C0A09" />
                  </linearGradient>
                </defs>
                <path d="M50 5 L85 15 V45 C85 68 50 85 50 85 C50 85 15 68 15 45 V15 L50 5 Z" fill="url(#goldGrad)" />
                <path d="M50 9 L81 18 V45 C81 65 50 81 50 81 C50 81 19 65 19 45 V18 L50 9 Z" fill="url(#shieldBg)" stroke="url(#goldGrad)" strokeWidth="2" />
                <path d="M25 22 L50 14 L75 22" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="2 2" />
                <text x="50" y="38" textAnchor="middle" fill="url(#goldGrad)" fontSize="26" fontWeight="950" fontFamily="sans-serif">1</text>
                <text x="50" y="50" textAnchor="middle" fill="url(#goldGrad)" fontSize="10" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">YEAR</text>
                <path d="M10 65 L22 80 L35 70 Z" fill="#996500" />
                <path d="M90 65 L78 80 L65 70 Z" fill="#996500" />
                <path d="M12 60 C30 65 70 65 88 60 L85 72 C70 77 30 77 15 72 Z" fill="url(#goldGrad)" stroke="#B37D00" strokeWidth="1" />
                <path d="M12 60 L15 72 L8 68 Z" fill="#8A5A00" />
                <path d="M88 60 L85 72 L92 68 Z" fill="#8A5A00" />
                <text x="50" y="69" textAnchor="middle" fill="#1C1917" fontSize="8.5" fontWeight="950" fontFamily="sans-serif" letterSpacing="0.5">WARRANTY</text>
              </svg>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-4"></div>

          {/* 2x2 Features Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Min Bid */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFFBEB] border border-[#F59E0B] flex items-center justify-center text-[#F59E0B] flex-shrink-0 shadow-xs">
                <span className="font-extrabold text-sm">₹</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-none">Minimum Bid Increment</span>
                <span className="text-sm text-slate-800 font-black mt-1">₹{(auction.minimum_spread || 1).toLocaleString()}</span>
              </div>
            </div>

            {/* Product Quality */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F3FF] border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-none">Product Quality</span>
                <span className="text-sm text-[#1D4ED8] font-black mt-1">100% Brand New</span>
              </div>
            </div>

            {/* Shipping */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#3B82F6] flex items-center justify-center text-[#3B82F6] flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125a1.125 1.125 0 001.125-1.125V9.75M8.25 18.75a1.5 1.5 0 01-3 0M21 9.75V4.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125 0-1.125 1.125V14.25h18.75V9.75zm0 0H16.5m0 0V3.5" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-none">Shipping & Delivery</span>
                <span className="text-sm text-[#1D4ED8] font-black mt-1">Free Express Delivery</span>
              </div>
            </div>

            {/* Packaging */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFFBEB] border border-[#D97706] flex items-center justify-center text-[#D97706] flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider leading-none">Secure Packaging</span>
                <span className="text-sm text-slate-800 font-black mt-1">Safe & Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bidding Ends / Current Bid Dark Blue Console */}
        <div className="mt-4">
          <div className="bg-[#09152B] text-white p-4 rounded-[1.25rem] flex items-center justify-between shadow-lg shadow-blue-900/10 border border-white/5">
            {/* Countdown */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-white text-[10px] font-black uppercase tracking-wider mb-2">
                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{isUpcoming ? 'Bidding Starts In' : 'Bidding Ends In'}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex flex-col items-center">
                  <span className="bg-white text-slate-900 font-black text-xl px-2 py-1 rounded-lg min-w-[36px] text-center shadow-xs leading-none">{timeLeft.hours}</span>
                  <span className="text-[8px] text-[#93C5FD] font-black uppercase mt-1 tracking-widest">Hrs</span>
                </div>
                <span className="text-white font-black text-xl -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="bg-white text-slate-900 font-black text-xl px-2 py-1 rounded-lg min-w-[36px] text-center shadow-xs leading-none">{timeLeft.minutes}</span>
                  <span className="text-[8px] text-[#93C5FD] font-black uppercase mt-1 tracking-widest">Mins</span>
                </div>
                <span className="text-white font-black text-xl -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="bg-white text-slate-900 font-black text-xl px-2 py-1 rounded-lg min-w-[36px] text-center shadow-xs leading-none">{timeLeft.seconds}</span>
                  <span className="text-[8px] text-[#93C5FD] font-black uppercase mt-1 tracking-widest">Secs</span>
                </div>
              </div>
            </div>

            {/* Dotted Vertical Divider */}
            <div className="h-12 border-l border-dashed border-slate-500/30 mx-4"></div>

            {/* Current Leading Bid - Left Aligned in its section */}
            <div className="flex-1 flex flex-col items-start">
              <span className="text-[#93C5FD] text-[10px] font-black uppercase tracking-wider">
                {isUpcoming ? 'Starting Price' : 'Current Leading Bid'}
              </span>
              <span className="text-[22px] font-black text-[#10B981] mt-1.5 leading-none font-mono">
                ₹{(auction.current_highest_bid || auction.reserve_price || 0).toLocaleString()}
              </span>
              <span className="mt-1 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] text-[9.5px] font-black border border-blue-200/50 leading-none">
                {auction.total_bids || 0} Bids
              </span>
            </div>
          </div>

          {/* Place Bid Button */}
          <button
            onClick={() => navigate(`/live-auction/${auction.id}`)}
            className={`w-full py-3 mt-3.5 ${isUpcoming ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/20' : 'bg-gradient-to-r from-[#FF5500] to-[#FF7700] hover:from-[#E64D00] hover:to-[#E66600] hover:shadow-orange-500/20'} text-white font-black text-sm rounded-xl shadow-md transition-all duration-300 active:scale-95 flex items-center justify-center gap-2`}
          >
            <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <span>{isUpcoming ? 'View Details' : 'Place Your Bid Now'}</span>
          </button>

          {/* Security details */}
          <div className="flex items-center justify-center gap-2.5 mt-2.5 text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Secure Bidding</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>Fair Play</span>
            <span className="text-slate-300">•</span>
            <span>Best Price Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [saleCategory, setSaleCategory] = useState<string | undefined>(undefined);
  const [liveAuctions, setLiveAuctions] = useState<any[]>([]);
  const [liveAuctionsLoading, setLiveAuctionsLoading] = useState(true);

  useEffect(() => {
    const fetchLiveAuctions = async () => {
      try {
        const res = await api.get('/auctions/active');
        if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setLiveAuctions(res.data.data);
        } else {
          const resUpcoming = await api.get('/auctions/upcoming');
          if (resUpcoming.data && Array.isArray(resUpcoming.data.data)) {
            setLiveAuctions(resUpcoming.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch live auctions for hero:', err);
      } finally {
        setLiveAuctionsLoading(false);
      }
    };
    fetchLiveAuctions();
  }, []);
  const [activeChip, setActiveChip] = useState<string>('Blockbuster deals');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(60000);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number>(100);

  const { data: categories } = useCategories();
  const { data: rawFeaturedData, isLoading: featuredLoading } = useProducts({
    is_featured: true,
    limit: 50,
    category: saleCategory
  });

  // Client-side robust filtering including Chip logic
  const featuredData = rawFeaturedData?.data.filter(p => {
    // 1. Sidebar Price/Discount Filters
    const matchesPrice = p.selling_price >= minPrice && p.selling_price <= maxPrice;
    const matchesDiscount = p.discount_percentage >= minDiscount && p.discount_percentage <= maxDiscount;

    // 2. Chip Category Filters
    let matchesChip = true;
    const catSlug = p.category?.slug?.toLowerCase();
    const userInterest = localStorage.getItem('userInterest');

    if (activeChip === 'For you') matchesChip = !userInterest || catSlug === userInterest;
    if (activeChip === 'Deals with exchange') matchesChip = !!(catSlug?.includes('mobile') || catSlug?.includes('laptop') || catSlug?.includes('tv'));
    if (activeChip === 'Deals in focus') matchesChip = p.is_featured && p.discount_percentage > 10;
    if (activeChip === 'Trending deals') matchesChip = p.discount_percentage > 15;
    if (activeChip === 'Mobiles') matchesChip = !!(catSlug?.includes('mobile') || catSlug === 'electronics');
    if (activeChip === 'Electronics') matchesChip = catSlug === 'electronics';
    if (activeChip === 'Home & Kitchen') matchesChip = !!(catSlug?.includes('home') || catSlug?.includes('kitchen'));
    if (activeChip === 'Mobile Accessories') matchesChip = !!(catSlug?.includes('accessor') || catSlug?.includes('case'));
    if (activeChip === 'Headphones') matchesChip = !!(catSlug?.includes('headphone') || catSlug?.includes('audio') || catSlug?.includes('earphone'));
    if (activeChip === 'Coupons') matchesChip = p.discount_percentage > 5;

    return matchesPrice && matchesDiscount && matchesChip;
  }).slice(0, 12);
  const { data: newArrivalsData, isLoading: newLoading } = useProducts({ sort: 'newest', limit: 8 });
  const { data: dealsData, isLoading: dealsLoading } = useProducts({ sort: 'discount_desc', limit: 8 });

  const topCategories = categories?.filter(c => !c.parent_id).slice(0, 8) ?? [];

  // Map real categories to sale sidebar display names
  const saleDepartments = [
    { name: 'All', slug: undefined },
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Footwear', slug: 'footwear' },
    { name: 'Home & Kitchen', slug: 'home-kitchen' },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft } = ref.current;
      const scrollTo = direction === 'left' ? scrollLeft - 600 : scrollLeft + 600;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-r from-[#FFF5EB] via-[#FFEADB] to-[#FCE4D6] py-3 sm:py-5 border-b border-orange-100/20">
        <div className="max-w-[1500px] mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12">
          {/* Left Content (Redesigned Promotion text & features) */}
          <div className={`w-full ${liveAuctions.length > 0 ? 'lg:w-[36%] items-center text-center lg:px-4' : 'md:w-[48%] text-center md:text-left items-center md:items-start'} z-10 text-slate-800 flex flex-col justify-center`}>
            {liveAuctions.length > 0 ? (
              <>
                <div className="relative flex flex-col items-center">
                  <h1 className="text-5xl lg:text-6xl font-black text-[#0B1530] leading-none tracking-tight">
                    Live Bids
                  </h1>
                  <div className="relative mt-1 px-14">
                    <h1 className="text-5xl lg:text-[4.25rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FF8A00] to-[#FF3D00] leading-none tracking-tight select-none">
                      Active!
                    </h1>
                    {/* Big Lightning Bolt Floating to the right */}
                    <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 text-[#FFB800] fill-current drop-shadow-md animate-pulse" viewBox="0 0 24 24">
                      <path d="M19 11.5h-5.25L17 3.5H9.75L7 12.5h5.25L9.5 20.5z" />
                    </svg>
                  </div>
                </div>

                {/* Horizontal Accent Line Row */}
                <div className="flex items-center justify-center gap-2 mt-4 text-[#0B1530] font-black text-[11px] uppercase tracking-wider">
                  <div className="w-6 h-[1.5px] bg-[#FF7300]/60"></div>
                  <span>Don't Just Look, Bid & Win!</span>
                  <div className="w-6 h-[1.5px] bg-[#FF7300]/60"></div>
                </div>

                {/* Trophy Alert Card */}
                <div className="w-full max-w-sm mt-5 bg-white border border-[#FFD8BE] rounded-2xl p-4 flex flex-col items-center gap-2.5 shadow-sm text-center backdrop-blur-xs">
                  <div className="w-12 h-12 rounded-full bg-[#FFF3EB] border border-[#FFD8BE] flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 40 40" fill="none">
                      <path d="M12 30 H28 V32 H12 Z" fill="#B35900" />
                      <path d="M15 26 H25 V30 H15 Z" fill="#D97706" />
                      <path d="M20 20 V26" stroke="#D97706" strokeWidth="4" />
                      <path d="M10 8 C10 16 14 20 20 20 C26 20 30 16 30 8 H10 Z" fill="#F59E0B" />
                      <path d="M10 10 H7 C5 10 5 14 7 14 H10" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <path d="M30 10 H33 C35 10 35 14 33 14 H30" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <polygon points="20,11 22,15 26,15 23,17 24,21 20,19 16,21 17,17 14,15 18,15" fill="white" />
                    </svg>
                  </div>
                  <p className="text-[12px] md:text-sm font-black italic text-slate-800 leading-snug">
                    Be the highest bidder and claim this amazing deal!
                  </p>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 mb-6 drop-shadow-sm leading-tight">
                  Great Summer Sale <br />
                  <span className="text-[#FF5500]">is live</span>
                </h1>
              </>
            )}

            {/* Symmetrical Features Columns (replacing Instant Checkout) */}
            <div className={`grid grid-cols-3 gap-3 pt-6 text-[10px] w-full ${liveAuctions.length > 0 ? 'max-w-sm' : 'max-w-lg'} border-t border-orange-200/40 mt-6`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center text-[#EF4444] mb-2.5 transition-transform duration-300 hover:scale-105">
                  <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12.2 2H2v10.2L12.8 23c.4.4 1 .4 1.4 0l8.8-8.8c.4-.4.4-1 0-1.4L12.2 2zM7 9C5.9 9 5 8.1 5 7c0-1.1.9-2 2-2s2 .9 2 2c0 1.1-.9 2-2 2z" />
                    <polygon points="12,11 13.5,13.5 16.5,13.5 14.2,15.2 15,18.2 12,16.5 9,18.2 9.8,15.2 7.5,13.5 10.5,13.5" fill="white" />
                  </svg>
                </div>
                <span className="font-extrabold text-[#0B1530] text-[10px] leading-tight">Exciting Deals</span>
                <span className="text-[8px] text-slate-400 font-bold leading-normal mt-1.5 max-w-[90px]">Top products at unbeatable prices</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center text-[#E11D48] mb-2.5 transition-transform duration-300 hover:scale-105">
                  <svg className="w-6 h-6 text-rose-500 fill-current" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18A3.28 3.28 0 0018 5a3 3 0 00-3-3 2.92 2.92 0 00-2.7 2 2.92 2.92 0 00-2.7-2 3 3 0 00-3 3 3.28 3.28 0 00.18 1H4a2 2 0 00-2 2v2a2 2 0 001 1.72V19a2 2 0 002 2h14a2 2 0 002-2v-7.28A2 2 0 0022 10V8a2 2 0 00-2-2zM9 5a1 1 0 011 1H8a1 1 0 011-1zm6 0a1 1 0 011 1h-2a1 1 0 011-1zM4 8h7v2H4V8zm2 4h5v7H6v-7zm12 7h-5v-7h5v7zm2-9h-7V8h7v2z" />
                  </svg>
                </div>
                <span className="font-extrabold text-[#0B1530] text-[10px] leading-tight">Super Rewards</span>
                <span className="text-[8px] text-slate-400 font-bold leading-normal mt-1.5 max-w-[90px]">Earn coins & cashback on every purchase</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center text-[#EF4444] mb-2.5 transition-transform duration-300 hover:scale-105">
                  <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-2-7.8l-3.2-3.2 1.4-1.4 1.8 1.8 4.8-4.8 1.4 1.4-6.2 6.2z" />
                  </svg>
                </div>
                <span className="font-extrabold text-[#0B1530] text-[10px] leading-tight">Secure & Safe</span>
                <span className="text-[8px] text-slate-400 font-bold leading-normal mt-1.5 max-w-[90px]">100% secure payments & easy returns</span>
              </div>
            </div>
          </div>

          {/* Right Content (Redesigned Auction Widget container) */}
          <div className={`w-full ${liveAuctions.length > 0 ? 'lg:w-[64%]' : 'md:w-[52%]'} flex-shrink-0 flex flex-col items-stretch gap-4 z-10`}>
            {/* Prime Section or Live Auction Widget */}
            {liveAuctions.length > 0 ? (
              <LiveAuctionBannerWidget auction={liveAuctions[0]} />
            ) : (
              <div className="bg-blue-600/90 backdrop-blur-sm p-4 rounded-lg border border-white/20 w-full max-w-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-bold">Only for Prime Members</p>
                  </div>
                  <Link
                    to="/category/all"
                    className="px-4 py-1.5 bg-[#fdf200] text-gray-900 font-bold rounded-sm text-sm hover:bg-[#ffe600] transition-colors"
                  >
                    Join Prime &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-white p-2 rounded text-center">
                    <p className="text-[10px] font-bold text-gray-800">Flat ₹250 cashback</p>
                    <p className="text-[9px] text-gray-500">on ₹2500</p>
                  </div>
                  <div className="bg-white p-2 rounded text-center">
                    <p className="text-[10px] font-bold text-gray-800">Unlimited</p>
                    <p className="text-[9px] text-gray-500">5% cashback</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none">
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 100 100">
            <path d="M100 0 L100 100 L0 100 Z" />
          </svg>
        </div>

      </section>



      {/* Spotlight Brands (Amazon Style) */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Spotlight brands</h2>

          <div className="relative group">
            {/* Scroll Container */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 scroll-smooth">
              {featuredLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[200px] sm:w-[240px] aspect-square bg-gray-100 animate-pulse rounded-sm" />
                ))
              ) : (
                rawFeaturedData?.data.slice(0, 8).map((product: any) => (
                  <Link key={product.id} to={`/product/${product.slug}`} className="flex-shrink-0 w-[200px] sm:w-[240px] group/item">
                    <div
                      className="aspect-square rounded-sm border border-gray-200 overflow-hidden relative mb-2 transition-all hover:shadow-xl cursor-pointer bg-[#F7F7F7] group/card"
                    >
                      {/* Real Product Image from S3 */}
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <img
                          src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.png'}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain drop-shadow-md group-hover/card:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Discount Badge Overlay (Amazon Style) */}
                      {product.discount_percentage > 0 && (
                        <div className="absolute top-2 left-2 bg-[#CC0C39] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          {Math.round(product.discount_percentage)}% off
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/[0.02] to-transparent"></div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 group-hover/item:text-orange-700 cursor-pointer line-clamp-1">
                      {product.brand ? `${product.brand} | ` : ''}{product.name}
                    </p>
                  </Link>
                ))
              )}

              {/* View All Deals Card */}
              <div className="flex-shrink-0 w-[120px] sm:w-[150px] flex flex-col items-center justify-center group/all">
                <Link
                  to="/category/all?sort=discount_desc"
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center text-blue-600 border border-gray-200 shadow-sm group-hover/all:bg-blue-600 group-hover/all:text-white transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/category/all?sort=discount_desc"
                  className="mt-3 text-xs sm:text-sm font-bold text-blue-700 hover:text-orange-700 transition-colors"
                >
                  View all deals
                </Link>
              </div>
            </div>

            {/* Navigation Buttons (Floating) */}
            <button className="absolute left-0 top-[calc(50%-1.5rem)] -translate-y-1/2 -ml-4 w-10 h-10 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 z-10 hidden md:flex">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button className="absolute right-0 top-[calc(50%-1.5rem)] -translate-y-1/2 -mr-4 w-10 h-10 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 z-10 hidden md:flex">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Great Summer Sale Results Section */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4">
          {/* Horizontal Filter Chips */}
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100 mb-6">
            <button
              onClick={() => scroll(scrollRef, 'left')}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-gray-200 rounded-sm text-gray-400 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div
              ref={scrollRef}
              className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {['For you', 'Deals with exchange', 'Blockbuster deals', 'Deals in focus', 'Trending deals', 'Mobiles', 'Coupons', 'Electronics', 'Mobile Accessories', 'Headphones'].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveChip(chip)}
                  className={`flex-shrink-0 px-4 py-2 text-sm rounded-sm border transition-all ${activeChip === chip
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              onClick={() => scroll(scrollRef, 'right')}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-gray-200 rounded-sm text-gray-400 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sale Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0 hidden lg:block sticky top-4 self-start">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Filtered by</h3>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 rounded-sm">
                    {saleCategory ? saleCategory.charAt(0).toUpperCase() + saleCategory.slice(1) : 'Blockbuster deals'}
                    <span className="cursor-pointer" onClick={() => setSaleCategory(undefined)}>×</span>
                  </div>
                  <button
                    onClick={() => {
                      setSaleCategory(undefined);
                      setActiveChip('Blockbuster deals');
                      setMinPrice(0);
                      setMaxPrice(60000);
                      setMinDiscount(0);
                      setMaxDiscount(100);
                    }}
                    className="block text-xs text-blue-600 hover:text-orange-700 mt-2"
                  >
                    Clear Filters
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Department</h3>
                  <div className="space-y-2">
                    {saleDepartments.map((dept, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="dept"
                          checked={saleCategory === dept.slug}
                          onChange={() => setSaleCategory(dept.slug)}
                          className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-0"
                        />
                        <span className={`text-sm group-hover:text-orange-700 ${saleCategory === dept.slug ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                          {dept.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Brands</h3>
                  <div className="space-y-2">
                    {['Voltas', 'Sony', 'Panasonic', 'LG'].map((brand, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 border-gray-300 rounded-sm text-blue-600 focus:ring-0" />
                        <span className="text-sm text-gray-700 group-hover:text-orange-700">{brand}</span>
                      </label>
                    ))}
                    <button className="text-xs text-blue-600 hover:text-orange-700 mt-1">See more</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Customer Reviews</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="rating" defaultChecked className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-0" />
                      <span className="text-sm text-gray-700 group-hover:text-orange-700">All</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="rating" className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-0" />
                      <div className="flex text-orange-400">
                        {[1, 2, 3, 4].map(i => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                        <svg className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-orange-700">and up</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Price</h3>
                  <p className="text-xs font-bold text-gray-800 mb-4">₹{minPrice.toLocaleString()} - ₹{maxPrice >= 60000 ? '60,000+' : maxPrice.toLocaleString()}</p>
                  <div className="relative h-1.5 bg-gray-200 rounded-full mb-10 group/slider">
                    <input
                      type="range" min="0" max="60000" step="1000" value={minPrice}
                      onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 1000))}
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-blue-600 pointer-events-auto z-20 custom-range"
                    />
                    <input
                      type="range" min="0" max="60000" step="1000" value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 1000))}
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-blue-600 pointer-events-auto z-10 custom-range"
                    />
                    <div className="absolute h-1.5 bg-blue-600 rounded-full z-0" style={{ left: `${(minPrice / 60000) * 100}%`, right: `${100 - (Math.min(maxPrice, 60000) / 60000) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Discount</h3>
                  <p className="text-xs font-bold text-gray-800 mb-4">{minDiscount}% - {maxDiscount}%</p>
                  <div className="relative h-1.5 bg-gray-200 rounded-full mb-8 group/slider">
                    <input
                      type="range" min="0" max="100" step="5" value={minDiscount}
                      onChange={(e) => setMinDiscount(Math.min(Number(e.target.value), maxDiscount - 5))}
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-blue-600 pointer-events-auto z-20 custom-range"
                    />
                    <input
                      type="range" min="0" max="100" step="5" value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Math.max(Number(e.target.value), minDiscount + 5))}
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-blue-600 pointer-events-auto z-10 custom-range"
                    />
                    <div className="absolute h-1.5 bg-blue-600 rounded-full z-0" style={{ left: `${minDiscount}%`, right: `${100 - maxDiscount}%` }}></div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Featured Products</h2>
                <Link to="/category/all?is_featured=true" className="text-blue-600 hover:text-orange-700 text-sm">View All</Link>
              </div>

              {featuredLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-sm"></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredData?.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* View more deals bar */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <Link
                  to="/category/all?is_featured=true"
                  className="block w-full py-3 bg-[#f7f8f8] hover:bg-gray-100 border border-gray-200 rounded-sm text-center text-sm font-medium text-gray-700 transition-colors"
                >
                  View more deals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inspired by browsing history */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Inspired by your browsing history</h2>
            <span className="text-xs text-gray-500">Page 1 of 7</span>
          </div>

          <div className="relative group">
            <button
              onClick={() => scroll(historyRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-10 h-10 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 z-10 hidden md:flex"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div
              ref={historyRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pb-4 scroll-smooth"
            >
              {newArrivalsData?.data.map(product => (
                <div key={product.id} className="flex-shrink-0 w-[180px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll(historyRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-10 h-10 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 z-10 hidden md:flex"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Customers also viewed */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Customers who viewed items in your browsing history also viewed</h2>
            <span className="text-xs text-gray-500">Page 1 of 5</span>
          </div>

          <div className="relative group">
            <button
              onClick={() => scroll(viewedRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-10 h-10 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 z-10 hidden md:flex"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div
              ref={viewedRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pb-4 scroll-smooth"
            >
              {dealsData?.data.map(product => (
                <div key={product.id} className="flex-shrink-0 w-[180px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll(viewedRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-10 h-10 bg-white border border-gray-200 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 z-10 hidden md:flex"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* B2B Banner */}
      <section className="bg-[#232f3e] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Are You a Business Buyer?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Get exclusive B2B pricing, bulk order discounts, and a dedicated account manager. Register as a B2B customer today.
          </p>
          <Link
            to="/register?type=b2b"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#febd69] hover:bg-[#f3a847] text-gray-900 font-bold rounded-sm shadow-md transition-all duration-200"
          >
            Register as B2B Customer
          </Link>
        </div>
      </section>
    </div>
  );
}
