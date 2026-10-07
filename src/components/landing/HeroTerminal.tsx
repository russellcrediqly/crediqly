'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  Building2,
  DollarSign,
  CreditCard,
  Sliders,
  ChevronRight,
  Zap,
  BarChart3,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const HeroTerminal: React.FC = () => {
  // Quick audit business name input
  const [businessName, setBusinessName] = useState('');

  // Interactive Simulator Parameters
  const [stagePreset, setStagePreset] = useState<'startup' | 'growth' | 'scale'>('growth');
  const [operatingMonths, setOperatingMonths] = useState<number>(14);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(28000);
  const [tradelinesCount, setTradelinesCount] = useState<number>(3);

  // Quick Preset Handler
  const applyPreset = (preset: 'startup' | 'growth' | 'scale') => {
    setStagePreset(preset);
    if (preset === 'startup') {
      setOperatingMonths(4);
      setMonthlyRevenue(6000);
      setTradelinesCount(1);
    } else if (preset === 'growth') {
      setOperatingMonths(14);
      setMonthlyRevenue(28000);
      setTradelinesCount(3);
    } else {
      setOperatingMonths(30);
      setMonthlyRevenue(75000);
      setTradelinesCount(6);
    }
  };

  // Dynamic Calculated Metrics
  const calculated = useMemo(() => {
    // 0-100 Score calculation
    let score = 20; // baseline for LLC formation
    if (operatingMonths >= 6) score += 10;
    if (operatingMonths >= 12) score += 12;
    if (operatingMonths >= 24) score += 8;

    if (monthlyRevenue >= 10000) score += 12;
    if (monthlyRevenue >= 25000) score += 13;
    if (monthlyRevenue >= 50000) score += 10;

    score += Math.min(tradelinesCount * 7, 35);
    score = Math.min(Math.max(score, 25), 98);

    // Paydex & Bureau Simulation
    let paydex = 50;
    let paydexStatus = 'Developing File';
    if (tradelinesCount >= 1) {
      paydex = 68;
      paydexStatus = 'Building';
    }
    if (tradelinesCount >= 3) {
      paydex = 78;
      paydexStatus = 'Good (Prompt)';
    }
    if (tradelinesCount >= 5 && operatingMonths >= 12) {
      paydex = 80;
      paydexStatus = 'Tier 1 Prime (Early Pay)';
    }

    // Capital Range
    let minCap = Math.round((monthlyRevenue * 0.8) / 1000) * 1000;
    let maxCap = Math.round((monthlyRevenue * 2.8) / 1000) * 1000;
    if (tradelinesCount >= 4 && operatingMonths >= 18) {
      maxCap = Math.round((monthlyRevenue * 4.5) / 1000) * 1000;
    }
    minCap = Math.max(minCap, 5000);
    maxCap = Math.max(maxCap, 15000);

    // Matched Top Product
    let topProduct = 'Tier-1 Net-30 Vendor Accounts';
    let topCategory = 'Starter Bureau Seeding';
    let nextStep = 'Open 2nd Net-30 tradeline to establish Paydex score';
    let rate = 'Net-30 Terms • 0% Interest';

    if (score >= 45 && score < 75) {
      topProduct = '0% Intro APR Corporate Credit Card';
      topCategory = 'Revolving Commercial Credit';
      nextStep = 'Maintain 100% on-time trade payments to break into 80+ Paydex';
      rate = '0% APR for 12 mos • No PG Available';
    } else if (score >= 75) {
      topProduct = 'Unsecured Business Line of Credit';
      topCategory = 'Institutional Commercial Capital';
      nextStep = 'Generate bank-ready Readiness Dossier for institutional underwriting';
      rate = 'Prime + 1.5% • Draw On Demand';
    }

    return { score, paydex, paydexStatus, minCap, maxCap, topProduct, topCategory, nextStep, rate };
  }, [operatingMonths, monthlyRevenue, tradelinesCount]);

  const signupHref = businessName.trim()
    ? `/signup?company=${encodeURIComponent(businessName.trim())}`
    : '/signup';

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-slate-950 text-white selection:bg-brand-500 selection:text-white">
      {/* 2027 Ambient Light Matrix */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-tr from-brand-600/15 via-teal-500/10 to-indigo-600/15 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-brand-500/10 blur-[90px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-indigo-500/10 blur-[100px] pointer-events-none -z-10 rounded-full" />

      {/* Subtle Grid Canvas overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ============================================================= */}
          {/* LEFT COLUMN: HERO VALUE PROPOSITION & DIRECT AUDIT TRIGGER    */}
          {/* ============================================================= */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* 2027 Live Telemetry Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-inner text-xs font-semibold text-slate-300 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-400">
                Live Intelligence v3.8
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">D&amp;B • Experian • Equifax</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden sm:inline text-brand-300 font-bold">Zero SSN Required</span>
            </div>

            {/* Magnetic H1 Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              The Operating System for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Business Credit &amp; Capital.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Build an 80+ Paydex score under your company EIN. Eliminate lender underwriting blind spots,
              track 14 deterministic milestones, and unlock <strong className="text-white font-semibold">$50,000 to $500,000+</strong> in commercial financing — with zero personal credit liability.
            </p>

            {/* Interactive Fast-Audit Search Bar */}
            <div className="pt-2 max-w-xl mx-auto lg:mx-0">
              <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 w-full">
                  <Building2 className="w-4 h-4 text-brand-400 shrink-0" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your LLC or Company Name..."
                    className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
                <Link href={signupHref} className="w-full sm:w-auto shrink-0">
                  <Button
                    size="md"
                    className="w-full sm:w-auto px-6 py-3 text-xs font-extrabold bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white rounded-xl shadow-lg gap-2 whitespace-nowrap transition-transform hover:scale-[1.02]"
                  >
                    <span>Check Fundability Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Trust Micro-Row */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  100% Free Forever Tier
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  No Credit Card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Zero Personal Credit Pulls
                </span>
              </div>
            </div>

            {/* Live Telemetry Counter Strip */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Readiness Logic</span>
                <span className="text-base sm:text-lg font-black text-white">14 Milestones</span>
                <span className="text-[10px] text-emerald-400 block font-medium">100% Deterministic</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Credit Profile</span>
                <span className="text-base sm:text-lg font-black text-white">EIN Only</span>
                <span className="text-[10px] text-brand-400 block font-medium">No SSN Inquiry</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Lender Spectrum</span>
                <span className="text-base sm:text-lg font-black text-white">17+ Programs</span>
                <span className="text-[10px] text-teal-300 block font-medium">Lines, SBA &amp; Grants</span>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMN: THE 2027 INTERACTIVE CAPITAL COCKPIT            */}
          {/* ============================================================= */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden p-5 sm:p-6 space-y-5">
              {/* Terminal Window Header Bar */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 ml-2">
                    <Zap className="w-3.5 h-3.5 text-brand-400" />
                    interactive-underwriting-engine.sim
                  </span>
                </div>

                {/* Preset Stage Switchers */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => applyPreset('startup')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      stagePreset === 'startup'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Startup
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('growth')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      stagePreset === 'growth'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Growth
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('scale')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      stagePreset === 'scale'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Scale
                  </button>
                </div>
              </div>

              {/* Real-Time Telemetry Gauges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gauge 1: Funding Readiness Score */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1 relative group">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Readiness Score
                  </span>
                  <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
                    <span className="text-emerald-400">{calculated.score}</span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                    {calculated.score >= 75 ? 'Funding Ready' : calculated.score >= 50 ? 'Stage 3 Build' : 'Stage 1 Foundation'}
                  </span>
                </div>

                {/* Gauge 2: Simulated Paydex Rating */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    D&amp;B Paydex Rating
                  </span>
                  <div className="text-3xl font-black text-cyan-300 font-mono tracking-tight">
                    {calculated.paydex}
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">
                    {calculated.paydexStatus}
                  </span>
                </div>

                {/* Gauge 3: Capital Borrowing Capacity */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Eligible Credit Capacity
                  </span>
                  <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight text-brand-300">
                    ${(calculated.minCap / 1000).toFixed(0)}k – ${(calculated.maxCap / 1000).toFixed(0)}k
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Revolving &amp; Lines
                  </span>
                </div>
              </div>

              {/* Interactive Parameter Tuning Sliders */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-brand-400" />
                    Simulate Your Business Profile
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Dynamic Calibration</span>
                </div>

                {/* Slider 1: Monthly Revenue */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Monthly Gross Deposits:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${monthlyRevenue.toLocaleString()} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="100000"
                    step="2000"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Slider 2: Business Operating Age */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Time In Business (Entity Age):</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {operatingMonths} Months ({operatingMonths >= 24 ? '2+ Years' : operatingMonths >= 12 ? '1 Year' : '< 1 Year'})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="36"
                    step="1"
                    value={operatingMonths}
                    onChange={(e) => setOperatingMonths(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Slider 3: Reporting Tradelines */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Active Reporting Tradelines:</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {tradelinesCount} {tradelinesCount === 1 ? 'Trade Account' : 'Trade Accounts'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={tradelinesCount}
                    onChange={(e) => setTradelinesCount(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Matched Capital Preview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      Live Top Match
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{calculated.rate}</span>
                  </div>
                  <h4 className="text-sm font-black text-white tracking-tight">
                    {calculated.topProduct}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    🎯 Next move: {calculated.nextStep}
                  </p>
                </div>

                <Link href={signupHref} className="w-full sm:w-auto shrink-0">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs gap-1.5"
                  >
                    <span>Unlock Live File</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
