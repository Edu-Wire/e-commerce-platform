import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAdminAuthStore from '../../store/adminAuthStore';

import {
  LayoutDashboard,
  Package,
  Tags,
  Factory,
  Hourglass,
  Upload,
  ClipboardList,
  Users,
  Settings,
  HelpCircle,
  Megaphone,
  ListOrdered,
  History,
  ChevronDown
} from 'lucide-react';

interface SubItem {
  label: string;
  to: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  to?: string;
  subItems?: SubItem[];
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Products', icon: Package, to: '/products' },
  { label: 'Categories', icon: Tags, to: '/categories' },
  { label: 'Inventory', icon: Factory, to: '/inventory' },
  {
    label: 'Auctions',
    icon: Hourglass,
    subItems: [
      { label: 'Active Auctions', to: '/auctions' },
      { label: 'Upcoming Auctions', to: '/queue' },
      { label: 'Auction History', to: '/auctions/history' },
    ],
  },
  { label: 'Bulk Upload', icon: Upload, to: '/bulk-upload' },
  { label: 'Orders', icon: ClipboardList, to: '/orders' },
  { label: 'Users', icon: Users, to: '/users', ownerOnly: true },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { admin } = useAdminAuthStore();
  const location = useLocation();

  // Keep auctions open if current path matches any auction sub-items
  const [auctionsOpen, setAuctionsOpen] = useState(() => {
    return location.pathname.startsWith('/auctions') || location.pathname === '/queue';
  });

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.ownerOnly || admin?.role === 'owner'
  );

  return (
    <div className="flex flex-col h-full w-64 bg-[#1e293b] text-gray-300 z-30">
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-6 bg-[#17202e] flex-shrink-0">
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
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mb-4 px-2">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-4">Main Menu</h3>
          <ul className="space-y-1.5">
            {visibleItems.map((item) => {
              const isSubItemActive = item.subItems?.some(
                (sub) => location.pathname === sub.to
              );

              return (
                <li key={item.label}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => setAuctionsOpen(!auctionsOpen)}
                        className={`w-full group flex items-center justify-between px-3 py-2.5 rounded text-sm font-semibold transition-all ${
                          isSubItemActive || auctionsOpen
                            ? 'bg-[#334155] text-white'
                            : 'text-gray-300 hover:bg-[#334155] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={`w-5 h-5 ${
                              isSubItemActive || auctionsOpen
                                ? 'text-white'
                                : 'text-gray-400 group-hover:text-white'
                            }`}
                            strokeWidth={2}
                          />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            auctionsOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {auctionsOpen && (
                        <ul className="mt-1.5 pl-8 space-y-1">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.to}>
                              <NavLink
                                to={subItem.to}
                                end
                                onClick={onClose}
                                className={({ isActive }) =>
                                  `block px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                    isActive
                                      ? 'text-[#f0c14b] bg-[#334155]/50'
                                      : 'text-gray-400 hover:text-white hover:bg-[#334155]/30'
                                  }`
                                }
                              >
                                {subItem.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.to!}
                      end
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-[#f0c14b] text-[#111827]'
                            : 'text-gray-300 hover:bg-[#334155] hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`w-5 h-5 ${
                              isActive ? 'text-[#111827]' : 'text-gray-400 group-hover:text-white'
                            }`}
                            strokeWidth={2}
                          />
                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Actions / Help (Mockup) */}
        <div className="mt-8 px-2">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-4">Support</h3>
          <ul className="space-y-1.5">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-[#334155] hover:text-white rounded transition-all group">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-white" strokeWidth={2} />
                <span>Help Center</span>
              </button>
            </li>
            <li>
              <NavLink 
                to="/announcements" 
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded transition-all group ${
                    isActive 
                      ? 'bg-[#f0c14b] text-[#111827]' 
                      : 'text-gray-300 hover:bg-[#334155] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Megaphone className={`w-5 h-5 ${isActive ? 'text-[#111827]' : 'text-gray-400 group-hover:text-white'}`} strokeWidth={2} />
                    <span>Announcements</span>
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 bg-[#0f172a] flex-shrink-0">
        <div className="flex items-center gap-3 p-2 bg-[#1e293b] rounded border border-[#334155] shadow-sm">
          <div className="w-9 h-9 bg-amazon-orange text-white rounded flex items-center justify-center text-sm font-bold">
            {admin?.name?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{admin?.name}</p>
            <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-tight">{admin?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
