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
}

const getProductImage = (product: Product) => {
  let images: any[] = [];
  try {
    images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
  } catch (e) { }
  const mainImageObj = images?.[0];
  let url = typeof mainImageObj === 'string' ? mainImageObj : (mainImageObj?.url || '/placeholder.png');

  if (url.startsWith('/')) {
    url = `http://localhost:4000${url}`;
  }
  return url;
};

export default function AuctionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

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
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/inventory');
      setProducts(res.data.data.items);
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

  const handleOpenStartModal = (product: Product) => {
    setSelectedProduct(product);
    setReservePrice('');
    setBidPrice('');
    setMinimumSpread('1.00');
    setSpread('0.00'); // Reset spread
    setQuantity('1');
    setNumberOfAuctions('1');
    setOutbidPurchaseMarkupPercent('');
    
    const formatLocalDatetime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Set default start time to the next full hour
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
    setStartTime(formatLocalDatetime(start));
    
    // Set default end time to 1 hour after start
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setEndTime(formatLocalDatetime(end));
    
    setIsModalOpen(true);
  };

  const handleStartAuction = async () => {
    if (!selectedProduct || !reservePrice || !endTime) {
      toast.error('Please fill in all required fields');
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
