import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMyOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
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

interface BulkItem {
  product_id: number;
  name: string;
  sku: string;
  b2b_price: number;
  selling_price: number;
  quantity: number;
}

export default function B2BDashboardPage() {
  const customer = useAuthStore(s => s.customer);
  const { data: orders } = useMyOrders();
  const { data: productsData } = useProducts({ limit: 20 });
  const addItem = useCartStore(s => s.addItem);

  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredProducts = productsData?.data.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const addBulkItem = (productId: number) => {
    const product = productsData?.data.find(p => p.id === productId);
    if (!product) return;
    if (bulkItems.find(i => i.product_id === productId)) {
      toast.error('Product already in bulk order');
      return;
    }
    setBulkItems(prev => [...prev, {
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      b2b_price: product.b2b_price ?? product.selling_price,
      selling_price: product.selling_price,
      quantity: product.b2b_min_quantity ?? 1
    }]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const updateBulkQty = (product_id: number, qty: number) => {
    if (qty <= 0) {
      setBulkItems(prev => prev.filter(i => i.product_id !== product_id));
      return;
    }
    setBulkItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity: qty } : i));
  };

  const bulkTotal = bulkItems.reduce((sum, i) => sum + i.b2b_price * i.quantity, 0);

  const handleAddBulkToCart = () => {
    if (!bulkItems.length) {
      toast.error('Add at least one product to the bulk order');
      return;
    }
    bulkItems.forEach(item => {
      addItem({
        product_id: item.product_id,
        name: item.name,
        slug: item.sku,
        mrp: item.selling_price,
        price: item.b2b_price,
        quantity: item.quantity,
        condition: 'new',
        sku: item.sku,
        stock_quantity: 9999
      });
    });
    toast.success(`${bulkItems.length} items added to cart at B2B pricing!`);
    setBulkItems([]);
  };

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Please log in to access the B2B Dashboard</h2>
        <Link to="/login" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">
          Log In
        </Link>
      </div>
    );
  }

  if (customer.customer_type !== 'b2b') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 inline-block">
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">B2B Portal</h2>
          <p className="text-gray-500 mb-6">This portal is for registered business customers only.</p>
          <p className="text-gray-600 text-sm mb-6">Create a B2B account to access wholesale pricing and bulk order features.</p>
          <Link to="/register" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700">
            Register as B2B
          </Link>
        </div>
      </div>
    );
  }

  const b2bOrders = orders ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">B2B Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {customer.company_name ?? customer.name}</p>
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Company</p>
          <p className="font-bold text-gray-900 text-lg">{customer.company_name ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">GST Number</p>
          <p className="font-mono font-bold text-gray-900">{customer.gst_number ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Total Orders</p>
          <p className="font-bold text-gray-900 text-lg">{b2bOrders.length}</p>
        </div>
      </div>

      {/* B2B Pricing Info */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 mb-8 text-white">
        <h2 className="font-bold text-lg mb-3">Your B2B Benefits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '💰', title: 'Wholesale Pricing', desc: 'Exclusive B2B rates on all products' },
            { icon: '📦', title: 'Bulk Discounts', desc: 'More savings on larger quantities' },
            { icon: '📋', title: 'GST Invoices', desc: 'Tax invoices for all orders' }
          ].map(b => (
            <div key={b.title} className="flex gap-3 items-start">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <p className="font-semibold">{b.title}</p>
                <p className="text-primary-200 text-sm">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Order Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Bulk Order Builder</h2>
          <button
            onClick={() => setShowSearch(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700"
          >
            + Add Product
          </button>
        </div>

        {/* Product search */}
        {showSearch && (
          <div className="mb-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product name or SKU..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredProducts.slice(0, 10).map(p => (
                <button
                  key={p.id}
                  onClick={() => addBulkItem(p.id)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white rounded-lg text-sm transition-colors text-left"
                >
                  <div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{p.sku}</span>
                  </div>
                  <span className="text-primary-600 font-semibold">
                    {fmt(p.b2b_price ?? p.selling_price)}
                  </span>
                </button>
              ))}
              {filteredProducts.length === 0 && searchQuery && (
                <p className="text-gray-400 text-sm text-center py-3">No products found</p>
              )}
            </div>
          </div>
        )}

        {/* Bulk items table */}
        {bulkItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Product</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">SKU</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">B2B Price</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Subtotal</th>
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {bulkItems.map(item => (
                  <tr key={item.product_id} className="border-b border-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-800">{item.name}</td>
                    <td className="py-3 px-3 text-gray-400 font-mono text-xs">{item.sku}</td>
                    <td className="py-3 px-3 text-right text-blue-700 font-semibold">{fmt(item.b2b_price)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center border border-gray-200 rounded-lg overflow-hidden w-24 mx-auto">
                        <button
                          onClick={() => updateBulkQty(item.product_id, item.quantity - 1)}
                          className="px-2 py-1.5 hover:bg-gray-50 text-gray-600"
                        >−</button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateBulkQty(item.product_id, item.quantity + 1)}
                          className="px-2 py-1.5 hover:bg-gray-50 text-gray-600"
                        >+</button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">
                      {fmt(item.b2b_price * item.quantity)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => updateBulkQty(item.product_id, 0)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="pt-4 px-3 text-right font-bold text-gray-700">Total:</td>
                  <td className="pt-4 px-3 text-right font-bold text-gray-900 text-base">{fmt(bulkTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleAddBulkToCart}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
              >
                Add All to Cart &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Click "Add Product" to start building your bulk order</p>
          </div>
        )}
      </div>

      {/* Past B2B Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Order History</h2>
          <Link to="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All &rarr;
          </Link>
        </div>

        {b2bOrders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No orders yet. Start your first B2B order!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Order #</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Items</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {b2bOrders.slice(0, 10).map(order => {
                  const s = statusConfig[order.status] ?? statusConfig.pending;
                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-semibold text-gray-800">#{order.order_number}</td>
                      <td className="py-3 px-3 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-gray-600">{order.items.length} items</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">{fmt(order.total_amount)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.classes}`}>{s.label}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Link to={`/orders/${order.id}`} className="text-primary-600 hover:underline text-xs font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
