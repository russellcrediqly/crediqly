'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Headphones,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Clock,
  Briefcase,
  Layers,
  FileCheck,
  TrendingUp,
  AlertCircle,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

function AdvisoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    subscription,
    isAdvisory,
    isGuided,
    isPro,
    isFoundation,
    loading,
    upgradeToGuided,
    upgradeToAdvisory,
    requestIntensive,
    openCustomerPortal,
  } = useSubscription();

  const hasGuided = isGuided || isAdvisory;
  const handleGuidedUpgrade = upgradeToGuided || upgradeToAdvisory;

  const [onboardingNotice, setOnboardingNotice] = useState(false);
  const [canceledNotice, setCanceledNotice] = useState(false);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setOnboardingNotice(true);
    } else if (searchParams.get('canceled') === 'true') {
      setCanceledNotice(true);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingState message="Loading Advisory &amp; Intensive details..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Onboarding Success Banner */}
      {onboardingNotice && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-sm text-emerald-950">
                Welcome to Crediqly Advisory &amp; Intensive!
              </h4>
              <p className="text-emerald-700 leading-relaxed">
                Your payment has been confirmed. Your dedicated commercial credit specialist will review your business profile and reach out to schedule your strategy deep dive.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOnboardingNotice(false)}
            className="text-emerald-600 hover:text-emerald-900 p-1"
            aria-label="Close notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canceled Banner */}
      {canceledNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-amber-950">Checkout Canceled</h4>
              <p className="text-amber-800 leading-relaxed">
                Your checkout session was canceled. Your card was not charged and you can enroll whenever you are ready.
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
      )}

      {/* Active Guided / Advisory Customer Status Card */}
      {hasGuided && (
        <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-white to-teal-50/40 shadow-md overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      Guided Membership Active
                    </h2>
                    <Badge variant="success">Enrolled</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    $147.99/month recurring • Expert Guided Tier
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={openCustomerPortal}
                className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100 self-start sm:self-auto gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Manage Billing</span>
              </Button>
            </div>

            {/* Included Monthly Meeting Callout */}
            <div className="p-4 rounded-xl bg-white border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Included 1-on-1 Monthly Strategy Session
                  </h4>
                  <p className="text-xs text-slate-500">
                    Your plan includes one 45-minute private strategy session each month ($0 fee).
                  </p>
                </div>
              </div>

              <Link href="/consultation?type=advisory">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Included Session ($0)</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold tracking-wide border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>High-Touch Services &amp; Personal Strategy</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Guided Strategy &amp; 12-Month Program
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Get personalized expert help preparing your business for funding. Fast-track your commercial underwriting dossier with hands-on credit specialist guidance.
          </p>

          {/* Pricing Highlight Pill */}
          <div className="pt-2 flex flex-wrap items-baseline gap-3 text-white">
            <div className="flex items-baseline gap-1.5 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-xs">
              <span className="text-2xl sm:text-3xl font-black text-white">$147.99</span>
              <span className="text-xs text-slate-300">/ month Guided Plan</span>
            </div>
            <span className="text-sm font-bold text-brand-400">or</span>
            <div className="flex items-baseline gap-1.5 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-xs">
              <span className="text-2xl sm:text-3xl font-black text-white">$997</span>
              <span className="text-xs text-slate-300">12-Month Program (one-time)</span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleGuidedUpgrade('monthly')}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold shadow-lg gap-2"
            >
              <span>Join Guided Monthly ($147.99/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {!hasGuided && (
              <Button
                variant="outline"
                size="md"
                onClick={requestIntensive}
                className="bg-white hover:bg-slate-100 text-slate-900 hover:text-slate-950 border border-slate-200 text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                <span className="text-slate-900 hover:text-slate-950 font-bold">Guided 12-Month ($997 One-Time)</span>
              </Button>
            )}

            <Link href="/pricing">
              <Button
                variant="outline"
                size="md"
                className="bg-white hover:bg-slate-100 text-slate-900 hover:text-slate-950 border border-slate-200 text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                <span className="text-slate-900 hover:text-slate-950 font-bold">Compare Plans</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* VALUE BREAKDOWN SECTIONS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            What&apos;s Included in Advisory &amp; Guided Services
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            A comprehensive hybrid of automated software, personal strategy, and ongoing review.
          </p>
        </div>

        {/* Dual Pillar Comparison: Setup vs Monthly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Guided 12-Month Program ($997 One-Time) */}
          <Card className="border-brand-200/90 bg-white shadow-xs">
            <div className="bg-brand-50/70 p-4 border-b border-brand-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">Guided 12-Month Program</h3>
              </div>
              <span className="text-xs font-black text-brand-700 bg-brand-100/70 px-2.5 py-0.5 rounded-full">
                $997 One-Time
              </span>
            </div>
            <CardContent className="p-5 space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Comprehensive Business Profile Audit</span>
                  <span className="text-[11px] text-slate-500">
                    Deep-dive review of 21 commercial parameters to resolve filing mismatches.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Complete Readiness Dossier Preparation</span>
                  <span className="text-[11px] text-slate-500">
                    Full compilation of underwriting baselines, bureau filings, and bank rating benchmarks.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Tailored Capital Milestone Roadmap</span>
                  <span className="text-[11px] text-slate-500">
                    Custom-sequenced step-by-step action plan designed for your specific entity.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">12 Months of Monthly Consultations &amp; Support</span>
                  <span className="text-[11px] text-slate-500">
                    Monthly private sessions (up to 12) and priority support throughout the defined 12-month program.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Ongoing Guided Strategy ($147.99/mo) */}
          <Card className="border-emerald-200/90 bg-white shadow-xs">
            <div className="bg-emerald-50/70 p-4 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Ongoing Guided Strategy</h3>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                $147.99 / Month
              </span>
            </div>
            <CardContent className="p-5 space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">1 Personal Strategy Meeting Per Month</span>
                  <span className="text-[11px] text-slate-500">
                    Scheduled monthly strategy session to review new tradelines and lending timing.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Full Foundation Software Access</span>
                  <span className="text-[11px] text-slate-500">
                    Includes all Tier 1–4 tradelines, personalized action plan, and AI mentor guidance.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Continuous Roadmap Adjustments</span>
                  <span className="text-[11px] text-slate-500">
                    Ongoing progress reviews and next-step recommendations as your business ages.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Priority Support Queue</span>
                  <span className="text-[11px] text-slate-500">
                    Fast-response advisor communication whenever questions arise.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CORE FEATURE PILLARS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            01
          </div>
          <h4 className="font-bold text-slate-900">Business Credit Strategy</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Hands-on assistance navigating vendor net-30 accounts, revolving store cards, and commercial reporting bureaus.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            02
          </div>
          <h4 className="font-bold text-slate-900">Funding Readiness Strategy</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Calibration of cash flow ratios, bank ratings, and lender underwriting criteria before applying for capital.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            03
          </div>
          <h4 className="font-bold text-slate-900">Monthly 1-on-1 Strategy Meeting</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            One 45-minute scheduled private meeting per month to calibrate progress and adjust strategy.
          </p>
        </div>
      </div>

      {/* Enrollment Call to Action (for non-guided members) */}
      {!hasGuided && (
        <Card className="border-brand-200 bg-gradient-to-br from-brand-50/50 to-white shadow-sm text-center">
          <CardContent className="p-6 sm:p-8 space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Ready for Dedicated Commercial Guidance?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Join the Guided plan ($147.99/mo) for monthly 1-on-1 strategy meetings and priority support, or choose the defined 12-Month Guided Program ($997 one-time) for a full year of dedicated guidance.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleGuidedUpgrade('monthly')}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-2"
              >
                <span>Enroll in Guided ($147.99/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={requestIntensive}
                className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 hover:text-slate-950 border border-slate-300 text-xs font-bold gap-2 shadow-xs transition-colors"
              >
                <span className="text-slate-900 hover:text-slate-950 font-bold">Guided 12-Month ($997 One-Time)</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Compliance & Regulatory Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <span>Important Advisory Disclaimer</span>
        </div>
        <p>
          Crediqly Guided and Intensive Advisory provides educational, strategic, and preparation services for business credit and funding readiness. Crediqly does not guarantee loan approvals, funding amounts, interest rates, or credit score increases. Crediqly is not a bank, direct lender, credit repair organization, or underwriting agency. All credit granting decisions are made solely by independent financial institutions.
        </p>
      </div>
    </div>
  );
}

export default function AdvisoryPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <LoadingState message="Loading Guided Advisory..." />
            </div>
          }
        >
          <AdvisoryContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
