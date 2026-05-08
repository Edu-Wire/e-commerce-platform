import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HomePage() {
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: featuredData, isLoading: featuredLoading } = useProducts({ is_featured: true, limit: 8 });
  const { data: newArrivalsData, isLoading: newLoading } = useProducts({ sort: 'newest', limit: 8 });
  const { data: dealsData, isLoading: dealsLoading } = useProducts({ sort: 'discount_desc', limit: 8 });

  const topCategories = categories?.filter(c => !c.parent_id).slice(0, 8) ?? [];

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="text-primary-200 text-sm font-semibold uppercase tracking-widest mb-4">
              Welcome to ShopNow
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Discover
              <span className="block text-accent-500">Amazing Deals</span>
            </h1>
            <p className="text-primary-100 text-lg mb-8 leading-relaxed">
              Shop quality products — new, outlet, and refurbished — at prices that won't break the bank. Thousands of items. Unbeatable value.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/category/all"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                Shop Now
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/b2b"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/30 transition-all duration-200 text-lg"
              >
                B2B Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🚚', title: 'Free Shipping', sub: 'Orders above ₹999' },
              { icon: '↩️', title: 'Easy Returns', sub: '30-day return policy' },
              { icon: '🔒', title: 'Secure Payment', sub: '100% protected' },
              { icon: '🏅', title: 'Quality Assured', sub: 'All products verified' }
            ].map((badge) => (
              <div key={badge.title} className="flex items-center gap-3 p-3">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{badge.title}</p>
                  <p className="text-xs text-gray-500">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 text-sm mt-1">Browse our curated collections</p>
          </div>
          <Link to="/category/all" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All &rarr;
          </Link>
        </div>
        {catsLoading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {topCategories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-6 text-center hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 object-cover rounded-xl mx-auto mb-3" />
                ) : (
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-100 transition-colors">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">{cat.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked for you</p>
            </div>
            <Link to="/category/all?is_featured=true" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All &rarr;
            </Link>
          </div>
          {featuredLoading ? (
            <LoadingSpinner className="py-12" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featuredData?.data.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
              {!featuredData?.data.length && (
                <p className="col-span-full text-center text-gray-400 py-8">No featured products yet.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <p className="text-gray-500 text-sm mt-1">Just landed in store</p>
          </div>
          <Link to="/category/all?sort=newest" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All &rarr;
          </Link>
        </div>
        {newLoading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {newArrivalsData?.data.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Deals */}
      <section className="bg-gradient-to-r from-red-50 to-orange-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔥</span>
                <h2 className="text-2xl font-bold text-gray-900">Hot Deals</h2>
              </div>
              <p className="text-gray-500 text-sm">Biggest discounts right now</p>
            </div>
            <Link to="/category/all?sort=discount_desc" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All &rarr;
            </Link>
          </div>
          {dealsLoading ? (
            <LoadingSpinner className="py-12" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {dealsData?.data.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* B2B Banner */}
      <section className="bg-primary-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Are You a Business Buyer?</h2>
          <p className="text-primary-200 text-lg mb-6 max-w-2xl mx-auto">
            Get exclusive B2B pricing, bulk order discounts, and a dedicated account manager. Register as a B2B customer today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-2xl shadow-lg transition-all duration-200"
          >
            Register as B2B Customer
          </Link>
        </div>
      </section>
    </div>
  );
}
