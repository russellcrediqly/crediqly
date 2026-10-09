'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Gift,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type CategoryId = 'revolving' | 'cards' | 'net30' | 'sba' | 'grants';

interface Category {
  id: CategoryId;
  label: string;
  icon: React.ElementType;
}

interface CategoryData {
  badge: string;
  badgeColor: string;
  title: string;
  desc: string;
  typicalRange: string;
  criteria: { label: string; value: string; highlight?: boolean }[];
  insight: { heading: string; body: string };
  cta: { label: string };
}

const categories: Category[] = [
  { id: 'revolving', label: 'Revolving Lines', icon: DollarSign },
  { id: 'cards', label: '0% APR Cards', icon: CreditCard },
  { id: 'net30', label: 'Net-30 Vendors', icon: Building2 },
  { id: 'sba', label: 'SBA & Term Loans', icon: TrendingUp },
  { id: 'grants', label: 'Grants', icon: Gift },
];

const data: Record<CategoryId, CategoryData> = {
  revolving: {
    badge: 'Highest Flexibility',
    badgeColor: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50',
    title: 'Unsecured Commercial Revolving Lines of Credit',
    desc: 'Access dedicated credit pools from $10,000 to $100,000+. Only pay interest on funds actively drawn.',
    typicalRange: '$10,000 – $100,000+',
    criteria: [
      { label: 'Min FICO', value: '650+' },
      { label: 'Min Revenue', value: '$10k/mo' },
      { label: 'Min Age', value: '6–12 mo' },
      { label: 'Underwriting', value: 'Bank Deposits', highlight: true },
    ],
    insight: {
      heading: 'What lenders look for',
      body: '3+ consecutive months of stable business banking deposits. With 3 reporting tradelines, interest rates drop by 2–4%.',
    },
    cta: { label: 'Audit Your Qualification Free' },
  },
  cards: {
    badge: 'Zero Operational Interest',
    badgeColor: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/50',
    title: '0% Intro APR Corporate Credit Cards',
    desc: 'Fund equipment, inventory, and marketing interest-free for 9 to 18 months without touching personal savings.',
    typicalRange: '$5,000 – $50,000',
    criteria: [
      { label: 'Intro APR', value: '0% (12–18 mo)' },
      { label: 'Personal Utilization', value: '0% (Hidden)', highlight: true },
      { label: 'Reports To', value: 'Experian Biz' },
      { label: 'Min Personal', value: '680+ FICO' },
    ],
    insight: {
      heading: 'Key advantage',
      body: 'Business card debt does NOT appear on personal credit reports with prime commercial issuers, keeping your personal score 100% clean.',
    },
    cta: { label: 'View Unlocked Cards' },
  },
  net30: {
    badge: 'Foundation Tradelines',
    badgeColor: 'text-teal-400 bg-teal-950/50 border-teal-800/50',
    title: 'Tier-1 Net-30 Vendor Accounts — Bureau Seeding',
    desc: 'Direct commercial accounts with Uline, Grainger, and Quill that report trade experience to D&B, Experian, and Equifax.',
    typicalRange: '100% Free Access',
    criteria: [
      { label: 'Credit Pull', value: 'None (EIN Only)', highlight: true },
      { label: 'Min Revenue', value: '$0 (New LLCs)' },
      { label: 'Reporting', value: '30–45 days' },
      { label: 'Score Goal', value: '80 Paydex' },
    ],
    insight: {
      heading: 'Crediqly Free Feature',
      body: 'Tier-1 vendor accounts and active partner applications remain completely free for all users to kickstart bureau reporting immediately.',
    },
    cta: { label: 'Access Free Net-30 Directory' },
  },
  sba: {
    badge: 'Government Guaranteed',
    badgeColor: 'text-amber-400 bg-amber-950/50 border-amber-800/50',
    title: 'SBA 7(a), SBA Express & Institutional Term Loans',
    desc: 'Low-interest long-term debt for major expansions, equipment acquisition, or working capital refinancing.',
    typicalRange: '$50,000 – $500,000+',
    criteria: [
      { label: 'Interest Rate', value: 'Prime + 2.25%' },
      { label: 'Repayment', value: '5–10 Years' },
      { label: 'DSCR Target', value: '1.15x', highlight: true },
      { label: 'Time in Biz', value: '24+ Months' },
    ],
    insight: {
      heading: 'Pre-underwrite first',
      body: 'Crediqly prepares your complete document pack and bank-ready Commercial Readiness Dossier before you approach lenders.',
    },
    cta: { label: 'Audit SBA Readiness' },
  },
  grants: {
    badge: 'Non-Dilutive Capital',
    badgeColor: 'text-purple-400 bg-purple-950/50 border-purple-800/50',
    title: 'Small Business Grants — Zero Repayment Required',
    desc: 'Non-repayable funding awarded based on operational milestones, industry focus, and founder mission. No interest, no equity.',
    typicalRange: '$5,000 – $50,000',
    criteria: [
      { label: 'Repayment', value: '$0', highlight: true },
      { label: 'Equity', value: '0% Given' },
      { label: 'Award Size', value: '$5k–$50k' },
      { label: 'Eligibility', value: 'All U.S. LLCs' },
    ],
    insight: {
      heading: 'Curated grants feed',
      body: 'Crediqly continuously indexes active national and regional small business grant deadlines inside your member dashboard.',
    },
    cta: { label: 'Explore Grant Directory' },
  },
};

export const CapitalMatcher: React.FC = () => {
  const [active, setActive] = useState<CategoryId>('revolving');
  const d = data[active];

  return (
    <section id="funding" className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/6 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Matched Capital Spectrum</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Explore commercial financing matched to your profile.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Know exactly what lenders require before you ever apply — minimum age, revenue thresholds, and underwriting criteria with zero credit pull risk.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-white/4 border border-white/8 text-slate-400 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Active category panel */}
        <div className="rounded-3xl border border-white/8 bg-slate-950/60 p-6 sm:p-10 shadow-xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/6">
            <div className="space-y-2">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${d.badgeColor}`}>
                {d.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{d.title}</h3>
              <p className="text-sm text-slate-400">{d.desc}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/3 border border-white/6 shrink-0 text-right">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Typical Range</span>
              <span className="text-sm font-bold text-emerald-400">{d.typicalRange}</span>
            </div>
          </div>

          {/* Criteria grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {d.criteria.map((c) => (
              <div key={c.label} className="p-3.5 rounded-xl bg-white/3 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">{c.label}</span>
                <span className={`text-sm font-bold font-mono ${c.highlight ? 'text-teal-300' : 'text-white'}`}>
                  {c.value}
                </span>
              </div>
            ))}
          </div>

          {/* Insight + CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/6">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-white">{d.insight.heading}:</span>
              <p className="text-sm text-slate-400 max-w-lg">{d.insight.body}</p>
            </div>
            <Link href="/signup" className="shrink-0">
              <Button
                size="sm"
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm gap-2 shadow-sm whitespace-nowrap"
              >
                {d.cta.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
