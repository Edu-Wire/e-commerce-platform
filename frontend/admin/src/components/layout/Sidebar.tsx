import { NavLink } from 'react-router-dom';
import useAdminAuthStore from '../../store/adminAuthStore';

interface NavItem {
  label: string;
  icon: string;
  to: string;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: '📊', to: '/dashboard' },
  { label: 'Products', icon: '📦', to: '/products' },
  { label: 'Categories', icon: '🏷️', to: '/categories' },
  { label: 'Inventory', icon: '🏭', to: '/inventory' },
  { label: 'Auctions', icon: '⏳', to: '/auctions' },
  { label: 'Bulk Upload', icon: '📤', to: '/bulk-upload' },
  { label: 'Orders', icon: '📋', to: '/orders' },
  { label: 'Users', icon: '👥', to: '/users', ownerOnly: true },
  { label: 'Settings', icon: '⚙️', to: '/settings' },
];

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { admin } = useAdminAuthStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.ownerOnly || admin?.role === 'owner'
  );

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-200 shadow-sm z-30">
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-6 bg-amazon-navy flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amazon-orange rounded-lg flex items-center justify-center text-white font-black text-xl">
            S
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-white font-bold text-xl tracking-tight">ShopNow</span>
            <span className="text-amazon-orange text-xs font-bold">.in</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-white hover:text-amazon-orange transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="mb-4 px-2">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-4">Main Menu</h3>
          <ul className="space-y-1.5">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition-all border-l-4 ${
                      isActive
                        ? 'bg-amazon-gray border-amazon-orange text-amazon-navy'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-amazon-navy'
                    }`
                  }
                >
                  <span className="text-lg leading-none opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Actions / Help (Mockup) */}
        <div className="mt-8 px-2">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-4">Support</h3>
          <ul className="space-y-1.5">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-amazon-navy rounded transition-all">
                <span className="text-lg leading-none opacity-80">❓</span>
                <span>Help Center</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-amazon-navy rounded transition-all">
                <span className="text-lg leading-none opacity-80">📢</span>
                <span>Announcements</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 shadow-sm">
          <div className="w-9 h-9 bg-amazon-navy text-white rounded flex items-center justify-center text-sm font-bold">
            {admin?.name?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{admin?.name}</p>
            <p className="text-[10px] text-gray-500 truncate uppercase font-bold tracking-tight">{admin?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
