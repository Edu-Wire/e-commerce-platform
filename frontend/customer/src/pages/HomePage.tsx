import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ui/ProductCard';
import ProductCardSkeleton from '../components/ui/ProductCardSkeleton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { removeBackground } from '@imgly/background-removal';

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
    useCartStore.getState().addItem(item);
    navigate('/cart');
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

  const [processedImages, setProcessedImages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const processImages = async () => {
      const urls: string[] = [];
      for (const url of imageList) {
        try {
          const blob = await removeBackground(url, {
            publicPath: "https://static.imgly.com/@imgly/background-removal/1.4.3/dist/"
          });
          const objUrl = URL.createObjectURL(blob);
          if (active) urls.push(objUrl);
        } catch (error) {
          console.error('Background removal failed for', url, error);
          if (active) urls.push(url);
        }
      }
      if (active) setProcessedImages(urls);
    };

    if (imageList.length > 0) {
      processImages();
    }

    return () => { active = false; };
  }, [JSON.stringify(imageList)]);

  const displayImages = processedImages.length > 0 ? processedImages : imageList;

  useEffect(() => {
    if (displayImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 4000); // Auto slide every 4 seconds
    return () => clearInterval(timer);
  }, [displayImages.length]);

  return (
    <div className="w-full bg-white rounded-[2rem] border border-gray-200/80 shadow-xs overflow-hidden flex flex-col lg:flex-row items-stretch text-slate-800 select-none">

      {/* 1. Left Content: Green-themed Live Bids Info */}
      <div className="w-full lg:w-[28%] flex flex-col justify-between bg-gradient-to-br from-[#E2F0D9] to-[#F4F9F1] p-6 lg:p-8 border-b lg:border-b-0 border-[#D5E6CD]/50">
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
          <p className="text-xs text-[#3E654F]/80 font-medium mt-2">
            Join the action now! Incredible deals are just a bid away.
          </p>
        </div>

        {/* Trophy Alert Card */}
        <div className="w-full mt-6 bg-white border border-[#D5E6CD] rounded-[1.5rem] p-4 flex items-center gap-3.5 shadow-xs">

          <div className="flex-1">
            <p className="text-xs font-black italic text-gray-800 leading-snug">
              Be the highest bidder and claim your prize today!
            </p>
          </div>
        </div>
      </div>

      {/* 2. Middle Panel: Product Image Card */}
      <div className="w-full lg:w-[35%] bg-gradient-to-tr from-[#E8F5E9] via-[#F4F9F1] to-[#FFFFFF] relative flex items-center justify-center min-h-[220px] md:min-h-[200px] border-b lg:border-b-0 border-slate-100 flex-shrink-0">

        {/* Crossfade Product Image Slideshow */}
        {displayImages.map((imgSrc, idx) => (
          <img
            key={idx}
            src={imgSrc}
            alt={`${auction.product_name} - ${idx + 1}`}
            className={`absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-contain z-0 transition-opacity duration-700 ease-in-out mix-blend-multiply ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>';
            }}
          />
        ))}

        {/* Left/Right Slider Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
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
                setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
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
        {displayImages.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[25] flex gap-1.5 bg-[#1B3B2B]/30 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
            {displayImages.map((_, idx) => (
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

      {/* 3. Right Panel: Bidding & Information Card */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between relative z-10">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-1.5 ${isUpcoming ? 'bg-amber-500' : 'bg-green-700'} text-white text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg shadow-sm mb-2`}>
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


          </div>


        </div>

        {/* Bidding Ends / Current Bid Dark Green Console */}
        <div className="mt-3">
          <div className="bg-[#1B3B2B] text-white p-3 rounded-[1rem] flex items-center justify-between shadow-lg shadow-green-900/10 border border-white/5">
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
                  <span className="text-[8px] text-green-300 font-black uppercase mt-1 tracking-widest">Hrs</span>
                </div>
                <span className="text-white font-black text-xl -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="bg-white text-slate-900 font-black text-xl px-2 py-1 rounded-lg min-w-[36px] text-center shadow-xs leading-none">{timeLeft.minutes}</span>
                  <span className="text-[8px] text-green-300 font-black uppercase mt-1 tracking-widest">Mins</span>
                </div>
                <span className="text-white font-black text-xl -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="bg-white text-slate-900 font-black text-xl px-2 py-1 rounded-lg min-w-[36px] text-center shadow-xs leading-none">{timeLeft.seconds}</span>
                  <span className="text-[8px] text-green-300 font-black uppercase mt-1 tracking-widest">Secs</span>
                </div>
              </div>
            </div>

            {/* Dotted Vertical Divider */}
            <div className="h-12 border-l border-dashed border-green-500/30 mx-4"></div>

            {/* Current Leading Bid - Left Aligned in its section */}
            <div className="flex-1 flex flex-col items-start">
              <span className="text-green-200 text-[10px] font-black uppercase tracking-wider">
                {isUpcoming ? 'Starting Price' : 'Current Leading Bid'}
              </span>
              <span className="text-[22px] font-black text-[#4ADE80] mt-1.5 leading-none font-mono">
                ₹{(auction.current_highest_bid || auction.reserve_price || 0).toLocaleString()}
              </span>
              <span className="mt-1 px-3 py-1 rounded-full bg-[#E2F0D9] text-[#1B3B2B] text-[9.5px] font-black border border-green-200/50 leading-none">
                {auction.total_bids || 0} Bids
              </span>
            </div>
          </div>

          {/* Place Bid Button */}
          <button
            onClick={() => navigate(`/live-auction/${auction.id}`)}
            className={`w-full py-2.5 mt-3 ${isUpcoming ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white font-black text-sm rounded-[0.8rem] shadow-md transition-all duration-300 active:scale-95 flex items-center justify-center gap-2`}
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

  const heroImages = (featuredData?.slice(0, 4) || []).map(p => {
    let url = typeof p.images?.[0] === 'string' ? p.images[0] : (p.images?.[0]?.url || '/placeholder.png');
    if (url.startsWith('/')) url = `${(import.meta as any).env.VITE_API_URL || "http://localhost:4000"}${url}`;
    return url;
  }).filter(url => url !== '/placeholder.png');

  if (heroImages.length === 0) heroImages.push('/summer_essentials_hero.png');

  const [processedHeroImages, setProcessedHeroImages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const processImages = async () => {
      const urls: string[] = [];
      for (const url of heroImages) {
        try {
          const blob = await removeBackground(url, {
            publicPath: "https://static.imgly.com/@imgly/background-removal/1.4.3/dist/"
          });
          const objUrl = URL.createObjectURL(blob);
          if (active) urls.push(objUrl);
        } catch (error) {
          console.error('Background removal failed for', url, error);
          if (active) urls.push(url);
        }
      }
      if (active) setProcessedHeroImages(urls);
    };

    if (heroImages.length > 0) {
      processImages();
    }

    return () => { active = false; };
  }, [JSON.stringify(heroImages)]);

  const displayHeroImages = processedHeroImages.length > 0 ? processedHeroImages : heroImages;

  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    if (displayHeroImages.length <= 1) return;
    const timer = setInterval(() => {
      setHeroImageIndex(prev => (prev + 1) % displayHeroImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [displayHeroImages.length]);

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
            <div className="w-full flex-shrink-0 z-10 flex">
              <LiveAuctionBannerWidget auction={liveAuctions[0]} />
            </div>
          ) : (
            <>
              {/* Left Content: Green Summer Essentials Banner */}
              <div className="w-full lg:w-[68%] flex-shrink-0 flex">
                <div className="bg-gradient-to-br from-[#E2F0D9] to-[#F4F9F1] rounded-[2rem] p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden flex-1 shadow-xs border border-[#D5E6CD]/35">
                  <div className="flex-1 flex flex-col justify-center text-left max-w-md">
                    <h1 className="text-2xl sm:text-4xl font-black text-[#1B3B2B] leading-tight tracking-tight">
                      Discover the Best of ShopNow
                    </h1>
                    <p className="text-xs text-[#3E654F] font-semibold mt-1.5 leading-relaxed">
                      Top-rated products, exclusive deals, and fast delivery.
                    </p>
                    <Link
                      to="/category/all"
                      className="mt-2.5 px-5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-extrabold rounded-full text-xs flex items-center gap-2 w-fit transition-all hover:gap-3 shadow-sm border border-brand-primary/20 active:scale-95"
                    >
                      Shop Now
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                  <div className="w-full md:w-[40%] flex-shrink-0 flex items-center justify-center relative min-h-[160px] sm:min-h-[180px] group/slider">
                    {displayHeroImages.map((imgSrc, idx) => (
                      <img
                        key={idx}
                        src={imgSrc}
                        alt="Summer Essentials"
                        className={`absolute inset-0 m-auto max-h-[170px] sm:max-h-[190px] w-auto object-contain transform hover:scale-105 transition-all duration-700 ease-in-out mix-blend-multiply ${idx === heroImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                      />
                    ))}
                    {displayHeroImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeroImageIndex((prev) => (prev - 1 + displayHeroImages.length) % displayHeroImages.length);
                          }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-[25] w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-slate-100"
                        >
                          <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeroImageIndex((prev) => (prev + 1) % displayHeroImages.length);
                          }}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-[25] w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-slate-100"
                        >
                          <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Content: Summer Winter Sale Card */}
              <div className="w-full lg:w-[32%] flex-shrink-0 flex">
                <div className="bg-white border border-gray-200/80 rounded-[2rem] p-4 shadow-xs flex flex-col justify-between h-full w-full max-w-md mx-auto relative overflow-hidden group">
                  {/* Decorative faint background shape */}
                  <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-brand-primaryLight rounded-full blur-2xl group-hover:bg-brand-primaryLight/80 transition-colors duration-500 z-0"></div>

                  <div className="z-10 relative">
                    <h3 className="text-brand-primary font-bold text-[9px] tracking-widest mb-2 uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                      Limited Time Offer
                    </h3>

                    <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">
                      Summer & Winter
                      <span className="block text-brand-primary mt-0.5">SUPER SALE</span>
                    </h2>

                    <p className="text-xs text-gray-500 font-medium mb-2 mt-1 leading-relaxed">
                      Enjoy massive discounts up to <span className="text-gray-900 font-bold">70% OFF</span>
                    </p>

                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                        <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Exclusive Online Deals
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                        <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Fast Free Delivery
                      </div>
                    </div>
                  </div>

                  <Link to="/category/all?sort=discount_desc" className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-black text-gray-800 hover:text-brand-primaryHover cursor-pointer group/btn transition-colors z-10 relative">
                    <span>EXPLORE ALL DEALS</span>
                    <div className="w-7 h-7 rounded-full bg-brand-primaryLight flex items-center justify-center group-hover/btn:bg-brand-primaryLight/80 transition-colors">
                      <svg className="w-3.5 h-3.5 text-brand-primary transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>



      {/* Policy Strip */}
      <section className="bg-white py-3 border-b border-gray-50">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primaryLight flex items-center justify-center text-brand-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">100% Original</h4>
                <p className="text-xs text-gray-500 font-medium">Genuine Products</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primaryLight flex items-center justify-center text-brand-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Fast Delivery</h4>
                <p className="text-xs text-gray-500 font-medium">Quick & Reliable</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primaryLight flex items-center justify-center text-brand-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Easy Returns</h4>
                <p className="text-xs text-gray-500 font-medium">Hassle Free</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primaryLight flex items-center justify-center text-brand-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Secure Payment</h4>
                <p className="text-xs text-gray-500 font-medium">100% Protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primaryLight flex items-center justify-center text-brand-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Best Prices</h4>
                <p className="text-xs text-gray-500 font-medium">Everyday Low Prices</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Deals of the Day */}
      <section className="bg-white pt-2 pb-6">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900">Deals of the Day</h2>
            <Link to="/category/all?sort=discount_desc" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-brand-primaryHover bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors border border-gray-100">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dealsLoading ? (
              [...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)
            ) : (
              dealsData?.data.slice(0, 5).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Mid Banner Split */}
      <section className="bg-white py-6">
        <div className="max-w-[1500px] mx-auto px-4 flex flex-col md:flex-row gap-6">
          {/* Bank Offer */}
          <div className="flex-1 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-[2rem] p-8 flex items-center justify-between relative overflow-hidden border border-amber-200/50 group cursor-pointer hover:shadow-sm transition-all">
            <div className="relative z-10">
              <p className="text-amber-800 text-sm font-bold mb-1">Bank Offer</p>
              <h3 className="text-4xl font-black text-gray-900 mb-2">20% OFF</h3>
              <p className="text-gray-600 text-sm font-medium mb-6">On all orders above ₹5000</p>
              <button className="bg-[#1B3B2B] hover:bg-[#2A4C3A] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md transition-all flex items-center gap-2">
                Shop Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-64 h-64 bg-amber-200/40 rounded-full blur-3xl"></div>
            {/* Decorative Card Image Placeholder */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-24 bg-gradient-to-tr from-[#3E654F] to-[#5a8c70] rounded-xl shadow-2xl -rotate-12 transform group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center overflow-hidden border border-white/20">
              <div className="absolute top-3 left-3 w-6 h-4 bg-yellow-400/80 rounded-sm"></div>
              <div className="absolute bottom-3 left-3 text-white/50 text-[10px] font-mono tracking-widest">**** **** **** 1234</div>
              <div className="absolute bottom-3 right-3 text-white/80 text-[10px] font-bold italic">BuyMore</div>
            </div>
          </div>

          {/* Luxury Sale */}
          <div className="flex-1 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-[2rem] p-8 flex items-center justify-between relative overflow-hidden border border-purple-100 group cursor-pointer hover:shadow-sm transition-all">
            <div className="relative z-10">
              <p className="text-purple-800 text-sm font-bold mb-1">Luxury Sale</p>
              <h3 className="text-4xl font-black text-gray-900 mb-2">Up to 40% Off</h3>
              <p className="text-gray-600 text-sm font-medium mb-6">On selected products</p>
              <button className="bg-purple-800 hover:bg-purple-900 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md transition-all flex items-center gap-2">
                Explore Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-200/40 rounded-full blur-3xl"></div>
            {/* Decorative Gift Image Placeholder */}
            <div className="absolute right-8 bottom-0 w-32 h-32 bg-gradient-to-t from-purple-300 to-purple-200 rounded-t-lg shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500 border border-white/40 flex items-center justify-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 -mt-4 bg-fuchsia-300 rounded-full blur-sm"></div>
              <div className="w-full h-2 bg-purple-100/50 absolute top-1/2 -translate-y-1/2"></div>
              <div className="h-full w-2 bg-purple-100/50 absolute left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </section>





      {/* Customers Also Loved */}
      <section className="bg-white py-10">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Customers Also Loved</h2>
            <Link to="/category/all?sort=newest" className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors">
              View All
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
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
              {newLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[240px]">
                    <ProductCardSkeleton />
                  </div>
                ))
              ) : (
                newArrivalsData?.data.map((product: any) => (
                  <div key={product.id} className="flex-shrink-0 w-[240px]">
                    <ProductCard product={product} />
                  </div>
                ))
              )}
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

      {/* Latest Deals For This Week */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-2">
            <div className="flex items-end gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Latest Deals for This Week</h2>
              <p className="text-sm text-gray-400 hidden sm:block pb-1">Don't miss out on this week's deals</p>
            </div>
            <Link to="/category/all?sort=price_asc" className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors whitespace-nowrap">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dealsLoading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-[1rem] border border-gray-200 overflow-hidden flex h-48 w-full animate-pulse">
                  <div className="w-[45%] bg-gray-100 h-full"></div>
                  <div className="w-[55%] p-5 flex flex-col justify-center border-l border-gray-50">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-1.5 bg-gray-200 rounded-full w-full mt-auto"></div>
                  </div>
                </div>
              ))
            ) : dealsData?.data?.slice(2, 4).map((product: any, idx: number) => {
              const discount = Math.round(product.discount_percentage) || 15;
              const available = product.stock_quantity || 20;
              const sold = (product.id * 7) % 50 + 10; // Pseudo-random deterministic sold count
              const percentSold = (sold / (available + sold)) * 100;

              let imgUrl = '/placeholder.png';
              try {
                const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  imgUrl = typeof parsed[0] === 'string' ? parsed[0] : (parsed[0]?.url || '/placeholder.png');
                  if (imgUrl.startsWith('/')) imgUrl = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${imgUrl}`;
                }
              } catch (e) { }

              return (
                <div key={product.id} className="bg-white rounded-[1rem] border border-gray-200 overflow-hidden flex relative hover:shadow-md transition-shadow group">
                  {/* Discount Badge */}
                  <div className="absolute top-0 left-0 bg-[#ef4444] text-white text-xs font-bold px-3 py-2 rounded-br-xl z-10">
                    {discount}%
                  </div>

                  {/* Image */}
                  <Link to={`/product/${product.slug}`} className="w-[45%] p-6 flex items-center justify-center bg-white relative">
                    <img src={imgUrl} alt={product.name} className="w-full h-32 object-contain mix-blend-multiply transition-transform" />
                    <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-[#ef4444] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-colors border border-gray-100 z-10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </Link>

                  {/* Content */}
                  <div className="w-[55%] p-5 flex flex-col justify-center border-l border-gray-50 bg-white">
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-bold text-gray-800 line-clamp-2 hover:text-brand-primary transition-colors text-sm">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-1 mt-2.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                      <span className="text-xs text-gray-500 ml-1 font-medium">1 review</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-gray-400 text-sm font-medium line-through decoration-gray-300">₹{product.mrp.toLocaleString('en-IN')}</span>
                      <span className="text-[#ef4444] font-black text-xl">₹{product.selling_price.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-400 to-[#ef4444] h-1.5 rounded-full" style={{ width: `${percentSold}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <span>Available: <span className="text-gray-800">{available}</span></span>
                        <span>Sold: <span className="text-gray-800">{sold}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
            className="inline-flex items-center gap-2 px-10 py-4 bg-brand-primary hover:bg-brand-primaryHover text-white font-extrabold rounded-full shadow-lg hover:shadow-brand-primary/20 active:scale-95 transition-all duration-200"
          >
            Register as B2B Customer
          </Link>
        </div>
      </section>
    </div>
  );
}
