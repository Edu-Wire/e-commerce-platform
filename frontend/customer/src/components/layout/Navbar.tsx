import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import toast from 'react-hot-toast';
import { useCategories } from '../../hooks/useCategories';
import { useLanguageStore, translations, Language } from '../../store/languageStore';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, Notification } from '../../hooks/useNotifications';
import { api } from '../../lib/api';

export default function Navbar() {
  const { customer, logout, updateProfile } = useAuthStore();
  const totalItems = useCartStore(s => s.totalItems());
  const wishlistItems = useWishlistStore(s => s.items);
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language] || translations['EN'];
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Notifications states & queries
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [activeModalNotification, setActiveModalNotification] = useState<Notification | null>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useNotifications(!!customer);
  const { mutate: markReadMutate } = useMarkAsRead();
  const { mutate: markAllReadMutate } = useMarkAllAsRead();

  // Auto-open modal popup for offer notifications — only once ever per notification (localStorage persists)
  useEffect(() => {
    if (location.pathname !== '/') return;
    if (notifications && notifications.length > 0) {
      const offerNotif = notifications.find(n => n.link?.includes('outbid_offer') || n.title.toLowerCase().includes('offer') || n.message.toLowerCase().includes('offer'));
      if (offerNotif) {
        const key = `offer_popup_shown_${offerNotif.id}`;
        if (!localStorage.getItem(key)) {
          setActiveModalNotification(offerNotif);
          localStorage.setItem(key, '1');
        }
      }
    }
  }, [notifications, location.pathname]);

  const handleNotificationClick = (notif: Notification) => {
    markReadMutate(notif.id);
    setNotificationDropdownOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

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
          const res = await api.get(`/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
          if (res.data.success) {
            setSuggestions(res.data.data);
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
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target as Node)) {
        setNotificationDropdownOpen(false);
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

  const topLevelCategories = categories?.filter(c => !c.parent_id && c.slug !== 'clothing' && c.slug !== 'electronics') ?? [];
  const navCategories = topLevelCategories.map(cat => ({
    ...cat,
    children: categories?.filter(c => c.parent_id === cat.id) ?? []
  }));

  return (
    <header className="bg-white text-gray-800 sticky top-0 z-50 shadow-sm border-b border-gray-200 font-sans">


      {/* Main Navbar Bar */}
      <div className="max-w-[1500px] mx-auto px-2 sm:px-4 py-2 flex flex-wrap items-center justify-between lg:justify-start gap-y-2">

        {/* Left Section: Toggle & Logo */}
        <div className="flex items-center gap-1.5 order-1">
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="lg:hidden p-1.5 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link
            to="/"
            className="flex items-center p-1 sm:p-2 rounded-md hover:bg-gray-50 transition-all flex-shrink-0"
          >
            <svg className="w-8 h-8 text-brand-primary mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6V5a4 4 0 0 0-8 0v1H4v13a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V6h-4zM9 5a3 3 0 0 1 6 0v1H9V5zm9 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8h12v11z" />
              <path d="M9 10a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm4 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
            </svg>
            <div className="flex items-start text-gray-800">
              <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-[#222]">ShopNow</span>
              <span className="text-gray-500 text-[9px] sm:text-[10px] font-bold leading-none ml-0.5 mt-0.5">TM</span>
            </div>
          </Link>
        </div>

        {/* Delivery Location - Desktop Only */}
        <div
          onClick={() => setShowLocationModal(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-all text-gray-700 ml-2 order-2"
        >
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {customer ? `${t.deliverTo || 'Deliver to'} ${customer.name.split(' ')[0]}` : t.deliverTo || 'Deliver to'}
            </span>
            <span className="text-xs font-bold text-gray-800 mt-0.5 truncate max-w-[130px]">
              {customer?.address?.city || guestLocation?.city || 'Bhopal'} {customer?.address?.pincode || guestLocation?.pincode || '462003'}
            </span>
          </div>
        </div>

        {/* Search Bar - Full width on mobile, Flex-1 on desktop */}
        <div className="w-full lg:flex-1 h-10 lg:mx-4 order-4 lg:order-3">
          <form onSubmit={handleSearch} className="w-full flex h-full group">
            <div ref={searchRef} className="relative flex w-full h-full bg-white rounded-full border border-gray-300 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
              {/* Category Dropdown - Hidden on very small screens */}
              <div
                ref={categoryDropdownRef}
                className="relative hidden sm:block h-full flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowSearchHistory(false);
                  }}
                  className="flex items-center gap-1.5 h-full px-4 bg-gray-50 text-gray-700 text-xs font-bold border-r border-gray-200 hover:bg-gray-100 transition-colors rounded-l-full"
                >
                  <span className="truncate max-w-[95px]">{selectedCategory}</span>
                  <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 pt-2 w-52 z-50">
                    <div className="bg-white shadow-lg border border-gray-200 rounded-md max-h-60 overflow-y-auto animate-dropdown">
                      <div
                        onClick={() => {
                          setSelectedCategory('All');
                          setSelectedCategorySlug('');
                          setShowCategoryDropdown(false);
                          navigate('/category/all');
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
                            navigate(`/category/${cat.slug}`);
                          }}
                          className="px-4 py-2 text-sm text-black hover:bg-gray-100 cursor-pointer"
                        >
                          {cat.name}
                        </div>
                      ))}
                    </div>
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
                placeholder="Search for products, brands and more..."
                className="flex-1 px-4 py-2 text-gray-800 text-sm focus:outline-none placeholder-gray-400 rounded-l-md sm:rounded-l-none"
              />

              <button
                type="button"
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                className={`px-3 flex items-center justify-center transition-all ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-brand-primary'
                  }`}
                title="Search by voice"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <div className="flex items-center justify-center pr-1.5 pl-0.5 bg-white rounded-r-full">
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-brand-primary hover:bg-brand-primaryHover text-white flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                  </svg>
                </button>
              </div>

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
        <div className="flex items-center gap-1 sm:gap-2 order-3 lg:order-4">
          {/* Language Selector - Desktop Only */}
          <div
            className="relative hidden lg:block"
            ref={langDropdownRef}
          >
            <div
              onClick={() => setLangDropdownOpen(v => !v)}
              className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-all gap-1 text-gray-700"
            >
              <div className="flex flex-col shadow-xs border border-gray-300 overflow-hidden rounded-xs">
                <div className="w-5 h-1.5 bg-[#FF9933]"></div>
                <div className="w-5 h-1.5 bg-white flex items-center justify-center"><div className="w-1 h-1 bg-[#000080] rounded-full"></div></div>
                <div className="w-5 h-1.5 bg-[#138808]"></div>
              </div>
              <span className="text-xs font-bold uppercase ml-0.5">{language}</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {langDropdownOpen && (
              <div className="absolute top-full left-0 pt-2 w-60 z-50">
                <div className="bg-white text-gray-900 shadow-xl border border-gray-200 py-3 rounded-md animate-dropdown">
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
                            className="w-4 h-4 accent-brand-primary"
                          />
                          <span className="text-xs text-gray-700 group-hover:text-brand-primary group-hover:underline">{lang.label}</span>
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
                        <div className="w-4 h-0.5 bg-brand-primary"></div>
                      </div>
                      You are shopping on ShopNow.in
                    </div>
                    <Link to="#" className="text-xs text-blue-700 hover:text-brand-primary hover:underline">Change country/region</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          {customer && (
            <div
              className="relative"
              ref={notificationDropdownRef}
            >
              <button
                onClick={() => {
                  setNotificationDropdownOpen(!notificationDropdownOpen);
                  setUserDropdownOpen(false);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-all relative text-gray-600"
                title="Notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications && notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-brand-primary text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {notificationDropdownOpen && (
                <div className="absolute top-full right-0 pt-2 w-80 z-[70]">
                  <div className="bg-white text-gray-900 shadow-2xl border border-gray-200 py-3 rounded-md animate-dropdown">
                    <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#0f1111]">Notifications</span>
                      {notifications && notifications.filter(n => !n.is_read).length > 0 && (
                        <button
                          onClick={() => markAllReadMutate()}
                          className="text-xs text-[#007185] hover:text-[#c40000] hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-1">
                      {notifications && notifications.length > 0 ? (
                        notifications.map((notif) => {
                          const isOffer = notif.link?.includes('outbid_offer') || notif.title.toLowerCase().includes('offer') || notif.message.toLowerCase().includes('offer');

                          if (isOffer) {
                            return (
                              <div
                                key={notif.id}
                                className="mx-2 my-2 rounded-xl border border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 p-3 cursor-pointer transition-all hover:shadow-md hover:border-orange-400 group"
                                onClick={() => handleNotificationClick(notif)}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                    <span>⚡</span> Exclusive Bidder Offer
                                  </span>
                                  {!notif.is_read && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>}
                                </div>
                                <p className="text-xs font-bold text-slate-800 leading-snug">{notif.title}</p>
                                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                                {notif.link && (
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-200/50">
                                    <span className="text-[10px] text-orange-600 font-bold group-hover:underline">View Offer →</span>
                                    <span className="text-[9px] text-slate-400">{new Date(notif.created_at).toLocaleDateString('en-IN')}</span>
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={notif.id}
                              className={`px-4 py-3 border-b border-gray-100 flex flex-col gap-1 cursor-pointer transition-colors ${notif.is_read ? 'bg-white hover:bg-gray-50 opacity-80' : 'bg-orange-50/50 hover:bg-orange-50/80 font-medium'
                                }`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                  {!notif.is_read && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full inline-block"></span>}
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(notif.created_at).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                              <p className={`text-xs leading-normal ${notif.is_read ? 'text-gray-500' : 'text-gray-900'}`}>{notif.message}</p>
                              {notif.link && (
                                <span className="text-[10px] text-[#007185] font-semibold mt-1 hover:underline">Click to view offer &rarr;</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-6 text-center text-xs text-gray-500">
                          No notifications.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account & Lists */}
          <div
            className="relative"
            ref={userDropdownRef}
          >
            <button
              type="button"
              onClick={() => setUserDropdownOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-all text-left text-gray-700 min-w-0"
            >
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-gray-400">Hello, {customer ? customer.name.split(' ')[0] : 'Sign In'}</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-xs font-bold text-gray-800">My Account</span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {userDropdownOpen && (
              <div className="absolute top-full right-0 pt-2 w-64 z-[70]">
                <div className="bg-white text-gray-900 shadow-2xl border border-gray-200 py-4 rounded-md animate-dropdown">
                  <div className="px-4 mb-4">
                    {!customer && (
                      <div className="text-center">
                        <Link to="/login" onClick={() => setUserDropdownOpen(false)} className="block w-full py-1.5 bg-brand-primary hover:bg-brand-primaryHover text-white rounded text-sm font-bold transition-all shadow-sm text-center">
                          Sign in
                        </Link>
                        <p className="text-[11px] mt-2 text-gray-500">
                          New customer? <Link to="/register" onClick={() => setUserDropdownOpen(false)} className="text-brand-primary hover:text-brand-primaryHover hover:underline font-bold">Start here.</Link>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-100 flex p-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2.5">Your Lists</h3>
                      <div className="space-y-1">
                        <Link to="/wishlist" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-brand-primary hover:underline py-0.5">View Wishlist</Link>
                      </div>
                    </div>
                    <div className="flex-1 border-l border-gray-100 pl-4">
                      <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2.5">Your Account</h3>
                      <div className="space-y-1">
                        <Link to="/account" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-brand-primary hover:underline py-0.5">Your Account</Link>
                        <Link to="/orders" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-brand-primary hover:underline py-0.5">Your Orders</Link>
                        {customer?.customer_type === 'b2b' && (
                          <Link to="/b2b" onClick={() => setUserDropdownOpen(false)} className="block text-xs text-gray-600 hover:text-brand-primary hover:underline py-0.5">B2B Dashboard</Link>
                        )}
                        {customer && (
                          <button onClick={handleLogout} className="block w-full text-left text-xs text-red-600 hover:underline mt-2">Sign Out</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link to="/wishlist" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-all text-gray-700 relative group" title="Wishlist">
            <div className="relative">
              <svg className="w-6 h-6 text-gray-500 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold">
                  {wishlistItems.length}
                </span>
              )}
            </div>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-all text-gray-700 relative group">
            <div className="relative">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span className="absolute -top-1.5 -right-1.5 bg-brand-primary text-white rounded-full text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-800">Cart</span>
          </Link>
        </div>

        {/* Mobile Location Bar */}
        <div
          onClick={() => setShowLocationModal(true)}
          className="lg:hidden w-full bg-[#f4f4f4] -mx-2 sm:-mx-4 px-4 py-2 flex items-center gap-1.5 order-5 cursor-pointer border-t border-gray-200"
        >
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 truncate flex-1">
            {t.deliverTo || 'Deliver to'} {customer?.address?.city || guestLocation?.city || 'Bhopal'} {customer?.address?.pincode || guestLocation?.pincode || '462003'}
          </span>
          <svg className="w-3 h-3 text-gray-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Bottom Nav Bar (Secondary) - White/Green theme */}
      <div className="bg-white border-t border-b border-gray-200 text-gray-700 flex items-center px-4 py-1.5 gap-6 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-sm transition-all text-xs font-bold flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          Browse Categories
        </button>

        <div className="flex-1 flex items-center justify-center gap-6 text-[11px] font-bold text-gray-700 tracking-wider overflow-x-auto no-scrollbar">
          {topLevelCategories.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="hover:text-brand-primary uppercase flex-shrink-0 transition-colors duration-150"
            >
              {cat.name}
            </Link>
          ))}
          <Link to="/category/all?sort=discount_desc" className="hover:text-brand-primary uppercase flex-shrink-0 transition-colors duration-150">BRANDS</Link>
          <Link to="/category/todays-deals" className="hover:text-brand-primary uppercase flex-shrink-0 transition-colors duration-150">OFFERS</Link>
        </div>

        <button
          onClick={() => window.dispatchEvent(new Event('toggle-ai-chat'))}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-full text-xs font-bold text-orange-700 hover:bg-orange-200 transition-all cursor-pointer"
        >
          ✨ AI Assistant
        </button>

        <Link
          to="/live-auction"
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#E2F0D9] border border-[#D5E6CD] rounded-full text-xs font-bold text-[#1B3B2B] hover:bg-[#D5E6CD] transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
          </span>
          Live Auctions
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
                  {navCategories.map(cat => (
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
                  <Link to="/live-auction" onClick={() => setMobileMenuOpen(false)} className="text-sm text-orange-600 font-bold hover:bg-gray-100 -mx-4 px-4 py-3 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                    Live Auctions
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
                                pincode: pincode, addresses: updatedAddresses
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
      {/* Dynamic Retargeting Modal */}
      {activeModalNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={() => {
              setActiveModalNotification(null);
            }}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 text-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-[#f3a847] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <h2 className="text-base font-bold">Exclusive Deal For You!</h2>
              </div>
              <button
                onClick={() => {
                  setActiveModalNotification(null);
                }}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed font-semibold bg-gray-50 p-4 rounded-lg border border-gray-100">
                {activeModalNotification.message}
              </p>

              <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-3 text-xs text-orange-800 flex items-start gap-2">
                <span className="mt-0.5">💡</span>
                <span>This offer is only valid for a limited time because you participated in the auction.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setActiveModalNotification(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                No Thanks
              </button>
              {activeModalNotification.link && (
                <Link
                  to={activeModalNotification.link}
                  onClick={() => {
                    markReadMutate(activeModalNotification.id);
                    setActiveModalNotification(null);
                  }}
                  className="px-5 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-bold shadow-md shadow-orange-500/20"
                >
                  Buy Now
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
