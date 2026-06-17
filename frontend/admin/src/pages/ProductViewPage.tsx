import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useAdminProduct,
  useDeleteProduct,
  useToggleProductStatus,
} from '../hooks/useAdminProducts';
import ConditionBadge from '../components/ui/ConditionBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function ProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useAdminProduct(id);
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductStatus();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-amazon-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-lg mx-auto mt-10">
        <span className="text-3xl">⚠️</span>
        <h3 className="text-base font-bold text-red-800 mt-2">Product Not Found</h3>
        <p className="text-xs text-red-600 mt-1">
          The product you are trying to view does not exist or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 text-xs font-bold rounded hover:bg-red-100/50 transition-colors"
        >
          Back to Products List
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleMutation.mutateAsync({ id: product.id, is_active: !product.is_active });
      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update product status');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="group flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-amazon-blue transition-colors"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 text-xs font-bold rounded border shadow-sm transition-all ${
              product.is_active
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50'
            }`}
          >
            {product.is_active ? 'Deactivate Product' : 'Activate Product'}
          </button>
          <button
            onClick={() => navigate(`/products/${product.id}/edit`)}
            className="px-5 py-2 bg-amazon-orange hover:bg-amazon-orangeLight text-amazon-navy text-xs font-bold rounded shadow-sm transition-all"
          >
            Edit Product
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded shadow-sm transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Images, Description, Tags */}
        <div className="lg:col-span-5 space-y-6">
          {/* Media / Image Showcase */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Product Images</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-center justify-center h-80 overflow-hidden relative">
              {product.images?.[0] ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                />
              ) : (
                <div className="text-center text-gray-400 flex flex-col items-center gap-2">
                  <span className="text-6xl opacity-20">📦</span>
                  <span className="font-bold text-xs">No image available</span>
                </div>
              )}
            </div>

            {/* Gallery List (if multiple) */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto mt-3 pb-1">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className={`w-16 h-16 border rounded-lg p-1.5 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer flex-shrink-0 ${
                      img.is_primary ? 'border-amazon-orange' : 'border-gray-200'
                    }`}
                  >
                    <img src={img.url} alt="Gallery" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description Card */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Description</h3>
            <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description || 'No description provided for this product.'}
            </div>
          </div>

          {/* Tags Section */}
          {product.tags && product.tags.length > 0 && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Search Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-full transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Title, Pricing, Inventory, Specs, Shipping */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-tighter ${product.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
              <ConditionBadge condition={product.condition} />
              {product.is_featured && (
                <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 tracking-tighter">
                  ★ Featured
                </span>
              )}
              <span className="text-gray-300">|</span>
              <span className="text-[11px] font-bold text-gray-400 font-mono">SKU: {product.sku}</span>
            </div>
            
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{product.name}</h1>
            
            {product.brand && (
              <p className="text-xs text-gray-500 font-bold">
                Brand: <span className="text-amazon-blue">{product.brand}</span>
              </p>
            )}
          </div>

          {/* Condition Details (if defect/damage descriptions are present) */}
          {product.condition !== 'new' && (product.defect_description || product.damage_description) && (
            <div className="bg-red-50/40 border border-red-200 rounded-xl p-5 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-red-800">Condition Remarks</h3>
              <p className="text-[13px] text-red-900 leading-relaxed whitespace-pre-line font-medium">
                {product.defect_description || product.damage_description}
              </p>
            </div>
          )}

          {/* Pricing Card */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3">Pricing & VAT</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Selling Price</span>
                <span className="text-xl font-black text-gray-900 block mt-1">{fmt(product.selling_price)}</span>
                <span className="text-[10px] text-gray-400 font-bold">inc. VAT</span>
              </div>
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">MRP</span>
                <span className="text-base font-bold text-gray-400 line-through block mt-1.5">{fmt(product.mrp)}</span>
              </div>
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Buying Price</span>
                <span className="text-base font-black text-gray-700 block mt-1">{fmt(product.buying_price)}</span>
              </div>
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Discount</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded font-black text-[11px] bg-amazon-orange text-amazon-navy mt-1">
                  -{Math.round(product.discount_percentage)}%
                </span>
              </div>
            </div>

            {/* B2B Price Details */}
            {(product.is_b2b_available || product.b2b_price) && (
              <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 space-y-2 mt-2">
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider block">B2B Channel enabled</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-gray-500 font-medium">B2B Unit Price:</span>
                    <span className="font-bold text-purple-900">{product.b2b_price ? fmt(product.b2b_price) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Min Order Quantity:</span>
                    <span className="font-bold text-purple-900">{product.b2b_min_quantity ?? 'N/A'} units</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inventory & Status Card */}
          <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3">Stock & Distribution</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Current Stock</span>
                <span className={`text-lg font-black block mt-1 ${
                  product.stock_quantity === 0
                    ? 'text-red-600'
                    : product.stock_quantity <= product.minimum_stock_alert
                    ? 'text-amazon-orange'
                    : 'text-gray-900'
                }`}>
                  {product.stock_quantity} Units
                </span>
              </div>
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Min Stock Alert</span>
                <span className="text-sm font-bold text-gray-700 block mt-1.5">{product.minimum_stock_alert} Units</span>
              </div>
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Category</span>
                <span className="text-sm font-bold text-gray-800 block mt-1 uppercase">{product.category_name}</span>
              </div>
              <div>
                <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Distribution</span>
                <div className="flex flex-col gap-1 mt-1">
                  {product.is_b2c_available && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-sm uppercase tracking-tighter w-fit">Retail (B2C)</span>
                  )}
                  {product.is_b2b_available && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-sm uppercase tracking-tighter w-fit">Business (B2B)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Physical Dimensions Card */}
          {(product.weight_grams || product.length_cm || product.width_cm || product.height_cm) && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3">Shipping & Dimensions</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Weight</span>
                  <span className="font-bold text-gray-900 block mt-1">{product.weight_grams ? `${product.weight_grams} g` : 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-tighter">Dimensions (L×W×H)</span>
                  <span className="font-bold text-gray-900 block mt-1">
                    {product.length_cm || product.width_cm || product.height_cm
                      ? `${product.length_cm ?? 0} × ${product.width_cm ?? 0} × ${product.height_cm ?? 0} cm`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Specifications Card */}
          {product.specs && product.specs.length > 0 && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-3">Specifications</h3>
              <div className="border border-gray-200 rounded overflow-hidden bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-100 text-[12px]">
                    {product.specs.map((spec) => (
                      <tr key={spec.spec_key}>
                        <td className="px-3 py-2 font-bold text-gray-500 bg-gray-50/50 border-r border-gray-100 capitalize whitespace-nowrap">{spec.spec_label}</td>
                        <td className="px-3 py-2 text-gray-700 font-semibold">{spec.spec_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metadata Card */}
          <div className="bg-gray-50/50 border border-gray-200/50 rounded-lg p-4 text-[10.5px] text-gray-400 font-bold space-y-1.5 font-mono">
            <div>CREATED AT: {product.created_at ? new Date(product.created_at).toLocaleString('en-IN') : 'N/A'}</div>
            <div>LAST UPDATED: {product.updated_at ? new Date(product.updated_at).toLocaleString('en-IN') : 'N/A'}</div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
