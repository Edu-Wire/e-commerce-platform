import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Search, 
  Download, 
  Plus, 
  Edit2, 
  MoreVertical,
  Box,
  Package
} from 'lucide-react';
import { useAdminInventory, useUpdateStock, type InventoryFilters } from '../hooks/useAdminInventory';
import { useAdminCategories } from '../hooks/useAdminCategories';
import Pagination from '../components/ui/Pagination';
import api from '../lib/api';
import type { InventoryItem } from '../types';

function InlineStock({ item, onSave }: { item: InventoryItem; onSave: (val: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.stock_quantity));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num !== item.stock_quantity) {
      onSave(num);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') inputRef.current?.blur();
          if (e.key === 'Escape') { setValue(String(item.stock_quantity)); setEditing(false); }
        }}
        autoFocus
        className="w-20 px-2 py-1 border border-indigo-500 rounded text-sm focus:outline-none ring-2 ring-indigo-500/20 shadow-sm"
      />
    );
  }

  return (
    <button
      onClick={() => { setValue(String(item.stock_quantity)); setEditing(true); }}
      className="text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-900 flex items-center gap-1 group"
      title="Click to edit"
    >
      {item.stock_quantity}
      <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function StatusBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-600"></span>
        Out of stock
      </span>
    );
  }
  if (stock <= min) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600"></span>
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-600"></span>
      In stock
    </span>
  );
}

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilters>({ page: 1, limit: 10 });
  const { data, isLoading } = useAdminInventory(filters);
  const { data: categories } = useAdminCategories();
  const updateMutation = useUpdateStock();

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const handleStockSave = async (productId: string, stock_quantity: number) => {
    try {
      await updateMutation.mutateAsync({ productId, stock_quantity });
      toast.success('Stock updated successfully');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading('Generating export...');
    try {
      const res = await api.get('/admin/inventory/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Inventory exported', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    }
  };

  return (
    <div className="min-h-full bg-[#F9FAFB] -m-6 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your products stock levels and pricing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void handleExport()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <Link
              to="/products/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add product
            </Link>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter products..."
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <select
              value={filters.category_id ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value, page: 1 }))}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white outline-none flex-1 md:flex-none min-w-[160px]"
            >
              <option value="">All Categories</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => setFilters(f => ({ ...f, low_stock: !f.low_stock, page: 1 }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                filters.low_stock 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
              }`}
            >
              Low stock only
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" /></th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Inventory</th>
                  <th className="px-6 py-4">Retail Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Box className="w-12 h-12 text-gray-200 mb-4" />
                        <h3 className="text-sm font-semibold text-gray-900">No inventory found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <Link 
                              to={`/products/edit/${item.product_id}`}
                              className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                            >
                              {item.product_name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 font-mono">{item.product_sku ?? 'N/A'}</span>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-[10px] text-gray-400">ID: {String(item.product_id ?? item.id ?? '').slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.category_name ?? 'Uncategorized'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge stock={item.stock_quantity} min={item.minimum_stock_alert} />
                      </td>
                      <td className="px-6 py-4">
                        <InlineStock
                          item={item}
                          onSave={(v) => void handleStockSave(item.product_id, v)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">₹{item.selling_price.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-gray-400">MRP: ₹{item.buying_price.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/products/edit/${item.product_id}`}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium text-gray-900">
                  {((filters.page ?? 1) - 1) * (filters.limit ?? 12) + 1}–{Math.min((filters.page ?? 1) * (filters.limit ?? 12), meta.total)}
                </span> of <span className="font-medium text-gray-900">{meta.total}</span> products
              </p>
              <Pagination
                page={filters.page ?? 1}
                totalPages={meta.total_pages}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
