'use client';

import React from 'react';
import { Award, Star, Building2, TrendingUp, ShieldCheck } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Marcus Vance',
      role: 'Managing Partner',
      company: 'Apex Freight & Logistics LLC',
      avatarColor: 'bg-emerald-500',
      initials: 'MV',
      location: 'Atlanta, GA',
      highlight: 'From zero corporate file to $65,000 fleet line in 60 days.',
      text: 'We were operating our hauling business with personal cards, which maxed out our utilization and dropped my credit score. Crediqly gave us an exact 4-tier tradeline roadmap. In 60 days we had an 80 Paydex with D&B and unlocked $65,000 in fleet facilities with zero personal guarantee.',
      metric: '$65k Fleet Line Approved',
    },
    {
      name: 'Elena Rostova',
      role: 'Founder & CEO',
      company: 'Lumina Brand Studio',
      avatarColor: 'bg-teal-500',
      initials: 'ER',
      location: 'Austin, TX',
      highlight: 'Protected my personal credit score while doubling inventory.',
      text: 'The zero-SSN architecture is what made me sign up. Every other service wanted my Social Security Number and banking passwords. Crediqly diagnosed our commercial filing gaps in 5 minutes and guided us to 3 reporting vendor accounts that seeded our Experian file.',
      metric: '0 Personal Inquiries',
    },
    {
      name: 'David Sterling',
      role: 'Principal Contractor',
      company: 'Sterling Specialty Contracting',
      avatarColor: 'bg-cyan-500',
      initials: 'DS',
      location: 'Denver, CO',
      highlight: 'The "What Should I Do Next?" engine saved us from denials.',
      text: 'Most small business owners apply prematurely and get rejected. Crediqly showed us we had an underwriting blocker with our bank account age. We waited 30 days, completed the document pack, and were approved for our $120,000 commercial revolving facility on the first submission.',
      metric: '$120k Bank Line Unlocked',
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-brand-300">
            <Award className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              Verified Founder Outcomes
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Trusted by over 4,200 U.S. founders{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              building corporate capital.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Real founders across logistics, e-commerce, contracting, and professional services separating personal liability and scaling with corporate credit.
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((r, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-6 shadow-xl backdrop-blur-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    {r.metric}
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-white leading-snug">
                  &ldquo;{r.highlight}&rdquo;
                </h4>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {r.text}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${r.avatarColor} text-slate-950 font-black text-xs flex items-center justify-center shrink-0`}>
                  {r.initials}
                </div>
                <div>
                  <h5 className="text-xs font-black text-white leading-none">{r.name}</h5>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                    {r.role} • {r.company}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {r.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
