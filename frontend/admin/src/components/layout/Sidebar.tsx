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
    <div className="flex flex-col h-full w-64 bg-slate-800 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            RA
          </div>
          <span className="text-lg font-bold text-white">RetailAdmin</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white p-1"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm font-medium uppercase">
            {admin?.name?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin?.name}</p>
            <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
