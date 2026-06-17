import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
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
  const { items: wishlistItems, addItem: addWishlistItem, removeItem: removeWishlistItem, isInWishlist } = useWishlistStore();
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

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeWishlistItem(product.id);
      toast.success(`${product.name} removed from wishlist!`);
    } else {
      addWishlistItem({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        image: primaryImage ?? undefined,
        mrp: product.mrp,
        price: product.selling_price,
        condition: product.condition,
        sku: product.sku,
        stock_quantity: product.stock_quantity
      });
      toast.success(`${product.name} added to wishlist!`);
    }
  };

  const colors = [
    'bg-[#e6eaf0]', // Slate Blue
    'bg-[#f4edd4]', // Soft Sand
    'bg-[#d5f0ea]', // Sage Mint
    'bg-[#d7f0df]', // Mint Green
    'bg-[#f5dadb]', // Rose Pink
    'bg-[#ebf3f5]', // Ice Blue
    'bg-[#f6ebf5]', // Pale Lavender
    'bg-[#faf0e6]', // Linen/Almond
    'bg-[#f0fff0]', // Honeydew Green
    'bg-[#fdf5e6]', // Old Lace
  ];

  const getBgColor = (slug: string, name: string) => {
    const key = slug || name || '';
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const bgColor = getBgColor(product.slug, product.name);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group/card bg-white flex flex-col rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden relative h-full min-h-[290px]"
    >
      {/* Top Image Section */}
      <div className={`relative h-[135px] w-full ${bgColor} flex items-center justify-center border-b-[3px] border-dotted border-gray-300/40 p-3`}>
        {/* Discount Badge */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-[#eb3449] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            {Math.round(product.discount_percentage)}% off
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full shadow-sm flex items-center justify-center font-bold z-20 transition-colors ${
            isInWishlist(product.id)
              ? 'bg-red-50 text-red-500 hover:bg-red-100'
              : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
          title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg className="w-3.5 h-3.5" fill={isInWishlist(product.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* White Glow Circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
           <div className="w-24 h-24 bg-white/60 rounded-full blur-xl"></div>
           <div className="absolute w-20 h-20 bg-white/50 rounded-full"></div>
        </div>

        {/* Product Image */}
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="max-w-[100px] max-h-[100px] object-contain relative z-10 transition-transform duration-500 mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 relative z-10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}

        {/* Out of Stock Overlay / Badge */}
        {isOutOfStock && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <span className="bg-red-500/90 text-white text-[9px] font-bold uppercase px-2 py-1 rounded-full shadow-md backdrop-blur-sm border border-red-400">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Bottom Content Section */}
      <div className="p-3 flex flex-col flex-1 bg-white">
        <div className="bg-green-50 text-green-600 text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded w-fit flex items-center gap-1 tracking-wider mb-1.5">
          <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" /></svg>
          Great Summer Deal
        </div>

        <h3 className="text-xs font-bold text-gray-900 line-clamp-2 mb-2 leading-snug group-hover/card:text-brand-primary transition-colors">
          {translatedName}
        </h3>

        <div className="mt-auto">
          {/* Star Ratings just above Price */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4].map(i => <svg key={i} className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
              <svg className="w-2.5 h-2.5 text-gray-200 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <span className="text-[9px] font-bold text-gray-500 hover:text-gray-700 cursor-pointer">{Number(product.average_rating || 4.5).toFixed(1)}</span>
          </div>

          {/* Price & Add Button Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm font-extrabold text-gray-900 leading-none">₹{product.selling_price.toLocaleString('en-IN')}</span>
              <span className="text-[9px] font-medium text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-white font-bold text-[10px] transition-colors shadow-sm ${
                isOutOfStock 
                  ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                  : 'bg-brand-primary hover:bg-brand-primaryHover active:scale-95'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Add
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
