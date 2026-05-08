import type { ProductCondition } from '../../types';

const CONDITION_CONFIG: Record<ProductCondition, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-green-100 text-green-800' },
  new_with_minor_damage: { label: 'Minor Damage', className: 'bg-amber-100 text-amber-800' },
  new_with_defect: { label: 'Defect', className: 'bg-orange-100 text-orange-800' },
};

interface ConditionBadgeProps {
  condition: ProductCondition;
}

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  const config = CONDITION_CONFIG[condition] ?? { label: condition, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
