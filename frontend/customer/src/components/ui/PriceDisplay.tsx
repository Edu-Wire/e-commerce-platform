interface PriceDisplayProps {
  mrp: number;
  selling_price: number;
  discount_percentage: number;
  b2b_price?: number;
  is_b2b?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function PriceDisplay({
  mrp,
  selling_price,
  discount_percentage,
  b2b_price,
  is_b2b = false,
  size = 'md'
}: PriceDisplayProps) {
  const priceSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  const mrpSize = size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`font-bold text-gray-900 ${priceSize}`}>
          {fmt(selling_price)}
        </span>
        {mrp > selling_price && (
          <span className={`text-gray-400 line-through ${mrpSize}`}>
            {fmt(mrp)}
          </span>
        )}
        {discount_percentage > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {Math.round(discount_percentage)}% OFF
          </span>
        )}
      </div>
      {is_b2b && b2b_price && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-0.5">B2B Price</p>
          <span className="text-lg font-bold text-blue-700">{fmt(b2b_price)}</span>
          <span className="text-xs text-blue-500 ml-1">/ unit</span>
        </div>
      )}
    </div>
  );
}
