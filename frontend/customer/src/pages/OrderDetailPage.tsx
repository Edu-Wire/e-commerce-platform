import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConditionBadge from '../components/ui/ConditionBadge';
import type { OrderStatus, PaymentStatus } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const orderStatusConfig: Record<OrderStatus, { label: string; classes: string; step: number }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700', step: 1 },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-100 text-blue-700', step: 2 },
  processing: { label: 'Processing', classes: 'bg-purple-100 text-purple-700', step: 2 },
  shipped: { label: 'Shipped', classes: 'bg-indigo-100 text-indigo-700', step: 3 },
  delivered: { label: 'Delivered', classes: 'bg-green-100 text-green-700', step: 4 },
  cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700', step: 0 },
  refunded: { label: 'Refunded', classes: 'bg-gray-100 text-gray-700', step: 0 }
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'text-yellow-600' },
  paid: { label: 'Paid', classes: 'text-green-600' },
  failed: { label: 'Failed', classes: 'text-red-600' },
  refunded: { label: 'Refunded', classes: 'text-gray-600' }
};

const trackingSteps = [
  { label: 'Order Placed', icon: '📋' },
  { label: 'Confirmed', icon: '✅' },
  { label: 'Shipped', icon: '🚚' },
  { label: 'Delivered', icon: '📦' }
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id!);

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />;

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Order not found</h2>
        <Link to="/orders" className="text-primary-600 hover:underline">Back to Orders</Link>
      </div>
    );
  }

  const status = orderStatusConfig[order.status] ?? orderStatusConfig.pending;
  const paymentStatus = paymentStatusConfig[order.payment_status] ?? paymentStatusConfig.pending;
  const currentStep = status.step;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/orders" className="hover:text-primary-600">My Orders</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">#{order.order_number}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${status.classes}`}>
          {status.label}
        </span>
      </div>

      {/* Tracking Progress */}
      {order.status !== 'cancelled' && order.status !== 'refunded' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-5">Order Tracking</h2>
          <div className="flex items-center justify-between">
            {trackingSteps.map((s, idx) => {
              const stepNum = idx + 1;
              const isDone = currentStep >= stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center relative">
                  {idx < trackingSteps.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                    isDone ? 'bg-green-100' : isCurrent ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    {s.icon}
                  </div>
                  <p className={`text-xs mt-2 text-center font-medium ${isDone ? 'text-green-700' : 'text-gray-400'}`}>
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items + Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Items ({order.items.length})</h2>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_slug}`}
                      className="text-sm font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                    <ConditionBadge condition={item.condition} className="mt-1" />
                  </div>
                  <div className="text-right text-sm flex-shrink-0">
                    <p className="font-bold text-gray-900">{fmt(item.total_price)}</p>
                    <p className="text-gray-400">{fmt(item.unit_price)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Price Details</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal MRP</span>
                <span>{fmt(order.subtotal_mrp)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>− {fmt(order.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shipping_charge === 0 ? <span className="text-green-600">FREE</span> : fmt(order.shipping_charge)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Address + Payment */}
        <div className="space-y-5">
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-3">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">{order.shipping_address.name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-3">Payment</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium text-gray-800 capitalize">{order.payment_method ?? 'COD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${paymentStatus.classes}`}>{paymentStatus.label}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-2">Order Notes</h2>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
