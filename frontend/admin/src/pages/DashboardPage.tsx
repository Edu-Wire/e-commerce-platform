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



const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  shipped: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  delivered: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  refunded: 'bg-gray-50 text-gray-600 border-gray-100',
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
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-white rounded border border-dashed border-gray-300">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="font-bold">Failed to load dashboard data.</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-amazon-blue font-bold hover:underline">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900 tracking-tight capitalize">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-amazon-orange hover:bg-amazon-orangeLight text-amazon-navy text-xs font-bold rounded transition-colors shadow-sm">
            Seller Performance
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded transition-colors shadow-sm">
            Inventory Planning
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

      {/* Charts & Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Summary (Left - Large) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Sales Summary</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
              last 30 days
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="px-6 pb-2 flex-1">
            {isLoading ? (
              <div className="h-64 bg-gray-50 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={stats?.orders_last_30_days ?? []}>
                  <defs>
                    <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9900" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF9900" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                    tickFormatter={(v: string) => {
                      const date = new Date(v);
                      return date.toLocaleDateString('en-US', { month: 'short' });
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF9900" strokeWidth={3} fillOpacity={1} fill="url(#colorOrange)" />
                  <Line type="monotone" dataKey="orders" stroke="#232F3E" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Footer Metrics */}
          <div className="px-8 py-6 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div className="flex flex-col border-r border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Total Sales</span>
              <span className="text-xl font-black text-gray-900 mt-1">{fmt(stats?.total_revenue ?? 0)}</span>
            </div>
            <div className="flex flex-col border-r border-gray-100 pl-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Units Sold</span>
              <span className="text-xl font-black text-gray-900 mt-1">{stats?.total_products ?? 0}</span>
            </div>
            <div className="flex flex-col pl-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Avg. Order Value</span>
              <span className="text-xl font-black text-gray-900 mt-1">{fmt((stats?.total_revenue ?? 0) / (stats?.total_products || 1))}</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar Section */}
        <div className="flex flex-col gap-6">
          {/* Inventory Health */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Inventory Health</h2>
              <svg className="w-5 h-5 text-gray-400 hover:text-amazon-blue cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 group cursor-pointer hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amazon-orange"></div>
                  <span className="text-sm font-bold text-gray-700">Low Stock Alerts</span>
                </div>
                <div className="w-6 h-6 bg-amazon-orange rounded-full flex items-center justify-center text-white">
                  <span className="text-xs font-bold">!</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 group cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  <span className="text-sm font-bold text-gray-700">Out of Stock Items</span>
                </div>
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">
                  <span className="text-xs font-bold">!</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 group cursor-pointer hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="text-sm font-bold text-gray-700">Excess Inventory</span>
                </div>
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white">
                  <span className="text-xs font-bold">!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Overview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Order Overview</h2>
              <div className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-amazon-blue cursor-pointer transition-colors">
                Recent
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase">Pending</p>
                <p className="text-2xl font-black text-gray-900 mt-1">22</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Shipped</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase">Unshipped</p>
                <p className="text-2xl font-black text-gray-900 mt-1">45</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Row: Health Grid & Performance Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Health (Grid) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Inventory Health</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 group hover:bg-amber-100 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-gray-600 mb-2">Low Stock Alerts</p>
              <p className="text-3xl font-black text-gray-900">4</p>
            </div>
            <div className="p-5 bg-red-50 rounded-xl border border-red-100 group hover:bg-red-100 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-gray-600 mb-2">Out of Stock Items</p>
              <p className="text-3xl font-black text-gray-900">20</p>
            </div>
            <div className="p-5 bg-green-50 rounded-xl border border-green-100 group hover:bg-green-100 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-gray-600 mb-2">ACoS</p>
              <p className="text-3xl font-black text-gray-900">$1,990</p>
            </div>
            <div className="p-5 bg-slate-100 rounded-xl border border-slate-200 group hover:bg-slate-200 transition-colors cursor-pointer">
              <p className="text-xs font-bold text-gray-600 mb-2">Excess Inventory</p>
              <p className="text-3xl font-black text-gray-900">60</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics (Gauges) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Performance Metrics</h2>
            <svg className="w-5 h-5 text-gray-400 hover:text-amazon-blue cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Gauge 1: Seller Rating */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Seller Rating</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <div className="relative w-full h-24 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: 9 }, { value: 1 }]}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={35}
                      outerRadius={45}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill="#007600" />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 text-center">
                  <span className="text-xl font-black text-gray-900">9.0</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 mt-2">vs previous period</span>
            </div>

            {/* Gauge 2: Order Defect Rate */}
            <div className="flex flex-col items-center border-x border-gray-100">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Order Defect</span>
              </div>
              <div className="relative w-full h-24 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: 0 }, { value: 100 }]}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={35}
                      outerRadius={45}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill="#CC0C39" />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 text-center">
                  <span className="text-xl font-black text-gray-900">0%</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 mt-2">vs previous period</span>
            </div>

            {/* Gauge 3: Cancellation Rate */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Cancellation</span>
              </div>
              <div className="relative w-full h-24 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: 0 }, { value: 100 }]}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={35}
                      outerRadius={45}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell fill="#CC0C39" />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 text-center">
                  <span className="text-xl font-black text-gray-900">0%</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 mt-2">vs previous period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Manage Orders</h2>
          <button className="text-xs font-bold text-amazon-blue hover:underline">View all orders</button>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Order ID', 'Customer Details', 'Order Type', 'Total Price', 'Ship Status', 'Order Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats?.recent_orders ?? []).map((o) => (
                  <tr key={o.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-amazon-blue hover:underline cursor-pointer">{o.order_number}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{o.customer_name}</span>
                        <span className="text-[10px] text-gray-500">Retail Customer</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${o.order_type === 'b2b' ? 'bg-purple-600 text-white' : 'bg-amazon-navy text-white'}`}>
                        {o.order_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">{fmt(o.total_amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-tighter ${STATUS_COLORS[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-medium">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
