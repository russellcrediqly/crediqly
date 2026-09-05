import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'outline-white'
    | 'outline-inverted'
    | 'ghost'
    | 'ghost-white'
    | 'ghost-inverted'
    | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus:ring-brand-500 shadow-xs font-bold',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-700 shadow-xs font-bold',
    outline:
      'border border-slate-300 bg-white text-slate-800 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-400 focus:ring-brand-500 shadow-2xs font-semibold',
    'outline-white':
      'border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 focus:ring-white/40 shadow-2xs font-semibold backdrop-blur-xs',
    'outline-inverted':
      'border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 focus:ring-white/40 shadow-2xs font-semibold backdrop-blur-xs',
    ghost:
      'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 focus:ring-slate-400 font-semibold',
    'ghost-white':
      'text-white/90 hover:text-white hover:bg-white/10 focus:ring-white/40 font-semibold',
    'ghost-inverted':
      'text-white/90 hover:text-white hover:bg-white/10 focus:ring-white/40 font-semibold',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-xs font-bold',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-xs font-semibold min-h-[36px]',
    md: 'px-4 py-2.5 text-sm font-semibold min-h-[42px]',
    lg: 'px-6 py-3.5 text-base font-bold min-h-[48px]',
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

