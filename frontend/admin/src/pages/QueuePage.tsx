import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  ListOrdered, 
  Trash2, 
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

function InlinePriority({ item, onSave }: { item: any; onSave: (val: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(item.auction_priority));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num !== item.auction_priority) {
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
          if (e.key === 'Escape') { setValue(String(item.auction_priority)); setEditing(false); }
        }}
        autoFocus
        className="w-16 px-1.5 py-1 text-center border border-[#e47911] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#e47911] shadow-sm bg-white"
      />
    );
  }

  return (
    <button
      onClick={() => { setValue(String(item.auction_priority)); setEditing(true); }}
      className="text-xs font-semibold px-2.5 py-1 rounded border border-gray-300 hover:border-[#e47911] hover:bg-gray-50 transition-colors text-gray-900 flex items-center gap-1 group w-16 justify-center mx-auto"
      title="Click to edit priority"
    >
      {item.auction_priority}
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function QueuePage() {
  const [queuedAuctions, setQueuedAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchQueuedAuctions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auctions/queued');
      if (res.data && Array.isArray(res.data.data)) {
        setQueuedAuctions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch queued products:', err);
      toast.error('Failed to load queue list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueuedAuctions();
  }, []);

  const handleUpdatePriority = async (productId: number, newPriority: number) => {
    setUpdatingId(productId);
    try {
      await api.patch(`/admin/inventory/auction/${productId}`, {
        is_auction_ready: true,
        auction_priority: newPriority
      });
      toast.success('Queue priority updated');
      fetchQueuedAuctions();
    } catch {
      toast.error('Failed to update priority');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveFromQueue = async (productId: number, currentPriority: number) => {
    if (!confirm('Are you sure you want to remove this product from the upcoming queue?')) return;
    setUpdatingId(productId);
    try {
      await api.patch(`/admin/inventory/auction/${productId}`, {
        is_auction_ready: false,
        auction_priority: currentPriority
      });
      toast.success('Removed from upcoming queue');
      fetchQueuedAuctions();
    } catch {
      toast.error('Failed to remove from queue');
    } finally {
      setUpdatingId(null);
    }
  };

  const getProductImage = (product: any) => {
    let images: any[] = [];
    try {
      images = typeof product.product_images === 'string' ? JSON.parse(product.product_images) : product.product_images;
    } catch (e) { }
    const mainImageObj = images?.[0];
    let url = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');

    if (url.startsWith('/')) {
      url = `${(import.meta as any).env.VITE_API_URL || "http://localhost:4000"}${url}`;
    }
    return url;
  };

  return (
    <div className="min-h-full bg-[#eaeded] -m-6 p-4 sm:p-6 text-[#111] font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-4 border border-gray-300 rounded shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link to="/auctions" className="hover:text-[#c45500] hover:underline">Auctions</Link>
              <span>&gt;</span>
              <span className="font-semibold text-gray-700">Upcoming Queue</span>
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mt-1 flex items-center gap-2">
              <ListOrdered className="w-6 h-6 text-amazon-orange" />
              <span>Upcoming Auction Queue</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              These products are queued to start automatically when the current active auction ends. Drag & drop or update priorities inline to reorder the upcoming auction stack.
            </p>
          </div>
          <div>
            <Link
              to="/inventory"
              className="px-4 py-1.5 bg-[#f0c14b] hover:bg-[#edd8a4] border border-[#a88734] hover:border-[#846a29] text-xs font-semibold rounded text-[#111] shadow-sm transition-all inline-flex items-center gap-1.5"
            >
              <span>Add Items to Queue</span>
            </Link>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f6f6] border-b border-gray-300 text-xs font-semibold text-gray-600">
                  <th className="px-5 py-3 w-20 text-center">Position</th>
                  <th className="px-5 py-3">Product Description</th>
                  <th className="px-5 py-3 w-40 text-right">Retail Price (M.R.P)</th>
                  <th className="px-5 py-3 w-36 text-center">Queue Priority</th>
                  <th className="px-5 py-3 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-200">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-5 py-6"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : queuedAuctions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center text-gray-400 mb-3 border border-gray-200">
                          <ListOrdered className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Upcoming Auction Queue is Empty</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          There are no products ready to go next. Go to the Inventory page and flag products as "is_auction_ready" to populate this queue.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  queuedAuctions.map((product: any, index: number) => {
                    return (
                      <tr 
                        key={product.product_id} 
                        className="hover:bg-[#fcfcfc] transition-colors border-b border-gray-200 text-xs"
                      >
                        <td className="px-5 py-4 align-middle text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 font-extrabold text-slate-800 text-[11px]">
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 flex-shrink-0 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center p-0.5">
                              <img src={getProductImage(product)} alt="" className="h-full w-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-gray-900 block truncate max-w-[500px]">
                                {product.product_name}
                              </span>
                              <span className="text-[10px] text-gray-400 block truncate max-w-[500px] mt-0.5 font-medium">
                                {product.product_description || 'Premium retail product queued for next auction.'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle text-right font-bold text-gray-900">
                          ₹{parseFloat(product.product_mrp).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 align-middle text-center">
                          <InlinePriority 
                            item={product} 
                            onSave={(val) => handleUpdatePriority(product.product_id, val)} 
                          />
                        </td>
                        <td className="px-5 py-4 align-middle text-right">
                          <button
                            onClick={() => handleRemoveFromQueue(product.product_id, product.auction_priority)}
                            disabled={updatingId === product.product_id}
                            className="px-2.5 py-1 text-red-600 hover:text-red-950 hover:bg-red-50 border border-transparent rounded font-semibold text-[11px] transition-all inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
