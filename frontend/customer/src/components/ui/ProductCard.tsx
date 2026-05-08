import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import ConditionBadge from './ConditionBadge';

interface ProductCardProps {
  product: Product;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem);

  const primaryImage = product.images?.find(img => img.is_primary)?.url
    ?? product.images?.[0]?.url
    ?? null;

  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image: primaryImage ?? undefined,
      mrp: product.mrp,
      price: product.selling_price,
      quantity: 1,
      condition: product.condition,
      sku: product.sku,
      stock_quantity: product.stock_quantity
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Discount badge */}
        {product.discount_percentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {Math.round(product.discount_percentage)}% OFF
          </span>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {product.brand && (
          <p className="text-xs text-primary-600 font-medium uppercase tracking-wide mb-1">{product.brand}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 flex-1">{product.name}</h3>

        <div className="mb-2">
          <ConditionBadge condition={product.condition} />
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">{fmt(product.selling_price)}</span>
            {product.mrp > product.selling_price && (
              <span className="text-sm text-gray-400 line-through">{fmt(product.mrp)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
