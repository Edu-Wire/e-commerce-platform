import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import StatsCard from '../components/ui/StatsCard';
import type { ProductCondition, OrderStatus } from '../types';

const CONDITION_COLORS: Record<ProductCondition, string> = {
  new: '#22c55e',
  new_with_minor_damage: '#f59e0b',
  new_with_defect: '#f97316',
};

const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: 'New',
  new_with_minor_damage: 'Minor Damage',
  new_with_defect: 'Defect',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-7 bg-gray-200 rounded w-28" />
        </div>
        <div className="w-11 h-11 bg-gray-200 rounded-xl" />
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
      <div className="flex items-center justify-center h-64 text-gray-500">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatsCard title="Total Products" value={stats?.total_products ?? 0} icon="📦" iconBg="bg-blue-100" />
            <StatsCard title="Active Products" value={stats?.active_products ?? 0} icon="✅" iconBg="bg-green-100" />
            <StatsCard title="Low Stock" value={stats?.low_stock_items ?? 0} icon="⚠️" iconBg="bg-amber-100" />
            <StatsCard title="Today's Orders" value={stats?.todays_orders ?? 0} icon="📋" iconBg="bg-purple-100" />
            <StatsCard title="Total Revenue" value={fmt(stats?.total_revenue ?? 0)} icon="💰" iconBg="bg-emerald-100" />
            <StatsCard title="Total Customers" value={stats?.total_customers ?? 0} icon="👥" iconBg="bg-cyan-100" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Orders — Last 30 Days</h2>
          {isLoading ? (
            <div className="h-56 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats?.orders_last_30_days ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name="Orders" />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue ₹" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Condition Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Condition Breakdown</h2>
          {isLoading ? (
            <div className="h-56 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={(stats?.condition_breakdown ?? []).map((c) => ({
                    name: CONDITION_LABELS[c.condition] ?? c.condition,
                    value: c.count,
                    condition: c.condition,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(stats?.condition_breakdown ?? []).map((c, i) => (
                    <Cell key={i} fill={CONDITION_COLORS[c.condition]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sales by Category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Sales by Category</h2>
        {isLoading ? (
          <div className="h-56 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.sales_by_category ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Orders</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order #', 'Customer', 'Type', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stats?.recent_orders ?? []).map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs text-blue-600">{o.order_number}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{o.customer_name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.order_type === 'b2b' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {o.order_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-gray-900">{fmt(o.total_amount)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString('en-IN')}
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
