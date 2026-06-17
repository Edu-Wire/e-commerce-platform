import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../../store/adminAuthStore';
import { Search } from 'lucide-react';

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { admin, logout } = useAdminAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const query = new URLSearchParams({ search: searchTerm.trim() });
      if (searchCategory !== 'All') {
        query.append('category', searchCategory.toLowerCase());
      }
      navigate(`/products?${query.toString()}`);
      setSearchTerm('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20 font-sans">
      {/* Left side: Menu Toggle (Mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Center: Search Bar (Modern Sage Style aligned in center) */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto">
        <div className="relative w-full flex border border-gray-200 focus-within:border-[#0FA86E] focus-within:ring-2 focus-within:ring-[#E6F4ED] rounded-xl overflow-hidden bg-gray-50/50 transition-all">
          <div className="relative flex items-center bg-gray-100/75 hover:bg-gray-200/50 border-r border-gray-200 transition-colors">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Search in"
            >
              <option value="All">All</option>
              <option value="Products">Products</option>
              <option value="Orders">Orders</option>
              <option value="Customers">Customers</option>
              <option value="Categories">Categories</option>
              <option value="Uploads">Uploads</option>
            </select>
            <div className="px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-gray-500 pointer-events-none whitespace-nowrap min-w-[50px] justify-between">
              {searchCategory}
              <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search products, orders, or customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
          />
          <button type="submit" className="bg-[#0FA86E] hover:bg-[#0d9561] px-5 flex items-center justify-center transition-colors">
            <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 lg:gap-4">


        {/* Notification bell */}
        <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl relative transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#0FA86E] border border-white text-white text-[9px] font-black rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Admin info */}
        <div className="flex items-center gap-1.5 text-gray-700 cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-all">
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hello, {admin?.name?.split(' ')[0]}</span>
            <span className="text-xs font-extrabold text-gray-800 mt-0.5">Account & Lists</span>
          </div>
          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="ml-2 bg-[#0FA86E] hover:bg-[#0d9561] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs hidden sm:block"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
