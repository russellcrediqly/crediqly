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
  ExternalLink,
  Lock,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CapitalMatcher: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'revolving' | 'cards' | 'net30' | 'sba' | 'grants'>('revolving');

  const categories = [
    { id: 'revolving', label: 'Revolving Credit Lines', icon: DollarSign, amount: '$10,000 – $100,000+' },
    { id: 'cards', label: 'Corporate Cards (0% APR)', icon: CreditCard, amount: '$5,000 – $50,000' },
    { id: 'net30', label: 'Net-30 Vendor Accounts', icon: Building2, amount: 'Starter Bureau Seeding' },
    { id: 'sba', label: 'SBA 7(a) & Term Loans', icon: TrendingUp, amount: '$50,000 – $500,000+' },
    { id: 'grants', label: 'Small Business Grants', icon: Gift, amount: '$5,000 – $50,000 (Free Capital)' },
  ];

  return (
    <section id="funding" className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              Matched Capital Spectrum
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Explore commercial financing{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              matched to your profile.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Know exactly what lenders require before you ever apply. Review minimum operating age, gross revenue thresholds, and underwriting criteria with zero credit pull risk.
          </p>
        </div>

        {/* Interactive Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Category Display Showcase */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
          {/* TAB 1: REVOLVING CREDIT LINES */}
          {activeCategory === 'revolving' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    Highest Flexibility
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    Unsecured Commercial Revolving Lines of Credit
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Access dedicated credit pools from $10,000 to $100,000+. Only pay interest on funds actively drawn.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Typical Limit</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">$10,000 – $100,000+</span>
                </div>
              </div>

              {/* Criteria Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Min Credit</span>
                  <span className="text-sm font-black text-white font-mono">650+ FICO</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Min Revenue</span>
                  <span className="text-sm font-black text-white font-mono">$10,000 / mo</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Min Age</span>
                  <span className="text-sm font-black text-white font-mono">6–12 Months</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Underwriting</span>
                  <span className="text-sm font-black text-teal-300 font-mono">Bank Deposits</span>
                </div>
              </div>

              {/* Rationale & Readiness Advice */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-extrabold text-white block">Underwriter Benchmark:</span>
                  <p className="text-slate-400">
                    Lenders verify 3+ consecutive months of stable business banking deposits. With 3 reporting tradelines, interest rates drop by 2.5% to 4%.
                  </p>
                </div>
                <Link href="/signup" className="shrink-0">
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs">
                    <span>Audit Your Qualification Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: CORPORATE CARDS */}
          {activeCategory === 'cards' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
                    Zero Operational Interest
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    0% Intro APR Corporate Credit Cards
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Fund equipment, inventory, and marketing expenses interest-free for 9 to 18 months without touching personal savings.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Credit Scale</span>
                  <span className="text-xl font-black text-cyan-400 font-mono">$5,000 – $50,000</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Intro Terms</span>
                  <span className="text-sm font-black text-white font-mono">0% APR (12-18 mo)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Personal Utilization</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">0% (Hidden)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Bureau Reporting</span>
                  <span className="text-sm font-black text-white font-mono">Experian Business</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Minimum Credit</span>
                  <span className="text-sm font-black text-white font-mono">680+ Personal</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-extrabold text-white block">Key Advantage:</span>
                  <p className="text-slate-400">
                    Business card debt does NOT appear on personal credit reports with prime commercial issuers, keeping personal credit scores 100% clean.
                  </p>
                </div>
                <Link href="/signup" className="shrink-0">
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs">
                    <span>View Unlocked Cards</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 3: NET-30 TRADELINES */}
          {activeCategory === 'net30' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800">
                    Foundation Tradelines
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    Tier-1 Net-30 Vendor Accounts (Starter Bureau Seeding)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Direct commercial accounts with Uline, Grainger, and Quill that report trade experience to D&amp;B, Experian, and Equifax.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Setup Cost</span>
                  <span className="text-xl font-black text-teal-400 font-mono">100% Free Access</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Credit Pull</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">None (EIN Only)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Min Revenue</span>
                  <span className="text-sm font-black text-white font-mono">$0 (New LLCs)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Reporting Window</span>
                  <span className="text-sm font-black text-white font-mono">30–45 Days</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Score Goal</span>
                  <span className="text-sm font-black text-teal-300 font-mono">80 Paydex</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-extrabold text-white block">Crediqly Free Forever Feature:</span>
                  <p className="text-slate-400">
                    Tier-1 vendor accounts and active partner applications remain completely free for all Crediqly users to kickstart bureau reporting immediately.
                  </p>
                </div>
                <Link href="/signup" className="shrink-0">
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs">
                    <span>Access Free Net-30 Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 4: SBA 7(A) & TERM */}
          {activeCategory === 'sba' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
                    Government Guaranteed
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    SBA 7(a), SBA Express &amp; Institutional Term Loans
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Low-interest long-term debt facilities for major expansions, equipment acquisition, or working capital refinancing.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Size</span>
                  <span className="text-xl font-black text-amber-400 font-mono">$50,000 – $500,000+</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Interest Rates</span>
                  <span className="text-sm font-black text-white font-mono">Prime + 2.25%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Repayment Term</span>
                  <span className="text-sm font-black text-white font-mono">5–10 Years</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Target DSCR</span>
                  <span className="text-sm font-black text-teal-300 font-mono">1.15x Coverage</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Time in Business</span>
                  <span className="text-sm font-black text-white font-mono">24+ Months</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-extrabold text-white block">Pre-Underwrite First:</span>
                  <p className="text-slate-400">
                    Crediqly prepares your complete 21-point document pack and bank-ready Commercial Readiness Dossier before you approach lenders.
                  </p>
                </div>
                <Link href="/signup" className="shrink-0">
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs">
                    <span>Audit SBA Readiness</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 5: SMALL BUSINESS GRANTS */}
          {activeCategory === 'grants' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800">
                    Non-Dilutive Free Capital
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    Small Business Grants Directory ($0 Repayment)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Non-repayable funding awarded based on operational milestones, industry focus, and founder mission. Zero interest, zero equity.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Repayment</span>
                  <span className="text-xl font-black text-purple-400 font-mono">$0 (Free Capital)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Credit Check</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">None ($0 Pull)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Equity Given</span>
                  <span className="text-sm font-black text-white font-mono">0% (Keep 100%)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Award Size</span>
                  <span className="text-sm font-black text-white font-mono">$5,000 – $50,000</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Eligibility</span>
                  <span className="text-sm font-black text-purple-300 font-mono">All U.S. LLCs</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-extrabold text-white block">Curated Grants Feed:</span>
                  <p className="text-slate-400">
                    Crediqly continuously indexes active national and regional small business grant deadlines inside your member dashboard.
                  </p>
                </div>
                <Link href="/signup" className="shrink-0">
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs">
                    <span>Explore Grant Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
