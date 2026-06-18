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
  pending: { label: 'Pending', classes: 'bg-amber-50 border border-amber-200 text-amber-700' },
  confirmed: { label: 'Confirmed', classes: 'bg-sky-50 border border-sky-200 text-sky-700' },
  processing: { label: 'Processing', classes: 'bg-indigo-50 border border-indigo-200 text-indigo-700' },
  shipped: { label: 'Shipped', classes: 'bg-blue-50 border border-blue-200 text-blue-700' },
  delivered: { label: 'Delivered', classes: 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold' },
  cancelled: { label: 'Cancelled', classes: 'bg-rose-50 border border-rose-200 text-rose-700' },
  refunded: { label: 'Refunded', classes: 'bg-slate-50 border border-slate-200 text-slate-700' }
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
  const { data: productsData } = useProducts({ limit: 50 });
  const addItem = useCartStore(s => s.addItem);

  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredProducts = productsData?.data.filter(p =>
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())) &&
    p.is_b2b_available
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
      quantity: product.b2b_minimum_quantity ?? 1
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
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-xl shadow-slate-100">
          <div className="w-16 h-16 bg-[#F4F9F4] text-[#1B3B2B] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
            🔒
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">B2B Merchant Portal</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Log in to your business account to access wholesale catalog, pricing, and purchase history.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3.5 bg-[#1B3B2B] hover:bg-[#132a1d] text-white font-bold rounded-xl transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-[#1B3B2B]/20"
          >
            Sign In to Business Portal
          </Link>
        </div>
      </div>
    );
  }

  if (customer.customer_type !== 'b2b') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 shadow-xl shadow-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1B3B2B] via-[#43A047] to-[#1B3B2B]"></div>
          
          <div className="w-20 h-20 bg-[#F4F9F4] rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-green-50">
            🏢
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Unlock Premium B2B Wholesale Benefits</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-10 text-sm md:text-base">
            This workspace is dedicated to verified wholesale merchants. Partner with us to scale your inventory procurement.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left mb-10 max-w-2xl mx-auto">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 hover:bg-[#F4F9F4]/40 transition-colors">
              <span className="text-2xl mb-2 block">💼</span>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Wholesale Pricing</h4>
              <p className="text-gray-500 text-xs leading-relaxed">Save up to 40% with discounted B2B margins.</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 hover:bg-[#F4F9F4]/40 transition-colors">
              <span className="text-2xl mb-2 block">🚚</span>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Priority Shipping</h4>
              <p className="text-gray-500 text-xs leading-relaxed">Fast-tracked logistics for cargo freight and bulk shipments.</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 hover:bg-[#F4F9F4]/40 transition-colors">
              <span className="text-2xl mb-2 block">🧾</span>
              <h4 className="font-bold text-gray-900 text-sm mb-1">GST Tax Invoices</h4>
              <p className="text-gray-500 text-xs leading-relaxed">Claim input tax credits with compliant business bills.</p>
            </div>
          </div>

          <Link
            to="/register"
            className="inline-block px-10 py-3.5 bg-[#1B3B2B] hover:bg-[#132a1d] text-white font-bold rounded-xl transition-all duration-150 shadow-md hover:shadow-[#1B3B2B]/20 transform hover:scale-[1.01]"
          >
            Register Business Account
          </Link>
        </div>
      </div>
    );
  }

  const b2bOrders = orders ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#1B3B2B] uppercase tracking-widest bg-[#F4F9F4] px-3 py-1 rounded-full border border-green-100">
            Merchant Workspace
          </span>
          <h1 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">B2B Portal</h1>
          <p className="text-gray-500 text-sm mt-1">
            Logged in as <strong className="text-gray-800">{customer.company_name ?? customer.name}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/account"
            className="px-4 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-gray-600 hover:text-gray-800 text-sm font-semibold transition-all hover:bg-slate-50"
          >
            Manage Profile
          </Link>
        </div>
      </div>

      {/* Account Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1B3B2B]"></div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Company Name</p>
          <p className="font-black text-gray-800 text-lg group-hover:text-[#1B3B2B] transition-colors">
            {customer.company_name ?? '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">GST Identification No.</p>
          <p className="font-mono font-black text-gray-800 text-lg tracking-wider">
            {customer.gst_number ?? '—'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2A5E43]"></div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Total Bulk Placements</p>
          <p className="font-black text-gray-800 text-2xl">{b2bOrders.length}</p>
        </div>
      </div>

      {/* B2B Benefits banner */}
      <div className="bg-gradient-to-r from-[#1B3B2B] via-[#2A5E43] to-[#12281d] rounded-2xl p-6 md:p-8 mb-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-[-5%] bottom-[-30%] w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <h2 className="font-black text-xl mb-4 tracking-tight">Active Wholesale Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '💰', title: 'Wholesale Pricing', desc: 'Pre-negotiated wholesale rates automatically active at checkout.' },
            { icon: '📦', title: 'Bulk Min Quantities', desc: 'Standard wholesale MOQ thresholds enabled.' },
            { icon: '🧾', title: 'Tax Invoices', desc: 'Automatic calculation of GST input tax credits.' }
          ].map(b => (
            <div key={b.title} className="flex gap-3 items-start bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-2xl mt-0.5">{b.icon}</span>
              <div>
                <p className="font-bold text-sm text-white mb-0.5">{b.title}</p>
                <p className="text-green-100/80 text-xs leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Order Form */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-black text-gray-900 text-lg tracking-tight">Bulk Purchase Builder</h2>
            <p className="text-xs text-gray-500 mt-0.5">Construct your cargo cart with special B2B wholesale prices.</p>
          </div>
          <button
            onClick={() => setShowSearch(v => !v)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B3B2B] hover:bg-[#132a1d] text-white text-xs font-bold rounded-xl transition-all duration-150 shadow-sm hover:shadow-[#1B3B2B]/10 active:scale-95"
          >
            {showSearch ? '✕ Close Search' : '➕ Add Wholesale Item'}
          </button>
        </div>

        {/* Product search */}
        {showSearch && (
          <div className="mb-6 border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Type to search wholesale catalog (e.g. Samsung, Nike, AC...)"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B2B] focus:border-[#1B3B2B] mb-3 bg-white"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {filteredProducts.slice(0, 10).map(p => (
                <button
                  key={p.id}
                  onClick={() => addBulkItem(p.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F9F4] hover:text-[#1B3B2B] rounded-xl text-sm transition-colors text-left bg-white border border-slate-100"
                >
                  <div>
                    <span className="font-bold text-gray-800 block sm:inline">{p.name}</span>
                    <span className="text-gray-400 font-mono text-xs sm:ml-3">SKU: {p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#1B3B2B] font-extrabold text-sm block">
                      {fmt(p.b2b_price ?? p.selling_price)}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      MOQ: {p.b2b_minimum_quantity ?? 1} units
                    </span>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && searchQuery && (
                <p className="text-gray-400 text-xs text-center py-4">No wholesale products found</p>
              )}
            </div>
          </div>
        )}

        {/* Bulk items table */}
        {bulkItems.length > 0 ? (
          <div className="overflow-x-auto overflow-y-hidden md:overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left pb-3 px-3 font-semibold">Wholesale Product</th>
                  <th className="text-left pb-3 px-3 font-semibold">SKU Code</th>
                  <th className="text-right pb-3 px-3 font-semibold">B2B Rate</th>
                  <th className="text-center pb-3 px-3 font-semibold">Order Volume</th>
                  <th className="text-right pb-3 px-3 font-semibold">Line Value</th>
                  <th className="pb-3 px-3" />
                </tr>
              </thead>
              <tbody>
                {bulkItems.map(item => (
                  <tr key={item.product_id} className="border-b border-gray-100/60 hover:bg-[#F4F9F4]/20 transition-colors">
                    <td className="py-4 px-3 font-bold text-gray-800">{item.name}</td>
                    <td className="py-4 px-3 text-gray-400 font-mono text-xs">{item.sku}</td>
                    <td className="py-4 px-3 text-right text-blue-700 font-bold">{fmt(item.b2b_price)}</td>
                    <td className="py-4 px-3">
                      <div className="flex items-center justify-center border border-gray-200 rounded-xl overflow-hidden w-28 mx-auto bg-white shadow-xs">
                        <button
                          onClick={() => updateBulkQty(item.product_id, item.quantity - 1)}
                          className="px-3 py-1.5 hover:bg-slate-100 text-gray-600 font-semibold"
                        >−</button>
                        <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateBulkQty(item.product_id, item.quantity + 1)}
                          className="px-3 py-1.5 hover:bg-slate-100 text-gray-600 font-semibold"
                        >+</button>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-right font-black text-gray-900">
                      {fmt(item.b2b_price * item.quantity)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => updateBulkQty(item.product_id, 0)}
                        className="w-7 h-7 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50">
                  <td colSpan={4} className="py-4 px-3 text-right font-bold text-gray-500 text-xs uppercase">Cargo Total Valuation:</td>
                  <td className="py-4 px-3 text-right font-black text-gray-900 text-lg">{fmt(bulkTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAddBulkToCart}
                className="px-5 py-2.5 bg-[#1B3B2B] hover:bg-[#132a1d] text-white font-bold rounded-xl transition-all duration-150 transform hover:scale-[1.01] shadow-sm hover:shadow-[#1B3B2B]/10 flex items-center gap-2 text-xs"
              >
                Add Bulk Cargo to Cart &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
            <span className="text-3xl block mb-2">🛒</span>
            <p className="text-gray-400 text-sm font-semibold">Your bulk builder is currently empty.</p>
            <p className="text-gray-300 text-xs mt-1">Click the search button above to query catalog and select wholesale products.</p>
          </div>
        )}
      </div>

      {/* Past B2B Orders */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black text-gray-900 text-lg tracking-tight">Merchant Order Ledger</h2>
            <p className="text-xs text-gray-500 mt-0.5">Historical overview of your commercial procurements.</p>
          </div>
          <Link to="/orders" className="text-[#1B3B2B] hover:text-[#132a1d] text-xs font-bold hover:underline flex items-center gap-1">
            Browse All Ledgers &rarr;
          </Link>
        </div>

        {b2bOrders.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/20 rounded-2xl">
            <p className="text-gray-400 text-sm font-semibold">No orders recorded under this merchant profile.</p>
            <p className="text-gray-300 text-xs mt-1">Complete your first builder checkout to log a purchase record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left pb-3 px-3 font-semibold">Order ID</th>
                  <th className="text-left pb-3 px-3 font-semibold">Placement Date</th>
                  <th className="text-left pb-3 px-3 font-semibold">Size</th>
                  <th className="text-right pb-3 px-3 font-semibold">Gross Valuation</th>
                  <th className="text-left pb-3 px-3 font-semibold">Cargo Status</th>
                  <th className="pb-3 px-3" />
                </tr>
              </thead>
              <tbody>
                {b2bOrders.slice(0, 10).map(order => {
                  const s = statusConfig[order.status] ?? statusConfig.pending;
                  return (
                    <tr key={order.id} className="border-b border-gray-100/60 hover:bg-[#F4F9F4]/10 transition-colors">
                      <td className="py-4 px-3 font-bold text-gray-800">#{order.order_number}</td>
                      <td className="py-4 px-3 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-3 text-gray-600 font-semibold">{order.items.length} unique items</td>
                      <td className="py-4 px-3 text-right font-black text-gray-900">{fmt(order.total_amount)}</td>
                      <td className="py-4 px-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${s.classes}`}>{s.label}</span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <Link to={`/orders/${order.id}`} className="text-[#1B3B2B] hover:text-[#132a1d] hover:underline text-xs font-bold">
                          Inspect Cargo
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
