import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useLanguageStore, translations } from '../store/languageStore';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
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
  const customer = useAuthStore(s => s.customer);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [showRecMenu, setShowRecMenu] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [rufusQuery, setRufusQuery] = useState('');

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
  const relatedProducts = relatedData?.data.filter(p => p.id !== product.id).slice(0, 6) ?? [];

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

  const specs = product.specifications ?? {};

  return (
    <div className="bg-white min-h-screen font-sans text-[#0f1111] overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="max-w-[1500px] mx-auto px-4 py-2 text-[12px] text-gray-600">
        <nav className="flex items-center gap-1">
          <Link to="/" className="hover:text-[#c45500] hover:underline">Home</Link>
          <span className="text-gray-400">›</span>
          {product.category && (
            <>
              <Link to={`/category/${product.category.slug}`} className="hover:text-[#c45500] hover:underline">{product.category.name}</Link>
              <span className="text-gray-400">›</span>
            </>
          )}
          <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_300px] gap-8">

          {/* Column 1 & 2: Images + Info Wrapper */}
          <div className="flex flex-col md:flex-row gap-10">

            {/* Image Gallery (Sticky) */}
            <div className={`flex gap-4 md:flex-row flex-col-reverse sticky top-4 h-fit ${zoomState.show ? 'z-[200]' : 'z-10'}`}>
              {/* Thumbnails Sidebar */}
              {images.length > 1 && (
                <div className="flex md:flex-col gap-2 overflow-y-auto max-h-[500px] no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onMouseEnter={() => setSelectedImageIdx(idx)}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded border-2 overflow-hidden flex-shrink-0 transition-all ${idx === selectedImageIdx ? 'border-[#e77600] shadow-[0_0_3px_2px_rgba(228,121,17,0.5)]' : 'border-gray-200 hover:border-[#e77600]'
                        }`}
                    >
                      <img
                        src={typeof img === 'string' ? img : (img as any).url}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image View */}
              <div className="relative flex-1 min-w-0 w-full md:min-w-[450px]">
                <div
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="relative bg-white rounded-lg border border-gray-100 overflow-hidden aspect-square flex items-center justify-center p-4 cursor-crosshair group/main"
                >
                  {currentImage ? (
                    <>
                      <img
                        src={currentImage}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain"
                      />

                      {/* Zoom Lens (Follows mouse) */}
                      {zoomState.show && (
                        <div
                          className="absolute border border-gray-400 pointer-events-none bg-[#007185]/10 shadow-sm z-10"
                          style={{
                            width: '240px',
                            height: '240px',
                            left: `calc(${zoomState.x}% - 120px)`,
                            top: `calc(${zoomState.y}% - 120px)`,
                            backgroundImage: 'radial-gradient(circle, rgba(0,113,133,0.2) 1px, transparent 1px)',
                            backgroundSize: '8px 8px'
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Zoom Window (Appears on the right) */}
                {zoomState.show && currentImage && (
                  <div
                    className="absolute left-full top-0 ml-12 w-[500px] h-[500px] bg-white border border-gray-200 z-[200] shadow-2xl overflow-hidden hidden xl:block rounded-sm animate-in fade-in zoom-in duration-150"
                  >
                    <img
                      src={currentImage}
                      alt="Magnified view"
                      className="absolute max-w-none w-[350%] h-[350%] object-contain bg-white"
                      style={{
                        left: `${-zoomState.x * 2.5}%`,
                        top: `${-zoomState.y * 2.5}%`
                      }}
                    />
                  </div>
                )}
                <p className="text-center text-[12px] text-gray-500 mt-4 italic">Roll over image to zoom in</p>
                <button
                  onClick={() => setShowFullView(true)}
                  className="block w-full text-center text-[#007185] hover:text-[#c45500] text-[13px] font-medium mt-6 hover:underline"
                >
                  Click to see full view
                </button>

                {/* Ask Rufus Section */}
                <div className="mt-12 space-y-4">
                  <div className="flex items-center gap-2 text-[15px] font-bold text-[#0f1111]">
                    <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                    </svg>
                    Ask Rufus
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      `Is the ${product.brand || 'product'} durable?`,
                      'What is the warranty period?',
                      'Is it worth the price?'
                    ].map((q, i) => (
                      <button key={i} onClick={() => askRufus(q)} className="px-3 py-1.5 border border-[#d5d9d9] rounded-full text-[12px] text-[#0f1111] bg-white hover:bg-[#f7fafa] shadow-sm transition-colors hover:border-[#e77600] cursor-pointer">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Middle Column */}
            <div className="flex-1 space-y-4">
              <div className="border-b border-gray-200 pb-3">
                {product.brand && (
                  <Link to="#" className="text-[#007185] hover:text-[#c45500] hover:underline text-[14px] font-medium">
                    Visit the {product.brand} Store
                  </Link>
                )}
                <h1 className="text-[24px] font-medium text-[#0f1111] leading-tight mt-1">
                  {product.name}
                </h1>

                {/* Ratings Row */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center text-[#e47911]">
                    {[1, 2, 3, 4].map((star) => (
                      <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="w-4 h-4 fill-[#e47911] opacity-40" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {(product.review_count ?? reviews.length) > 0 && (
                      <span className="ml-2 text-[#007185] hover:text-[#c45500] text-sm cursor-pointer hover:underline">{(product.review_count ?? reviews.length).toLocaleString()} ratings</span>
                    )}
                  </div>
                  <span className="text-gray-300">|</span>
                  <Link to="#" className="text-[#007185] hover:text-[#c45500] text-sm hover:underline">Search this page</Link>
                </div>
              </div>

              <div className="space-y-1">
                {isOutbidOffer && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800 flex items-start gap-2 mb-3 shadow-sm">
                    <span className="text-base">🎉</span>
                    <div>
                      <span className="font-bold">Exclusive Outbid Offer:</span> You get a special direct purchase price of <span className="font-bold">{fmt(displayPrice)}</span>!
                    </div>
                  </div>
                )}
                {product.discount_percentage >= 10 && (
                  <span className="inline-block bg-[#cc0c39] text-white text-xs font-bold px-2 py-1 mb-2">
                    {product.discount_percentage >= 30 ? 'Great Deal' : 'Deal'}
                  </span>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="text-[#cc0c39] text-3xl font-light">
                    -{Math.round((1 - displayPrice / product.mrp) * 100)}%
                  </span>
                  <div className="flex items-start">
                    <span className="text-sm mt-1 font-medium mr-0.5">₹</span>
                    <span className="text-3xl font-medium text-[#0f1111]">
                      {displayPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  M.R.P.: <span className="line-through">{fmt(product.mrp)}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-[#007185] border border-[#007185] rounded px-1">ShopNow</span>
                  <span className="text-sm text-[#0f1111]">Inclusive of all taxes</span>
                </div>
                <p className="text-sm mt-2">
                  <span className="font-bold">EMI</span> starts at {fmt(Math.round(product.selling_price / 24))}. No Cost EMI available <span className="text-[#007185] cursor-pointer hover:underline text-xs">EMI options </span>
                </p>
              </div>

              {/* Offers Section */}
              <div className="border-t border-b border-gray-200 py-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-[14px]">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Offers
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {displayPrice >= 1000 && (
                    <div className="min-w-[160px] border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col gap-1 cursor-pointer hover:bg-gray-50 bg-white">
                      <p className="font-bold text-[13px]">No Cost EMI</p>
                      <p className="text-xs text-[#0f1111] line-clamp-2 leading-relaxed">EMI starting {fmt(Math.round(displayPrice / 12))}/month</p>
                    </div>
                  )}
                  {displayPrice >= 500 && (
                    <div className="min-w-[160px] border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col gap-1 cursor-pointer hover:bg-gray-50 bg-white">
                      <p className="font-bold text-[13px]">Bank Offer</p>
                      <p className="text-xs text-[#0f1111] line-clamp-2 leading-relaxed">Upto {fmt(Math.round(displayPrice * 0.1))} discount on select cards</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Icons */}
              <div className="flex justify-between items-start gap-2 py-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {[
                  { label: '7 days Replacement', icon: '🔄' },
                  { label: 'Free Delivery', icon: '🚚' },
                  { label: '1 Year Warranty', icon: '🛡️' },
                  { label: 'Pay on Delivery', icon: '💵' },
                  { label: 'Top Brand', icon: '🏆' },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => setShowServicesModal(true)}
                    className="flex flex-col items-center text-center min-w-[80px] gap-1 group cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                      {item.icon}
                    </div>
                    <span className="text-[11px] text-[#007185] leading-tight font-medium group-hover:text-[#c45500] group-hover:underline">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">




                {/* Dynamic Attributes Table */}
                <div className="grid grid-cols-[120px_1fr] gap-y-2 text-[14px] mb-6">
                  <span className="font-bold">Brand</span>
                  <span>{product.brand || 'Generic'}</span>
                  {Object.entries(specs).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="contents">
                      <span className="font-bold capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="leading-snug">{value as string}</span>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-200 mb-6" />

                {/* SKU & Condition */}
                <div className="flex flex-col gap-2 text-sm text-[#0f1111]">
                  <p><span className="font-bold">SKU:</span> {product.sku}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Condition:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${product.condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                      {product.condition.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Description snippet */}
                {product.description && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="font-bold text-[16px] mb-2 text-[#0f1111]">About this item</h3>
                    <div className="text-[14px] text-[#0f1111] leading-relaxed space-y-2">
                      {product.description.split('\n').map((line, i) => (
                        <p key={i} className={line.trim().startsWith('•') || line.trim().startsWith('-') ? 'pl-4 relative before:content-["•"] before:absolute before:left-0' : ''}>
                          {line.trim().replace(/^[•-]\s*/, '')}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Buy Box Sidebar (Sticky) */}
            <div className="relative">
              <div className="lg:sticky lg:top-4 border border-[#ddd] rounded-lg p-4 bg-white space-y-4 shadow-sm">
                <div className="flex items-start">
                  <span className="text-sm mt-1 font-normal mr-0.5">₹</span>
                  <span className="text-2xl font-medium text-[#0f1111]">
                    {displayPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="text-[13px] text-[#0f1111] mt-3">
                  <span className="text-[#007185] hover:text-[#c45500] cursor-pointer hover:underline">FREE delivery</span> <span className="font-bold">{new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>.
                  <div className="mt-1"><span className="text-[#007185] cursor-pointer hover:underline">Details</span></div>
                </div>

                <div className="flex items-start gap-1 text-[12px] text-[#007185] hover:text-[#c45500] cursor-pointer mt-4">
                  <svg className="w-3.5 h-3.5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{customer?.address?.city ? `Delivering to ${customer.address.city} ${customer.address.pincode || ''}` : 'Select delivery location'}</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="space-y-1">
                {isOutOfStock ? (
                  <h3 className="text-lg font-bold text-[#b12704]">Currently unavailable.</h3>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-[#008a00]">In stock</h3>
                    <div className="text-[12px] grid grid-cols-[70px_1fr] gap-x-2 gap-y-1 mt-2">
                      <span className="text-gray-500">Ships from</span>
                      <span className="text-[#0f1111]">ShopNow</span>
                      <span className="text-gray-500">Sold by</span>
                      <span className="text-[#007185] hover:text-[#c45500] cursor-pointer hover:underline truncate font-medium">{product.brand || 'Authorized Seller'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Quantity:</span>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="bg-[#f0f2f2] border border-[#d5d9d9] text-[13px] rounded-lg focus:ring-0 focus:border-[#d5d9d9] block w-20 p-1 px-2 shadow-sm cursor-pointer hover:bg-[#e3e6e6]"
                    >
                      {[...Array(Math.min(10, product.stock_quantity))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {product.active_auction_id && (
                      <button
                        onClick={() => navigate(`/live-auction/${product.active_auction_id}`)}
                        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 border border-red-700 rounded-full text-[13px] font-medium shadow-sm transition-colors text-white animate-pulse"
                      >
                        Join Live Auction
                      </button>
                    )}
                    <button
                      onClick={handleAddToCart}
                      className="w-full py-2 px-4 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full text-[13px] font-medium shadow-sm transition-colors"
                    >
                      {t.addToCart || "Add to Cart"}
                    </button>
                    <button
                      onClick={() => {
                        if (isOutOfStock) return;
                        setBuyNowItem({
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
                        });
                        navigate('/checkout');
                      }}
                      className="w-full py-2 px-4 bg-[#FFA41C] hover:bg-[#FA8900] border border-[#FF8F00] rounded-full text-[13px] font-medium shadow-sm transition-colors"
                    >
                      {t.buyNow || "Buy Now"}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 text-[12px] space-y-2">
                <div className="flex items-center gap-2 text-[#007185] cursor-pointer hover:text-[#c45500]">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure transaction</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-[#0f1111]">
                  <input type="checkbox" className="rounded border-[#d5d9d9] text-[#e47911] focus:ring-0 w-3.5 h-3.5" />
                  <span>Add gift options</span>
                </label>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <button className="w-full text-left py-2 px-4 border border-[#d5d9d9] rounded-lg text-[13px] hover:bg-[#f7fafa] transition-colors shadow-sm bg-white font-medium">
                  Add to Wish List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related items bought by customers */}
        <section className="mt-16 border-t border-gray-200 pt-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-[20px] font-bold text-[#0f1111]">Related items bought by customers</h2>
            <div className="text-sm text-gray-500 flex items-center gap-2 relative">
              <button
                onClick={() => setShowRecMenu(!showRecMenu)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* Recommendations Menu */}
              {showRecMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-300 rounded shadow-xl z-50 py-2">
                  <button className="w-full text-left px-4 py-2 text-[13px] text-[#0f1111] hover:bg-gray-100 hover:text-[#c45500]">
                    Not interested in specific items
                  </button>
                  <button className="w-full text-left px-4 py-2 text-[13px] text-[#0f1111] hover:bg-gray-100 hover:text-[#c45500]">
                    Manage Recommendations
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative group">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border border-gray-300 rounded shadow-md z-10 flex items-center justify-center text-2xl hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity -ml-5">‹</button>

            <div className="flex justify-between gap-6 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
              {relatedProducts.length > 0 ? (
                relatedProducts.map((p, i) => (
                  <div key={p.id} className="min-w-[200px] max-w-[200px] flex flex-col gap-1 group">
                    <div className="aspect-square bg-white rounded-md p-2 flex items-center justify-center mb-2">
                      <img
                        src={typeof p.images?.[0] === 'string' ? p.images[0] : (p.images?.[0] as any)?.url}
                        alt={p.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <Link to={`/product/${p.slug}`} className="text-[13px] text-[#007185] hover:text-[#c45500] hover:underline line-clamp-3 leading-snug">
                      {p.name}
                    </Link>
                    <div className="flex items-center text-[#e47911] text-[12px] mt-1">
                      {[1, 2, 3, 4].map(s => <span key={s}>★</span>)}
                      <span className="text-gray-300">★</span>
                      {(p as any).review_count > 0 && (
                        <span className="ml-1 text-[#007185] hover:underline">{(p as any).review_count?.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[12px] text-[#b12704]">-{Math.round((1 - p.selling_price / p.mrp) * 100)}%</span>
                      <span className="text-[17px] font-medium text-[#b12704]">₹{p.selling_price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[11px] text-gray-500">M.R.P.: <span className="line-through">₹{p.mrp.toLocaleString('en-IN')}</span></div>
                    {p.discount_percentage >= 10 && (
                      <div className="inline-block bg-[#cc0c39] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm w-fit mt-1">{p.discount_percentage >= 30 ? 'Great Deal' : 'Deal'}</div>
                    )}
                    <p className="text-[12px] text-gray-600 mt-1">FREE Delivery by ShopNow</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No related items found.</p>
              )}
            </div>

            <button className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border border-gray-300 rounded shadow-md z-10 flex items-center justify-center text-2xl hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity -mr-5">›</button>
          </div>
        </section>

        {/* More products you might like */}
        {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-gray-200 pt-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-[20px] font-bold text-[#0f1111]">More products you might like</h2>
          </div>

          <div className="relative group">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border border-gray-300 rounded shadow-md z-10 flex items-center justify-center text-2xl hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity -ml-5">‹</button>

            <div className="flex justify-between gap-6 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
              {relatedProducts.map((p) => (
                <div key={p.id + '-sp'} className="min-w-[200px] max-w-[200px] flex flex-col gap-1 group">
                  <div className="aspect-square bg-white rounded-md p-2 flex items-center justify-center mb-2">
                    <img
                      src={typeof p.images?.[0] === 'string' ? p.images[0] : (p.images?.[0] as any)?.url}
                      alt={p.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <Link to={`/product/${p.slug}`} className="text-[13px] text-[#007185] hover:text-[#c45500] hover:underline line-clamp-3 leading-snug">
                    {p.name}
                  </Link>
                  <div className="flex items-center text-[#e47911] text-[12px] mt-1">
                    {[1, 2, 3, 4].map(s => <span key={s}>★</span>)}
                    <span className="text-gray-300">★</span>
                    {(p as any).review_count > 0 && (
                      <span className="ml-1 text-[#007185] hover:underline">{(p as any).review_count?.toLocaleString()}</span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[12px] text-[#b12704]">-{Math.round((1 - p.selling_price / p.mrp) * 100)}%</span>
                    <span className="text-[17px] font-medium text-[#b12704]">₹{p.selling_price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">M.R.P.: <span className="line-through">₹{p.mrp.toLocaleString('en-IN')}</span></div>

                  <p className="text-[12px] text-gray-600 mt-1">FREE Delivery by ShopNow</p>
                </div>
              ))}
            </div>

            <button className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border border-gray-300 rounded shadow-md z-10 flex items-center justify-center text-2xl hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity -mr-5">›</button>
          </div>
        </section>
        )}

        {/* Looking for specific info Section */}
        <section className="mt-12 border-t border-gray-200 pt-8 pb-4">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
            <h2 className="text-[20px] font-bold text-[#0f1111]">Looking for specific info?</h2>
          </div>

          <div className="max-w-[800px]">
            <form onSubmit={(e) => { e.preventDefault(); askRufus(rufusQuery); setRufusQuery(''); }} className="relative flex items-center">
              <input
                type="text"
                value={rufusQuery}
                onChange={(e) => setRufusQuery(e.target.value)}
                placeholder="Ask a question about this product..."
                className="w-full h-10 pl-4 pr-12 border border-gray-300 rounded-md shadow-sm focus:border-[#007185] focus:ring-1 focus:ring-[#007185] text-sm"
              />
              <button type="submit" className="absolute right-1 w-8 h-8 bg-[#007185] text-white rounded flex items-center justify-center hover:bg-[#005a6a] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                `What are the key features of ${product.brand || 'this product'}?`,
                'Is it worth the price?',
                'How is the build quality?'
              ].map((chip, i) => (
                <button key={i} onClick={() => askRufus(chip)} className="px-4 py-2 border border-[#d5d9d9] rounded-full text-[13px] text-[#007185] bg-white hover:bg-[#f7fafa] shadow-sm transition-colors hover:border-[#007185] cursor-pointer">
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Product Information Grid */}
        <section className="mt-4 border-t border-gray-200 pt-8">
          <h2 className="text-[20px] font-bold text-[#0f1111] mb-6">Product information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {/* Left Column */}
            <div className="space-y-1">
              {[
                {
                  id: 'features', label: 'Features & Specs', content: (
                    <div className="p-4 bg-gray-50 text-sm space-y-2">
                      {Object.entries(specs).map(([k, v]) => (
                        <div key={k} className="flex border-b border-gray-200 pb-2">
                          <span className="w-32 font-bold capitalize">{k.replace(/_/g, ' ')}:</span>
                          <span className="flex-1">{v as string}</span>
                        </div>
                      ))}
                      {Object.keys(specs).length === 0 && (
                        <p className="text-gray-500">No specifications available.</p>
                      )}
                    </div>
                  )
                }
              ].map((item) => (
                <div key={item.id} className="border border-gray-300 rounded overflow-hidden">
                  <div
                    onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 bg-white"
                  >
                    <span className="text-[14px] font-bold text-[#0f1111]">{item.label}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${openAccordion === item.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {openAccordion === item.id && item.content}
                </div>
              ))}
            </div>
            {/* Right Column */}
            <div className="space-y-1">
              {[
                {
                  id: 'details', label: 'Item details', content: (
                    <div className="p-4 bg-gray-50 text-sm space-y-2">
                      <p><span className="font-bold">Brand:</span> {product.brand || 'Generic'}</p>
                      <p><span className="font-bold">Model Name:</span> {product.sku}</p>
                      <p><span className="font-bold">Category:</span> {product.category?.name}</p>
                      <p><span className="font-bold">Condition:</span> {product.condition.replace(/_/g, ' ')}</p>
                    </div>
                  )
                }
              ].map((item) => (
                <div key={item.id} className="border border-gray-300 rounded overflow-hidden">
                  <div
                    onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 bg-white"
                  >
                    <span className="text-[14px] font-bold text-[#0f1111]">{item.label}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${openAccordion === item.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {openAccordion === item.id && item.content}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="mt-8">
            <h3 className="text-[14px] font-bold text-[#0f1111] mb-1">Feedback</h3>
            <p className="text-[13px] text-[#0f1111]">
              Would you like to <span className="text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer">tell us about a lower price? </span>
            </p>
          </div>
        </section>


        {/* Customer Reviews Section */}
        <section className="mt-16 border-t border-gray-200 pt-12 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">

            {/* Left Sidebar: Ratings Summary */}
            <div className="space-y-6">
              <div>
                <h2 className="text-[21px] font-bold text-[#0f1111] mb-2">Customer reviews</h2>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex text-[#e47911] text-lg">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const rating = Number(product.average_rating ?? 0);
                      const isFull = starIdx <= Math.floor(rating);
                      const isHalf = !isFull && starIdx === Math.ceil(rating) && rating % 1 >= 0.5;

                      if (isFull) return <span key={starIdx}>★</span>;
                      if (isHalf) return <span key={starIdx} className="relative inline-block text-gray-300"><span className="absolute top-0 left-0 text-[#e47911] overflow-hidden w-[50%]">★</span>★</span>;
                      return <span key={starIdx} className="text-gray-300">★</span>;
                    })}
                  </div>
                  <span className="text-[18px] font-bold text-[#0f1111]">
                    {Number(product.average_rating ?? 0).toFixed(1)}{' '}
                    out of 5
                  </span>
                </div>
                <p className="text-[14px] text-gray-500">
                  {(product.review_count ?? reviews.length).toLocaleString()}{' '}
                  global ratings
                </p>
              </div>

              {/* Rating Bars */}
              <div className="space-y-3">
                {(() => {
                  const totalReviewsCount = reviews.length;
                  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
                    const count = totalReviewsCount > 0 ? reviews.filter(r => r.rating === stars).length : 0;
                    const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                    return { stars, pct };
                  });

                  return ratingDistribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-4 text-sm group cursor-pointer">
                      <span className="text-[#007185] hover:text-[#c45500] hover:underline min-w-[40px] font-medium">{item.stars} star</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-sm border border-gray-200 overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-[#ffa41c] border-r border-[#de8900]"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <span className="text-[#007185] hover:text-[#c45500] hover:underline min-w-[30px] text-right">{item.pct}%</span>
                    </div>
                  ));
                })()}
              </div>

              <button className="text-[#007185] text-sm hover:text-[#c45500] hover:underline flex items-center gap-1 font-medium pt-2">
                How are ratings calculated? ⌄
              </button>

              <hr className="border-gray-200" />

              {/* Review this product */}
              <div className="space-y-2">
                <h3 className="text-[18px] font-bold text-[#0f1111]">Review this product</h3>
                <p className="text-[14px] text-[#0f1111]">Share your thoughts with other customers</p>
                <button
                  onClick={() => {
                    if (!customer) {
                      toast.error('Please login to write a product review.');
                      return;
                    }
                    setShowReviewModal(true);
                  }}
                  className="w-full py-1.5 px-4 border border-gray-300 rounded-md text-[13px] hover:bg-gray-50 transition-colors shadow-sm bg-white font-medium mt-2"
                >
                  Write a product review
                </button>
              </div>
            </div>

            {/* Right Side: Review List */}
            <div className="space-y-10">

              {/* Review List */}
              <div className="space-y-8 max-w-[800px]">
                <h3 className="text-[18px] font-bold text-[#0f1111]">
                  {reviews.length > 0 ? 'Top reviews from India' : 'No reviews yet'}
                </h3>

                {reviews.length > 0 ? (
                  (showAllReviews ? reviews : reviews.slice(0, 3)).map((r, i) => {
                    console.log('Rendering review:', i + 1, 'Total visible:', showAllReviews ? reviews.length : Math.min(3, reviews.length));
                    const rev = {
                      user: r.customer_name || 'Verified Customer',
                      rating: r.rating,
                      title: r.title,
                      date: `Reviewed in India on ${new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                      style: 'Verified Purchase',
                      verified: r.is_verified,
                      content: r.content
                    };

                    return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                          {rev.user[0]}
                        </div>
                        <span className="text-[13px] text-[#0f1111]">{rev.user}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex text-[#e47911] text-[12px]">
                          {[...Array(rev.rating)].map((_, s) => <span key={s}>★</span>)}
                          {[...Array(5 - rev.rating)].map((_, s) => <span key={s} className="text-gray-200">★</span>)}
                        </div>
                        <span className="text-[14px] font-bold text-[#0f1111]">{rev.title}</span>
                      </div>
                      <div className="text-[12px] text-gray-500">{rev.date}</div>
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="text-gray-600 font-medium">{rev.style}</span>
                        <span className="text-gray-300">|</span>
                        {rev.verified && <span className="text-[#c45500] font-bold">Verified Purchase</span>}
                      </div>
                      <p className="text-[14px] text-[#0f1111] leading-relaxed">{rev.content}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <button className="px-6 py-1 border border-gray-300 rounded-lg text-[13px] hover:bg-gray-50 shadow-sm bg-white font-medium">Helpful</button>
                        <span className="text-gray-300">|</span>
                        <button className="text-[13px] text-gray-500 hover:underline">Report</button>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <p className="text-[14px] text-gray-500">Be the first to review this product.</p>
                )}

                {reviews.length > 0 && !showAllReviews && (
                  <button onClick={() => setShowAllReviews(true)} className="text-[#007185] text-sm hover:text-[#c45500] hover:underline font-bold pt-4">See more reviews ›</button>
                )}
                {showAllReviews && reviews.length > 0 && (
                  <button onClick={() => setShowAllReviews(false)} className="text-[#007185] text-sm hover:text-[#c45500] hover:underline font-bold pt-4">Show fewer reviews ‹</button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Services Modal */}
      {showServicesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowServicesModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Services Available</h2>
              <button
                onClick={() => setShowServicesModal(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] text-sm text-gray-700 leading-relaxed space-y-4">
              <p>
                Service support is available with the product to make it ready to use. Service applicable on the product can be availed on the product detail page or during checkout. For Brand provided services, we will notify the brand once the product is delivered. Brand will subsequently contact you to schedule the service. <strong>For paid services by Brands like AC installation the charges need to be paid directly to the brand technician we will initiate the request on your behalf.</strong>
              </p>

              <div className="space-y-3">
                <p className="font-bold text-gray-900">All services are listed below</p>
                <ul className="list-disc ml-5 space-y-2">
                  <li>Free installation and demo on Televisions. <span className="font-bold">**Installation at the time of delivery available in select pincodes</span> <span className="text-[#007185] cursor-pointer hover:underline">View details</span>. Wall mount brackets are chargeable if not included in the box along with the TV.</li>
                  <li>Free Phone set-up service at the time of delivery is available in select regions. This can be availed during checkout by selecting a time slot that mentions "with setup". <span className="text-[#007185] cursor-pointer hover:underline">View details</span></li>
                  <li>Free installation on Washing Machines and Refrigerator.</li>
                  <li>Paid Installations for Air Conditioners and Chimneys. For Brand provided AC installations, service charges will have to be paid to the brand technician directly.</li>
                  <li>Free assembly services for Furniture items requiring professional assembly.</li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowServicesModal(false)}
                className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-md text-sm font-medium shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write a Product Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReviewModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create Review</h2>
                <p className="text-xs text-gray-500 mt-0.5">{product.name}</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmittingReview(true);
                try {
                  const res = await api.post(`/products/${product.id}/reviews`, {
                    rating: reviewRating,
                    title: reviewTitle,
                    content: reviewContent,
                  });
                  if (res.data.success) {
                    toast.success('Thank you! Your review has been submitted.');
                    setShowReviewModal(false);
                    // Reset form
                    setReviewTitle('');
                    setReviewContent('');
                    setReviewRating(5);
                    // Refresh reviews list
                    const reviewsRes = await api.get(`/products/${product.id}/reviews`);
                    if (reviewsRes.data.success) {
                      setReviews(reviewsRes.data.data);
                    }
                    // Invalidate queries to refresh product details rating score
                    queryClient.invalidateQueries({ queryKey: ['product', slug] });
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                  }
                } catch (err: any) {
                  console.error('Error submitting review:', err);
                  toast.error(err.response?.data?.error || 'Failed to submit review. Please try again.');
                } finally {
                  setSubmittingReview(false);
                }
              }}
              className="p-6 space-y-4"
            >
              {/* Star Rating Selector */}
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Overall rating</label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const isHighlighted = hoverRating !== null
                      ? starIdx <= hoverRating
                      : starIdx <= reviewRating;
                    return (
                      <button
                        key={starIdx}
                        type="button"
                        onMouseEnter={() => setHoverRating(starIdx)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setReviewRating(starIdx)}
                        className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                      >
                        <span className={isHighlighted ? 'text-[#e47911]' : 'text-gray-300'}>★</span>
                      </button>
                    );
                  })}
                  <span className="text-xs text-gray-500 font-medium ml-2">
                    {reviewRating === 5 ? 'Love it' : reviewRating === 4 ? 'Like it' : reviewRating === 3 ? 'It\'s OK' : reviewRating === 2 ? 'Dislike it' : 'Hate it'}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div className="space-y-1">
                <label htmlFor="review-title" className="block text-sm font-bold text-gray-700">Add a headline</label>
                <input
                  id="review-title"
                  type="text"
                  required
                  placeholder="What's most important to know?"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>

              {/* Review Body */}
              <div className="space-y-1">
                <label htmlFor="review-content" className="block text-sm font-bold text-gray-700">Add a written review</label>
                <textarea
                  id="review-content"
                  required
                  rows={4}
                  placeholder="What did you like or dislike? What did you use this product for?"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-md text-sm font-medium shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingReview ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full View Image Modal */}
      {showFullView && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <button
              onClick={() => setShowFullView(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-sm font-bold text-gray-600"
            >
              CLOSE <span className="text-2xl font-light">×</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Thumbnails */}
            <div className="w-24 border-r border-gray-100 p-4 space-y-4 overflow-y-auto no-scrollbar hidden md:block bg-gray-50">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 transition-all ${idx === selectedImageIdx ? 'border-orange-500 shadow-md' : 'border-transparent hover:border-gray-300'
                    }`}
                >
                  <img
                    src={typeof img === 'string' ? img : (img as any).url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>

            {/* Main Image Area */}
            <div className="flex-1 bg-white flex items-center justify-center p-8 relative">
              <button
                onClick={() => setSelectedImageIdx(i => Math.max(0, i - 1))}
                disabled={selectedImageIdx === 0}
                className="absolute left-4 w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-3xl text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-all z-10"
              >
                ‹
              </button>

              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain transition-all duration-500"
                />
              </div>

              <button
                onClick={() => setSelectedImageIdx(i => Math.min(images.length - 1, i + 1))}
                disabled={selectedImageIdx === images.length - 1}
                className="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-3xl text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-all z-10"
              >
                ›
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-sm font-medium text-gray-600">Image {selectedImageIdx + 1} of {images.length}</p>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body { font-family: 'Inter', "Amazon Ember", Arial, sans-serif; }
      `}</style>
    </div>
  );
}
