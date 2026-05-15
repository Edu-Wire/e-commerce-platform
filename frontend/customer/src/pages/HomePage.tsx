import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HomePage() {
  const [saleCategory, setSaleCategory] = useState<string | undefined>(undefined);
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
      {/* Sale Banner (Amazon Style) */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#ff4d00] via-[#ff7c00] to-[#ffaa00] py-6 sm:py-10">
        <div className="max-w-[1500px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Content */}
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-block px-3 py-1 bg-black/10 text-white text-xs font-bold rounded-sm mb-4 uppercase tracking-wider">
              Great Summer Sale is live
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 drop-shadow-sm leading-tight">
              Great Summer Sale <br />
              <span className="text-white/90">is live</span>
            </h1>

            {/* Cashback Badge */}
            <div className="inline-flex items-center gap-2 bg-[#fdf200] px-6 py-2 rounded-sm shadow-sm transform -rotate-1 mb-6">
              <span className="text-[#cc0000] font-bold text-sm sm:text-base">Get ₹150 cashback* on orders above ₹2500</span>
            </div>

            {/* Bank Offer */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-white px-4 py-2 rounded shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-[#004c8f] text-white flex items-center justify-center font-bold text-[10px] italic">HDFC</div>
                <div className="text-[11px] text-gray-800">
                  <span className="font-bold block">10% Instant Discount*</span>
                  <span>up to ₹9,500 off</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content / Brand Partners */}
          <div className="flex flex-col items-center md:items-end gap-6 z-10">
            <div className="flex items-center gap-8 text-white/90">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold mb-1 opacity-80">Powered by</p>
                <p className="text-xl font-black italic">SAMSUNG Galaxy</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold mb-1 opacity-80">Co-Powered by</p>
                <p className="text-xl font-black italic">intel core</p>
              </div>
            </div>

            {/* Prime Section */}
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
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none">
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 100 100">
            <path d="M100 0 L100 100 L0 100 Z" />
          </svg>
        </div>
        <div className="absolute top-0 left-0 p-4 opacity-30 pointer-events-none">
          <span className="text-8xl">🌿</span>
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
