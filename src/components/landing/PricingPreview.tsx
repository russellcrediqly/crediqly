'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const PricingPreview: React.FC = () => {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              Transparent Zero-Risk Pricing
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Start 100% free.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Upgrade when ready to scale.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Every business starts with our free 21-point fundability audit. No credit card required.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* TIER 1: FREE STARTER */}
          <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-8 shadow-xl">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                  Free Forever
                </span>
                <h3 className="text-2xl font-black text-white mt-2">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Baseline audit, foundation readiness, and starter tradeline access.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white font-mono">$0</span>
                <span className="text-xs text-slate-400 font-bold uppercase">/ forever</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800 pt-5">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>21-Point Business Fundability Audit</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Baseline 0–100 Readiness Journey Score</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Stage 1 (Foundation) Roadmap Tasks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tier-1 Net-30 Vendor Catalog (Uline, Grainger, Quill)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Funding Marketplace Previews &amp; Tracker</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="w-full">
              <Button size="md" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl">
                <span>Start Free Account</span>
              </Button>
            </Link>
          </div>

          {/* TIER 2: CREDIQLY PRO (FEATURED) */}
          <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-brand-500 flex flex-col justify-between space-y-8 shadow-2xl relative">
            {/* Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
              Most Popular • Self-Directed
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-300 bg-brand-950 px-2.5 py-0.5 rounded-full border border-brand-800">
                  Full Software Suite
                </span>
                <h3 className="text-2xl font-black text-white mt-2">Crediqly Pro</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Complete 4-tier roadmap, tradelines directory, simulator &amp; AI mentor.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white font-mono text-emerald-400">$39</span>
                <span className="text-xs text-slate-400 font-bold uppercase">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 border-t border-slate-800 pt-5">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-white">Everything in Free Starter</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Full 4-Tier Interactive Business Credit Roadmap</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tier 2/3 Store Cards &amp; Revolving Commercial Cards</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Commercial Banking Directory &amp; Underwriting Criteria</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Interactive Pre-Qualification Parameter Simulator</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Data-Aware Crediqly AI Mentor with Context Engine</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Unlocked Direct Application Access to 17+ Lenders</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="w-full">
              <Button size="md" className="w-full bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg gap-2">
                <span>Unlock Pro Software ($39/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* TIER 3: DONE-FOR-YOU ADVISORY */}
          <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-8 shadow-xl">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                  Concierge Service
                </span>
                <h3 className="text-2xl font-black text-white mt-2">Premium Advisory</h3>
                <p className="text-xs text-slate-400 mt-1">
                  1-on-1 human guidance from a certified credit strategist.
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-mono text-purple-300">$499</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">one-time setup</span>
                </div>
                <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                  + $149/mo retainer (cancel anytime)
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800 pt-5">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-white">Includes ALL Crediqly Pro Features</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dedicated 1-on-1 Monthly Video Strategy Calls</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Custom Underwriter Dossier Preparation (Tax/Bank Pack)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Direct Lender Introductions &amp; Warm Submissions</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bureau Reporting Verification &amp; Dispute Concierge</span>
                </li>
              </ul>
            </div>

            <Link href="/advisory" className="w-full">
              <Button size="md" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-xl">
                <span>Explore Advisory Concierge</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
