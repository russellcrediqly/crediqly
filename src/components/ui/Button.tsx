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
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 shadow-xs font-bold',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-slate-700 shadow-xs font-bold',
    outline:
      'border border-slate-300 bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:ring-brand-500 shadow-2xs font-semibold',
    'outline-white':
      'border border-white/60 bg-white/20 text-white hover:bg-white/30 hover:border-white/80 active:bg-white/35 focus-visible:ring-white shadow-2xs font-semibold backdrop-blur-xs',
    'outline-inverted':
      'border border-white/60 bg-white/20 text-white hover:bg-white/30 hover:border-white/80 active:bg-white/35 focus-visible:ring-white shadow-2xs font-semibold backdrop-blur-xs',
    ghost:
      'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90 active:bg-slate-200/70 focus-visible:ring-slate-400 font-semibold',
    'ghost-white':
      'text-white hover:text-white hover:bg-white/20 active:bg-white/30 focus-visible:ring-white font-semibold',
    'ghost-inverted':
      'text-white hover:text-white hover:bg-white/20 active:bg-white/30 focus-visible:ring-white font-semibold',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-xs font-bold',
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

