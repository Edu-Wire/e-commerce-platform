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
      <div>
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
    </aside>
  );
}
