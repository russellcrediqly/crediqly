'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  ArrowRight,
  ShieldCheck,
  Building,
  Building2,
  TrendingUp,
  Headphones,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Target,
  ChevronRight,
  HelpCircle,
  Clock,
  Layers,
  DollarSign,
  CreditCard,
  BarChart3,
  Bot,
  Compass,
  FileCheck2,
  ChevronDown,
  AlertTriangle,
  ExternalLink,
  Award,
  Check,
  ShieldAlert,
} from 'lucide-react';

export default function LandingPage() {
  // Interactive Live Dashboard Mockup Tab
  const [activeMockupTab, setActiveMockupTab] = useState<'score' | 'nextAction' | 'funding' | 'routeMap'>('score');

  // FAQ Accordion State (single-open or toggle)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is Crediqly and how does it help my business?',
      answer:
        'Crediqly is an intelligent business-credit and funding readiness platform. We help U.S. small business owners audit their fundability, address underwriting gaps, build reporting corporate tradelines, and discover commercial financing opportunities — all through an actionable, step-by-step roadmap.',
    },
    {
      question: 'Can I really get started for free?',
      answer:
        'Yes. You can create an account 100% free with no credit card required. The free starter plan includes your baseline Funding Readiness Score, 21-point compliance audit, foundational roadmap milestones, and Tier 1 Net-30 vendor directories.',
    },
    {
      question: 'Does Crediqly require my SSN or banking login credentials?',
      answer:
        'Never. Crediqly is built with a zero-sensitive-data architecture. We evaluate your readiness and compliance through basic business information (such as entity type, business age, commercial phone, and revenue ranges). We never ask for or store your Social Security Number, personal banking passwords, or tax returns.',
    },
    {
      question: 'How does the business credit roadmap work?',
      answer:
        'Our roadmap is organized into 5 progressive stages: Establish, Build, Strengthen, Funding Ready, and Scale. At each stage, the system diagnoses your current position, identifies missing credentials or tradeline depth, and guides you through verified milestones that report to Dun & Bradstreet, Experian Commercial, and Equifax Business.',
    },
    {
      question: 'Does Crediqly guarantee funding approval or specific credit scores?',
      answer:
        'No. Crediqly is an educational readiness and organization platform, not a direct lender or broker. We never make false approval promises or guarantee credit score increases. All credit and loan decisions are made solely by independent underwriting financial institutions based on their independent criteria.',
    },
    {
      question: 'How are funding matches and recommendations calculated?',
      answer:
        'Our rule-based engine compares your self-reported business profile (operating history, revenue tier, deposit stability, and credit depth) against typical commercial lender guidelines. This categorizes opportunities into Strong Matches, Possible Matches, and areas requiring preparation before applying.',
    },
    {
      question: 'Can I get 1-on-1 human guidance if I need it?',
      answer:
        'Yes. In addition to our self-directed software and Pro tiers, we offer Premium Advisory ($499 setup + $149/mo). Advisory includes dedicated 1-on-1 strategy sessions with certified business credit specialists, personalized underwriter readiness audits, and ongoing concierge guidance.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* ================================================================= */}
        {/* 1. HERO SECTION (Above-the-Fold 2026 Fintech Experience)          */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/50">
          {/* Subtle Ambient Light Accents */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-tr from-brand-400/10 via-indigo-500/10 to-teal-400/10 blur-3xl pointer-events-none -z-10 rounded-full" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header / Announcement Pill */}
            <div className="flex flex-col items-center text-center space-y-5 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-200 shadow-2xs text-xs font-semibold text-slate-800 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-brand-700">New for 2026</span>
                <span className="text-slate-300">•</span>
                <span>Financial Intelligence &amp; Funding Readiness</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline text-emerald-700 font-bold">No SSN Required</span>
              </div>

              {/* Main H1 Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
                Build Stronger Business Credit.{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-600 block sm:inline">
                  Become Funding Ready.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Get a crystal-clear audit of your commercial fundability, discover matched capital opportunities, and follow an actionable roadmap designed to move your business forward.
              </p>

              {/* Dual Action CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-950 rounded-xl shadow-2xs"
                  >
                    <span>See How It Works</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Micro-Text */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-y-1 gap-x-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Free Forever Starter Tier
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  No Credit Card Required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Zero Personal Credit Impact
                </span>
              </div>
            </div>

            {/* ============================================================= */}
            {/* LIVE DASHBOARD PREVIEW / MOCKUP (2026 Modern Fintech UI)     */}
            {/* ============================================================= */}
            <div className="mt-12 sm:mt-16 relative">
              <div className="rounded-3xl border-2 border-slate-200/90 bg-white shadow-2xl overflow-hidden">
                {/* Mockup Top Navigation Bar */}
                <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center font-black text-xs text-white">
                      C
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white tracking-tight">
                        Summit Global Logistics LLC
                      </span>
                      <span className="text-[11px] text-slate-400 block -mt-0.5">
                        EIN Verified • Commercial Banking Active • Stage 03 Strengthen
                      </span>
                    </div>
                  </div>

                  {/* Interactive Mockup Tab Buttons */}
                  <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl text-xs overflow-x-auto">
                    <button
                      onClick={() => setActiveMockupTab('score')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        activeMockupTab === 'score'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Readiness Score
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('nextAction')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        activeMockupTab === 'nextAction'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      What Should I Do Next?
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('funding')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        activeMockupTab === 'funding'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Matched Funding
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('routeMap')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        activeMockupTab === 'routeMap'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Route Map
                    </button>
                  </div>
                </div>

                {/* Mockup Body Content */}
                <div className="p-6 sm:p-8 bg-slate-50/70 min-h-[340px] flex items-center justify-center">
                  {/* TAB 1: READINESS SCORE */}
                  {activeMockupTab === 'score' && (
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-300">
                      {/* Score Dial */}
                      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                          Funding Readiness Audit
                        </span>
                        <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-8 border-brand-100 bg-slate-50">
                          <div className="text-center">
                            <span className="text-3xl font-black text-slate-900 block leading-none">68</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">/ 100</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">Current Tier: Build</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Reach 75+ to unlock unsecured commercial lines</p>
                        </div>
                      </div>

                      {/* 4 Pillar Breakdown */}
                      <div className="md:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="text-sm font-black text-slate-900">Core Underwriting Factors</h4>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            4 Categories Analyzed
                          </span>
                        </div>
                        <div className="space-y-3 text-xs">
                          <div>
                            <div className="flex justify-between font-bold text-slate-700 mb-1">
                              <span>Entity Structure &amp; Compliance</span>
                              <span className="text-emerald-700">100% • Optimal</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full w-full" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-bold text-slate-700 mb-1">
                              <span>Commercial Banking Stability</span>
                              <span className="text-emerald-700">100% • Verified</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full w-full" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-bold text-slate-700 mb-1">
                              <span>Business Credit Depth (D&amp;B / Experian)</span>
                              <span className="text-amber-700">45% • Need 2 More Tradelines</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full w-[45%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-bold text-slate-700 mb-1">
                              <span>Revenue &amp; Deposit Consistency</span>
                              <span className="text-brand-700">65% • Moderate Stability</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-brand-600 h-full rounded-full w-[65%]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: WHAT SHOULD I DO NEXT? */}
                  {activeMockupTab === 'nextAction' && (
                    <div className="w-full max-w-4xl p-6 sm:p-7 rounded-2xl bg-white border-2 border-brand-400 shadow-md space-y-4 animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                            #1
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                              Intelligent Priority Engine
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-900">
                              Establish Business Credit Depth (2 Reporting Tradelines)
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full w-fit">
                          🔴 High Priority
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <strong className="text-slate-800 font-bold block uppercase tracking-wider text-[10px]">
                            1. Diagnostic Assessment
                          </strong>
                          <p className="text-slate-600 leading-relaxed">
                            Your entity and banking foundation are verified, but bureaus show only 1 reporting trade line. Lenders look for at least 3 reporting lines to establish risk tiers.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 space-y-1">
                          <strong className="text-brand-900 font-bold block uppercase tracking-wider text-[10px]">
                            2. Why This Matters For Funding
                          </strong>
                          <p className="text-slate-600 leading-relaxed">
                            Opening 2 foundational Tier-1 Net-30 accounts establishes payment history with D&amp;B and Experian, directly raising your Readiness Score above 75.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          ✨ Projected Impact: +12 Readiness Points upon reporting
                        </span>
                        <Button size="sm" className="bg-brand-600 text-white font-bold text-xs gap-1.5 shadow-xs">
                          <span>Explore Recommended Net-30 Accounts</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MATCHED FUNDING */}
                  {activeMockupTab === 'funding' && (
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
                      {/* Match 1 */}
                      <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                            🟢 Strong Match
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Commercial</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">Business Line of Credit</h4>
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Estimated Range</span>
                          <span className="text-xl font-black text-emerald-950">$10,000 – $50,000</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Your 12+ month operating history and consistent business deposits meet prime criteria.
                        </p>
                      </div>

                      {/* Match 2 */}
                      <div className="p-5 rounded-2xl bg-white border border-amber-300 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            🟡 Possible Match
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Revolving</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">Corporate Credit Card</h4>
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Target Program Size</span>
                          <span className="text-xl font-black text-amber-950">$5,000 – $25,000</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Requires completing 1 additional reporting tradeline milestone before applying.
                        </p>
                      </div>

                      {/* Match 3 */}
                      <div className="p-5 rounded-2xl bg-white border border-rose-300 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                            🔴 Improve Readiness
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Term / SBA</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">SBA 7(a) Working Capital</h4>
                        <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                          <span className="text-[10px] font-bold text-rose-800 uppercase block">Program Scale</span>
                          <span className="text-xl font-black text-rose-950">$50,000 – $250,000</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Requires 2 years operating history and verified 80+ Paydex score benchmark.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ROUTE MAP */}
                  {activeMockupTab === 'routeMap' && (
                    <div className="w-full max-w-4xl p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-700">
                            Guided Progression
                          </span>
                          <h4 className="text-base font-black text-slate-900">5-Stage Business Credit Timeline</h4>
                        </div>
                        <span className="text-xs font-bold text-slate-500">Current Position: Stage 03</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black inline-flex items-center justify-center">
                            ✓
                          </span>
                          <span className="text-xs font-bold text-emerald-950 block">01 Establish</span>
                          <span className="text-[10px] text-emerald-700">100% Done</span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black inline-flex items-center justify-center">
                            ✓
                          </span>
                          <span className="text-xs font-bold text-emerald-950 block">02 Build</span>
                          <span className="text-[10px] text-emerald-700">100% Done</span>
                        </div>
                        <div className="p-3 rounded-xl bg-brand-50 border-2 border-brand-500 text-center space-y-1 shadow-xs">
                          <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-black inline-flex items-center justify-center animate-pulse">
                            →
                          </span>
                          <span className="text-xs font-black text-brand-950 block">03 Strengthen</span>
                          <span className="text-[10px] text-brand-700 font-bold">In Progress (55%)</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 opacity-75">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-black inline-flex items-center justify-center">
                            04
                          </span>
                          <span className="text-xs font-semibold text-slate-700 block">Funding Ready</span>
                          <span className="text-[10px] text-slate-400">Next Stage</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 opacity-60 col-span-2 sm:col-span-1">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-black inline-flex items-center justify-center">
                            05
                          </span>
                          <span className="text-xs font-semibold text-slate-700 block">Scale</span>
                          <span className="text-[10px] text-slate-400">Upcoming</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. TRUST & VALUE STRIP (Compact Zero-Risk Promises)               */}
        {/* ================================================================= */}
        <section className="py-8 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="flex flex-col items-center space-y-1 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mb-1" />
                <span className="text-xs font-black text-slate-900">Start 100% Free</span>
                <span className="text-[11px] text-slate-500">No credit card required</span>
              </div>
              <div className="flex flex-col items-center space-y-1 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <Lock className="w-6 h-6 text-brand-600 mb-1" />
                <span className="text-xs font-black text-slate-900">Zero Sensitive Data</span>
                <span className="text-[11px] text-slate-500">No SSN • No bank logins</span>
              </div>
              <div className="flex flex-col items-center space-y-1 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <Target className="w-6 h-6 text-indigo-600 mb-1" />
                <span className="text-xs font-black text-slate-900">Real-Time Audit</span>
                <span className="text-[11px] text-slate-500">Instant readiness score</span>
              </div>
              <div className="flex flex-col items-center space-y-1 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <Layers className="w-6 h-6 text-teal-600 mb-1" />
                <span className="text-xs font-black text-slate-900">Actionable Roadmap</span>
                <span className="text-[11px] text-slate-500">Step-by-step milestones</span>
              </div>
              <div className="flex flex-col items-center space-y-1 p-3 rounded-xl hover:bg-slate-50 transition-colors col-span-2 md:col-span-1">
                <Award className="w-6 h-6 text-amber-600 mb-1" />
                <span className="text-xs font-black text-slate-900">Zero False Promises</span>
                <span className="text-[11px] text-slate-500">No fake approval claims</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. THE PROBLEM SECTION ("Business Funding Shouldn't Be a Guess")  */}
        {/* ================================================================= */}
        <section className="py-16 md:py-24 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-brand-400 bg-brand-950/80 px-3 py-1 rounded-full border border-brand-800">
                The Small Business Funding Challenge
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Business funding shouldn&apos;t feel like a guessing game.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Most founders apply for loans or lines of credit blindly — getting denied because of small, invisible underwriting mismatches they never knew existed.
              </p>
            </div>

            {/* 6 Problem Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Blind Underwriting</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You don&apos;t know what commercial lenders see on your business file before you apply, risking costly rejections.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Priority Paralysis</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You know you need stronger business credit, but have zero idea which account, tradeline, or registry to tackle first.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Non-Reporting Dead Ends</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Wasting time and capital on vendor trade accounts that never actually report payment history to D&amp;B, Experian, or Equifax.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Painful Inquiries &amp; Denials</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Applying prematurely triggers hard personal credit pulls and formal denials that damage both business and personal standing.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Conflicting Online Advice</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Scattered internet blogs and generic social media hacks offer contradictory tips that trigger institutional compliance red flags.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Unstructured Progression</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No single unified dashboard connects your company formation, credit building, cash-flow diagnostics, and matched lending.
                </p>
              </div>
            </div>

            {/* Transition Callout */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-950 via-indigo-950 to-slate-950 border border-brand-500/40 text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-300">
                The Crediqly Solution
              </span>
              <h3 className="text-xl font-black text-white">
                That&apos;s where Crediqly replaces guesswork with algorithmic clarity.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We organize your business credit journey into an actionable, milestone-based system so you always know where you stand and what to do next.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. HOW THE PLATFORM HELPS (The 5-Stage Guided Journey)            */}
        {/* ================================================================= */}
        <section id="how-it-works" className="py-16 md:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                A Structured Framework
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                How Crediqly Works For You
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Follow an orderly, 5-stage progression engineered to build commercial credit depth and prepare your business for capital.
              </p>
            </div>

            {/* 5-Stage Step Flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    01
                  </div>
                  <h3 className="text-base font-black text-slate-900">Understand</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Complete your basic business profile to view your 0–100 Funding Readiness Score and 21-point compliance diagnostic.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded w-fit">
                  Profile Baseline
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-black text-xs flex items-center justify-center">
                    02
                  </div>
                  <h3 className="text-base font-black text-slate-900">Improve</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Get clear, prioritized recommendations via the &ldquo;What Should I Do Next?&rdquo; engine to fix key gaps before applying.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded w-fit">
                  Priority Action Plan
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    03
                  </div>
                  <h3 className="text-base font-black text-slate-900">Prepare</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Systematically build Tier 1 &amp; Tier 2 vendor trade accounts that report payment history to D&amp;B and Experian Commercial.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                  Tradeline Depth
                </span>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                    04
                  </div>
                  <h3 className="text-base font-black text-slate-900">Discover</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Explore matched commercial lines of credit, corporate cards, and term financing suited to your business profile.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded w-fit">
                  Matched Capital
                </span>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-black text-xs flex items-center justify-center">
                    05
                  </div>
                  <h3 className="text-base font-black text-slate-900">Scale</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Graduate to high-limit revolving corporate credit, lower borrowing rates, and institutional funding opportunities.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                  Sustainable Growth
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. KEY FEATURES / VALUE SECTION (Existing Platform Capabilities)  */}
        {/* ================================================================= */}
        <section id="features" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Everything You Need to Build Commercial Credit
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Crediqly combines real-time underwriting audits, milestone checklists, and intelligent recommendations in one unified command center.
              </p>
            </div>

            {/* 8 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Funding Readiness Audit</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Understand exactly where your business stands before you apply. Identify specific gaps holding back approval.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">&ldquo;What Should I Do Next?&rdquo;</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Eliminate guesswork. Our intelligent engine prescribes your top 3 prioritized actions with clear explanations.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">5-Tier Roadmap</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Follow structured milestone checklists from company formation to tier-3 corporate revolving lines.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Funding Matches</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover credit lines, cards, and term options categorized into Strong, Possible, and Preparation tiers.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Data-Aware AI Mentor</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ask questions about your score, lender criteria, and next milestones. Receive instant, personalized guidance.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Funding Forecast</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review projected 90-day cash flow receipts, overhead requirements, and working capital needs based on real data.
                </p>
              </div>

              {/* Feature 7 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Verified Tradeline Catalog</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Access vetted Net-30 and Net-60 vendor accounts, credit builders, and commercial banks with bureau reporting tags.
                </p>
              </div>

              {/* Feature 8 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 hover:shadow-xs transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Zero-SSN Privacy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bank-grade encryption with zero sensitive personal credentials required. No SSN, no bank passwords, no KYC friction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. "YOUR NEXT STEP" DIRECTION SECTION                             */}
        {/* ================================================================= */}
        <section id="route-map" className="py-16 md:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Direction, Not Just Data
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Know Where You Stand. Know What To Do Next.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Most platforms give you a static chart and leave you stranded. Crediqly actively tells you the single most effective action to take right now.
              </p>
            </div>

            {/* Visual Directional Stepper Flow */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-black mx-auto flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Current Position</h4>
                  <p className="text-xs text-slate-500">
                    Audit foundational business records, banking, and registry.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-black mx-auto flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Identify Gaps</h4>
                  <p className="text-xs text-slate-500">
                    Detect missing bureau reporting or operating history limits.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-brand-50/80 border-2 border-brand-500 text-center space-y-2 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-black mx-auto flex items-center justify-center animate-pulse">
                    3
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-950">Take Action</h4>
                  <p className="text-xs text-brand-800 font-medium">
                    Execute high-impact tasks from your recommended queue.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-xs font-black mx-auto flex items-center justify-center">
                    4
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Improve Score</h4>
                  <p className="text-xs text-slate-500">
                    Watch readiness score climb past institutional thresholds.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-black mx-auto flex items-center justify-center">
                    5
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">Unlock Capital</h4>
                  <p className="text-xs text-emerald-800 font-medium">
                    Apply with confidence to pre-matched credit categories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 7. FUNDING OPPORTUNITY & CAPITAL PREPAREDNESS SECTION             */}
        {/* ================================================================= */}
        <section id="funding" className="py-16 md:py-24 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-brand-400 bg-brand-950/80 px-3 py-1 rounded-full border border-brand-800">
                Commercial Capital Discovery
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Your Business May Have More Funding Potential Than You Think.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                By organizing your profile and building verified tradelines, you can prepare for multiple commercial financing categories without personal asset risk.
              </p>
            </div>

            {/* 5 Funding Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Revolving Credit
                </span>
                <h3 className="text-lg font-black text-white">Commercial Lines of Credit</h3>
                <span className="text-xl font-extrabold text-white block">$10,000 – $100,000+</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Flexible working capital with interest paid only on funds drawn. Ideal for inventory, payroll, and seasonal growth.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 bg-brand-950/80 px-2.5 py-0.5 rounded-full border border-brand-800">
                  Vendor Tradelines
                </span>
                <h3 className="text-lg font-black text-white">Net-30 &amp; Net-60 Accounts</h3>
                <span className="text-xl font-extrabold text-white block">$1,000 – $25,000</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Supplier credit terms that report payment promptness directly to D&amp;B and Experian to generate strong bureau ratings.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800">
                  Corporate Cards
                </span>
                <h3 className="text-lg font-black text-white">0% Intro APR Business Cards</h3>
                <span className="text-xl font-extrabold text-white block">$5,000 – $50,000</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unsecured corporate cards offering promotional 0% interest periods for operating expenses and equipment procurement.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800">
                  Expansion Financing
                </span>
                <h3 className="text-lg font-black text-white">Term Loans &amp; Working Capital</h3>
                <span className="text-xl font-extrabold text-white block">$25,000 – $250,000</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Structured term loans with fixed monthly payments for major capital investments, facility expansion, or refinancing.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-slate-600 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
                  Government-Backed
                </span>
                <h3 className="text-lg font-black text-white">SBA 7(a) &amp; Express Loans</h3>
                <span className="text-xl font-extrabold text-white block">$50,000 – $500,000+</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Low-interest, long-term financing guaranteed by the Small Business Administration for established operating companies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-950 to-indigo-950 border border-brand-500/50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-300">
                    Transparent Matching
                  </span>
                  <h3 className="text-lg font-black text-white">Discover Your Potential</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Crediqly categorizes opportunities based on real lender criteria so you only apply when your business is prepared.
                  </p>
                </div>
                <Link href="/signup">
                  <Button className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs">
                    <span>Check Your Readiness Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Non-Lender Educational Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-400 leading-relaxed">
              <p>
                <strong className="text-slate-200">Educational Compliance Disclaimer: </strong>
                Crediqly is an educational and organizational platform, not a direct lender, credit broker, or credit reporting agency. Matches are estimated based on self-reported business parameters and published lender underwriting guidelines. We never guarantee loan approvals, funding amounts, or specific interest rates.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 8. BUSINESS CREDIT SECTION (The Corporate Credit Advantage)       */}
        {/* ================================================================= */}
        <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                    Why Business Credit Matters
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                    Separate Personal Liability. Unlock 10x Higher Credit Limits.
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Too many business owners rely entirely on personal credit cards and personal guarantees to fund business expenses. This restricts capital, increases personal risk, and caps company growth.
                </p>

                <div className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">Independent Commercial Credit Profile:</strong>
                      Build credit under your business EIN with Dun &amp; Bradstreet (Paydex), Experian Commercial (Intelliscore), and Equifax.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">10x to 100x Larger Credit Limits:</strong>
                      Corporate credit limits are typically substantially higher than personal consumer cards, providing genuine operational liquidity.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-slate-900 block font-bold">Protect Your Personal Credit Score:</strong>
                      Keep business utilization and operational expenses off your personal credit report so your personal score remains untarnished.
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/signup">
                    <Button size="md" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 shadow-xs">
                      <span>Start Building Your Credit File Free</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Credit Matrix Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border-2 border-slate-200/90 shadow-sm space-y-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3">
                  Personal vs. Business Credit Comparison
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      Personal Consumer Credit
                    </span>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Tied directly to your SSN. High business balances spike your personal utilization ratio and drag down personal credit scores.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-brand-50/80 border-2 border-brand-400 space-y-1.5 shadow-2xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-900 bg-brand-100 px-2 py-0.5 rounded font-bold">
                      Crediqly Business Credit System
                    </span>
                    <p className="text-slate-700 leading-relaxed font-semibold">
                      Tied to your company EIN. Builds standalone credit ratings that allow your business to qualify on its own merit and financial track record.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 9. HUMAN SUPPORT / SPECIALIST ADVISORY SECTION                    */}
        {/* ================================================================= */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-400/30 text-xs font-black uppercase tracking-wider">
                  <Headphones className="w-3.5 h-3.5 text-brand-300" />
                  <span>Certified Specialist Guidance</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Technology When You Need It. Human Guidance When It Matters.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Start independently with our free platform and automated roadmap. Whenever you need dedicated help, book 1-on-1 strategy sessions with experienced business-credit advisors who review your files before you submit underwriting applications.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Dedicated 1-on-1 Strategy Calls
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Custom Underwriter File Audits
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Concierge Tradeline Setup
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full sm:w-auto">
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-brand-500 hover:bg-brand-400 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md gap-2"
                  >
                    <span>Explore Advisory &amp; Plans</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    variant="outline-white"
                    size="lg"
                    className="w-full sm:w-auto text-xs font-bold px-6 py-3.5 rounded-xl"
                  >
                    <span>Start Free Starter</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 10. SOCIAL PROOF & BANK-GRADE SECURITY ASSURANCE                  */}
        {/* ================================================================= */}
        <section className="py-12 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">256-Bit SSL Encryption</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Bank-grade transport layer security protecting all data in transit.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Stripe Verified Billing</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Secure payment processing with instant 1-click subscription management.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Strict Privacy Policy</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Zero personal passwords or banking credentials ever stored or shared.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Built for U.S. Founders</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Engineered specifically for LLCs, S-Corps, and U.S. small business entities.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 11. INTERACTIVE FAQ SECTION                                       */}
        {/* ================================================================= */}
        <section id="faq" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Everything You Need to Know
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Have questions before getting started? Here are clear, candid answers.
              </p>
            </div>

            {/* Accordion Container */}
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'bg-white border-brand-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-brand-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pricing Link Prompt */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>Have specific questions about Pro tiers or human Advisory?</span>
              <Link href="/pricing" className="font-bold text-brand-700 hover:text-brand-800 hover:underline">
                View Plan Comparison &amp; Pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 12. FINAL HIGH-CONVERTING CTA BANNER                              */}
        {/* ================================================================= */}
        <section className="py-20 md:py-28 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/30 via-indigo-950/40 to-slate-950 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 text-brand-200 border border-brand-400/30 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              <span>Ready to See Where Your Business Stands?</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Start with a clear picture of your business credit and funding readiness today.
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Create your account in under 3 minutes. Complete your basic profile, calculate your baseline score, and receive your personalized &ldquo;What Should I Do Next?&rdquo; roadmap.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-9 py-4 bg-brand-500 hover:bg-brand-400 text-white font-extrabold text-sm rounded-xl shadow-lg gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline-white"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-4 text-sm font-bold rounded-xl"
                >
                  <span>Explore Plans &amp; Pricing</span>
                </Button>
              </Link>
            </div>

            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Free Forever Starter
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Zero Sensitive Data
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                No Credit Card Required
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
