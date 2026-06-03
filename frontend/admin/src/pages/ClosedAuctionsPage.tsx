import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { Download } from 'lucide-react';

interface ClosedAuction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  start_time: string;
  end_time: string;
  status: string;
  current_highest_bid: string;
  reserve_price: string;
  spread: string;
  winner_name: string | null;
  winner_email: string | null;
  total_bids: number;
}

interface Bidder {
  id: number;
  bid_amount: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export default function ClosedAuctionsPage() {
  const [auctions, setAuctions] = useState<ClosedAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<ClosedAuction | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [loadingBidders, setLoadingBidders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchClosedAuctions();
  }, []);

  const fetchClosedAuctions = async () => {
    try {
      const res = await api.get('/admin/auctions/history');
      setAuctions(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch closed auctions:', err);
      toast.error('Failed to load auction history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBidders = async (auction: ClosedAuction) => {
    setSelectedAuction(auction);
    setIsModalOpen(true);
    setLoadingBidders(true);
    try {
      const res = await api.get(`/admin/auctions/${auction.id}/bidders`);
      setBidders(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch bidders:', err);
      toast.error('Failed to load bidders list');
    } finally {
      setLoadingBidders(false);
    }
  };

  const exportToCSV = () => {
    if (auctions.length === 0) {
      toast.error('No history data to export');
      return;
    }

    const headers = [
      'Auction ID',
      'Product Name',
      'Product SKU',
      'Reserve Price (INR)',
      'Spread (INR)',
      'Winning Bid (INR)',
      'Total Bids',
      'Winner Name',
      'Winner Email',
      'Start Time',
      'End Time'
    ];

    const rows = auctions.map((auction) => [
      auction.id,
      `"${auction.product_name.replace(/"/g, '""')}"`,
      auction.product_sku,
      parseFloat(auction.reserve_price || '0').toFixed(2),
      parseFloat(auction.spread || '0').toFixed(2),
      auction.winner_name ? parseFloat(auction.current_highest_bid || '0').toFixed(2) : 'No Bids',
      auction.total_bids,
      auction.winner_name ? `"${auction.winner_name.replace(/"/g, '""')}"` : 'N/A',
      auction.winner_email || 'N/A',
      new Date(auction.start_time).toLocaleString(),
      new Date(auction.end_time).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `closed_auctions_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('History exported successfully!');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Closed Auctions History</h1>
          <p className="text-sm text-gray-500">Analyze completed auctions and view participating customers.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link to="/auctions" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Auction Management
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winning Bid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bids</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ended At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auctions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No completed auctions found.
                </td>
              </tr>
            ) : (
              auctions.map((auction) => (
                <tr key={auction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>{auction.product_name}</div>
                    <div className="text-xs text-gray-400 font-normal mt-0.5">
                      SKU: {auction.product_sku} | Spread: ₹{parseFloat(auction.spread || '0.00').toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auction.winner_name ? (
                      <div>
                        <div className="font-semibold text-gray-900">{auction.winner_name}</div>
                        <div className="text-xs text-gray-500">{auction.winner_email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No Winner (No bids)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    {auction.winner_name ? (
                      `₹${parseFloat(auction.current_highest_bid).toLocaleString('en-IN')}`
                    ) : (
                      <span className="text-gray-400 font-normal">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {auction.total_bids} Bids
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(auction.end_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewBidders(auction)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Participants
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Participants Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Auction Participants - ${selectedAuction?.product_name || ''}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {loadingBidders ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : bidders.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No bids were placed on this auction.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Below is the list of all participating bidders (ordered from highest to lowest bid). You can use this data for outbid offer followups.
              </p>
              <div className="divide-y divide-gray-100">
                {bidders.map((bid, index) => (
                  <div key={bid.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>{index + 1}. {bid.customer_name}</span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.2 bg-green-100 text-green-800 font-bold rounded text-[10px]">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-[11px]">
                        Email: {bid.customer_email} | Phone: {bid.customer_phone || 'N/A'}
                      </div>
                      <div className="text-gray-400 text-[10px]">
                        Bid placed: {new Date(bid.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 text-right">
                      ₹{parseFloat(bid.bid_amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
