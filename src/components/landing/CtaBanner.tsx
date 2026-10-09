'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CtaBanner: React.FC = () => {
  return (
    <section className="py-24 md:py-36 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-gradient-to-t from-brand-600/12 to-transparent blur-[80px]" />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-brand-600/6 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
          Get started in 3 minutes
        </p>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
          Start building your business&apos;s{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-teal-300 to-emerald-400">
            funding foundation today.
          </span>
        </h2>

        {/* Subtext */}
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Create your free account, complete your business profile, and receive your authoritative baseline readiness score with a prioritized action plan.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto px-9 py-4 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-xl shadow-brand-600/20 gap-2 transition-all hover:shadow-brand-500/30 hover:-translate-y-0.5"
            >
              Check My Business Fundability
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto px-8 py-4 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl"
            >
              View Plans & Pricing
            </Button>
          </Link>
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          {[
            'Free forever tier',
            'No credit card required',
            'Zero SSN inquiry',
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
