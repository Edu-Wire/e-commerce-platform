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
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
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
    <header className="bg-[#131921] text-white sticky top-0 z-50 shadow-sm font-sans">
      {/* Top Bar */}
      <div className="max-w-[1500px] mx-auto px-4 py-1 flex items-center gap-2">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          className="lg:hidden p-2 text-white hover:bg-gray-800 rounded-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center p-2 border border-transparent hover:border-white rounded-sm transition-all flex-shrink-0"
        >
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-1.5">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div className="flex items-start">
            <span className="text-xl font-bold tracking-tight leading-none">ShopNow</span>
            <span className="text-orange-400 text-[10px] font-bold leading-none ml-0.5 mt-1">.in</span>
          </div>
        </Link>

        {/* Delivery Location */}
        <div className="hidden md:flex flex-col p-2 border border-transparent hover:border-white rounded-sm cursor-pointer transition-all ml-2">
          <span className="text-[11px] text-gray-300 ml-4 leading-none">Delivering to {customer?.address?.city || 'Bhopal 462010'}</span>
          <div className="flex items-center gap-1 leading-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-bold">Update location</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex items-center h-10 ml-2">
          <form onSubmit={handleSearch} className="w-full flex h-full group">
            <div className="relative flex w-full h-full bg-white rounded-md overflow-hidden ring-offset-0 focus-within:ring-2 focus-within:ring-[#febd69]">
              {/* Category Dropdown (Simplified) */}
              <button
                type="button"
                className="hidden lg:flex items-center gap-1 px-3 bg-gray-100 text-gray-600 text-xs border-r border-gray-300 hover:bg-gray-200 transition-colors"
              >
                All
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ShopNow.in"
                className="flex-1 px-3 py-2 text-black text-sm focus:outline-none placeholder-gray-500"
              />

              <button
                type="submit"
                className="px-4 bg-[#febd69] hover:bg-[#f3a847] text-[#131921] transition-colors"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-0.5 ml-2">
          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <div
              onClick={() => setLangDropdownOpen(v => !v)}
              className="hidden lg:flex items-center p-2 border border-transparent hover:border-white rounded-sm cursor-pointer transition-all gap-1"
            >
              <div className="flex flex-col gap-0.5 shadow-sm border border-gray-700/10">
                <div className="w-5 h-1 bg-orange-400"></div>
                <div className="w-5 h-1 bg-white flex items-center justify-center"><div className="w-1 h-1 bg-blue-900 rounded-full"></div></div>
                <div className="w-5 h-1 bg-green-600"></div>
              </div>
              <span className="text-sm font-bold uppercase ml-0.5">EN</span>
              <svg className="w-3 h-3 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {langDropdownOpen && (
              <div className="absolute top-full left-0 mt-0 w-60 bg-white text-gray-900 shadow-xl border border-gray-200 py-3 z-50 rounded-b-sm">
                <div className="absolute top-0 left-4 -mt-1.5 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-200"></div>
                <div className="px-4 py-1">
                  <p className="text-xs font-semibold text-gray-600 mb-3">Change Language</p>
                  <div className="space-y-3">
                    {[
                      { id: 'en', label: 'English - EN', active: true },
                      { id: 'hi', label: 'हिन्दी - HI' },
                      { id: 'ta', label: 'தமிழ் - TA' },
                      { id: 'te', label: 'తెలుగు - TE' },
                      { id: 'kn', label: 'ಕನ್ನಡ - KN' },
                      { id: 'ml', label: 'മലയാളം - ML' },
                      { id: 'bn', label: 'বাংলা - BN' },
                      { id: 'mr', label: 'मराठी - MR' },
                    ].map(lang => (
                      <label key={lang.id} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="lang" checked={lang.active} className="w-4 h-4 accent-orange-600" readOnly />
                        <span className="text-xs text-gray-700 group-hover:text-orange-600 group-hover:underline">{lang.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <hr className="my-3 border-gray-100" />
                <div className="px-4">
                  <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="w-4 h-0.5 bg-orange-400"></div>
                      <div className="w-4 h-0.5 bg-white"></div>
                      <div className="w-4 h-0.5 bg-green-600"></div>
                    </div>
                    You are shopping on ShopNow.in
                  </div>
                  <Link to="#" className="text-xs text-blue-700 hover:text-orange-600 hover:underline">Change country/region</Link>
                </div>
              </div>
            )}
          </div>

          {/* Account & Lists */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(v => !v)}
              className="flex flex-col p-2 border border-transparent hover:border-white rounded-sm transition-all text-left min-w-[120px]"
            >
              <span className="text-[11px] text-gray-300 leading-none">Hello, {customer ? customer.name.split(' ')[0] : 'sign in'}</span>
              <div className="flex items-center gap-1 leading-none mt-1">
                <span className="text-sm font-bold">Account & Lists</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {userDropdownOpen && (
              <div className="absolute top-full right-0 mt-0 w-64 bg-white text-gray-900 shadow-xl border border-gray-200 py-4 z-50 rounded-b-sm">
                <div className="px-4 mb-4">
                  {!customer && (
                    <div className="text-center">
                      <Link to="/login" className="block w-full py-1.5 bg-gradient-to-b from-[#f8e3ad] to-[#eeb933] border border-[#a88734] rounded shadow-sm text-sm font-medium hover:from-[#f3d078] hover:to-[#d4a216]">
                        Sign in
                      </Link>
                      <p className="text-[11px] mt-2 text-gray-600">
                        New customer? <Link to="/register" className="text-blue-700 hover:text-orange-600 hover:underline">Start here.</Link>
                      </p>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 flex p-4 gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-2">Your Lists</h3>
                    <div className="space-y-1">
                      <Link to="#" className="block text-xs text-gray-600 hover:text-orange-600 hover:underline">Create a Wish List</Link>
                      <Link to="#" className="block text-xs text-gray-600 hover:text-orange-600 hover:underline">Find a Wish List</Link>
                    </div>
                  </div>
                  <div className="flex-1 border-l border-gray-100 pl-4">
                    <h3 className="text-sm font-bold mb-2">Your Account</h3>
                    <div className="space-y-1">
                      <Link to="/orders" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-orange-600 hover:underline">Your Orders</Link>
                      <Link to="#" className="block text-xs text-gray-600 hover:text-orange-600 hover:underline">Your Profile</Link>
                      {customer?.customer_type === 'b2b' && (
                        <Link to="/b2b" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-orange-600 hover:underline">B2B Dashboard</Link>
                      )}
                      {customer && (
                        <button onClick={handleLogout} className="block w-full text-left text-xs text-red-600 hover:underline mt-2">Sign Out</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Returns & Orders */}
          <Link to="/orders" className="hidden sm:flex flex-col p-2 border border-transparent hover:border-white rounded-sm transition-all text-left">
            <span className="text-[11px] text-gray-300 leading-none">Returns</span>
            <span className="text-sm font-bold leading-none mt-1">& Orders</span>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="flex items-end p-2 border border-transparent hover:border-white rounded-sm transition-all relative group">
            <div className="relative flex items-center">
              <div className="relative">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[#f08804] font-bold text-base leading-none">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm font-bold self-end mb-1.5 hidden lg:inline">Cart</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Nav Bar (Secondary) */}
      <div className="bg-[#232f3e] text-white flex items-center px-4 py-1.5 gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-1 px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm font-bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          All
        </button>
        {topLevelCategories.slice(0, 8).map(cat => (
          <Link
            key={cat.id}
            to={`/category/${cat.slug}`}
            className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm"
          >
            {cat.name}
          </Link>
        ))}
        <Link to="/category/all" className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm">
          All Products
        </Link>
        <Link to="#" className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm hidden md:inline">
          Customer Service
        </Link>
        <Link to="#" className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm hidden lg:inline">
          Today's Deals
        </Link>
      </div>

      {/* Global Sidebar Menu (Amazon HM Menu Style) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 transition-opacity" onClick={() => setMobileMenuOpen(false)}>
             {/* Close button for Desktop UX */}
             <button className="absolute top-4 left-[380px] text-white hover:scale-110 transition-transform">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>

          {/* Content */}
          <div className="absolute inset-y-0 left-0 w-[365px] bg-white animate-slide-in shadow-2xl flex flex-col">
            <div className="bg-[#232f3e] text-white p-4 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-bold">Hello, {customer ? customer.name.split(' ')[0] : 'Sign In'}</span>
              <button className="ml-auto md:hidden" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pb-20">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-tight">Trending</h3>
                <div className="space-y-4">
                  <Link to="/category/all" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-2">Best Sellers</Link>
                  <Link to="/category/all?sort=newest" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-2">New Arrivals</Link>
                  <Link to="/category/all" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 font-bold hover:bg-gray-100 -mx-4 px-4 py-2">All Products</Link>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-tight">Shop By Category</h3>
                <div className="space-y-1">
                  {topLevelCategories.map(cat => (
                    <Link 
                      key={cat.id} 
                      to={`/category/${cat.slug}`} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm text-gray-700 flex justify-between items-center hover:bg-gray-100 -mx-4 px-4 py-3 group"
                    >
                      {cat.name}
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-tight">Help & Settings</h3>
                <div className="space-y-1">
                  <Link to="#" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3">Your Account</Link>
                  {customer ? (
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3">Sign Out</button>
                  ) : (
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3">Sign In</Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
