import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useCategories } from '../../hooks/useCategories';

export default function Navbar() {
  const { customer, logout } = useAuthStore();
  const totalItems = useCartStore(s => s.totalItems());
  const { data: categories } = useCategories();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const topLevelCategories = categories?.filter(c => !c.parent_id) ?? [];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">ShopNow</span>
          </Link>

          {/* Category nav - desktop */}
          <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
            <div className="relative" ref={catDropdownRef}>
              <button
                onClick={() => setCatDropdownOpen(v => !v)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Categories
                <svg className={`w-4 h-4 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {catDropdownOpen && topLevelCategories.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {topLevelCategories.map(cat => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setCatDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/category/all"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              All Products
            </Link>
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 hidden sm:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button type="submit" className="sr-only">Search</button>
            </div>
          </form>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* B2B Badge */}
            {customer?.customer_type === 'b2b' && (
              <Link
                to="/b2b"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full hover:bg-blue-200 transition-colors"
              >
                B2B
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Auth */}
            {customer ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(v => !v)}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 text-xs font-bold">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-24 truncate">{customer.name}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Orders
                    </Link>
                    {customer.customer_type === 'b2b' && (
                      <Link
                        to="/b2b"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        B2B Dashboard
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-xl"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {topLevelCategories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              to="/category/all"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              All Products
            </Link>
            {customer ? (
              <>
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  My Orders
                </Link>
                {customer.customer_type === 'b2b' && (
                  <Link to="/b2b" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    B2B Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
