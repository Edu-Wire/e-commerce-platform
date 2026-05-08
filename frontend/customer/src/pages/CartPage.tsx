import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import ConditionBadge from '../components/ui/ConditionBadge';
import EmptyState from '../components/ui/EmptyState';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalMrp, totalPrice, totalSavings } = useCartStore();
  const customer = useAuthStore(s => s.customer);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!customer) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          action={
            <Link
              to="/category/all"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700"
            >
              Continue Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart ({items.length} item{items.length !== 1 ? 's' : ''})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
              {/* Image */}
              <Link to={`/product/${item.slug}`} className="flex-shrink-0">
                <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.slug}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2">{item.name}</h3>
                </Link>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">SKU: {item.sku}</p>
                <ConditionBadge condition={item.condition} />

                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-medium text-base"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock_quantity}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-medium text-base disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{fmt(item.price * item.quantity)}</p>
                    {item.mrp > item.price && (
                      <p className="text-xs text-gray-400 line-through">{fmt(item.mrp * item.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.product_id)}
                className="text-gray-400 hover:text-red-500 transition-colors self-start"
                aria-label="Remove item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <Link
            to="/category/all"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
          >
            &larr; Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal MRP</span>
                <span>{fmt(totalMrp())}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>− {fmt(totalSavings())}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{fmt(totalPrice())}</span>
              </div>
            </div>

            {totalSavings() > 0 && (
              <div className="mt-3 bg-green-50 text-green-700 text-sm font-medium rounded-xl px-3 py-2 text-center">
                You save {fmt(totalSavings())} on this order!
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="mt-5 w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors text-base"
            >
              Proceed to Checkout
            </button>

            {!customer && (
              <p className="text-xs text-gray-500 text-center mt-2">
                You'll be asked to log in before checkout
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
