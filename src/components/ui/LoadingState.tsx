import React from 'react';
import { Loader2 } from 'lucide-react';
import { CrediqlyBrandIcon } from '@/components/common/CrediqlyLogo';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  showIcon?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Crediqly...',
  className = '',
  showIcon = true,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {showIcon && (
        <div className="relative mb-3.5">
          <CrediqlyBrandIcon size="md" className="animate-pulse drop-shadow-sm" />
        </div>
      )}
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 text-brand-500 animate-spin shrink-0" />
        <p className="text-sm font-medium text-slate-400">{message}</p>
      </div>
    </div>
  );
};
