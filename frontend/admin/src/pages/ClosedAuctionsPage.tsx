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
              <span className="text-[#0FA86E]">Closed Auctions</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mt-1 tracking-tight">Closed Auctions History</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Analyze completed auctions and view participating customers.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0FA86E] hover:bg-[#0d9561] text-white rounded-md text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Link to="/auctions" className="text-xs text-[#0FA86E] hover:underline font-bold">
              &larr; Back to Auction Management
            </Link>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-gray-100 rounded-lg shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs text-left">
              <thead>
                <tr className="bg-[#F4F9F4]/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Winner Details</th>
                  <th className="px-6 py-4 w-32">Winning Bid</th>
                  <th className="px-6 py-4 w-28">Total Bids</th>
                  <th className="px-6 py-4 w-44">Ended At</th>
                  <th className="px-6 py-4 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {auctions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-xs text-gray-400 font-medium">
                      No completed auctions found.
                    </td>
                  </tr>
                ) : (
                  auctions.map((auction) => (
                    <tr key={auction.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">
                        <div>{auction.product_name}</div>
                        <div className="text-[10px] text-gray-400 font-bold font-sans mt-0.5 uppercase tracking-wider">
                          SKU: {auction.product_sku} | Spread: ₹{parseFloat(auction.spread || '0.00').toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {auction.winner_name ? (
                          <div>
                            <div className="font-bold text-gray-950">{auction.winner_name}</div>
                            <div className="text-[10px] text-gray-400 font-bold">{auction.winner_email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic font-medium">No Winner (No bids)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-black">
                        {auction.winner_name ? (
                          `₹${parseFloat(auction.current_highest_bid).toLocaleString('en-IN')}`
                        ) : (
                          <span className="text-gray-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black border uppercase tracking-wider bg-emerald-50 border-emerald-100 text-emerald-700">
                          {auction.total_bids} Bids
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-bold">
                        {new Date(auction.end_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-right">
                        <button
                          onClick={() => handleViewBidders(auction)}
                          className="text-[#0FA86E] hover:text-[#0d9561] font-bold"
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
        </div>
      </div>

      {/* Participants Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Auction Participants - ${selectedAuction?.product_name || ''}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto text-xs font-medium">
          {loadingBidders ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : bidders.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No bids were placed on this auction.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">
                Below is the list of all participating bidders (ordered from highest to lowest bid). You can use this data for outbid offer followups.
              </p>
              <div className="divide-y divide-gray-100">
                {bidders.map((bid, index) => (
                  <div key={bid.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{index + 1}. {bid.customer_name}</span>
                        {index === 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[8px] font-black border uppercase tracking-wider bg-emerald-50 border-emerald-100 text-emerald-700">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 font-bold text-[10px] mt-0.5">
                        Email: {bid.customer_email} | Phone: {bid.customer_phone || 'N/A'}
                      </div>
                      <div className="text-gray-400 font-medium text-[9px] mt-0.5">
                        Bid placed: {new Date(bid.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="font-black text-gray-900 text-right">
                      ₹{parseFloat(bid.bid_amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
