'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Lock, TrendingUp, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const takeaways = [
  {
    icon: Lock,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Protect your personal credit',
    desc: 'Keep business balances off your SSN report. Your personal FICO score stays clean regardless of how you fund operations.',
  },
  {
    icon: TrendingUp,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    title: 'Access 10x larger facilities',
    desc: 'Commercial lenders underwrite your EIN and Paydex score — unlocking revolving lines that consumer credit never could.',
  },
  {
    icon: Building2,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    title: 'Build lasting corporate equity',
    desc: 'A seasoned 80+ Paydex file is a business asset. It compounds over time and dramatically increases your company\'s borrowing power.',
  },
];

export const FounderVideoSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      {/* Ambient */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/8 blur-[110px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">

          {/* Left: Video frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-[300px]">
              {/* Glow */}
              <div className="absolute -inset-2 bg-gradient-to-br from-brand-500/30 to-teal-500/20 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Device */}
              <div className="relative rounded-[36px] bg-slate-900 border border-white/10 shadow-2xl overflow-hidden p-2">
                {/* Notch bar */}
                <div className="flex items-center justify-between px-4 py-2 text-[10px] text-slate-500 font-mono">
                  <span className="text-slate-300 font-medium">Crediqly Briefing</span>
                  <div className="w-14 h-3 bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-emerald-400 font-semibold">60s</span>
                </div>

                {/* 9:16 Video */}
                <div className="relative w-full aspect-[9/16] rounded-[26px] overflow-hidden bg-slate-950">
                  <iframe
                    src="https://www.youtube-nocookie.com/embed/LM6jhv2Et8I?rel=0&modestbranding=1&playsinline=1"
                    title="Why Business Credit Is Important — Crediqly Briefing"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Bottom bar */}
                <div className="pt-1.5 px-3 pb-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-2.5 h-2.5 fill-brand-400 text-brand-400" />
                    <span>Tap to play</span>
                  </span>
                  <span className="text-emerald-400 font-mono font-semibold">60-Sec Primer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                Founder Masterclass
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.12]">
                Why business credit is your company&apos;s most underutilized asset.
              </h2>
              <p className="text-base sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                In 60 seconds, understand why personal credit cards silently limit your growth — and how building a corporate credit file changes everything.
              </p>
            </div>

            {/* Takeaways */}
            <div className="space-y-3 max-w-lg mx-auto lg:mx-0">
              {takeaways.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.title}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/3 border border-white/6 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${t.bg}`}>
                      <Icon className={`w-4 h-4 ${t.color}`} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-white">{t.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link href="/signup">
                <Button
                  size="md"
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md gap-2"
                >
                  Start Your Free Journey
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full sm:w-auto px-6 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
                >
                  See How the Roadmap Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
