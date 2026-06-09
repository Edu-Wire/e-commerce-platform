import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

// Outbid Retargeting Special Purchase Banner
function OutbidOfferBanner({ offer, onDismiss, setBuyNowItem, navigate }: any) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const endTime = new Date(offer.end_time).getTime();
      const expiresAt = endTime + 6 * 60 * 60 * 1000; // 6 hours
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        onDismiss(offer.id);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s left`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [offer, onDismiss]);

  const markup = offer.outbid_purchase_markup_percent !== null && offer.outbid_purchase_markup_percent !== undefined
    ? parseFloat(offer.outbid_purchase_markup_percent)
    : 50;
  const winningBid = parseFloat(offer.current_highest_bid || '0');
  const offerPrice = Math.round(winningBid * (1 + markup / 100));

  const handleBuyNow = () => {
    let img = '/placeholder.png';
    try {
      const parsed = typeof offer.product_images === 'string' ? JSON.parse(offer.product_images) : offer.product_images;
      const firstImg = parsed?.[0];
      img = typeof firstImg === 'string' ? firstImg : (firstImg?.url || '/placeholder.png');
      if (img.startsWith('/')) img = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${img}`;
    } catch { }

    const item: any = {
      product_id: offer.product_id,
      name: offer.product_name,
      slug: offer.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image: img,
      mrp: parseFloat(offer.product_mrp || '0') * 1.25,
      price: offerPrice,
      quantity: 1,
      condition: 'new',
      sku: `SKU-${offer.product_id}`,
      stock_quantity: 10,
      auction_id: offer.id,
    };
    setBuyNowItem(item);
    navigate('/checkout');
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 mt-6">
      <div className="bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">

        {/* Animated Background Orbs */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-orange-700/30 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-3xl shadow-inner flex-shrink-0 animate-bounce">
            ⚡
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase border border-white/10">
                Exclusive Bidder Offer
              </span>
              <span className="bg-yellow-400 text-slate-900 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase flex items-center gap-1 animate-pulse">
                ⏰ {timeLeft}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black mt-2 leading-tight">
              Get {offer.product_name} at bidder-only price!
            </h3>
            <p className="text-xs sm:text-sm text-orange-50 mt-1 max-w-xl font-medium">
              You were outbid, but you're eligible to purchase this item instantly at a special price of{' '}
              <span className="font-extrabold text-yellow-300 text-sm sm:text-base">₹{offerPrice.toLocaleString('en-IN')}</span>{' '}
              (regular catalog price: ₹{parseFloat(offer.product_mrp || '0').toLocaleString('en-IN')})!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto flex-shrink-0 justify-end">
          <button
            onClick={() => onDismiss(offer.id)}
            className="px-5 py-3 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/20 hover:scale-[1.02] active:scale-95"
          >
            No thanks
          </button>
          <button
            onClick={handleBuyNow}
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-xs font-black rounded-xl transition-all shadow-md hover:shadow-yellow-400/25 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          >
            Buy Now
          </button>
        </div>

      </div>
    </div>
  );
}

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
      <div className="w-full md:w-[38%] rounded-[2rem] bg-gradient-to-tr from-[#E6EEF9] via-[#F3F7FC] to-[#FFFFFF] border border-white/80 shadow-lg relative flex items-center justify-center min-h-[200px] md:min-h-[260px] overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-[1.02]">

        {/* Crossfade Product Image Slideshow */}
        {imageList.map((imgSrc, idx) => (
          <img
            key={idx}
            src={imgSrc}
            alt={`${auction.product_name} - ${idx + 1}`}
            className={`absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-contain z-0 transition-opacity duration-700 ease-in-out drop-shadow-md ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>';
            }}
          />
        ))}

        {/* Left/Right Slider Arrows */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
              }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-[25] w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-slate-100"
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-[25] w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-slate-100"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {imageList.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[25] flex gap-1.5 bg-black/35 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
            {imageList.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'
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

        {/* Product Info Overlay at Top */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 via-black/25 to-transparent px-4 pt-3 pb-8 rounded-t-[2rem]">
          <p className="text-white text-[11px] font-black uppercase tracking-wider line-clamp-1">{auction.product_name}</p>
          <p className="text-white/70 text-[10px] font-bold mt-0.5">Starting at ₹{(auction.reserve_price || auction.current_highest_bid || 0).toLocaleString()}</p>
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
      <div className="flex-1 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-orange-950/5 p-4 md:p-5 flex flex-col justify-between min-h-[260px]">
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
            <div className="relative flex items-center justify-center w-[55px] h-[55px] flex-shrink-0 -mt-2 -mr-1 scale-75 origin-top-right">
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

          <div className="border-t border-dashed border-slate-200 my-2"></div>

          {/* 1x2 Features Row (Compact) */}
          <div className="flex items-center gap-8">
            {/* Min Bid */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFFBEB] border border-[#F59E0B] flex items-center justify-center text-[#F59E0B] flex-shrink-0 shadow-xs">
                <span className="font-extrabold text-xs">₹</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Min Increment</span>
                <span className="text-xs text-slate-800 font-black mt-1">₹{(auction.minimum_spread || 1).toLocaleString()}</span>
              </div>
            </div>

            {/* Product Quality */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F5F3FF] border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] flex-shrink-0 shadow-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Quality</span>
                <span className="text-xs text-[#1D4ED8] font-black mt-1">100% Brand New</span>
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

function ProductSlideshowWidget({ products, isLoading }: { products: any[]; isLoading: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-full h-full bg-white border border-slate-200 rounded-[2.5rem] flex items-center justify-center animate-pulse">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasProducts = products && products.length > 0;
  if (!hasProducts) {
    return (
      <div className="w-full h-full bg-slate-50 border border-slate-200 rounded-[2.5rem] p-7 flex items-center justify-center text-center">
        <p className="text-xs text-slate-400 font-bold">No deals available today.</p>
      </div>
    );
  }

  // Duplicate products for infinite scrolling effect
  const displayProducts = [...products, ...products];

  return (
    <div className="w-full h-full bg-white border border-slate-200/80 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm relative group">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Trending Deals</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Live</span>
      </div>

      {/* Auto-scrolling area */}
      <div className="flex-1 overflow-hidden relative">
        <style>{`
          @keyframes verticalScroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .animate-vertical-scroll {
            animation: verticalScroll 20s linear infinite;
          }
          .group:hover .animate-vertical-scroll {
            animation-play-state: paused;
          }
        `}</style>
        
        <div className="animate-vertical-scroll flex flex-col absolute w-full">
          {displayProducts.map((p, i) => {
            const img = typeof p.images?.[0] === 'string' ? p.images[0] : (p.images?.[0]?.url || '/placeholder.png');
            const discount = Math.round(p.discount_percentage || 0);

            return (
              <div 
                key={`${p.id}-${i}`}
                onClick={() => navigate(`/product/${p.slug}`)}
                className="flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors bg-white w-full h-[100px]"
              >
                {/* Product Image */}
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center p-1 shadow-sm">
                  <img src={img} alt={p.name} className="max-w-full max-h-full object-contain" />
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-green-700 transition-colors">
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-black text-slate-900">₹{p.selling_price?.toLocaleString('en-IN')}</span>
                    {discount > 0 && (
                      <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 group-hover/row:bg-green-50 group-hover/row:text-green-600 transition-colors">
                  <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Gradients for smooth fade in/out */}
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [saleCategory, setSaleCategory] = useState<string | undefined>(undefined);
  const [liveAuctions, setLiveAuctions] = useState<any[]>([]);
  const [liveAuctionsLoading, setLiveAuctionsLoading] = useState(true);

  const customer = useAuthStore(state => state.customer);
  const setBuyNowItem = useCartStore(state => state.setBuyNowItem);




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
  const [activeChip, setActiveChip] = useState<string | undefined>('Blockbuster deals');
  const [leftBannerIndex, setLeftBannerIndex] = useState<number>(0);
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

  useEffect(() => {
    if (!dealsData?.data || dealsData.data.length === 0) return;
    const interval = setInterval(() => {
      setLeftBannerIndex((prev) => (prev + 1) % Math.min(dealsData.data.length, 4));
    }, 5000);
    return () => clearInterval(interval);
  }, [dealsData]);

  const leftProduct = (dealsData?.data && dealsData.data.length > 0) ? dealsData.data[leftBannerIndex] : null;
  const leftImageUrl = leftProduct?.images?.[0]?.url || leftProduct?.images?.[0] || '/summer_essentials_hero.png';
  const leftLink = leftProduct ? `/product/${leftProduct.slug}` : '/category/all';

  const topCategories = categories?.filter(c => !c.parent_id && c.slug !== 'clothing').slice(0, 8) ?? [];

  // Map real categories to sale sidebar display names
  const saleDepartments = [
    { name: 'All', slug: undefined },
    { name: 'Electronics', slug: 'electronics' },
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
      <section className="bg-white py-3 md:py-4 border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4 flex flex-col lg:flex-row items-stretch justify-between gap-6">
          {liveAuctions.length > 0 ? (
            <>
              {/* Left Content: Green-themed Live Bids Info */}
              <div className="w-full lg:w-[32%] flex flex-col justify-between bg-gradient-to-br from-[#E2F0D9] to-[#F4F9F1] rounded-[2.5rem] p-8 border border-[#D5E6CD]/30 shadow-xs">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-green-700 text-white text-[9px] font-black uppercase tracking-wider py-1.5 px-3 rounded-full mb-4 animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300"></span>
                    </span>
                    Bidding Live
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-[#1B3B2B] leading-tight tracking-tight">
                    Live Bids Active!
                  </h1>
                  <p className="text-xs text-[#3E654F] font-semibold mt-3 leading-relaxed">
                    Don't just look — place your bids, beat other bidders, and win exclusive products at unbelievable discounts!
                  </p>
                </div>

                {/* Trophy Alert Card */}
                <div className="w-full mt-6 bg-white border border-[#D5E6CD] rounded-[1.5rem] p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-xl">
                    🏆
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black italic text-gray-800 leading-snug">
                      Be the highest bidder and claim your prize today!
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Content (Live Auction Widget) */}
              <div className="w-full lg:w-[68%] flex-shrink-0 z-10 flex">
                <LiveAuctionBannerWidget auction={liveAuctions[0]} />
              </div>
            </>
          ) : (
            <>
              {/* Left Content: Premium Cover Flow Slider */}
              <div className="w-full lg:w-[68%] flex-shrink-0 h-[320px] lg:h-[350px] relative overflow-hidden rounded-[2.5rem] bg-slate-100/50 flex items-center justify-center">
                {/* Background blur/gradient to blend the peeking slides */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-200/50 z-0"></div>

                {/* Slides Container */}
                <div className="relative w-full h-full flex items-center justify-center z-10 perspective-[1200px]">
                  {dealsData?.data && dealsData.data.slice(0, 4).map((product: any, idx: number) => {
                    const total = Math.min(dealsData.data.length, 4);
                    if (total === 0) return null;
                    
                    let diff = idx - leftBannerIndex;
                    if (diff < -1) diff += total;
                    if (diff > 1) diff -= total;

                    const isCurrent = diff === 0;
                    const isPrev = diff === -1;
                    const isNext = diff === 1;

                    let transform = 'translateX(100%) scale(0.5)';
                    let opacity = 'opacity-0';
                    let zIndex = 'z-0';

                    if (isCurrent) {
                      transform = 'translateX(0) scale(1) rotateY(0deg)';
                      opacity = 'opacity-100';
                      zIndex = 'z-30';
                    } else if (isPrev) {
                      transform = 'translateX(-75%) scale(0.8) rotateY(15deg)';
                      opacity = 'opacity-50';
                      zIndex = 'z-10';
                    } else if (isNext) {
                      transform = 'translateX(75%) scale(0.8) rotateY(-15deg)';
                      opacity = 'opacity-50';
                      zIndex = 'z-10';
                    }

                    const bgColors = [
                      'from-[#e2ebf0] to-[#cfd9df]', // Silver
                      'from-[#fdfbfb] to-[#ebedee]', // White
                      'from-[#e0c3fc] to-[#8ec5fc]', // Soft Blue/Purple
                      'from-[#ffecd2] to-[#fcb69f]'  // Peach
                    ];
                    const bgClass = bgColors[idx % bgColors.length];

                    const img = typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0]?.url || '/placeholder.png');

                    return (
                      <div
                        key={product.id}
                        className={`absolute w-[85%] h-[85%] rounded-[2rem] bg-gradient-to-br ${bgClass} shadow-xl border border-white/60 transition-all duration-700 ease-in-out flex flex-col md:flex-row items-center p-6 sm:p-8 cursor-pointer ${opacity} ${zIndex}`}
                        style={{ transform, transformStyle: 'preserve-3d' }}
                        onClick={() => {
                          if (isPrev) setLeftBannerIndex((prev) => (prev - 1 + total) % total);
                          else if (isNext) setLeftBannerIndex((prev) => (prev + 1) % total);
                          else navigate(`/product/${product.slug}`);
                        }}
                      >
                        {/* Text Content */}
                        <div className="w-full md:w-1/2 text-left z-20 flex flex-col justify-center h-full">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            {product.brand || 'Featured Deal'}
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight line-clamp-2">
                            {product.name}
                          </h2>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-xl font-black text-slate-900">
                              ₹{product.selling_price?.toLocaleString('en-IN')}
                            </span>
                            {product.discount_percentage > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                {Math.round(product.discount_percentage)}% OFF
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-5">
                            <button className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full transition-all shadow-md active:scale-95">
                              Shop Now
                            </button>
                          </div>
                        </div>

                        {/* Image Content */}
                        <div className="w-full md:w-1/2 h-40 md:h-full mt-4 md:mt-0 flex items-center justify-center relative z-10" style={{ transform: 'translateZ(40px)' }}>
                          <img
                            src={img}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Left/Right Navigation Buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const total = Math.min(dealsData?.data?.length || 0, 4);
                    if (total > 0) setLeftBannerIndex((prev) => (prev - 1 + total) % total);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-lg flex items-center justify-center text-slate-700 hover:text-black hover:bg-white transition-all z-40 active:scale-95"
                >
                  <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const total = Math.min(dealsData?.data?.length || 0, 4);
                    if (total > 0) setLeftBannerIndex((prev) => (prev + 1) % total);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-lg flex items-center justify-center text-slate-700 hover:text-black hover:bg-white transition-all z-40 active:scale-95"
                >
                  <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                
                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
                  {dealsData?.data && dealsData.data.slice(0, 4).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === leftBannerIndex ? 'bg-slate-800 w-4' : 'bg-slate-400/50'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right Content: Product Slideshow Card */}
              <div className="w-full lg:w-[32%] flex-shrink-0 flex h-[320px] lg:h-[350px]">
                <ProductSlideshowWidget products={dealsData?.data || []} isLoading={dealsLoading} />
              </div>
            </>
          )}
        </div>
      </section>


      {/* Great Summer Sale Results Section */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4">

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sale Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0 hidden lg:block sticky top-4 self-start">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Filtered by</h3>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold border border-green-200 rounded-sm">
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
                    className="block text-xs text-green-700 hover:text-green-900 mt-2"
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
                          className="w-4 h-4 border-gray-300 text-green-600 focus:ring-0"
                        />
                        <span className={`text-sm group-hover:text-green-700 ${saleCategory === dept.slug ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                          {dept.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Special Offers</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'All Deals', value: undefined },
                      { name: 'Deals with Exchange', value: 'Deals with exchange' },
                      { name: 'Blockbuster Deals', value: 'Blockbuster deals' },
                      { name: 'Trending Deals', value: 'Trending deals' }
                    ].map((offer, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="special-offer"
                          checked={activeChip === offer.value || (offer.value === undefined && activeChip === undefined)}
                          onChange={() => setActiveChip(offer.value)}
                          className="w-4 h-4 border-gray-300 text-green-600 focus:ring-0"
                        />
                        <span className={`text-sm group-hover:text-green-700 ${(activeChip === offer.value || (offer.value === undefined && activeChip === undefined)) ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                          {offer.name}
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
                        <input type="checkbox" className="w-4 h-4 border-gray-300 rounded-sm text-green-600 focus:ring-0" />
                        <span className="text-sm text-gray-700 group-hover:text-green-700">{brand}</span>
                      </label>
                    ))}
                    <button className="text-xs text-green-700 hover:text-green-900 mt-1">See more</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Customer Reviews</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="rating" defaultChecked className="w-4 h-4 border-gray-300 text-green-600 focus:ring-0" />
                      <span className="text-sm text-gray-700 group-hover:text-green-700">All</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="rating" className="w-4 h-4 border-gray-300 text-green-600 focus:ring-0" />
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4].map(i => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                        <svg className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-green-700">and up</span>
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
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-green-600 pointer-events-auto z-20 custom-range"
                    />
                    <input
                      type="range" min="0" max="60000" step="1000" value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 1000))}
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-green-600 pointer-events-auto z-10 custom-range"
                    />
                    <div className="absolute h-1.5 bg-green-600 rounded-full z-0" style={{ left: `${(minPrice / 60000) * 100}%`, right: `${100 - (Math.min(maxPrice, 60000) / 60000) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Discount</h3>
                  <p className="text-xs font-bold text-gray-800 mb-4">{minDiscount}% - {maxDiscount}%</p>
                  <div className="relative h-1.5 bg-gray-200 rounded-full mb-8 group/slider">
                    <input
                      type="range" min="0" max="100" step="5" value={minDiscount}
                      onChange={(e) => setMinDiscount(Math.min(Number(e.target.value), maxDiscount - 5))}
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-green-600 pointer-events-auto z-20 custom-range"
                    />
                    <input
                      type="range" min="0" max="100" step="5" value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Math.max(Number(e.target.value), minDiscount + 5))}
                      className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-green-600 pointer-events-auto z-10 custom-range"
                    />
                    <div className="absolute h-1.5 bg-green-600 rounded-full z-0" style={{ left: `${minDiscount}%`, right: `${100 - maxDiscount}%` }}></div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Featured Products</h2>
                <Link to="/category/all?is_featured=true" className="text-green-705 hover:text-green-900 text-sm font-bold">View All</Link>
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
      <section className="bg-gradient-to-br from-[#132a1d] to-[#1e3f2d] py-16 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-green-800/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-green-700/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Are You a Business Buyer?</h2>
          <p className="text-green-100 text-base mb-8 max-w-2xl mx-auto font-medium">
            Get exclusive B2B pricing, bulk order discounts, and a dedicated account manager. Register as a B2B customer today.
          </p>
          <Link
            to="/register?type=b2b"
            className="inline-flex items-center gap-2 px-10 py-4 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-full shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all duration-200"
          >
            Register as B2B Customer
          </Link>
        </div>
      </section>
    </div>
  );
}
