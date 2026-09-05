'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Zap,
  HelpCircle,
  Briefcase,
  CheckCircle2,
  Headphones,
  AlertCircle,
  X,
  Lock,
  CreditCard,
  Building,
  Target,
  FileText,
  Clock,
  Minus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

export default function PricingPage() {
  const { user } = useAuth();
  const { isPro, isAdvisory, upgradeToPro, upgradeToAdvisory, openCustomerPortal } = useSubscription();
  const [canceledNotice, setCanceledNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('canceled') === 'true') {
        setCanceledNotice(true);
      }
    }
  }, []);

  const featureComparison = [
    {
      feature: '21-Point Business Profile Compliance Audit',
      free: true,
      pro: true,
      advisory: true,
      category: 'Foundation',
    },
    {
      feature: 'Funding Readiness Score & Factor Analysis',
      free: 'Basic (3 Factors)',
      pro: 'Full (6 Factors + Gaps)',
      advisory: 'Full + Advisor Review',
      category: 'Foundation',
    },
    {
      feature: 'Interactive Business Credit Roadmap',
      free: 'Tier 1 Foundational Only',
      pro: 'Complete 4-Tier Interactive',
      advisory: 'Complete 4-Tier + Custom Plan',
      category: 'Roadmap & Credit',
    },
    {
      feature: 'Vendor Tradelines & Net-30 Catalogs',
      free: 'Starter (3 Vendors)',
      pro: 'Full Catalog (Tiers 1, 2, 3)',
      advisory: 'Full Catalog + Tailored Recommendations',
      category: 'Roadmap & Credit',
    },
    {
      feature: 'Commercial Banks Directory & Criteria',
      free: false,
      pro: true,
      advisory: true,
      category: 'Roadmap & Credit',
    },
    {
      feature: 'Personalized Funding Matches Engine',
      free: 'Basic Category Previews',
      pro: 'Full Opportunity Matches',
      advisory: 'Full Matches + Application Prep',
      category: 'Funding Intelligence',
    },
    {
      feature: 'Funding Application Tracker',
      free: true,
      pro: true,
      advisory: true,
      category: 'Funding Intelligence',
    },
    {
      feature: 'Crediqly AI Mentor Access',
      free: false,
      pro: true,
      advisory: true,
      category: 'Guidance & Support',
    },
    {
      feature: '1-on-1 Milestone Strategy Reviews',
      free: false,
      pro: false,
      advisory: true,
      category: 'Guidance & Support',
    },
    {
      feature: 'Concierge Application Document Preparation',
      free: false,
      pro: false,
      advisory: true,
      category: 'Guidance & Support',
    },
  ];

  const competitorComparison = [
    {
      feature: 'Business Credit Guidance',
      ourPlatform: '✓',
      creditSuite: '✓',
      fundAndGrow: '✓',
      note: 'Step-by-step guidance on entity compliance & credit tier separation',
    },
    {
      feature: 'Funding Readiness',
      ourPlatform: '✓',
      creditSuite: '✓',
      fundAndGrow: '✓',
      note: 'Underwriting diagnostics & objective factor gap analysis',
    },
    {
      feature: 'Funding Opportunities',
      ourPlatform: '✓',
      creditSuite: '✓',
      fundAndGrow: '✓',
      note: 'Commercial lender directories & matched capital options',
    },
    {
      feature: 'Business Credit Building',
      ourPlatform: '✓',
      creditSuite: '✓',
      fundAndGrow: '✓',
      note: 'Bureau-reporting tradeline setup under company EIN',
    },
    {
      feature: 'Personalized Roadmap',
      ourPlatform: '✓',
      creditSuite: '✓',
      fundAndGrow: '✓',
      note: 'Milestone checkpoints customized to your business profile',
    },
    {
      feature: 'AI/Platform Guidance',
      ourPlatform: '✓',
      creditSuite: '—',
      fundAndGrow: '—',
      note: '24/7 data-aware automated AI Mentor & factor explanations',
      highlight: true,
    },
    {
      feature: 'Human Support',
      ourPlatform: 'Available',
      creditSuite: '✓',
      fundAndGrow: '✓',
      note: 'Flexible 1-on-1 Certified Specialist Advisory without forced retainer',
    },
  ];

  const ourPlanSpectrum = [
    {
      name: 'Free',
      price: '$0',
      cadence: 'forever',
      description: '21-Point compliance audit & baseline readiness scorecard',
      tag: 'Starter',
      badgeClass: 'bg-white/10 text-slate-200 border-white/20',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$39',
      cadence: '/mo',
      description: 'Complete 4-tier interactive roadmap, tradelines & AI mentor',
      tag: 'Most Popular',
      badgeClass: 'bg-brand-500 text-white border-brand-400',
      highlight: true,
    },
    {
      name: 'Guided',
      price: '$99',
      cadence: '/mo',
      description: 'Priority milestones & structured credit-building acceleration',
      tag: 'Guided',
      badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
      highlight: false,
    },
    {
      name: 'Advisory',
      price: '$149',
      cadence: '/mo',
      subtext: '+ setup fee',
      description: 'Dedicated 1-on-1 strategy call & custom readiness preparation',
      tag: '1-on-1 Advisory',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      highlight: false,
    },
    {
      name: 'Concierge',
      price: '$299',
      cadence: '/mo',
      description: 'White-glove application document prep & continuous liaison',
      tag: 'VIP Concierge',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Crediqly
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="text-xs font-bold text-slate-800 hover:text-slate-900 border-slate-300">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-700 hover:text-slate-900">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Canceled Notice Banner */}
      {canceledNotice && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-amber-950">Checkout Canceled</h4>
                <p className="text-amber-800 leading-relaxed">
                  Checkout was not completed. No charges were made. You can upgrade anytime.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCanceledNotice(false)}
              className="text-amber-600 hover:text-amber-900 p-1"
              aria-label="Close notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Pricing Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Transparent, High-Value Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Choose the level of guidance your business needs.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Start free with foundational compliance audits, build your commercial credit profile with DIY Pro, or get dedicated 1-on-1 advisory support.
          </p>

          {/* Trust Highlights Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit Bank-Grade Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-brand-600" />
              <span>Stripe Verified Checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cancel Anytime in 1 Click</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Zero Credit Score Impact</span>
            </div>
          </div>
        </div>

        {/* 3 Choices Grid: Free, Pro, Premium Advisory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* 1. FREE PLAN */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-3xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Free Starter</h3>
                    <Badge variant="neutral" className="text-xs uppercase font-extrabold px-2.5 py-0.5">
                      Starter
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-bold">
                    Build your compliance foundation
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Audit your commercial entity standing and discover your core readiness areas.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-black text-slate-900">$0</span>
                  <span className="text-xs font-bold text-slate-400">/ month forever</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>21-Point Compliance Audit</strong> (EIN, SOS, banking check)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Basic Readiness Scorecard</strong> (Profile &amp; entity age)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Tier 1 Milestone Tasks</strong> to establish commercial presence</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Funding Application Tracker</strong> (log provider submissions)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Zero credit card required to start</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {user ? (
                  <Link href="/dashboard" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold text-slate-800 hover:text-slate-900 hover:bg-slate-50 border-slate-300"
                    >
                      {isAdvisory ? 'Included in Advisory' : isPro ? 'Included in Pro' : 'Current Active Plan'}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold text-slate-800 hover:text-slate-900 hover:bg-slate-50 border-slate-300"
                    >
                      Get Started Free
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. PRO PLAN ($39/mo) — RECOMMENDED / HIGHLIGHTED */}
          <Card className="border-2 border-brand-500 bg-white shadow-xl rounded-3xl relative flex flex-col justify-between overflow-hidden ring-4 ring-brand-500/15 transform lg:-translate-y-2 transition-transform">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest shadow-xs">
              ⚡ Most Popular — Recommended
            </div>
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Crediqly Pro</h3>
                    <Badge variant="info" className="text-xs uppercase font-extrabold px-2.5 py-0.5">
                      DIY Roadmap
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-brand-700 leading-relaxed font-bold">
                    Complete DIY Roadmap &amp; Tradeline Engine
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Stop guessing what to do next. Unlock your complete 4-tier interactive roadmap and verified tradeline catalog.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-black text-slate-900">$39</span>
                  <span className="text-xs font-bold text-slate-400">/ month</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Everything in Free</strong>, plus:</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Complete 4-Tier Interactive Roadmap</strong> with all milestone checklists</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Full Tradeline Catalog</strong>: Net-30 vendor accounts &amp; Tier 2/3 cards</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Commercial Banks Directory</strong> with criteria &amp; fee comparisons</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Crediqly AI Mentor</strong>: Data-aware roadmap &amp; funding explanations</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Personalized Funding Matches</strong> tailored to real data</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                {isAdvisory ? (
                  <Button
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-brand-300 text-brand-800 bg-brand-50 hover:bg-brand-100"
                  >
                    Included in Advisory
                  </Button>
                ) : isPro ? (
                  <Button
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-brand-300 text-brand-800 bg-brand-50 hover:bg-brand-100"
                  >
                    Manage Subscription
                  </Button>
                ) : user ? (
                  <Button
                    variant="primary"
                    onClick={upgradeToPro}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                  >
                    <span>Upgrade to Pro — $39/mo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href="/signup" className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                    >
                      <span>Start Pro — $39/mo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-[11px] text-slate-500 text-center block">
                  Billed monthly. Cancel anytime in 1-click customer portal.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. PREMIUM ADVISORY ($499 setup + $149/mo) */}
          <Card className="border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white shadow-xl rounded-3xl flex flex-col justify-between overflow-hidden">
            <div className="bg-indigo-900/60 text-indigo-200 text-center py-2 text-xs font-black uppercase tracking-widest border-b border-white/10">
              VIP Concierge Guidance
            </div>
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white">Premium Advisory</h3>
                    <Badge variant="info" className="text-xs uppercase font-extrabold bg-indigo-500/30 text-indigo-300 border-indigo-400/40">
                      1-on-1 Guidance
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-bold">
                    Hands-on credit builder advisory
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Personalized strategy sessions and dedicated guidance for growing businesses.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-black text-white">$499</span>
                  <span className="text-xs font-bold text-slate-300">setup + $149/mo</span>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Everything in Pro included</strong> with premium priority</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>1-on-1 Onboarding Strategy Call</strong> with dedicated specialist</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Custom funding-readiness preparation</strong> &amp; application audit</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Ongoing milestone progress reviews</strong> &amp; next-step identification</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Responsible support: realistic preparation with zero false approval promises</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                {isAdvisory ? (
                  <Button
                    variant="outline-white"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-indigo-400/50 text-white bg-indigo-950/80 hover:bg-indigo-900"
                  >
                    Active Advisory Retainer
                  </Button>
                ) : user ? (
                  <Button
                    variant="primary"
                    onClick={upgradeToAdvisory}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                  >
                    <span>Join Premium Advisory — $499 + $149/mo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href="/signup" className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                    >
                      <span>Join Premium Advisory — $499 + $149/mo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-[11px] text-slate-400 text-center block">
                  Billed monthly + setup fee. Cancel anytime in customer portal.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COMPETITOR VALUE COMPARISON */}
        <section className="space-y-10 pt-4" aria-label="Competitor Value Comparison">
          {/* Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exceptional Market Value</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Powerful Business Credit &amp; Funding Support — Without the High Price Tag
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              See how our approach gives business owners access to powerful credit-building, funding-readiness, guidance, and funding-discovery tools at a much more accessible price.
            </p>
          </div>

          {/* Comparison Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-slate-700 w-[34%]">
                      Capability / Dimension
                    </th>
                    {/* Our Platform Highlighted Column */}
                    <th className="p-4 sm:p-5 text-center w-[22%] bg-brand-50/70 border-x-2 border-brand-500/40 relative">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white shadow-2xs">
                        <span>Our Platform</span>
                      </div>
                      <div className="font-black text-slate-900 text-sm sm:text-base">Crediqly</div>
                      <div className="text-[11px] font-bold text-brand-700">Modern &amp; Accessible</div>
                    </th>
                    {/* CreditSuite */}
                    <th className="p-4 sm:p-5 text-center w-[22%] bg-slate-50/50">
                      <div className="font-black text-slate-900 text-sm sm:text-base">CreditSuite</div>
                      <div className="text-[11px] text-slate-500 font-medium">Fundability System</div>
                      <div className="text-xs font-black text-slate-700 mt-0.5">$497/month</div>
                    </th>
                    {/* Fund&Grow */}
                    <th className="p-4 sm:p-5 text-center w-[22%] bg-slate-50/50">
                      <div className="font-black text-slate-900 text-sm sm:text-base">Fund&amp;Grow</div>
                      <div className="text-[11px] text-slate-500 font-medium">Elite Membership</div>
                      <div className="text-xs font-black text-slate-700 mt-0.5">$3,997/year</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {competitorComparison.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        row.highlight ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-4 sm:p-5 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{row.feature}</span>
                          {row.highlight && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                              Exclusive
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                          {row.note}
                        </span>
                      </td>

                      {/* Our Platform Cell */}
                      <td className="p-4 sm:p-5 text-center bg-brand-50/40 border-x-2 border-brand-500/30">
                        {row.ourPlatform === '✓' ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm shadow-2xs">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : row.ourPlatform === 'Available' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-brand-100 text-brand-800 border border-brand-200">
                            Available
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>

                      {/* CreditSuite Cell */}
                      <td className="p-4 sm:p-5 text-center text-slate-700 font-medium">
                        {row.creditSuite === '✓' ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold text-base">—</span>
                        )}
                      </td>

                      {/* Fund&Grow Cell */}
                      <td className="p-4 sm:p-5 text-center text-slate-700 font-medium">
                        {row.fundAndGrow === '✓' ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold text-base">—</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Starting Price Row */}
                  <tr className="bg-slate-50/90 font-black border-t-2 border-slate-200">
                    <td className="p-4 sm:p-5 text-slate-900">
                      <div className="font-black text-sm sm:text-base">Starting Price</div>
                      <div className="text-[11px] font-medium text-slate-500">
                        Total cost of baseline entry for business owners
                      </div>
                    </td>

                    {/* Our Platform Price */}
                    <td className="p-4 sm:p-5 text-center bg-brand-50/80 border-x-2 border-brand-500/40">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-lg sm:text-xl font-black text-brand-700 tracking-tight">
                          From $39/mo
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                          $0 Free Starter Available
                        </span>
                      </div>
                    </td>

                    {/* CreditSuite Price */}
                    <td className="p-4 sm:p-5 text-center text-slate-800">
                      <div className="text-base sm:text-lg font-black text-slate-900">$497/mo</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">Fundability System</div>
                    </td>

                    {/* Fund&Grow Price */}
                    <td className="p-4 sm:p-5 text-center text-slate-800">
                      <div className="text-base sm:text-lg font-black text-slate-900">$3,997/year</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">Elite Membership (12 mo)</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* STRONG VISUAL CALLOUT: Plans Spectrum */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 lg:p-10 border border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-2 max-w-3xl mx-auto">
              <span className="text-[11px] font-black uppercase tracking-widest text-brand-300 bg-brand-500/20 px-3 py-1 rounded-full border border-brand-400/30">
                Accessible Stepping Stones
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                Get started from $0. Upgrade to powerful tools and human guidance when you need it.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Rather than forcing thousands in upfront fees or lock-in contracts, Crediqly lets you start free and advance on your schedule.
              </p>
            </div>

            {/* Plan Spectrum Grid */}
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Our Plans
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
                {ourPlanSpectrum.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all relative ${
                      plan.highlight
                        ? 'bg-gradient-to-b from-brand-600 via-brand-700 to-indigo-700 text-white border-2 border-brand-300 shadow-xl shadow-brand-500/20 ring-2 ring-brand-400/30 transform lg:-translate-y-1'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-black text-white tracking-tight">
                          {plan.name}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${plan.badgeClass}`}>
                          {plan.tag}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 my-3">
                        <span className="text-3xl font-black text-white tracking-tight">
                          {plan.price}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {plan.cadence}
                        </span>
                      </div>
                      {plan.subtext && (
                        <span className="text-[10px] text-slate-400 -mt-2 block mb-2 font-medium">
                          {plan.subtext}
                        </span>
                      )}

                      <p className="text-xs text-slate-300/90 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      {plan.name === 'Free' ? (
                        user ? (
                          <Link href="/dashboard" className="block w-full text-center py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all">
                            Current Active Plan
                          </Link>
                        ) : (
                          <Link href="/signup" className="block w-full text-center py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all">
                            Start Free →
                          </Link>
                        )
                      ) : plan.name === 'Pro' ? (
                        user ? (
                          <button
                            onClick={upgradeToPro}
                            className="block w-full text-center py-2 px-3 rounded-xl bg-white text-brand-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all"
                          >
                            Upgrade Pro →
                          </button>
                        ) : (
                          <Link href="/signup" className="block w-full text-center py-2 px-3 rounded-xl bg-white text-brand-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all">
                            Start Pro →
                          </Link>
                        )
                      ) : plan.name === 'Advisory' ? (
                        user ? (
                          <button
                            onClick={upgradeToAdvisory}
                            className="block w-full text-center py-2 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-sm transition-all"
                          >
                            Join Advisory →
                          </button>
                        ) : (
                          <Link href="/signup" className="block w-full text-center py-2 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-sm transition-all">
                            Join Advisory →
                          </Link>
                        )
                      ) : (
                        <div className="py-2 px-3 rounded-xl bg-white/5 text-center text-xs font-bold text-slate-300 border border-white/10">
                          {plan.name} Pathway
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transparent Comparison Disclaimer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border border-slate-200 text-center max-w-4xl mx-auto shadow-2xs">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Competitor pricing and features are based on publicly available information and may change. Comparisons are for informational purposes only. Funding approval is subject to individual lender requirements and is never guaranteed.
            </p>
          </div>
        </section>

        {/* COMPREHENSIVE FEATURE COMPARISON MATRIX */}
        <section className="space-y-6 pt-6" aria-label="Feature Comparison Table">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Compare Plan Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Every tier provides real value. Upgrade or downgrade whenever your business milestones require it.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-slate-700 w-2/5">
                      Platform Capability
                    </th>
                    <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-slate-700 text-center w-1/5">
                      Free Starter
                    </th>
                    <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-brand-700 text-center w-1/5 bg-brand-50/40">
                      Pro ($39/mo)
                    </th>
                    <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-indigo-900 text-center w-1/5">
                      Advisory ($499+$149)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {featureComparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-slate-800">
                        {row.feature}
                      </td>
                      <td className="p-4 sm:p-5 text-center text-slate-600 font-medium">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )
                        ) : (
                          <span className="text-xs font-medium text-slate-600">{row.free}</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-center font-bold text-brand-900 bg-brand-50/20">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-4 h-4 text-brand-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-brand-800">{row.pro}</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-center font-bold text-indigo-950">
                        {typeof row.advisory === 'boolean' ? (
                          row.advisory ? (
                            <Check className="w-4 h-4 text-indigo-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-indigo-900">{row.advisory}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Transparent Policy & FAQ Callout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-4 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-300">
              Responsible Commercial Advisory Standards
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Crediqly provides educational frameworks, readiness evaluations, and credit-building roadmaps. Crediqly is not a lender, broker, or credit repair organization. We never make speculative claims such as &ldquo;guaranteed approval&rdquo; or &ldquo;guaranteed score increase&rdquo;—our mission is to help U.S. business owners establish genuine commercial separation and legitimate operational credit depth.
          </p>
        </div>
      </main>
    </div>
  );
}
