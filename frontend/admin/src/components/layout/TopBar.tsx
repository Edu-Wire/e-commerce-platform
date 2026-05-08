import { useLocation, useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../../store/adminAuthStore';
import RoleBadge from '../ui/RoleBadge';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/bulk-upload': 'Bulk Upload',
  '/orders': 'Orders',
  '/users': 'Users',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (pathname.includes('/products/new')) return 'Add Product';
  if (pathname.match(/\/products\/.+\/edit/)) return 'Edit Product';
  if (pathname.match(/\/orders\/.+/)) return 'Order Detail';
  return PAGE_TITLES[pathname] ?? 'RetailAdmin';
}

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { admin, logout } = useAdminAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Admin info */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{admin?.name}</span>
          {admin?.role && <RoleBadge role={admin.role} />}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
