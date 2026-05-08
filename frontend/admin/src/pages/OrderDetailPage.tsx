import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminOrder, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import ConditionBadge from '../components/ui/ConditionBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useAdminAuthStore from '../store/adminAuthStore';
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
        <p>Order not found.</p>
        <button onClick={() => navigate('/orders')} className="mt-3 text-blue-600 hover:underline text-sm">
          Back to orders
        </button>
      </div>
    );
  }

  const totalMrp = order.items.reduce((s, item) => s + item.unit_price * item.quantity, 0);
  const savings = totalMrp - order.total_amount + order.discount_amount;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/orders')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          ← Back to Orders
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Order {order.order_number}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              order.order_type === 'b2b' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {order.order_type.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Items + Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Order Items ({order.items.length})</h3>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Condition</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{item.product_name}</div>
                      <div className="text-xs font-mono text-gray-400">{item.product_sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ConditionBadge condition={item.condition} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-700">₹{item.unit_price.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{item.total_price.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Price Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (MRP)</span>
                <span>₹{totalMrp.toLocaleString('en-IN')}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Savings</span>
                  <span>-₹{savings.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Additional Discount</span>
                  <span>-₹{order.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Amount</span>
                <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Customer + Status */}
        <div className="space-y-5">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer</h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-gray-800">{order.customer_name}</p>
              <p className="text-gray-500">{order.customer_email}</p>
            </div>

            {order.shipping_address && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Shipping Address</p>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>{order.shipping_address.name}</p>
                  <p>{order.shipping_address.line1}</p>
                  {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                  <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                  <p>{order.shipping_address.pincode}</p>
                  <p className="font-medium">{order.shipping_address.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Update */}
          {canUpdateStatus && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>
              <select
                value={order.status}
                onChange={(e) => void handleStatusChange(e.target.value as OrderStatus)}
                disabled={updateStatusMutation.isPending}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {updateStatusMutation.isPending && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <LoadingSpinner size="sm" />
                  Updating...
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
