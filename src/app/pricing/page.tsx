'use client';

import React from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Zap,
  HelpCircle,
  Briefcase,
  CheckCircle2,
  Headphones,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

export default function PricingPage() {
  const { user } = useAuth();
  const { isPro, isAdvisory, upgradeToPro, upgradeToAdvisory, openCustomerPortal } = useSubscription();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
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
                <Button variant="outline" size="sm" className="text-xs font-semibold">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Pricing Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Choose the level of support your business needs.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Start free, build your business-credit foundation, and upgrade when you&apos;re ready for deeper guidance and support.
          </p>
        </div>

        {/* 3 Choices Grid: Free, Pro, Premium Advisory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* 1. FREE PLAN */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-3xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900">Free</h3>
                    <Badge variant="neutral" className="text-xs uppercase font-bold">
                      Starter
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                    Build your foundation
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Understand where you stand and discover what to work on next.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-black text-slate-900">$0</span>
                  <span className="text-xs font-bold text-slate-400">/ month</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Complete 21-point Business Profile compliance audit</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Basic Business & Credit Readiness scorecards</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Tier 1 foundational credit roadmap milestones</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Funding application tracker (track progress)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Basic educational guides & starter vendor recommendations</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Zero credit card required to get started</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {user ? (
                  <Link href="/dashboard" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold text-slate-700 hover:bg-slate-50 border-slate-300"
                    >
                      {isAdvisory ? 'Included in Advisory' : isPro ? 'Included in Pro' : 'Current Active Plan'}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold text-slate-700 hover:bg-slate-50 border-slate-300"
                    >
                      Get Started Free
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. PRO PLAN ($39/mo) */}
          <Card className="border-2 border-brand-500 bg-white shadow-lg rounded-3xl relative flex flex-col justify-between overflow-hidden">
            <div className="bg-brand-600 text-white text-center py-1.5 text-xs font-extrabold uppercase tracking-widest">
              Most Popular
            </div>
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900">Crediqly Pro</h3>
                    <Badge variant="info" className="text-xs uppercase font-bold">
                      DIY Roadmap
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-brand-700 leading-relaxed font-semibold">
                    Build smarter with the complete DIY roadmap
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Stop guessing what to do next. Unlock your complete roadmap and track your progress as you build.
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
                    <span><strong>Complete 4-Tier Interactive Roadmap</strong> with all milestone tasks</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Full Credit Product Directory</strong>: Tier 1, 2, 3 Net-30 vendor tradelines & cards</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Deeper Funding-Readiness Guidance</strong> & underwriting gap analysis</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>See the steps that matter most</strong> for your specific business stage</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Commercial Banks Directory</strong> with criteria & fee comparisons</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                {isAdvisory ? (
                  <Button
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-brand-200 text-brand-700 bg-brand-50"
                  >
                    Included in Advisory
                  </Button>
                ) : isPro ? (
                  <Button
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100"
                  >
                    Manage Subscription
                  </Button>
                ) : user ? (
                  <Button
                    variant="primary"
                    onClick={upgradeToPro}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md gap-1.5"
                  >
                    <span>Upgrade to Pro — $39/mo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href="/signup" className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md gap-1.5"
                    >
                      <span>Start Pro — $39/mo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-xs text-slate-400 text-center block">
                  Billed monthly. Cancel anytime in customer portal.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. PREMIUM ADVISORY ($499 Setup + $149/mo) */}
          <Card className="border-2 border-indigo-600 bg-slate-900 text-white shadow-xl rounded-3xl relative flex flex-col justify-between overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-1.5 text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              <span>Premium Support</span>
            </div>
            <CardContent className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-white">Premium Advisory</h3>
                    <Badge variant="neutral" className="bg-indigo-950/80 text-indigo-300 border-indigo-700/60 text-xs uppercase font-bold">
                      Done-With-You
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-300 leading-relaxed font-semibold">
                    Get hands-on guidance while you build
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Prefer expert guidance instead of doing everything alone? Work with a dedicated specialist.
                  </p>
                </div>

                <div className="pt-2 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">$149</span>
                    <span className="text-xs font-bold text-slate-400">/ month</span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-300">
                    + $499 one-time setup & onboarding
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Complete Crediqly platform & Pro access included</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Personalized 1-on-1 advisory meetings</strong> with credit specialist</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Done-for-you profile review</strong> & entity compliance audit</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Personalized funding-readiness guidance</strong> & preparation strategy</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Ongoing milestone progress reviews</strong> & next-step identification</span>
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
                    variant="outline"
                    onClick={openCustomerPortal}
                    className="w-full text-xs font-bold border-indigo-500 text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900"
                  >
                    Active Advisory Retainer
                  </Button>
                ) : user ? (
                  <Button
                    variant="primary"
                    onClick={upgradeToAdvisory}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md gap-1.5"
                  >
                    <span>Join Premium Advisory — $499 + $149/mo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href="/signup" className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md gap-1.5"
                    >
                      <span>Join Premium Advisory — $499 + $149/mo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-xs text-slate-500 text-center block">
                  Billed monthly + setup fee. Cancel anytime in customer portal.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transparent Policy & FAQ Callout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-4">
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
