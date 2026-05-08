import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  useAdminProducts,
  useDeleteProduct,
  useToggleProductStatus,
  type ProductFilters,
} from '../hooks/useAdminProducts';
import { useAdminCategories } from '../hooks/useAdminCategories';
import ConditionBadge from '../components/ui/ConditionBadge';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Product } from '../types';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 20 });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data, isLoading } = useAdminProducts(filters);
  const { data: categories } = useAdminCategories();
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductStatus();

  const products = data?.data?.products ?? [];
  const meta = data?.data?.meta;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Product deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleToggle = async (p: Product) => {
    try {
      await toggleMutation.mutateAsync({ id: p.id, is_active: !p.is_active });
      toast.success(`Product ${!p.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Products</h2>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.category_id ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.condition ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, condition: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="new_with_minor_damage">Minor Damage</option>
            <option value="new_with_defect">Defect</option>
          </select>
          <select
            value={filters.stock_status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, stock_status: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select
            value={filters.availability ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">B2B + B2C</option>
            <option value="b2c">B2C Only</option>
            <option value="b2b">B2B Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Image', 'Name / SKU', 'Category', 'Condition', 'MRP', 'Buy', 'Sell', 'Disc%', 'Stock', 'Avail', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 12 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-gray-400">
                        No products found. <button onClick={() => navigate('/products/new')} className="text-blue-600 hover:underline">Add one?</button>
                      </td>
                    </tr>
                  ) : (
                    products.map((p, i) => {
                      const isLow = p.stock_quantity <= p.minimum_stock_alert && p.stock_quantity > 0;
                      const isOut = p.stock_quantity === 0;
                      return (
                        <tr key={p.id} className={i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                          <td className="px-3 py-2">
                            {p.images[0] ? (
                              <img src={p.images[0].url} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">📦</div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-800 max-w-[160px] truncate">{p.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{p.sku}</div>
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{p.category_name}</td>
                          <td className="px-3 py-2">
                            <ConditionBadge condition={p.condition} />
                          </td>
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmt(p.mrp)}</td>
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{fmt(p.buying_price)}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{fmt(p.selling_price)}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.discount_percent > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {p.discount_percent.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`font-medium ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800'}`}>
                              {p.stock_quantity}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {p.is_b2c_available && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">B2C</span>}
                              {p.is_b2b_available && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">B2B</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleToggle(p)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${p.is_active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => navigate(`/products/${p.id}/edit`)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
            </tbody>
          </table>
        </div>

        {meta && meta.total_pages > 1 && (
          <div className="px-4 border-t border-gray-100">
            <Pagination
              page={filters.page ?? 1}
              totalPages={meta.total_pages}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              total={meta.total}
              limit={filters.limit}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
