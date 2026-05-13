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
    <div className="bg-white min-h-screen py-6 md:py-10 font-sans text-[#0f1111]">
      <div className="max-w-[1000px] mx-auto px-4">
        {/* Header Area */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-[14px] text-gray-600 mb-4">
            <Link to="/account" className="hover:text-[#c45500] hover:underline">Your Account</Link>
            <span className="text-gray-400">›</span>
            <Link to="/orders" className="hover:text-[#c45500] hover:underline">Your Orders</Link>
            <span className="text-gray-400">›</span>
            <span className="text-[#c45500]">Order Details</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-[28px] font-medium leading-tight">Order Details</h1>
              <p className="text-[14px] text-[#565959] mt-1">
                Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="mx-2">|</span>
                Order# {order.order_number}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[14px] text-[#007185]">
              <button className="hover:text-[#c45500] hover:underline">View or Print invoice</button>
            </div>
          </div>
        </div>

        {/* Info Grid (Address, Payment, Summary) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-300 rounded-lg overflow-hidden mb-8">
          {/* Shipping Address */}
          <div className="p-5 border-b md:border-b-0 md:border-r border-gray-300">
            <h3 className="text-[14px] font-bold mb-2">Shipping Address</h3>
            <div className="text-[14px] text-[#0f1111] space-y-0.5">
              <p className="font-medium">{order.shipping_address.name}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
              <p>{order.shipping_address.country}</p>
              <p className="pt-2">Phone: {order.shipping_address.phone}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-5 border-b md:border-b-0 md:border-r border-gray-300">
            <h3 className="text-[14px] font-bold mb-2">Payment Methods</h3>
            <div className="text-[14px] text-[#0f1111] flex items-center gap-2">
              <span className="capitalize">{order.payment_method ?? 'COD'}</span>
              {order.payment_status === 'paid' && (
                <span className="text-[12px] text-green-700 bg-green-50 px-1.5 py-0.5 border border-green-200 rounded-sm font-bold">PAID</span>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-5 bg-gray-50 md:bg-white">
            <h3 className="text-[14px] font-bold mb-2">Order Summary</h3>
            <div className="text-[14px] text-[#0f1111] space-y-1.5">
              <div className="flex justify-between">
                <span>Item(s) Subtotal:</span>
                <span>{fmt(order.subtotal_mrp)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{order.shipping_charge === 0 ? 'FREE' : fmt(order.shipping_charge)}</span>
              </div>
              <div className="flex justify-between text-[#c45500]">
                <span>Promotion Applied:</span>
                <span>- {fmt(order.discount_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-[16px] pt-2 border-t border-gray-200 mt-2">
                <span>Grand Total:</span>
                <span>{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking & Items Card */}
        <div className="border border-gray-300 rounded-lg overflow-hidden mb-8">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-300">
            <h2 className="text-[18px] font-bold">
              {order.status === 'delivered' ? 'Delivered' : status.label}
            </h2>
          </div>
          
          <div className="p-5 md:p-8">
            {/* Tracking Progress Bar */}
            {order.status !== 'cancelled' && (
              <div className="mb-10 max-w-2xl mx-auto">
                <div className="relative flex justify-between">
                  {trackingSteps.map((s, idx) => {
                    const stepNum = idx + 1;
                    const isDone = currentStep >= stepNum;
                    const isCurrent = currentStep === stepNum;
                    return (
                      <div key={s.label} className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                          isDone ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-300'
                        }`}>
                          {isDone ? '✓' : stepNum}
                        </div>
                        <p className={`text-[12px] mt-2 font-bold whitespace-nowrap ${isDone ? 'text-green-700' : 'text-gray-400'}`}>
                          {s.label}
                        </p>
                      </div>
                    );
                  })}
                  {/* Background Line */}
                  <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-200 -z-0" />
                  <div 
                    className="absolute top-4 left-0 h-[2px] bg-green-600 -z-0 transition-all duration-500" 
                    style={{ width: `${Math.max(0, (currentStep - 1) / (trackingSteps.length - 1) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-8">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-6 items-start">
                  <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 flex items-center justify-center border border-gray-200 rounded-sm p-2">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-gray-300 font-black italic">ShopNow</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${item.product_slug}`}
                      className="text-[14px] md:text-[16px] font-medium text-[#007185] hover:text-[#c45500] hover:underline leading-tight block mb-1"
                    >
                      {item.product_name}
                    </Link>
                    <ConditionBadge condition={item.condition} className="scale-90 origin-left mb-2" />
                    <p className="text-[14px] font-bold text-[#b12704]">{fmt(item.unit_price)}</p>
                    <p className="text-[13px] text-gray-600 mt-1">Quantity: {item.quantity}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="bg-[#FFD814] hover:bg-[#F7CA00] text-[12px] font-medium px-4 py-1.5 rounded-lg border border-[#FCD200] shadow-sm">
                        Buy it again
                      </button>
                      <button className="bg-white hover:bg-gray-50 text-[12px] font-medium px-4 py-1.5 rounded-lg border border-gray-300 shadow-sm">
                        Write a product review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-gray-50 px-5 py-4 border-t border-gray-300 flex items-center gap-4 text-[13px] text-[#007185]">
             <button className="hover:text-[#c45500] hover:underline">Track Package</button>
             <span className="text-gray-300">|</span>
             <button className="hover:text-[#c45500] hover:underline">Archive Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
