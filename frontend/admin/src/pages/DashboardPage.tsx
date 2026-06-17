import {
  ComposedChart,
  Area,
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
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  IndianRupee,
  Users,
  LineChart,
} from 'lucide-react';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]',
  confirmed: 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]',
  processing: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
  shipped: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
  delivered: 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]',
  cancelled: 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]',
  refunded: 'bg-gray-100 text-gray-700 border-gray-200',
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse shadow-xs">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded w-16" />
          <div className="h-6 bg-gray-100 rounded w-24" />
        </div>
        <div className="w-10 h-10 bg-gray-50 rounded-xl" />
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

// Custom SVG Circular Gauge for Account Health metrics
interface CircularGaugeProps {
  value: number;
  max?: number;
  isPercentage?: boolean;
  strokeColor?: string;
}

function CircularGauge({ value, max = 10, isPercentage = false, strokeColor = '#0FA86E' }: CircularGaugeProps) {
  const radius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
        {/* Track circle */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-gray-900 leading-none">
          {value}{isPercentage ? '%' : ''}
        </span>
      </div>
    </div>
  );
}

// Custom Tooltip matching mockup
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateObj = new Date(data.date);
    const formattedDate = dateObj.toISOString().replace('T', ' ').substring(0, 19) + '.000Z';
    return (
      <div className="bg-white border border-gray-100 p-3.5 rounded-xl shadow-lg text-xs select-none">
        <p className="text-gray-400 font-bold mb-2">{formattedDate}</p>
        <p className="font-extrabold text-[#0FA86E]">Revenue : {data.revenue}</p>
        <p className="font-extrabold text-gray-700 mt-0.5">Orders Count : {data.orders}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useAdminDashboard();

  if (isError) {
    return (
      <div className="min-h-screen bg-[#F4F6F4] -m-6 p-4 sm:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-gray-100 max-w-md w-full shadow-md">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">Failed to load dashboard statistics</h3>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            There was a connection issue loading the Seller Central summary metrics.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-5 py-2.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-800 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-5">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review aggregate metrics, sales volume curves, order completion levels, and inventory health highlights.
              <a href="#" className="text-[#0FA86E] hover:text-[#0d9561] hover:underline font-bold ml-1">Learn more</a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="bg-white hover:bg-gray-50 text-[#0FA86E] border border-[#0FA86E] text-xs font-bold py-2.5 px-4 rounded-md shadow-xs transition-colors flex items-center gap-1.5">
              <LineChart className="w-3.5 h-3.5" />
              <span>Seller Performance</span>
            </button>
            <button className="bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold py-2.5 px-4 rounded-md shadow-sm transition-colors flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>Inventory Planning</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatsCard
                title="Total Products"
                value={stats?.total_products ?? 0}
                icon={<Package className="w-5 h-5 text-emerald-700" />}
                iconBg="bg-emerald-50"
                trend={{ value: 12, direction: 'up' }}
              />
              <StatsCard
                title="Active Products"
                value={stats?.active_products ?? 0}
                icon={<CheckCircle2 className="w-5 h-5 text-cyan-700" />}
                iconBg="bg-cyan-50"
              />
              <StatsCard
                title="Low Stock"
                value={stats?.low_stock_items ?? 0}
                icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
                iconBg="bg-amber-50"
                trend={{ value: 5, direction: 'down' }}
              />
              <StatsCard
                title="Today's Orders"
                value={stats?.todays_orders ?? 0}
                icon={<ClipboardList className="w-5 h-5 text-blue-700" />}
                iconBg="bg-blue-50"
                trend={{ value: 8, direction: 'up' }}
              />
              <StatsCard
                title="Total Revenue"
                value={fmt(stats?.total_revenue ?? 0)}
                icon={<IndianRupee className="w-5 h-5 text-violet-700" />}
                iconBg="bg-violet-50"
              />
              <StatsCard
                title="Total Customers"
                value={stats?.total_customers ?? 0}
                icon={<Users className="w-5 h-5 text-rose-700" />}
                iconBg="bg-rose-50"
              />
            </>
          )}
        </div>

        {/* Row 1: Inventory Health & Orders Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Inventory Health Box */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#0FA86E]" />
                  <span>Inventory Health</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Real-time inventory status and alerts</p>
              </div>
              <Link to="/inventory" className="text-xs font-bold text-[#0FA86E] hover:text-[#0d9561] hover:underline">
                Manage Inventory
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 bg-[#FFFBEB] border border-[#FDE8C4] rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-[#B25E00] uppercase tracking-wider">Low Stock Alerts</p>
                <p className="text-3xl font-black text-[#B25E00] mt-2">{stats?.low_stock_items ?? 0}</p>
              </div>
              <div className="p-4 bg-[#FEF2F2] border border-[#F8B4B4] rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-[#9B1C1C] uppercase tracking-wider">Out of Stock</p>
                <p className="text-3xl font-black text-[#9B1C1C] mt-2">0</p>
              </div>
              <div className="p-4 bg-[#F0F9EB] border border-[#C2E7B0] rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-[#2E7D32] uppercase tracking-wider">Active SKUs</p>
                <p className="text-3xl font-black text-[#2E7D32] mt-2">{stats?.active_products ?? 0}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Total SKUs</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{stats?.total_products ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Orders Overview Box */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#0FA86E]" />
                  <span>Orders Overview</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Overview of all orders and related metrics</p>
              </div>
              <Link to="/orders" className="text-xs font-bold text-[#0FA86E] hover:text-[#0d9561] hover:underline">
                Manage Orders
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-[#1D4ED8] uppercase tracking-wider">Pending Orders</p>
                <p className="text-3xl font-black text-[#1D4ED8] mt-2">{stats?.todays_orders ?? 0}</p>
              </div>
              <div className="p-4 bg-[#FAF5FF] border border-[#E9D5FF] rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-[#6B21A8] uppercase tracking-wider">Total Customers</p>
                <p className="text-3xl font-black text-[#6B21A8] mt-2">{stats?.total_customers ?? 0}</p>
              </div>
              <div className="p-4 bg-[#F0F9EB] border border-[#C2E7B0] rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-[#2E7D32] uppercase tracking-wider">Order Revenue (30D)</p>
                <p className="text-3xl font-black text-[#2E7D32] mt-2">
                  {fmt((stats?.total_revenue ?? 0) / (stats?.total_products || 1))}
                </p>
              </div>
              <div className="p-4 bg-[#F0F9EB] border border-[#C2E7B0] rounded-md flex flex-col justify-between min-h-[95px] shadow-2xs">
                <p className="text-[10px] font-extrabold text-[#2E7D32] uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl font-black text-[#2E7D32] mt-2">{fmt(stats?.total_revenue ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Charts & Account Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Sales Summary Chart Card (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-[#0FA86E]" />
                    <span>Sales Summary</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Live metrics over the last 30 operational days</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                  <span>Last 30 Days</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90 text-gray-400" />
                </div>
              </div>

              <div className="px-4 py-5">
                {isLoading ? (
                  <div className="h-64 bg-gray-50 rounded-md animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart
                      data={stats?.orders_last_30_days ?? []}
                      margin={{ top: 10, right: 10, bottom: 5, left: -10 }}
                    >
                      <defs>
                        <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0FA86E" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0FA86E" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                        tickFormatter={(v: string) => {
                          const date = new Date(v);
                          return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0FA86E"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorGreen)"
                        activeDot={{ r: 6, fill: '#0FA86E', stroke: '#FFF', strokeWidth: 2 }}
                        name="Revenue"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Footer Metrics */}
            <div className="px-6 py-5 border-t border-gray-50 bg-[#F9FAFB] grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Total Sales</span>
                <span className="text-xl font-black text-[#0FA86E] mt-1">{fmt(stats?.total_revenue ?? 0)}</span>
              </div>
              <div className="flex flex-col border-l border-gray-200 pl-5">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Units Sold</span>
                <span className="text-xl font-black text-gray-900 mt-1">{stats?.total_products ?? 0}</span>
              </div>
              <div className="flex flex-col border-l border-gray-200 pl-5">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Avg. Order Value</span>
                <span className="text-xl font-black text-gray-900 mt-1">{fmt((stats?.total_revenue ?? 0) / (stats?.total_products || 1))}</span>
              </div>
            </div>
          </div>

          {/* Account Health & Performance Gauges (1/3 width) */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0FA86E]" />
                    <span>Account Health</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Seller performance target metrics</p>
                </div>
                <HelpCircle className="w-5 h-5 text-gray-300 cursor-pointer hover:text-gray-400 transition-colors" />
              </div>

              {/* Stacked Gauges and Labels */}
              <div className="space-y-3.5">
                {/* Seller Rating */}
                <div className="flex items-center justify-between bg-[#F9FAFB] p-3.5 border border-gray-100 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-gray-800">Seller Rating</span>
                    <span className="text-[11px] text-gray-400 font-semibold mt-0.5">Target: &gt; 8.0</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CircularGauge value={9.0} max={10} strokeColor="#0FA86E" />
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-sm">Good</span>
                  </div>
                </div>

                {/* Order Defect Rate */}
                <div className="flex items-center justify-between bg-[#F9FAFB] p-3.5 border border-gray-100 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-gray-800">Order Defect Rate</span>
                    <span className="text-[11px] text-gray-400 font-semibold mt-0.5">Target: &lt; 1%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CircularGauge value={0} max={100} isPercentage strokeColor="#0FA86E" />
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-sm">Good</span>
                  </div>
                </div>

                {/* Cancellation Rate */}
                <div className="flex items-center justify-between bg-[#F9FAFB] p-3.5 border border-gray-100 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-gray-800">Cancellation Rate</span>
                    <span className="text-[11px] text-gray-400 font-semibold mt-0.5">Target: &lt; 2.5%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CircularGauge value={0} max={100} isPercentage strokeColor="#0FA86E" />
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-sm">Good</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 mt-5 flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400 font-semibold">Performance details</span>
              <a href="#" className="text-[#0FA86E] hover:text-[#0d9561] hover:underline">Performance Details</a>
            </div>
          </div>
        </div>

        {/* Row 3: Recent Orders table */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Recent Orders</h2>
            <Link to="/orders" className="text-xs font-bold text-[#0FA86E] hover:text-[#0d9561] hover:underline">
              View all orders
            </Link>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4 w-40">Order ID</th>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4 w-32 text-center">Order Type</th>
                      <th className="px-6 py-4 w-36 text-right">Total Price</th>
                      <th className="px-6 py-4 w-44 text-center">Ship Status</th>
                      <th className="px-6 py-4 w-48">Order Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                    {(stats?.recent_orders ?? []).map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4.5 font-bold text-[#0FA86E] hover:underline cursor-pointer">
                          {o.order_number}
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 leading-tight">{o.customer_name}</span>
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase mt-1">Model Super</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black border uppercase tracking-wider ${o.order_type === 'b2b'
                            ? 'bg-purple-50 border-purple-100 text-purple-700'
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`}>
                            {o.order_type}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right font-black text-gray-900">
                          {fmt(o.total_amount)}
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`inline-flex w-24 justify-center py-1 rounded-sm text-[10px] font-black border uppercase tracking-wider ${STATUS_COLORS[o.status as OrderStatus]}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-gray-400 font-bold">
                          {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="block md:hidden divide-y divide-gray-100">
                {(stats?.recent_orders ?? []).map((o) => (
                  <div key={o.id} className="p-5 bg-white hover:bg-gray-50 transition-all flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#0FA86E]">{o.order_number}</span>
                      <span className={`inline-flex w-22 justify-center py-1 rounded-sm text-[9px] font-black border uppercase tracking-wider ${STATUS_COLORS[o.status as OrderStatus]}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400 font-bold">
                      <span className="text-gray-700 font-extrabold">{o.customer_name}</span>
                      <span>{new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-2.5 mt-1.5">
                      <span className="font-black text-gray-900">{fmt(o.total_amount)}</span>
                      <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black border uppercase tracking-wider ${o.order_type === 'b2b'
                        ? 'bg-purple-50 border-purple-100 text-purple-700'
                        : 'bg-blue-50 border-blue-100 text-blue-700'
                        }`}>
                        {o.order_type}
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
