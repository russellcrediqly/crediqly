'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Lock,
  Building2,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const FounderVideoSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      {/* 2027 Ambient Glow Behind Video Frame */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-brand-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ============================================================= */}
          {/* LEFT: THE PHONE / VIDEO PLAYER BEZEL FRAME                    */}
          {/* ============================================================= */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group max-w-[340px] sm:max-w-[360px] w-full">
              {/* Refraction Aura */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[44px] blur-xl opacity-30 group-hover:opacity-50 transition duration-700" />

              {/* Hardware Device Bezel Shell */}
              <div className="relative rounded-[40px] bg-slate-900 border-4 border-slate-700/80 shadow-2xl overflow-hidden p-2.5 backdrop-blur-xl">
                {/* Simulated Top Dynamic Island Bar */}
                <div className="flex items-center justify-between px-4 py-1.5 mb-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="font-bold text-white">Crediqly Briefing</span>
                  <div className="w-16 h-3.5 bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-emerald-400 font-bold">HD • 60s</span>
                </div>

                {/* Vertical 9:16 Video Container */}
                <div className="relative w-full aspect-[9/16] rounded-[28px] overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/LM6jhv2Et8I?rel=0&modestbranding=1&playsinline=1"
                    title="Why Business Credit is Important - Crediqly Founder Briefing"
                    className="w-full h-full object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                {/* Bottom Speaker / Status Notch */}
                <div className="pt-2 px-3 pb-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3 h-3 text-brand-400 fill-brand-400" />
                    <span className="font-semibold text-slate-300">Tap to play video</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">
                    60-Sec Primer
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* RIGHT: EDITORIAL CONTEXT & FOUNDER LESSON TAKEAWAYS           */}
          {/* ============================================================= */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                Founder Masterclass • 60-Second Video
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Why business credit is your company&apos;s{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                greatest superpower.
              </span>
            </h2>

            {/* Lead Description */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              In this quick briefing, watch why relying on personal credit cards is a silent trap for entrepreneurs — and how building an EIN credit file changes everything.
            </p>

            {/* 3 Core Video Takeaways */}
            <div className="space-y-4 pt-1 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    1. 100% Protection of Personal Credit
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                    Keep inventory debt, marketing spend, and operational balances strictly off your personal SSN report so your personal FICO score never drops.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    2. 10x to 100x Larger Capital Facilities
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                    Commercial lenders underwrite company revenue and bureau paydex scores, unlocking credit facilities that personal credit cards could never provide.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    3. Standalone Corporate Credit Equity
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                    A seasoned 80+ Paydex business credit profile is an asset that stays with your business, dramatically increasing company enterprise value.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="md"
                  className="w-full sm:w-auto px-7 py-3.5 text-xs font-black bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white rounded-xl shadow-lg gap-2"
                >
                  <span>Start Your Free Credit Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline-white"
                  size="md"
                  className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold rounded-xl border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white"
                >
                  <span>See How Roadmap Works</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
