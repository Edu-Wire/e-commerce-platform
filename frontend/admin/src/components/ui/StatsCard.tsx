import React from 'react';
import { Link } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  iconBg?: string;
  to?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconBg = 'bg-[#ECFDF5]',
  to,
}: StatsCardProps) {
  const cardContent = (
    <div className={`bg-white rounded-lg border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-5 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group h-full ${to ? 'cursor-pointer' : 'cursor-default'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="h-8 flex items-start">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest leading-tight">{title}</span>
          </div>
          <div className="flex items-baseline flex-wrap gap-1.5 mt-1.5">
            <span className="text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</span>
            {trend !== undefined && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                trend.direction === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
              }`}>
                {trend.direction === 'up' ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-gray-400 font-medium mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${iconBg} rounded-md flex items-center justify-center group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between group-hover:border-gray-100 transition-colors">
        <span className="text-xs text-[#0FA86E] font-bold tracking-wide group-hover:text-[#0d9561] transition-colors">
          View report
        </span>
        <svg className="w-3.5 h-3.5 text-[#0FA86E] transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
