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
  ChevronDown,
  BarChart3
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Products', icon: Package, to: '/products' },
  { label: 'Categories', icon: Tags, to: '/categories' },
  { label: 'Inventory', icon: Factory, to: '/inventory' },
  { label: 'Auctions', icon: Hourglass, to: '/auctions' },
  { label: 'Upcoming Auctions', icon: ListOrdered, to: '/queue' },
  { label: 'Auction History', icon: History, to: '/auctions/history' },
  { label: 'Bulk Upload', icon: Upload, to: '/bulk-upload' },
  { label: 'Orders', icon: ClipboardList, to: '/orders' },
  { label: 'Users', icon: Users, to: '/users', ownerOnly: true },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

const REPORT_SUB_ITEMS = [
  { label: 'User Reports', to: '/reports/user' },
  { label: 'Product Reports', to: '/reports/product' },
  { label: 'Category Reports', to: '/reports/category' },
  { label: 'Order Reports', to: '/reports/order' },
  { label: 'Auction Reports', to: '/reports/auction' },
  { label: 'Bid Reports', to: '/reports/bid' },
  { label: 'Seller Reports', to: '/reports/seller' },
  { label: 'Buyer Reports', to: '/reports/buyer' },
  { label: 'Payment Reports', to: '/reports/payment' },
  { label: 'Transaction Reports', to: '/reports/transaction' },
  { label: 'Inventory Reports', to: '/reports/inventory' },
  { label: 'Revenue Reports', to: '/reports/revenue' },
  { label: 'Notification Reports', to: '/reports/notification' }
];

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { admin } = useAdminAuthStore();
  const location = useLocation();
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith('/reports'));

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.ownerOnly || admin?.role === 'owner'
  );

  const isReportsActive = location.pathname.startsWith('/reports');

  return (
    <div className="flex flex-col h-full w-64 bg-[#F4F9F4] text-gray-700 border-r border-[#E2EAE2] z-30 font-sans">
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-[#E2EAE2] flex-shrink-0 bg-[#F4F9F4]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0FA86E] rounded-lg flex items-center justify-center text-white font-black text-xl">
            S
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-gray-900 font-bold text-xl tracking-tight">ShopNow</span>
            <span className="text-[#0FA86E] text-xs font-bold">.in</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mb-4 px-2">
          <h3 className="text-[11px] font-extrabold text-[#7CA18A] uppercase tracking-widest mb-4">Main Menu</h3>
          <ul className="space-y-1.5">
            {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-extrabold transition-all tracking-wide ${isActive
                      ? 'bg-[#DCEFDF] text-[#0FA86E]'
                      : 'text-gray-600 hover:bg-[#EAF3EB] hover:text-[#0FA86E]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[#0FA86E]' : 'text-gray-400 group-hover:text-[#0FA86E]'}`} strokeWidth={2.5} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}

            {/* Reports Dropdown Module */}
            <li>
              <button
                onClick={() => setReportsOpen(!reportsOpen)}
                className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-extrabold transition-all tracking-wide ${isReportsActive
                  ? 'bg-[#DCEFDF] text-[#0FA86E]'
                  : 'text-gray-600 hover:bg-[#EAF3EB] hover:text-[#0FA86E]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-5 h-5 ${isReportsActive ? 'text-[#0FA86E]' : 'text-gray-400 group-hover:text-[#0FA86E]'}`} strokeWidth={2.5} />
                  <span>Reports</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${reportsOpen ? 'rotate-180' : ''}`} />
              </button>

              {reportsOpen && (
                <ul className="mt-1 ml-4 pl-3 border-l border-[#DCEFDF] space-y-1">
                  {REPORT_SUB_ITEMS.map((subItem) => (
                    <li key={subItem.to}>
                      <NavLink
                        to={subItem.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `block px-3 py-2 rounded-lg text-xs font-extrabold transition-all tracking-wide ${isActive
                            ? 'bg-[#DCEFDF] text-[#0FA86E]'
                            : 'text-gray-500 hover:bg-[#EAF3EB] hover:text-[#0FA86E]'
                          }`
                        }
                      >
                        {subItem.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </div>

        {/* Quick Actions / Help */}
        <div className="mt-8 px-2">
          <h3 className="text-[11px] font-extrabold text-[#7CA18A] uppercase tracking-widest mb-4">Support</h3>
          <ul className="space-y-1.5">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-extrabold text-gray-600 hover:bg-[#EAF3EB] hover:text-[#0FA86E] rounded-xl transition-all group tracking-wide">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-[#0FA86E]" strokeWidth={2.5} />
                <span>Help Center</span>
              </button>
            </li>
            <li>
              <NavLink
                to="/announcements"
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-extrabold rounded-xl transition-all group tracking-wide ${isActive
                    ? 'bg-[#DCEFDF] text-[#0FA86E]'
                    : 'text-gray-600 hover:bg-[#EAF3EB] hover:text-[#0FA86E]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Megaphone className={`w-5 h-5 ${isActive ? 'text-[#0FA86E]' : 'text-gray-400 group-hover:text-[#0FA86E]'}`} strokeWidth={2.5} />
                    <span>Announcements</span>
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 bg-[#EAF3EB] border-t border-[#DCEFDF] flex-shrink-0">
        <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-[#DCEFDF] shadow-2xs">
          <div className="w-9 h-9 bg-[#DCEFDF] text-[#0FA86E] rounded-xl flex items-center justify-center text-sm font-black">
            {admin?.name?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-900 truncate leading-tight">{admin?.name}</p>
            <p className="text-[10px] text-gray-400 truncate uppercase font-extrabold tracking-widest mt-0.5">{admin?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
