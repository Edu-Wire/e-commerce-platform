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
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setDrawerOpen(false)} />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Added to cart
            </h2>
            <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Last Added Item */}
            {lastAddedItem && (
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {lastAddedItem.image && (
                    <img src={lastAddedItem.image} alt={lastAddedItem.name} className="w-full h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0f1111] line-clamp-2">{lastAddedItem.name}</p>
                  <p className="text-sm text-[#b12704] font-medium mt-1">{fmt(lastAddedItem.price)}</p>
                  <p className="text-xs text-gray-500">Qty: {lastAddedItem.quantity}</p>
                </div>
              </div>
            )}

            {/* Subtotal & Actions */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span>Cart subtotal ({totalItems()} items):</span>
                <span className="font-bold text-[#b12704]">{fmt(totalPrice())}</span>
              </div>
              <Link
                to="/cart"
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full text-sm font-medium transition-colors"
              >
                Go to Cart
              </Link>
            </div>

            {/* Suggestions */}
            <div>
              <h3 className="text-sm font-bold text-[#0f1111] mb-3">Save extra with these items</h3>
              <div className="space-y-4">
                {suggestions.map(product => (
                  <div key={product.id} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0">
                    <div className="w-16 h-16 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      {product.images?.[0] && (
                        <img
                          src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).url}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${product.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="text-xs text-[#007185] hover:text-[#c45500] hover:underline line-clamp-2 leading-snug"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-[#b12704] font-medium mt-0.5">{fmt(product.selling_price)}</p>
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
                        className="mt-1.5 px-3 py-1 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full text-[11px] font-medium shadow-sm transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
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
