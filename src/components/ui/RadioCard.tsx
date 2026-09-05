import React from 'react';
import { Check } from 'lucide-react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioCardGroupProps {
  label?: string;
  description?: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  layout?: 'horizontal' | 'grid' | 'vertical';
  error?: string;
}

export const RadioCardGroup: React.FC<RadioCardGroupProps> = ({
  label,
  description,
  options,
  value,
  onChange,
  layout = 'horizontal',
  error,
}) => {
  const layoutClasses = {
    horizontal: 'grid grid-cols-2 sm:grid-cols-3 gap-3',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    vertical: 'flex flex-col gap-2.5',
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">{description}</p>
      )}
      <div className={layoutClasses[layout]} role="radiogroup">
        {options.map((option) => {
          const isSelected = Boolean(value) && value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all text-sm font-medium ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/50 text-brand-950 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div>
                <div className={`font-semibold ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
                )}
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 border transition-colors ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
