import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ui/ProductCard';
import FilterSidebar from '../components/filters/FilterSidebar';
import Pagination from '../components/ui/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import type { ProductFilters } from '../types';

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

  const { data: categories } = useCategories();

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

  const sortOptions = [
    { value: '', label: 'Featured' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'discount_desc', label: 'Highest Discount' }
  ];

  return (
    <div className="bg-[#f7f8f8] min-h-screen overflow-x-hidden">
      {/* Search Header Bar (Amazon Style Results Info) */}
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
          <>
            <div className="mb-8 relative rounded-lg overflow-hidden group shadow-lg">
              <img 
                src="/summer_sale_banner.png" 
                alt="Great Summer Sale" 
                className="w-full h-[250px] md:h-[400px] object-cover"
              />
            </div>

            {/* Scrolling Brands Carousel - Full Width Text Based */}
            <div className="mb-12 bg-white py-8 border-y border-gray-200 overflow-hidden w-screen relative left-1/2 -translate-x-1/2">
              <div className="flex animate-scroll whitespace-nowrap">
                {/* First set of brands */}
                <div className="flex items-center flex-shrink-0">
                  <span className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">SAMSUNG</span>
                  <span className="text-2xl font-black text-[#232f3e] mx-10 tracking-tighter">APPLE</span>
                  <span className="text-2xl font-black text-[#37475a] mx-10 tracking-tighter">LG</span>
                  <span className="text-2xl font-black text-[#c45500] mx-10 tracking-tighter">SONY</span>
                  <span className="text-2xl font-black text-[#007185] mx-10 tracking-tighter">XIAOMI</span>
                  <span className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">HP</span>
                  <span className="text-2xl font-black text-[#232f3e] mx-10 tracking-tighter">DELL</span>
                  <span className="text-2xl font-black text-[#37475a] mx-10 tracking-tighter">ACER</span>
                  <span className="text-2xl font-black text-[#c45500] mx-10 tracking-tighter">ASUS</span>
                  <span className="text-2xl font-black text-[#007185] mx-10 tracking-tighter">BOSE</span>
                  <span className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">LOGITECH</span>
                </div>
                {/* Second identical set for seamless loop */}
                <div className="flex items-center flex-shrink-0">
                  <span className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">SAMSUNG</span>
                  <span className="text-2xl font-black text-[#232f3e] mx-10 tracking-tighter">APPLE</span>
                  <span className="text-2xl font-black text-[#37475a] mx-10 tracking-tighter">LG</span>
                  <span className="text-2xl font-black text-[#c45500] mx-10 tracking-tighter">SONY</span>
                  <span className="text-2xl font-black text-[#007185] mx-10 tracking-tighter">XIAOMI</span>
                  <span className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">HP</span>
                  <span className="text-2xl font-black text-[#232f3e] mx-10 tracking-tighter">DELL</span>
                  <span className="text-2xl font-black text-[#37475a] mx-10 tracking-tighter">ACER</span>
                  <span className="text-2xl font-black text-[#c45500] mx-10 tracking-tighter">ASUS</span>
                  <span className="text-2xl font-black text-[#007185] mx-10 tracking-tighter">BOSE</span>
                  <span className="text-2xl font-black text-[#0f1111] mx-10 tracking-tighter">LOGITECH</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Top Brands / Subcategories Section */}
        {subcategories.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[18px] font-bold text-[#0f1111] mb-6">Shop by {currentCategory?.name || 'Category'}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {subcategories.map(sub => (
                <Link
                  key={sub.id}
                  to={`/category/${sub.slug}`}
                  className="flex flex-col items-center gap-3 min-w-[130px] p-5 bg-white rounded-xl border border-gray-100 hover:border-[#e77600] hover:shadow-xl transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-[#f0f2f2] flex items-center justify-center text-2xl group-hover:bg-[#fff9f2] transition-colors shadow-inner">
                    📦
                  </div>
                  <span className="text-[13px] font-bold text-[#0f1111] text-center group-hover:text-[#c45500]">{sub.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit sticky top-[72px] shadow-sm">
              <h3 className="text-[14px] font-bold text-[#0f1111] mb-5 uppercase tracking-wider border-b border-gray-100 pb-2">Filters</h3>
              <FilterSidebar filters={filters} onFilterChange={updateFilters} />
            </div>
          </div>

          {/* Main Results Column */}
          <div className="flex-1 min-w-0">
            {/* Active Filters Chips */}
            {(filters.search || filters.brand || filters.condition) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.search && (
                  <div className="bg-white border border-gray-300 rounded-md px-3 py-1 flex items-center gap-2 text-xs shadow-sm">
                    <span className="text-gray-500">Search:</span>
                    <span className="font-bold text-[#0f1111]">{filters.search}</span>
                    <button onClick={() => updateFilters({ search: undefined })} className="text-gray-400 hover:text-red-500">×</button>
                  </div>
                )}
                {filters.brand && (
                  <div className="bg-white border border-gray-300 rounded-md px-3 py-1 flex items-center gap-2 text-xs shadow-sm">
                    <span className="text-gray-500">Brand:</span>
                    <span className="font-bold text-[#0f1111]">{filters.brand}</span>
                    <button onClick={() => updateFilters({ brand: undefined })} className="text-gray-400 hover:text-red-500">×</button>
                  </div>
                )}
              </div>
            )}

            {error ? (
              <div className="bg-red-50 text-red-600 rounded-xl p-8 text-center border border-red-100 font-medium shadow-sm">
                Failed to load products. Please try again.
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : !data?.data.length ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm">
                <EmptyState
                  icon="🔎"
                  title="No results found"
                  description={`We couldn't find any products matching "${filters.search || 'your selection'}".`}
                  action={
                    <button
                      onClick={() => updateFilters({ condition: undefined, brand: undefined, min_price: undefined, max_price: undefined, search: undefined })}
                      className="mt-6 px-10 py-3 bg-[#ffd814] hover:bg-[#f7ca00] text-black font-bold rounded-full transition-all shadow-md active:scale-95"
                    >
                      Clear All Filters
                    </button>
                  }
                />
              </div>
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
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 5s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
