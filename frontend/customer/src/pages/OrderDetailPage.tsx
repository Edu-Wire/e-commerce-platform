import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConditionBadge from '../components/ui/ConditionBadge';
import type { OrderStatus, PaymentStatus } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const orderStatusConfig: Record<OrderStatus, { label: string; classes: string; step: number }> = {
  pending: { label: 'Placed', classes: 'bg-green-50 text-green-700 border border-green-200', step: 1 },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-50 text-blue-700 border border-blue-200', step: 2 },
  processing: { label: 'Processing', classes: 'bg-purple-50 text-purple-700 border border-purple-200', step: 2 },
  shipped: { label: 'Shipped', classes: 'bg-indigo-50 text-indigo-700 border border-indigo-200', step: 3 },
  delivered: { label: 'Delivered', classes: 'bg-green-50 text-green-700 border border-green-200', step: 4 },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-700 border border-red-200', step: 0 },
  refunded: { label: 'Refunded', classes: 'bg-gray-50 text-gray-700 border border-gray-200', step: 0 }
};

const trackingSteps = [
  { label: 'Order Placed', desc: 'Order placed successfully' },
  { label: 'Confirmed', desc: 'Waiting for seller confirmation' },
  { label: 'Shipped', desc: 'Not yet shipped' },
  { label: 'Delivered', desc: 'Estimated delivery soon' }
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrder(id!);
  const { data: recommendationsData } = useProducts({ limit: 8 });

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
  const currentStep = status.step;
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  // Filter recommendations to avoid showing items already in the order
  const orderedProductIds = order.items.map(item => item.product_id);
  const recommendations = (recommendationsData?.data || [])
    .filter((p: any) => !orderedProductIds.includes(p.id))
    .slice(0, 5);

  return (
    <div className="bg-[#f8fafc] min-h-screen py-6 md:py-10 font-sans text-[#0f1111]">
      <div className="max-w-[1200px] mx-auto px-4">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[13px] text-gray-500 mb-4">
          <Link to="/" className="hover:text-green-700 hover:underline">Home</Link>
          <span className="text-gray-400">›</span>
          <Link to="/orders" className="hover:text-green-700 hover:underline">My Orders</Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-700 font-medium">Order #{order.order_number}</span>
        </nav>

        {/* Top Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[24px] md:text-[28px] font-black text-gray-900 tracking-tight">
                Order #{order.order_number}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.classes}`}>
                ● {status.label}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-1.5 font-medium">
              Placed on {formattedDate} | {formattedTime}
            </p>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-[13px] font-bold rounded-xl shadow-sm transition-all text-gray-700">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Invoice
          </button>
        </div>

        {/* Horizontal Quick Summary Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Summary Box 1: Items */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 text-xl font-bold flex-shrink-0">
              🛍️
            </div>
            <div>
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Items</p>
              <p className="text-[18px] font-black text-gray-900">{totalQty}</p>
            </div>
          </div>

          {/* Summary Box 2: Subtotal */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold flex-shrink-0">
              📦
            </div>
            <div>
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Subtotal</p>
              <p className="text-[18px] font-black text-gray-900">{fmt(order.subtotal_mrp)}</p>
            </div>
          </div>

          {/* Summary Box 3: Discount */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-xl font-bold flex-shrink-0">
              🏷️
            </div>
            <div>
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Discount</p>
              <p className="text-[18px] font-black text-red-500">- {fmt(order.discount_amount)}</p>
            </div>
          </div>

          {/* Summary Box 4: Total Paid */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-700 text-xl font-bold flex-shrink-0">
              💳
            </div>
            <div>
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Total Paid</p>
              <p className="text-[18px] font-black text-green-700">{fmt(order.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Main 2-Column Details Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* Left Column: Items and Payment Details */}
          <div className="space-y-6">

            {/* Items Container */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
                <span className="text-lg">📦</span>
                <h2 className="text-[16px] font-bold text-gray-900">Items ({order.items.length})</h2>
              </div>
              <div className="p-6 divide-y divide-gray-100 space-y-6">
                {order.items.map(item => (
                  <div key={item.id} className="flex gap-4 md:gap-6 items-start pt-6 first:pt-0">
                    <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-150 p-2 flex items-center justify-center flex-shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="max-w-full max-h-full object-contain rounded-lg" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-black italic">ShopNow</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product_slug}`}
                        className="text-[15px] md:text-[16px] font-bold text-gray-900 hover:text-green-700 transition-colors leading-tight line-clamp-2"
                      >
                        {item.product_name}
                      </Link>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <ConditionBadge condition={item.condition} className="scale-90 origin-left" />
                        <span className="text-[12px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-bold">
                          FREE Delivery
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-[18px] font-black text-gray-900">{fmt(item.unit_price)}</span>
                        <span className="text-[12px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                          Qty: {item.quantity}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-500 font-medium">
                        <span>Sold by:</span>
                        <span className="font-bold text-green-700 hover:underline cursor-pointer flex items-center gap-0.5">
                          ShopNow
                          <svg className="w-3.5 h-3.5 text-green-600 fill-current" viewBox="0 0 20 20"><path d="M6.267 3.455a.75.75 0 00-.75-.75h-.007a.75.75 0 00-.75.75v.006c0 .414-.336.75-.75.75H4a.75.75 0 00-.75.75v.007c0 .414-.336.75-.75.75h-.006a.75.75 0 00-.75.75v.006c0 .414-.336.75-.75.75H.75A.75.75 0 000 7.75v.007c0 .414.336.75.75.75h.006a.75.75 0 00.75.75v.006c0 .414.336.75.75.75H3a.75.75 0 00.75-.75v-.007c0-.414.336-.75.75-.75h.007a.75.75 0 00.75-.75v-.006c0-.414.336-.75.75-.75h1.25a.75.75 0 00.75-.75v-.007c0-.414.336-.75.75-.75z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to={`/product/${item.product_slug}`}
                          className="bg-[#FFD814] hover:bg-[#F7CA00] text-[12px] font-bold px-4 py-2 rounded-xl border border-[#FCD200] shadow-sm text-center transition-colors inline-block"
                        >
                          Buy it again
                        </Link>
                        {item.product_slug && (
                          <Link
                            to={`/product/${item.product_slug}#reviews`}
                            className="bg-white hover:bg-gray-50 text-[12px] font-bold px-4 py-2 rounded-xl border border-gray-300 shadow-sm text-center transition-colors inline-block text-gray-700"
                          >
                            Write a product review
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details Container */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
                <span className="text-lg">💳</span>
                <h2 className="text-[16px] font-bold text-gray-900">Payment Details</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                  <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wider mb-2">Payment Method</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-lg font-bold">
                      💵
                    </div>
                    <div>
                      <p className="text-[15px] font-bold capitalize text-gray-800">
                        {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                      </p>
                      <span className="inline-block mt-1 text-[11px] bg-green-50 text-green-700 px-2 py-0.5 border border-green-150 rounded font-bold uppercase">
                        {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wider mb-2">Price Details</p>
                  <div className="flex justify-between text-[14px] text-gray-600">
                    <span>Item(s) Subtotal:</span>
                    <span className="font-bold text-gray-800">{fmt(order.subtotal_mrp)}</span>
                  </div>
                  <div className="flex justify-between text-[14px] text-gray-600">
                    <span>Shipping:</span>
                    <span className="font-bold text-green-700">FREE</span>
                  </div>
                  <div className="flex justify-between text-[14px] text-gray-600">
                    <span>Promotion Applied:</span>
                    <span className="font-bold text-red-500">- {fmt(order.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[16px] font-black text-gray-900 pt-3 border-t border-gray-150">
                    <span>Grand Total:</span>
                    <span className="text-green-700">{fmt(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Status Timeline, Shipping Address, Help */}
          <div className="space-y-6">

            {/* Order Status Stepper Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-[16px] font-bold text-gray-900 mb-6">Order Status</h3>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                {trackingSteps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isCompleted = currentStep >= stepNum;
                  const isCurrent = currentStep === stepNum;

                  return (
                    <div key={step.label} className="flex gap-4 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-300'
                        }`}>
                        {isCompleted ? '✓' : stepNum}
                      </div>
                      <div>
                        <p className={`text-[14px] font-bold ${isCompleted ? 'text-green-700' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[12px] text-gray-500">
                          {isCompleted && idx === 0 ? `${formattedDate}, ${formattedTime}` : step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Alert Banner */}
              <div className="mt-6 bg-green-50 border border-green-150 rounded-xl p-4 flex items-start gap-3">
                <span className="text-lg">🔔</span>
                <p className="text-[12px] text-green-800 font-medium leading-relaxed">
                  We will notify you when your order status updates.
                </p>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-gray-900">📍 Delivery Address</h3>
                <button className="text-[13px] text-green-700 hover:text-green-800 font-bold hover:underline">
                  Edit
                </button>
              </div>

              <div className="text-[14px] text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">{order.shipping_address.name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                <p>{order.shipping_address.country}</p>
                <p className="pt-2 text-[12px] text-gray-400 font-bold uppercase tracking-wider">
                  Phone: {order.shipping_address.phone}
                </p>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <span className="text-2xl block mb-2">🎧</span>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">Need Help?</h3>
              <p className="text-[13px] text-gray-500 mb-4">
                We are here to help you with your order.
              </p>
              <button
                onClick={() => navigate('/customer-service')}
                className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-[13px] font-bold rounded-xl shadow-sm text-gray-700 transition-all"
              >
                Chat with Support
              </button>
            </div>

          </div>
        </div>

        {/* You Might Also Like Section */}
        {recommendations.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] md:text-[20px] font-black text-gray-900 tracking-tight">
                ✨ You might also like
              </h3>
              <Link to="/category/all" className="text-[13px] text-green-700 hover:underline font-bold">
                View more ›
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recommendations.map((p: any) => {
                let pImage = null;
                if (p.images) {
                  const parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                  if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    const first = parsedImages[0];
                    pImage = (first && typeof first === 'object' && first.url) ? first.url : first;
                  }
                }

                return (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug}`}
                    className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col group"
                  >
                    <div className="h-32 bg-gray-50 rounded-xl p-2 flex items-center justify-center mb-3">
                      {pImage ? (
                        <img src={pImage} alt={p.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="text-gray-300 text-[11px] font-bold">ShopNow</div>
                      )}
                    </div>
                    <h4 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-green-700 mb-1 flex-1">
                      {p.name}
                    </h4>
                    <ConditionBadge condition={p.condition} className="scale-75 origin-left mb-2" />
                    <p className="text-[15px] font-black text-gray-900">{fmt(parseFloat(p.selling_price))}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
