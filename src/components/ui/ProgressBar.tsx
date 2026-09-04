import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'brand' | 'navy' | 'emerald' | 'amber';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'brand',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorClasses = {
    brand: 'bg-brand-600',
    navy: 'bg-navy-800',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-700">
          <span>{label}</span>
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div
        className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden ring-1 ring-slate-200/50"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full transition-all duration-500 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
