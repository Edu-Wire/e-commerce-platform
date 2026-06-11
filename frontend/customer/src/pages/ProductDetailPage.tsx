import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useLanguageStore, translations } from '../store/languageStore';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isOutbidOffer = searchParams.get('outbid_offer') === 'true';
  const offerPriceParam = searchParams.get('price');

  const { language } = useLanguageStore();
  const t = translations[language] || translations['EN'];
  const { data: product, isLoading, error } = useProduct(slug!);
  const { data: relatedData } = useProducts({
    category: product?.category?.slug,
    limit: 12
  });
  const addItem = useCartStore(s => s.addItem);
  const setBuyNowItem = useCartStore(s => s.setBuyNowItem);
  const setDrawerOpen = useCartStore(s => s.setDrawerOpen);
  const setLastAddedItem = useCartStore(s => s.setLastAddedItem);
  const { items: wishlistItems, addItem: addWishlistItem, removeItem: removeWishlistItem, isInWishlist } = useWishlistStore();
  const customer = useAuthStore(s => s.customer);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [showRecMenu, setShowRecMenu] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [rufusQuery, setRufusQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const categorySlug = product?.category?.slug || 'all';
      navigate(`/category/${categorySlug}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const askRufus = (question: string) => {
    if (!question.trim()) return;
    window.dispatchEvent(new CustomEvent('ai-chat-ask', { detail: { question: `[About: ${product?.name}] ${question}` } }));
  };

  // Zoom State
  const [zoomState, setZoomState] = useState({ show: false, x: 0, y: 0 });

  // Reviews State
  const queryClient = useQueryClient();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('reviews');

  useEffect(() => {
    if (product?.id) {
      setLoadingReviews(true);
      api.get(`/products/${product.id}/reviews`)
        .then((res) => {
          if (res.data.success) {
            console.log('Total reviews fetched:', res.data.data.length, res.data.data);
            setReviews(res.data.data);
          }
        })
        .catch((err) => console.error('Failed to fetch reviews:', err))
        .finally(() => setLoadingReviews(false));
    }
  }, [product?.id]);


  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />;
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Product not found</h2>
        <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const primaryImage = images.find((img: any) => typeof img === 'object' && img !== null && img.is_primary)?.url
    ?? (typeof images[0] === 'string' ? images[0] : (images[0] as any)?.url)
    ?? null;
  const currentImage = selectedImageIdx === 0 ? primaryImage : (typeof images[selectedImageIdx] === 'string' ? images[selectedImageIdx] : (images[selectedImageIdx] as any)?.url);
  const isOutOfStock = product.stock_quantity <= 0;
  const isB2B = customer?.customer_type === 'b2b';
  const relatedProducts = relatedData?.data.filter(p => p.id !== product.id).slice(0, 10) ?? [];

  const offerPrice = isOutbidOffer && offerPriceParam ? parseFloat(offerPriceParam) : null;
  const displayPrice = offerPrice !== null ? offerPrice : product.selling_price;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const item = {
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image: currentImage ?? undefined,
      mrp: product.mrp,
      price: displayPrice,
      quantity,
      condition: product.condition,
      sku: product.sku,
      stock_quantity: product.stock_quantity,
      auction_id: isOutbidOffer ? Number(searchParams.get('auction_id')) : undefined
    };
    addItem(item);
    setLastAddedItem({ ...item, category_slug: (product as any).category_slug });
    setDrawerOpen(true);
    toast.success(`${product.name} added to cart at special price!`);
  };

  const handleAddToCartRelated = (e: React.MouseEvent, rp: any) => {
    e.stopPropagation();
    const primaryImage = typeof rp.images?.[0] === 'string' ? rp.images[0] : (rp.images?.[0] as any)?.url;
    const item = {
      product_id: rp.id,
      name: rp.name,
      slug: rp.slug,
      image: primaryImage,
      mrp: rp.mrp,
      price: rp.selling_price,
      quantity: 1,
      condition: rp.condition || 'new',
      sku: rp.sku || `SKU-${rp.id}`,
      stock_quantity: rp.stock_quantity || 10
    };
    addItem(item);
    setLastAddedItem(item);
    setDrawerOpen(true);
    toast.success(`${rp.name} added to cart!`);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeWishlistItem(product.id);
      toast.success(`${product.name} removed from wishlist!`);
    } else {
      addWishlistItem({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        image: currentImage ?? undefined,
        mrp: product.mrp,
        price: displayPrice,
        condition: product.condition,
        sku: product.sku,
        stock_quantity: product.stock_quantity
      });
      toast.success(`${product.name} added to wishlist!`);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;

    // Only show zoom if not in the bottom 10% of the container
    if (y > 90) {
      setZoomState(prev => ({ ...prev, show: false }));
    } else {
      setZoomState({ show: true, x, y });
    }
  };

  const handleMouseLeave = () => {
    setZoomState({ ...zoomState, show: false });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      toast.error('Please login to submit a review');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.post(`/products/${product!.id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewContent
      });
      if (res.data.success) {
        toast.success('Review submitted successfully!');
        setReviewTitle('');
        setReviewContent('');
        setReviewRating(5);
        setShowReviewModal(false);
        // Refresh reviews
        api.get(`/products/${product!.id}/reviews`).then((res) => {
          if (res.data.success) setReviews(res.data.data);
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const specs = product.specifications ?? {};

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans text-[#1c1c1c] overflow-x-hidden pb-10">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-6 py-4 text-[13px] text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-green-600 transition-colors">Home</Link>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        {product.category && (
          <>
            <Link to={`/category/${product.category.slug}`} className="hover:text-green-600 transition-colors">{product.category.name}</Link>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </>
        )}
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6">
        {/* Top 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_350px] gap-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">

          {/* Column 1: Images */}
          <div className="flex gap-4 relative">
            <div className="absolute top-4 right-4 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200 z-10 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              Best Seller
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-3 w-16">
                {images.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setSelectedImageIdx(idx)}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${idx === selectedImageIdx ? 'border-green-600 shadow-sm' : 'border-gray-100 hover:border-green-300'}`}
                  >
                    <img src={typeof img === 'string' ? img : (img as any).url} alt="" className="w-full h-full object-contain p-1 bg-white" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 bg-gray-50 rounded-2xl p-6 flex items-center justify-center relative min-h-[400px]">
              <img src={currentImage || '/placeholder.png'} alt={product.name} className="max-w-full max-h-[400px] object-contain mix-blend-multiply" />
              <button className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              </button>
            </div>
          </div>

          {/* Column 2: Product Info */}
          <div className="flex flex-col space-y-5">
            <div>
              <p className="text-green-600 font-semibold text-sm mb-2">{product.brand || 'Generic'}</p>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">{product.name}</h1>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4].map(s => <span key={s}>★</span>)}<span className="text-gray-300">★</span>
                </div>
                <span className="font-bold text-gray-900">{Number(product.average_rating || 4.5).toFixed(1)}</span>
                <span className="text-gray-500">({(product.review_count || 128)} reviews)</span>
              </div>
            </div>

            {product.discount_percentage > 0 && (
              <div className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded text-xs w-fit">
                {product.discount_percentage}% OFF
              </div>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">₹{(displayPrice * quantity).toLocaleString('en-IN')}</span>
              {product.mrp > displayPrice && (
                <span className="text-gray-400 line-through text-lg">₹{(product.mrp * quantity).toLocaleString('en-IN')}</span>
              )}
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3 items-start">
              <div className="bg-white p-2 rounded-lg shadow-sm text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-green-800 font-bold text-sm">Premium quality</p>
                <p className="text-green-700 text-xs mt-0.5">Rust proof • Durable • Food safe</p>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-y border-gray-100">
              {[
                { icon: '🛡️', label: 'Rust Proof' },
                { icon: '💧', label: 'Dishwasher Safe' },
                { icon: '🥗', label: 'Food Grade' },
                { icon: '🔨', label: 'Durable' }
              ].map((ft, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-lg grayscale group-hover:grayscale-0 group-hover:border-green-200 transition-all bg-white">{ft.icon}</div>
                  <span className="text-[11px] text-gray-600 font-medium">{ft.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              <span className="text-green-600 font-bold">Free delivery</span> on orders above ₹500
            </div>
          </div>

          {/* Column 3: Buy Box */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">₹{(displayPrice * quantity).toLocaleString('en-IN')}</h2>
            <p className="text-xs text-gray-500 mb-4">Inclusive of all taxes</p>

            <div className={`flex items-center gap-1.5 font-bold text-sm mb-4 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
              {isOutOfStock ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Out of Stock
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  In Stock
                </>
              )}
            </div>

            <div className="flex flex-col gap-1 text-xs text-gray-600 mb-6 border-b border-gray-100 pb-4">
              <div className="flex justify-between"><span>Sold by</span><span className="font-bold text-gray-900">ShopNow</span></div>
              <div className="flex justify-between"><span>Rating</span><span className="font-bold text-gray-900">4.5 ★ (2.5k ratings)</span></div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-gray-700 block mb-2">Quantity</label>
              <div className="flex items-center border border-gray-200 rounded-full w-fit bg-gray-50">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOutOfStock} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-50">-</button>
                <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} disabled={isOutOfStock} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-50">+</button>
              </div>
            </div>

            <div className="space-y-3 mt-auto">
              <button disabled={isOutOfStock} onClick={handleAddToCart} className={`w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${isOutOfStock ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 active:scale-95'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  const item = {
                    product_id: product.id, name: product.name, slug: product.slug, image: currentImage ?? undefined,
                    mrp: product.mrp, price: displayPrice, quantity, condition: product.condition,
                    sku: product.sku, stock_quantity: product.stock_quantity,
                    auction_id: isOutbidOffer ? Number(searchParams.get('auction_id')) : undefined
                  };
                  addItem(item);
                  setLastAddedItem({ ...item, category_slug: (product as any).category_slug });
                  navigate('/cart');
                }}
                className={`w-full py-3.5 rounded-full font-bold text-sm transition-all ${isOutOfStock ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed' : 'bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 active:scale-95'}`}>
                Buy Now
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`w-full py-3.5 border rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${isInWishlist(product.id)
                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <svg className="w-4 h-4" fill={isInWishlist(product.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-2"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Secure Payment</div>
              <div className="flex items-center gap-2"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> 7 Days Easy Returns</div>
            </div>
          </div>
        </div>

        {/* Tabs & Shield Card */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
            <div className="flex items-center gap-8 border-b border-gray-100 mb-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'details' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-900 transition-colors'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Product Details
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-3 text-sm font-bold ${activeTab === 'reviews' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-900 transition-colors'}`}>
                Reviews ({reviews.length})
              </button>
            </div>

            <div>
              {activeTab === 'details' && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">About this item</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                    {product.description || `${product.name} is perfect for kitchen use. Made from high quality stainless steel, these bowls are rust proof, durable and easy to clean.`}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2"><svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Made from premium quality materials</li>
                    <li className="flex items-start gap-2"><svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Durable and long lasting</li>
                    <li className="flex items-start gap-2"><svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Easy to clean and maintain</li>
                  </ul>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Customer Reviews</h3>
                      <p className="text-sm text-gray-500">Read what others are saying about this product</p>
                    </div>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-6 py-2.5 bg-[#1a3b2b] text-white rounded-full text-sm font-bold shadow-md hover:bg-[#112a1f] hover:shadow-lg transition-all active:scale-95"
                    >
                      Write a Review
                    </button>
                  </div>

                  {/* Summary Section */}
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-8 border border-gray-100">
                    <div className="flex flex-col items-center text-center shrink-0">
                      <div className="text-5xl font-bold text-gray-900 tracking-tight">{Number(product.average_rating || 4.5).toFixed(1)}</div>
                      <div className="flex text-[#fbbd00] text-lg my-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={star <= (product.average_rating || 4.5) ? 'text-[#fbbd00]' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Based on {reviews.length || 128} reviews</p>
                    </div>

                    <div className="w-full h-px md:w-px md:h-24 bg-gray-200"></div>

                    <div className="flex-1 w-full space-y-2">
                      {[5, 4, 3, 2, 1].map((star, i) => (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-600 w-10 flex items-center gap-1">{star} <span className="text-[#fbbd00]">★</span></span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#fbbd00] rounded-full" style={{ width: i===0?'70%':i===1?'20%':i===2?'5%':i===3?'3%':'2%' }}></div>
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{i===0?'70%':i===1?'20%':i===2?'5%':i===3?'3%':'2%'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                         <span className="text-2xl">✍️</span>
                      </div>
                      <p className="text-gray-900 font-bold mb-1">No reviews yet</p>
                      <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.slice(0, showAllReviews ? undefined : 3).map((r, i) => (
                        <div key={i} className="group bg-white border border-gray-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3b2b] to-green-800 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                {(r.customer_name?.[0] || r.customer?.name?.[0] || 'U').toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-gray-900">{r.customer_name || r.customer?.name || 'Anonymous'}</p>
                                  <span className="bg-[#eef8f2] text-[#00a859] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-[#c0ebd1]">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Verified
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex items-center text-[#fbbd00] text-xs">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                      <span key={idx} className={idx < r.rating ? 'text-[#fbbd00]' : 'text-gray-200'}>★</span>
                                    ))}
                                  </div>
                                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <span className="text-[11px] text-gray-400 font-medium">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {r.title && <h4 className="font-bold text-sm text-gray-900 mb-2">{r.title}</h4>}
                          <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                        </div>
                      ))}
                      {reviews.length > 3 && (
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="w-full py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {showAllReviews ? 'Show fewer reviews' : `See all ${reviews.length} reviews`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 rounded-3xl p-6 shadow-sm border border-green-100 flex items-center gap-6">
            <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50"></div>
              <svg className="w-16 h-16 text-green-600 relative z-10 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Why Shop with ShopNow?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> 100% Original Products</li>
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Best Prices Guaranteed</li>
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Fast & Reliable Delivery</li>
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Easy Returns & Refunds</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Frequently bought together</h2>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 bg-white shadow-sm">‹</button>
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 bg-white shadow-sm">›</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {relatedProducts.slice(0, 5).map((rp, i) => (
              <div key={i} onClick={() => navigate(`/product/${rp.slug}`)} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col cursor-pointer">
                <div className="aspect-square bg-gray-50 rounded-xl mb-4 p-4 flex items-center justify-center">
                  <img src={typeof rp.images?.[0] === 'string' ? rp.images[0] : (rp.images?.[0] as any)?.url || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" alt="" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug group-hover:text-green-600 transition-colors">{rp.name}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="font-bold text-gray-900">₹{rp.selling_price}</p>
                    <p className="text-xs text-gray-400 line-through">₹{rp.mrp}</p>
                  </div>
                  <button
                    onClick={(e) => handleAddToCartRelated(e, rp)}
                    className="px-3 py-1.5 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 font-medium">
                  <span className="text-yellow-400 text-sm">★</span> 4.5 ({rp.review_count || 42})
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* You may also like */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {relatedProducts.slice(5, 10).map((rp, i) => (
              <div key={i} onClick={() => navigate(`/product/${rp.slug}`)} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col cursor-pointer">
                <div className="aspect-square bg-gray-50 rounded-xl mb-4 p-4 flex items-center justify-center">
                  <img src={typeof rp.images?.[0] === 'string' ? rp.images[0] : (rp.images?.[0] as any)?.url || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" alt="" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug group-hover:text-green-600 transition-colors">{rp.name}</h3>
                <div className="mt-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">₹{rp.selling_price}</p>
                      <p className="text-xs text-gray-400 line-through">₹{rp.mrp}</p>
                    </div>
                    <button
                      onClick={(e) => handleAddToCartRelated(e, rp)}
                      className="px-3 py-1.5 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 font-medium">
                  <span className="text-yellow-400 text-sm">★</span> 4.4 ({rp.review_count || 102})
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Info Footer & Help */}
        <div className="mt-12 flex flex-col xl:flex-row gap-6">
          {/* Info Footer */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm items-center">
            <div className="flex flex-col xl:flex-row items-center xl:items-start text-center xl:text-left gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-green-50 flex items-center justify-center text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
              <div><p className="font-bold text-sm text-gray-900">Free Delivery</p><p className="text-xs text-gray-500">On orders above ₹500</p></div>
            </div>
            <div className="flex flex-col xl:flex-row items-center xl:items-start text-center xl:text-left gap-3 xl:border-l xl:border-gray-100 xl:pl-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-green-50 flex items-center justify-center text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>
              <div><p className="font-bold text-sm text-gray-900">7 Days Returns</p><p className="text-xs text-gray-500">Easy returns</p></div>
            </div>
            <div className="flex flex-col xl:flex-row items-center xl:items-start text-center xl:text-left gap-3 xl:border-l xl:border-gray-100 xl:pl-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-green-50 flex items-center justify-center text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
              <div><p className="font-bold text-sm text-gray-900">Secure Payment</p><p className="text-xs text-gray-500">100% protected</p></div>
            </div>
            <div className="flex flex-col xl:flex-row items-center xl:items-start text-center xl:text-left gap-3 xl:border-l xl:border-gray-100 xl:pl-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-green-50 flex items-center justify-center text-green-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
              <div><p className="font-bold text-sm text-gray-900">24/7 Support</p><p className="text-xs text-gray-500">We are here</p></div>
            </div>
          </div>

          {/* Help */}
          <div className="xl:w-[420px] shrink-0 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
              <h3 className="font-bold text-gray-900 text-lg mb-1">Need help?</h3>
              <p className="text-xs text-gray-500 mb-4">Our customer support is here to help you</p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))}
                  className="flex-1 flex justify-center items-center gap-1.5 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-full text-xs font-bold shadow-sm hover:bg-green-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Live Chat
                </button>
                <button className="flex-1 flex justify-center items-center gap-1.5 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-full text-xs font-bold shadow-sm hover:bg-green-50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Contact Us
                </button>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 -mt-8 w-28 h-28 opacity-10 pointer-events-none">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-600"><path d="M12 3a9 9 0 00-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 00-9-9z" /></svg>
            </div>
          </div>
        </div>

      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitReview} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`text-3xl transition-transform hover:scale-110 ${(hoverRating || reviewRating) >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Sum up your experience"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="What did you like or dislike?"
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                  required
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
