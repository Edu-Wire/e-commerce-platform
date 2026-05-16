interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  iconBg?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconBg = 'bg-blue-50',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-default group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
            {trend !== undefined && (
              <span className={`text-[10px] font-bold ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend.direction === 'up' ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-gray-400 font-medium mt-1">{subtitle}</p>}
        </div>
        <div className={`w-9 h-9 ${iconBg} rounded flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] text-amazon-blue font-bold hover:underline cursor-pointer">View report</span>
        <svg className="w-3 h-3 text-amazon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
