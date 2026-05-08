import type { AdminRole } from '../../types';

const ROLE_CONFIG: Record<AdminRole, { label: string; className: string }> = {
  owner: { label: 'Owner', className: 'bg-purple-100 text-purple-800' },
  manager: { label: 'Manager', className: 'bg-blue-100 text-blue-800' },
  inventory_staff: { label: 'Inventory', className: 'bg-green-100 text-green-800' },
  viewer: { label: 'Viewer', className: 'bg-gray-100 text-gray-700' },
};

interface RoleBadgeProps {
  role: AdminRole;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? { label: role, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
