'use client';

import React from 'react';
import Link from 'next/link';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const oldWay = [
  {
    title: 'Personal SSN Guarantee',
    desc: 'High business utilization drags your consumer credit score down 40–80 points, damaging your ability to qualify for mortgages, auto loans, and personal financing.',
  },
  {
    title: 'Blind Underwriting Denials',
    desc: 'Applying without reviewing your commercial bureau file leads to mysterious rejections and wasted hard inquiries — with no explanation from lenders.',
  },
  {
    title: 'Personal Card Limits Cap Growth',
    desc: 'Personal cards max at $5,000–$15,000, severely choking cash flow during inventory builds, seasonal cycles, and expansion opportunities.',
  },
  {
    title: 'Personal Asset Exposure',
    desc: 'When your business hits a rough patch, personal guarantees keep your home, savings, and family finances directly on the hook.',
  },
];

const crediqlyWay = [
  {
    title: '100% EIN Corporate Profile',
    desc: 'Credit is tied to your business tax ID and reported to D&B, Experian Commercial, and Equifax — completely separate from your personal file.',
  },
  {
    title: '14 Deterministic Milestones',
    desc: 'Know your exact 0–100 Readiness Score and fix underwriting gaps before lenders ever run your file. No surprises.',
  },
  {
    title: '$50k – $250k+ in Commercial Credit',
    desc: 'Revolving lines, vendor terms, and non-dilutive credit at 10x higher limits than consumer cards — without personal credit exposure.',
  },
  {
    title: 'Zero Personal Liability Protection',
    desc: 'Keep company liabilities strictly inside your corporate entity. Your personal credit score stays healthy regardless of business activity.',
  },
];

export const ComparisonSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Why Most Founders Get Denied</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Stop risking personal credit. Build institutional power.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Relying on personal credit cards to fund business expenses caps your growth, damages your score, and puts your personal assets at risk.
          </p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Old Way */}
          <div className="rounded-3xl border border-rose-950/50 bg-rose-950/10 p-7 sm:p-9 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-full">
                  The Old Way
                </span>
                <h3 className="text-lg font-bold text-white mt-2">The Blind Guessing Trap</h3>
              </div>
              <XCircle className="w-7 h-7 text-rose-500/60 shrink-0" />
            </div>
            <ul className="space-y-5">
              {oldWay.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-white block">{item.title}</span>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Crediqly Way */}
          <div className="rounded-3xl border-2 border-brand-500/40 bg-gradient-to-b from-brand-950/20 to-slate-950/60 p-7 sm:p-9 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  The Crediqly System
                </span>
                <h3 className="text-lg font-bold text-white mt-2">Standalone Corporate Credit</h3>
              </div>
              <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
            </div>
            <ul className="space-y-5">
              {crediqlyWay.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-white block">{item.title}</span>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link href="/signup">
                <Button
                  size="md"
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-3 rounded-xl shadow-md gap-2"
                >
                  Start Your Protected EIN Profile
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
