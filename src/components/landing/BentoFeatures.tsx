'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Lock,
  Bot,
  ArrowRight,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const pillars = [
  { id: 'foundation', label: 'Entity Foundation' },
  { id: 'bureau', label: 'Bureau Depth' },
  { id: 'capital', label: 'Capital Readiness' },
] as const;

type PillarId = typeof pillars[number]['id'];

const milestoneData: Record<PillarId, { text: string; pts: number }[]> = {
  foundation: [
    { text: 'State Entity Registration & Good Standing (SOS)', pts: 5 },
    { text: 'Federal EIN + Dedicated Business Checking Account', pts: 10 },
    { text: 'Commercial Phone & Web Presence Compliance', pts: 5 },
    { text: 'Business Address — No Home or UPS Store', pts: 5 },
  ],
  bureau: [
    { text: 'Dun & Bradstreet D-U-N-S® File Generated', pts: 10 },
    { text: '3 Active Tier-1 Net-30 Accounts Reporting Prompt Pay', pts: 10 },
    { text: 'Tier-2 Revolving Corporate Cards (Paydex 80+ Target)', pts: 10 },
    { text: 'Experian Commercial & Equifax Business Files Open', pts: 5 },
  ],
  capital: [
    { text: 'Revenue Verification & Operating Seasoning (12+ mo)', pts: 10 },
    { text: 'Dedicated Business Bank Account with 3+ Months History', pts: 10 },
    { text: 'Application Document Pack Prepared (Tax/Deposit)', pts: 5 },
    { text: 'DSCR Ratio ≥ 1.15x Against Target Credit Facility', pts: 5 },
  ],
};

export const BentoFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PillarId>('bureau');

  return (
    <section id="features" className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden border-t border-white/5">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-brand-500/8 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="max-w-2xl space-y-4 mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Platform Capabilities</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Built to pass commercial underwriting, not just look impressive.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Crediqly audits your real fundability across 14 deterministic milestones — each one directly tied to what prime commercial lenders evaluate.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Large card: Milestone Engine */}
          <div className="lg:col-span-7 rounded-3xl border border-white/8 bg-slate-950/70 p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                  Deterministic Milestone System
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  One Authoritative Readiness Score
                </h3>
                <p className="text-sm text-slate-400 max-w-md">
                  Zero arbitrary point bumps. Every point reflects a verified milestone required by prime commercial lenders. Total weights always sum to 100.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600 shrink-0 mt-1">0 → 100 pts</span>
            </div>

            {/* Tab selector */}
            <div className="flex items-center gap-1 border-b border-white/6 pb-4">
              {pillars.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveTab(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === p.id
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Milestone list */}
            <div className="space-y-2">
              {milestoneData[activeTab].map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-slate-300 truncate">{m.text}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 font-mono shrink-0">
                    +{m.pts} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
              <span>14 milestones · weights total exactly 100</span>
              <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors">
                View Full Engine <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right column: 2 stacked cards */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Card: Zero-SSN */}
            <div className="flex-1 rounded-3xl border border-emerald-900/40 bg-gradient-to-b from-emerald-950/30 to-slate-950/60 p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Personal Credit Exposure</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  We never ask for your SSN, banking passwords, or personal tax returns. Your credit profile is built entirely under your company EIN.
                </p>
              </div>
              <div className="space-y-2 pt-1">
                {[
                  '0 personal hard inquiries',
                  '0 impact on personal utilization',
                  'Liability stays inside your entity',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/signup">
                <Button size="sm" className="w-full mt-1 bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/8 rounded-xl">
                  Start Protected Audit
                </Button>
              </Link>
            </div>

            {/* Card: Priority Engine */}
            <div className="flex-1 rounded-3xl border border-white/8 bg-slate-950/70 p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">+10 pts impact</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Always Know Your Next Move</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  The engine continuously identifies your highest-leverage action, explains why lenders care, and shows what unlocks next.
                </p>
              </div>
              {/* Mini action preview */}
              <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Open Business Checking Account</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[10px] font-medium">
                    Blocker
                  </span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Prime lenders auto-reject businesses banking from personal accounts.
                </p>
                <div className="flex items-center justify-between pt-0.5 border-t border-white/5 text-[10px] text-slate-600">
                  <span>Unlocks after: Tier-1 Tradelines</span>
                  <span className="text-brand-400 font-medium">~15 min setup</span>
                </div>
              </div>
            </div>

            {/* Card: AI Mentor */}
            <div className="flex-1 rounded-3xl border border-teal-900/40 bg-gradient-to-b from-teal-950/20 to-slate-950/60 p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Context-Aware AI Mentor</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Ask questions about your specific profile. The AI Mentor evaluates your exact readiness data to deliver institution-grade guidance.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/3 border border-white/6 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <Bot className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                  <span className="italic">"Why did my revolving line require a 1.15x DSCR?"</span>
                </div>
                <p className="text-slate-500 pl-5 leading-relaxed">
                  DSCR measures operating cash flow vs. debt. At $28k/mo revenue you safely support up to $50k in draw limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
