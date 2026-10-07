'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  BarChart3,
  Bot,
  Compass,
  Zap,
  ArrowRight,
  Layers,
  FileCheck,
  Building,
  CreditCard,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const BentoFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'foundation' | 'bureau' | 'capital'>('bureau');

  return (
    <section id="features" className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden">
      {/* Subtle Ambient Refractions */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              Institutional-Grade Architecture
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Engineered to pass commercial{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              underwriting on day one.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Most credit-building apps give you vanity scores and generic tips. Crediqly audits your real fundability across 14 deterministic milestones, eliminating lender red flags before you apply.
          </p>
        </div>

        {/* 2027 Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* ============================================================= */}
          {/* BENTO 1: LARGE 8-COLUMN CARD (The 14-Milestone Engine)       */}
          {/* ============================================================= */}
          <div className="md:col-span-12 lg:col-span-8 rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-950 text-brand-300 border border-brand-800 w-fit">
                  Deterministic Milestone System
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Strictly 0 → 100 • Sums to 100 Points
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                One Authoritative Readiness Calculation
              </h3>

              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Zero arbitrary increases, zero fake +10 score bumps. Every single point reflects verified database-backed milestones required by prime commercial lenders.
              </p>

              {/* Interactive Category Selector inside Bento */}
              <div className="flex items-center gap-2 pt-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('foundation')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'foundation'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Pillar 1: Legal Entity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bureau')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'bureau'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Pillar 2: Bureau Depth
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('capital')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'capital'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Pillar 3: Capital Ready
                </button>
              </div>

              {/* Dynamic Pillar Items */}
              <div className="space-y-2.5 pt-1 text-xs">
                {activeTab === 'foundation' && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">State Entity Registration &amp; Good Standing (SOS)</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+5 pts</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">Federal EIN &amp; Dedicated Business Checking</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+10 pts</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">Commercial Phone &amp; Web Presence Compliance</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+5 pts</span>
                    </div>
                  </>
                )}

                {activeTab === 'bureau' && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">Dun &amp; Bradstreet D-U-N-S® Bureau File Generated</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+10 pts</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">3 Active Tier-1 Net-30 Vendor Accounts Reporting Prompt Pay</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+10 pts</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">Tier-2 Revolving Corporate Cards (Paydex 80+ Target)</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+10 pts</span>
                    </div>
                  </>
                )}

                {activeTab === 'capital' && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">Revenue Verification &amp; Operating Seasoning</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+10 pts</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-200 font-semibold">Application Document Readiness Pack (Tax/Deposit Prep)</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+5 pts</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                14 Defined Milestones • Total Active Weights = 100
              </span>
              <Link href="/signup" className="text-xs font-bold text-brand-300 hover:text-white flex items-center gap-1">
                <span>View Full Milestone Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ============================================================= */}
          {/* BENTO 2: 4-COLUMN CARD (Zero-SSN Vault Architecture)          */}
          {/* ============================================================= */}
          <div className="md:col-span-12 lg:col-span-4 rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-950 to-slate-900 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 w-fit block">
                Zero-SSN Cryptographic Vault
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                No Personal Credit Exposure
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We never ask for your Social Security Number, personal banking passwords, or tax returns. Build credit that stands strictly on your company EIN.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>0 Personal Hard Inquiries</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>0 Impact on Personal Utilization</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Separate Personal &amp; Business Liability</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/signup">
                <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
                  <span>Start Protected Audit</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* ============================================================= */}
          {/* BENTO 3: 6-COLUMN CARD (Intelligent Priority Queue)           */}
          {/* ============================================================= */}
          <div className="md:col-span-12 lg:col-span-6 rounded-3xl border border-slate-700/80 bg-slate-950 p-6 sm:p-8 flex flex-col justify-between space-y-5 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Intelligent Priority Engine
                </span>
                <span className="text-xs font-mono text-emerald-400">+10 Pts Impact</span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight">
                What Should I Do Next?
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                No more paralysis by analysis. The algorithm continuously identifies your single highest-leverage move, explains why lenders care, and tells you what unlocks next.
              </p>

              {/* Mockup Action Item */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">
                    Open Dedicated Business Checking Account
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-bold">
                    Underwriting Blocker
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Prime commercial lenders automatically reject businesses operating through personal bank accounts.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>✨ After this: Tier-1 Tradelines Unlock</span>
                  <span className="text-brand-300 font-bold">Estimated Time: 15 mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* BENTO 4: 6-COLUMN CARD (AI Mentor & Lender Underwriting Sync)  */}
          {/* ============================================================= */}
          <div className="md:col-span-12 lg:col-span-6 rounded-3xl border border-slate-700/80 bg-slate-950 p-6 sm:p-8 flex flex-col justify-between space-y-5 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  Context-Aware Copilot
                </span>
                <span className="text-xs font-mono text-cyan-400">Live Knowledge Base</span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight">
                Data-Aware Crediqly AI Mentor
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ask specific questions about your DSCR, Paydex thresholds, or lender requirements. The AI Mentor evaluates your exact profile to deliver institutional-grade guidance.
              </p>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Bot className="w-4 h-4 text-teal-400" />
                  <span>"Why did my revolving credit line require a 1.15x DSCR?"</span>
                </div>
                <p className="text-slate-400 pl-6 leading-relaxed">
                  "Debt Service Coverage Ratio measures your operating cash flow against debt obligations. At your current $28k monthly revenue, you safely support up to $50,000 in credit line draws without triggering underwriter risk buffers."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
