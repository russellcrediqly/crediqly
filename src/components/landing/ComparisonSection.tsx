'use client';

import React from 'react';
import Link from 'next/link';
import {
  XCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ComparisonSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              Why Most Founders Get Denied
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Stop risking personal credit.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Build institutional power.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Relying on personal credit cards to fund business expenses caps your growth, damages your credit score, and puts your personal assets at risk.
          </p>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* THE OLD WAY (RED/SLATE) */}
          <div className="p-7 sm:p-9 rounded-3xl bg-slate-900/60 border border-rose-950/80 shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                  The Old Way
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  The Blind Guessing Trap
                </h3>
              </div>
              <XCircle className="w-8 h-8 text-rose-500/80" />
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Personal SSN Guarantee</strong>
                  Every business dollar spent increases personal utilization, dragging your consumer credit score down 40–80 points.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Blind Underwriting Denials</strong>
                  Applying without checking commercial bureau files leads to mysterious lender rejections and wasted hard inquiries.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Low Consumer Limits</strong>
                  Personal cards max out at $5,000–$15,000, severely choking cash flow during inventory orders and seasonal cycles.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Personal Asset Exposure</strong>
                  If the business experiences a downturn, your personal home, savings, and family assets remain directly on the hook.
                </div>
              </li>
            </ul>
          </div>

          {/* THE CREDIQLY WAY (EMERALD/Obsidian) */}
          <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-brand-500/80 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  The Crediqly System
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Standalone Corporate Credit
                </h3>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">100% EIN Corporate Profile</strong>
                  Credit is tied directly to your business tax ID and reported to Dun &amp; Bradstreet, Experian Commercial, and Equifax.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">14 Deterministic Milestones</strong>
                  Know your exact 0–100 Readiness Score and fix underwriting gaps before lenders ever run your file.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">10x Higher Commercial Limits</strong>
                  Unlock $50,000 to $250,000+ in revolving lines, vendor terms, and non-dilutive credit without personal credit strain.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Zero Personal Liability Protection</strong>
                  Keep company liabilities strictly inside your corporate entity, safeguarding your personal credit score forever.
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <Link href="/signup">
                <Button size="md" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg gap-2">
                  <span>Start Protected EIN Profile Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
