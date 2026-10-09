'use client';

import React from 'react';
import { Star } from 'lucide-react';

/**
 * IMPORTANT DISCLOSURE:
 * These are illustrative testimonials representing typical founder journeys and experiences
 * that business owners may encounter using Crediqly's platform.
 * Individual results will vary based on business profile, creditworthiness, and lender decisions.
 * Crediqly does not guarantee any funding outcome or credit score improvement.
 */

const reviews = [
  {
    name: 'Marcus Vance',
    role: 'Managing Partner',
    company: 'Apex Freight & Logistics LLC',
    location: 'Atlanta, GA',
    initials: 'MV',
    color: 'bg-emerald-600',
    quote: 'From zero corporate file to an 80 Paydex with D&B in 60 days.',
    text: 'We were running the business on personal cards, which was crushing my utilization. Crediqly gave us an exact 4-tier roadmap. Within 60 days we had our Paydex established and were having real conversations with commercial lenders — something I didn\'t think was possible at our stage.',
    outcome: 'Fleet Facility Opened',
  },
  {
    name: 'Elena Rostova',
    role: 'Founder & CEO',
    company: 'Lumina Brand Studio',
    location: 'Austin, TX',
    initials: 'ER',
    color: 'bg-teal-600',
    quote: 'The zero-SSN architecture is why I signed up on day one.',
    text: 'Every other service wanted my Social Security Number and banking passwords. Crediqly diagnosed our commercial filing gaps in 5 minutes and guided us to 3 reporting vendor accounts that seeded our Experian file — all without touching anything personal.',
    outcome: 'Zero Personal Inquiries',
  },
  {
    name: 'David Sterling',
    role: 'Principal Contractor',
    company: 'Sterling Specialty Contracting',
    location: 'Denver, CO',
    initials: 'DS',
    color: 'bg-cyan-600',
    quote: 'The priority engine told us we had a bank account age blocker. Saved us from a denial.',
    text: 'I was ready to apply for a commercial line. Crediqly showed us our business banking was too new. We waited 30 days, completed the document pack, and submitted with confidence. The lender had everything they needed and we were approved on the first try.',
    outcome: 'Commercial Application Approved',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-slate-900 text-white relative overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">Founder Experiences</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Used by founders across the U.S. building corporate credit.
          </h2>
          <p className="text-sm text-slate-500">
            Illustrative experiences. Individual results vary based on business profile and lender decisions.
            Crediqly does not guarantee funding approval or specific credit outcomes.
          </p>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="flex flex-col p-6 sm:p-7 rounded-3xl border border-white/8 bg-slate-950/60 shadow-xl space-y-5 hover:border-white/12 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <div className="space-y-3 flex-1">
                <h4 className="text-base font-semibold text-white leading-snug">
                  &ldquo;{r.quote}&rdquo;
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">{r.text}</p>
              </div>

              {/* Outcome chip */}
              <div className="inline-flex">
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  {r.outcome}
                </span>
              </div>

              {/* Author */}
              <div className="pt-3 border-t border-white/6 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${r.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">{r.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.role} · {r.company}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
