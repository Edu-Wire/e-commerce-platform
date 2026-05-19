import {
  ComposedChart,
  Area,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import StatsCard from '../components/ui/StatsCard';
import type { OrderStatus } from '../types';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Package,
  ShoppingCart
} from 'lucide-react';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-[#fffbeb] text-[#b25e00] border-[#fde8c4]',
  confirmed: 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]',
  processing: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
  shipped: 'bg-[#f0fdfa] text-[#0f766e] border-[#ccfbf1]',
  delivered: 'bg-[#f0f9eb] text-[#2e7d32] border-[#c2e7b0]',
  cancelled: 'bg-[#fdf2f2] text-[#9b1c1c] border-[#f8b4b4]',
  refunded: 'bg-gray-100 text-gray-700 border-gray-200',
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded border border-gray-200 p-4 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded w-16" />
          <div className="h-6 bg-gray-100 rounded w-24" />
        </div>
        <div className="w-9 h-9 bg-gray-50 rounded" />
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useAdminDashboard();

  if (isError) {
    return (
      <div className="min-h-full bg-[#eaeded] -m-6 p-4 sm:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded border border-gray-300 max-w-md w-full shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Failed to load dashboard statistics</h3>
          <p className="text-xs text-gray-500 mt-1.5">
            There was a connection issue loading the Seller Central summary metrics.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-1.5 bg-[#f0c14b] border border-[#a88734] rounded text-xs font-semibold hover:bg-[#edd8a4] transition-all text-[#111]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#eaeded] -m-6 p-4 sm:p-6 text-[#111] font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Amazon Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-4 border border-gray-300 rounded shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Seller Central</span>
              <span>&gt;</span>
              <span className="font-semibold text-gray-700">Dashboard</span>
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mt-1">Seller Central Summary</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review aggregate metrics, sales volume curves, order completion levels, and inventory health highlights.
              <a href="#" className="text-[#0066c0] hover:text-[#c45500] hover:underline ml-1">Learn more</a>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-4 py-1.5 bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] hover:from-[#e7e9ec] hover:to-[#d9dbde] border border-[#adb1b8] text-xs font-semibold rounded shadow-sm text-gray-800 transition-all">
              Seller Performance
            </button>
            <button className="px-4 py-1.5 bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] hover:from-[#e7e9ec] hover:to-[#d9dbde] border border-[#adb1b8] text-xs font-semibold rounded shadow-sm text-gray-800 transition-all">
              Inventory Planning
            </button>
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatsCard title="Total Products" value={stats?.total_products ?? 0} icon="📦" iconBg="bg-blue-50" trend={{ value: 12, direction: 'up' }} />
              <StatsCard title="Active Products" value={stats?.active_products ?? 0} icon="✅" iconBg="bg-green-50" />
              <StatsCard title="Low Stock" value={stats?.low_stock_items ?? 0} icon="⚠️" iconBg="bg-amber-50" trend={{ value: 5, direction: 'down' }} />
              <StatsCard title="Today's Orders" value={stats?.todays_orders ?? 0} icon="📋" iconBg="bg-purple-50" trend={{ value: 8, direction: 'up' }} />
              <StatsCard title="Total Revenue" value={fmt(stats?.total_revenue ?? 0)} icon="💰" iconBg="bg-emerald-50" />
              <StatsCard title="Total Customers" value={stats?.total_customers ?? 0} icon="👥" iconBg="bg-cyan-50" />
            </>
          )}
        </div>

        {/* Row 1: Charts & Account Health (Height Balanced) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Sales Summary Chart Card (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded border border-gray-300 shadow-sm flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sales Summary</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Live metrics over the last 30 operational days</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f6f6f6] border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                  <span>Last 30 Days</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90 text-gray-500" />
                </div>
              </div>

              <div className="px-4 py-4">
                {isLoading ? (
                  <div className="h-64 bg-gray-50 rounded animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart 
                      data={stats?.orders_last_30_days ?? []}
                      margin={{ top: 10, right: 10, bottom: 5, left: -10 }}
                    >
                      <defs>
                        <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF9900" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#FF9900" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fontWeight: 600, fill: '#666' }}
                        tickFormatter={(v: string) => {
                          const date = new Date(v);
                          return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 9, fontWeight: 600, fill: '#666' }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(v) => `₹${v}`} 
                      />
                      <Tooltip
                        contentStyle={{ 
                          borderRadius: '4px', 
                          border: '1px solid #d3d3d3', 
                          boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)',
                          fontSize: '11px',
                          fontFamily: 'sans-serif'
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#e47911" strokeWidth={2} fillOpacity={1} fill="url(#colorOrange)" name="Revenue" />
                      <Line type="monotone" dataKey="orders" stroke="#232F3E" strokeWidth={2} dot={{ r: 2 }} name="Orders Count" />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Footer Metrics */}
            <div className="px-5 py-4 border-t border-gray-200 bg-[#f6f6f6] grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Total Sales</span>
                <span className="text-lg font-bold text-[#b12704] mt-0.5">{fmt(stats?.total_revenue ?? 0)}</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Units Sold</span>
                <span className="text-lg font-bold text-gray-900 mt-0.5">{stats?.total_products ?? 0}</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Avg. Order Value</span>
                <span className="text-lg font-bold text-gray-900 mt-0.5">{fmt((stats?.total_revenue ?? 0) / (stats?.total_products || 1))}</span>
              </div>
            </div>
          </div>

          {/* Account Health & Performance Gauges (1/3 width) */}
          <div className="bg-white rounded border border-gray-300 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Account Health</span>
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">Seller performance target metrics</p>
                </div>
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>

              {/* Stacked Gauges and Labels */}
              <div className="space-y-4">
                {/* Seller Rating */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 border border-gray-200 rounded">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-800">Seller Rating</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Target: &gt; 8.0</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-10 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: 9 }, { value: 1 }]}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={18}
                            outerRadius={24}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            <Cell fill="#007600" />
                            <Cell fill="#f3f4f6" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute bottom-0 text-center">
                        <span className="text-xs font-bold text-gray-900">9.0</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Good</span>
                  </div>
                </div>

                {/* Order Defect Rate */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 border border-gray-200 rounded">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-800">Order Defect Rate</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Target: &lt; 1%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-10 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: 0 }, { value: 100 }]}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={18}
                            outerRadius={24}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            <Cell fill="#CC0C39" />
                            <Cell fill="#f3f4f6" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute bottom-0 text-center">
                        <span className="text-xs font-bold text-gray-900">0%</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Good</span>
                  </div>
                </div>

                {/* Cancellation Rate */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 border border-gray-200 rounded">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-800">Cancellation Rate</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Target: &lt; 2.5%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-10 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ value: 0 }, { value: 100 }]}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={18}
                            outerRadius={24}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            <Cell fill="#CC0C39" />
                            <Cell fill="#f3f4f6" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute bottom-0 text-center">
                        <span className="text-xs font-bold text-gray-900">0%</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Good</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-4 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Performance status</span>
              <a href="#" className="text-[#0066c0] hover:text-[#c45500] hover:underline font-bold">Performance Details</a>
            </div>
          </div>
        </div>

        {/* Row 2: Inventory Health & Orders Overview (Perfectly Balanced 2-Column Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Inventory Health Box Details */}
          <div className="bg-white rounded border border-gray-300 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#e47911]" />
                    <span>Inventory Health</span>
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">Catalog counts and replenishment indicators</p>
                </div>
                <Link to="/inventory" className="text-xs font-semibold text-[#0066c0] hover:text-[#c45500] hover:underline">
                  Manage Inventory
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-[#fffbeb] border border-[#fde8c4] rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-[#b25e00] mt-1">{stats?.low_stock_items ?? 0}</p>
                </div>
                <div className="p-4 bg-[#fdf2f2] border border-[#f8b4b4] rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Out of Stock</p>
                  <p className="text-2xl font-bold text-[#9b1c1c] mt-1">0</p>
                </div>
                <div className="p-4 bg-[#f0f9eb] border border-[#c2e7b0] rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Active Catalog</p>
                  <p className="text-2xl font-bold text-[#2e7d32] mt-1">{stats?.active_products ?? 0}</p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Total Listed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_products ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Overview Box Details */}
          <div className="bg-white rounded border border-gray-300 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span>Orders Overview</span>
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">Real-time order statuses and customer tracking</p>
                </div>
                <Link to="/orders" className="text-xs font-semibold text-[#0066c0] hover:text-[#c45500] hover:underline">
                  Manage Orders
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Pending Orders</p>
                  <p className="text-2xl font-bold text-[#1d4ed8] mt-1">{stats?.todays_orders ?? 0}</p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_customers ?? 0}</p>
                </div>
                <div className="p-4 bg-[#f0fdfa] border border-[#ccfbf1] rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Average Order Value</p>
                  <p className="text-2xl font-bold text-[#0f766e] mt-1">
                    {fmt((stats?.total_revenue ?? 0) / (stats?.total_products || 1))}
                  </p>
                </div>
                <div className="p-4 bg-[#f0f9eb] border border-[#c2e7b0] rounded flex flex-col justify-between min-h-[90px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#2e7d32] mt-1">{fmt(stats?.total_revenue ?? 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Recent Orders table */}
        <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Orders</h2>
            <Link to="/orders" className="text-xs font-semibold text-[#0066c0] hover:text-[#c45500] hover:underline">
              View all orders
            </Link>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f6f6f6] border-b border-gray-300 text-xs font-semibold text-gray-600">
                      <th className="px-5 py-3 w-40">Order ID</th>
                      <th className="px-5 py-3">Customer Details</th>
                      <th className="px-5 py-3 w-32 text-center">Order Type</th>
                      <th className="px-5 py-3 w-36 text-right">Total Price</th>
                      <th className="px-5 py-3 w-44 text-center">Ship Status</th>
                      <th className="px-5 py-3 w-48">Order Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(stats?.recent_orders ?? []).map((o) => (
                      <tr key={o.id} className="hover:bg-[#fcfcfc] transition-colors border-b border-gray-200">
                        <td className="px-5 py-3.5 font-bold text-[#0066c0] hover:underline cursor-pointer">
                          {o.order_number}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{o.customer_name}</span>
                            <span className="text-[10px] text-gray-500">Retail buyer</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            o.order_type === 'b2b' 
                              ? 'bg-purple-50 border-purple-200 text-purple-700' 
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                            {o.order_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                          {fmt(o.total_amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border ${STATUS_COLORS[o.status as OrderStatus]}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 font-medium">
                          {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="block md:hidden divide-y divide-gray-200">
                {(stats?.recent_orders ?? []).map((o) => (
                  <div key={o.id} className="p-4 bg-white hover:bg-gray-50 transition-all flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0066c0]">{o.order_number}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border ${STATUS_COLORS[o.status as OrderStatus]}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>{o.customer_name}</span>
                      <span>{new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-2 mt-1">
                      <span className="font-bold text-gray-900">{fmt(o.total_amount)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        o.order_type === 'b2b' 
                          ? 'bg-purple-50 border-purple-200 text-purple-700' 
                          : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        {o.order_type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
