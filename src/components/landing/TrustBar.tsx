'use client';

import React from 'react';
import { ShieldCheck, Lock, Building2, FileCheck, CheckCircle } from 'lucide-react';

const items = [
  { icon: Building2, label: 'Dun & Bradstreet', color: 'text-brand-400' },
  { icon: FileCheck, label: 'Experian Commercial', color: 'text-teal-400' },
  { icon: CheckCircle, label: 'Equifax Business', color: 'text-cyan-400' },
  { icon: Lock, label: 'Zero-SSN Architecture', color: 'text-emerald-400' },
  { icon: ShieldCheck, label: 'Stripe Secured Payments', color: 'text-indigo-400' },
];

export const TrustBar: React.FC = () => {
  return (
    <section className="bg-slate-950 border-b border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 shrink-0 whitespace-nowrap">
            Platform Compatibility
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-7 gap-y-3">
            {items.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-default"
              >
                <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
