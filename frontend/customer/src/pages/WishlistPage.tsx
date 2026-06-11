import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import EmptyState from '../components/ui/EmptyState';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  const handleAddToCart = (item: any) => {
    if (item.stock_quantity <= 0) {
      toast.error('Product is out of stock!');
      return;
    }
    
    addItem({
      product_id: item.product_id,
      name: item.name,
      slug: item.slug,
      image: item.image,
      mrp: item.mrp,
      price: item.price,
      quantity: 1,
      condition: item.condition,
      sku: item.sku,
      stock_quantity: item.stock_quantity,
    });
    toast.success('Added to cart!');
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen pt-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="bg-white p-12 rounded-3xl shadow-sm text-center">
            <EmptyState
              icon="❤️"
              title="Your Wishlist is empty."
              description="Save your favorite items here to review and buy them later."
              action={
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-colors"
                >
                  Explore Products
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
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Wishlist <span className="text-gray-500 font-medium text-xl">({items.length})</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Keep track of your favorite products</p>
          </div>
          <button 
            onClick={clearWishlist}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Clear Wishlist
          </button>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <div key={item.product_id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col group relative">
              
              {/* Remove from Wishlist Button */}
              <button
                onClick={() => removeItem(item.product_id)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                title="Remove from Wishlist"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>

              {/* Image */}
              <div 
                className="w-full aspect-square bg-gray-50 rounded-2xl p-4 mb-4 flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => navigate(`/product/${item.slug}`)}
              >
                <img 
                  src={item.image || '/placeholder.png'} 
                  alt={item.name} 
                  className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" 
                />
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col">
                <Link to={`/product/${item.slug}`} className="text-sm font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 mb-2">
                  {item.name}
                </Link>
                
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-lg font-bold text-gray-900">{fmt(item.price)}</span>
                  {item.mrp > item.price && (
                    <span className="text-xs text-gray-500 line-through mb-1">{fmt(item.mrp)}</span>
                  )}
                </div>

                <div className="mt-auto">
                  {item.stock_quantity > 0 ? (
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Add to Cart
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      Out of Stock
                    </button>
                  )}
                </div>
              </div>
              
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
