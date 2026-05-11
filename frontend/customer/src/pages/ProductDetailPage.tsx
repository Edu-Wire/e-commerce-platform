import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import ConditionBadge from '../components/ui/ConditionBadge';
import PriceDisplay from '../components/ui/PriceDisplay';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug!);
  const { data: relatedData } = useProducts({
    category: product?.category?.slug,
    limit: 4
  });
  const addItem = useCartStore(s => s.addItem);
  const customer = useAuthStore(s => s.customer);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />;
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Product not found</h2>
        <Link to="/" className="text-primary-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const currentImage = typeof images[selectedImageIdx] === 'string' 
    ? images[selectedImageIdx] as unknown as string
    : (images[selectedImageIdx] as any)?.url ?? null;
  const isOutOfStock = product.stock_quantity <= 0;
  const isB2B = customer?.customer_type === 'b2b';
  const relatedProducts = relatedData?.data.filter(p => p.id !== product.id).slice(0, 4) ?? [];

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image: currentImage ?? undefined,
      mrp: product.mrp,
      price: product.selling_price,
      quantity,
      condition: product.condition,
      sku: product.sku,
      stock_quantity: product.stock_quantity
    });
    toast.success(`${product.name} added to cart!`);
  };

  const specs = product.specifications ?? {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/category/${product.category.slug}`} className="hover:text-primary-600">{product.category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Image Gallery */}
        <div>
          {/* Main Image */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden aspect-square mb-3">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${idx === selectedImageIdx ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  <img 
                    src={typeof img === 'string' ? img : (img as any).url} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="space-y-5">
          {/* Brand + Name */}
          {product.brand && (
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">{product.brand}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

          {/* SKU */}
          <p className="text-xs text-gray-400">SKU: {product.sku}</p>

          {/* Condition */}
          <div className="flex items-center gap-3">
            <ConditionBadge condition={product.condition} />
          </div>

          {/* Condition description alert */}
          {product.condition !== 'new' && product.condition_description && (
            <div className={`rounded-xl p-4 border text-sm ${product.condition === 'new_with_minor_damage'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-orange-50 border-orange-200 text-orange-800'
              }`}>
              <p className="font-semibold mb-1">
                {product.condition === 'new_with_minor_damage' ? '⚠ Condition Note' : '⚡ Defect Note'}
              </p>
              <p>{product.condition_description}</p>
            </div>
          )}

          {/* Price */}
          <PriceDisplay
            mrp={product.mrp}
            selling_price={product.selling_price}
            discount_percentage={product.discount_percentage}
            b2b_price={product.b2b_price}
            is_b2b={isB2B}
            size="lg"
          />

          {/* B2B min qty info */}
          {isB2B && product.b2b_min_quantity && (
            <p className="text-sm text-blue-600">
              Minimum order quantity for B2B: <strong>{product.b2b_min_quantity} units</strong>
            </p>
          )}

          {/* Stock indicator */}
          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm font-medium">Out of Stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium">
                In Stock
                {product.stock_quantity <= 10 && (
                  <span className="text-amber-600 ml-1">— Only {product.stock_quantity} left!</span>
                )}
              </span>
            </div>
          )}

          {/* Quantity selector + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 text-lg font-medium transition-colors"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                disabled={isOutOfStock}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 text-lg font-medium transition-colors disabled:opacity-40"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-colors ${isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
                }`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">About this product</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Specifications */}
          {Object.keys(specs).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Specifications</h3>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(specs).map(([key, value], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2.5 font-medium text-gray-600 w-1/3 capitalize">{key.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2.5 text-gray-800">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
