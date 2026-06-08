import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import ProductCard from '../components/ui/ProductCard';
import FilterSidebar from '../components/filters/FilterSidebar';
import Pagination from '../components/ui/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import type { ProductFilters } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse shadow-sm">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded mt-3" />
      </div>
    </div>
  );
}

const DEALS_TABS = [
  'Deals with exchange', 'Blockbuster deals', 'Deals in focus',
  'Trending deals', 'Mobiles', 'Coupons', 'Electronics',
  'Mobile Accessories', 'Headphones, Smartwatch & Acc'
];

const TOP_CATEGORIES = [
  { name: 'Fashion & beauty', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200' },
  { name: 'Home', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200' },
  { name: 'Everyday needs', img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200' },
  { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200' },
  { name: 'Mobiles', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200' },
  { name: 'TVs & Appliances', img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200' },
  { name: 'For bulk order', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200' },
  { name: 'Books', img: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200' },
  { name: 'Travel bookings', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?w=200' },
];


export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [activeGender, setActiveGender] = useState<'men' | 'women'>('men');

  const dealImages = activeGender === 'women' ? [
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
    "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800&q=80",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80&v=4"
  ] : [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&v=4"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDealIndex((prev) => (prev + 1) % dealImages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const { data: categories } = useCategories();
  const { items: cartItems, removeItem } = useCartStore();
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const isDeals = slug === 'deals' || slug === 'todays-deals';
  const isFashion = false;
  const isHomeKitchen = false;
  const isBooks = slug === 'books';

  const [filters, setFilters] = useState<ProductFilters>({
    category: (slug !== 'all' && !isDeals) ? slug : undefined,
    search: searchParams.get('search') ?? undefined,
    condition: searchParams.get('condition') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort: isDeals ? 'discount_desc' : (searchParams.get('sort') ?? undefined),
    sort_by: searchParams.get('sort_by') ?? undefined,
    rating: searchParams.get('rating') ?? undefined,
    discount: searchParams.get('discount') ?? undefined,
    in_stock_only: searchParams.get('in_stock_only') === 'true' ? true : undefined,
    b2b_only: searchParams.get('b2b_only') === 'true' ? true : undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 16
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: (slug !== 'all' && !isDeals) ? slug : undefined,
      search: searchParams.get('search') ?? undefined,
      condition: searchParams.get('condition') ?? undefined,
      brand: searchParams.get('brand') ?? undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      sort: isDeals ? 'discount_desc' : (searchParams.get('sort') ?? undefined),
      sort_by: searchParams.get('sort_by') ?? undefined,
      rating: searchParams.get('rating') ?? undefined,
      discount: searchParams.get('discount') ?? undefined,
      in_stock_only: searchParams.get('in_stock_only') === 'true' ? true : undefined,
      b2b_only: searchParams.get('b2b_only') === 'true' ? true : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1
    }));
  }, [slug, isDeals, searchParams]);

  const { data, isLoading, error } = useProducts(filters);

  const currentCategory = categories?.find(c => c.slug === slug);
  const subcategories = categories?.filter(c => c.parent_id === currentCategory?.id) ?? [];
  const breadcrumbCat = categories?.find(c => c.id === currentCategory?.parent_id);

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);

    const params: Record<string, string> = {};
    if (updated.search) params.search = updated.search;
    if (updated.condition) params.condition = updated.condition;
    if (updated.brand) params.brand = updated.brand;
    if (updated.min_price) params.min_price = String(updated.min_price);
    if (updated.max_price) params.max_price = String(updated.max_price);
    if (updated.sort) params.sort = updated.sort;
    if (updated.sort_by) params.sort_by = updated.sort_by;
    if (updated.rating) params.rating = updated.rating;
    if (updated.discount) params.discount = updated.discount;
    if (updated.in_stock_only) params.in_stock_only = 'true';
    if (updated.b2b_only) params.b2b_only = 'true';
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const sortOptions = [
    { value: '', label: 'Featured' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'discount_desc', label: 'Highest Discount' }
  ];

  if (isDeals && !searchParams.toString()) {
    return (
      <div className="bg-[#F4F9F1] min-h-screen pb-20">
        {/* Main Summer Sale Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1B3B2B] to-[#132a1d] min-h-[300px] flex items-center justify-center text-white px-4">
          {/* Tropical Background Elements */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-green-800 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-green-600/20 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px]"></div>
            {/* Palm Leaf Decorators (Abstracted) */}
            <div className="absolute top-10 right-10 w-24 h-48 bg-green-900/20 rotate-45 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 left-10 w-24 h-48 bg-green-900/20 -rotate-45 rounded-full blur-xl"></div>
          </div>

          <div className="max-w-[1500px] w-full relative z-10 py-6 flex flex-col items-center text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6 w-full">
              <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-[0.9] drop-shadow-lg">
                Great Summer Sale <br /> <span className="text-[#E2F0D9]">is live</span>
              </h2>

              <div className="flex flex-col items-center md:items-end gap-3 md:ml-auto">
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold opacity-80 uppercase leading-none text-[#E2F0D9]">Powered by</p>
                    <p className="text-xl font-black italic tracking-tighter leading-none text-white">SAMSUNG Galaxy</p>
                  </div>
                  <div className="w-px h-8 bg-white/30" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold opacity-80 uppercase leading-none text-[#E2F0D9]">Co-Powered by</p>
                    <p className="text-xl font-black italic tracking-tighter leading-none text-white">intel <span className="font-normal not-italic">CORE</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full">
              <div className="bg-[#E2F0D9] text-[#1B3B2B] px-8 py-2 rounded-sm font-black italic text-lg shadow-md border-b-4 border-black/10 inline-block">
                Get ₹150 cashback* on orders above ₹2500
              </div>

              <div className="bg-white rounded-sm p-4 border border-gray-200 flex flex-col md:flex-row items-center gap-4 w-full max-w-[600px] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#1B3B2B]"></div>
                <div className="w-24 h-10 bg-[#1B3B2B] text-white flex items-center justify-center font-bold text-[10px] rounded-sm">HDFC BANK</div>
                <div className="h-px w-full md:h-8 md:w-px bg-gray-100" />
                <div className="flex-1 text-center md:text-left">
                  <p className="text-[#0f1111] text-[18px] font-black italic tracking-tighter">10% Instant Discount* <span className="font-normal not-italic text-sm">up to</span> ₹9,500 off</p>
                </div>
                <p className="absolute bottom-1 right-2 text-[8px] text-gray-400 font-bold">*T&C apply</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prime Banner Strip */}
        <div className="bg-[#1B3B2B] pt-10 pb-32">
          <div className="max-w-[1500px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            <p className="text-3xl font-black italic tracking-tight text-white">Only for Prime Members</p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 rounded-full font-black italic text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 border-b-4 border-green-800">
              Join Prime ▶
            </button>
          </div>
        </div>

        {/* Offer Tiles Grid - Deep Overlap */}
        <div className="max-w-[1500px] mx-auto -mt-24 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-20">
          {[
            { title: 'Flat ₹250 cashback', sub: 'on ₹2500', icon: '💰' },
            { title: 'Prime exclusive coupons', sub: 'on 2 Lakh+ products', icon: '🎟️' },
            { title: 'Unlimited 5% cashback', sub: 'with Amazon Pay', icon: '💳', brand: 'amazon pay' },
            { title: 'Unlock assured 5% back*', sub: 'Rewards GOLD', icon: '✨', brand: 'REWARDS GOLD' },
          ].map((tile, i) => (
            <div key={i} className="bg-white p-8 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-2xl transition-all cursor-pointer group flex flex-col items-center text-center min-h-[160px] justify-center">
              {tile.brand && (
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm mb-3 italic ${tile.brand.includes('pay') ? 'bg-green-900 text-white' : 'bg-green-100 text-green-900'}`}>
                  {tile.brand}
                </span>
              )}
              <h3 className="text-xl font-black italic tracking-tighter text-[#0f1111] mb-1 group-hover:text-green-600 transition-colors leading-tight">{tile.title}</h3>
              <p className="text-sm font-bold text-gray-500">{tile.sub}</p>
            </div>
          ))}
        </div>

        {/* Spotlight Brands Carousel */}
        <div className="max-w-[1500px] mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Spotlight brands</h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm hover:bg-gray-50">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm hover:bg-gray-50">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
            {(data?.data.slice(0, 10) || []).map((p, i) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="flex-shrink-0 w-[240px] group cursor-pointer block">
                <div className="aspect-[4/5] bg-white rounded-sm border border-gray-100 overflow-hidden relative mb-3 p-4 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  {/* Abstract Grid Background */}
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                  {(() => {
                    const img = p.images?.[0];
                    const src = typeof img === 'string' ? img : img?.url;
                    return src ? (
                      <img src={src} alt={p.name} className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-500" />
                    ) : (
                      <div className="relative z-10 w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    );
                  })()}
                  {(p.discount_percentage > 40 || i % 3 === 0) && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white text-[8px] font-black px-2 py-1 rounded-sm rotate-[-15deg] shadow-lg z-20">
                      {p.discount_percentage > 60 ? 'TOP DEAL' : 'NEW LAUNCH'}
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-1 mb-0.5">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-green-800">₹{p.selling_price.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] font-bold text-green-600">({Math.round(p.discount_percentage)}% off)</p>
                  </div>
                </div>
              </Link>
            ))}
            {(!data?.data || data.data.length === 0) && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[240px] animate-pulse">
                <div className="aspect-[4/5] bg-gray-100 rounded-sm mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto px-4 py-8">
          {/* Explore Top Categories Section */}
          <div className="mb-10 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Explore top categories</h2>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {TOP_CATEGORIES.map((cat, i) => (
                <div key={i} className="flex-shrink-0 w-[120px] flex flex-col items-center text-center cursor-pointer group">
                  <div className="w-[110px] h-[110px] rounded-2xl bg-green-50 border-4 border-green-100 overflow-hidden mb-3 group-hover:scale-105 transition-transform">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 leading-tight">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Tabs / Filter Chips */}
          <div className="mb-8 flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {DEALS_TABS.map((tab, i) => (
              <button
                key={tab}
                className={`px-5 py-2.5 rounded-sm border text-sm font-medium whitespace-nowrap transition-all ${i === 3 ? 'border-green-600 bg-green-50 text-green-900 shadow-sm' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
              >
                {tab}
              </button>
            ))}
            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Sidebar + Product Grid */}
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <FilterSidebar
              filters={filters}
              onFilterChange={updateFilters}
              className="w-64 flex-shrink-0 hidden lg:block"
            />

            {/* Product Grid */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data?.data.map(p => (
                    <div key={p.id} className="bg-white border-transparent border hover:border-gray-100 p-2 group cursor-pointer transition-all">
                      <div className="aspect-square bg-gray-50 rounded-sm mb-3 overflow-hidden relative p-4 flex items-center justify-center">
                        {(() => {
                          const img = p.images?.[0];
                          const src = typeof img === 'string' ? img : img?.url;
                          return src ? (
                            <img src={src} alt={p.name} className="max-w-full max-h-full object-contain transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          );
                        })()}
                        <button className="absolute bottom-2 right-2 w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full shadow-sm flex items-center justify-center text-white border border-green-700 z-10 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="bg-green-800 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">{Math.round(((p.mrp - p.selling_price) / p.mrp) * 100)}% off</span>
                        <span className="text-green-800 text-[11px] font-bold uppercase tracking-tight truncate">Great Summer Deal</span>
                      </div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-[13px] font-bold text-gray-900 leading-none">₹{p.selling_price.toLocaleString('en-IN')}</span>
                        <span className="text-[11px] text-gray-500">M.R.P.: <span className="line-through">₹{p.mrp.toLocaleString('en-IN')}</span></span>
                      </div>
                      <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-green-700">{p.name}</h3>
                      <div className="mt-auto">
                        <Link to="#" className="text-xs text-green-700 hover:text-green-800 hover:underline">Shop {p.brand} deals</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>




      </div>
    );
  }

  if (isFashion && !searchParams.toString()) {
    // Render Fashion Landing Page
    return (
      <div className="bg-white min-h-screen">
        {/* Fashion Sub-Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-[1500px] mx-auto px-4 py-2 flex items-center justify-between">
            <h1 className="text-[18px] font-bold text-[#0f1111]">ShopNow Fashion</h1>
            <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-gray-700">
              {['Women', 'Men', 'Kids', 'Bags & Luggage', 'Sportswear', 'Sales & Deals'].map(link => (
                <Link key={link} to="#" className="hover:text-[#c45500] hover:underline flex items-center gap-1">
                  {link} <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </Link>
              ))}
            </nav>
            <div className="text-[12px] text-gray-400">Sponsored ⓘ</div>
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto flex gap-4 p-4">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="mb-6">
              <h3 className="text-[14px] font-bold text-[#0f1111] mb-2 uppercase tracking-tighter">Category</h3>
              {slug === 'footwear' ? (
                <>
                  <Link to="/category/footwear" className="text-[13px] text-gray-600 font-bold block mb-1">‹ Shoes & Handbags</Link>
                  <Link to="/category/footwear" className="text-[13px] text-gray-600 font-bold block mb-1">‹ Shoes</Link>
                  <div className="pl-4 space-y-1">
                    <p className="text-[13px] font-bold text-[#0f1111]">Men's Shoes</p>
                    {['Casual Shoes', 'Sports & Outdoor Shoes', 'Formal Shoes', 'Sandals & Floaters', 'Flip-Flops & Slippers', 'Thong Sandals', 'Ethnic Footwear', 'Safety Shoes'].map(cat => (
                      <Link key={cat} to="#" className="block text-[13px] text-gray-600 hover:text-[#c45500] hover:underline">{cat}</Link>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/category/clothing" className="text-[13px] text-gray-600 font-bold block mb-1">‹ Clothing & Accessories</Link>
                  <div className="pl-4 space-y-1">
                    <p className="text-[13px] font-bold text-[#0f1111]">Women</p>
                    {['Ethnic Wear', 'Western Wear', 'Sportswear', 'Lingerie', 'Sleep & Lounge Wear', 'Accessories', 'Swim & Beachwear', 'Maternity', 'Sunglasses'].map(cat => (
                      <Link key={cat} to="#" className="block text-[13px] text-gray-600 hover:text-[#c45500] hover:underline">{cat}</Link>
                    ))}
                  </div>
                </>
              )}
            </div>
            <FilterSidebar filters={filters} onFilterChange={updateFilters} />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {slug === 'footwear' ? (
              /* Footwear Specific Content */
              <>
                {/* Men/Women Split Banner - Premium Redesign */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[180px] md:h-[220px] mb-8">
                  {/* Men Section */}
                  <div
                    onClick={() => setActiveGender('men')}
                    className="group relative rounded-lg overflow-hidden cursor-pointer shadow-lg transition-all duration-500 hover:shadow-2xl"
                  >
                    <img
                      src="/uploads/men_shoes_bg.png"
                      alt="Men's Footwear"
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${activeGender === 'men' ? 'opacity-100' : 'opacity-60 grayscale-[50%]'}`}
                    />
                    <div className={`absolute inset-0 transition-colors duration-500 ${activeGender === 'men' ? 'bg-orange-600/40' : 'bg-black/40 group-hover:bg-black/20'}`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                      <h2 className="text-5xl font-black italic tracking-tighter uppercase drop-shadow-lg mb-2">Men</h2>
                      <div className={`h-1 bg-white transition-all duration-500 ${activeGender === 'men' ? 'w-24 opacity-100' : 'w-0 opacity-0 group-hover:w-16 group-hover:opacity-100'}`} />
                      {activeGender === 'men' && (
                        <span className="mt-4 px-6 py-1.5 bg-white text-orange-600 font-black italic text-sm rounded-full shadow-xl animate-bounce">SHOP NOW</span>
                      )}
                    </div>
                  </div>

                  {/* Women Section */}
                  <div
                    onClick={() => setActiveGender('women')}
                    className="group relative rounded-lg overflow-hidden cursor-pointer shadow-lg transition-all duration-500 hover:shadow-2xl"
                  >
                    <img
                      src="/uploads/women_shoes_bg.png"
                      alt="Women's Footwear"
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${activeGender === 'women' ? 'opacity-100' : 'opacity-60 grayscale-[50%]'}`}
                    />
                    <div className={`absolute inset-0 transition-colors duration-500 ${activeGender === 'women' ? 'bg-orange-600/40' : 'bg-black/40 group-hover:bg-black/20'}`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                      <h2 className="text-5xl font-black italic tracking-tighter uppercase drop-shadow-lg mb-2">Women</h2>
                      <div className={`h-1 bg-white transition-all duration-500 ${activeGender === 'women' ? 'w-24 opacity-100' : 'w-0 opacity-0 group-hover:w-16 group-hover:opacity-100'}`} />
                      {activeGender === 'women' && (
                        <span className="mt-4 px-6 py-1.5 bg-white text-orange-600 font-black italic text-sm rounded-full shadow-xl animate-bounce">SHOP NOW</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footwear Summer Sale Banner */}
                <div className="mb-8 relative rounded-sm overflow-hidden bg-gradient-to-r from-orange-500 to-orange-300 p-6 md:p-10 flex items-center justify-between border border-orange-200">
                  <div className="z-10">
                    <h2 className="text-white text-3xl sm:text-4xl font-black italic tracking-tighter mb-1 uppercase">
                      {activeGender === 'women' ? "Women's Collection" : "Great Summer Sale"}
                    </h2>
                    <p className="text-white text-xl font-bold italic underline mb-2">Shop Now</p>
                    <div className="bg-[#fdf200] px-3 py-0.5 inline-block rounded-sm transform -rotate-1">
                      <span className="text-[#cc0000] font-black text-lg">50-70% off</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-sm shadow-md grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    {activeGender === 'women'
                      ? ['Metro', 'Mochi', 'Catwalk', 'Inc.5'].map(brand => (
                        <div key={brand} className="text-[10px] font-black text-gray-900 italic uppercase border-r border-gray-100 last:border-0 px-2 leading-none">{brand}</div>
                      ))
                      : ['Skechers', 'Crocs', 'Nike', 'Adidas'].map(brand => (
                        <div key={brand} className="text-[10px] font-black text-gray-900 italic uppercase border-r border-gray-100 last:border-0 px-2 leading-none">{brand}</div>
                      ))
                    }
                  </div>
                </div>



                {/* Steal Deals Slider Section */}
                <div className="mb-12 relative group">
                  <div className="flex flex-col md:flex-row rounded-lg overflow-hidden border border-gray-200 bg-white shadow-xl h-auto md:h-[450px]">
                    {/* Left: Lifestyle Image */}
                    <div className="md:w-1/2 relative h-[300px] md:h-full overflow-hidden">
                      <img
                        src={dealImages[activeDealIndex]}
                        alt="Sporty kicks"
                        className="w-full h-full object-cover transition-all duration-1000 transform scale-105"
                        key={activeDealIndex}
                      />
                      {/* Gradient Overlay for Mobile */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
                    </div>

                    {/* Right: Offer Details */}
                    <div className="md:w-1/2 bg-[#E3F2FD] p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      {/* Background Glow Effect */}
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/20 blur-[100px] rounded-full" />
                      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-400/20 blur-[100px] rounded-full" />

                      <div className="relative z-10 space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]">STEAL</h3>
                          <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)] leading-none">DEALS</h3>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[#0f1111] text-3xl md:text-4xl font-black italic tracking-tighter">Min. 55% off</p>
                          <p className="text-gray-600 text-lg font-bold">Sporty kicks</p>
                        </div>

                        <div className="bg-white p-4 rounded-sm shadow-sm flex items-center justify-center gap-6 border border-white/50 backdrop-blur-sm mt-4">
                          <span className="text-xl font-black text-gray-900 italic tracking-tighter">PUMA</span>
                          <div className="w-px h-6 bg-gray-200" />
                          <span className="text-xl font-black text-gray-900 italic tracking-tighter">SKECHERS</span>
                          <div className="text-[10px] text-gray-400 font-bold uppercase ml-2">& more</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-sm shadow-lg flex items-center justify-center text-gray-800 transition-all opacity-0 group-hover:opacity-100 z-20 border border-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-sm shadow-lg flex items-center justify-center text-gray-800 transition-all opacity-0 group-hover:opacity-100 z-20 border border-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>

                  {/* Pagination Dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    {dealImages.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${i === activeDealIndex ? 'bg-gray-800' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Clothing Specific Content (Default Fashion) */
              <>
                {/* Large Summer Sale Banner */}
                <div className="mb-8 relative rounded-sm overflow-hidden bg-gradient-to-r from-[#ff4d00] to-[#ffaa00] p-6 sm:p-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 border border-orange-200">
                  <div className="z-10">
                    <h2 className="text-white text-5xl font-black italic tracking-tighter mb-2">Great Summer Sale</h2>
                    <p className="text-white text-2xl font-bold italic underline mb-4">Shop Now</p>
                    <div className="bg-[#fdf200] px-4 py-1 inline-block rounded-sm transform -rotate-1">
                      <span className="text-[#cc0000] font-black text-xl">Min. 60% off</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-sm shadow-md grid grid-cols-3 sm:grid-cols-4 gap-4 items-center">
                    {['Libas', 'GAP', 'Biba', 'Janasya', 'Levi\'s', 'Nike'].map(brand => (
                      <div key={brand} className="text-xs font-black text-gray-900 italic uppercase border-r border-gray-100 last:border-0 px-2">{brand}</div>
                    ))}
                  </div>
                </div>

                {/* Bank Offer Banner */}
                <div className="mb-8 bg-white border border-gray-200 rounded-sm p-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                  <div className="w-24 h-10 bg-[#004c8f] text-white flex items-center justify-center font-bold text-xs italic rounded-sm">HDFC BANK</div>
                  <div className="text-lg font-bold text-[#0f1111]">
                    Bank Offer Reset Today: <span className="text-[#b12704]">10% Instant Discount* up to ₹9,500 off</span>
                  </div>
                </div>

                {/* New Launches Section */}
                <div className="mb-8 relative rounded-sm overflow-hidden bg-[#e0f34e] p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="bg-red-600 text-white p-2 rounded-full transform -rotate-12">🚀</span>
                    <h2 className="text-3xl font-black italic text-[#b12704] tracking-tighter">New Launches</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden border-4 border-white shadow-xl">
                      <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800" alt="New Launch" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                        <h3 className="text-white text-2xl font-black italic">Min. 55% off</h3>
                        <p className="text-white/90 text-sm">+ Extra 5% off</p>
                        <p className="text-[#fdf200] font-bold">Ethnic must-haves</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xl font-bold text-[#0f1111]">Upgrade your wardrobe with the latest styles</h4>
                      <p className="text-gray-600">Discover over 1,000+ new arrivals from top brands. Shop ethnic, western, and casual wear at unbeatable prices.</p>
                      <button className="px-8 py-3 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-bold rounded-lg shadow-sm border border-[#FCD200]">Explore Now</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Footwear Specific Landing Sections */}
            {slug?.toLowerCase() === 'footwear' && (
              <>
                {/* Sole-ful deals to bag */}
                <div className="mt-8 mb-12 bg-[#E1F34E] p-8 rounded-sm border border-gray-100 shadow-sm overflow-hidden">
                  <h2 className="text-5xl md:text-6xl font-black text-center mb-10 tracking-tighter text-[#0f1111] uppercase italic">Sole-ful deals to bag</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-2">
                    {[
                      { title: 'Running shoes', deal: 'Min. 50% off', brands: ['ASICS', 'REEBOK'], img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
                      { title: 'Clogs & sandals', deal: 'Min. 45% off', brands: ['CROCS', 'WOODLAND'], img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400' },
                      { title: 'Classy sneakers', deal: '40-70% off', brands: ['PUMA', 'U.S. POLO ASSN.'], img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400' },
                      { title: 'Formal footwear', deal: 'Min. 40% off', brands: ['HUSH PUPPIES', 'LOUIS PHILIPPE'], img: 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400' },
                      { title: 'Flip-flops & slides', deal: 'Min. 40% off', brands: ['CAMPUS', 'SPARX'], img: 'https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=400' },
                      { title: 'Sneakers & sandals', deal: 'Min. 40% off', brands: ['LIBERTY', 'ASIAN'], img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400', tag: 'For kids' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-sm shadow-sm flex flex-col items-center text-center group cursor-pointer hover:shadow-lg transition-all relative">
                        {item.tag && <div className="absolute top-0 right-0 bg-[#FF4D00] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-sm z-10">{item.tag}</div>}
                        <div className="aspect-square w-full mb-4 overflow-hidden flex items-center justify-center p-2">
                          <img src={item.img} alt={item.title} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h3 className="text-[13px] font-bold text-gray-800 mb-1 leading-tight h-8 flex items-center justify-center">{item.title}</h3>
                        <p className="text-[16px] font-black italic tracking-tighter text-gray-900 mb-3">{item.deal}</p>
                        <div className="flex items-center justify-center gap-1.5 mt-auto pt-2 border-t border-gray-100 w-full opacity-60">
                          {item.brands.map(b => (
                            <span key={b} className="text-[9px] font-black text-gray-900 italic tracking-tighter uppercase whitespace-nowrap">{b}</span>
                          ))}
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold uppercase mt-1">& more</span>
                      </div>
                    ))}
                  </div>
                </div>


              </>
            )}

            {/* Real Product Grid Below Landing Content */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#0f1111]">Best Deals for You</h2>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Sort by:</label>
                  <select
                    onChange={e => updateFilters({ sort_by: e.target.value })}
                    value={filters.sort_by ?? ''}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-gray-50"
                  >
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data?.data.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </div>
          </div>

          {/* Mini Cart Right Sidebar */}
          <aside className="w-[200px] flex-shrink-0 hidden xl:block">
            <div className="bg-white border border-gray-200 p-4 rounded-sm sticky top-24">
              <div className="text-center mb-4">
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-widest">Subtotal</p>
                <p className="text-[18px] font-bold text-[#b12704]">{fmt(cartTotal)}</p>
              </div>
              <Link to="/cart" className="block w-full py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-lg text-center text-[12px] font-medium shadow-sm mb-6 transition-colors">Go to Cart</Link>

              <div className="space-y-6">
                {cartItems.slice(0, 2).map(item => (
                  <div key={item.product_id} className="text-center group">
                    <div className="aspect-square bg-gray-50 rounded-sm mb-2 p-2 border border-gray-100 group-hover:border-orange-200 transition-colors relative">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain" />}
                      <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black px-1 rounded-sm">SALE</div>
                    </div>
                    <p className="text-[11px] text-gray-900 font-bold line-clamp-1 group-hover:text-[#c45500]">{item.name}</p>
                    <p className="text-[12px] text-[#b12704] font-bold">{fmt(item.price)}</p>
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors border border-gray-200 rounded-sm hover:border-red-200 hover:bg-red-50"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (isBooks && !searchParams.toString()) {
    return (
      <div className="bg-white min-h-screen pb-12 overflow-x-hidden">
        {/* Books Sub-Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-[1500px] mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <h1 className="text-[14px] font-bold text-[#0f1111] whitespace-nowrap">ShopNow Books</h1>
              {['Kindle eBooks', 'Best Sellers', 'New Releases', 'Children\'s Books', 'Textbooks', 'Exams', 'Literature & Fiction'].map(link => (
                <Link key={link} to="#" className="text-[12px] text-gray-700 hover:text-[#c45500] hover:underline whitespace-nowrap">{link}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Massive Selection Section - Replicating Kindle Landing */}
        <div className="bg-white py-20 overflow-hidden">
          <div className="max-w-[1500px] mx-auto px-4">
            <div className="flex flex-col items-center">
              {/* Curved/Skewed Book Carousel */}
              <div className="relative w-full max-w-[1200px] h-[300px] md:h-[400px] mb-12 flex items-center justify-center">
                <div className="flex items-center justify-center gap-2 md:gap-4 perspective-[1000px]">
                  {[
                    { img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300', rotate: '-25deg', scale: '0.8', z: '10' },
                    { img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300', rotate: '-15deg', scale: '0.9', z: '20' },
                    { img: '/uploads/book_rich_dad.png', rotate: '-5deg', scale: '1', z: '30' },
                    { img: '/uploads/book_forest.png', rotate: '5deg', scale: '1.1', z: '40', highlight: true },
                    { img: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300', rotate: '15deg', scale: '1', z: '30' },
                    { img: '/uploads/book_sapiens.png', rotate: '25deg', scale: '0.9', z: '20' },
                    { img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300', rotate: '35deg', scale: '0.8', z: '10' },
                  ].map((book, i) => (
                    <div
                      key={i}
                      className={`relative flex-shrink-0 w-[120px] md:w-[180px] aspect-[2/3] bg-white shadow-2xl transition-all duration-500 hover:scale-110 hover:z-50 cursor-pointer ${book.highlight ? 'border-4 border-[#FF9900]' : ''}`}
                      style={{
                        transform: `rotateY(${book.rotate}) scale(${book.scale})`,
                        zIndex: book.z
                      }}
                    >
                      <img src={book.img} alt="Book Cover" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Text Content */}
              <div className="flex flex-col md:flex-row items-start justify-between gap-12 max-w-[1000px] w-full">
                <div className="md:w-1/2">
                  <h2 className="text-5xl md:text-6xl font-black text-gray-900 leading-[0.9] tracking-tighter">
                    Massive <br /> selection
                  </h2>
                </div>
                <div className="md:w-1/2 space-y-6">
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    Discover great reads and Kindle exclusives. Prime members get unlimited access to over a hundreds of books and Kindle Unlimited offers over thousands of titles. With Whispersync, switch from Kindle to the Kindle app without losing your place (requires Wi-Fi).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="max-w-[1500px] mx-auto p-4 flex gap-8 mt-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="mb-6">
              <h3 className="text-[14px] font-bold text-[#0f1111] mb-2 uppercase tracking-tighter">Browse by Category</h3>
              <div className="space-y-1">
                {['Action & Adventure', 'Biographies & Autobiographies', 'Business & Economics', 'Comics & Mangas', 'Crime, Thriller & Mystery', 'Fiction', 'Health, Family & Personal Development', 'History', 'Religion & Spirituality', 'Romance', 'Sci-Fi & Fantasy'].map(cat => (
                  <Link key={cat} to="#" className="block text-[13px] text-gray-600 hover:text-green-700 hover:underline">{cat}</Link>
                ))}
              </div>
            </div>
            <FilterSidebar filters={filters} onFilterChange={updateFilters} />
          </aside>

          {/* Main Product Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Recommended Books</h2>
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-gray-500 font-medium">Sort by:</label>
                <select
                  onChange={e => updateFilters({ sort: e.target.value })}
                  className="text-[12px] border border-gray-300 rounded px-3 py-1.5 bg-[#f0f2f2] hover:bg-[#e3e6e6] transition-colors cursor-pointer"
                >
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {data?.data.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isHomeKitchen && !searchParams.toString()) {
    return (
      <div className="bg-white min-h-screen pb-12">
        {/* Amazon Home Sub-Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-[1500px] mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <h1 className="text-[14px] font-bold text-[#0f1111] whitespace-nowrap">Amazon Home</h1>
              {['Kitchen & Home Appliances', 'Large Appliances', 'Kitchen & Dining', 'Furniture', 'Home Furnishing', 'Home Decor', 'Home Improvement', 'Garden & Outdoor', 'Storage & Organisation', 'Lighting'].map(link => (
                <Link key={link} to="#" className="text-[12px] text-gray-700 hover:text-green-700 hover:underline whitespace-nowrap">{link}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto p-4 flex gap-4">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <div className="mb-6">
              <h3 className="text-[14px] font-bold text-[#0f1111] mb-2">Category</h3>
              <Link to="/category/home-kitchen" className="text-[13px] text-gray-600 font-bold block mb-1">‹ Home & Kitchen</Link>
              <div className="pl-4 space-y-1">
                <p className="text-[13px] font-bold text-[#0f1111]">Kitchen & Dining</p>
                {['Bakeware', 'Bar Accessories', 'Cookware', 'Gas Stoves', 'Kitchen Storage & Containers', 'Kitchen Tools', 'Tableware'].map(cat => (
                  <Link key={cat} to="#" className="block text-[13px] text-gray-600 hover:text-green-700 hover:underline">{cat}</Link>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-[14px] font-bold text-[#0f1111] mb-2">Amazon Prime</h3>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-[13px] text-green-700 group-hover:text-green-800 font-bold">✓prime</span>
              </label>
            </div>

            <FilterSidebar filters={filters} onFilterChange={updateFilters} />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-green-800 mb-2">Cookware & Dining</h1>
              <p className="text-[13px] text-gray-600 leading-snug">
                Browse through the wide range of kitchen products online at ShopNow India. Buy kitchenware products like <span className="text-green-700 hover:underline cursor-pointer">Cookware</span>, <span className="text-green-700 hover:underline cursor-pointer">Gas stoves</span>, <span className="text-green-700 hover:underline cursor-pointer">Pressure cookers</span>, <span className="text-green-700 hover:underline cursor-pointer">Kitchen Storage</span>, <span className="text-green-700 hover:underline cursor-pointer">Cooking Tools</span>, <span className="text-green-700 hover:underline cursor-pointer">Tableware</span>, <span className="text-green-700 hover:underline cursor-pointer">Bakeware</span> and much more at affordable prices online at ShopNow.in.
              </p>
            </div>

            {/* Split Banner */}
            <div className="mb-8 border border-gray-200 rounded-sm overflow-hidden shadow-sm">
              <div className="flex h-[80px]">
                <div className="flex-1 bg-[#fde8f3] flex items-center justify-center border-r border-gray-200 cursor-pointer hover:bg-[#fbd5e9] transition-colors">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Home & kitchen appliances</h3>
                </div>
                <div className="flex-1 bg-[#fff8e1] flex items-center justify-center cursor-pointer hover:bg-[#fff2cc] transition-colors">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Kitchen & dining</h3>
                </div>
              </div>
              <div className="relative bg-[#1B3B2B] h-[350px] flex items-center justify-between p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-600/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 flex-1">
                  <h2 className="text-white text-[80px] font-black italic tracking-tighter leading-[0.8] mb-4">
                    Great <br /> Summer Sale
                  </h2>
                  <div className="bg-[#E2F0D9] text-[#1B3B2B] px-8 py-2 rounded-sm font-black italic text-2xl inline-block shadow-lg">
                    Live Now
                  </div>
                </div>

                <div className="relative z-10 w-[400px] border-l-2 border-white/30 pl-10 text-white">
                  <h3 className="text-4xl font-black italic tracking-tighter leading-tight mb-4">
                    Sizzling summer savings on your kitchen & dining essentials
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <span className="text-xl font-bold">Min. 50% Off</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shop by Category Section */}
            <div className="mb-12">
              <h2 className="text-xl font-bold text-green-800 mb-6">Shop by category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Lunch boxes', img: 'https://m.media-amazon.com/images/I/71u9G0YnF1L._AC_SY200_.jpg' },
                  { name: 'Water bottles', img: 'https://m.media-amazon.com/images/I/61y49C8vG6L._AC_SY200_.jpg' },
                  { name: 'Lunch bags', img: 'https://m.media-amazon.com/images/I/71nZ5V7W8jL._AC_SY200_.jpg' },
                  { name: 'Kitchen storage', img: 'https://m.media-amazon.com/images/I/61u9fM7Y6GL._AC_SY200_.jpg' },
                  { name: 'Flasks', img: 'https://m.media-amazon.com/images/I/51Y7Y6K9kLL._AC_SY200_.jpg' },
                  { name: 'Dinnerware', img: 'https://m.media-amazon.com/images/I/61k9B9K9YLL._AC_SY200_.jpg' },
                ].map((cat, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-sm p-4 flex flex-col items-center group cursor-pointer hover:shadow-md transition-shadow">
                    <div className="aspect-square w-full mb-3 flex items-center justify-center">
                      <img src={cat.img} alt={cat.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
                <div className="flex items-center gap-3">
                  <label className="text-[12px] text-gray-500 font-medium">Sort by:</label>
                  <select
                    onChange={e => updateFilters({ sort: e.target.value })}
                    className="text-[12px] border border-gray-300 rounded px-3 py-1.5 bg-[#f0f2f2] hover:bg-[#e3e6e6] transition-colors cursor-pointer"
                  >
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data?.data.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </div>
          </div>
        </div>




      </div>
    );
  }

  // Fallback to standard Category List View
  return (
    <div className="bg-[#f7f8f8] min-h-screen overflow-x-hidden">
      {/* Search Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-[14px] text-[#0f1111]">
            <span className="font-bold">1-{data?.data.length || 0}</span> of over <span className="font-bold">{data?.meta?.total || 0}</span> results for
            <span className="text-green-700 font-bold ml-1">"{slug === 'all' ? 'All Products' : (currentCategory?.name || slug)}"</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2">
              <label className="text-[13px] text-gray-600">Sort by:</label>
              <select
                value={filters.sort ?? ''}
                onChange={e => updateFilters({ sort: e.target.value || undefined })}
                className="text-[13px] rounded border border-gray-300 py-1 pl-2 pr-8 bg-[#f0f2f2] hover:bg-[#e3e6e6] focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer shadow-sm"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
          <Link to="/" className="hover:text-green-700 hover:underline">Home</Link>
          <span>/</span>
          {breadcrumbCat && (
            <>
              <Link to={`/category/${breadcrumbCat.slug}`} className="hover:text-green-700 hover:underline">{breadcrumbCat.name}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">
            {slug === 'all' ? 'All Products' : (currentCategory?.name ?? slug)}
          </span>
        </nav>

        {/* Category Banner for Electronics - Summer Sale */}
        {slug === 'electronics' && (
          <div className="mb-8">
            <div className="mb-8 relative rounded-lg overflow-hidden group shadow-lg">
              <img
                src="/summer_sale_banner.png"
                alt="Great Summer Sale"
                className="w-full h-[250px] md:h-[400px] object-cover"
              />
            </div>

            {/* Scrolling Brands Carousel - Full Width Text Based */}
            <div className="mb-12 bg-white py-8 border-y border-gray-200 overflow-hidden relative">
              <div className="flex animate-scroll whitespace-nowrap w-max">
                {/* First set of brands */}
                <div className="flex items-center flex-shrink-0">
                  {['SAMSUNG', 'APPLE', 'LG', 'SONY', 'XIAOMI', 'HP', 'DELL', 'ACER', 'ASUS', 'BOSE', 'LOGITECH', 'LENOVO', 'NOKIA', 'PANASONIC'].map(brand => (
                    <span key={brand} className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">{brand}</span>
                  ))}
                </div>
                {/* Second identical set for seamless loop */}
                <div className="flex items-center flex-shrink-0">
                  {['SAMSUNG', 'APPLE', 'LG', 'SONY', 'XIAOMI', 'HP', 'DELL', 'ACER', 'ASUS', 'BOSE', 'LOGITECH', 'LENOVO', 'NOKIA', 'PANASONIC'].map(brand => (
                    <span key={brand + '_2'} className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">{brand}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-8">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit sticky top-[72px] shadow-sm">
              <h3 className="text-[14px] font-bold text-[#0f1111] mb-5 uppercase tracking-wider border-b border-gray-100 pb-2">Filters</h3>
              <FilterSidebar filters={filters} onFilterChange={updateFilters} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : !data?.data.length ? (
              <EmptyState title="No results found" description="Try adjusting your filters" />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data.data.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {data.meta && data.meta.total_pages > 1 && (
                  <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex justify-center">
                    <Pagination
                      page={data.meta.page}
                      total_pages={data.meta.total_pages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          flex-direction: row;
          animation: marquee-scroll 25s linear infinite;
          will-change: transform;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
