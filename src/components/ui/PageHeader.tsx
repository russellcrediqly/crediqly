import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3 flex-shrink-0">{action}</div>}
    </div>
  );
};
