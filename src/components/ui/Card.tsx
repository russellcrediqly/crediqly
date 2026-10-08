import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'quiet' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const hasCustomBg = /\bbg-/.test(className);
  const hasCustomBorder = /\bborder-[a-z]/.test(className);

  const variantStyles = {
    default: 'bg-white border border-slate-200/80 shadow-xs',
    elevated: 'bg-white border border-slate-200/90 shadow-sm ring-1 ring-slate-900/[0.03]',
    quiet: 'bg-slate-50/70 border border-slate-200/60 shadow-none',
    interactive:
      'bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        !hasCustomBg && !variantStyles[variant].includes('bg-') && 'bg-white',
        !hasCustomBorder && !variantStyles[variant].includes('border-') && 'border border-slate-200/80',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('p-6 border-b border-slate-100', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-900 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={cn('text-sm text-slate-500 mt-1 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={cn('p-6 bg-slate-50/50 border-t border-slate-100 rounded-b-xl flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
};

