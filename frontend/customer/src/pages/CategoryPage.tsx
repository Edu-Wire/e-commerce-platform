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

  const [filters, setFilters] = useState<ProductFilters>({
    category: slug !== 'all' ? slug : undefined,
    search: searchParams.get('search') ?? undefined,
    condition: searchParams.get('condition') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 16
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: slug !== 'all' ? slug : undefined,
      page: 1
    }));
  }, [slug]);

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
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFashion = slug === 'clothing' || slug === 'footwear' || slug?.includes('wear');
  const isDeals = slug === 'deals' || slug === 'todays-deals';

  const sortOptions = [
    { value: '', label: 'Featured' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'discount_desc', label: 'Highest Discount' }
  ];

  if (isDeals && !searchParams.toString()) {
    return (
      <div className="bg-white min-h-screen">
        {/* Main Summer Sale Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#FF9900] to-[#FF4400] min-h-[300px] flex items-center justify-center text-white px-4">
          <div className="max-w-[1500px] w-full grid grid-cols-1 md:grid-cols-2 items-center gap-8 py-10">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none">Great Summer Sale is live</h2>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-sm border border-white/20 inline-flex">
                <span className="text-[#FFD814] font-black text-xl sm:text-2xl">Get ₹150 cashback*</span>
                <span className="text-sm font-bold">on orders above ₹2500</span>
              </div>
              <p className="text-[10px] opacity-70">*T&C apply</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex gap-4 items-center">
                <div className="text-right">
                  <p className="text-xs font-bold opacity-80 uppercase">Powered by</p>
                  <p className="text-xl font-black italic tracking-tighter">SAMSUNG Galaxy</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-left">
                  <p className="text-xs font-bold opacity-80 uppercase">Co-Powered by</p>
                  <p className="text-xl font-black italic tracking-tighter">intel CORE</p>
                </div>
              </div>
              <div className="bg-white rounded-sm p-4 border border-gray-200 flex items-center gap-4 w-full max-w-[500px] shadow-2xl">
                <div className="w-20 h-8 bg-[#004c8f] text-white flex items-center justify-center font-bold text-[10px] rounded-sm">HDFC BANK</div>
                <div className="flex-1">
                  <p className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">Bank Offer Reset Today</p>
                  <p className="text-[#0f1111] text-[14px] font-bold">10% Instant Discount* up to ₹9,500 off</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prime Banner Strip */}
        <div className="bg-[#007185] py-4 text-center">
          <div className="max-w-[1500px] mx-auto flex items-center justify-center gap-4 text-white">
            <p className="text-xl font-bold italic tracking-tight">Only for Prime Members</p>
            <button className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0f1111] px-8 py-2 rounded-sm font-black italic text-lg shadow-sm border border-[#FCD200]">Join Prime ▶</button>
          </div>
        </div>

        {/* Offer Tiles Grid */}
        <div className="max-w-[1500px] mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group cursor-pointer">
            <h3 className="text-[#0f1111] text-2xl font-black italic mb-2">Flat ₹250 cashback</h3>
            <p className="text-gray-500 text-lg font-bold">on ₹2500</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group cursor-pointer">
            <h3 className="text-[#0f1111] text-2xl font-black italic mb-2">Prime exclusive coupons</h3>
            <p className="text-gray-500 text-lg font-bold">on 2 Lakh+ products</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#232f3e] text-white p-1 rounded-sm text-[8px] font-bold italic">amazon pay</div>
              <h3 className="text-[#0f1111] text-2xl font-black italic leading-none">Unlimited</h3>
            </div>
            <p className="text-gray-500 text-lg font-bold">5% cashback</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-[#FFD814] text-gray-900 p-1 rounded-sm text-[8px] font-black italic uppercase">Rewards GOLD</div>
              <h3 className="text-[#0f1111] text-2xl font-black italic leading-none">Unlock assured</h3>
            </div>
            <p className="text-gray-500 text-lg font-bold">5% back*</p>
          </div>
        </div>

        {/* Spotlight Brands Section */}
        <div className="max-w-[1500px] mx-auto p-6">
          <h2 className="text-2xl font-bold text-[#0f1111] mb-6">Spotlight brands</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { brand: 'Samsung', img: 'https://m.media-amazon.com/images/I/71X8k8XqUaL._SX679_.jpg', deal: 'Up to 40% off' },
              { brand: 'Apple', img: 'https://m.media-amazon.com/images/I/716572hzXWL._SX679_.jpg', deal: 'Exciting offers' },
              { brand: 'ASUS', img: 'https://m.media-amazon.com/images/I/71R3i8m+QHL._SX679_.jpg', deal: 'Min. ₹10,000 off' },
              { brand: 'Qubo', img: 'https://m.media-amazon.com/images/I/51r5L-vGshL._SX679_.jpg', deal: 'Flat 30% off' },
              { brand: 'Boat', img: 'https://m.media-amazon.com/images/I/61S9aVn9d6L._SX679_.jpg', deal: 'Up to 70% off' },
            ].map(b => (
              <div key={b.brand} className="bg-[#F7F8F8] p-4 rounded-sm border border-gray-200 hover:shadow-xl transition-all group cursor-pointer">
                <div className="aspect-square mb-4 bg-white p-4 rounded-sm flex items-center justify-center overflow-hidden">
                  <img src={b.img} alt={b.brand} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                </div>
                <p className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 inline-block rounded-sm mb-2 uppercase tracking-tighter">New Launch</p>
                <h3 className="text-[15px] font-bold text-[#0f1111] mb-1">{b.brand}</h3>
                <p className="text-[#b12704] text-[13px] font-bold">{b.deal}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid Header */}
        <div className="max-w-[1500px] mx-auto p-6 border-t border-gray-100 mt-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#0f1111]">Deals recommended for you</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 italic">Sponsored ⓘ</span>
            </div>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {data?.data.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
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
                {/* Men/Women Split Banner */}
                <div className="flex h-[120px] mb-6 rounded-sm overflow-hidden border border-gray-100 shadow-md">
                  <div 
                    onClick={() => setActiveGender('men')}
                    className={`flex-1 flex items-center justify-center cursor-pointer transition-all group ${activeGender === 'men' ? 'bg-[#ff4d00]' : 'bg-white hover:bg-gray-50 border-r border-gray-100'}`}
                  >
                    <h2 className={`text-4xl font-black italic tracking-tighter transition-transform group-hover:scale-110 ${activeGender === 'men' ? 'text-white' : 'text-gray-400'}`}>Men</h2>
                  </div>
                  <div 
                    onClick={() => setActiveGender('women')}
                    className={`flex-1 flex items-center justify-center cursor-pointer transition-all group ${activeGender === 'women' ? 'bg-[#ff4d00]' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <h2 className={`text-4xl font-black italic tracking-tighter transition-transform group-hover:scale-110 border-2 px-8 py-1 ${activeGender === 'women' ? 'text-white border-white' : 'text-[#0f1111] border-[#0f1111]'}`}>Women</h2>
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

                {/* Footwear Brand Infinite Scroll */}
                <div className="mb-10 bg-white py-4 border-y border-gray-100 overflow-hidden relative">
                  <div className="flex animate-scroll whitespace-nowrap w-max">
                    {/* First set of brands */}
                    <div className="flex items-center flex-shrink-0">
                      {['PUMA', 'ADIDAS', 'SKECHERS', 'CROCS', 'HUSH PUPPIES', 'U.S. POLO ASSN.', 'WOODLAND', 'CAMPUS', 'NEW BALANCE', 'ASIAN', 'ASICS', 'SYMBOL', 'BATA', 'SPARX', 'LIBERTY', 'NIKE', 'REEBOK', 'FILA', 'CONVERSE', 'VANS'].map((brand, idx) => (
                        <span key={`${brand}-${idx}`} className="text-xl font-black text-gray-900 mx-10 tracking-tighter italic">{brand}</span>
                      ))}
                    </div>
                    {/* Second identical set for seamless loop */}
                    <div className="flex items-center flex-shrink-0">
                      {['PUMA', 'ADIDAS', 'SKECHERS', 'CROCS', 'HUSH PUPPIES', 'U.S. POLO ASSN.', 'WOODLAND', 'CAMPUS', 'NEW BALANCE', 'ASIAN', 'ASICS', 'SYMBOL', 'BATA', 'SPARX', 'LIBERTY', 'NIKE', 'REEBOK', 'FILA', 'CONVERSE', 'VANS'].map((brand, idx) => (
                        <span key={`${brand}-second-${idx}`} className="text-xl font-black text-gray-900 mx-10 tracking-tighter italic">{brand}</span>
                      ))}
                    </div>
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

                {/* Top brands on offer */}
                <div className="mb-12 bg-[#A0E7E5] p-8 rounded-sm border border-gray-100 shadow-sm overflow-hidden">
                  <h2 className="text-5xl md:text-6xl font-black text-center mb-10 tracking-tighter text-[#0f1111] uppercase italic">Top brands on offer</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 px-2">
                    {[
                      { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', deal: 'Min. 50% off' },
                      { img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400', deal: 'Min. 45% off' },
                      { img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', deal: 'Min. 55% off' },
                      { img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', deal: 'Min. 45% off' },
                      { img: 'https://images.unsplash.com/photo-1512374382149-4332c6c02151?w=400', deal: 'Min. 55% off' },
                      { img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400', deal: 'Min. 55% off' },
                    ].map((item, idx) => (
                      <div key={idx} className="relative aspect-[3/4] bg-white rounded-sm overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all border border-white/20">
                        <img src={item.img} alt="Brand Deal" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md py-3 px-3 flex flex-col items-center border-t border-gray-100">
                          <p className="text-[18px] font-black italic tracking-tighter text-[#0f1111] leading-none">{item.deal}</p>
                        </div>
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
                    onChange={e => updateFilters({ sort: e.target.value })}
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
              <Link to="/cart" className="block w-full py-1.5 bg-white border border-gray-300 rounded-full text-center text-[12px] font-medium hover:bg-gray-50 mb-6">Go to Cart</Link>

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

  // Fallback to standard Category List View
  return (
    <div className="bg-[#f7f8f8] min-h-screen overflow-x-hidden">
      {/* Search Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-[14px] text-[#0f1111]">
            <span className="font-bold">1-{data?.data.length || 0}</span> of over <span className="font-bold">{data?.meta?.total || 0}</span> results for
            <span className="text-[#c45500] font-bold ml-1">"{slug === 'all' ? 'All Products' : (currentCategory?.name || slug)}"</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2">
              <label className="text-[13px] text-gray-600">Sort by:</label>
              <select
                value={filters.sort ?? ''}
                onChange={e => updateFilters({ sort: e.target.value || undefined })}
                className="text-[13px] rounded border border-gray-300 py-1 pl-2 pr-8 bg-[#f0f2f2] hover:bg-[#e3e6e6] focus:outline-none focus:ring-1 focus:ring-[#007185] cursor-pointer shadow-sm"
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
          <Link to="/" className="hover:text-[#c45500] hover:underline">Home</Link>
          <span>/</span>
          {breadcrumbCat && (
            <>
              <Link to={`/category/${breadcrumbCat.slug}`} className="hover:text-[#c45500] hover:underline">{breadcrumbCat.name}</Link>
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
