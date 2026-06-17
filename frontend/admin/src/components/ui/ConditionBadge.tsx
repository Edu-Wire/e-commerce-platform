import type { ProductCondition } from '../../types';

const CONDITION_CONFIG: Record<ProductCondition, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-emerald-50 border border-emerald-100 text-emerald-700' },
  new_with_minor_damage: { label: 'Minor Damage', className: 'bg-amber-50 border border-amber-100 text-amber-700' },
  new_with_defect: { label: 'Defect', className: 'bg-orange-50 border border-orange-100 text-orange-700' },
};

interface ConditionBadgeProps {
  condition: ProductCondition;
}

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  const config = CONDITION_CONFIG[condition] ?? { label: condition, className: 'bg-gray-50 border border-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}
