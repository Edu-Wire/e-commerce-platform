import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';

interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  is_auction_ready: boolean;
  auction_priority: number;
  images?: any;
  selling_price?: number;
  mrp?: number;
}

const getProductImage = (product: Product) => {
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
    const baseStart = startTime ? new Date(startTime) : new Date();
    if (isNaN(baseStart.getTime())) return;
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
    if (hrs === 0) return `Auction duration: ${mins} minutes`;
    return `Auction duration: ${hrs} ${hrs === 1 ? 'hour' : 'hours'}${mins > 0 ? ` and ${mins} minutes` : ''}`;
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
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auction Management</h1>
          <p className="text-sm text-gray-500">Queue products or start auctions immediately.</p>
        </div>
        <Link to="/auctions/running" className="w-full sm:w-auto text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          View Running Auctions
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-3">
                  <img src={getProductImage(product)} alt={product.name} className="w-10 h-10 object-contain rounded" />
                  <span>{product.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock_quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_auction_ready ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {product.is_auction_ready ? 'Queued' : 'Not Queued'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={product.auction_priority}
                    onChange={(e) => handlePriorityChange(product, parseInt(e.target.value, 10))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updating === product.id}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                  <button
                    onClick={() => handleToggleAuction(product)}
                    disabled={updating === product.id || (product.stock_quantity <= 0 && !product.is_auction_ready)}
                    className={`text-sm font-medium ${product.is_auction_ready
                      ? 'text-red-600 hover:text-red-900'
                      : 'text-blue-600 hover:text-blue-900'
                      } disabled:opacity-50`}
                  >
                    {updating === product.id ? 'Updating...' : product.is_auction_ready ? 'Remove' : 'Queue'}
                  </button>

                  <button
                    onClick={() => handleOpenStartModal(product)}
                    disabled={updating === product.id || product.stock_quantity <= 0}
                    className="text-sm font-medium text-orange-600 hover:text-orange-900 disabled:opacity-50"
                  >
                    Start Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200 select-none">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{(page - 1) * 20 + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(page * 20, totalItems)}</span> of{' '}
                  <span className="font-semibold">{totalItems}</span> products
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-semibold text-gray-500 hover:bg-gray-55 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &larr; Prev
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`relative inline-flex items-center px-3 py-2 border text-xs font-semibold ${
                        p === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-semibold text-gray-500 hover:bg-gray-55 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Auction Modal */}
      <Modal
        title="Start Auction"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Starting auction for: <span className="font-semibold">{selectedProduct?.name}</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ask Price (Seller Price)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Initial Bid Price (Starting Bid)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bid Increment (Fixed Amount)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={minimumSpread}
                  onChange={(e) => setMinimumSpread(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Spread Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={spread}
                  onChange={(e) => setSpread(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Units per Auction
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
                min="1"
                max={selectedProduct?.stock_quantity || 0}
              />
              <p className="text-xs text-gray-500 mt-1">Available: {selectedProduct?.stock_quantity}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Outbid Offer Price Markup %
              </label>
              <input
                type="number"
                value={outbidPurchaseMarkupPercent}
                onChange={(e) => setOutbidPurchaseMarkupPercent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 50"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to disable outbid purchase offers.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule Auction Time</span>
              <button
                type="button"
                onClick={handleResetStartToNow}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Reset Start to NOW
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Quick Duration presets */}
            <div>
              <span className="block text-[11px] font-bold text-gray-500 mb-1.5">Quick Duration Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 40, 60, 120, 1440].map((mins) => {
                  const label = mins >= 60 ? `${mins / 60} ${mins === 60 ? 'Hour' : 'Hours'}` : `${mins} Mins`;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSetDuration(mins)}
                      className="px-2 py-1 text-[11px] bg-white hover:bg-orange-50 hover:text-orange-600 border border-gray-200 hover:border-orange-300 rounded font-semibold transition-all shadow-sm"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helper Duration Calculation Text */}
            {getDurationText() && (
              <div className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg p-2 text-center shadow-sm">
                🕒 {getDurationText()}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStartAuction}
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Start Auction
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
