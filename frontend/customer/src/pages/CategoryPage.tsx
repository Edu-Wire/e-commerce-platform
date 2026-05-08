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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
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
    limit: 12
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

    // Sync to URL params
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
    { value: '', label: 'Relevance' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'discount_desc', label: 'Highest Discount' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        {breadcrumbCat && (
          <>
            <Link to={`/category/${breadcrumbCat.slug}`} className="hover:text-primary-600">{breadcrumbCat.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-medium">
          {slug === 'all' ? 'All Products' : (currentCategory?.name ?? slug)}
        </span>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {slug === 'all' ? 'All Products' : (currentCategory?.name ?? 'Products')}
        </h1>
        {currentCategory?.description && (
          <p className="text-gray-500 mt-1">{currentCategory.description}</p>
        )}
        {data?.meta && (
          <p className="text-gray-400 text-sm mt-1">{data.meta.total} products found</p>
        )}
      </div>

      {/* Search filter active banner */}
      {filters.search && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-primary-700">
            Showing results for: <strong>"{filters.search}"</strong>
          </span>
          <button
            onClick={() => updateFilters({ search: undefined })}
            className="text-primary-500 hover:text-primary-700 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {subcategories.map(sub => (
            <Link
              key={sub.id}
              to={`/category/${sub.slug}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile filter toggle + sort bar */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4 lg:hidden">
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 6a1 1 0 011-1h10a1 1 0 010 2H7a1 1 0 01-1-1zm3 6a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
          </svg>
          Filters
        </button>
        <select
          value={filters.sort ?? ''}
          onChange={e => updateFilters({ sort: e.target.value || undefined })}
          className="text-sm border-0 focus:outline-none text-gray-700 font-medium"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="lg:hidden mb-4">
          <FilterSidebar filters={filters} onFilterChange={updateFilters} />
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar filters={filters} onFilterChange={updateFilters} />
        </div>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {/* Desktop sort bar */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {data?.meta?.total ?? 0} products
              {data?.meta && ` · Page ${data.meta.page} of ${data.meta.total_pages}`}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={filters.sort ?? ''}
                onChange={e => updateFilters({ sort: e.target.value || undefined })}
                className="text-sm rounded-lg border border-gray-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="bg-red-50 text-red-600 rounded-xl p-6 text-center">
              Failed to load products. Please try again.
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : !data?.data.length ? (
            <EmptyState
              icon="🛒"
              title="No products found"
              description="Try adjusting your filters or search term."
              action={
                <button
                  onClick={() => updateFilters({ condition: undefined, brand: undefined, min_price: undefined, max_price: undefined, search: undefined })}
                  className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700"
                >
                  Clear Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.data.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {data.meta && (
                <Pagination
                  page={data.meta.page}
                  total_pages={data.meta.total_pages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
