'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Building2,
  CheckCircle,
  FileCheck,
  CreditCard,
  Zap,
} from 'lucide-react';

export const TrustBar: React.FC = () => {
  return (
    <section className="py-8 bg-slate-950 border-y border-slate-800/80 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Section Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Institutional Compatibility</span>
          </div>

          {/* Partner Badges Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 items-center justify-center w-full md:w-auto text-xs text-slate-400">
            {/* D&B */}
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
              <Building2 className="w-4 h-4 text-brand-400" />
              <span className="font-bold tracking-tight">Dun &amp; Bradstreet</span>
            </div>

            {/* Experian Commercial */}
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
              <FileCheck className="w-4 h-4 text-teal-400" />
              <span className="font-bold tracking-tight">Experian Commercial</span>
            </div>

            {/* Equifax Business */}
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span className="font-bold tracking-tight">Equifax Business</span>
            </div>

            {/* Zero-SSN Vault */}
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="font-bold tracking-tight">Zero-SSN Vault</span>
            </div>

            {/* Stripe Verified */}
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default col-span-2 sm:col-span-1 justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="font-bold tracking-tight">Stripe Verified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
