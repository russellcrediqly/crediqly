'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useRoadmap } from '@/context/RoadmapContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConsultationModal } from '@/components/ui/ConsultationModal';
import { calculateReadiness } from '@/lib/scoring';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { ScoreLevel } from '@/types/business';
import { MilestoneTimeline } from '@/components/dashboard/MilestoneTimeline';
import { StageProgressList } from '@/components/dashboard/StageProgressList';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { SinceLastVisitCard } from '@/components/dashboard/SinceLastVisitCard';
import { ProgressHistoryCard } from '@/components/dashboard/ProgressHistoryCard';
import { calculateMilestones } from '@/lib/milestones/engine';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useSubscription } from '@/context/SubscriptionContext';
import { getRecentActivities } from '@/lib/supabase/activityService';
import { getProgressHistory, recordProgressSnapshot } from '@/lib/supabase/progressService';
import { getLastSeenAt, updateLastSeenAt, getSinceLastVisitSummary } from '@/lib/supabase/lastSeenService';
import { ActivityLogItem, ProgressHistoryItem, SinceLastVisitSummary } from '@/types/progress';
import { STAGE_DEFINITIONS } from '@/lib/roadmap/definitions';
import { getProducts, trackProductClick } from '@/lib/supabase/productService';
import { getRecommendedProducts } from '@/lib/products/recommendationEngine';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { Product, RecommendedProduct } from '@/types/product';
import { getUserFundingApplications } from '@/lib/supabase/fundingApplicationService';
import { FundingApplication } from '@/types/fundingApplication';
import { getUserConsultations } from '@/lib/supabase/consultationService';
import { Consultation } from '@/types/consultation';
import { isCheckInDue, getLatestCheckIn } from '@/lib/supabase/checkInService';
import { MonthlyCheckInRecord } from '@/types/checkIn';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Calendar,
  Building,
  Building2,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Compass,
  Info,
  GitFork,
  GitBranch,
  Sparkles,
  FileCheck,
  Headphones,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { business, loading: businessLoading } = useBusiness();
  const { roadmap, toggleTaskCompletion } = useRoadmap();
  const { sections, settings } = usePlatformSections();
  const { isPro, isAdvisory, upgradeToPro, upgradeToAdvisory, openCustomerPortal } = useSubscription();
  const [consultationOpen, setConsultationOpen] = useState(false);

  // Keep administrator and customer experiences strictly separated
  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, authLoading, router]);

  // Step 6: Activity, History, and Session State
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const [history, setHistory] = useState<ProgressHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [sinceLastVisit, setSinceLastVisit] = useState<SinceLastVisitSummary | null>(null);
  const [sinceLastVisitLoading, setSinceLastVisitLoading] = useState(true);

  // Step 7: Product Recommendations State
  const [dashboardProducts, setDashboardProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | RecommendedProduct | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Step 11: Funding Tracker State
  const [trackedApps, setTrackedApps] = useState<FundingApplication[]>([]);

  // Step 12: Consultation State
  const [latestConsultation, setLatestConsultation] = useState<Consultation | null>(null);

  // Monthly Check-In State
  const [checkInDue, setCheckInDue] = useState(false);
  const [latestCheckIn, setLatestCheckIn] = useState<MonthlyCheckInRecord | null>(null);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Business Owner';
  const isProfileComplete = Boolean(business && business.profileCompleted);

  // Compute live readiness metrics from profile
  const readiness = calculateReadiness(business);
  const fundingReadiness = useMemo(() => calculateFundingReadiness(business), [business]);

  // Compute deterministic milestones from real data
  const milestones = useMemo(() => {
    return calculateMilestones(business, roadmap);
  }, [business, roadmap]);

  // Compute top 3 recommended products for dashboard
  const dashboardRecommendations = useMemo(() => {
    if (dashboardProducts.length === 0) return [];
    return getRecommendedProducts(business, roadmap, dashboardProducts).slice(0, 3);
  }, [business, roadmap, dashboardProducts]);

  const getBadgeVariant = (level: ScoreLevel): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (level) {
      case 'Strong Foundation':
        return 'success';
      case 'On Track':
        return 'info';
      case 'Building':
        return 'warning';
      case 'Getting Started':
      default:
        return 'neutral';
    }
  };

  const getFundingBadgeVariant = (level: string): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (level) {
      case 'Strong Readiness':
        return 'success';
      case 'Funding Ready':
        return 'info';
      case 'Developing':
      case 'Building Readiness':
        return 'warning';
      case 'Getting Started':
      default:
        return 'neutral';
    }
  };

  const nextBestTask = roadmap.nextBestAction;
  const nextBestStageMeta = nextBestTask ? STAGE_DEFINITIONS[nextBestTask.stage] : null;

  // Load activities, session updates, and progress history on mount
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    async function loadDashboardData() {
      try {
        // 1. Session tracking: Fetch previous last_seen_at before updating
        const prevLastSeen = await getLastSeenAt(user!.id);
        const visitSummary = await getSinceLastVisitSummary(user!.id, prevLastSeen);
        if (isMounted) {
          setSinceLastVisit(visitSummary);
          setSinceLastVisitLoading(false);
        }

        // Update last_seen_at for next visit
        await updateLastSeenAt(user!.id);

        // 2. Fetch Recent Activities
        const recent = await getRecentActivities(user!.id, 10);
        if (isMounted) {
          setActivities(recent);
          setActivitiesLoading(false);
        }

        // 3. Fetch Historical Progress Snapshots
        const hist = await getProgressHistory(user!.id, 10);
        if (isMounted) {
          setHistory(hist);
          setHistoryLoading(false);
        }

        // 4. If user has complete profile, record initial progress snapshot if none exists
        if (business && business.profileCompleted) {
          await recordProgressSnapshot(user!.id, {
            businessId: business.businessId,
            businessReadinessScore: readiness.businessReadiness.score,
            creditReadinessScore: readiness.creditReadiness.score,
            fundingReadinessScore: fundingReadiness.score,
            roadmapProgress: roadmap.percentage,
          });
        }

        // 5. Load Credit Products, Tracked Applications, Consultations & Monthly Check-In
        const [prods, apps, consults, isDue, latestCheck] = await Promise.all([
          getProducts(),
          getUserFundingApplications(user!.id),
          getUserConsultations(user!.id),
          isCheckInDue(user!.id),
          getLatestCheckIn(user!.id),
        ]);
        if (isMounted) {
          setDashboardProducts(prods);
          setTrackedApps(apps);
          const active = consults.find((c) =>
            ['Requested', 'Confirmed', 'Rescheduled'].includes(c.status)
          ) || consults[0] || null;
          setLatestConsultation(active);
          setCheckInDue(isDue);
          setLatestCheckIn(latestCheck);
        }
      } catch (err: any) {
        console.warn('Dashboard data loading exception:', err);
        if (isMounted) {
          setActivitiesError('Activity is temporarily unavailable.');
          setActivitiesLoading(false);
          setHistoryLoading(false);
          setSinceLastVisitLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, business?.profileCompleted, readiness.businessReadiness.score, readiness.creditReadiness.score, fundingReadiness.score, roadmap.percentage]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ConsultationModal
          isOpen={consultationOpen}
          onClose={() => setConsultationOpen(false)}
          userEmail={user?.email}
          userName={user?.name}
        />

        {/* Product Detail Modal */}
        <ProductDetailModal
          isOpen={productModalOpen}
          product={selectedProduct}
          onClose={() => {
            setProductModalOpen(false);
            setSelectedProduct(null);
          }}
          onVisitProvider={(p) => trackProductClick(user?.id, p.id)}
        />

        <div className="space-y-6">
          {/* Admin Platform Announcement Banner */}
          {settings?.messaging?.announcementEnabled && settings?.messaging?.dashboardAnnouncement && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 text-white shadow-xs flex items-start gap-3.5 border border-brand-500/30">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-brand-200" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200 block mb-0.5">
                  Platform Announcement
                </span>
                <p className="text-sm font-medium text-white/95 leading-relaxed">
                  {settings.messaging.dashboardAnnouncement}
                </p>
              </div>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome, {firstName}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {settings?.messaging?.welcomeMessage && settings.messaging.welcomeMessage.trim() !== ''
                  ? settings.messaging.welcomeMessage
                  : isProfileComplete
                  ? `Here is your progress and readiness status for ${business?.businessName || 'your business'}.`
                  : 'Start by completing your business profile to generate your credit roadmap.'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {isAdvisory ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs">
                    <Headphones className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Premium Advisory Active</span>
                  </span>
                  <Link href="/advisory">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                    >
                      Advisory Hub
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCustomerPortal}
                    className="text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Manage Billing
                  </Button>
                </div>
              ) : isPro ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Pro Active</span>
                  </span>
                  <Link href="/advisory">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    >
                      Done-For-You Advisory
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCustomerPortal}
                    className="text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Manage Billing
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                    Free Plan
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={upgradeToPro}
                    className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade to Pro ($39/mo)</span>
                  </Button>
                </div>
              )}

              {sections.consultation !== false && (
                <Link href={isAdvisory ? '/consultation' : '/advisory'}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-brand-300 text-brand-700 bg-brand-50/50 hover:bg-brand-50 text-xs font-semibold"
                  >
                    <CalendarCheck className="w-4 h-4 text-brand-600" />
                    <span>
                      {latestConsultation &&
                      ['Requested', 'Confirmed', 'Rescheduled'].includes(latestConsultation.status)
                        ? 'View Advisory Session'
                        : isAdvisory
                        ? 'Book Monthly Meeting ($0)'
                        : 'Explore Advisory'}
                    </span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Incomplete Profile Prompt */}
          {!isProfileComplete && sections.business_profile !== false && (
            <Card className="border-amber-200 bg-amber-50/40">
              <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      Complete Your Business Profile
                    </h3>
                    <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                      Answer a few simple questions so we can build your personalized roadmap. Zero sensitive info like SSN or bank logins required.
                    </p>
                    <div className="text-xs text-slate-500 pt-1">
                      Current Stage: <strong>&ldquo;Complete your business profile&rdquo;</strong>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Link href="/onboarding">
                    <Button variant="primary" size="lg" className="gap-2 shadow-sm">
                      Complete Profile
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SINCE YOUR LAST VISIT (Section 12) */}
          <SinceLastVisitCard summary={sinceLastVisit} loading={sinceLastVisitLoading} />

          {/* ELEVATED: YOUR NEXT BEST ACTION (Phase 2) */}
          <Card className="border-brand-300 bg-gradient-to-r from-brand-50/80 via-white to-teal-50/50 shadow-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Header Badge & Stage Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-brand-900 bg-brand-100/80 px-2.5 py-0.5 rounded-full border border-brand-200">
                      Your Next Best Action
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                      What should I do next?
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {nextBestStageMeta && (
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      {nextBestStageMeta.title}
                    </span>
                  )}
                  {nextBestTask?.priority && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                      {nextBestTask.priority} Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Action Headline */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isProfileComplete
                    ? nextBestTask?.title || 'Your business credit foundation is in great shape.'
                    : 'Complete your business profile to personalize your roadmap.'}
                </h3>
              </div>

              {/* 2-Column Details: Why This Matters & What To Do */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WHY THIS MATTERS */}
                <div className="p-4 rounded-xl bg-white border border-brand-100 shadow-2xs space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                    <span>Why This Matters</span>
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isProfileComplete
                      ? nextBestTask?.whyItMatters || 'You have satisfied all foundational and credit building milestone tasks. Continue maintaining clean on-time payment history.'
                      : 'Answer our quick foundational questionnaire so Crediqly can assess your compliance status and identify your highest-leverage credit building step.'}
                  </p>
                </div>

                {/* WHAT TO DO */}
                <div className="p-4 rounded-xl bg-white border border-brand-100 shadow-2xs space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>What To Do</span>
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isProfileComplete
                      ? nextBestTask?.whatToDo?.[0] || 'Review available business-credit products that report directly to commercial bureaus.'
                      : 'Complete your 21-point legal entity and commercial profile to activate your live credit score.'}
                  </p>
                </div>
              </div>

              {/* Actions & Progress Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-brand-100/60">
                {/* Progress counter */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-600 font-semibold">
                    <span>Progress: </span>
                    <strong className="text-slate-900 font-bold">
                      {roadmap.completedCount} of {roadmap.applicableTotalCount} major milestones completed
                    </strong>
                  </div>
                  <Link
                    href="/roadmap"
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1"
                  >
                    <span>Continue Roadmap</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5">
                  {isProfileComplete && nextBestTask && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTaskCompletion(nextBestTask.key)}
                      className="text-xs border-brand-200 text-brand-800 hover:bg-brand-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-brand-600" />
                      <span>Mark Complete</span>
                    </Button>
                  )}

                  <Link
                    href={
                      isProfileComplete
                        ? nextBestTask?.actionHref || '/roadmap'
                        : '/onboarding'
                    }
                  >
                    <Button variant="primary" size="sm" className="gap-1.5 whitespace-nowrap shadow-xs bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs">
                      <span>
                        {isProfileComplete
                          ? nextBestTask?.actionLabel || 'View Recommended Options'
                          : 'Complete Business Profile'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Contextual Free vs Pro Notice (Phase 7 & 8) */}
              {!isPro && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      <strong>Pro Insight: </strong>
                      Pro unlocks full step-by-step action guides, direct vendor applications, and Tier 2/3 tradelines.
                    </span>
                  </div>
                  <Link href="/pricing" className="shrink-0 font-bold text-brand-700 hover:underline whitespace-nowrap">
                    Explore Pro ($39/mo) →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CUSTOMER MOTIVATION ENCOURAGEMENT (Phase 10) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50/80 via-white to-teal-50/50 border border-brand-200/80 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 font-bold">Building Momentum: </strong>
                Building business credit takes consistency. Every completed compliance step and reporting tradeline strengthens your commercial standing.
              </div>
            </div>
            {!isPro && (
              <Link href="/pricing" className="shrink-0 hidden sm:block">
                <Button size="sm" variant="outline" className="text-xs font-bold text-brand-700 border-brand-200 hover:bg-brand-50">
                  <span>Explore Pro Roadmap</span>
                </Button>
              </Link>
            )}
          </div>

          {/* MONTHLY BUSINESS CREDIT CHECK-IN */}
          <Card className="border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    checkInDue ? 'bg-amber-50 text-amber-600 border border-amber-200/60' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Monthly Routine
                      </span>
                      {checkInDue ? (
                        <Badge variant="warning" className="text-[10px]">Due for {new Date().toLocaleString('default', { month: 'short' })}</Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">Logged for {latestCheckIn?.monthYear || new Date().toLocaleString('default', { month: 'short' })}</Badge>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {checkInDue ? 'Monthly Business Credit Check-In' : 'Standing Up to Date'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                      {checkInDue
                        ? 'Take 60 seconds to log any new credit accounts, tradelines, or financing inquiries. We will recalibrate your Next Best Action.'
                        : `Your ${latestCheckIn?.monthYear || 'monthly'} check-in is complete. Update anytime if new vendor tradelines or credit cards report.`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link href="/check-in">
                    <Button
                      size="sm"
                      className={`text-xs font-bold gap-1.5 shadow-xs whitespace-nowrap ${
                        checkInDue
                          ? 'bg-brand-600 hover:bg-brand-500 text-white'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{checkInDue ? 'Start Monthly Check-In' : 'Update Check-In'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* YOUR PROGRESS SECTION (Section 2 & 3) */}
          {(sections.business_readiness !== false ||
            sections.credit_readiness !== false ||
            sections.funding_readiness !== false ||
            sections.roadmap !== false) && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    YOUR PROGRESS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Internal readiness metrics and real-time roadmap progression.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero bureau inquiries</span>
                </div>
              </div>

              {/* Score Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Business Readiness Card */}
                {sections.business_readiness !== false && (
                  <Card className="hover:border-brand-300 transition-colors bg-white">
                    <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                      <div className="space-y-3">
                        {/* 1. CURRENT STATUS */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Current Status
                            </span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Business Readiness
                            </h3>
                            <div className="flex items-baseline gap-2 pt-0.5">
                              <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {isProfileComplete ? `${readiness.businessReadiness.score}%` : '--%'}
                              </span>
                              {isProfileComplete && (
                                <Badge variant={getBadgeVariant(readiness.businessReadiness.level)}>
                                  {readiness.businessReadiness.level}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                        </div>

                        <ProgressBar
                          value={isProfileComplete ? readiness.businessReadiness.score : 0}
                          color="brand"
                          showPercentage={false}
                        />

                        {/* 2. WHAT'S GOING WELL */}
                        <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                            What&apos;s Going Well
                          </span>
                          <p className="text-slate-600 leading-relaxed text-xs">
                            {isProfileComplete
                              ? readiness.businessReadiness.description
                              : 'You have a solid starting point. Completing your profile maps your commercial entity structure.'}
                          </p>
                        </div>
                      </div>

                      {/* 3. NEXT BEST ACTION */}
                      <div className="space-y-1 text-xs border-t border-slate-100 pt-3 mt-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
                          Next Best Action
                        </span>
                        <Link
                          href={isProfileComplete ? '/readiness' : '/onboarding'}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                        >
                          <span className="line-clamp-1">
                            {isProfileComplete
                              ? (business?.hasBusinessPhone !== 'yes'
                                  ? 'Add business phone & 411 registry'
                                  : business?.hasDuns !== 'yes'
                                  ? 'Obtain free D-U-N-S number'
                                  : 'Review readiness audit')
                              : 'Complete business profile'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Credit Readiness Card */}
                {sections.credit_readiness !== false && (
                  <Card className="hover:border-brand-300 transition-colors bg-white">
                    <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                      <div className="space-y-3">
                        {/* 1. CURRENT STATUS */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Current Status
                            </span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Credit Readiness
                            </h3>
                            <div className="flex items-baseline gap-2 pt-0.5">
                              <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {isProfileComplete ? `${readiness.creditReadiness.score}%` : '--%'}
                              </span>
                              {isProfileComplete && (
                                <Badge variant={getBadgeVariant(readiness.creditReadiness.level)}>
                                  {readiness.creditReadiness.level}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                        </div>

                        <ProgressBar
                          value={isProfileComplete ? readiness.creditReadiness.score : 0}
                          color="emerald"
                          showPercentage={false}
                        />

                        {/* 2. WHAT'S GOING WELL */}
                        <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                            What&apos;s Going Well
                          </span>
                          <p className="text-slate-600 leading-relaxed text-xs">
                            {isProfileComplete
                              ? readiness.creditReadiness.description
                              : 'Ready to establish your commercial credit profile across major reporting bureaus.'}
                          </p>
                        </div>
                      </div>

                      {/* 3. NEXT BEST ACTION */}
                      <div className="space-y-1 text-xs border-t border-slate-100 pt-3 mt-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
                          Next Best Action
                        </span>
                        <Link
                          href={isProfileComplete ? '/products' : '/onboarding'}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                        >
                          <span className="line-clamp-1">
                            {isProfileComplete
                              ? (business?.hasReportingAccounts !== 'yes'
                                  ? 'Establish first 3 Tier-1 tradelines'
                                  : 'Review trade line catalog')
                              : 'Complete profile for credit score'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Funding Readiness Card */}
                {sections.funding_readiness !== false && (
                  <Card className="hover:border-brand-300 transition-colors bg-white">
                    <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                      <div className="space-y-3">
                        {/* 1. CURRENT STATUS */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Current Status
                            </span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Funding Readiness
                            </h3>
                            <div className="flex items-baseline gap-2 pt-0.5">
                              <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {isProfileComplete ? `${fundingReadiness.score}%` : '--%'}
                              </span>
                              {isProfileComplete && (
                                <Badge variant={getFundingBadgeVariant(fundingReadiness.level)}>
                                  {fundingReadiness.level}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5" />
                          </div>
                        </div>

                        <ProgressBar
                          value={isProfileComplete ? fundingReadiness.score : 0}
                          color="brand"
                          showPercentage={false}
                        />

                        {/* 2. WHAT'S GOING WELL */}
                        <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                            What&apos;s Going Well
                          </span>
                          <p className="text-slate-600 leading-relaxed text-xs">
                            {isProfileComplete
                              ? fundingReadiness.score >= 60
                                ? 'Solid commercial indicators and operating profile active.'
                                : 'Foundational data in place. Key lender parameters are being evaluated.'
                              : 'Capital matching parameters ready to evaluate upon profile completion.'}
                          </p>
                        </div>
                      </div>

                      {/* 3. NEXT BEST ACTION */}
                      <div className="space-y-1 text-xs border-t border-slate-100 pt-3 mt-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
                          Next Best Action
                        </span>
                        <Link
                          href={isProfileComplete ? '/readiness?tab=funding' : '/onboarding'}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                        >
                          <span className="line-clamp-1">
                            {isProfileComplete
                              ? 'Review capital readiness index'
                              : 'Complete profile for matches'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Roadmap Progress Card */}
                {sections.roadmap !== false && (
                  <Card className="hover:border-brand-300 transition-colors bg-white">
                    <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                      <div className="space-y-3">
                        {/* 1. CURRENT STATUS */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Current Status
                            </span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Roadmap Progress
                            </h3>
                            <div className="flex items-baseline gap-2 pt-0.5">
                              <span className="text-3xl font-black text-indigo-900 tracking-tight">
                                {isProfileComplete ? `${roadmap.percentage}%` : '--%'}
                              </span>
                              {isProfileComplete && (
                                <Badge variant="info" className="text-xs font-bold">
                                  {roadmap.completedCount} of {roadmap.applicableTotalCount} Milestones
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <GitFork className="w-5 h-5" />
                          </div>
                        </div>

                        <ProgressBar
                          value={isProfileComplete ? roadmap.percentage : 0}
                          color="brand"
                          showPercentage={false}
                        />

                        {/* 2. WHAT'S GOING WELL */}
                        <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                            What&apos;s Going Well
                          </span>
                          <p className="text-slate-600 leading-relaxed text-xs">
                            {isProfileComplete
                              ? `${roadmap.completedCount} of ${roadmap.applicableTotalCount} milestones completed across active readiness stages.`
                              : 'Personalized sequence ready to generate from your business profile.'}
                          </p>
                        </div>
                      </div>

                      {/* 3. NEXT BEST ACTION */}
                      <div className="space-y-1 text-xs border-t border-slate-100 pt-3 mt-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
                          Next Best Action
                        </span>
                        <Link
                          href={isProfileComplete ? '/roadmap' : '/onboarding'}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
                        >
                          <span className="line-clamp-1">
                            {isProfileComplete
                              ? `Next milestone: ${nextBestTask?.title || 'Continue active milestone'}`
                              : 'Complete profile to begin'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* STAGE PROGRESS & MILESTONES (Section 4, 5, 6) */}
          {sections.roadmap !== false && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StageProgressList stages={roadmap.stages} />
              <MilestoneTimeline milestones={milestones} />
            </div>
          )}

          {/* RECENT ACTIVITY & PROGRESS HISTORY (Section 7, 16, 17) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivityList
              activities={activities}
              loading={activitiesLoading}
              error={activitiesError}
            />
            <ProgressHistoryCard
              history={history}
              currentBusinessReadiness={readiness.businessReadiness.score}
              currentCreditReadiness={readiness.creditReadiness.score}
              loading={historyLoading}
            />
          </div>

          {/* FUNDING ACTIVITY TRACKER SECTION (Step 11 Section 5) */}
          {sections.funding_tracker !== false && (
            <Card className="border-slate-200/90 bg-white shadow-xs overflow-hidden">
              <CardContent className="p-5 sm:p-6 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Funding Activity</h3>
                      <p className="text-xs text-slate-500">
                        {trackedApps.length > 0
                          ? `${trackedApps.length} ${trackedApps.length === 1 ? 'application' : 'applications'} being tracked`
                          : 'No active funding opportunities tracked yet'}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/funding-tracker"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>View Funding Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {trackedApps.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-400 space-y-2">
                    <p>Explore recommended funding options and track your applications in real time.</p>
                    <Link href="/funding">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5">
                        <span>Explore Funding Options</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trackedApps.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                            {app.providerName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{app.providerName}</span>
                            <span className="text-slate-400 mx-1.5">•</span>
                            <span className="text-slate-600 font-medium">{app.productName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {app.requestedAmount && app.requestedAmount > 0 ? (
                            <span className="text-slate-500 font-semibold">
                              ${app.requestedAmount.toLocaleString()}
                            </span>
                          ) : null}
                          <Badge
                            variant={
                              ['Approved', 'Funded'].includes(app.status)
                                ? 'success'
                                : ['Applied', 'Submitted'].includes(app.status)
                                ? 'info'
                                : app.status === 'Documents Requested'
                                ? 'warning'
                                : app.status === 'Declined'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* RECOMMENDED FOR YOU SECTION (Prompt 18) */}
          {sections.products !== false && dashboardRecommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Recommended for You
                    </h3>
                    <p className="text-xs text-slate-500">
                      Based on your current business profile and credit roadmap stage.
                    </p>
                  </div>
                </div>

                <Link
                  href="/products"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View All Credit Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {dashboardRecommendations.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onOpenDetail={(p) => {
                      setSelectedProduct(p);
                      setProductModalOpen(true);
                    }}
                    onVisitProvider={(p) => trackProductClick(user?.id, p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* WHAT AFFECTS YOUR READINESS BREAKDOWN */}
          {isProfileComplete && (sections.business_readiness !== false || sections.credit_readiness !== false) && (
            <Card className="border-slate-200">
              <CardContent className="p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    What affects your readiness?
                  </h3>
                  <span className="text-xs text-slate-500">
                    High-level category progress breakdown
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Factors */}
                  {sections.business_readiness !== false && (
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Business Readiness Factors
                      </h4>
                      {readiness.businessReadiness.breakdown.map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{item.label}</span>
                            <span className="text-slate-500 font-medium">
                              {item.completed} / {item.total} completed
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Credit Factors */}
                  {sections.credit_readiness !== false && (
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Credit Readiness Factors
                      </h4>
                      {readiness.creditReadiness.breakdown.map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{item.label}</span>
                            <span className="text-slate-500 font-medium">
                              {item.completed} / {item.total} pts
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Educational Disclaimer */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-500">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Educational Disclaimer:</strong> Crediqly Readiness scores are educational estimates based on the information you provide. They are not official credit bureau scores and do not guarantee approval for credit or funding.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Profile Details (when complete) */}
          {isProfileComplete && business && sections.business_profile !== false && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Business Profile Complete
                      </h3>
                      <p className="text-xs text-slate-500">
                        {business.businessName} • {business.entityType} • {business.state}
                      </p>
                    </div>
                  </div>

                  <Link href="/business">
                    <Button variant="outline" size="sm">
                      Edit Business Profile
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Business Name</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {business.businessName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Structure</span>
                    <span className="font-semibold text-slate-700">
                      {business.entityType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">State</span>
                    <span className="font-semibold text-slate-700">
                      {business.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Industry</span>
                    <span className="font-semibold text-slate-700">
                      {business.industry}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Business Age</span>
                    <span className="font-semibold text-slate-700">
                      {business.businessAge}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Cards */}
          {(sections.roadmap !== false || sections.consultation !== false) && (
            <div className={`grid grid-cols-1 ${sections.roadmap !== false && sections.consultation !== false ? 'md:grid-cols-2' : ''} gap-6`}>
              {sections.roadmap !== false && (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <GitBranch className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Credit Roadmap
                        </h4>
                        <p className="text-xs text-slate-500">
                          Step-by-step milestones to tier-1 vendor credit
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Learn how net-30 accounts, EIN foundation items, and bureau reporting accounts establish your creditworthiness.
                    </p>
                    <div className="pt-2">
                      <Link href="/roadmap">
                        <Button variant="outline" size="sm" className="w-full">
                          View Roadmap
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* NEED EXPERT HELP? / CONSULTATION SECTION (Step 12) */}
              {sections.consultation !== false && (
                <Card className="border-slate-200/90 bg-white shadow-xs">
                  <CardContent className="p-6 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                          <CalendarCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            Need Expert Help?
                          </h4>
                          <p className="text-xs text-slate-500">
                            1-on-1 strategic guidance with a business credit advisor
                          </p>
                        </div>
                      </div>
                      {latestConsultation && (
                        <Badge
                          variant={
                            latestConsultation.status === 'Confirmed'
                              ? 'success'
                              : latestConsultation.status === 'Rescheduled'
                              ? 'warning'
                              : latestConsultation.status === 'Requested'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {latestConsultation.status}
                        </Badge>
                      )}
                    </div>

                    {latestConsultation && ['Requested', 'Confirmed', 'Rescheduled'].includes(latestConsultation.status) ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                          <div className="font-semibold text-slate-900">
                            Your consultation: {latestConsultation.status}
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            {latestConsultation.status === 'Confirmed' && latestConsultation.confirmedDate
                              ? `Confirmed for ${new Date(latestConsultation.confirmedDate + 'T00:00:00').toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })} at ${latestConsultation.confirmedTime || latestConsultation.preferredTime}.`
                              : `Scheduled request for ${new Date(latestConsultation.preferredDate + 'T00:00:00').toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })} (${latestConsultation.preferredTime}).`}
                          </p>
                        </div>
                        <Link href="/consultation" className="block">
                          <Button variant="primary" size="sm" className="w-full gap-1.5">
                            <span>View Consultation</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Not sure what to do next? Request a consultation with the Crediqly team.
                        </p>
                        <Link href="/consultation" className="block">
                          <Button variant="primary" size="sm" className="w-full gap-1.5">
                            <span>Book a Consultation</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
