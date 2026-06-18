import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminOrder, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import ConditionBadge from '../components/ui/ConditionBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useAdminAuthStore from '../store/adminAuthStore';
import type { OrderStatus } from '../types';
import { ArrowLeft, ClipboardList, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 border-amber-100 text-amber-700',
  confirmed: 'bg-blue-50 border-blue-100 text-blue-700',
  processing: 'bg-purple-50 border-purple-100 text-purple-700',
  shipped: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  delivered: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-50 border-rose-100 text-rose-700',
  refunded: 'bg-gray-50 border-gray-100 text-gray-700',
};

const ALL_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { admin } = useAdminAuthStore();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatusMutation = useUpdateOrderStatus();

  const canUpdateStatus = admin?.role === 'owner' || admin?.role === 'manager';

  const handleStatusChange = async (status: OrderStatus) => {
    if (!id) return;
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm font-bold text-gray-500">Order not found.</p>
        <button onClick={() => navigate('/orders')} className="mt-3 text-[#0FA86E] hover:underline font-bold text-xs">
          Back to orders
        </button>
      </div>
    );
  }

  const totalMrp = parseFloat(String(order.total_mrp || 0));
  const totalSellingPrice = parseFloat(String(order.total_selling_price || 0));
  const savings = parseFloat(String(order.total_savings || 0));

  return (
    <div className="min-h-full bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-700 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <Link to="/orders" className="hover:text-[#0FA86E]">Manage Orders</Link>
              <span>&gt;</span>
              <span className="text-[#0FA86E]">Order Details</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">
              Order #{order.order_number ?? String(order.id).slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-0.5 rounded-sm text-[9px] font-black border uppercase tracking-wider ${STATUS_COLORS[order.status] || 'bg-gray-50 border-gray-100 text-gray-400'}`}>
              {order.status}
            </span>
            <span className={`px-2.5 py-0.5 rounded-sm text-[9px] font-black border uppercase tracking-wider ${
              order.order_type === 'b2b' ? 'bg-purple-50 border-purple-100 text-purple-700' : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              {order.order_type.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Items & Price Summary */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Order Items Table */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-[#F4F9F4]/30">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#0FA86E]" />
                  Order Items ({order.items.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#F4F9F4]/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Condition</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900">{item.product_name}</div>
                          <div className="text-[10px] font-bold font-mono text-gray-400 mt-0.5">SKU: {item.product_sku}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <ConditionBadge condition={item.condition} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-600">₹{item.unit_price.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-right font-black text-gray-900">₹{item.total_price.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-5">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Price Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-gray-600 font-bold">
                  <span>Subtotal (MRP)</span>
                  <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-[#0FA86E] font-bold">
                    <span>Total Savings</span>
                    <span>-₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {(order.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-[#0FA86E] font-bold">
                    <span>Additional Discount</span>
                    <span>-₹{(order.discount_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-gray-950 pt-3 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span>₹{totalSellingPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Info & Status Action */}
          <div className="space-y-4">
            
            {/* Customer Details Card */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-5">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Customer Details</h3>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-gray-900">{order.customer_name}</p>
                <p className="text-gray-400 font-bold">{order.customer_email}</p>
              </div>

              {order.shipping_address && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Shipping Address</p>
                  <div className="text-xs text-gray-600 space-y-1 font-bold">
                    <p className="text-gray-900">{order.shipping_address.name}</p>
                    <p>{order.shipping_address.line1}</p>
                    {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                    <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                    <p>{order.shipping_address.pincode}</p>
                    <p className="text-[#0FA86E] font-black mt-1">{order.shipping_address.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Update Card */}
            {canUpdateStatus && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-5">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-4">Update Order Status</h3>
                <select
                  value={order.status}
                  onChange={(e) => void handleStatusChange(e.target.value as OrderStatus)}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] transition-all bg-white cursor-pointer"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                {updateStatusMutation.isPending && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0FA86E]" />
                    <span>Updating status...</span>
                  </div>
                )}
              </div>
            )}

            {/* Admin/User Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-5">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3">Order Notes</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
