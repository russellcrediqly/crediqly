'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const tiers = [
  {
    tier: 1,
    name: 'Foundation Tradelines',
    timeline: 'Days 1–30',
    tag: 'Free Access',
    color: 'border-emerald-500 bg-emerald-500 text-white',
    indicatorColor: 'border-emerald-500/40',
    description:
      'Establish trade accounts with major vendors that report to D&B, Experian, and Equifax — with no personal credit check required.',
    requirements: [
      'State LLC or Corp in Good Standing',
      'Federal EIN + Business Checking Account',
      'Commercial Phone & Verified Address',
    ],
    accounts: [
      'Uline Corporate Net-30',
      'Grainger Industrial Net-30',
      'Quill Office Products Net-30',
    ],
    bureauGoal: 'Generate D-U-N-S® Number & first trade lines',
    cta: { href: '/signup', label: 'Start Tier 1 Free' },
  },
  {
    tier: 2,
    name: 'Retail & Fleet Accounts',
    timeline: 'Days 30–60',
    tag: 'Credit Seasoning',
    color: 'border-teal-500 bg-teal-500 text-white',
    indicatorColor: 'border-teal-500/40',
    description:
      'Graduate to commercial store accounts and fleet cards that report higher monthly balances and expand bureau depth.',
    requirements: [
      '3–5 Tier-1 Tradelines Reporting Prompt Pay',
      '30+ Days of Operating File History',
      'Verified Commercial Bank Reserves',
    ],
    accounts: [
      'WEX Fleet Fuel Card',
      'Home Depot Pro Commercial Account',
      'Amazon Business Revolving Line',
    ],
    bureauGoal: '80 Paydex & Experian Score 75+',
    cta: { href: '/signup', label: 'Build Tier 2' },
  },
  {
    tier: 3,
    name: 'Revolving Corporate Cards',
    timeline: 'Days 60–90',
    tag: 'Unsecured Expansion',
    color: 'border-brand-500 bg-brand-500 text-white',
    indicatorColor: 'border-brand-500/40',
    description:
      'Unlock true revolving commercial credit cards with 0% intro APR terms and spending limits 10x larger than consumer cards.',
    requirements: [
      '5+ Reporting Tradelines in Good Standing',
      '80+ Paydex Benchmark Established',
      '$10,000+ Monthly Gross Deposits',
    ],
    accounts: [
      '0% Intro APR Corporate Cash Card',
      'Chase Ink Business Preferred',
      'Amex Business Gold / Platinum',
    ],
    bureauGoal: 'No personal credit utilization exposure',
    cta: { href: '/signup', label: 'Unlock Tier 3' },
  },
  {
    tier: 4,
    name: 'Commercial Lines & Bank Credit',
    timeline: 'Days 90–120+',
    tag: 'Institutional Scale',
    color: 'border-indigo-500 bg-indigo-500 text-white',
    indicatorColor: 'border-indigo-500/40',
    description:
      'Access institutional banking lines and SBA facilities from $50,000 to $500,000+ based strictly on business financial merit.',
    requirements: [
      'Seasoned Bureau Profile with 8+ Tradelines',
      '12+ Months Operating Bank Records',
      'DSCR Ratio of 1.15x – 1.25x',
    ],
    accounts: [
      'Unsecured Revolving Bank Line ($100k+)',
      'SBA 7(a) Working Capital Facility',
      'Equipment Lease & Asset-Backed Lines',
    ],
    bureauGoal: 'Maximum commercial borrowing capacity',
    cta: { href: '/signup', label: 'Reach Tier 4' },
  },
];

export const TradelineRoadmap: React.FC = () => {
  const [selected, setSelected] = useState(1);
  const tier = tiers[selected - 1];

  return (
    <section id="route-map" className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/6 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

        {/* Header */}
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Structured Roadmap</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            From zero credit file to $250k+. A proven 4-stage blueprint.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Building commercial credit is a precise sequence. Apply out of order and lenders reject you. Follow this framework and institutional doors open.
          </p>
        </div>

        {/* Tier step selectors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiers.map((t) => {
            const isActive = selected === t.tier;
            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => setSelected(t.tier)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  isActive
                    ? 'bg-white/5 border-brand-500/60 shadow-lg ring-1 ring-brand-500/20'
                    : 'bg-white/2 border-white/6 hover:border-white/12 hover:bg-white/4'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                      isActive ? 'bg-brand-600 text-white' : 'bg-white/8 text-slate-500'
                    }`}
                  >
                    {t.tier}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600">{t.timeline}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-white leading-tight mb-1">
                  {t.name}
                </h4>
                <span className={`text-[10px] font-medium ${isActive ? 'text-brand-400' : 'text-slate-600'}`}>
                  {t.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active tier detail */}
        <div className="rounded-3xl border border-white/8 bg-slate-900/50 p-6 sm:p-10 shadow-xl backdrop-blur-sm space-y-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b border-white/6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-semibold text-brand-300 bg-brand-950/60 border border-brand-800/50 px-2.5 py-1 rounded-full">
                  {tier.timeline}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">{tier.tag}</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
              <p className="text-sm text-slate-400 max-w-xl">{tier.description}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/3 border border-white/6 shrink-0 min-w-fit">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Bureau Goal</span>
              <span className="text-sm font-semibold text-cyan-300">{tier.bureauGoal}</span>
            </div>
          </div>

          {/* Requirements + Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prerequisites</h4>
              <ul className="space-y-2">
                {tier.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unlocked Accounts</h4>
              <ul className="space-y-2">
                {tier.accounts.map((acc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white font-medium">
                    <CreditCard className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    {acc}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/6">
            <p className="text-sm text-slate-500">
              {tier.tier === 1
                ? 'Tier-1 Net-30 access is 100% free for all Crediqly accounts.'
                : `Tier ${tier.tier} unlocks after completing all prior prerequisites.`}
            </p>
            <Link href={tier.cta.href} className="shrink-0">
              <Button
                size="sm"
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm gap-2 shadow-sm"
              >
                {tier.cta.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
