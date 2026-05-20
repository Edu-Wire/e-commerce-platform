import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import ConditionBadge from './ConditionBadge';
import { useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/languageStore';

interface ProductCardProps {
  product: Product;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const setDrawerOpen = useCartStore(s => s.setDrawerOpen);
  const setLastAddedItem = useCartStore(s => s.setLastAddedItem);
  const { language } = useLanguageStore();
  const [translatedName, setTranslatedName] = useState(product.name);

  useEffect(() => {
    if (language !== 'EN') {
      const fetchTranslation = async () => {
        try {
          const res = await fetch(`https://api.mymemory.com/get?q=${encodeURIComponent(product.name)}&langpair=en|${language.toLowerCase()}`);
          const json = await res.json();
          if (json.responseData?.translatedText) {
            setTranslatedName(json.responseData.translatedText);
          }
        } catch (err) {
          console.error('Translation error:', err);
        }
      };
      fetchTranslation();
    } else {
      setTranslatedName(product.name);
    }
  }, [language, product.name]);

  const primaryImage = product.images?.find(img => (typeof img === 'object' && img !== null && img.is_primary))?.url
    ?? (typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url)
    ?? null;

  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const item = {
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image: primaryImage ?? undefined,
      mrp: product.mrp,
      price: product.selling_price,
      quantity: 1,
      condition: product.condition,
      sku: product.sku,
      stock_quantity: product.stock_quantity
    };
    addItem(item);
    setLastAddedItem({ ...item, category_slug: (product as any).category_slug });
    setDrawerOpen(true);
    toast.success(`${product.name} added to cart!`);
  };

  const handleAuctionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.active_auction_id) return;
    navigate(`/live-auction/${product.active_auction_id}`);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group bg-white flex flex-col hover:shadow-md transition-shadow duration-200 border-transparent border hover:border-gray-100 p-2"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] mb-3 bg-white rounded-sm overflow-hidden flex items-center justify-center p-1">
        {product.active_auction_id && (
          <button
            onClick={handleAuctionClick}
            className="absolute left-2 top-2 z-10 flex items-center gap-2 animate-pulse cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="rounded-full bg-red-600 text-white text-xs font-bold uppercase px-3 py-1.5 shadow-lg border-2 border-red-400">
              Live auction
            </span>
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        )}
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}

        {/* Action Button */}
        {!product.active_auction_id && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-gray-900 font-bold border z-10 bg-[#FFD814] hover:bg-[#F7CA00] border-[#F2C200]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
        )}
      </div>

      {/* Sale Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        {product.discount_percentage > 0 && (
          <span className="bg-[#CC0C39] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
            {Math.round(product.discount_percentage)}% off
          </span>
        )}
        <span className="text-[#CC0C39] text-[11px] font-bold uppercase tracking-tight">Great Summer Deal</span>
      </div>

      {/* Price Section */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-xs align-top mt-1">₹</span>
        <span className="text-xl font-bold text-gray-900 leading-none">{product.selling_price.toLocaleString('en-IN')}</span>
        <span className="text-[11px] text-gray-500 ml-1">M.R.P.: <span className="line-through">{fmt(product.mrp)}</span></span>
      </div>
      {product.active_auction_id && (
        <div className="text-[11px] text-red-600 mb-1">
          Current bid: ₹{Number(product.auction_current_highest_bid ?? product.auction_reserve_price ?? 0).toLocaleString('en-IN')}
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 group-hover:text-orange-700 transition-colors">
        {translatedName}
      </h3>

      {/* Ratings Placeholder */}
      <div className="flex items-center gap-1 mb-2">
        <div className="flex text-orange-400">
          {[1, 2, 3, 4].map(i => <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
          <svg className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        </div>
        <span className="text-[11px] text-blue-600 hover:text-orange-700 cursor-pointer">4,281</span>
      </div>

      {/* Shop Deal Link */}
      <div className="mt-auto">
        <span className="text-xs text-blue-700 hover:text-orange-700 hover:underline cursor-pointer">
          Shop {product.brand || 'exclusive'} deals
        </span>
      </div>
    </Link>
  );
}
