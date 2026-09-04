import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxOption {
  value: string;
  label: string;
}

export interface CheckboxCardGroupProps {
  label?: string;
  description?: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

export const CheckboxCardGroup: React.FC<CheckboxCardGroupProps> = ({
  label,
  description,
  options,
  values,
  onChange,
  error,
}) => {
  const toggleOption = (val: string) => {
    if (val === 'Not sure') {
      if (values.includes('Not sure')) {
        onChange([]);
      } else {
        onChange(['Not sure']);
      }
      return;
    }

    const filtered = values.filter((v) => v !== 'Not sure');
    if (filtered.includes(val)) {
      onChange(filtered.filter((v) => v !== val));
    } else {
      onChange([...filtered, val]);
    }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {options.map((opt) => {
          const isSelected = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all text-sm font-medium ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/50 text-brand-950 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <span className={`font-semibold ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                {opt.label}
              </span>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ml-2 border transition-colors ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
