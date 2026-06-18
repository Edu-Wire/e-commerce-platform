import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Search, 
  Download, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  User,
  RefreshCw,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useAdminOrders, type OrderFilters } from '../hooks/useAdminOrders';
import Pagination from '../components/ui/Pagination';
import type { OrderStatus } from '../types';

// Amazon-style status options for horizontal navigation tabs
const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  processing: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  shipped: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  refunded: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_COLORS[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<OrderFilters>(() => {
    const status = (searchParams.get('status') as OrderStatus | '') || '';
    return { page: 1, limit: 10, status, order_type: '' };
  });
  const [searchField, setSearchField] = useState<'all' | 'id' | 'name' | 'email'>('all');
  const [searchVal, setSearchVal] = useState('');

  // Sync when URL changes (e.g. dashboard click-through)
  useEffect(() => {
    const status = (searchParams.get('status') as OrderStatus | '') || '';
    setFilters(f => ({ ...f, status, page: 1 }));
  }, [searchParams]);
  
  const { data, isLoading, refetch, isFetching } = useAdminOrders({
    ...filters,
    search: searchVal
  });

  const orders = data?.data?.orders ?? [];
  const meta = data?.data?.meta;

  // Dynamic KPI Stats calculated from currently filtered list
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const inProgressOrders = orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length;
  const totalVolume = orders.reduce((sum, o) => sum + parseFloat(String(o.total_selling_price ?? o.total_amount ?? 0)), 0);

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }
    try {
      const headers = ['Order #', 'Customer Name', 'Customer Email', 'Order Type', 'Status', 'Total Price', 'Item Count', 'Date'];
      const rows = orders.map(o => [
        o.order_number ?? o.id,
        o.customer_name,
        o.customer_email,
        o.order_type.toUpperCase(),
        o.status.toUpperCase(),
        o.total_selling_price ?? o.total_amount ?? 0,
        o.item_count ?? 0,
        new Date(o.created_at).toLocaleDateString('en-IN')
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Orders exported successfully');
    } catch {
      toast.error('Failed to export orders');
    }
  };

  const handleResetFilters = () => {
    setSearchVal('');
    setFilters({ page: 1, limit: 10, status: '', order_type: '' });
  };

  const handleStatusTabChange = (val: OrderStatus | '') => {
    setFilters(f => ({ ...f, status: val, page: 1 }));
  };

  return (
    <div className="min-h-full bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-700 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <span>&gt;</span>
              <span className="text-[#0FA86E]">Manage Orders</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">Manage Orders</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              View and manage transactions, fulfillments, and delivery statuses.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => void refetch()}
              disabled={isLoading || isFetching}
              className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#0FA86E] rounded-md shadow-xs disabled:opacity-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>


        {/* Dynamic KPI Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white py-5 px-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Sales (Page)</span>
              <p className="text-xl font-black text-[#0FA86E] mt-0.5">₹{totalVolume.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-[#0FA86E]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-white py-5 px-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Orders</span>
              <p className="text-xl font-black text-gray-900 mt-0.5">{meta?.total ?? orders.length}</p>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-[#0FA86E]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-white py-5 px-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Pending Attention</span>
              <p className="text-xl font-black text-gray-900 mt-0.5">{isLoading ? '...' : pendingOrders}</p>
            </div>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-white py-5 px-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">In Progress</span>
              <p className="text-xl font-black text-gray-900 mt-0.5">{isLoading ? '...' : inProgressOrders}</p>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-[#0FA86E]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Status Navigation Tabs */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none bg-[#F4F9F4]/30">
            {STATUS_TABS.map((tab) => {
              const isActive = filters.status === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleStatusTabChange(tab.value)}
                  className={`px-5 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px outline-none ${
                    isActive 
                      ? 'border-[#0FA86E] text-[#0FA86E] bg-white font-extrabold' 
                      : 'border-transparent text-gray-500 hover:text-[#0FA86E] hover:bg-gray-50/50'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'pending' && pendingOrders > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full">
                      {pendingOrders}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Advanced Filters & Search Bar */}
          <div className="p-4 bg-white border-b border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex border border-gray-200 rounded-md overflow-hidden bg-white focus-within:ring-1 focus-within:ring-[#0FA86E] focus-within:border-[#0FA86E]">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as any)}
                  className="bg-gray-50 px-3 py-1.5 text-xs text-gray-600 outline-none border-r border-gray-200 font-bold cursor-pointer"
                >
                  <option value="all">All Fields</option>
                  <option value="id">Order ID</option>
                  <option value="name">Customer Name</option>
                  <option value="email">Email Address</option>
                </select>
                
                <div className="relative flex-1 min-w-[200px] bg-white flex items-center">
                  <input
                    type="text"
                    placeholder="Search by ID, name, email..."
                    value={searchVal}
                    onChange={(e) => {
                      setSearchVal(e.target.value);
                      setFilters(f => ({ ...f, page: 1 }));
                    }}
                    className="w-full pl-3 pr-8 py-1.5 text-xs text-gray-900 outline-none bg-white"
                  />
                  <Search className="absolute right-2.5 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              
              <select
                value={filters.order_type ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, order_type: e.target.value, page: 1 }))}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-600 outline-none focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] cursor-pointer"
              >
                <option value="">All Fulfillment Types</option>
                <option value="b2c">B2C Storefront</option>
                <option value="b2b">B2B Business Store</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              {(searchVal || filters.status || filters.order_type) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#0FA86E] hover:text-[#0d9561] hover:underline font-bold"
                >
                  Clear all search parameters
                </button>
              )}
              <span className="text-xs text-gray-400 font-bold">
                {meta?.total ?? orders.length} results
              </span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F9F4]/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-4 w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-[#0FA86E] focus:ring-[#0FA86E]" />
                  </th>
                  <th className="px-4 py-4 w-48">Order Details</th>
                  <th className="px-4 py-4 w-56">Customer Info</th>
                  <th className="px-4 py-4">Product Name & SKU</th>
                  <th className="px-4 py-4 text-center w-28">Type</th>
                  <th className="px-4 py-4 text-center w-36">Status</th>
                  <th className="px-4 py-4 text-right w-36">Total Pricing</th>
                  <th className="px-4 py-4 text-right w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-5">
                          <div className="h-4 bg-gray-50 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 bg-[#F4F9F4] rounded-md flex items-center justify-center text-[#0FA86E] mb-3 border border-gray-100 shadow-xs">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">No matching orders</h3>
                        <p className="text-[11px] text-gray-400 font-medium mt-1">
                          We couldn't find any orders matching your selected tab or search criteria.
                        </p>
                        {(searchVal || filters.status || filters.order_type) && (
                          <button
                            onClick={handleResetFilters}
                            className="mt-4 px-4 py-2 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold rounded-md shadow-xs transition-colors"
                          >
                            Reset filters and search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs"
                      >
                        <td className="px-4 py-4 align-top">
                          <input type="checkbox" className="rounded border-gray-300 text-[#0FA86E] focus:ring-[#0FA86E]" />
                        </td>
                        <td className="px-4 py-4 align-top space-y-1">
                          <div>
                            <Link 
                              to={`/orders/${order.id}`}
                              className="font-mono font-bold text-[#0FA86E] hover:text-[#0d9561] hover:underline"
                            >
                              #{order.order_number ?? String(order.id).slice(0, 8).toUpperCase()}
                            </Link>
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold">
                            Placed: {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold">
                            Time: {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top space-y-0.5">
                          <div className="font-bold text-gray-950 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {order.customer_name}
                          </div>
                          <div className="text-gray-400 text-[11px] truncate max-w-[200px]" title={order.customer_email}>
                            {order.customer_email}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top space-y-2">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 border-b border-dashed border-gray-100 last:border-b-0 pb-1.5 last:pb-0">
                                <div className="w-7 h-7 bg-emerald-50 border border-emerald-100 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-black text-[#0FA86E]">
                                  {item.quantity}x
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 truncate max-w-[240px]" title={item.name || item.product_name || item.sku}>
                                    {item.name || item.product_name || 'Product'}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-bold font-mono">
                                    SKU: {item.sku} | ₹{parseFloat(String(item.selling_price || 0)).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">No item list loaded</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top text-center">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black border ${
                            order.order_type === 'b2b' 
                              ? 'bg-purple-50 border-purple-100 text-purple-700' 
                              : 'bg-blue-50 border-blue-100 text-blue-700'
                          }`}>
                            {order.order_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-center">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-4 align-top text-right space-y-1">
                          <div className="font-black text-gray-950">
                            ₹{parseFloat(String(order.total_selling_price ?? order.total_amount ?? 0)).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold">
                            {order.item_count || 0} {order.item_count === 1 ? 'item' : 'items'}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-right">
                          <Link 
                            to={`/orders/${order.id}`}
                            className="inline-block w-full text-center px-3 py-1.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white rounded-md text-[11px] font-bold shadow-xs transition-colors"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-50 rounded w-20" />
                    <div className="h-4 bg-gray-50 rounded w-16" />
                  </div>
                  <div className="h-3 bg-gray-50 rounded w-32" />
                  <div className="h-4 bg-gray-50 rounded w-24" />
                </div>
              ))
            ) : orders.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-xs text-gray-400">No orders found matching filters.</p>
              </div>
            ) : (
              orders.map((order) => {
                return (
                  <div 
                    key={order.id} 
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="p-4 bg-white hover:bg-gray-50 active:bg-gray-100/50 transition-all flex flex-col gap-2 cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0FA86E]">
                        #{order.order_number ?? String(order.id).slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {order.customer_name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">{order.customer_email}</div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-100 my-1 space-y-1">
                        {order.items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] text-gray-600">
                            <span className="truncate max-w-[180px] font-bold">{item.name || item.product_name || 'Product'}</span>
                            <span className="font-black text-[#0FA86E]">{item.quantity}x</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-[9px] text-gray-400 italic">+{order.items.length - 2} more items</div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black border ${
                          order.order_type === 'b2b' 
                            ? 'bg-purple-50 border-purple-100 text-purple-700' 
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                        }`}>
                          {order.order_type.toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-right">
                        <div className="font-black text-gray-900">
                          ₹{parseFloat(String(order.total_selling_price ?? order.total_amount ?? 0)).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[9px] text-gray-400 font-bold">
                          {order.item_count || 0} items
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          {meta && meta.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-[#F4F9F4]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <p className="text-xs text-gray-400 font-bold">
                Showing <span className="font-black text-gray-700">
                  {((filters.page ?? 1) - 1) * (filters.limit ?? 10) + 1}–{Math.min((filters.page ?? 1) * (filters.limit ?? 10), meta.total)}
                </span> of <span className="font-black text-gray-700">{meta.total}</span> orders
              </p>
              <Pagination
                page={filters.page ?? 1}
                totalPages={meta.total_pages}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

