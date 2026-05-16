import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

interface Auction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  start_time: string;
  end_time: string;
  status: string;
  current_highest_bid: string;
  reserve_price: string;
}

export default function RunningAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchRunningAuctions();
  }, []);

  const fetchRunningAuctions = async () => {
    try {
      const res = await api.get('/admin/auctions/running');
      console.log('Fetched auctions:', res.data.data);
      setAuctions(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch running auctions:', err);
      toast.error('Failed to load running auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuction = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this auction? This will remove all bids as well.')) {
      return;
    }

    setDeleting(id);
    try {
      await api.delete(`/admin/auctions/${id}`);
      toast.success('Auction deleted successfully');
      fetchRunningAuctions();
    } catch (err) {
      console.error('Failed to delete auction:', err);
      toast.error('Failed to delete auction');
    } finally {
      setDeleting(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Running Auctions</h1>
          <p className="text-sm text-gray-500">View and manage currently active auctions.</p>
        </div>
        <Link to="/auctions" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Auction Management
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Bid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auctions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No running auctions found.
                </td>
              </tr>
            ) : (
              auctions.map((auction) => (
                <tr key={auction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{auction.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{auction.product_sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(auction.current_highest_bid || auction.reserve_price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(auction.end_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteAuction(auction.id)}
                      disabled={deleting === auction.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deleting === auction.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
