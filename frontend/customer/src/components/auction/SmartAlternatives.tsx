import React from 'react';

export interface AlternativeAuction {
  productId: number;
  currentAuctionId: number;
  productName: string;
  mrp: number;
  catalogPrice: number;
  outbidMarkupPercent?: number | null;
  currentHighestBid: number;
  isCompleted: boolean;
}

interface SmartAlternativesProps {
  auction: AlternativeAuction | null;
  onClose: () => void;
}

/**
 * Simple modal that shows the selected out‑bid auction and offers a quick link to the
 * live‑auction page where the user can view alternative listings.
 *
 * This is a minimal implementation – you can extend it later with a list of
 * similar products, price comparison, etc.
 */
const SmartAlternatives: React.FC<SmartAlternativesProps> = ({ auction, onClose }) => {
  if (!auction) return null;

  const markUp = auction.outbidMarkupPercent ?? 30;
  const suggestedPrice = Math.round(auction.catalogPrice * (1 + markUp / 100));

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4">Smart Alternatives</h2>
        <p className="mb-2">
          You were outbid on <span className="font-medium">{auction.productName}</span>.
        </p>
        <p className="mb-2">
          Original catalog price: <span className="font-medium">₹{auction.catalogPrice.toLocaleString('en-IN')}</span>
        </p>
        <p className="mb-4">
          Suggested buy‑now price with {markUp}% markup: <span className="font-medium text-green-700">₹{suggestedPrice.toLocaleString('en-IN')}</span>
        </p>
        <a
          href={`/live-auction/${auction.currentAuctionId}`}
          className="block w-full text-center bg-green-700 hover:bg-green-800 text-white py-2 rounded"
        >
          View Similar Auctions
        </a>
      </div>
    </div>
  );
};

export default SmartAlternatives;
