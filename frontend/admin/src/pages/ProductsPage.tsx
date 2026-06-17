import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Search, Edit2, Trash2 } from 'lucide-react';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>(() => {
    const search = searchParams.get('search') || undefined;
    return { page: 1, limit: 10, search };
  });

  // Sync with URL search param
  useEffect(() => {
    const search = searchParams.get('search');
    if (search !== null) {
      setFilters(f => ({ ...f, search, page: 1 }));
    }
  }, [searchParams]);
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
    <div className="space-y-5 font-sans">
      {/* Page Header & Tabs */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Manage Product</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/products/new')}
              className="bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold py-2.5 px-4 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              + Add a Product
            </button>
          </div>
        </div>

        {/* Brand-Style Quick Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-200">
          {[
            { label: 'All Inventory', count: meta?.total ?? 0, value: undefined },
            { label: 'Active', count: products.filter(p => p.is_active).length, value: 'active' },
            { label: 'Inactive', count: products.filter(p => !p.is_active).length, value: 'inactive' },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.value === 'active') setFilters(f => ({ ...f, is_active: 'true', page: 1 }));
                else if (tab.value === 'inactive') setFilters(f => ({ ...f, is_active: 'false', page: 1 }));
                else setFilters(f => ({ ...f, is_active: undefined, page: 1 }));
              }}
              className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 ${
                (tab.value === undefined && filters.is_active === undefined) ||
                (tab.value === 'active' && filters.is_active === 'true') ||
                (tab.value === 'inactive' && filters.is_active === 'false')
                  ? 'border-[#0FA86E] text-[#0FA86E]'
                  : 'border-transparent text-gray-500 hover:text-[#0FA86E]'
                }`}
            >
              {tab.label} <span className="ml-1 text-gray-400 font-medium">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#0FA86E]" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-[#0FA86E] focus:ring-1 focus:ring-[#0FA86E] transition-all bg-white"
            />
          </div>
          <select
            value={filters.category_id ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:outline-none focus:border-[#0FA86E] transition-all bg-white cursor-pointer"
          >
            <option value="">All Categories</option>
            {(categories ?? []).filter((c) => !c.parent_id).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.condition ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, condition: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:outline-none focus:border-[#0FA86E] transition-all bg-white cursor-pointer"
          >
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="new_with_minor_damage">Minor Damage</option>
            <option value="new_with_defect">Defect</option>
          </select>
          <select
            value={filters.stock_status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, stock_status: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:outline-none focus:border-[#0FA86E] transition-all bg-white cursor-pointer"
          >
            <option value="">All Stock Status</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <div className="flex items-center gap-2">
            <select
              value={filters.availability ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value, page: 1 }))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:outline-none focus:border-[#0FA86E] transition-all bg-white cursor-pointer"
            >
              <option value="">Channel: All</option>
              <option value="b2c">B2C Only</option>
              <option value="b2b">B2B Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-[#F4F9F4]/50 border-b border-gray-100">
                <th className="px-5 py-4 text-left w-10">
                  <input type="checkbox" className="rounded border-gray-300 text-[#0FA86E] focus:ring-[#0FA86E]" />
                </th>
                {['Image', 'Status', 'SKU / Product Name', 'Condition', 'MRP', 'Sell Price', 'Discount', 'Available', 'Channel', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="w-4 h-4 bg-gray-100 rounded animate-pulse" /></td>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : products.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-20 text-center text-gray-400 bg-gray-50/30">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl opacity-20">📦</span>
                        <p className="font-bold">No products match your filters</p>
                        <button onClick={() => navigate('/products/new')} className="text-[#0FA86E] hover:underline text-xs font-bold">Add your first product now</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.stock_quantity <= p.minimum_stock_alert && p.stock_quantity > 0;
                    const isOut = p.stock_quantity === 0;
                    const disc = Math.round(p.discount_percentage);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4.5 w-10">
                          <input type="checkbox" className="rounded border-gray-300 text-[#0FA86E] focus:ring-[#0FA86E]" />
                        </td>
                        <td className="px-5 py-4.5">
                          <div className="w-12 h-12 bg-white rounded-md border border-gray-200 overflow-hidden flex items-center justify-center shadow-xs">
                            {p.images?.[0] ? (
                              <img src={typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl opacity-20">📦</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => handleToggle(p)}
                              className="text-[10px] text-[#0FA86E] hover:underline font-bold text-left"
                            >
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4.5 min-w-[220px]">
                          <div className="flex flex-col">
                            <span
                              onClick={() => navigate(`/products/${p.id}`)}
                              className="font-bold text-amazon-blue hover:underline cursor-pointer transition-all line-clamp-1"
                            >
                              {p.name}
                            </span>
                            <span className="text-[11px] font-bold text-gray-400 font-mono mt-0.5">SKU: {p.sku}</span>
                            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight">{p.category_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4.5">
                          <ConditionBadge condition={p.condition} />
                        </td>
                        <td className="px-5 py-4.5 text-xs font-bold text-gray-400 whitespace-nowrap">
                          {fmt(p.mrp)}
                        </td>
                        <td className="px-5 py-4.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 whitespace-nowrap">{fmt(p.selling_price)}</span>
                            <span className="text-[9px] text-gray-400 font-bold mt-0.5">inc. VAT</span>
                          </div>
                        </td>
                        <td className="px-5 py-4.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm font-black text-[10px] border uppercase ${disc > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            -{disc}%
                          </span>
                        </td>
                        <td className="px-5 py-4.5">
                          <div className="flex flex-col">
                            <span className={`text-sm font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                              {p.stock_quantity}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Units</span>
                          </div>
                        </td>
                        <td className="px-5 py-4.5">
                          <div className="flex flex-col gap-1">
                            {p.is_b2c_available && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-sm uppercase tracking-wider w-fit">Retail (B2C)</span>
                            )}
                            {p.is_b2b_available && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-sm uppercase tracking-wider w-fit">Business (B2B)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/products/${p.id}`)}
                              className="p-2 text-gray-400 hover:text-amazon-blue hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all shadow-sm"
                              title="View Product"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => navigate(`/products/${p.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-[#0FA86E] hover:bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors shadow-xs"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded border border-gray-200 hover:border-gray-300 transition-colors shadow-xs"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
