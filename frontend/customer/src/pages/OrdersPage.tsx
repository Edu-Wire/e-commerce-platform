import { Link } from 'react-router-dom';
import { useMyOrders } from '../hooks/useOrders';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import type { OrderStatus } from '../types';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', classes: 'bg-purple-100 text-purple-700' },
  shipped: { label: 'Shipped', classes: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', classes: 'bg-gray-100 text-gray-700' }
};

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useMyOrders();

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">Failed to load orders. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f2f2] min-h-screen py-6 md:py-10 font-sans text-[#0f1111]">
      <div className="max-w-[1000px] mx-auto px-4">
        {/* Breadcrumb / Title Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <nav className="flex items-center gap-2 text-[14px] text-gray-600 mb-2">
              <Link to="/account" className="hover:text-[#c45500] hover:underline">Your Account</Link>
              <span className="text-gray-400">›</span>
              <span className="text-[#c45500]">Your Orders</span>
            </nav>
            <h1 className="text-[28px] font-medium leading-tight">Your Orders</h1>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-[300px]">
              <input 
                type="text" 
                placeholder="Search all orders" 
                className="w-full pl-8 pr-4 py-1.5 border border-gray-400 rounded-lg shadow-sm focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none text-[13px]"
              />
              <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button className="bg-[#232f3e] text-white px-6 py-1.5 rounded-lg text-[13px] font-bold hover:bg-[#37475a] transition-colors shadow-sm">
              Search Orders
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
          {['Orders', 'Buy Again', 'Not Yet Shipped', 'Cancelled'].map((tab, i) => (
            <button 
              key={tab} 
              className={`pb-3 text-[14px] font-medium whitespace-nowrap transition-colors relative ${i === 0 ? 'text-[#0f1111] font-bold after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-[#e77600]' : 'text-[#565959] hover:text-[#0f1111]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {!orders?.length ? (
          <div className="bg-white p-10 rounded-lg border border-gray-200 text-center shadow-sm">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <Link
              to="/category/all"
              className="inline-block px-8 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-medium rounded-lg border border-[#FCD200] shadow-sm transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const status = statusConfig[order.status] ?? statusConfig.pending;
              const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              });

              return (
                <div key={order.id} className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Order Card Header */}
                  <div className="bg-[#f0f2f2] px-4 md:px-6 py-3 border-b border-gray-300 flex flex-wrap items-center justify-between gap-y-4">
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] text-[#565959] uppercase font-medium">Order Placed</span>
                        <span className="text-[14px] font-bold text-[#565959]">{date}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-[#565959] uppercase font-medium">Total</span>
                        <span className="text-[14px] font-bold text-[#565959]">{fmt(order.total_amount)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-[#565959] uppercase font-medium">Ship To</span>
                        <span className="text-[14px] font-bold text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer">
                          {order.shipping_address.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-[12px] text-[#565959] uppercase font-medium">Order # {order.order_number}</span>
                      <div className="flex items-center gap-2 text-[14px] text-[#007185]">
                        <Link to={`/orders/${order.id}`} className="hover:text-[#c45500] hover:underline">View order details</Link>
                        <span className="text-gray-300">|</span>
                        <span className="hover:text-[#c45500] hover:underline cursor-pointer">Invoice</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Card Body */}
                  <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-[1fr_250px] gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-[18px] font-bold ${order.status === 'delivered' ? 'text-green-700' : 'text-gray-900'}`}>
                          {status.label} {order.status === 'delivered' ? 'Wed, 13 May' : ''}
                        </span>
                      </div>

                      {order.items.map(item => (
                        <div key={item.id} className="flex gap-4 items-start">
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 p-2 flex items-center justify-center rounded-sm border border-gray-100 flex-shrink-0">
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_name} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">ShopNow</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/product/${item.product_slug}`}
                              className="text-[14px] md:text-[16px] font-medium text-[#007185] hover:text-[#c45500] hover:underline leading-tight line-clamp-2 mb-1"
                            >
                              {item.product_name}
                            </Link>
                            <p className="text-[12px] text-gray-500 mb-2">Return window closed on Jun 12, 2024</p>
                            <button className="flex items-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[13px] font-medium px-6 py-1.5 rounded-lg border border-[#FCD200] shadow-sm transition-colors mb-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Buy it again
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons Sidebar (Desktop) / Bottom (Mobile) */}
                    <div className="flex flex-col gap-2">
                      <button className="w-full py-1.5 text-[13px] font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        Track package
                      </button>
                      <button className="w-full py-1.5 text-[13px] font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        Return or replace items
                      </button>
                      <button className="w-full py-1.5 text-[13px] font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        Share gift receipt
                      </button>
                      <button className="w-full py-1.5 text-[13px] font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        Leave seller feedback
                      </button>
                      <button className="w-full py-1.5 text-[13px] font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        Write a product review
                      </button>
                    </div>
                  </div>

                  {/* Footer links for the card */}
                  <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-300 flex items-center justify-between text-[13px]">
                     <span className="text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer">Archive order</span>
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
