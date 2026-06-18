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
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [openDropdownReviewId, setOpenDropdownReviewId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('reviews');
  const [reviewFilter, setReviewFilter] = useState<'all' | number | 'images'>('all');
  const [showWriteReviewForm, setShowWriteReviewForm] = useState(true);

  const [recommend, setRecommend] = useState(true);
  const [reviewImages, setReviewImages] = useState<string[]>([]);

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


  if (isLoading) {
    return (
      <div className="bg-[#fafafa] min-h-screen font-sans overflow-x-hidden pb-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_350px] gap-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col gap-3 w-16 hidden md:flex">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse"></div>)}
              </div>
              <div className="flex-1 bg-gray-100 rounded-2xl min-h-[400px] animate-pulse"></div>
            </div>
            <div className="flex flex-col space-y-5">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mt-4"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-24 w-full bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="h-16 w-full bg-gray-100 rounded animate-pulse mb-6"></div>
              <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse mt-auto mb-3"></div>
              <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse mb-3"></div>
              <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Product not found</h2>
        <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  const computedAverageRating = Number(
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : (product.average_rating || 0)
  );
  const computedReviewCount = reviews.length;

  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const rIndex = Math.min(Math.max(Math.round(Number(r.rating)) - 1, 0), 4);
    starCounts[rIndex]++;
  });
  const starPercentages = starCounts.map((count) =>
    reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
  ).reverse();

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'images') return !!r.image_url;
    return Math.round(Number(r.rating)) === reviewFilter;
  });

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

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== idx));
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
        content: reviewContent,
        image_url: reviewImages[0] || reviewImage || null
      });
      if (res.data.success) {
        toast.success('Review submitted successfully!');
        setReviewTitle('');
        setReviewContent('');
        setReviewRating(5);
        setReviewImage(null);
        setReviewImages([]);
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

  const startEditingReview = (r: any) => {
    setEditingReviewId(r.id);
    setReviewRating(r.rating);
    setReviewTitle(r.title || '');
    setReviewContent(r.content || r.comment || '');
    setReviewImage(r.image_url || null);
    setReviewImages(r.image_url ? [r.image_url] : []);
    setIsEditingReview(true);
    // Smooth scroll to the form section
    const formElement = document.getElementById('review-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEditingReview = () => {
    setIsEditingReview(false);
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewTitle('');
    setReviewContent('');
    setReviewImage(null);
    setReviewImages([]);
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewId) return;
    setSubmittingReview(true);
    try {
      const res = await api.put(`/products/${product!.id}/reviews`, {
        reviewId: editingReviewId,
        rating: reviewRating,
        title: reviewTitle,
        content: reviewContent,
        image_url: reviewImages[0] || reviewImage || null
      });
      if (res.data.success) {
        toast.success('Review updated successfully!');
        cancelEditingReview();
        // Refresh reviews
        api.get(`/products/${product!.id}/reviews`).then((res) => {
          if (res.data.success) setReviews(res.data.data);
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await api.delete(`/products/${product!.id}/reviews?reviewId=${reviewId}`);
      if (res.data.success) {
        toast.success('Review deleted successfully!');
        if (editingReviewId === reviewId) {
          cancelEditingReview();
        }
        // Refresh reviews
        api.get(`/products/${product!.id}/reviews`).then((res) => {
          if (res.data.success) setReviews(res.data.data);
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
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
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(computedAverageRating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="font-bold text-gray-900">{computedAverageRating > 0 ? computedAverageRating.toFixed(1) : '0.0'}</span>
                <span className="text-gray-500">({computedReviewCount} {computedReviewCount === 1 ? 'review' : 'reviews'})</span>
              </div>
            </div>

            {product.discount_percentage > 0 && (
              <div className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded text-xs w-fit">
                {product.discount_percentage}% OFF
              </div>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">₹{Number(displayPrice * quantity).toLocaleString('en-IN')}</span>
              {Number(product.mrp) > Number(displayPrice) && (
                <span className="text-gray-500 text-lg">
                  M.R.P.: <span className="line-through">₹{Number(product.mrp * quantity).toLocaleString('en-IN')}</span>
                </span>
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
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">₹{Number(displayPrice * quantity).toLocaleString('en-IN')}</span>
                {Number(product.mrp) > Number(displayPrice) && (
                  <span className="text-gray-400 line-through text-base">₹{Number(product.mrp * quantity).toLocaleString('en-IN')}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

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
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
                  {/* Review Form */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">

                    {/* Product Header */}
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.sku || 'HD9252/90'} | 4.1L, Rapid Air Technology
                      </p>
                    </div>

                    {/* Review Submission / Editing Form */}
                    <form id="review-form-section" onSubmit={isEditingReview ? handleUpdateReview : submitReview} className="space-y-6">
                      <div className="border-b border-gray-100 pb-2">
                        <h4 className="font-bold text-gray-900 text-sm">
                          {isEditingReview ? '✏️ Edit Your Review' : '✍️ Write a Customer Review'}
                        </h4>
                      </div>

                        {/* Overall Rating & Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Overall Rating</label>
                            <div className="flex items-center gap-1.5">
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
                              <span className={`ml-4 text-xs font-bold px-3 py-1 rounded-full border ${reviewRating === 5 ? 'bg-green-50 text-green-700 border-green-200' :
                                  reviewRating === 4 ? 'bg-green-50 text-green-700 border-green-200' :
                                    reviewRating === 3 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                      reviewRating === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {reviewRating === 5 ? 'Excellent' : reviewRating === 4 ? 'Good' : reviewRating === 3 ? 'Average' : reviewRating === 2 ? 'Poor' : 'Very Poor'}
                              </span>
                            </div>
                          </div>

                          {/* Add Photos */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Add Photos (optional)</label>
                            <div className="flex items-center gap-3">
                              {reviewImages.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 border border-gray-200 rounded-xl overflow-hidden bg-white flex items-center justify-center group shadow-sm">
                                  <img src={img} alt={`Preview ${idx + 1}`} className="max-w-full max-h-full object-contain" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="absolute top-1 right-1 bg-gray-500/90 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-650 transition-all font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {reviewImages.length < 3 && (
                                <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all bg-white">
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <svg className="w-5 h-5 text-gray-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Add more</span>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAddImage}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Review Title Input */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Review Title</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                              placeholder="Amazing product! Cooks perfectly and saves time"
                              className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 font-medium text-gray-800"
                              required
                            />
                            {reviewTitle.trim().length >= 5 && (
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Review Content Textarea */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Your Review</label>
                          <div className="relative">
                            <textarea
                              value={reviewContent}
                              onChange={(e) => setReviewContent(e.target.value)}
                              placeholder="What did you like or dislike? How does the product look in person?"
                              rows={4}
                              maxLength={1000}
                              className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 pt-3 pb-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 resize-none font-medium text-gray-800"
                              required
                            />
                            {reviewContent.trim().length >= 10 && (
                              <span className="absolute right-3.5 top-4 text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                            <span className="absolute bottom-2.5 right-3 text-xs text-gray-400 font-semibold">
                              {reviewContent.length}/1000
                            </span>
                          </div>
                        </div>


                        {/* Recommendation Checkbox */}
                        <div className="flex items-center gap-2">
                          <label className="relative flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recommend}
                              onChange={(e) => setRecommend(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-5 h-5 bg-white border border-gray-300 rounded peer-checked:bg-green-600 peer-checked:border-green-600 flex items-center justify-center transition-colors">
                              <svg className="w-3.5 h-3.5 text-white stroke-[3px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </label>
                          <span className="text-sm font-semibold text-gray-700">Yes, I recommend this product</span>
                        </div>

                        {/* Form CTA Actions */}
                        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                          {customer ? (
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="px-8 py-3 bg-[#00a859] hover:bg-[#00904d] text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                              {submittingReview ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                  {isEditingReview ? 'Updating...' : 'Submitting...'}
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 rotate-45 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                  {isEditingReview ? 'Update Review' : 'Submit Review'}
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center w-full">
                              <p className="text-sm text-gray-500 mb-2 font-semibold">You must be signed in to leave a review.</p>
                              <Link
                                to="/login"
                                className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-bold shadow-sm transition-colors"
                              >
                                Sign In
                              </Link>
                            </div>
                          )}

                          {isEditingReview && (
                            <button
                              type="button"
                              onClick={cancelEditingReview}
                              className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-sm font-bold transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </div>

                        {/* Trust Notice Banner */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="text-xs text-gray-500 font-semibold">
                            Your review helps other customers make the right choice.
                          </span>
                        </div>

                      </form>
                  </div>

                  {/* Bottom Row: Customer Reviews Feed */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">📢</span>
                        <h4 className="font-bold text-gray-900 text-sm">Customer Reviews</h4>
                      </div>
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="text-xs font-bold text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                      >
                        See all reviews ({reviews.length}) <span className="text-xs">→</span>
                      </button>
                    </div>

                    {reviews.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {reviews.slice(0, showAllReviews ? undefined : 5).map((r, i) => (
                          <div key={i} className="py-6 first:pt-0 last:pb-0 flex flex-col gap-3.5">
                            {/* Reviewer Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-655 font-bold text-xs uppercase shadow-inner border border-gray-200">
                                  {((r.customer_name || r.customer?.name || 'Customer')[0]).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-gray-900">{r.customer_name || r.customer?.name || 'Customer'}</span>
                                    {r.is_verified && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Verified Purchase
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-medium">Reviewed on {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                              </div>

                              {/* Three-Dot Menu for Owner */}
                              {customer && r.customer_id === customer.id && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenDropdownReviewId(openDropdownReviewId === r.id ? null : r.id)}
                                    className="w-7 h-7 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shadow-sm focus:outline-none"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>

                                  {openDropdownReviewId === r.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenDropdownReviewId(null)}
                                      />
                                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-150 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            startEditingReview(r);
                                            setOpenDropdownReviewId(null);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-green-600 flex items-center gap-1.5 transition-colors"
                                        >
                                          <span>✏️</span> Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleDeleteReview(r.id);
                                            setOpenDropdownReviewId(null);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-xs font-bold text-red-650 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5 transition-colors border-t border-gray-50"
                                        >
                                          <span>🗑️</span> Delete
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Star Rating & Title */}
                            <div className="flex items-center gap-2.5">
                              <div className="flex items-center text-yellow-400 text-xs gap-0.5">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <span key={idx} className={idx < Math.round(r.rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                                ))}
                              </div>
                              {r.title && (
                                <h5 className="font-bold text-xs text-gray-900 leading-snug">{r.title}</h5>
                              )}
                            </div>

                            {/* Review Comment Body */}
                            <p className="text-xs text-gray-650 leading-relaxed font-medium whitespace-pre-wrap">{r.content || r.comment}</p>

                            {/* Review Image Attachment */}
                            {r.image_url && (
                              <div className="mt-1 flex gap-2">
                                <div 
                                  onClick={() => window.open(r.image_url, '_blank')}
                                  className="w-20 h-20 rounded-xl overflow-hidden border border-gray-150 bg-white flex items-center justify-center cursor-pointer hover:border-green-500 transition-all p-1.5 shadow-sm group"
                                >
                                  <img src={r.image_url} alt="Review attachment" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                                </div>
                              </div>
                            )}

                            {/* Helpful Vote Action */}
                            <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-400 font-semibold">
                              <button className="px-3.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 shadow-sm transition-all hover:border-gray-300 font-bold active:scale-95">
                                Helpful
                              </button>
                              <span className="text-gray-300">|</span>
                              <button className="hover:underline hover:text-gray-600 transition-colors">
                                Report
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <span className="text-3xl mb-2.5 block">✍️</span>
                        <h5 className="font-bold text-gray-900 text-xs mb-1">No reviews yet</h5>
                        <p className="text-gray-500 text-[11px] font-semibold leading-relaxed">
                          Be the first to share your thoughts about this product!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
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

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚀</span>
                <h4 className="font-bold text-gray-900 text-sm">Review Guidelines</h4>
              </div>
              <ul className="space-y-3">
                {[
                  { text: 'Be honest about your experience', icon: '⚖️' },
                  { text: 'Focus on product quality & performance', icon: '⚙️' },
                  { text: 'Include real photos if possible', icon: '📷' },
                  { text: 'Avoid promotional or offensive content', icon: '🛡️' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-xs text-gray-650 font-bold">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-sm">
                      {item.icon}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <h4 className="font-bold text-gray-900 text-sm">Tips for a Helpful Review</h4>
              </div>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed mb-4">
                Share details about quality, performance, size, usability and value.
              </p>
              <div className="flex text-yellow-400 text-lg gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
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
                  <img src={typeof rp.images?.[0] === 'string' ? rp.images[0] : (rp.images?.[0] as any)?.url || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform" alt="" />
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
                  <img src={typeof rp.images?.[0] === 'string' ? rp.images[0] : (rp.images?.[0] as any)?.url || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform" alt="" />
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
    </div>
  );
}
