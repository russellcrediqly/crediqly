'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Sliders,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// -------------------------------------------------------------------
// Product Visualization: Funding Readiness Dashboard Preview
// This is clearly presented as a product demonstration.
// -------------------------------------------------------------------

interface ReadinessGaugeProps {
  score: number;
  label: string;
}

const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({ score, label }) => {
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? '#10b981' : score >= 50 ? '#14b8a6' : '#f59e0b';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle
            cx="44"
            cy="44"
            r="38"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="7"
          />
          <circle
            cx="44"
            cy="44"
            r="38"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white leading-none" style={{ color }}>
            {score}
          </span>
          <span className="text-[9px] text-slate-400 font-mono">/100</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium text-center">{label}</span>
    </div>
  );
};

// -------------------------------------------------------------------
// Main Hero Component
// -------------------------------------------------------------------

export const HeroTerminal: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [stagePreset, setStagePreset] = useState<'startup' | 'growth' | 'scale'>('growth');
  const [operatingMonths, setOperatingMonths] = useState<number>(14);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(28000);
  const [tradelinesCount, setTradelinesCount] = useState<number>(3);

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

  const calculated = useMemo(() => {
    let score = 20;
    if (operatingMonths >= 6) score += 10;
    if (operatingMonths >= 12) score += 12;
    if (operatingMonths >= 24) score += 8;
    if (monthlyRevenue >= 10000) score += 12;
    if (monthlyRevenue >= 25000) score += 13;
    if (monthlyRevenue >= 50000) score += 10;
    score += Math.min(tradelinesCount * 7, 35);
    score = Math.min(Math.max(score, 25), 98);

    let paydex = 50;
    let paydexStatus = 'No File';
    if (tradelinesCount >= 1) { paydex = 68; paydexStatus = 'Building'; }
    if (tradelinesCount >= 3) { paydex = 78; paydexStatus = 'Good Standing'; }
    if (tradelinesCount >= 5 && operatingMonths >= 12) { paydex = 80; paydexStatus = 'Prime (Early Pay)'; }

    let minCap = Math.round((monthlyRevenue * 0.8) / 1000) * 1000;
    let maxCap = Math.round((monthlyRevenue * 2.8) / 1000) * 1000;
    if (tradelinesCount >= 4 && operatingMonths >= 18) maxCap = Math.round((monthlyRevenue * 4.5) / 1000) * 1000;
    minCap = Math.max(minCap, 5000);
    maxCap = Math.max(maxCap, 15000);

    let nextAction = 'Open 2 Tier-1 Net-30 vendor accounts to seed your D&B file';
    if (score >= 45 && score < 75) nextAction = 'Maintain 100% on-time payments to target 80+ Paydex benchmark';
    if (score >= 75) nextAction = 'Prepare your 21-point dossier for institutional underwriting review';

    const stageLabel =
      score >= 75 ? 'Funding Ready' : score >= 50 ? 'Bureau Building' : 'Foundation Stage';

    return { score, paydex, paydexStatus, minCap, maxCap, nextAction, stageLabel };
  }, [operatingMonths, monthlyRevenue, tradelinesCount]);

  const signupHref = businessName.trim()
    ? `/signup?company=${encodeURIComponent(businessName.trim())}`
    : '/signup';

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Ambient background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-b from-brand-600/10 via-transparent to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-teal-500/8 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 -right-64 w-[600px] h-[600px] bg-indigo-600/8 blur-[120px] rounded-full" />
      </div>

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">

          {/* ===================== LEFT: COPY & CTA ===================== */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Eyebrow label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              Business Funding Readiness Platform
              <span className="hidden sm:block text-slate-600">·</span>
              <span className="hidden sm:block text-brand-300">Zero SSN Required</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-white tracking-tight leading-[1.1]">
                Know exactly where your business{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-teal-300 to-emerald-400">
                  stands for funding.
                </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
                Crediqly audits your business across 14 deterministic milestones, shows you exactly what lenders look for, and guides you step-by-step toward commercial funding — with zero personal credit exposure.
              </p>
            </div>

            {/* CTA input + button */}
            <div className="max-w-lg mx-auto lg:mx-0 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2.5 px-3.5 flex-1 min-w-0">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your LLC or company name..."
                    className="w-full bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none py-2.5"
                  />
                </div>
                <Link href={signupHref} className="shrink-0">
                  <Button
                    size="md"
                    className="w-full sm:w-auto px-5 py-3 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/25 gap-2 transition-all hover:shadow-brand-500/30 whitespace-nowrap"
                  >
                    Check Fundability Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Trust micro-row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Free forever tier
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Zero SSN inquiry
                </span>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 pt-2 border-t border-white/6">
              {[
                { value: '14', label: 'Milestones', sub: 'Fully deterministic' },
                { value: '80+', label: 'Paydex Target', sub: 'Industry benchmark' },
                { value: '$250k+', label: 'Credit Potential', sub: 'Commercial access' },
              ].map((stat) => (
                <div key={stat.value} className="text-center lg:text-left space-y-0.5">
                  <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs font-medium text-slate-300">{stat.label}</div>
                  <div className="text-[10px] text-slate-600 hidden sm:block">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ===================== RIGHT: INTERACTIVE SIMULATOR ===================== */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-600/20 to-teal-600/20 rounded-[32px] blur-2xl opacity-60 pointer-events-none" />

            <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 bg-white/3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono ml-2">
                    Funding Readiness Simulator · Illustrative Demo
                  </span>
                </div>

                {/* Stage preset switcher */}
                <div className="flex items-center gap-0.5 bg-slate-950/60 p-0.5 rounded-lg text-[11px] font-semibold">
                  {(['startup', 'growth', 'scale'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                        stagePreset === p
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Score + Paydex + Capacity row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Readiness Score Gauge */}
                  <div className="col-span-1 flex items-center justify-center">
                    <ReadinessGauge score={calculated.score} label="Readiness Score" />
                  </div>

                  {/* Paydex */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/6 flex flex-col items-center justify-center text-center space-y-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      D&B Paydex
                    </span>
                    <div className="text-2xl font-bold text-cyan-300 leading-none">
                      {calculated.paydex}
                    </div>
                    <span className="text-[9px] text-slate-400 leading-tight">
                      {calculated.paydexStatus}
                    </span>
                  </div>

                  {/* Capacity */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/6 flex flex-col items-center justify-center text-center space-y-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      Credit Potential
                    </span>
                    <div className="text-sm font-bold text-brand-300 leading-tight">
                      ${(calculated.minCap / 1000).toFixed(0)}k–${(calculated.maxCap / 1000).toFixed(0)}k
                    </div>
                    <span className="text-[9px] text-slate-400">Commercial lines</span>
                  </div>
                </div>

                {/* Sliders */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/6 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <Sliders className="w-3 h-3" />
                    Simulate your business profile
                  </div>

                  {[
                    {
                      label: 'Monthly Revenue',
                      value: `$${monthlyRevenue.toLocaleString()}/mo`,
                      min: 2000, max: 100000, step: 2000,
                      current: monthlyRevenue,
                      onChange: setMonthlyRevenue,
                      color: 'accent-emerald-500',
                    },
                    {
                      label: 'Time in Business',
                      value: `${operatingMonths} months`,
                      min: 1, max: 36, step: 1,
                      current: operatingMonths,
                      onChange: setOperatingMonths,
                      color: 'accent-cyan-500',
                    },
                    {
                      label: 'Reporting Tradelines',
                      value: `${tradelinesCount} accounts`,
                      min: 0, max: 8, step: 1,
                      current: tradelinesCount,
                      onChange: setTradelinesCount,
                      color: 'accent-indigo-500',
                    },
                  ].map((s) => (
                    <div key={s.label} className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{s.label}</span>
                        <span className="font-semibold text-white font-mono">{s.value}</span>
                      </div>
                      <input
                        type="range"
                        min={s.min} max={s.max} step={s.step}
                        value={s.current}
                        onChange={(e) => s.onChange(Number(e.target.value))}
                        className={`w-full h-1 bg-slate-800 rounded-full cursor-pointer ${s.color}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Next action */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 to-slate-950/60 border border-brand-800/40 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-400 bg-brand-950/80 px-2 py-0.5 rounded-full border border-brand-800">
                        {calculated.stageLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-white font-medium">Next: </span>
                      {calculated.nextAction}
                    </p>
                  </div>
                  <Link href={signupHref} className="shrink-0">
                    <button className="flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-white transition-colors whitespace-nowrap">
                      Start Free
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
