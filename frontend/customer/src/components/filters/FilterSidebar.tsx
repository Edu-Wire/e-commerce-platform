import { useState, useEffect } from 'react';
import type { ProductFilters } from '../../types';

interface FilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: (filters: Partial<ProductFilters>) => void;
  className?: string;
}

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'new_with_minor_damage', label: 'Minor Damage' },
  { value: 'new_with_defect', label: 'Has Defect' }
];

const sortOptions = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'discount_desc', label: 'Highest Discount' }
];

export default function FilterSidebar({ filters, onFilterChange, className = '' }: FilterSidebarProps) {
  const [minPrice, setMinPrice] = useState(filters.min_price?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price?.toString() ?? '');
  const [brand, setBrand] = useState(filters.brand ?? '');

  useEffect(() => {
    setMinPrice(filters.min_price?.toString() ?? '');
    setMaxPrice(filters.max_price?.toString() ?? '');
    setBrand(filters.brand ?? '');
  }, [filters]);

  const handleConditionChange = (value: string) => {
    const current = filters.condition ? filters.condition.split(',') : [];
    const updated = current.includes(value)
      ? current.filter(c => c !== value)
      : [...current, value];
    onFilterChange({ condition: updated.join(',') || undefined });
  };

  const handlePriceApply = () => {
    onFilterChange({
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined
    });
  };

  const handleBrandApply = () => {
    onFilterChange({ brand: brand || undefined });
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    setBrand('');
    onFilterChange({
      condition: undefined,
      min_price: undefined,
      max_price: undefined,
      brand: undefined,
      sort: undefined
    });
  };

  const selectedConditions = filters.condition ? filters.condition.split(',') : [];

  return (
    <aside className={`bg-white rounded-2xl border border-gray-100 p-5 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-base">Filters</h3>
        <button
          onClick={handleClear}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
        <select
          value={filters.sort ?? ''}
          onChange={e => onFilterChange({ sort: e.target.value || undefined })}
          className="w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
        <div className="space-y-2">
          {conditions.map(c => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedConditions.includes(c.value)}
                onChange={() => handleConditionChange(c.value)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range (₹)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-2 w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Apply Price
        </button>
      </div>

      {/* Brand */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search brand..."
            value={brand}
            onChange={e => setBrand(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBrandApply()}
            className="flex-1 rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleBrandApply}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            Go
          </button>
        </div>
      </div>

      {/* Deals & Discounts */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Deals & Discounts</label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="rounded border-gray-300 text-[#e77600] focus:ring-[#e77600]" />
          <span className="text-sm text-gray-700 group-hover:text-[#c45500] transition-colors">Great Summer Deals</span>
        </label>
      </div>

      {/* Aspect Ratio */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Aspect Ratio</label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="rounded border-gray-300 text-[#e77600] focus:ring-[#e77600]" />
          <span className="text-sm text-gray-700 group-hover:text-[#c45500] transition-colors">16:9</span>
        </label>
      </div>

      {/* Customer Reviews */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Reviews</label>
        <div className="space-y-1">
          {[4, 3, 2, 1].map(stars => (
            <button key={stars} className="flex items-center gap-2 group w-full text-left">
              <div className="flex text-[#febd69]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < stars ? 'fill-current' : 'text-gray-200'}>★</span>
                ))}
              </div>
              <span className="text-xs text-gray-600 group-hover:text-[#c45500] transition-colors">& Up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wireless Technology */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Wireless Technology</label>
        <div className="space-y-2">
          {['Bluetooth', 'Radio Frequency', 'Wi-Fi'].map(tech => (
            <label key={tech} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="rounded border-gray-300 text-[#e77600] focus:ring-[#e77600]" />
              <span className="text-sm text-gray-700 group-hover:text-[#c45500] transition-colors">{tech}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Connectivity */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Connectivity</label>
        <div className="space-y-2">
          {['USB', 'HDMI', 'Ethernet'].map(conn => (
            <label key={conn} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="rounded border-gray-300 text-[#e77600] focus:ring-[#e77600]" />
              <span className="text-sm text-gray-700 group-hover:text-[#c45500] transition-colors">{conn}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Purpose */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
        <div className="space-y-2">
          {['Streaming', 'Video Gaming'].map(p => (
            <label key={p} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="rounded border-gray-300 text-[#e77600] focus:ring-[#e77600]" />
              <span className="text-sm text-gray-700 group-hover:text-[#c45500] transition-colors">{p}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Supported Internet Services */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Supported Internet Services</label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="rounded border-gray-300 text-[#e77600] focus:ring-[#e77600]" />
          <span className="text-sm text-gray-700 group-hover:text-[#c45500] transition-colors">Netflix</span>
        </label>
      </div>

      {/* Electronic Specifics - Only for Electronics */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-bold text-[#0f1111] mb-3 uppercase tracking-tighter text-[11px]">Electronic Features</label>
        
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2">RAM Capacity</label>
          <div className="flex flex-wrap gap-2">
            {['4GB', '8GB', '16GB', '32GB'].map(size => (
              <button key={size} className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:border-[#e77600] hover:bg-[#fff9f2] transition-all">
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Internal Storage</label>
          <div className="flex flex-wrap gap-2">
            {['128GB', '256GB', '512GB', '1TB'].map(size => (
              <button key={size} className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:border-[#e77600] hover:bg-[#fff9f2] transition-all">
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span className="text-sm text-gray-700 group-hover:text-[#c45500] transition-colors">Include Out of Stock</span>
        </label>
      </div>
    </aside>
  );
}
