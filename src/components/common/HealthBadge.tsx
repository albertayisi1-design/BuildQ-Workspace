import React from 'react';
import { HealthStatus } from '../../types';

interface HealthBadgeProps {
  status: HealthStatus;
  showText?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({
  status,
  showText = true,
  className = '',
  size = 'md',
}) => {
  const configs = {
    GREEN: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-500',
      label: 'On Track',
    },
    AMBER: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500',
      label: 'Attention Required',
    },
    RED: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      dot: 'bg-rose-500 animate-pulse',
      label: 'At Risk',
    },
    GREY: {
      bg: 'bg-slate-100 border-slate-200 text-slate-700',
      dot: 'bg-slate-400',
      label: 'Planning',
    },
  };

  const config = configs[status] || configs.GREY;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      id={`health-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size]} font-semibold tracking-wide whitespace-nowrap shadow-xs ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {showText && <span>{config.label}</span>}
    </span>
  );
};
