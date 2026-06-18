import { useCartStore } from '../../store/cartStore';
import { useProducts } from '../../hooks/useProducts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function CartDrawer() {
  const isDrawerOpen = useCartStore(s => s.isDrawerOpen);
  const setDrawerOpen = useCartStore(s => s.setDrawerOpen);
  const lastAddedItem = useCartStore(s => s.lastAddedItem);
  const totalItems = useCartStore(s => s.totalItems);
  const totalPrice = useCartStore(s => s.totalPrice);
  const addItem = useCartStore(s => s.addItem);
  const items = useCartStore(s => s.items);
  const updateQuantity = useCartStore(s => s.updateQuantity);
  
  console.log('CartDrawer rendered, isDrawerOpen:', isDrawerOpen);
  
  const { data: relatedData } = useProducts({
    category: lastAddedItem?.category_slug,
    limit: 5
  });

  const suggestions = relatedData?.data.filter(p => p.id !== lastAddedItem?.product_id) ?? [];

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setDrawerOpen(false)} />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex animate-slide-from-right">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-extrabold flex items-center gap-2.5 text-slate-800">
              <span className="w-8 h-8 rounded-full bg-brand-primaryLight flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Added to Cart
            </h2>
            <button 
              onClick={() => setDrawerOpen(false)} 
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Last Added Item */}
            {lastAddedItem && (
              <div className="flex gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 items-center">
                <div className="w-20 h-20 bg-white border border-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-xs">
                  {lastAddedItem.image && (
                    <img src={lastAddedItem.image} alt={lastAddedItem.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{lastAddedItem.name}</p>
                  <p className="text-base text-brand-primary font-black mt-1.5">{fmt(lastAddedItem.price)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">Qty: {lastAddedItem.quantity}</p>
                </div>
              </div>
            )}

            {/* Subtotal & Actions */}
            <div className="bg-brand-primaryLight border border-brand-border/40 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-semibold">Cart subtotal ({totalItems()} items):</span>
                <span className="font-black text-brand-primary text-xl">{fmt(totalPrice())}</span>
              </div>
              <Link
                to="/cart"
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center py-3 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-brand-primary/10 transition-all active:scale-[0.98]"
              >
                Go to Cart
              </Link>
            </div>

            {/* Suggestions */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Save extra with these items
              </h3>
              <div className="space-y-4.5">
                {suggestions.map(product => {
                  const cartItem = items.find(i => i.product_id === product.id);
                  const qty = cartItem?.quantity || 0;

                  return (
                    <div key={product.id} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0 items-center">
                      <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 shadow-xs">
                        {product.images?.[0] && (
                          <img
                            src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).url}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain mix-blend-multiply"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${product.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className="text-xs font-semibold text-slate-800 hover:text-brand-primary hover:underline line-clamp-2 leading-snug"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-brand-primary font-bold">{fmt(product.selling_price)}</span>
                          
                          {qty > 0 ? (
                            <div className="flex items-center border border-brand-border/60 rounded-lg bg-white overflow-hidden shadow-xs">
                              <button 
                                onClick={() => updateQuantity(product.id, qty - 1)} 
                                className="w-7 h-7 flex items-center justify-center text-brand-primary hover:bg-brand-primaryLight font-extrabold transition-colors text-sm"
                              >
                                −
                              </button>
                              <span className="w-7 text-center text-xs font-black text-slate-800">{qty}</span>
                              <button 
                                onClick={() => updateQuantity(product.id, qty + 1)} 
                                className="w-7 h-7 flex items-center justify-center text-brand-primary hover:bg-brand-primaryLight font-extrabold transition-colors text-sm"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                addItem({
                                  product_id: product.id,
                                  name: product.name,
                                  slug: product.slug,
                                  image: typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.url,
                                  mrp: product.mrp,
                                  price: product.selling_price,
                                  quantity: 1,
                                  condition: product.condition,
                                  sku: product.sku,
                                  stock_quantity: product.stock_quantity
                                });
                                toast.success(`${product.name} added to cart!`);
                              }}
                              className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white rounded-lg text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {suggestions.length === 0 && (
                  <p className="text-sm text-gray-500">No suggestions available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
