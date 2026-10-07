'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  CreditCard,
  Building,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const TradelineRoadmap: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<number>(1);

  const tiers = [
    {
      tier: 1,
      name: 'Tier 1: Foundation Tradelines',
      tag: '100% Free Access',
      timeline: 'Days 1–30',
      description: 'Establish foundational trade accounts reporting to Dun & Bradstreet, Experian, and Equifax with no personal credit check.',
      requirements: ['State LLC or Corp in Good Standing', 'Federal Employer ID (EIN)', 'Dedicated Business Checking Account', 'Commercial Phone & Address'],
      typicalAccounts: ['Uline Corporate Net-30', 'Grainger Industrial Net-30', 'Quill Office Products Net-30', 'The CEO Creative Net-30'],
      bureauTarget: 'Generate D-U-N-S® Number & First Bureau Trade Lines',
    },
    {
      tier: 2,
      name: 'Tier 2: Retail & Fleet Store Cards',
      tag: 'Credit Seasoning',
      timeline: 'Days 30–60',
      description: 'Graduate to commercial store accounts and fleet fuel cards that report higher monthly balances and expand bureau trade line depth.',
      requirements: ['3–5 Tier 1 Tradelines Reporting Prompt Pay', 'Minimum 30 Days Operating File History', 'Verified Commercial Bank Reserves'],
      typicalAccounts: ['WEX Fleet Fuel Card', 'Home Depot Pro Commercial Account', 'Amazon Business Revolving Line', 'Office Depot Commercial Credit'],
      bureauTarget: 'Establish 80 Paydex Score & Experian Score 75+',
    },
    {
      tier: 3,
      name: 'Tier 3: Revolving Corporate Cards',
      tag: 'Unsecured Expansion',
      timeline: 'Days 60–90',
      description: 'Unlock true revolving commercial credit cards with introductory 0% APR terms, 10x higher spending limits, and cash rewards.',
      requirements: ['5+ Reporting Tradelines in Good Standing', 'Established 80+ Paydex Benchmark', 'Minimum $10,000+ Monthly Gross Deposits'],
      typicalAccounts: ['0% Intro APR Corporate Cash Card', 'Chase Ink Business Preferred / Cash', 'American Express Business Gold / Platinum', 'Capital One Spark Commercial'],
      bureauTarget: 'No Personal Credit Utilization Exposure',
    },
    {
      tier: 4,
      name: 'Tier 4: Commercial Lines & Bank Credit',
      tag: 'Institutional Scale',
      timeline: 'Days 90–120+',
      description: 'Access institutional banking lines of credit and SBA facilities from $50,000 to $500,000+ based strictly on business financial merit.',
      requirements: ['Seasoned Bureau Profile with 8+ Tradelines', '12+ Months Operating Bank Records', 'Target DSCR Ratio of 1.15x – 1.25x'],
      typicalAccounts: ['Unsecured Revolving Bank Line ($100k+)', 'SBA 7(a) Working Capital Facility', 'Equipment Lease & Asset Backed Lines', 'Commercial Real Estate Credit Facilities'],
      bureauTarget: 'Maximum Commercial Borrowing Capacity',
    },
  ];

  const currentTier = tiers[selectedTier - 1];

  return (
    <section id="route-map" className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-brand-300">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              Structured Roadmap
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            The 4-tier blueprint from{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              zero file to $250k+ capital.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Building commercial credit is an exact sequence. Apply too early and underwriters reject you; follow the sequential 4-tier framework and institutional doors swing wide open.
          </p>
        </div>

        {/* Tier Step Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {tiers.map((t) => {
            const isSelected = selectedTier === t.tier;
            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => setSelectedTier(t.tier)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-slate-800 to-slate-950 border-brand-500 shadow-xl ring-2 ring-brand-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black font-mono ${
                      isSelected ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    0{t.tier}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{t.timeline}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                  {t.name}
                </h4>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                  {t.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Active Tier Card */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-950 border border-brand-800 text-[10px] font-bold text-brand-300">
                  {currentTier.timeline}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">{currentTier.tag}</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1.5">{currentTier.name}</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
                {currentTier.description}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shrink-0 sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Bureau Goal</span>
              <span className="text-xs sm:text-sm font-extrabold text-cyan-300 block">
                {currentTier.bureauTarget}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Underwriting Requirements */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                1. Required Pre-Requisites
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {currentTier.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Unlocked Accounts */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                2. Unlocked Commercial Accounts
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {currentTier.typicalAccounts.map((acc, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CreditCard className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span className="font-semibold text-white">{acc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-300">
              ⚡ Tier-1 Net-30 accounts are 100% free forever in your Crediqly account.
            </span>
            <Link href="/signup" className="shrink-0">
              <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs">
                <span>Start Tier 1 Free Today</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
