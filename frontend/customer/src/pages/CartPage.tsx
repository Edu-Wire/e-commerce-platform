import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import EmptyState from '../components/ui/EmptyState';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function CartPage() {
  const { items, removeItem, updateQuantity, addItem, clearCart } = useCartStore();
  const customer = useAuthStore(s => s.customer);
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const initialSelected: Record<number, boolean> = {};
    items.forEach(item => {
      initialSelected[item.product_id] = true;
    });
    setSelectedItems(initialSelected);
  }, [items.length]);

  useEffect(() => {
    if (items.length > 0) {
      fetch(`${(import.meta as any).env.VITE_API_URL || ''}/api/products?limit=10`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSuggestions(data.data);
          }
        })
        .catch(err => console.error('Error fetching suggestions:', err));
    }
  }, [items.length]);

  const handleCheckout = () => {
    if (!customer) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const subtotal = items.filter(item => selectedItems[item.product_id]).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharges = 99;
  const freeDeliveryThreshold = 500;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const amountAway = freeDeliveryThreshold - subtotal;
  const progressPercentage = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen pt-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="bg-white p-12 rounded-3xl shadow-sm text-center">
            <EmptyState
              icon="🛒"
              title="Your Cart is empty."
              description="Looks like you haven't added anything to your cart yet. Discover our latest products and deals."
              action={
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-colors"
                >
                  Continue Shopping
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans">
      <div className="max-w-[1400px] mx-auto px-6">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  My Cart <span className="text-gray-500 font-medium text-xl">({items.length})</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">Review your items and proceed to checkout</p>
              </div>
              <button 
                onClick={clearCart}
                className="flex items-center gap-2 px-4 py-2 border border-green-200 text-green-600 hover:bg-green-50 rounded-xl text-sm font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear Cart
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.product_id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-6 items-start relative">
                  
                  {/* Custom Checkbox */}
                  <div className="pt-8">
                    <button 
                      onClick={() => toggleSelect(item.product_id)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${selectedItems[item.product_id] ? 'bg-green-100 text-green-600' : 'border-2 border-gray-200 text-transparent hover:border-green-300'}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                  </div>

                  {/* Image */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-2xl p-2 flex items-center justify-center">
                    <img src={item.image || '/placeholder.png'} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col h-full min-h-[128px]">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link to={`/product/${item.slug}`} className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-1">
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold mt-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div> In Stock
                        </div>
                        
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Premium Quality
                          </span>
                          <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Secure
                          </span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900 whitespace-nowrap">
                        {fmt(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">
                        {fmt(item.price)}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                          <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">−</button>
                          <span className="w-8 text-center text-sm font-bold text-gray-900 border-x border-gray-100">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">+</button>
                        </div>
                        
                        <button onClick={() => removeItem(item.product_id)} className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Free Delivery Banner */}
            <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10 w-full md:w-auto flex-1">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-2">
                    {isFreeDelivery ? "Your order is eligible for FREE Delivery." : `You are ₹${amountAway} away from FREE Delivery!`}
                  </h3>
                  <div className="w-full bg-green-200/50 rounded-full h-1.5 mb-2">
                    <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Add more items to your cart and get free delivery.</p>
                </div>
              </div>
              <button onClick={() => navigate('/')} className="w-full md:w-auto px-6 py-2.5 bg-white border border-green-600 text-green-700 rounded-full font-bold text-sm shadow-sm hover:bg-green-50 transition-colors whitespace-nowrap shrink-0 relative z-10">
                ← Continue Shopping
              </button>
              
              {/* Background Decoration */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* Info Footer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-600 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">Secure Checkout</p><p className="text-[10px] text-gray-500 mt-0.5">100% safe payments</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-600 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">Easy Returns</p><p className="text-[10px] text-gray-500 mt-0.5">7 days return policy</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-600 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">Fast Delivery</p><p className="text-[10px] text-gray-500 mt-0.5">Quick & reliable</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-600 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg></div>
                <div><p className="font-bold text-xs text-gray-900">Best Prices</p><p className="text-[10px] text-gray-500 mt-0.5">Guaranteed prices</p></div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[400px] flex flex-col gap-6">
            
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal ({selectedCount} items)</span>
                  <span className="font-bold text-gray-900">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    Delivery Charges 
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="font-bold text-gray-900">{isFreeDelivery ? '₹0.00' : '₹99.00'}</span>
                </div>
                <div className="flex justify-between text-sm bg-green-50/50 -mx-6 px-6 py-2 border-y border-green-50">
                  <span className="text-green-600 font-medium">You Save</span>
                  <span className="font-bold text-green-600">{isFreeDelivery ? '-₹99.00' : '₹0.00'}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-6 pt-2">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">{fmt(subtotal + (isFreeDelivery ? 0 : deliveryCharges))}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={selectedCount === 0}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md shadow-green-600/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Proceed to Checkout
              </button>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-900 mb-3">We Accept</p>
                <div className="flex gap-2 items-center flex-wrap">
                  {/* Payment Icons */}
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-blue-800 tracking-wider">VISA</div>
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-red-500">MasterCard</div>
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-blue-500">RuPay</div>
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-800">UPI</div>
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-black flex items-center gap-0.5"><svg className="w-3 h-3" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> Pay</div>
                </div>
              </div>
            </div>

            {/* You May Also Like */}
            {suggestions.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 text-lg">You May Also Like</h3>
                  <button className="text-green-600 text-sm font-bold hover:underline">View All</button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {suggestions.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex flex-col group cursor-pointer border border-gray-100 rounded-xl p-3 bg-white hover:shadow-md transition-shadow" onClick={() => navigate(`/product/${p.slug}`)}>
                      <div className="aspect-square mb-3 flex items-center justify-center">
                        <img src={p.images?.[0]?.url || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" alt="" />
                      </div>
                      <h4 className="text-[11px] font-medium text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-green-600 transition-colors text-center">{p.name}</h4>
                      <div className="mt-auto">
                        <p className="font-bold text-gray-900 text-sm mb-3 text-center">₹{p.selling_price}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem({
                              product_id: p.id,
                              name: p.name,
                              slug: p.slug,
                              image: p.images?.[0]?.url,
                              mrp: p.mrp,
                              price: p.selling_price,
                              quantity: 1,
                              condition: p.condition,
                              sku: p.sku,
                              stock_quantity: p.stock_quantity,
                            });
                            toast.success('Added to cart!');
                          }}
                          className="w-full py-1.5 border border-green-600 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-50 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
