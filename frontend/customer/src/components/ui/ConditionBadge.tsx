import type { ProductCondition } from '../../types';

interface ConditionBadgeProps {
  condition: ProductCondition;
  className?: string;
}

const conditionConfig: Record<ProductCondition, { label: string; classes: string }> = {
  new: {
    label: '✓ New',
    classes: 'bg-green-100 text-green-800 border border-green-200'
  },
  new_with_minor_damage: {
    label: '⚠ Minor Damage',
    classes: 'bg-amber-100 text-amber-800 border border-amber-200'
  },
  new_with_defect: {
    label: '⚡ Has Defect',
    classes: 'bg-orange-100 text-orange-800 border border-orange-200'
  }
};

export default function ConditionBadge({ condition, className = '' }: ConditionBadgeProps) {
  const config = conditionConfig[condition] ?? conditionConfig.new;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes} ${className}`}>
      {config.label}
    </span>
  );
}
