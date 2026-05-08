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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <Link to="/category/all" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          Continue Shopping &rarr;
        </Link>
      </div>

      {!orders?.length ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="You haven't placed any orders. Start shopping!"
          action={
            <Link
              to="/category/all"
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700"
            >
              Shop Now
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.status] ?? statusConfig.pending;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-base">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.classes}`}>
                      {status.label}
                    </span>
                    <span className="font-bold text-gray-900">{fmt(order.total_amount)}</span>
                  </div>
                </div>

                {/* Item previews */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {order.items.slice(0, 4).map(item => (
                    <div key={item.id} className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          IMG
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    {' '}· {order.payment_method ?? 'COD'}
                  </p>
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
