'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Compass,
  Sparkles,
  Lock,
  ArrowLeft,
  TrendingUp,
  Headphones,
  Check,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useRoadmap } from '@/context/RoadmapContext';
import { calculateReadiness } from '@/lib/scoring';
import { getFundingReadiness } from '@/lib/supabase/fundingService';
import { FundingReadinessResult } from '@/types/funding';
import { FundingGapAnalysis } from '@/components/readiness/FundingGapAnalysis';

function ReadinessPageContent() {
  const { user } = useAuth();
  const { business, loading: businessLoading } = useBusiness();
  const { isPro, isAdvisory, upgradeToPro } = useSubscription();
  const { roadmap, loading: roadmapLoading } = useRoadmap();
  const { sections } = usePlatformSections();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [fundingResult, setFundingResult] = useState<FundingReadinessResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'business' | 'credit' | 'funding'>('overview');

  const isProfileComplete = Boolean(business && business.profileCompleted);

  // Sync tab from URL if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'business', 'credit', 'funding'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Load readiness data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const funding = await getFundingReadiness(user.id, business);
        if (isMounted) {
          setFundingResult(funding);
        }
      } catch (err) {
        console.warn('Error fetching funding readiness in /readiness:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.id, business]);

  // Calculate local business & credit readiness
  const readiness = useMemo(() => calculateReadiness(business), [business]);

  // Overall combined readiness score (weighted: 35% Business, 35% Credit, 30% Funding)
  const overallScore = useMemo(() => {
    if (!isProfileComplete) return 0;
    const bScore = readiness.businessReadiness.score || 0;
    const cScore = readiness.creditReadiness.score || 0;
    const fScore = fundingResult?.score || 0;
    return Math.round(bScore * 0.35 + cScore * 0.35 + fScore * 0.3);
  }, [isProfileComplete, readiness, fundingResult]);

  // Single highest-leverage primary recommendation
  const primaryNextStep = useMemo(() => {
    if (!isProfileComplete) {
      return {
        title: 'Complete Your 21-Point Business Profile',
        reason: 'Your foundation profile is missing entity age, EIN, or compliance parameters required to calculate your true commercial standing.',
        actionLabel: 'Complete Business Profile',
        href: '/onboarding',
        category: 'Business Foundation',
      };
    }

    // Business foundation checks
    if (business?.hasEIN !== 'yes') {
      return {
        title: 'Obtain Federal Employer Identification Number (EIN)',
        reason: 'Lenders and credit bureaus require an official federal tax ID to establish an independent commercial credit file.',
        actionLabel: 'Update Business Profile',
        href: '/business',
        category: 'Foundation',
      };
    }
    if (business?.hasBusinessBankAccount !== 'yes') {
      return {
        title: 'Open a Dedicated Commercial Checking Account',
        reason: 'Underwriting algorithms reject applications commingled with personal bank accounts.',
        actionLabel: 'View Commercial Banking',
        href: '/products?category=business_banking',
        category: 'Banking',
      };
    }
    if (business?.hasDuns !== 'yes') {
      return {
        title: 'Register for a Free Dun & Bradstreet D-U-N-S® Number',
        reason: 'A D-U-N-S number is mandatory for D&B Paydex score generation and federal contracting tradelines.',
        actionLabel: 'Register Free D-U-N-S',
        href: '/roadmap',
        category: 'Bureau Profile',
      };
    }

    // Tradeline checks
    const hasReporting = business?.hasReportingAccounts === 'yes';
    if (!hasReporting) {
      return {
        title: 'Establish Your First 3 Tier-1 Vendor Net-30 Accounts',
        reason: 'You have zero reporting commercial tradelines. Open net-30 accounts with reporting suppliers like Uline, Grainger, and Quill.',
        actionLabel: 'Browse Vendor Tradelines',
        href: '/products',
        category: 'Tradelines',
      };
    }

    // Roadmap task fallback
    const activeTask = roadmap?.allTasks?.find((t) => t.status === 'not_started' || t.status === 'in_progress');
    if (activeTask) {
      return {
        title: activeTask.title,
        reason: activeTask.whyItMatters || 'Completing this milestone advances your business along the commercial credit roadmap.',
        actionLabel: 'Go to Milestone',
        href: '/roadmap',
        category: 'Roadmap',
      };
    }

    return {
      title: 'Maintain Active Tradelines & Explore Capital Programs',
      reason: 'Your foundational requirements are in place. Maintain early payments to optimize your commercial index.',
      actionLabel: 'View Funding Options',
      href: '/funding',
      category: 'Funding',
    };
  }, [isProfileComplete, business, roadmap]);

  if (sections.business_readiness === false && sections.funding_readiness === false) {
    return (
      <SectionInactiveNotice
        title="Readiness Audit Inactive"
        description="The readiness section has been temporarily disabled by the administrator. Please check back later."
      />
    );
  }

  if (loading || businessLoading || roadmapLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Calculating commercial readiness index & gap analysis..." />
      </div>
    );
  }

  const getBadgeVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'neutral';
  };

  const getLevelLabel = (score: number) => {
    if (score >= 80) return 'High Readiness';
    if (score >= 50) return 'Building Readiness';
    return 'Foundation Stage';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Crediqly Audit Engine</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Credit Bureau Inquiries
              </span>
            </div>
          </div>

          {/* TOP HERO: OVERALL READINESS SCORE */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>Comprehensive Business Standing</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                  Commercial Readiness Audit
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Your business credit and funding readiness are calculated deterministically from your 21-point legal profile, commercial banking records, and active reporting tradelines.
                </p>
              </div>

              {/* Large Score Dial Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 flex items-center gap-5 shrink-0 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {isProfileComplete ? `${overallScore}%` : '--%'}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-300 mt-0.5">
                    Overall Readiness Index
                  </div>
                </div>
                <div className="h-12 w-[1px] bg-white/20" />
                <div className="space-y-1 text-left">
                  <Badge variant={getBadgeVariant(overallScore)} className="text-xs font-bold uppercase">
                    {getLevelLabel(overallScore)}
                  </Badge>
                  <p className="text-[11px] text-slate-300">
                    {overallScore >= 70
                      ? 'Prime candidate for tier-2/3 credit'
                      : overallScore >= 40
                      ? 'Solid foundation, expand tradelines'
                      : 'Complete foundational checklist'}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Readiness Progression</span>
                <span className="text-brand-300 font-bold">{overallScore}% of 100% Target</span>
              </div>
              <div className="w-full h-3 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* MOTIVATIONAL ENCOURAGEMENT BANNER (Phase 10) */}
          <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-bold">Encouraging Milestone: </strong>
              Building business credit takes consistency. Every completed compliance step and reporting tradeline strengthens your commercial foundation. Keep working through your roadmap.
            </div>
          </div>

          {/* YOUR NEXT STEP: ONE CLEAR PRIMARY RECOMMENDATION (Phase 11, 12) */}
          <Card className="border-brand-300 bg-gradient-to-r from-brand-50/50 via-white to-teal-50/30 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                      Single Highest-Leverage Priority
                    </span>
                    <CardTitle className="text-base font-extrabold text-slate-900">
                      Your Next Step
                    </CardTitle>
                  </div>
                </div>
                <Badge variant="info" className="text-xs font-bold">
                  {primaryNextStep.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-2xl">
                  <h3 className="text-lg font-bold text-slate-900">
                    {primaryNextStep.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {primaryNextStep.reason}
                  </p>
                </div>
                <Link href={primaryNextStep.href} className="shrink-0">
                  <Button size="md" className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-2 shadow-sm whitespace-nowrap">
                    <span>{primaryNextStep.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* THE THREE CORE PILLARS OF READINESS (Phase 11) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Readiness Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Detailed audit of your three foundational pillars: Business Structure, Credit Tradelines, and Funding Eligibility.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PILLAR 1: BUSINESS FOUNDATION READINESS */}
              <Card className="bg-white border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between shadow-xs">
                <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Business Readiness</h3>
                          <span className="text-[11px] text-slate-500">Entity & Compliance</span>
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(readiness.businessReadiness.score)} className="text-xs font-bold">
                        {readiness.businessReadiness.level}
                      </Badge>
                    </div>

                    {/* Score */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {isProfileComplete ? `${readiness.businessReadiness.score}%` : '--%'}
                      </span>
                      <span className="text-xs text-slate-500">Foundation Index</span>
                    </div>

                    <ProgressBar
                      value={isProfileComplete ? readiness.businessReadiness.score : 0}
                      color="brand"
                      showPercentage={false}
                    />

                    {/* Explanation */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {isProfileComplete
                        ? readiness.businessReadiness.description
                        : 'Complete your 21-point business profile to evaluate your commercial foundation score.'}
                    </div>
                  </div>

                  {/* Next Action Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Next Action
                    </span>
                    <Link
                      href="/business"
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                    >
                      <span>Review Foundation</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* PILLAR 2: COMMERCIAL CREDIT READINESS */}
              <Card className="bg-white border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between shadow-xs">
                <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Credit Readiness</h3>
                          <span className="text-[11px] text-slate-500">Bureaus & Tradelines</span>
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(readiness.creditReadiness.score)} className="text-xs font-bold">
                        {readiness.creditReadiness.level}
                      </Badge>
                    </div>

                    {/* Score */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {isProfileComplete ? `${readiness.creditReadiness.score}%` : '--%'}
                      </span>
                      <span className="text-xs text-slate-500">Tradeline Index</span>
                    </div>

                    <ProgressBar
                      value={isProfileComplete ? readiness.creditReadiness.score : 0}
                      color="emerald"
                      showPercentage={false}
                    />

                    {/* Explanation */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {isProfileComplete
                        ? readiness.creditReadiness.description
                        : 'Answer credit reporting lines in your profile to verify your tradeline maturity.'}
                    </div>
                  </div>

                  {/* Next Action Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Next Action
                    </span>
                    <Link
                      href="/products"
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                    >
                      <span>Browse Tradelines</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* PILLAR 3: CAPITAL & FUNDING READINESS */}
              <Card className="bg-white border-slate-200 hover:border-brand-300 transition-all flex flex-col justify-between shadow-xs">
                <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Funding Readiness</h3>
                          <span className="text-[11px] text-slate-500">Underwriting Criteria</span>
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(fundingResult?.score || 0)} className="text-xs font-bold">
                        {fundingResult?.level || 'Foundation'}
                      </Badge>
                    </div>

                    {/* Score */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {isProfileComplete ? `${fundingResult?.score || 0}%` : '--%'}
                      </span>
                      <span className="text-xs text-slate-500">Capital Index</span>
                    </div>

                    <ProgressBar
                      value={isProfileComplete ? fundingResult?.score || 0 : 0}
                      color="brand"
                      showPercentage={false}
                    />

                    {/* Explanation */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {isProfileComplete
                        ? fundingResult?.description || 'Evaluates revenue, entity age, personal credit, and banking criteria.'
                        : 'Profile incomplete. Answer commercial parameters to unlock capital readiness evaluation.'}
                    </div>
                  </div>

                  {/* Next Action Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Next Action
                    </span>
                    <Link
                      href="/funding"
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                    >
                      <span>Potential Options</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* GAP ANALYSIS: WHAT IS HOLDING ME BACK */}
          <FundingGapAnalysis fundingResult={fundingResult} isProfileComplete={isProfileComplete} />

          {/* ROADMAP PREVIEW WITH PREVIEW + UNLOCK GATING (Phase 6, 11) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Roadmap Milestone Preview
                </h2>
                <p className="text-xs text-slate-500">
                  {roadmap.completedCount} of {roadmap.applicableTotalCount} milestones completed. Free tier includes foundation steps; Pro unlocks the complete 4-tier roadmap.
                </p>
              </div>
              <Link href="/roadmap">
                <Button variant="outline" size="sm" className="text-xs font-semibold gap-1">
                  <span>View Full Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Task 1: Free accessible */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    Tier 1 • Free Access
                  </span>
                  <Badge variant="success" className="text-[10px]">Open</Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  Business Entity & Legal Compliance
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  Verify state entity registration, EIN, dedicated business phone, and commercial physical address.
                </p>
                <div className="pt-2 border-t border-slate-100">
                  <Link href="/roadmap" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <span>Execute Task</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Task 2: Free accessible */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    Tier 1 • Free Access
                  </span>
                  <Badge variant="success" className="text-[10px]">Open</Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  Dedicated Commercial Bank Account
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  Open a legitimate business checking account to establish independent commercial bank rating.
                </p>
                <div className="pt-2 border-t border-slate-100">
                  <Link href="/roadmap" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <span>Execute Task</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Task 3: Pro Gated with Intelligent Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Tier 2 • Pro Roadmap
                  </span>
                  <Badge variant="warning" className="text-[10px]">
                    {isPro ? 'Unlocked' : 'Pro Only'}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-white">
                  Vendor Net-30 Reporting Tradelines
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  Establish 3-5 Tier 1 reporting vendor accounts with major bureaus to trigger an official Dun & Bradstreet PAYDEX score.
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  {isPro ? (
                    <Link href="/roadmap" className="text-xs font-bold text-brand-300 hover:text-white flex items-center gap-1">
                      <span>View Pro Checklist</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <button
                      onClick={upgradeToPro}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                    >
                      <span>Unlock with Pro ($39/mo)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CONTEXTUAL PREMIUM ADVISORY PROMPT (Phase 5, 7, 15) */}
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/40 shadow-sm">
            <CardContent className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      Done-With-You Support
                    </span>
                    <Badge variant="neutral" className="text-[10px] font-bold">1-on-1 Sessions</Badge>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Prefer expert guidance instead of doing everything alone?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                    Premium Advisory pairs you with a dedicated specialist who audits your profile, reviews your milestone progress, and helps you prioritize your next steps.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link href="/advisory">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-sm whitespace-nowrap">
                    <span>Explore Advisory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
  );
}

export default function ReadinessPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <LoadingState message="Loading readiness audit..." />
            </div>
          }
        >
          <ReadinessPageContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
