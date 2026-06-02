import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';
import { useCategories } from '../../hooks/useCategories';
import { useLanguageStore, translations, Language } from '../../store/languageStore';

export default function Navbar() {
  const { customer, logout, updateProfile } = useAuthStore();
  const totalItems = useCartStore(s => s.totalItems());
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language] || translations['EN'];
  const { data: categories } = useCategories();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Voice Search states & controls
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'HI' ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening...', { icon: '🎙️', id: 'voice-search' });
    };

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      toast.success(`Search for: "${transcript}"`, { id: 'voice-search' });
      const slug = selectedCategorySlug || 'all';
      navigate(`/category/${slug}?search=${encodeURIComponent(transcript.trim())}`);
      
      const updatedHistory = [transcript, ...searchHistory.filter(h => h !== transcript)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setShowSearchHistory(false);
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e);
      toast.error('Could not hear clearly, please try again.', { id: 'voice-search' });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const timer = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(`${(import.meta as any).env.VITE_API_URL || ''}/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
          const json = await res.json();
          if (json.success) {
            setSuggestions(json.data);
          }
        } catch (err) {
          console.error('Failed to fetch suggestions:', err);
        } finally {
          setIsSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);
  const [newLocation, setNewLocation] = useState('');
  const [guestLocation, setGuestLocation] = useState<{ city: string; pincode: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('guestLocation');
    if (saved) {
      setGuestLocation(JSON.parse(saved));
    }
  }, []);
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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchHistory(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      const slug = selectedCategorySlug || 'all';
      navigate(`/category/${slug}?search=${encodeURIComponent(query)}`);

      const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));

      setSearchQuery('');
      setShowSearchHistory(false);
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
      <div className="max-w-[1500px] mx-auto px-2 sm:px-4 py-1 flex flex-wrap items-center justify-between lg:justify-start gap-y-1">

        {/* Left Section: Toggle & Logo */}
        <div className="flex items-center gap-1 order-1">
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="lg:hidden p-1.5 text-white hover:bg-gray-800 rounded-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link
            to="/"
            className="flex items-center p-1 sm:p-2 border border-transparent hover:border-white rounded-sm transition-all flex-shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-1 sm:mr-1.5">
              <span className="text-white font-bold text-base sm:text-lg">S</span>
            </div>
            <div className="flex items-start">
              <span className="text-lg sm:text-xl font-bold tracking-tight leading-none">ShopNow</span>
              <span className="text-orange-400 text-[9px] sm:text-[10px] font-bold leading-none ml-0.5 mt-1">.in</span>
            </div>
          </Link>
        </div>

        {/* Delivery Location - Desktop Only */}
        <div
          onClick={() => setShowLocationModal(true)}
          className="hidden lg:flex flex-col p-2 border border-transparent hover:border-white rounded-sm cursor-pointer transition-all ml-2 order-2"
        >
          <span className="text-[11px] text-gray-300 ml-4 leading-none whitespace-nowrap">
            {customer ? `${t.deliverTo || 'Deliver to'} ${customer.name.split(' ')[0]}` : t.deliverTo || 'Deliver to'}
          </span>
          <div className="flex items-center gap-1 leading-none">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-bold truncate max-w-[150px]">
              {customer?.address?.city || guestLocation?.city || 'Bhopal'} {customer?.address?.pincode || guestLocation?.pincode || '462010'}
            </span>
          </div>
        </div>

        {/* Search Bar - Full width on mobile, Flex-1 on desktop */}
        <div className="w-full lg:flex-1 h-10 lg:mx-4 order-4 lg:order-3">
          <form onSubmit={handleSearch} className="w-full flex h-full group">
            <div ref={searchRef} className="relative flex w-full h-full bg-white rounded-md ring-offset-0 focus-within:ring-2 focus-within:ring-[#febd69]">
              {/* Category Dropdown - Hidden on very small screens */}
              <div ref={categoryDropdownRef} className="relative hidden sm:block h-full">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowSearchHistory(false);
                  }}
                  className="flex items-center gap-1 h-full px-3 bg-gray-100 text-gray-600 text-xs border-r border-gray-300 hover:bg-gray-200 transition-colors rounded-l-md"
                >
                  <span className="truncate max-w-[80px]">{selectedCategory}</span>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 w-52 bg-white shadow-lg border border-gray-200 mt-1 rounded-md z-50 max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedCategorySlug('');
                        setShowCategoryDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-black hover:bg-gray-100 cursor-pointer"
                    >
                      All Categories
                    </div>
                    {categories?.map((cat: any) => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setSelectedCategorySlug(cat.slug);
                          setShowCategoryDropdown(false);
                        }}
                        className="px-4 py-2 text-sm text-black hover:bg-gray-100 cursor-pointer"
                      >
                        {cat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setShowSearchHistory(true);
                  setShowCategoryDropdown(false);
                }}
                placeholder={t.searchPlaceholder || "Search ShopNow.in"}
                className="flex-1 px-3 py-2 text-black text-sm focus:outline-none placeholder-gray-500 rounded-l-md sm:rounded-l-none"
              />

              <button
                type="button"
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                className={`px-3 flex items-center justify-center transition-all ${
                  isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-[#f3a847]'
                }`}
                title="Search by voice"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <button
                type="submit"
                className="px-4 bg-[#febd69] hover:bg-[#f3a847] text-[#131921] transition-colors rounded-r-md"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Search History & Suggestions Dropdown */}
              {showSearchHistory && (searchQuery.trim().length > 1 ? suggestions.length > 0 : searchHistory.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-xl border border-gray-200 mt-1 rounded-md z-[60]">
                  {searchQuery.trim().length > 1 ? (
                    <>
                      <div className="p-2 text-xs text-gray-500 border-b border-gray-100">Suggestions</div>
                      {suggestions.map((product, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchQuery(product.name);
                            navigate(`/category/all?search=${encodeURIComponent(product.name)}`);
                            setShowSearchHistory(false);
                          }}
                          className="px-3 py-2 text-sm text-black hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="truncate flex-1">{product.name}</span>
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{product.category_name}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="p-2 text-xs text-gray-500 border-b border-gray-100">Recent Searches</div>
                      {searchHistory.map((query, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchQuery(query);
                            navigate(`/category/all?search=${encodeURIComponent(query)}`);
                            setShowSearchHistory(false);
                          }}
                          className="px-3 py-2 text-sm text-black hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {query}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedHistory = searchHistory.filter(h => h !== query);
                              setSearchHistory(updatedHistory);
                              localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
                            }}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-0 sm:gap-1 order-3 lg:order-4">
          {/* Language Selector - Desktop Only */}
          <div className="relative hidden lg:block" ref={langDropdownRef}>
            <div
              onClick={() => setLangDropdownOpen(v => !v)}
              className="flex items-center p-2 border border-transparent hover:border-white rounded-sm cursor-pointer transition-all gap-1"
            >
              <div className="flex flex-col shadow-sm border border-gray-300 overflow-hidden rounded-sm">
                <div className="w-6 h-1.5 bg-[#FF9933]"></div>
                <div className="w-6 h-1.5 bg-white flex items-center justify-center"><div className="w-1 h-1 bg-[#000080] rounded-full"></div></div>
                <div className="w-6 h-1.5 bg-[#138808]"></div>
              </div>
              <span className="text-sm font-bold uppercase ml-0.5">{language}</span>
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
                      { id: 'EN', label: 'English - EN' },
                      { id: 'HI', label: 'हिन्दी - HI' },
                      { id: 'TA', label: 'தமிழ் - TA' },
                      { id: 'TE', label: 'తెలుగు - TE' },
                      { id: 'KN', label: 'ಕನ್ನಡ - KN' },
                      { id: 'ML', label: 'മലയാളം - ML' },
                      { id: 'BN', label: 'বাংলা - BN' },
                      { id: 'MR', label: 'मराठी - MR' },
                    ].map(lang => (
                      <label key={lang.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="lang"
                          checked={language === lang.id}
                          onChange={() => {
                            setLanguage(lang.id as Language);
                            setLangDropdownOpen(false);
                          }}
                          className="w-4 h-4 accent-orange-600"
                        />
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
              className="flex flex-col p-1.5 sm:p-2 border border-transparent hover:border-white rounded-sm transition-all text-left min-w-0 lg:min-w-[120px]"
            >
              <span className="hidden lg:inline text-[11px] text-gray-300 leading-none">{t.hello || 'Hello'}, {customer ? customer.name.split(' ')[0] : 'sign in'}</span>
              <div className="flex items-center gap-0.5 lg:gap-1 leading-none lg:mt-1">
                <span className="hidden lg:inline text-sm font-bold">{t.accountsLists || 'Account & Lists'}</span>
                {/* User Icon/Label for Mobile */}
                <div className="lg:hidden flex flex-col items-center">
                  <span className="text-[10px] text-gray-300 mb-0.5 truncate max-w-[50px]">{customer ? customer.name.split(' ')[0] : 'Sign In'}</span>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <svg className="hidden lg:block w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {userDropdownOpen && (
              <div className="absolute top-full right-0 mt-0 w-64 bg-white text-gray-900 shadow-2xl border border-gray-200 py-4 z-[70] rounded-b-sm animate-in fade-in slide-in-from-top-2 duration-200">
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
                      <Link to="/account" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-orange-600 hover:underline">Your Account</Link>
                      <Link to="/orders" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-orange-600 hover:underline">Your Orders</Link>
                      <Link to="/rewards" onClick={() => setUserDropdownOpen(false)} className="block text-xs font-bold text-indigo-600 hover:text-orange-600 hover:underline">💎 Rewards Club</Link>
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

          {/* Returns & Orders - Hidden on small screens */}
          <Link to="/orders" className="hidden sm:flex flex-col p-2 border border-transparent hover:border-white rounded-sm transition-all text-left">
            <span className="text-[11px] text-gray-300 leading-none">{t.returns || 'Returns'}</span>
            <span className="text-sm font-bold leading-none mt-1">{t.orders || '& Orders'}</span>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="flex items-center lg:items-end p-1.5 sm:p-2 border border-transparent hover:border-white rounded-sm transition-all relative group">
            <div className="relative flex items-center">
              <div className="relative">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute top-0 sm:top-0.5 left-1/2 -translate-x-1/2 text-[#f08804] font-bold text-sm sm:text-base leading-none">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm font-bold self-end mb-1.5 hidden lg:inline ml-1">{t.cart || 'Cart'}</span>
            </div>
          </Link>
        </div>

        {/* Mobile Location Bar */}
        <div
          onClick={() => setShowLocationModal(true)}
          className="lg:hidden w-full bg-[#37475a] -mx-2 sm:-mx-4 px-4 py-2 flex items-center gap-1.5 order-5 cursor-pointer shadow-inner"
        >
          <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-sm font-medium text-white truncate flex-1">
            {t.deliverTo || 'Deliver to'} {customer?.address?.city || guestLocation?.city || 'Bhopal'} {customer?.address?.pincode || guestLocation?.pincode || '462010'}
          </span>
          <svg className="w-3 h-3 text-white ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Bottom Nav Bar (Secondary) */}
      <div className="bg-[#232f3e] text-white flex items-center px-4 py-1.5 gap-4 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-1 px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm font-bold flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          All
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-[#f3a847] hover:from-orange-600 hover:to-[#eeb933] text-[#131921] rounded-full transition-all text-xs font-black flex-shrink-0 shadow-md border border-orange-400 active:scale-95 group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <svg className="w-4 h-4 text-black group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          ShopNow AI
        </button>
        {topLevelCategories.slice(0, 8).map(cat => (
          <Link
            key={cat.id}
            to={`/category/${cat.slug}`}
            className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm flex-shrink-0"
          >
            {cat.name}
          </Link>
        ))}
        <Link to="/category/all" className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm flex-shrink-0">
          All Products
        </Link>
        <Link to="#" className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm hidden md:inline flex-shrink-0">
          Customer Service
        </Link>
        <Link to="/category/todays-deals" className="px-2 py-1 border border-transparent hover:border-white rounded-sm transition-all text-sm hidden lg:inline flex-shrink-0">
          Today's Deals
        </Link>
      </div>

      {/* Global Sidebar Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 transition-opacity animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar Content */}
          <div className="relative w-[280px] sm:w-[365px] bg-white shadow-2xl flex flex-col animate-slide-in h-full">
            <div className="bg-[#232f3e] text-white p-4 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-bold">Hello, {customer ? customer.name.split(' ')[0] : 'Sign In'}</span>
              <button className="ml-auto p-1 hover:bg-white/10 rounded-full" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pb-10">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Trending</h3>
                <div className="space-y-1">
                  <Link to="/category/all" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3">Best Sellers</Link>
                  <Link to="/category/all?sort=newest" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3">New Arrivals</Link>
                  <Link to="/category/all" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-800 font-bold hover:bg-gray-100 -mx-4 px-4 py-3">All Products</Link>
                </div>
              </div>

              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Shop By Category</h3>
                <div className="space-y-1">
                  {topLevelCategories.map(cat => (
                    <div key={cat.id}>
                      <div
                        onClick={() => {
                          if (cat.children && cat.children.length > 0) {
                            setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
                          } else {
                            navigate(`/category/${cat.slug}`);
                            setMobileMenuOpen(false);
                          }
                        }}
                        className="block text-sm text-gray-700 flex justify-between items-center hover:bg-gray-100 -mx-4 px-4 py-3 group cursor-pointer"
                      >
                        {cat.name}
                        {cat.children && cat.children.length > 0 && (
                          <svg
                            className={`w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-transform ${expandedCategory === cat.id ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>

                      {expandedCategory === cat.id && cat.children && cat.children.length > 0 && (
                        <div className="bg-gray-50 -mx-4 py-1 animate-in slide-in-from-top-2 duration-200">
                          <Link
                            to={`/category/${cat.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-sm text-gray-800 font-bold hover:bg-gray-100 pl-8 pr-4 py-2.5 transition-colors border-b border-gray-100"
                          >
                            All {cat.name}
                          </Link>
                          {cat.children.map(sub => (
                            <Link
                              key={sub.id}
                              to={`/category/${sub.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-sm text-gray-600 hover:bg-gray-100 pl-8 pr-4 py-2.5 transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Help & Settings</h3>
                <div className="space-y-1">
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3">Your Account</Link>
                  <Link
                    to="/rewards"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3 flex items-center gap-2 group"
                  >
                    {/* <span className="text-indigo-600">💎</span> */}
                    <span className="font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">E-COM Rewards Club</span>
                  </Link>
                  <Link to="/customer-service" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-700 hover:bg-gray-100 -mx-4 px-4 py-3">Customer Service</Link>
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

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLocationModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Choose your location</h2>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Select a delivery location to see product availability and delivery options</p>

              {/* Address List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {(customer?.address as any)?.addresses?.map((addr: any, index: number) => (
                  <div
                    key={index}
                    onClick={async () => {
                      const locationData = { city: addr.city, pincode: addr.pincode };
                      localStorage.setItem('guestLocation', JSON.stringify(locationData));
                      setGuestLocation(locationData);

                      try {
                        await updateProfile({
                          address: {
                            ...customer?.address,
                            city: addr.city,
                            pincode: addr.pincode
                          }
                        });
                        setShowLocationModal(false);
                        toast.success('Location updated!');
                      } catch (err) {
                        toast.error('Failed to update location');
                      }
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${customer?.address?.pincode === addr.pincode
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex flex-col text-sm">
                      <span className="font-bold text-black">{addr.name} <span className="font-normal text-gray-600">{addr.details}</span></span>
                      <span className="text-gray-600">{addr.city} {addr.state} {addr.pincode}</span>
                      {customer?.address?.pincode === addr.pincode && (
                        <span className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Default address
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {(!(customer?.address as any)?.addresses || (customer?.address as any)?.addresses.length === 0) && (
                  <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">No saved addresses found.</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  const details = prompt('Enter your address (House/Street):');
                  const pincode = prompt('Enter 6-digit pincode:');
                  if (details && pincode && /^\d{6}$/.test(pincode)) {
                    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
                      .then(res => res.json())
                      .then(json => {
                        if (json[0]?.Status === 'Success' && json[0]?.PostOffice?.length > 0) {
                          const city = json[0].PostOffice[0].District || json[0].PostOffice[0].Taluk;
                          const state = json[0].PostOffice[0].Circle;

                          const newAddr = {
                            name: customer?.name || 'User',
                            details: details,
                            city: city,
                            state: state,
                            pincode: pincode
                          };

                          const currentAddresses = (customer?.address as any)?.addresses || [];
                          const updatedAddresses = [...currentAddresses, newAddr];

                          const locationData = { city, pincode: pincode };
                          localStorage.setItem('guestLocation', JSON.stringify(locationData));
                          setGuestLocation(locationData);

                          if (customer) {
                            updateProfile({
                              address: {
                                ...customer?.address,
                                city: city,
                                pincode: pincode,                    addresses: updatedAddresses
                              }
                            });
                          }
                          toast.success('Address saved!');
                        } else {
                          toast.error('Invalid pincode');
                        }
                      })
                      .catch(err => {
                        console.error('Pincode fetch failed:', err);
                        toast.error('Failed to validate pincode');
                      });
                  }
                }}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors font-medium border border-blue-100"
              >
                Add an address or pick-up point
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-400 font-medium uppercase tracking-tighter">or enter a pincode</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 6) {
                      setNewLocation(val);
                    }
                  }}
                  placeholder="Enter 6-digit pincode"
                  className="flex-1 h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-black transition-all"
                />
                <button
                  onClick={async () => {
                    if (newLocation.length === 6) {
                      try {
                        const res = await fetch(`https://api.postalpincode.in/pincode/${newLocation}`);
                        const json = await res.json();

                        if (json[0]?.Status === 'Success' && json[0]?.PostOffice?.length > 0) {
                          const city = json[0].PostOffice[0].District || json[0].PostOffice[0].Taluk;
                          const state = json[0].PostOffice[0].Circle;

                          const newAddr = {
                            name: customer?.name || 'User',
                            details: 'Pincode Area',
                            city: city,
                            state: state,
                            pincode: newLocation
                          };

                          const currentAddresses = (customer?.address as any)?.addresses || [];
                          const updatedAddresses = [...currentAddresses, newAddr];

                          const locationData = { city, pincode: newLocation };
                          localStorage.setItem('guestLocation', JSON.stringify(locationData));
                          setGuestLocation(locationData);

                          if (customer) {
                            await updateProfile({
                              address: {
                                ...customer?.address,
                                city: city,
                                pincode: newLocation,
                                addresses: updatedAddresses
                              }
                            });
                          }

                          setShowLocationModal(false);
                          setNewLocation('');
                          toast.success('Location updated and saved!');
                        } else {
                          toast.error('Invalid pincode or city not found');
                        }
                      } catch (err: any) {
                        console.error('Failed to update location:', err);
                        toast.error('Failed to update location. Please try again.');
                      }
                    }
                  }}
                  className="px-6 h-11 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
