import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import type { ApiResponse, BulkUploadLog } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface UploadResult {
  success_count: number;
  error_count: number;
  errors: { row: number; sku: string; message: string }[];
}

function parseCSVPreview(text: string, maxRows = 10): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1, maxRows + 1).map((line) =>
    line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
  );
  return { headers, rows };
}

const DEFAULT_TEMPLATE_COLUMNS = [
  { id: 'name', label: 'Product Name' },
  { id: 'sku', label: 'SKU' },
  { id: 'category_slug', label: 'Category Slug' },
  { id: 'brand', label: 'Brand' },
  { id: 'description', label: 'Description' },
  { id: 'mrp', label: 'MRP' },
  { id: 'buying_price', label: 'Buying Price' },
  { id: 'selling_price', label: 'Selling Price' },
  { id: 'condition', label: 'Condition' },
  { id: 'damage_description', label: 'Damage Description' },
  { id: 'defect_description', label: 'Defect Description' },
  { id: 'stock_quantity', label: 'Available Stock' },
  { id: 'minimum_stock_alert', label: 'Minimum Stock Alert' },
  { id: 'is_b2b_available', label: 'B2B Available' },
  { id: 'b2b_price', label: 'B2B Price' },
  { id: 'b2b_minimum_quantity', label: 'B2B Min Quantity' },
  { id: 'weight_grams', label: 'Weight (Grams)' },
  { id: 'tags', label: 'Tags' },
  { id: 'image_urls', label: 'Image URLs' },
  { id: 'specifications', label: 'Specifications (JSON)' },
];

const REQUIRED_TEMPLATE_COLUMNS: string[] = [];

export default function BulkUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template Customization state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateMode, setTemplateMode] = useState<'default' | 'customize'>('default');
  const [customColumns, setCustomColumns] = useState<{ id: string; label: string }[]>(DEFAULT_TEMPLATE_COLUMNS);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    DEFAULT_TEMPLATE_COLUMNS.map((c) => c.id)
  );
  const [newColKey, setNewColKey] = useState('');
  const [newColLabel, setNewColLabel] = useState('');

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['admin', 'bulk-upload', 'history'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BulkUploadLog[]>>('/admin/products/bulk-upload/history');
      return res.data.data;
    },
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setResult(null);

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPreview(parseCSVPreview(text));
      };
      reader.readAsText(file);
    } else {
      setPreview(null);
    }
  };

  const toggleColumn = (id: string) => {
    setSelectedColumns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
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
    if (REQUIRED_TEMPLATE_COLUMNS.includes(id)) return;
    setCustomColumns((prev) => prev.filter((col) => col.id !== id));
    setSelectedColumns((prev) => prev.filter((c) => c !== id));
  };

  const handleDownloadTemplate = async () => {
    const toastId = toast.loading('Generating template...');
    try {
      const queryParams = new URLSearchParams();
      if (templateMode === 'customize') {
        queryParams.set('columns', selectedColumns.join(','));
      }

      const res = await api.get(`/admin/products/bulk-upload/template?${queryParams}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'product_upload_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded', { id: toastId });
      setShowTemplateModal(false);
    } catch (err: any) {
      console.error('Template download error:', err);
      let errMsg = 'Failed to download template';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error) {
            errMsg = parsed.error;
          }
        } catch {}
      } else if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post<ApiResponse<UploadResult>>('/admin/products/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data);
      toast.success(`Upload complete: ${res.data.data.success_count} succeeded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full pb-12 px-2 sm:px-0">
      {/* Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-300 p-4 rounded shadow-sm mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111]">
            Add Products via Upload
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Use a spreadsheet to bulk create or update product listings.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex-1 sm:flex-none px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded-md hover:bg-[#f7fafa] shadow-sm transition-colors text-center"
          >
            Download Template
          </button>
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* Upload Section */}
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300">
            <h3 className="text-sm font-bold text-[#0f1111]">Upload Inventory File</h3>
          </div>
          <div className="p-5">
            <div
              className={`border-2 border-dashed rounded-md p-10 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-amazon-orange bg-orange-50' : 'border-gray-300 hover:border-amazon-orange hover:bg-gray-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFileSelect(f);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-3">📤</div>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-green-700">✅ {selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-amazon-blue">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-gray-500 mt-2">Format: .csv or .xlsx</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>

            {selectedFile && (
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-end border-t border-gray-200 pt-5">
                <button
                  onClick={() => void handleUpload()}
                  disabled={uploading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-1.5 text-sm font-bold text-[#0f1111] bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded-md disabled:opacity-60 shadow-sm transition-colors"
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Uploading File...
                    </>
                  ) : (
                    'Upload File'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {preview && (
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300">
              <h3 className="text-sm font-bold text-[#0f1111]">File Preview (First 10 rows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead className="bg-[#f7fafa] border-b border-gray-300">
                  <tr>
                    {preview.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-bold text-[#0f1111] whitespace-nowrap border-r border-gray-300 last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-[#f7fafa]">
                      {row.map((cell, j) => {
                        const header = preview.headers[j] || '';
                        const isImage = header.toLowerCase().includes('image') && cell?.startsWith('http');
                        return (
                          <td key={j} className="px-3 py-2 text-[#0f1111] whitespace-nowrap border-r border-gray-200 last:border-r-0">
                            {isImage ? (
                              <div className="flex gap-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                                {cell.split(';').map((url, idx) => (
                                  <img 
                                    key={idx} 
                                    src={url.trim()} 
                                    alt="Preview" 
                                    className="w-8 h-8 object-cover rounded border border-gray-300"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=?'; }}
                                  />
                                ))}
                              </div>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
            <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300">
              <h3 className="text-sm font-bold text-[#0f1111]">Upload Results</h3>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 border border-green-300 bg-green-50 rounded-sm">
                  <span className="text-lg">✅</span>
                  <span className="text-sm font-bold text-green-800">{result.success_count} records processed successfully</span>
                </div>
                {result.error_count > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 border border-red-300 bg-red-50 rounded-sm">
                    <span className="text-lg">❌</span>
                    <span className="text-sm font-bold text-red-800">{result.error_count} records failed</span>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="overflow-x-auto border border-gray-300 rounded-sm">
                  <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-[#f0f2f2] border-b border-gray-300">
                      <tr>
                        <th className="px-3 py-2 font-bold text-[#0f1111] whitespace-nowrap border-r border-gray-300">Row</th>
                        <th className="px-3 py-2 font-bold text-[#0f1111] whitespace-nowrap border-r border-gray-300">SKU</th>
                        <th className="px-3 py-2 font-bold text-[#0f1111]">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {result.errors.map((e, i) => (
                        <tr key={i} className="hover:bg-[#f7fafa]">
                          <td className="px-3 py-2 text-[#0f1111] font-mono border-r border-gray-200">{e.row}</td>
                          <td className="px-3 py-2 text-[#0f1111] font-mono border-r border-gray-200">{e.sku}</td>
                          <td className="px-3 py-2 text-red-700 font-medium">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload History */}
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-300">
            <h3 className="text-sm font-bold text-[#0f1111]">Spreadsheet Upload Status</h3>
          </div>
          {historyLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 font-medium">
              No upload history available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead className="bg-[#f7fafa] border-b border-gray-300">
                  <tr>
                    {['Date and Time', 'File Name', 'Total Records', 'Success', 'Errors', 'Uploaded By'].map((h) => (
                      <th key={h} className="px-3 py-2 font-bold text-[#0f1111] whitespace-nowrap border-r border-gray-300 last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-[#f7fafa]">
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap border-r border-gray-200">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-2 text-[#0f1111] font-medium border-r border-gray-200">{log.filename}</td>
                      <td className="px-3 py-2 text-[#0f1111] border-r border-gray-200 text-center">{log.total_rows}</td>
                      <td className="px-3 py-2 text-green-700 font-bold border-r border-gray-200 text-center">{log.success_count}</td>
                      <td className="px-3 py-2 border-r border-gray-200 text-center">
                        {log.error_count > 0 ? (
                          <span className="text-red-700 font-bold">{log.error_count}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[#0f1111] font-medium">{log.uploaded_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 font-sans animate-fade-in backdrop-blur-[2px]">
          <div className="bg-white rounded-lg border border-gray-300 shadow-2xl max-w-md w-full overflow-hidden text-left">
            {/* Header */}
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Download Product Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
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
                  onClick={() => setTemplateMode('default')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                    templateMode === 'default'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Quick Download
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateMode('customize')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                    templateMode === 'customize'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Customize Template
                </button>
              </div>

              {templateMode === 'default' ? (
                <div className="text-xs text-gray-600 space-y-2 py-2">
                  <p>Downloads the standard bulk upload template containing all columns and sample products:</p>
                  <div className="bg-gray-50 p-2.5 rounded border border-gray-200 font-mono text-[10px] text-gray-500 break-all leading-normal">
                    name, sku, category_slug, brand, description, mrp, buying_price, selling_price, condition, damage_description, defect_description, stock_quantity, minimum_stock_alert, is_b2b_available, b2b_price, b2b_minimum_quantity, weight_grams, tags, image_urls, specifications
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select columns to include in CSV:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {customColumns.map((col) => {
                      const isRequired = REQUIRED_TEMPLATE_COLUMNS.includes(col.id);
                      const isDefault = DEFAULT_TEMPLATE_COLUMNS.some((d) => d.id === col.id);
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
                              className="rounded text-[#e47911] focus:ring-[#e47911] border-gray-300 w-3.5 h-3.5"
                            />
                            <span className="truncate" title={col.label}>
                              {col.label} {isRequired && <span className="text-[10px] text-orange-600 font-bold" title="Required field">*</span>}
                            </span>
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

                  <p className="text-[10px] text-orange-600 font-medium bg-orange-50 border border-orange-100 p-2 rounded leading-relaxed">
                    ⚠️ * Asterisk indicates columns required to successfully upload products. Unselecting them may cause imports to fail.
                  </p>

                  {/* Add custom specs */}
                  <div className="border-t border-gray-150 pt-3 mt-3">
                    <p className="text-xs font-bold text-gray-600 mb-1.5">Add Custom Specification Column</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. material)"
                        value={newColKey}
                        onChange={(e) => setNewColKey(e.target.value)}
                        className="flex-1 min-w-0 text-xs px-2.5 py-1 border border-gray-300 rounded focus:border-[#e47911] focus:ring-1 focus:ring-[#e47911] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g. Material)"
                        value={newColLabel}
                        onChange={(e) => setNewColLabel(e.target.value)}
                        className="flex-1 min-w-0 text-xs px-2.5 py-1 border border-gray-300 rounded focus:border-[#e47911] focus:ring-1 focus:ring-[#e47911] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColumn}
                        className="px-3 py-1 bg-amazon-blue hover:bg-amazon-blue-light text-white text-xs font-bold rounded shadow-sm transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Spec keys must match attributes inside your products specifications.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadTemplate()}
                className="px-4 py-1.5 bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded text-xs font-bold text-gray-900 shadow-sm transition-colors"
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
