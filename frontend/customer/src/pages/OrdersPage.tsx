import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyOrders } from '../hooks/useOrders';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
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

export default function OrdersPage() {
  const navigate = useNavigate();
  const { data: allOrders, isLoading, error } = useMyOrders();
  const [activeTab, setActiveTab] = useState('Orders');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">Failed to load orders. Please try again.</p>
      </div>
    );
  }

  // Filter and search logic
  const filteredOrders = (allOrders || []).filter(order => {
    const isAuction = (order as any).notes === 'AUCTION_WIN';
    
    // Tab filters
    if (activeTab === 'Orders' && isAuction) return false;
    if (activeTab === 'Auction Wins' && !isAuction) return false;
    if (activeTab === 'Cancelled' && order.status !== 'cancelled') return false;
    if (activeTab === 'Not Yet Shipped' && !['pending', 'confirmed', 'processing'].includes(order.status)) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.order_number?.toLowerCase().includes(q) || String(order.id).includes(q);
      const matchItems = order.items.some(item => item.product_name.toLowerCase().includes(q));
      const matchAddress = order.shipping_address.name.toLowerCase().includes(q);
      return matchOrderNum || matchItems || matchAddress;
    }

    return true;
  });

  return (
    <div className="bg-[#f8fafc] min-h-screen py-6 md:py-10 font-sans text-[#0f1111]">
      <div className="max-w-[1000px] mx-auto px-4">
        
        {/* Breadcrumb and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
              <Link to="/account" className="hover:text-green-700 hover:underline">Your Account</Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-700 font-medium">Your Orders</span>
            </nav>
            <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Your Orders</h1>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-[300px]">
              <input 
                type="text" 
                placeholder="Search all orders" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none text-[13px] transition-all bg-white"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
          {['Orders', 'Auction Wins', 'Buy Again', 'Not Yet Shipped', 'Cancelled'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 text-[14px] font-bold whitespace-nowrap transition-all relative ${
                tab === activeTab 
                  ? 'text-green-700 font-black after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-green-700' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders Cards Listing */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-sm max-w-lg mx-auto">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6 text-[14px]">Looks like there are no matching orders in this category.</p>
            <Link
              to="/category/all"
              className="inline-block px-8 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-sm transition-colors text-[14px]"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => {
              const status = orderStatusConfig[order.status] ?? orderStatusConfig.pending;
              const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              });
              const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Card Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-y-3">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
                      <div>
                        <span className="text-gray-400 uppercase text-[11px] block font-bold tracking-wider">Placed On</span>
                        <span className="font-bold text-gray-700">{date}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 uppercase text-[11px] block font-bold tracking-wider">Total Paid</span>
                        <span className="font-bold text-green-700">{fmt(order.total_amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 uppercase text-[11px] block font-bold tracking-wider">Ship To</span>
                        <span className="font-bold text-gray-700">{order.shipping_address.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 md:justify-end">
                        <span className="text-gray-400 uppercase text-[11px] font-bold tracking-wider">Order #{order.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.classes}`}>
                          ● {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-end mt-1 text-[13px] font-bold text-green-700">
                        <Link to={`/orders/${order.id}`} className="hover:underline">View Details</Link>
                        <span className="text-gray-300">|</span>
                        <button className="hover:underline text-gray-500">Invoice</button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body - Grid with Items List (Left) and Mini Tracker (Right) */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-center">
                    
                    {/* Items List */}
                    <div className="divide-y divide-gray-100 space-y-4">
                      {order.items.map(item => (
                        <div key={item.id} className="flex gap-4 items-start pt-4 first:pt-0">
                          <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-100 p-1 flex items-center justify-center flex-shrink-0">
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_name} className="max-w-full max-h-full object-contain rounded-md" />
                            ) : (
                              <div className="text-gray-300 font-bold text-[9px] italic">ShopNow</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/product/${item.product_slug}`}
                              className="text-[14px] font-bold text-gray-900 hover:text-green-700 transition-colors line-clamp-1"
                            >
                              {item.product_name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <ConditionBadge condition={item.condition} className="scale-75 origin-left" />
                              <span className="text-[11px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                                Qty: {item.quantity}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Link 
                                to={`/product/${item.product_slug}`}
                                className="bg-[#FFD814] hover:bg-[#F7CA00] text-[11px] font-bold px-3 py-1 rounded-lg border border-[#FCD200] shadow-sm transition-colors text-gray-900"
                              >
                                Buy it again
                              </Link>
                              {item.product_slug && (
                                <Link 
                                  to={`/product/${item.product_slug}#reviews`}
                                  className="bg-white hover:bg-gray-50 text-[11px] font-bold px-3 py-1 rounded-lg border border-gray-300 shadow-sm transition-colors text-gray-700"
                                >
                                  Review
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right Info: Status Description & Actions */}
                    <div className="border-t md:border-t-0 md:border-l border-gray-150 pt-4 md:pt-0 md:pl-6 space-y-4">
                      <div>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Status Details</p>
                        <p className="text-[13px] font-bold text-gray-700 mt-0.5">
                          {order.status === 'delivered' ? 'Item was delivered' : status.label}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {order.status === 'pending' ? 'Estimated delivery soon' : 'Status updated recently'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() =>
                              (order as { notes?: string }).notes === 'AUCTION_WIN'
                                ? navigate('/live-auction/payments')
                                : navigate(`/orders/${order.id}`)
                            }
                            className="w-full py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-sm text-center text-[12px] transition-colors"
                          >
                            Pay Now
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl shadow-sm text-center text-[12px] transition-all"
                        >
                          Track Package
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
