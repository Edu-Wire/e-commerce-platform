import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Search, 
  Download, 
  Plus, 
  Edit2, 
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
        className="w-16 px-1.5 py-1 text-center border border-[#e47911] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#e47911] shadow-sm bg-white"
      />
    );
  }

  return (
    <button
      onClick={() => { setValue(String(item.stock_quantity)); setEditing(true); }}
      className="text-xs font-semibold px-2.5 py-1 rounded border border-gray-300 hover:border-[#e47911] hover:bg-gray-50 transition-colors text-gray-900 flex items-center gap-1 group w-16 justify-center"
      title="Click to edit quantity"
    >
      {item.stock_quantity}
      <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function StatusBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-[#fdf2f2] border-[#f8b4b4] text-[#9b1c1c]">
        Out of Stock
      </span>
    );
  }
  if (stock <= min) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-[#fffbeb] border-[#fde8c4] text-[#b25e00]">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-[#f0f9eb] border-[#c2e7b0] text-[#2e7d32]">
      Active / In Stock
    </span>
  );
}

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilters>({ page: 1, limit: 12 });
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
    <div className="min-h-full bg-[#eaeded] -m-6 p-4 sm:p-6 text-[#111] font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Amazon Seller Central Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-4 border border-gray-300 rounded shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Seller Central</span>
              <span>&gt;</span>
              <span className="font-semibold text-gray-700">Inventory Management</span>
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mt-1">Manage Inventory</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Monitor active product stock statuses, update quantities inline, and manage retail product listings.
              <a href="#" className="text-[#0066c0] hover:text-[#c45500] hover:underline ml-1">Learn more</a>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void handleExport()}
              className="px-4 py-1.5 bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] hover:from-[#e7e9ec] hover:to-[#d9dbde] border border-[#adb1b8] hover:border-[#a2a6ac] text-xs font-semibold rounded shadow-sm text-gray-800 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/products/new"
              className="px-4 py-1.5 bg-[#f0c14b] hover:bg-[#edd8a4] border border-[#a88734] hover:border-[#846a29] text-xs font-semibold rounded text-[#111] shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add a Product</span>
            </Link>
          </div>
        </div>

        {/* Amazon Filters Panel */}
        <div className="bg-white p-4 border border-gray-300 rounded shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search input */}
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Search products by SKU, name, or description..."
                value={filters.search ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#e47911] focus:border-[#e47911]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            
            {/* Category dropdown */}
            <select
              value={filters.category_id ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value || undefined, page: 1 }))}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#e47911] focus:border-[#e47911]"
            >
              <option value="">All Categories</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Low stock only filter */}
            <button
              onClick={() => setFilters(f => ({ ...f, low_stock: !f.low_stock, page: 1 }))}
              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all ${
                filters.low_stock 
                  ? 'bg-amber-50 border-[#e47911] text-[#b25e00]' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Low stock only
            </button>
          </div>

          <div className="flex items-center gap-3">
            {(filters.search || filters.category_id || filters.low_stock) && (
              <button
                onClick={() => setFilters({ page: 1, limit: 12 })}
                className="text-xs text-[#0066c0] hover:text-[#c45500] hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
            <span className="text-xs text-gray-500 font-medium">
              {meta?.total ?? items.length} products listed
            </span>
          </div>
        </div>

        {/* Table & Cards container */}
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f6f6] border-b border-gray-300 text-xs font-semibold text-gray-600">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" className="rounded text-[#e47911] focus:ring-[#e47911]" />
                  </th>
                  <th className="px-4 py-3">Product Description</th>
                  <th className="px-4 py-3 w-44">Category</th>
                  <th className="px-4 py-3 w-36">Status</th>
                  <th className="px-4 py-3 w-28 text-center">Available Stock</th>
                  <th className="px-4 py-3 w-40 text-right">Retail Prices</th>
                  <th className="px-4 py-3 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-200">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-5"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center text-gray-400 mb-3 border border-gray-200">
                          <Package className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">No inventory matches</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          No items match your active filters. Try adjusting your query keywords.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-[#fcfcfc] transition-colors border-b border-gray-200 text-xs"
                      >
                        <td className="px-4 py-4 align-middle">
                          <input type="checkbox" className="rounded text-[#e47911] focus:ring-[#e47911]" />
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 flex-shrink-0 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                              {item.image_url ? (
                                <img src={item.image_url} alt="" className="h-full w-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link 
                                to={`/products/edit/${item.product_id}`}
                                className="font-semibold text-[#0066c0] hover:text-[#c45500] hover:underline block truncate max-w-[400px]"
                              >
                                {item.product_name}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5 text-gray-500 font-mono text-[10px]">
                                <span>SKU: {item.product_sku ?? 'N/A'}</span>
                                <span>|</span>
                                <span>ID: {String(item.product_id ?? item.id ?? '').slice(0, 8)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle text-gray-600 font-medium">
                          {item.category_name ?? 'Uncategorized'}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <StatusBadge stock={item.stock_quantity} min={item.minimum_stock_alert} />
                        </td>
                        <td className="px-4 py-4 align-middle text-center">
                          <div className="flex justify-center">
                            <InlineStock
                              item={item}
                              onSave={(v) => void handleStockSave(item.product_id, v)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex flex-col justify-end">
                            <span className="font-bold text-gray-900">₹{item.selling_price.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-400">MRP: ₹{item.buying_price.toLocaleString('en-IN')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link 
                              to={`/products/edit/${item.product_id}`}
                              className="px-2.5 py-1 bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] hover:from-[#e7e9ec] hover:to-[#d9dbde] border border-[#adb1b8] text-gray-800 rounded font-semibold text-[11px] shadow-sm transition-all"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2 animate-pulse bg-white">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No inventory listed.
              </div>
            ) : (
              items.map((item) => {
                return (
                  <div 
                    key={item.id}
                    className="p-4 bg-white hover:bg-gray-50 transition-all flex flex-col gap-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/products/edit/${item.product_id}`}
                            className="font-semibold text-[#0066c0] hover:underline truncate block max-w-[200px]"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            SKU: {item.product_sku ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge stock={item.stock_quantity} min={item.minimum_stock_alert} />
                    </div>

                    <div className="flex items-center justify-between border-t border-b border-dashed border-gray-100 py-2.5">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[10px] text-gray-500 font-medium block">Qty</span>
                          <div className="mt-1">
                            <InlineStock
                              item={item}
                              onSave={(v) => void handleStockSave(item.product_id, v)}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 font-medium block">Price</span>
                          <span className="font-bold text-gray-900 text-xs block mt-1">
                            ₹{item.selling_price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 font-medium block">Category</span>
                          <span className="text-gray-600 block mt-1">
                            {item.category_name ?? 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <Link 
                        to={`/products/edit/${item.product_id}`}
                        className="px-4 py-1.5 bg-gradient-to-b from-[#f7f8fa] to-[#e7e9ec] hover:from-[#e7e9ec] hover:to-[#d9dbde] border border-[#adb1b8] text-gray-800 rounded font-semibold text-center text-xs shadow-sm transition-all flex-1"
                      >
                        Edit Listing
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination bar */}
        {meta && meta.total_pages > 1 && (
          <div className="bg-white p-4 border border-gray-300 rounded shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
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
  );
}
