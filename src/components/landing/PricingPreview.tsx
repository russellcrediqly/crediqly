'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const plans = [
  {
    name: 'Free',
    tagline: 'Explore your business funding readiness.',
    price: '$0',
    billing: 'forever',
    badge: null,
    featured: false,
    cta: { label: 'Start Free Account', href: '/signup' },
    features: [
      'Business Profile + Fundability Assessment',
      'Baseline 0–100 Readiness Score',
      'Stage 1 Roadmap Preview',
      'Tier-1 Net-30 Vendor Catalog',
      'Funding Marketplace Preview',
      'Limited Recommendations',
    ],
  },
  {
    name: 'Foundation',
    tagline: 'Build it yourself. Know exactly what to do.',
    price: '$39.99',
    regularPrice: '$49.99',
    billing: '/month',
    badge: 'Most Popular',
    featured: true,
    cta: { label: 'Start Foundation', href: '/signup?plan=foundation' },
    features: [
      'Everything in Free',
      'Full 4-Tier Business Credit Roadmap',
      'All Tier 2 & 3 Tradeline Recommendations',
      'Commercial Banking Directory + Underwriting Criteria',
      'Pre-Qualification Parameter Simulator',
      'Context-Aware AI Mentor',
      'Full Funding Marketplace + 17+ Lender Access',
    ],
  },
  {
    name: 'Guided',
    tagline: 'Build your business credit with expert guidance.',
    price: '$149.99',
    regularPrice: '$199.99',
    billing: '/month',
    badge: null,
    featured: false,
    cta: { label: 'Get Expert Guidance', href: '/signup?plan=guided' },
    features: [
      'Everything in Foundation',
      '1 Monthly Personal Strategy Meeting',
      'Priority Support Access',
      'Guided Credit-Building Strategy',
      'Expert Document Review',
      'Lender Introduction Guidance',
    ],
  },
];

export const PricingPreview: React.FC = () => {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-950/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs font-medium text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Start free. Upgrade when you&apos;re ready to move faster.
          </h2>
          <p className="text-base text-slate-400">
            No credit card required to start. Upgrade or cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-7 sm:p-8 flex flex-col space-y-6 transition-all ${
                plan.featured
                  ? 'border-2 border-brand-500/60 bg-gradient-to-b from-brand-950/30 to-slate-950/80 shadow-2xl shadow-brand-500/10 ring-1 ring-brand-500/10'
                  : 'border border-white/8 bg-white/2 shadow-xl'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan info */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-400">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-4xl font-bold font-mono ${plan.featured ? 'text-brand-300' : 'text-white'}`}>
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">{plan.billing}</span>
                </div>
                {plan.regularPrice && (
                  <p className="text-xs text-slate-600">
                    Regular price{' '}
                    <span className="line-through text-slate-600">{plan.regularPrice}/mo</span>
                    {' '}· Limited time promo
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 pt-1 border-t border-white/6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={plan.cta.href} className="block">
                <Button
                  size="md"
                  className={`w-full py-3 text-sm font-semibold rounded-xl gap-2 ${
                    plan.featured
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20'
                      : 'bg-white/6 hover:bg-white/10 text-white border border-white/8'
                  }`}
                >
                  {plan.cta.label}
                  {plan.featured && <ArrowRight className="w-4 h-4" />}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Intensive upsell — separate, not a fourth plan card */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/8 bg-white/2 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">High-Touch Premium Service</p>
            <h3 className="text-lg font-bold text-white">Funding Readiness Intensive</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Personalized expert help preparing your full funding readiness package — one-time, done with you. Ideal for businesses actively pursuing commercial financing.
            </p>
          </div>
          <div className="space-y-3 shrink-0 text-center sm:text-right">
            <div>
              <span className="text-2xl font-bold text-white">$999</span>
              <span className="text-sm text-slate-500 ml-1.5">one-time</span>
            </div>
            <Link href="/advisory">
              <Button
                size="sm"
                className="bg-white/8 hover:bg-white/12 text-white border border-white/10 font-medium text-sm px-5 py-2.5 rounded-xl whitespace-nowrap"
              >
                Learn About This Service
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 max-w-xl mx-auto">
          Crediqly is not a lender, broker, or credit reporting agency. Plans provide platform access and educational guidance only.
          No funding outcome, credit score, or approval is guaranteed.
        </p>
      </div>
    </section>
  );
};
