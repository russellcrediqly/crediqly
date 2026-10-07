'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CtaBanner: React.FC = () => {
  return (
    <section className="py-24 md:py-36 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      {/* 2027 Cinematic Horizon Flare */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-emerald-500/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-extrabold uppercase tracking-wider text-[10px]">
            Instant Commercial Telemetry
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Start building institutional credit for your business today.
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Create your account in 3 minutes. Complete your basic profile, calculate your authoritative baseline readiness score, and receive your prioritized &ldquo;What Should I Do Next?&rdquo; roadmap.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-black text-sm rounded-2xl shadow-xl gap-2 transform hover:-translate-y-0.5 transition-all"
            >
              <span>Audit Your Business Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/pricing" className="w-full sm:w-auto">
            <Button
              variant="outline-white"
              size="lg"
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold rounded-2xl border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white"
            >
              <span>Explore Plans &amp; Pricing</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Free Forever Starter Tier
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Zero SSN / Personal Credit Inquiries
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            No Credit Card Required
          </span>
        </div>
      </div>
    </section>
  );
};
