'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'Complete'
  | 'In Progress'
  | 'Next'
  | 'Needs Attention'
  | 'Strong Match'
  | 'Potential Match'
  | 'Preliminary Match'
  | 'Not Recommended Yet'
  | 'Customer Confirmed'
  | 'Verified'
  | 'System Verified';

export interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  showIcon = true,
}) => {
  const normalized = status.trim();

  // Color mappings following strict visual language
  const getStyle = () => {
    switch (normalized) {
      case 'Complete':
        return {
          container: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-600',
          icon: CheckCircle2,
          iconClass: 'text-emerald-600',
        };

      case 'In Progress':
        return {
          container: 'bg-blue-50 text-blue-800 border-blue-200/80',
          dot: 'bg-blue-600',
          icon: Clock,
          iconClass: 'text-blue-600',
        };

      case 'Next':
        return {
          container: 'bg-teal-50 text-teal-800 border-teal-200/80',
          dot: 'bg-teal-600',
          icon: ArrowRight,
          iconClass: 'text-teal-600',
        };

      case 'Needs Attention':
        return {
          container: 'bg-amber-50 text-amber-900 border-amber-200/90',
          dot: 'bg-amber-500',
          icon: AlertCircle,
          iconClass: 'text-amber-600',
        };

      case 'Strong Match':
      case 'Strong Potential Match':
        return {
          container: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          dot: 'bg-emerald-500',
          icon: Sparkles,
          iconClass: 'text-emerald-600',
        };

      case 'Potential Match':
      case 'Possible Match':
        return {
          container: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
          dot: 'bg-amber-500',
          icon: Clock,
          iconClass: 'text-amber-600',
        };

      case 'Preliminary Match':
        return {
          container: 'bg-blue-50 text-blue-900 border-blue-300 font-semibold',
          dot: 'bg-blue-500',
          icon: HelpCircle,
          iconClass: 'text-blue-600',
        };

      case 'Not Recommended Yet':
      case 'Not Ready Yet':
      case 'Improve Readiness First':
        return {
          container: 'bg-rose-50 text-rose-800 border-rose-300 font-medium',
          dot: 'bg-rose-500',
          icon: AlertCircle,
          iconClass: 'text-rose-600',
        };

      case 'Verified':
      case 'System Verified':
      case 'System verified':
        return {
          container: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
          dot: 'bg-emerald-600',
          icon: ShieldCheck,
          iconClass: 'text-emerald-600',
        };

      case 'Customer Confirmed':
      case 'Customer confirmed':
        return {
          container: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
          dot: 'bg-slate-500',
          icon: UserCheck,
          iconClass: 'text-slate-500',
        };

      default:
        return {
          container: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: null,
          iconClass: 'text-slate-500',
        };
    }
  };

  const style = getStyle();
  const IconComponent = style.icon;

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1.5'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border tracking-normal select-none leading-none',
        style.container,
        sizeClasses,
        className
      )}
    >
      {showIcon && IconComponent ? (
        <IconComponent className={cn('w-3 h-3 shrink-0', style.iconClass)} />
      ) : (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} />
      )}
      <span className="font-medium">{normalized}</span>
    </span>
  );
};
