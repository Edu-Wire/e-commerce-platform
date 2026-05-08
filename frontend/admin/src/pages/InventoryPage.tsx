import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
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

  const isLow = item.stock_quantity <= item.minimum_stock_alert && item.stock_quantity > 0;
  const isOut = item.stock_quantity === 0;

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
        className="w-20 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  return (
    <button
      onClick={() => { setValue(String(item.stock_quantity)); setEditing(true); }}
      className={`text-sm font-semibold px-2 py-0.5 rounded hover:bg-gray-100 transition-colors ${
        isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800'
      }`}
      title="Click to edit"
    >
      {item.stock_quantity}
    </button>
  );
}

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilters>({ page: 1, limit: 25 });
  const { data, isLoading } = useAdminInventory(filters);
  const { data: categories } = useAdminCategories();
  const updateMutation = useUpdateStock();

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const handleStockSave = async (productId: string, stock_quantity: number) => {
    try {
      await updateMutation.mutateAsync({ productId, stock_quantity });
      toast.success('Stock updated');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/inventory/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
        <button
          onClick={() => void handleExport()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by name or SKU..."
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
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filters.low_stock ?? false}
              onChange={(e) => setFilters((f) => ({ ...f, low_stock: e.target.checked, page: 1 }))}
              className="accent-amber-500"
            />
            <span className="text-sm text-gray-700">Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Image', 'Product', 'SKU', 'Category', 'Stock', 'Min Alert', 'Buy Price', 'Sell Price', 'Last Updated'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">No inventory items found.</td>
                  </tr>
                )
                : items.map((item, i) => {
                    const isLow = item.stock_quantity <= item.minimum_stock_alert && item.stock_quantity > 0;
                    const isOut = item.stock_quantity === 0;
                    return (
                      <tr
                        key={item.id}
                        className={`${
                          isOut ? 'bg-red-50' : isLow ? 'bg-amber-50' : i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="px-3 py-2">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-9 h-9 object-cover rounded border border-gray-200" />
                          ) : (
                            <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">📦</div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800 max-w-[160px] truncate">{item.product_name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.product_sku}</td>
                        <td className="px-3 py-2 text-gray-600">{item.category_name}</td>
                        <td className="px-3 py-2">
                          <InlineStock
                            item={item}
                            onSave={(v) => void handleStockSave(item.product_id, v)}
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-600">{item.minimum_stock_alert}</td>
                        <td className="px-3 py-2 text-gray-700">₹{item.buying_price.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">₹{item.selling_price.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {new Date(item.updated_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
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
    </div>
  );
}
