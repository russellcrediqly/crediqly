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
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';

export default function PricingPage() {
  const { user } = useAuth();
  const {
    isFoundation,
    isGuided,
    isPro,
    isAdvisory,
    upgradeToFoundation,
    upgradeToGuided,
    upgradeToGuidedOneTime,
    requestIntensive,
    openCustomerPortal,
  } = useSubscription();
  const [canceledNotice, setCanceledNotice] = useState(false);
  const [guidedBilling, setGuidedBilling] = useState<'monthly' | 'one_time'>('monthly');

  // Active status checks (supporting backward compatibility)
  const hasFoundation = isFoundation || isPro;
  const hasGuided = isGuided || isAdvisory;

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
      foundation: true,
      guided: true,
      category: 'Foundation',
    },
    {
      feature: 'Funding Readiness Score & Factor Analysis',
      free: 'Basic (3 Factors)',
      foundation: 'Full (6 Factors + Gaps)',
      guided: 'Full + Advisor Review',
      category: 'Foundation',
    },
    {
      feature: 'Interactive Business Credit Roadmap',
      free: 'Tier 1 Foundational Only',
      foundation: 'Complete 4-Tier Interactive',
      guided: 'Complete 4-Tier + Custom Plan',
      category: 'Roadmap & Credit',
    },
    {
      feature: 'Vendor Tradelines & Net-30 Catalogs',
      free: 'Starter (3 Vendors)',
      foundation: 'Full Catalog (Tiers 1, 2, 3)',
      guided: 'Full Catalog + Tailored Recommendations',
      category: 'Roadmap & Credit',
    },
    {
      feature: 'Commercial Banks Directory & Criteria',
      free: false,
      foundation: true,
      guided: true,
      category: 'Roadmap & Credit',
    },
    {
      feature: 'Personalized Funding Matches Engine',
      free: 'Basic Category Previews',
      foundation: 'Full Opportunity Matches',
      guided: 'Full Matches + Application Prep',
      category: 'Funding Intelligence',
    },
    {
      feature: 'Funding Application Tracker',
      free: true,
      foundation: true,
      guided: true,
      category: 'Funding Intelligence',
    },
    {
      feature: 'Crediqly AI Mentor Access',
      free: false,
      foundation: true,
      guided: true,
      category: 'Guidance & Support',
    },
    {
      feature: '1-on-1 Monthly Strategy Meeting',
      free: false,
      foundation: false,
      guided: true,
      category: 'Guidance & Support',
    },
    {
      feature: 'Priority Support & Guided Strategy Review',
      free: false,
      foundation: false,
      guided: true,
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
      subtext: 'No credit card required',
      description: 'Basic business profile, baseline readiness assessment, and personalized roadmap preview',
      tag: 'Starter',
      badgeClass: 'bg-white/10 text-slate-200 border-white/20',
      highlight: false,
    },
    {
      name: 'Foundation',
      price: '$47.99',
      cadence: '/mo',
      subtext: 'Recurring monthly subscription',
      description: 'Build independently: full readiness assessment, complete 4-tier roadmap, tradelines & AI mentor',
      tag: 'Self-Directed',
      badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
      highlight: false,
    },
    {
      name: 'Guided',
      price: '$147.99',
      cadence: '/mo',
      subtext: 'Or $997 one-time for 12 months',
      description: 'Expert guidance: personal monthly strategy meeting, application sequencing & priority support',
      tag: 'Most Popular',
      badgeClass: 'bg-brand-500 text-white border-brand-400',
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CrediqlyLogo size="md" />
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
            Start free with foundational compliance audits, build your commercial credit profile with DIY Foundation, or get dedicated expert Guided support.
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

        {/* 3 Choices Grid: Free, Foundation, Guided */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* 1. FREE PLAN */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-3xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Free</h3>
                    <Badge variant="neutral" className="text-xs uppercase font-extrabold px-2.5 py-0.5">
                      Discovery
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-bold">
                    Explore Crediqly and discover your readiness
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Audit your commercial entity standing and discover your baseline funding potential.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-black text-slate-900">$0</span>
                  <span className="text-xs font-bold text-slate-400">/ forever</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>21-Point Business Profile Audit</strong> (EIN, SOS, status)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Baseline Readiness Assessment</strong> (0–100 score preview)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Business Credit Roadmap Preview</strong> (Stage 1 tasks)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Funding Readiness Insights</strong> (pre-qualification preview)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>No credit card required to start</span>
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
                      {hasGuided ? 'Included in Guided' : hasFoundation ? 'Included in Foundation' : 'Current Active Plan'}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold text-slate-800 hover:text-slate-900 hover:bg-slate-50 border-slate-300"
                    >
                      Start Free Journey
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. FOUNDATION PLAN ($47.99/mo) */}
          <Card className="border-slate-200 bg-white shadow-md rounded-3xl flex flex-col justify-between hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Foundation</h3>
                    <Badge variant="info" className="text-xs uppercase font-extrabold px-2.5 py-0.5">
                      DIY Roadmap
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-brand-700 leading-relaxed font-bold">
                    Build it yourself. Manage your funding-readiness journey independently.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Follow an actionable step-by-step roadmap, track genuine progress, and access relevant financial products.
                  </p>
                </div>

                <div className="space-y-0.5 pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900">$47.99</span>
                    <span className="text-xs font-bold text-slate-400">/ month</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Recurring monthly subscription · Cancel anytime
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Everything in Free</strong>, plus:</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Full Funding-Readiness Assessment</strong> &amp; genuine progress tracking</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Personalized Roadmap</strong> with actionable milestones &amp; next steps</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Relevant Tradeline &amp; Financial-Product</strong> recommendations (Tiers 1, 2 &amp; 3)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Funding-Readiness Score</strong> &amp; factor gap breakdowns</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Core Self-Service Platform Tools</strong> &amp; AI Mentor guidance</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                {hasGuided ? (
                  <Button
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-brand-300 text-brand-800 bg-brand-50 hover:bg-brand-100"
                  >
                    Included in Guided
                  </Button>
                ) : hasFoundation ? (
                  <Button
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-brand-300 text-brand-800 bg-brand-50 hover:bg-brand-100"
                  >
                    Manage Foundation Plan
                  </Button>
                ) : user ? (
                  <Button
                    variant="primary"
                    onClick={upgradeToFoundation}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                  >
                    <span>Upgrade to Foundation — $47.99/mo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href="/signup?plan=foundation" className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                    >
                      <span>Start Foundation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-[11px] text-slate-500 text-center block">
                  Billed monthly. Cancel anytime in 1 click.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. GUIDED PLAN — MOST POPULAR (Monthly $147.99/mo or 12-Month $997 One-Time) */}
          <Card className="border-2 border-brand-500 bg-white shadow-xl rounded-3xl relative flex flex-col justify-between overflow-hidden ring-4 ring-brand-500/15 transform lg:-translate-y-2 transition-transform">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest shadow-xs">
              ⚡ Most Popular — Expert Guidance
            </div>
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Guided</h3>
                    <Badge variant="info" className="text-xs uppercase font-extrabold px-2.5 py-0.5">
                      Expert Guided
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-brand-700 leading-relaxed font-bold">
                    Personalized guidance alongside the complete platform.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Designed for founders who want strategic consultations, application sequencing, and priority expert support.
                  </p>
                </div>

                {/* Billing Selector for Option A (Monthly) vs Option B (12-Month Program) */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold w-full">
                  <button
                    type="button"
                    onClick={() => setGuidedBilling('monthly')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${
                      guidedBilling === 'monthly'
                        ? 'bg-white text-brand-900 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly ($147.99/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuidedBilling('one_time')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${
                      guidedBilling === 'one_time'
                        ? 'bg-white text-indigo-900 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    12-Month ($997)
                  </button>
                </div>

                <div className="space-y-0.5 pt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900">
                      {guidedBilling === 'monthly' ? '$147.99' : '$997'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {guidedBilling === 'monthly' ? '/ month' : 'one-time (12 months)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {guidedBilling === 'monthly'
                      ? 'Recurring monthly subscription · Cancel anytime'
                      : 'Defined 12-month Guided program · No automatic renewal'}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Everything in Foundation included</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Deeper Business Fundability Analysis</strong> &amp; underwriting audit</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>1 Scheduled Strategy Consultation per month</strong> with credit specialist</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Funding Preparation &amp; Application-Sequencing</strong> guidance</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Personalized Progress Reviews</strong> &amp; document preparation</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Clearly Defined Priority Support</strong> with expedited turnaround</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                {hasGuided ? (
                  <Button
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-brand-300 text-brand-800 bg-brand-50 hover:bg-brand-100"
                  >
                    Manage Guided Plan
                  </Button>
                ) : user ? (
                  <Button
                    variant="primary"
                    onClick={() => upgradeToGuided(guidedBilling)}
                    className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                  >
                    <span>
                      {guidedBilling === 'monthly'
                        ? 'Upgrade to Guided — $147.99/mo'
                        : 'Enroll in Guided 12-Month — $997'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href={`/signup?plan=guided&billing=${guidedBilling}`} className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-black shadow-md gap-1.5 py-3"
                    >
                      <span>
                        {guidedBilling === 'monthly'
                          ? 'Get Guided — $147.99/mo'
                          : 'Get Guided 12-Month — $997'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-[11px] text-slate-500 text-center block">
                  {guidedBilling === 'monthly'
                    ? 'Billed monthly. Cancel anytime in 1 click.'
                    : '12-month program. No automatic renewal. Access reverts to Free after 12 months.'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GUIDED OPTION B: 12-MONTH PROGRAM HIGHLIGHT (NOT a fourth package) */}
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-7 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Guided Program · Option B (One-Time Payment)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Guided 12-Month Program — $997 One Time
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Covers a defined 12-month Guided program for business owners who prefer an upfront single payment instead of monthly billing. Includes the same complete Guided features and support entitlements: 1 scheduled personal strategy meeting per month, deeper fundability analysis, sequencing guidance, and priority support for 12 months. No automatic renewal.
              </p>
            </div>

            <div className="text-left lg:text-right shrink-0 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Guided 12-Month Option</span>
              <div className="flex items-baseline gap-1 lg:justify-end">
                <span className="text-4xl font-black text-white">$997</span>
                <span className="text-xs font-bold text-slate-400">one-time</span>
              </div>
              <span className="text-[11px] text-indigo-300 font-semibold block">Covers 12 months · No automatic renewal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Full Underwriting &amp; Fundability Analysis</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Deep analysis of your commercial bureau filings, bank statements, entity standing, and fundability gaps.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-400" />
                <span>Application-Sequencing Guidance</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Expert roadmap and sequencing to avoid unnecessary inquiries and optimize application timing across lenders.
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Headphones className="w-4 h-4 text-brand-400" />
                <span>Monthly Consultations &amp; Priority Support</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                1 scheduled strategy meeting per month (up to 12 sessions) and dedicated priority response from certified specialists.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              ⚡ Covers a defined 12-month Guided program. Does not auto-renew. Access reverts to Free after 12 months unless renewed. We never guarantee loan approval.
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/advisory" className="w-full sm:w-auto">
                <Button
                  variant="outline-white"
                  size="md"
                  className="w-full sm:w-auto text-xs font-bold border-white/20 text-white hover:bg-white/10"
                >
                  Learn About Guided Program
                </Button>
              </Link>
              <Button
                size="md"
                onClick={() => upgradeToGuided('one_time')}
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold gap-2 shadow-lg"
              >
                <span>Enroll in 12-Month Guided ($997)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
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
                          From $47.99/mo
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                          $0 Free Available
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 max-w-5xl mx-auto">
                {ourPlanSpectrum.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all relative ${
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
                          <Link href="/dashboard" className="block w-full text-center py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all">
                            {hasGuided || hasFoundation ? 'Included' : 'Current Plan'}
                          </Link>
                        ) : (
                          <Link href="/signup" className="block w-full text-center py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all">
                            Start Free →
                          </Link>
                        )
                      ) : plan.name === 'Foundation' ? (
                        user ? (
                          hasFoundation ? (
                            <button
                              onClick={openCustomerPortal}
                              className="block w-full text-center py-2 px-3 rounded-xl bg-white text-brand-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all"
                            >
                              Manage Plan
                            </button>
                          ) : (
                            <button
                              onClick={upgradeToFoundation}
                              className="block w-full text-center py-2 px-3 rounded-xl bg-white text-brand-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all"
                            >
                              Upgrade Foundation →
                            </button>
                          )
                        ) : (
                          <Link href="/signup?plan=foundation" className="block w-full text-center py-2 px-3 rounded-xl bg-white text-brand-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all">
                            Start Foundation →
                          </Link>
                        )
                      ) : (
                        user ? (
                          hasGuided ? (
                            <button
                              onClick={openCustomerPortal}
                              className="block w-full text-center py-2 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-sm transition-all"
                            >
                              Manage Plan
                            </button>
                          ) : (
                            <button
                              onClick={() => upgradeToGuided('monthly')}
                              className="block w-full text-center py-2 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-sm transition-all"
                            >
                              Join Guided →
                            </button>
                          )
                        ) : (
                          <Link href="/signup?plan=guided" className="block w-full text-center py-2 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-sm transition-all">
                            Join Guided →
                          </Link>
                        )
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
                      Free ($0)
                    </th>
                    <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-brand-700 text-center w-1/5 bg-brand-50/40">
                      Foundation ($47.99/mo)
                    </th>
                    <th className="p-4 sm:p-5 text-xs font-black uppercase tracking-wider text-indigo-900 text-center w-1/5">
                      Guided ($147.99/mo)
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
                        {typeof row.foundation === 'boolean' ? (
                          row.foundation ? (
                            <Check className="w-4 h-4 text-brand-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-brand-800">{row.foundation}</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-center font-bold text-indigo-950">
                        {typeof row.guided === 'boolean' ? (
                          row.guided ? (
                            <Check className="w-4 h-4 text-indigo-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-indigo-900">{row.guided}</span>
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
