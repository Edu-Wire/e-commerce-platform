import { useState, useEffect } from 'react';

const SEARCH_CATEGORIES = [
  { label: 'Mobile Phone', keywords: ['mobile', 'phone', 'smartphone', 'iphone', 'android'], icon: '📱' },
  { label: 'Laptop / Computer', keywords: ['laptop', 'computer', 'notebook', 'macbook', 'dell', 'hp', 'lenovo'], icon: '💻' },
  { label: 'TV / Monitor', keywords: ['tv', 'television', 'monitor', 'screen', 'display', 'samsung', 'lg', 'sony'], icon: '📺' },
  { label: 'Headphones / Earphones', keywords: ['headphones', 'earphones', 'earbuds', 'audio', 'beats', 'sony'], icon: '🎧' },
  { label: 'Smartwatch', keywords: ['watch', 'smartwatch', 'wearable', 'apple watch', 'fitbit', 'galaxy watch'], icon: '⌚' },
  { label: 'T-Shirt / Clothing', keywords: ['t-shirt', 'shirt', 'clothing', 'tshirt', 'top', 'fashion'], icon: '👕' },
  { label: 'Jeans / Pants', keywords: ['jeans', 'pants', 'denim', 'trousers', 'levis'], icon: '👖' },
  { label: 'Dress', keywords: ['dress', 'gown', 'ethnic', 'saree', 'kurti'], icon: '👗' },
  { label: 'Shoes / Footwear', keywords: ['shoes', 'sneakers', 'footwear', 'boots', 'sandals', 'nike', 'adidas', 'bata'], icon: '👟' },
  { label: 'Bag / Backpack', keywords: ['bag', 'backpack', 'purse', 'handbag', 'sling'], icon: '👜' },
  { label: 'Kitchen Appliance', keywords: ['kitchen', 'cooktop', 'airfryer', 'mixer', 'blender', 'microwave'], icon: '🍳' },
  { label: 'Camera', keywords: ['camera', 'dslr', 'mirrorless', 'lens', 'canon', 'nikon'], icon: '📷' },
  { label: 'Books', keywords: ['book', 'novel', 'textbook', 'reading'], icon: '📚' },
  { label: 'Sunglasses', keywords: ['sunglasses', 'eyewear', 'glasses', 'rayban'], icon: '🕶️' },
];

interface Props {
  imageFile: File;
  imagePreviewUrl: string;
  detectedKeywords: string[];
  onConfirm: (keywords: string[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ImageSearchModal({
  imageFile,
  imagePreviewUrl,
  detectedKeywords,
  onConfirm,
  onClose,
  isLoading = false,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<typeof SEARCH_CATEGORIES[0] | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  // Auto-select best matching category from detected keywords
  useEffect(() => {
    if (detectedKeywords.length > 0) {
      const match = SEARCH_CATEGORIES.find(cat =>
        cat.keywords.some(kw => detectedKeywords.some(dk => dk.toLowerCase().includes(kw) || kw.includes(dk.toLowerCase())))
      );
      if (match) setSelectedCategory(match);
    }
  }, [detectedKeywords]);

  const handleSearch = () => {
    let keywords: string[] = [];
    if (selectedCategory) {
      keywords = selectedCategory.keywords;
    } else if (customQuery.trim()) {
      keywords = customQuery.trim().split(/\s+/);
    } else if (detectedKeywords.length > 0) {
      keywords = detectedKeywords;
    }
    onConfirm(keywords);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: 'slideUpIn 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-[15px]">Search by Image</h2>
              <p className="text-xs text-gray-500">Select what you're looking for</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Image Preview */}
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-orange-100 flex-shrink-0 bg-gray-50 shadow-sm">
              <img src={imagePreviewUrl} alt="Search image" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 mb-1 truncate">{imageFile.name}</p>
              <p className="text-xs text-gray-500 mb-2">{(imageFile.size / 1024).toFixed(0)} KB</p>
              {detectedKeywords.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Auto-detected tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedKeywords.slice(0, 5).map(kw => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[11px] font-semibold"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">What are you looking for?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {SEARCH_CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => { setSelectedCategory(cat); setCustomQuery(''); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all text-sm ${
                    selectedCategory?.label === cat.label
                      ? 'bg-orange-50 border-orange-400 text-orange-700 font-semibold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{cat.icon}</span>
                  <span className="truncate leading-tight text-[12px]">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Search Box */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Or type what you see</p>
            <div className="relative">
              <input
                type="text"
                value={customQuery}
                onChange={e => { setCustomQuery(e.target.value); setSelectedCategory(null); }}
                placeholder="e.g. black mobile phone, running shoes..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading || (!selectedCategory && !customQuery.trim() && detectedKeywords.length === 0)}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Products
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
