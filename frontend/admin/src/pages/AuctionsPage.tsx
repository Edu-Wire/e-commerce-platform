import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';

interface Product {
  id: number;
  name?: string;
  product_name?: string;
  sku?: string;
  product_sku?: string;
  stock_quantity: number;
  is_auction_ready: boolean;
  auction_priority: number;
  images?: any;
  image_url?: string | null;
  selling_price?: number;
  mrp?: number;
}

const getProductImage = (product: Product) => {
  if (product.image_url) {
    let url = product.image_url;
    if (url.startsWith('/')) {
      url = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${url}`;
    }
    return url;
  }

  let images: any[] = [];
  try {
    images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
  } catch (e) { }
  const mainImageObj = images?.[0];
  let url = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');

  if (url.startsWith('/')) {
    url = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${url}`;
  }
  return url;
};

export default function AuctionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reservePrice, setReservePrice] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [minimumSpread, setMinimumSpread] = useState('1.00');
  const [spread, setSpread] = useState('0.00'); // New state for spread price
  const [quantity, setQuantity] = useState('1');
  const [numberOfAuctions, setNumberOfAuctions] = useState('1');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [outbidPurchaseMarkupPercent, setOutbidPurchaseMarkupPercent] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/admin/inventory?page=${page}&limit=20`);
      setProducts(res.data.data.items);
      setTotalPages(res.data.data.meta.total_pages);
      setTotalItems(res.data.data.meta.total);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuction = async (product: Product) => {
    setUpdating(product.id);
    try {
      await api.patch(`/admin/inventory/auction/${product.id}`, {
        is_auction_ready: !product.is_auction_ready,
        auction_priority: product.auction_priority
      });
      toast.success('Status updated');
      fetchProducts();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handlePriorityChange = async (product: Product, newPriority: number) => {
    setUpdating(product.id);
    try {
      await api.patch(`/admin/inventory/auction/${product.id}`, {
        is_auction_ready: product.is_auction_ready,
        auction_priority: newPriority
      });
      toast.success('Priority updated');
      fetchProducts();
    } catch {
      toast.error('Failed to update priority');
    } finally {
      setUpdating(null);
    }
  };

  const formatLocalDatetime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSetDuration = (minutes: number) => {
    const now = new Date();
    const currentStart = startTime ? new Date(startTime) : now;
    const baseStart = (!startTime || currentStart.getTime() <= now.getTime() + 10000) ? now : currentStart;

    setStartTime(formatLocalDatetime(baseStart));
    const baseEnd = new Date(baseStart.getTime() + minutes * 60 * 1000);
    setEndTime(formatLocalDatetime(baseEnd));
  };

  const handleResetStartToNow = () => {
    const now = new Date();
    setStartTime(formatLocalDatetime(now));

    // Adjust end time to keep the current duration or default to 40 mins
    const currentStart = startTime ? new Date(startTime).getTime() : 0;
    const currentEnd = endTime ? new Date(endTime).getTime() : 0;
    let durationMins = 40;
    if (currentStart > 0 && currentEnd > currentStart) {
      durationMins = Math.round((currentEnd - currentStart) / 60000);
    }
    const end = new Date(now.getTime() + durationMins * 60 * 1000);
    setEndTime(formatLocalDatetime(end));
  };

  const getDurationText = () => {
    if (!startTime || !endTime) return '';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (isNaN(start) || isNaN(end)) return '';
    const diffMs = end - start;
    if (diffMs <= 0) return 'End time must be after start time';
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs === 0) return `Auction duration: ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    return `Auction duration: ${hrs} ${hrs === 1 ? 'hour' : 'hours'}${mins > 0 ? ` and ${mins} ${mins === 1 ? 'minute' : 'minutes'}` : ''}`;
  };

  const handleOpenStartModal = (product: Product) => {
    setSelectedProduct(product);
    setReservePrice(String(product.selling_price || ''));
    setBidPrice(String(Math.round((product.selling_price || 0) * 0.7) || '')); // 70% default bid
    setMinimumSpread('1.00');
    setSpread('0.00'); // Reset spread
    setQuantity('1');
    setNumberOfAuctions('1');
    setOutbidPurchaseMarkupPercent('');

    // Set default start time to the current local time (NOW)
    const now = new Date();
    setStartTime(formatLocalDatetime(now));

    // Set default end time to 40 minutes after start
    const end = new Date(now.getTime() + 40 * 60 * 1000);
    setEndTime(formatLocalDatetime(end));

    setIsModalOpen(true);
  };

  const handleStartAuction = async () => {
    if (!selectedProduct || !reservePrice || !startTime || !endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(reservePrice) <= 0) {
      toast.error('Ask Price must be a positive number');
      return;
    }

    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();

    if (isNaN(startTimestamp)) {
      toast.error('Invalid Start Time');
      return;
    }
    if (isNaN(endTimestamp)) {
      toast.error('Invalid End Time');
      return;
    }

    if (endTimestamp <= startTimestamp) {
      toast.error('End Time must be after Start Time');
      return;
    }

    const totalNeeded = parseInt(quantity, 10) * parseInt(numberOfAuctions, 10);
    if (totalNeeded > selectedProduct.stock_quantity) {
      toast.error(`Total units needed (${totalNeeded}) exceeds available stock (${selectedProduct.stock_quantity})`);
      return;
    }

    setUpdating(selectedProduct.id);
    setIsModalOpen(false);

    // Calculate actual duration and adjust times if starting "now" to prevent duration loss
    const durationMs = endTimestamp - startTimestamp;
    let finalStartIso = new Date(startTime).toISOString();
    let finalEndIso = new Date(endTime).toISOString();

    if (startTimestamp <= Date.now() + 5000) {
      const actualNow = new Date();
      finalStartIso = actualNow.toISOString();
      finalEndIso = new Date(actualNow.getTime() + durationMs).toISOString();
    }

    try {
      await api.patch(`/admin/inventory/auction/${selectedProduct.id}`, {
        is_auction_ready: true,
        auction_priority: selectedProduct.auction_priority,
        reserve_price: reservePrice,
        current_highest_bid: bidPrice || reservePrice,
        minimum_spread: minimumSpread,
        spread: spread, // Send spread
        quantity: quantity,
        number_of_auctions: numberOfAuctions,
        start_time: finalStartIso,
        end_time: finalEndIso,
        outbid_purchase_markup_percent: outbidPurchaseMarkupPercent || null
      });
      toast.success('Auction started successfully!');
      fetchProducts();
    } catch {
      toast.error('Failed to start auction');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-700 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <span>&gt;</span>
              <span className="text-[#0FA86E]">Auction Management</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">Auction Management</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Queue products or start auctions immediately.</p>
          </div>
          <Link 
            to="/auctions/running" 
            className="w-full sm:w-auto text-center px-4 py-2.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white rounded-md text-xs font-bold shadow-xs transition-colors"
          >
            View Running Auctions
          </Link>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs text-left">
              <thead>
                <tr className="bg-[#F4F9F4]/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 w-44">SKU</th>
                  <th className="px-6 py-4 w-32">Stock</th>
                  <th className="px-6 py-4 w-36">Status</th>
                  <th className="px-6 py-4 w-36">Priority</th>
                  <th className="px-6 py-4 text-right w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 bg-white rounded-md border border-gray-100 overflow-hidden flex items-center justify-center shadow-xs">
                        <img src={getProductImage(product)} alt={product.name || product.product_name} className="h-full w-full object-contain" />
                      </div>
                      <span className="truncate max-w-[280px]">{product.name || product.product_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-bold font-sans uppercase tracking-wider">{product.sku || product.product_sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-bold">{product.stock_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[9px] font-black border uppercase tracking-wider ${product.is_auction_ready 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                        }`}>
                        {product.is_auction_ready ? 'Queued' : 'Not Queued'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={product.auction_priority}
                        onChange={(e) => handlePriorityChange(product, parseInt(e.target.value, 10))}
                        className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none"
                        disabled={updating === product.id}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        <button
                          onClick={() => handleToggleAuction(product)}
                          disabled={updating === product.id || (product.stock_quantity <= 0 && !product.is_auction_ready)}
                          className={`font-bold transition-colors ${product.is_auction_ready
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-[#0FA86E] hover:text-[#0d9561]'
                            } disabled:opacity-50`}
                        >
                          {updating === product.id ? 'Updating...' : product.is_auction_ready ? 'Remove' : 'Queue'}
                        </button>

                        <button
                          onClick={() => handleOpenStartModal(product)}
                          disabled={updating === product.id || product.stock_quantity <= 0}
                          className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-bold text-[11px] shadow-xs transition-colors disabled:opacity-50"
                        >
                          Start Now
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4.5 flex items-center justify-between border-t border-gray-100 select-none">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-xs font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-200 text-xs font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium">
                    Showing <span className="font-bold text-gray-900">{(page - 1) * 20 + 1}</span> to{' '}
                    <span className="font-bold text-gray-900">{Math.min(page * 20, totalItems)}</span> of{' '}
                    <span className="font-bold text-gray-900">{totalItems}</span> products
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-200 bg-white text-xs font-bold text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      &larr; Prev
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`relative inline-flex items-center px-3 py-2 border text-xs font-bold transition-all ${
                          p === page
                            ? 'z-10 bg-emerald-50 border-[#0FA86E] text-[#0FA86E]'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-200 bg-white text-xs font-bold text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Auction Modal */}
      <Modal
        title="Start Auction"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4 text-xs font-medium">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Starting auction for: <span className="text-gray-900 font-black normal-case">{selectedProduct?.name || selectedProduct?.product_name}</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Ask Price (Seller Price)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Initial Bid Price (Starting Bid)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Bid Increment (Fixed Amount)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={minimumSpread}
                  onChange={(e) => setMinimumSpread(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none"
                  placeholder="1.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Spread Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={spread}
                  onChange={(e) => setSpread(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Units per Auction
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none bg-white"
                placeholder="1"
                min="1"
                max={selectedProduct?.stock_quantity || 0}
              />
              <p className="text-[10px] text-gray-400 font-bold mt-1">Available: {selectedProduct?.stock_quantity}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Outbid Offer Price Markup %
              </label>
              <input
                type="number"
                value={outbidPurchaseMarkupPercent}
                onChange={(e) => setOutbidPurchaseMarkupPercent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none bg-white"
                placeholder="e.g. 50"
                min="0"
              />
              <p className="text-[10px] text-gray-400 font-medium mt-1">Leave empty to disable outbid purchase offers.</p>
            </div>
          </div>

          <div className="bg-[#F4F9F4]/40 p-4.5 rounded-lg border border-[#0FA86E]/10 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Schedule Auction Time</span>
              <button
                type="button"
                onClick={handleResetStartToNow}
                className="text-[11px] font-bold text-[#0FA86E] hover:text-[#0d9561] transition-colors"
              >
                Reset Start to NOW
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:ring-1 focus:ring-[#0FA86E] focus:border-[#0FA86E] outline-none bg-white"
                />
              </div>
            </div>

            {/* Quick Duration presets */}
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Quick Duration Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {[1, 15, 30, 40, 60, 120, 1440].map((mins) => {
                  const label = mins >= 60 ? `${mins / 60} ${mins === 60 ? 'Hour' : 'Hours'}` : `${mins} ${mins === 1 ? 'Min' : 'Mins'}`;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSetDuration(mins)}
                      className="px-2.5 py-1 text-[10px] bg-white hover:bg-emerald-50 hover:text-[#0FA86E] border border-gray-200 hover:border-[#0FA86E] rounded-md font-bold transition-colors shadow-xs"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helper Duration Calculation Text */}
            {getDurationText() && (
              <div className="text-[10px] font-bold text-gray-500 bg-white border border-gray-100 rounded-md p-2 text-center shadow-xs">
                🕒 {getDurationText()}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartAuction}
              className="px-4 py-2 text-xs font-bold bg-[#0FA86E] text-white rounded-md hover:bg-[#0d9561] transition-colors shadow-xs"
            >
              Start Auction
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
