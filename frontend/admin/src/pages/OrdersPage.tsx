import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminOrders, type OrderFilters } from '../hooks/useAdminOrders';
import Pagination from '../components/ui/Pagination';
import type { OrderStatus } from '../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
};

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, limit: 10 });
  const { data, isLoading } = useAdminOrders(filters);

  const orders = data?.data?.orders ?? [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Orders</h2>
        {meta && (
          <span className="text-sm text-gray-500">{meta.total} total orders</span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as OrderStatus | '', page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filters.order_type ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, order_type: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="b2c">B2C</option>
            <option value="b2b">B2B</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Customer', 'Type', 'Status', 'Total', 'Items', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : orders.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No orders found.</td>
                    </tr>
                  )
                  : orders.map((order, i) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">#{order.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{order.customer_name}</div>
                        <div className="text-xs text-gray-400">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.order_type === 'b2b' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {order.order_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ₹{parseFloat(String(order.total_selling_price ?? order.total_amount ?? 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{Array.isArray(order.items) ? order.items.length : 0} item{(Array.isArray(order.items) ? order.items.length : 0) !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {meta && meta.total_pages > 1 && (
          <div className="px-4 border-t border-gray-100">
            <Pagination
              page={filters.page ?? 1}
              totalPages={meta.total_pages}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
