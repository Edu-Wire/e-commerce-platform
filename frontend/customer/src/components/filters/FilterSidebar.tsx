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

  const currentCategory = filters.category?.toLowerCase() || 'all';

  // Determine which sections to show
  const isElectronics = ['electronics', 'smartphones', 'laptops', 'audio', 'cameras', 'smart-tvs'].includes(currentCategory);
  const isClothing = ['clothing', 'mens-wear', 'womens-wear', 'kids-wear'].includes(currentCategory);
  const isFootwear = ['footwear', 'sneakers', 'formal-shoes', 'sandals'].includes(currentCategory);

  useEffect(() => {
    setMinPrice(filters.min_price?.toString() ?? '');
    setMaxPrice(filters.max_price?.toString() ?? '');
    setBrand(filters.brand ?? '');
  }, [filters.min_price, filters.max_price, filters.brand]);

  // Debounced brand filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (brand !== (filters.brand ?? '')) {
        onFilterChange({ brand: brand || undefined });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [brand]);

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

  const handleAttributeChange = (key: keyof ProductFilters, value: string) => {
    const current = (filters[key] as string) || '';
    onFilterChange({ [key]: current === value ? undefined : value });
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
      sort: undefined,
      ram: undefined,
      storage: undefined,
      size: undefined,
      color: undefined
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

      {/* Basic Filters (Shown for all) */}
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

      {/* Item Condition */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Item Condition</label>
        <div className="space-y-2">
          {conditions.map(c => (
            <label key={c.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedConditions.includes(c.value)}
                onChange={() => handleConditionChange(c.value)}
                className="w-4 h-4 rounded border-gray-300 text-[#e77600] focus:ring-[#e77600] cursor-pointer"
              />
              <span className={`text-sm transition-colors ${
                selectedConditions.includes(c.value) ? 'text-[#e77600] font-bold' : 'text-gray-700 group-hover:text-[#c45500]'
              }`}>
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search brand..."
            value={brand}
            onChange={e => setBrand(e.target.value)}
            className="w-full rounded-lg border border-gray-300 text-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Electronics Specific Filters */}
      {isElectronics && (
        <div className="pt-4 border-t border-gray-100 space-y-6">
          <label className="block text-sm font-bold text-[#0f1111] mb-1 uppercase tracking-tighter text-[11px]">Electronic Specs</label>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">RAM Capacity</label>
            <div className="flex flex-wrap gap-2">
              {['4GB', '8GB', '16GB', '32GB'].map(size => (
                <button 
                  key={size} 
                  onClick={() => handleAttributeChange('ram', size)}
                  className={`px-3 py-1 text-xs border rounded-md transition-all ${
                    filters.ram === size 
                      ? 'border-[#e77600] bg-[#fff9f2] text-[#e77600] font-bold' 
                      : 'border-gray-300 hover:border-[#e77600] hover:bg-[#fff9f2]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Internal Storage</label>
            <div className="flex flex-wrap gap-2">
              {['128GB', '256GB', '512GB', '1TB'].map(size => (
                <button 
                  key={size} 
                  onClick={() => handleAttributeChange('storage', size)}
                  className={`px-3 py-1 text-xs border rounded-md transition-all ${
                    filters.storage === size 
                      ? 'border-[#e77600] bg-[#fff9f2] text-[#e77600] font-bold' 
                      : 'border-gray-300 hover:border-[#e77600] hover:bg-[#fff9f2]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clothing Specific Filters */}
      {isClothing && (
        <div className="pt-4 border-t border-gray-100 space-y-6">
          <label className="block text-sm font-bold text-[#0f1111] mb-1 uppercase tracking-tighter text-[11px]">Clothing Specs</label>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Size</label>
            <div className="flex flex-wrap gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                <button 
                  key={s} 
                  onClick={() => handleAttributeChange('size', s)}
                  className={`px-3 py-1 text-xs border rounded-md transition-all ${
                    filters.size === s 
                      ? 'border-[#e77600] bg-[#fff9f2] text-[#e77600] font-bold' 
                      : 'border-gray-300 hover:border-[#e77600] hover:bg-[#fff9f2]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {['Black', 'White', 'Blue', 'Red', 'Green'].map(c => (
                <button 
                  key={c} 
                  onClick={() => handleAttributeChange('color', c)}
                  className={`px-3 py-1 text-xs border rounded-md transition-all ${
                    filters.color === c 
                      ? 'border-[#e77600] bg-[#fff9f2] text-[#e77600] font-bold' 
                      : 'border-gray-300 hover:border-[#e77600] hover:bg-[#fff9f2]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footwear Specific Filters */}
      {isFootwear && (
        <div className="pt-4 border-t border-gray-100 space-y-6">
          <label className="block text-sm font-bold text-[#0f1111] mb-1 uppercase tracking-tighter text-[11px]">Footwear Specs</label>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Shoe Size (UK/India)</label>
            <div className="flex flex-wrap gap-2">
              {['6', '7', '8', '9', '10', '11'].map(s => (
                <button 
                  key={s} 
                  onClick={() => handleAttributeChange('size', s)}
                  className={`px-3 py-1 text-xs border rounded-md transition-all ${
                    filters.size === s 
                      ? 'border-[#e77600] bg-[#fff9f2] text-[#e77600] font-bold' 
                      : 'border-gray-300 hover:border-[#e77600] hover:bg-[#fff9f2]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shared Filters (Reviews, Availability) */}
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
