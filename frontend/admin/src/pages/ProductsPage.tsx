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
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 10 });
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
    <div className="space-y-6 font-sans">
      {/* Page Header & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900 tracking-tight capitalize">Manage Product</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/products/new')}
              className="px-5 py-2 bg-amazon-orange hover:bg-amazon-orangeLight text-amazon-navy text-xs font-bold rounded shadow-sm transition-all"
            >
              + Add a Product
            </button>
          </div>
        </div>

        {/* Amazon-Style Quick Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-200">
          {[
            { label: 'All Inventory', count: meta?.total ?? 0, value: undefined },
            { label: 'Active', count: products.filter(p => p.is_active).length, value: 'active' },
            { label: 'Inactive', count: products.filter(p => !p.is_active).length, value: 'inactive' },
            { label: 'Incomplete', count: 0, value: 'incomplete' },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 ${tab.label === 'All Inventory'
                  ? 'border-amazon-orange text-amazon-navy'
                  : 'border-transparent text-gray-500 hover:text-amazon-blue'
                }`}
            >
              {tab.label} <span className="ml-1 text-gray-400 font-medium">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative group">
            <span className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-amazon-blue transition-colors text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-amazon-blue focus:ring-1 focus:ring-amazon-blue transition-all"
            />
          </div>
          <select
            value={filters.category_id ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded text-xs font-bold text-gray-600 focus:outline-none focus:border-amazon-blue transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.condition ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, condition: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded text-xs font-bold text-gray-600 focus:outline-none focus:border-amazon-blue transition-all cursor-pointer"
          >
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="new_with_minor_damage">Minor Damage</option>
            <option value="new_with_defect">Defect</option>
          </select>
          <select
            value={filters.stock_status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, stock_status: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded text-xs font-bold text-gray-600 focus:outline-none focus:border-amazon-blue transition-all cursor-pointer"
          >
            <option value="">All Stock Status</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <div className="flex items-center gap-2">
            <select
              value={filters.availability ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value, page: 1 }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs font-bold text-gray-600 focus:outline-none focus:border-amazon-blue transition-all cursor-pointer"
            >
              <option value="">Channel: All</option>
              <option value="b2c">B2C Only</option>
              <option value="b2b">B2B Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" className="rounded border-gray-300 text-amazon-orange focus:ring-amazon-orange" />
                </th>
                {['Image', 'Status', 'SKU / Product Name', 'Condition', 'MRP', 'Sell Price', 'Discount', 'Available', 'Channel', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="w-4 h-4 bg-gray-100 rounded animate-pulse" /></td>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : products.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-20 text-center text-gray-400 bg-gray-50/30">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl opacity-20">📦</span>
                        <p className="font-bold">No products match your filters</p>
                        <button onClick={() => navigate('/products/new')} className="text-amazon-blue hover:underline text-xs font-bold">Add your first product now</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((p, i) => {
                    const isLow = p.stock_quantity <= p.minimum_stock_alert && p.stock_quantity > 0;
                    const isOut = p.stock_quantity === 0;
                    return (
                      <tr key={p.id} className={`${i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'} hover:bg-blue-50/30 transition-colors group`}>
                        <td className="px-4 py-3 w-10">
                          <input type="checkbox" className="rounded border-gray-300 text-amazon-orange focus:ring-amazon-orange" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                            {p.images?.[0] ? (
                              <img src={typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl opacity-20">📦</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-tighter ${p.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => handleToggle(p)}
                              className="text-[10px] text-amazon-blue hover:underline font-bold text-left"
                            >
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex flex-col">
                            <span className="font-bold text-amazon-blue hover:underline cursor-pointer transition-all line-clamp-1">{p.name}</span>
                            <span className="text-[11px] font-bold text-gray-400 font-mono mt-0.5">SKU: {p.sku}</span>
                            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight">{p.category_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ConditionBadge condition={p.condition} />
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-400 line-through whitespace-nowrap">{fmt(p.mrp)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 whitespace-nowrap">{fmt(p.selling_price)}</span>
                            <span className="text-[10px] text-gray-400 font-bold">inc. VAT</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded font-black text-[11px] ${p.discount_percentage > 0 ? 'bg-amazon-orange text-amazon-navy' : 'bg-gray-100 text-gray-500'}`}>
                            -{Math.round(p.discount_percentage)}%
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-sm font-black ${isOut ? 'text-red-600' : isLow ? 'text-amazon-orange' : 'text-gray-900'}`}>
                              {p.stock_quantity}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Units</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {p.is_b2c_available && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-sm uppercase tracking-tighter w-fit">Retail (B2C)</span>
                            )}
                            {p.is_b2b_available && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-sm uppercase tracking-tighter w-fit">Business (B2B)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/products/${p.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-amazon-blue hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all shadow-sm"
                              title="Edit Product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all shadow-sm"
                              title="Delete Product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Pagination
              page={filters.page ?? 1}
              totalPages={meta.total_pages}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
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
