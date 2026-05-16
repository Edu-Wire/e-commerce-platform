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

export default function BulkUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/admin/products/bulk-upload/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'product_upload_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step 1: Download Template */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
          <h3 className="font-semibold text-gray-800">Download Template</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Download the CSV template with all required columns. Fill it with your product data.
        </p>
        <button
          onClick={() => void handleDownloadTemplate()}
          className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          📥 Download CSV Template
        </button>
      </div>

      {/* Step 2: Upload File */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
          <h3 className="font-semibold text-gray-800">Upload File</h3>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
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
          <div className="text-3xl mb-2">📤</div>
          {selectedFile ? (
            <div>
              <p className="text-sm font-medium text-green-700">✅ {selectedFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-600">Drag & drop or click to select</p>
              <p className="text-xs text-gray-400 mt-1">CSV or XLSX files supported</p>
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
      </div>

      {/* Step 3: Preview */}
      {preview && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <h3 className="font-semibold text-gray-800">Preview (first 10 rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    {row.map((cell, j) => {
                      const header = preview.headers[j] || '';
                      const isImage = header.toLowerCase().includes('image') && cell?.startsWith('http');
                      return (
                        <td key={j} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                          {isImage ? (
                            <div className="flex gap-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                              {cell.split(';').map((url, idx) => (
                                <img 
                                  key={idx} 
                                  src={url.trim()} 
                                  alt="Preview" 
                                  className="w-8 h-8 object-cover rounded border border-gray-200"
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

      {/* Step 4: Upload */}
      {selectedFile && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
            <h3 className="font-semibold text-gray-800">Upload</h3>
          </div>

          <button
            onClick={() => void handleUpload()}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {uploading ? (
              <>
                <LoadingSpinner size="sm" />
                Uploading rows...
              </>
            ) : (
              '🚀 Start Upload'
            )}
          </button>
        </div>
      )}

      {/* Step 5: Results */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
            <h3 className="font-semibold text-gray-800">Upload Results</h3>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-lg">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-medium text-green-800">{result.success_count} uploaded successfully</p>
              </div>
            </div>
            {result.error_count > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-lg">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="text-sm font-medium text-red-800">{result.error_count} rows failed</p>
                </div>
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-amber-200 rounded-lg overflow-hidden">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-amber-800">Row #</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-amber-800">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-amber-800">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 bg-amber-50/50">
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-amber-800 font-mono">{e.row}</td>
                      <td className="px-3 py-2 text-amber-800 font-mono">{e.sku}</td>
                      <td className="px-3 py-2 text-red-700">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upload History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Upload History</h3>
        {historyLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No upload history yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['File', 'Total Rows', 'Success', 'Errors', 'Uploaded By', 'Date'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700 font-medium">{log.filename}</td>
                    <td className="px-3 py-2 text-gray-600">{log.total_rows}</td>
                    <td className="px-3 py-2 text-green-600 font-medium">{log.success_count}</td>
                    <td className="px-3 py-2">
                      {log.error_count > 0 ? (
                        <span className="text-red-600 font-medium">{log.error_count}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{log.uploaded_by}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
