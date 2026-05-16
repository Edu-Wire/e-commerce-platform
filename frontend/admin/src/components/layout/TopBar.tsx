import { useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../../store/adminAuthStore';




interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { admin, logout } = useAdminAuthStore();

  const navigate = useNavigate();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-amazon-navy flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20 shadow-lg">
      {/* Left side: Menu & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-white hover:bg-amazon-navyLight transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title removed as per user request */}
      </div>

      {/* Center: Search Bar (Amazon Style) */}
      <div className="hidden md:flex flex-1 max-w-2xl ml-2 mr-auto">
        <div className="relative w-full flex group">
          <div className="flex items-center bg-gray-100 px-3 rounded-l-md border-r border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors">
            All
            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search products, orders, or customers..."
            className="w-full px-4 py-2 bg-white text-sm focus:outline-none"
          />
          <button className="bg-amazon-orange hover:bg-amazon-orangeLight px-5 rounded-r-md flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-amazon-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 lg:gap-5">
        {/* Language/Region (Mockup) */}
        <div className="hidden xl:flex items-center gap-1 text-white text-xs font-bold cursor-pointer hover:outline hover:outline-1 hover:outline-white p-2">
          <span className="text-lg">🇮🇳</span>
          <span>EN</span>
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Notification bell */}
        <button className="p-2 text-white hover:outline hover:outline-1 hover:outline-white relative transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amazon-orange rounded-full"></span>
        </button>

        {/* Admin info */}
        <div className="flex items-center gap-1 text-white cursor-pointer hover:outline hover:outline-1 hover:outline-white p-2 transition-all">
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-[10px] text-gray-300">Hello, {admin?.name?.split(' ')[0]}</span>
            <span className="text-sm font-bold">Account & Lists</span>
          </div>
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="ml-2 bg-amazon-orange hover:bg-amazon-orangeLight text-amazon-navy px-4 py-1.5 rounded text-sm font-bold transition-colors hidden sm:block"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
