import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import EmptyState from '../components/ui/EmptyState';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, addItem } = useCartStore();
  const customer = useAuthStore(s => s.customer);
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Initialize selected items
    const initialSelected: Record<number, boolean> = {};
    items.forEach(item => {
      initialSelected[item.product_id] = true;
    });
    setSelectedItems(initialSelected);
  }, [items.length]);

  useEffect(() => {
    // Fetch suggestions based on first item in cart
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

  const selectAll = (select: boolean) => {
    const next: Record<number, boolean> = {};
    items.forEach(item => {
      next[item.product_id] = select;
    });
    setSelectedItems(next);
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#EAEDED] min-h-screen pt-8">
        <div className="max-w-[1480px] mx-auto px-4">
          <div className="bg-white p-8 rounded shadow-sm">
            <EmptyState
              icon="🛒"
              title="Your Shopping Cart is empty."
              description="Your Shopping Cart lives to serve. Give it purpose — fill it with groceries, clothing, household supplies, electronics, and more."
              action={
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0f1111] font-medium rounded-lg border border-[#FCD200] shadow-sm"
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
    <div className="bg-[#EAEDED] min-h-screen py-4 md:py-8 font-sans text-[#0f1111]">
      <div className="max-w-[1480px] mx-auto px-4">
        {/* Mobile Summary (Visible only on small screens) */}
        <div className="lg:hidden bg-white p-4 mb-4 shadow-sm rounded-sm space-y-3">
          <div className="text-[18px]">
            Subtotal ({items.length} items): <span className="font-bold">{fmt(totalPrice())}</span>
          </div>
          <button 
            onClick={handleCheckout}
            className="w-full py-3 px-4 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-lg text-[15px] font-medium shadow-sm transition-colors"
          >
            Proceed to Buy ({items.length} items)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          
          {/* Main Cart Section */}
          <div className="bg-white p-4 md:p-6 shadow-sm rounded-sm">
            <div className="flex justify-between items-end border-b border-gray-200 pb-2 mb-4">
              <h1 className="text-xl md:text-[28px] font-medium">Shopping Cart</h1>
              <span className="text-[14px] text-gray-500 mb-1 hidden md:block">Price</span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => selectAll(false)}
                className="text-[13px] text-[#007185] hover:text-[#c45500] hover:underline"
              >
                Deselect all items
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.product_id} className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-gray-200 last:border-0 relative">
                  {/* Top Row for Mobile (Checkbox + Info) */}
                  <div className="flex gap-4 w-full">
                    {/* Checkbox */}
                    <div className="pt-2 sm:pt-8">
                      <input 
                        type="checkbox" 
                        checked={!!selectedItems[item.product_id]}
                        onChange={() => toggleSelect(item.product_id)}
                        className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </div>

                    {/* Product Image */}
                    <div className="w-24 h-24 sm:w-44 sm:h-44 flex-shrink-0 flex items-center justify-center p-1 sm:p-2 bg-gray-50 rounded">
                      <img 
                        src={item.image || 'https://via.placeholder.com/150'} 
                        alt={item.name} 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                        <Link to={`/product/${item.slug}`} className="text-[15px] sm:text-[18px] font-medium text-[#007185] hover:text-[#c45500] hover:underline leading-tight line-clamp-2">
                          {item.name}
                        </Link>
                        <span className="text-[16px] sm:text-[18px] font-bold text-left sm:text-right whitespace-nowrap">
                          {fmt(item.price * item.quantity)}
                        </span>
                      </div>

                      <div className="text-[12px] text-[#007600] font-medium mt-1">In stock</div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <img src="https://m.media-amazon.com/images/G/01/prime/marketing/slashPrime/amazon-prime-delivery-logo.png" alt="Prime" className="h-3.5 sm:h-4" />
                        <span className="text-[11px] sm:text-[12px] text-gray-600">FREE delivery as soon as <span className="font-bold">Wed, 13 May</span></span>
                      </div>

                      {item.mrp > item.price && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="bg-[#cc0c39] text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-sm">Great Summer Deal</span>
                          <span className="text-[#cc0c39] text-[11px] sm:text-[12px] font-bold">-{Math.round((1 - item.price/item.mrp)*100)}% {fmt(item.price)}</span>
                        </div>
                      )}

                      <div className="hidden sm:block text-[12px] text-gray-500 mt-1 uppercase">
                        Style Name: <span className="font-bold">{item.sku.split('-')[0]} series 2025</span>
                      </div>

                      {/* Actions Row - Desktop View (Hidden on mobile) */}
                      <div className="hidden sm:flex items-center gap-4 mt-4 text-[13px]">
                        <div className="flex items-center bg-[#F0F2F2] border border-[#D5D9D9] rounded-lg shadow-sm">
                          <span className="px-3 py-1 text-[13px] border-r border-[#D5D9D9]">Qty: {item.quantity}</span>
                          <div className="flex">
                            <button 
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-[#E3E6E6] transition-colors"
                            >
                              −
                            </button>
                            <button 
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-[#E3E6E6] transition-colors border-l border-[#D5D9D9]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => removeItem(item.product_id)}
                          className="text-[#007185] hover:text-[#c45500] hover:underline"
                        >
                          Delete
                        </button>
                        <span className="text-gray-300">|</span>
                        <button className="text-[#007185] hover:text-[#c45500] hover:underline">Save for later</button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions Row (Visible only on mobile) */}
                  <div className="sm:hidden flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-[#F0F2F2] border border-[#D5D9D9] rounded-lg shadow-sm h-9">
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="px-3 h-full hover:bg-[#E3E6E6] transition-colors"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-[14px] font-medium border-x border-[#D5D9D9] min-w-[40px] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="px-3 h-full hover:bg-[#E3E6E6] transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.product_id)}
                      className="px-4 py-1.5 border border-[#D5D9D9] rounded-lg text-[13px] font-medium bg-white hover:bg-gray-50 shadow-sm"
                    >
                      Delete
                    </button>
                    <button className="px-4 py-1.5 border border-[#D5D9D9] rounded-lg text-[13px] font-medium bg-white hover:bg-gray-50 shadow-sm">
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Bottom */}
            <div className="text-right mt-4 pt-4 border-t border-gray-100 sm:border-t-0">
              <span className="text-[16px] sm:text-[18px]">
                Subtotal ({items.length} items): <span className="font-bold">{fmt(totalPrice())}</span>
              </span>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Proceed to Buy Box (Desktop View) */}
            <div className="hidden lg:block bg-white p-5 shadow-sm rounded-sm space-y-4">
              <div className="flex items-center gap-2 text-[14px]">
                <div className="w-5 h-5 bg-[#008a00] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#008a00]">Your order is eligible for FREE Delivery.</span>
              </div>
              
              <div className="text-[18px]">
                Subtotal ({items.length} items): <span className="font-bold">{fmt(totalPrice())}</span>
              </div>

              <div className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" />
                <span>This order contains a gift</span>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full py-2 px-4 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-lg text-[13px] font-medium shadow-sm transition-colors"
              >
                Proceed to Buy
              </button>

              <div className="border border-gray-200 rounded p-2 text-[13px] flex justify-between items-center cursor-pointer hover:bg-gray-50">
                <span>EMI Available</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Cross-sell Recommendations */}
            {suggestions.length > 0 && (
              <div className="bg-white p-5 shadow-sm rounded-sm">
                <h3 className="text-[16px] font-bold mb-4">Customers Who Bought Items in Your Cart Also Bought</h3>
                <div className="space-y-6">
                  {suggestions.slice(0, 6).map((p, idx) => (
                    <div key={p.id} className="flex gap-3 group">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-50 p-1 flex items-center justify-center">
                        <img 
                          src={p.images?.[0]?.url || 'https://via.placeholder.com/100'} 
                          alt={p.name} 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Link to={`/product/${p.slug}`} className="text-[13px] text-[#007185] hover:text-[#c45500] hover:underline line-clamp-2 leading-tight">
                          {p.name}
                        </Link>
                        <div className="flex text-[#e47911] text-[12px]">
                          {[1, 2, 3, 4].map(s => <span key={s}>★</span>)}
                          <span className="text-gray-300">★</span>
                          <span className="ml-1 text-[#007185] hover:underline">{Math.floor(Math.random()*1000)}</span>
                        </div>
                        <div className="text-[14px] font-medium text-[#b12704]">
                          {fmt(p.selling_price)}
                        </div>
                        <button 
                          onClick={() => {
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
                              category_slug: p.category?.slug
                            });
                            toast.success(`${p.name} added to cart`);
                          }}
                          className="text-[12px] bg-[#FFD814] hover:bg-[#F7CA00] px-3 py-0.5 rounded border border-[#FCD200] shadow-sm transition-colors active:scale-95"
                        >
                          Add to cart
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
