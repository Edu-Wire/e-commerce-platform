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
  const [ending, setEnding] = useState<number | null>(null);

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

  const handleEndAuction = async (id: number) => {
    if (!window.confirm('Are you sure you want to end this auction early? It will complete immediately and determine a winner if bids exist.')) {
      return;
    }

    setEnding(id);
    try {
      await api.post(`/admin/auctions/${id}/end`);
      toast.success('Auction ended and completed successfully');
      fetchRunningAuctions();
    } catch (err) {
      console.error('Failed to end auction:', err);
      toast.error('Failed to end auction');
    } finally {
      setEnding(null);
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
    <div className="min-h-full bg-[#F4F9F4] -m-6 p-4 sm:p-6 text-gray-700 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-6 border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <span>Admin</span>
              <span>&gt;</span>
              <span>Auction Management</span>
              <span>&gt;</span>
              <span className="text-[#0FA86E]">Running Auctions</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">Running Auctions</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">View and manage currently active auctions.</p>
          </div>
          <Link to="/auctions" className="text-xs text-[#0FA86E] hover:underline font-bold">
            &larr; Back to Auction Management
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
                  <th className="px-6 py-4 w-32">Current Bid</th>
                  <th className="px-6 py-4 w-48">End Time</th>
                  <th className="px-6 py-4 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {auctions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-xs text-gray-400 font-medium">
                      No running auctions found.
                    </td>
                  </tr>
                ) : (
                  auctions.map((auction) => (
                    <tr key={auction.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">{auction.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-bold font-sans uppercase tracking-wider">{auction.product_sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-black">
                        ₹{parseFloat(auction.current_highest_bid || auction.reserve_price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-bold">
                        {new Date(auction.end_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => handleEndAuction(auction.id)}
                            disabled={ending === auction.id || deleting === auction.id}
                            className="text-red-600 hover:text-red-800 font-bold disabled:opacity-50"
                          >
                            {ending === auction.id ? 'Ending...' : 'End Auction'}
                          </button>
                          <button
                            onClick={() => handleDeleteAuction(auction.id)}
                            disabled={deleting === auction.id || ending === auction.id}
                            className="text-gray-400 hover:text-gray-600 font-bold disabled:opacity-50"
                          >
                            {deleting === auction.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
