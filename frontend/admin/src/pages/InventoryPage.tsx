import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
        className="w-16 px-1.5 py-1 text-center border border-[#0FA86E] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#0FA86E] shadow-xs bg-white"
      />
    );
  }

  return (
    <button
      onClick={() => { setValue(String(item.stock_quantity)); setEditing(true); }}
      className="text-xs font-bold px-2.5 py-1 rounded-md border border-gray-200 hover:border-[#0FA86E] hover:bg-gray-50 transition-colors text-gray-900 flex items-center gap-1 group w-16 justify-center"
      title="Click to edit quantity"
    >
      {item.stock_quantity}
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function StatusBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black border uppercase tracking-wider bg-rose-50 border-rose-100 text-rose-700">
        Out of Stock
      </span>
    );
  }
  if (stock <= min) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black border uppercase tracking-wider bg-amber-50 border-amber-100 text-amber-700">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black border uppercase tracking-wider bg-emerald-50 border-emerald-100 text-emerald-700">
      Active / In Stock
    </span>
  );
}

const DEFAULT_COLUMNS = [
  { id: 'name', label: 'Product Name' },
  { id: 'sku', label: 'SKU' },
  { id: 'category', label: 'Category' },
  { id: 'stock_quantity', label: 'Available Stock' },
  { id: 'minimum_stock_alert', label: 'Minimum Stock Alert' },
  { id: 'buying_price', label: 'Buying Price' },
  { id: 'selling_price', label: 'Selling Price' },
  { id: 'mrp', label: 'MRP' },
  { id: 'condition', label: 'Condition' },
  { id: 'is_active', label: 'Active Status' },
];

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<InventoryFilters>(() => {
    const filter = searchParams.get('filter');
    if (filter === 'low_stock') return { page: 1, limit: 12, low_stock: true };
    if (filter === 'out_of_stock') return { page: 1, limit: 12, out_of_stock: true };
    return { page: 1, limit: 12 };
  });

  // Sync when URL changes (e.g. back navigation)
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'low_stock') setFilters({ page: 1, limit: 12, low_stock: true });
    else if (filter === 'out_of_stock') setFilters({ page: 1, limit: 12, out_of_stock: true });
  }, [searchParams]);
  const { data, isLoading } = useAdminInventory(filters);
  const { data: categories } = useAdminCategories();
  const updateMutation = useUpdateStock();

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'default' | 'customize'>('default');
  const [customColumns, setCustomColumns] = useState<{ id: string; label: string }[]>(DEFAULT_COLUMNS);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS.map(c => c.id));
  const [newColKey, setNewColKey] = useState('');
  const [newColLabel, setNewColLabel] = useState('');

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const toggleColumn = (id: string) => {
    setSelectedColumns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAddCustomColumn = () => {
    const key = newColKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!key) {
      toast.error('Column key is required');
      return;
    }
    const label = newColLabel.trim() || newColKey.trim();
    if (customColumns.some((col) => col.id === key)) {
      toast.error('Column key already exists');
      return;
    }
    setCustomColumns((prev) => [...prev, { id: key, label }]);
    setSelectedColumns((prev) => [...prev, key]);
    setNewColKey('');
    setNewColLabel('');
    toast.success(`Column "${label}" added to list`);
  };

  const handleRemoveCustomColumn = (id: string) => {
    setCustomColumns((prev) => prev.filter((col) => col.id !== id));
    setSelectedColumns((prev) => prev.filter((c) => c !== id));
  };

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
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.category_id) queryParams.set('category_id', filters.category_id);
      if (filters.low_stock) queryParams.set('low_stock', 'true');
      if (exportMode === 'customize') {
        queryParams.set('columns', selectedColumns.join(','));
      }

      const res = await api.get(`/admin/inventory/export?${queryParams}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Inventory exported', { id: toastId });
      setShowExportModal(false);
    } catch (err: any) {
      console.error('Export error details:', err);
      let errMsg = 'Export failed';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error) {
            errMsg = parsed.error;
          }
        } catch (e) {
          console.error('Failed to parse error blob:', e);
        }
      } else if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg, { id: toastId });
    }
  };

  return (
    <div className="min-h-full bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-700 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <span>&gt;</span>
              <span className="text-[#0FA86E]">Inventory Management</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">Manage Inventory</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Monitor active product stock statuses, update quantities inline, and manage retail product listings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => void handleExport()}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/products/new"
              className="px-4 py-2 bg-[#0FA86E] hover:bg-[#0d9561] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add a Product</span>
            </Link>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Products listed count — left-aligned */}
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
              {meta?.total ?? items.length} products listed
            </span>

            {/* Search input */}
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Search products by SKU, name, or description..."
                value={filters.search ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0FA86E]" />
            </div>

            {/* Category dropdown */}
            <select
              value={filters.category_id ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value || undefined, page: 1 }))}
              className="px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-600 focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none cursor-pointer transition-all"
            >
              <option value="">All Categories</option>
              {(categories ?? []).filter((c) => !c.parent_id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Low stock only filter */}
            <button
              onClick={() => setFilters(f => ({ ...f, low_stock: !f.low_stock, out_of_stock: false, page: 1 }))}
              className={`px-3 py-2 text-xs font-bold rounded-md border transition-all ${filters.low_stock
                  ? 'bg-amber-50 border-amber-100 text-amber-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              Low stock only
            </button>

            {/* Out of stock only filter */}
            <button
              onClick={() => setFilters(f => ({ ...f, out_of_stock: !f.out_of_stock, low_stock: false, page: 1 }))}
              className={`px-3 py-2 text-xs font-bold rounded-md border transition-all ${filters.out_of_stock
                  ? 'bg-rose-50 border-rose-100 text-rose-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              Out of stock only
            </button>
          </div>

          <div className="flex items-center gap-3">
            {(filters.search || filters.category_id || filters.low_stock || filters.out_of_stock) && (
              <button
                onClick={() => setFilters({ page: 1, limit: 12 })}
                className="text-xs text-[#0FA86E] hover:underline font-bold"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Table & Cards container */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F9F4]/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-4 w-10">
                    <input type="checkbox" className="rounded border-gray-300 text-[#0FA86E] focus:ring-[#0FA86E]" />
                  </th>
                  <th className="px-5 py-4">Product Description</th>
                  <th className="px-5 py-4 w-44">Category</th>
                  <th className="px-5 py-4 w-36">Status</th>
                  <th className="px-5 py-4 w-28 text-center">Available Stock</th>
                  <th className="px-5 py-4 w-40 text-right">Retail Prices</th>
                  <th className="px-5 py-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-100">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-5"><div className="h-4 bg-gray-50 rounded-md w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
                          <Package className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">No inventory matches</h3>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
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
                        className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 text-xs"
                      >
                        <td className="px-5 py-4 align-middle">
                          <input type="checkbox" className="rounded border-gray-300 text-[#0FA86E] focus:ring-[#0FA86E]" />
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 flex-shrink-0 bg-white rounded-md border border-gray-100 overflow-hidden flex items-center justify-center shadow-xs">
                              {item.image_url ? (
                                <img src={item.image_url} alt="" className="h-full w-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/products/${(item.product_id || item.id)}/edit`}
                                className="font-bold text-[#0FA86E] hover:text-[#0d9561] hover:underline block truncate max-w-[400px]"
                              >
                                {item.product_name}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5 text-gray-400 font-sans font-bold text-[9px] uppercase tracking-wider">
                                <span>SKU: {item.product_sku ?? 'N/A'}</span>
                                <span>|</span>
                                <span>ID: {String((item.product_id || item.id) ?? item.id ?? '').slice(0, 8)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle text-gray-600 font-bold">
                          {item.category_name ?? 'Uncategorized'}
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <StatusBadge stock={item.stock_quantity} min={item.minimum_stock_alert} />
                        </td>
                        <td className="px-5 py-4 align-middle text-center">
                          <div className="flex justify-center">
                            <InlineStock
                              item={item}
                              onSave={(v) => void handleStockSave((item.product_id || item.id), v)}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle text-right">
                          <div className="flex flex-col justify-end">
                            <span className="font-black text-gray-900">₹{item.selling_price.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-400 font-bold">MRP: ₹{item.buying_price.toLocaleString('en-IN')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/products/${(item.product_id || item.id)}/edit`}
                              className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-bold text-[11px] shadow-xs transition-colors"
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
          <div className="block md:hidden divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2 animate-pulse bg-white">
                  <div className="h-4 bg-gray-50 rounded-md w-1/3" />
                  <div className="h-3 bg-gray-50 rounded-md w-2/3" />
                  <div className="h-4 bg-gray-50 rounded-md w-1/4" />
                </div>
              ))
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No inventory listed.
              </div>
            ) : (
              items.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white hover:bg-gray-50/50 transition-colors flex flex-col gap-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 bg-white rounded-md border border-gray-100 overflow-hidden flex items-center justify-center shadow-xs">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/products/${(item.product_id || item.id)}/edit`}
                            className="font-bold text-[#0FA86E] hover:text-[#0d9561] hover:underline truncate block max-w-[200px]"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-[9px] text-gray-400 font-bold font-sans mt-0.5 uppercase tracking-wider">
                            SKU: {item.product_sku ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge stock={item.stock_quantity} min={item.minimum_stock_alert} />
                    </div>

                    <div className="flex items-center justify-between border-t border-b border-dashed border-gray-100 py-2.5">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Qty</span>
                          <div className="mt-1">
                            <InlineStock
                              item={item}
                              onSave={(v) => void handleStockSave((item.product_id || item.id), v)}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Price</span>
                          <span className="font-bold text-gray-900 text-xs block mt-1">
                            ₹{item.selling_price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Category</span>
                          <span className="text-gray-600 font-bold block mt-1">
                            {item.category_name ?? 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-0.5">
                      <Link
                        to={`/products/${(item.product_id || item.id)}/edit`}
                        className="px-4 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md font-bold text-center text-xs shadow-xs transition-colors flex-1"
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
          <div className="bg-white p-4 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-900">
                {((filters.page ?? 1) - 1) * (filters.limit ?? 12) + 1}–{Math.min((filters.page ?? 1) * (filters.limit ?? 12), meta.total)}
              </span> of <span className="font-bold text-gray-900">{meta.total}</span> products
            </p>
            <Pagination
              page={filters.page ?? 1}
              totalPages={meta.total_pages}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            />
          </div>
        )}

      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 font-sans animate-fade-in backdrop-blur-[2px]">
          <div className="bg-white rounded-lg border border-gray-300 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Export Inventory CSV</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-black"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setExportMode('default')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                    exportMode === 'default'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Quick Download
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('customize')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                    exportMode === 'customize'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Customize Template
                </button>
              </div>

              {exportMode === 'default' ? (
                <div className="text-xs text-gray-600 space-y-2 py-2">
                  <p>Downloads the standard inventory template containing all columns:</p>
                  <div className="bg-gray-50 p-2.5 rounded border border-gray-200 font-mono text-[10px] text-gray-500 break-all leading-normal">
                    name, sku, category, stock_quantity, minimum_stock_alert, buying_price, selling_price, mrp, condition, is_active
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select columns to export:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {customColumns.map((col) => {
                      const isDefault = DEFAULT_COLUMNS.some((d) => d.id === col.id);
                      return (
                        <div
                          key={col.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(col.id)}
                              onChange={() => toggleColumn(col.id)}
                              className="rounded text-[#e47911] focus:ring-[#e47911] border-gray-300 w-3.5 h-3.5 animate-pulse-once"
                            />
                            <span className="truncate" title={col.label}>{col.label}</span>
                          </label>
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomColumn(col.id)}
                              className="text-gray-400 hover:text-red-600 font-bold ml-1 text-xs transition-colors"
                              title="Delete column"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Column Section */}
                  <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Add Custom Specification Column</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. material)"
                        value={newColKey}
                        onChange={(e) => setNewColKey(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:border-[#e47911] focus:ring-1 focus:ring-[#e47911] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g. Material)"
                        value={newColLabel}
                        onChange={(e) => setNewColLabel(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:border-[#e47911] focus:ring-1 focus:ring-[#e47911] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColumn}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-semibold shadow transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Spec keys must match the attributes inside your product specifications (e.g. <i>blade_material</i>, <i>dishwasher_safe</i>).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={exportMode === 'customize' && selectedColumns.length === 0}
                onClick={() => void handleExport()}
                className="px-4 py-1.5 bg-[#f0c14b] hover:bg-[#edd8a4] border border-[#a88734] rounded text-xs font-bold text-[#111] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
