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
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConsultationModal } from '@/components/ui/ConsultationModal';
import { calculateReadiness, calculateProfileCompletion } from '@/lib/scoring';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { calculateMilestoneReadiness } from '@/lib/readiness/readinessMilestoneEngine';
import { calculateCustomerJourney } from '@/lib/roadmap/customerJourney';
import { CustomerJourneyCard } from '@/components/dashboard/CustomerJourneyCard';
import { WhatShouldIDoNextCard } from '@/components/dashboard/WhatShouldIDoNextCard';
import { getTopRecommendedActions } from '@/lib/recommendations/nextActionsEngine';
import { getPersonalizedFundingMatches } from '@/lib/funding/personalizedMatchesEngine';
import { FundingMatchesForYouCard } from '@/components/funding/FundingMatchesForYouCard';
import { CrediqlyAIMentorCard } from '@/components/dashboard/CrediqlyAIMentorCard';
import { PersonalizedRecommendationsCard } from '@/components/dashboard/PersonalizedRecommendationsCard';
import {
  getUnifiedDashboardRecommendations,
  UnifiedDashboardRecommendations,
} from '@/lib/recommendations/unifiedRecommendationService';
import type { SafeCustomerAIContext } from '@/types/aiMentor';
import { buildSafeCustomerAIContext } from '@/lib/ai/aiContextBuilder';
import { getFundingProducts } from '@/lib/supabase/fundingProductService';
import { FundingProduct } from '@/types/fundingProduct';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useSubscription } from '@/context/SubscriptionContext';
import { getProgressHistory, recordProgressSnapshot } from '@/lib/supabase/progressService';
import { updateLastSeenAt } from '@/lib/supabase/lastSeenService';
import { ProgressHistoryItem } from '@/types/progress';
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
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Zap,
  Building2,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { business } = useBusiness();
  const { roadmap, completedTasks, toggleTaskCompletion } = useRoadmap();
  const { sections, settings } = usePlatformSections();
  const {
    isFoundation,
    isGuided,
    isPro,
    isAdvisory,
    upgradeToFoundation,
    upgradeToGuided,
    requestIntensive,
    openCustomerPortal,
    refreshSubscription,
    verifyCheckoutSession,
  } = useSubscription();

  const hasFoundation = isFoundation || isPro;
  const hasGuided = isGuided || isAdvisory;
  const [upgradedNotice, setUpgradedNotice] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);

  // Check for checkout return upgrade query param or session_id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isUpgraded = params.get('upgraded') === 'true';
      const sessionId = params.get('session_id');

      if (isUpgraded || sessionId) {
        setUpgradedNotice(true);
        if (sessionId) {
          verifyCheckoutSession(sessionId);
        } else {
          refreshSubscription();
        }
      }
    }
  }, [verifyCheckoutSession, refreshSubscription]);

  // Redirect administrators to admin portal
  useEffect(() => {
    if (user && user.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, router]);

  const [history, setHistory] = useState<ProgressHistoryItem[]>([]);
  const [trackedApps, setTrackedApps] = useState<FundingApplication[]>([]);
  const [fundingProducts, setFundingProducts] = useState<FundingProduct[]>([]);
  const [latestConsultation, setLatestConsultation] = useState<Consultation | null>(null);
  const [checkInDue, setCheckInDue] = useState(false);
  const [latestCheckIn, setLatestCheckIn] = useState<MonthlyCheckInRecord | null>(null);
  const [unifiedRecommendations, setUnifiedRecommendations] = useState<UnifiedDashboardRecommendations | null>(null);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Business Owner';
  const isProfileComplete = Boolean(business && business.profileCompleted);

  // Compute live readiness metrics from profile
  const readiness = calculateReadiness(business);
  const fundingReadiness = useMemo(() => calculateFundingReadiness(business), [business]);

  // Compute profile completion percentage
  const profileCompletionPercentage = useMemo(() => {
    return calculateProfileCompletion(business);
  }, [business]);

  // Compute deterministic 5/6-stage Customer Journey
  const customerJourney = useMemo(() => {
    return calculateCustomerJourney(
      business,
      readiness.businessReadiness,
      readiness.creditReadiness,
      fundingReadiness,
      trackedApps.length
    );
  }, [business, readiness.businessReadiness, readiness.creditReadiness, fundingReadiness, trackedApps.length]);

  // Compute 14 authoritative milestone readiness status
  const milestoneReadiness = useMemo(() => {
    return calculateMilestoneReadiness(business, completedTasks);
  }, [business, completedTasks]);

  // Compute 4 authoritative pillar breakdown
  const pillarBreakdown = useMemo(() => {
    const pillars = {
      foundation: { label: 'Entity Foundation', completed: 0, total: 25 },
      bureau_tradelines: { label: 'Bureau Tradelines', completed: 0, total: 25 },
      revolving_seasoning: { label: 'Revolving & Seasoning', completed: 0, total: 25 },
      funding_readiness: { label: 'Funding Profile', completed: 0, total: 25 },
    };

    if (milestoneReadiness?.items) {
      for (const item of milestoneReadiness.items) {
        const cat = item.definition.category;
        if (pillars[cat] && item.isCompleted) {
          pillars[cat].completed += item.definition.weight;
        }
      }
    }

    return pillars;
  }, [milestoneReadiness]);

  // Derive biggest single opportunity from next milestone
  const biggestOpportunity = useMemo(() => {
    if (milestoneReadiness?.nextMilestone) {
      return milestoneReadiness.nextMilestone;
    }
    return null;
  }, [milestoneReadiness]);

  // Dynamic time-of-day greeting
  const [timeOfDayGreeting, setTimeOfDayGreeting] = useState('Good morning');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDayGreeting('Good morning');
    else if (hour < 17) setTimeOfDayGreeting('Good afternoon');
    else setTimeOfDayGreeting('Good evening');
  }, []);

  // Compute top recommended next actions
  const topRecommendedActions = useMemo(() => {
    return getTopRecommendedActions(business, roadmap, fundingReadiness);
  }, [business, roadmap, fundingReadiness]);

  // Compute personalized funding matches
  const personalizedFundingMatches = useMemo(() => {
    return getPersonalizedFundingMatches(business, fundingReadiness.score, fundingProducts);
  }, [business, fundingReadiness.score, fundingProducts]);

  // Construct safe customer context for Crediqly AI Advisor
  const aiMentorContext: SafeCustomerAIContext = useMemo(() => {
    return buildSafeCustomerAIContext({
      business,
      completedTasks,
      fundingProducts,
      subscriptionTier: hasGuided ? 'Guided' : hasFoundation ? 'Foundation' : 'Free',
      isAdvisory: hasGuided,
      isGuided: hasGuided,
      isFoundation: hasFoundation,
      roadmap,
    });
  }, [
    business,
    completedTasks,
    fundingProducts,
    hasFoundation,
    hasGuided,
    roadmap,
  ]);

  // Load essential dashboard data on mount
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    async function loadEssentialData() {
      try {
        await updateLastSeenAt(user!.id);

        const [hist, apps, consults, isDue, latestCheck, fundingProds] = await Promise.all([
          getProgressHistory(user!.id, 6).catch(() => []),
          getUserFundingApplications(user!.id).catch(() => []),
          getUserConsultations(user!.id).catch(() => []),
          isCheckInDue(user!.id).catch(() => false),
          getLatestCheckIn(user!.id).catch(() => null),
          getFundingProducts().catch(() => []),
        ]);

        if (isMounted) {
          setHistory(hist);
          setTrackedApps(apps);
          setFundingProducts(fundingProds);
          const active = consults.find((c) =>
            ['Requested', 'Confirmed', 'Rescheduled'].includes(c.status)
          ) || consults[0] || null;
          setLatestConsultation(active);
          setCheckInDue(isDue);
          setLatestCheckIn(latestCheck);
        }

        if (business && business.profileCompleted) {
          await recordProgressSnapshot(user!.id, {
            businessId: business.businessId,
            businessReadinessScore: readiness.businessReadiness.score,
            creditReadinessScore: readiness.creditReadiness.score,
            fundingReadinessScore: fundingReadiness.score,
            roadmapProgress: roadmap.percentage,
          }).catch(() => {});
        }
      } catch (err: any) {
        console.warn('Dashboard essential data loading exception:', err);
      }
    }

    loadEssentialData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, business?.profileCompleted, readiness.businessReadiness.score, readiness.creditReadiness.score, fundingReadiness.score, roadmap.percentage]);

  // Load unified recommendations
  useEffect(() => {
    let isMounted = true;
    async function loadUnified() {
      try {
        const recs = await getUnifiedDashboardRecommendations(business, roadmap, fundingReadiness.score);
        if (isMounted) {
          setUnifiedRecommendations(recs);
        }
      } catch (err) {
        console.warn('Failed to load unified recommendations:', err);
      }
    }
    loadUnified();
    return () => {
      isMounted = false;
    };
  }, [business, roadmap, fundingReadiness.score]);

  // Determine stage readiness status label
  const readinessLabel = useMemo(() => {
    if (fundingReadiness.score >= 75) return 'Funding Ready';
    if (fundingReadiness.score >= 50) return 'Building Readiness';
    if (fundingReadiness.score >= 25) return 'Developing Foundation';
    return 'Initial Setup';
  }, [fundingReadiness.score]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ConsultationModal
          isOpen={consultationOpen}
          onClose={() => setConsultationOpen(false)}
          userEmail={user?.email}
          userName={user?.name}
        />

        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          {/* Admin Platform Announcement Banner */}
          {settings?.messaging?.announcementEnabled && settings?.messaging?.dashboardAnnouncement && (
            <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs flex items-start gap-3.5 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Platform Update
                </span>
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {settings.messaging.dashboardAnnouncement}
                </p>
              </div>
            </div>
          )}

          {/* Pro Upgrade Return Banner */}
          {upgradedNotice && (
            <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm flex items-start justify-between gap-3.5 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Plan Activated
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Full commercial credit building roadmap stages, verified reporting tradelines, and funding readiness intelligence are unlocked.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUpgradedNotice(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-white/5 hover:bg-white/10 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* ZONE 1: WELCOME & EXECUTIVE COMMAND HEADER                        */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    STAGE {customerJourney.activeStepNumber}: {customerJourney.currentStageLabel.toUpperCase()}
                  </span>
                  <span className="text-slate-300">•</span>
                  <StatusBadge
                    status={isProfileComplete ? 'Verified' : 'Needs Attention'}
                    size="sm"
                  />
                  {hasGuided && (
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Guided Member
                    </span>
                  )}
                  {hasFoundation && !hasGuided && (
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Foundation Member
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {timeOfDayGreeting}, {business?.businessName || firstName}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Your central command for building commercial credit, establishing reporting tradelines, and preparing for institutional capital.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                <Link href="/business">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs font-semibold h-8 text-slate-700"
                  >
                    <span>Business Profile</span>
                  </Button>
                </Link>

                <Link href="/roadmap">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold h-8 bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  >
                    <span>View Roadmap</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Profile Meta Pills */}
            {isProfileComplete && business && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-bold text-slate-900">{business.businessName}</span>
                  <span className="text-slate-300">•</span>
                  <span>{business.entityType}</span>
                  <span className="text-slate-300">•</span>
                  <span>{business.state}</span>
                  <span className="text-slate-300">•</span>
                  <span>{business.businessAge}</span>
                </div>

                <Link
                  href="/business"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                  <span>Edit Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Incomplete Profile Alert (When profile questions need completion) */}
          {!isProfileComplete && sections.business_profile !== false && (
            <Card className="border-slate-200/90 bg-white shadow-xs rounded-2xl p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Complete Business Profile
                      </h3>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {profileCompletionPercentage}% complete
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      Answer foundational business details to verify your commercial identity and activate tailored recommendations.
                    </p>
                  </div>
                </div>

                <Link href="/onboarding" className="shrink-0">
                  <Button variant="primary" size="sm" className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs gap-1.5">
                    <span>Continue Profile Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* ================================================================= */}
          {/* ZONE 2: HERO READINESS BLOCK (Authoritative 0-100 & 4 Pillars)    */}
          {/* ================================================================= */}
          {sections.funding_readiness !== false && (
            <Card className="border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Authoritative 0-100 Readiness Display */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          READINESS INDEX
                        </span>
                        <StatusBadge
                          status={
                            fundingReadiness.score >= 70
                              ? 'Strong Match'
                              : fundingReadiness.score >= 50
                              ? 'Potential Match'
                              : 'Not Recommended Yet'
                          }
                          size="sm"
                        />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 tracking-tight">
                          {fundingReadiness.score}
                        </span>
                        <span className="text-base font-bold text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      <strong>Current Standing:</strong> {fundingReadiness.level}. Evaluated across {milestoneReadiness.totalMilestonesCount} institutional underwriting benchmarks.
                    </p>

                    <div className="pt-1">
                      <Link href="/readiness">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs font-semibold text-slate-800 gap-1.5 h-8 shadow-2xs"
                        >
                          <span>View Full Readiness Audit</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: 4-Pillar Underwriting Breakdown */}
                  <div className="lg:col-span-7 space-y-3.5 lg:border-l lg:border-slate-100 lg:pl-8">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        UNDERWRITING PILLARS
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {milestoneReadiness.completedMilestonesCount} of {milestoneReadiness.totalMilestonesCount} milestones completed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Pillar 1: Entity Foundation */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{pillarBreakdown.foundation.label}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {pillarBreakdown.foundation.completed}/{pillarBreakdown.foundation.total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(pillarBreakdown.foundation.completed / pillarBreakdown.foundation.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Pillar 2: Bureau Tradelines */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{pillarBreakdown.bureau_tradelines.label}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {pillarBreakdown.bureau_tradelines.completed}/{pillarBreakdown.bureau_tradelines.total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(pillarBreakdown.bureau_tradelines.completed / pillarBreakdown.bureau_tradelines.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Pillar 3: Revolving Credit */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{pillarBreakdown.revolving_seasoning.label}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {pillarBreakdown.revolving_seasoning.completed}/{pillarBreakdown.revolving_seasoning.total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(pillarBreakdown.revolving_seasoning.completed / pillarBreakdown.revolving_seasoning.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Pillar 4: Funding Profile */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{pillarBreakdown.funding_readiness.label}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {pillarBreakdown.funding_readiness.completed}/{pillarBreakdown.funding_readiness.total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(pillarBreakdown.funding_readiness.completed / pillarBreakdown.funding_readiness.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================================================= */}
          {/* ZONE 3: DOMINANT ACTION UNIT (What Should I Do Next?)              */}
          {/* ================================================================= */}
          {sections.roadmap !== false && (
            <div id="next-actions">
              <WhatShouldIDoNextCard
                actions={topRecommendedActions}
                onToggleComplete={toggleTaskCompletion}
                isPro={hasFoundation}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* ZONE 4: COMPACT HORIZONTAL JOURNEY PIPELINE                       */}
          {/* ================================================================= */}
          {sections.roadmap !== false && (
            <CustomerJourneyCard journey={customerJourney} />
          )}

          {/* ================================================================= */}
          {/* ZONE 5: HIGHEST-LEVERAGE OPPORTUNITY (Authoritative Gap Analysis) */}
          {/* ================================================================= */}
          {biggestOpportunity && (
            <Card className="border-slate-200/90 bg-white shadow-xs rounded-2xl p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-slate-500" />
                      <span>YOUR HIGHEST-LEVERAGE OPPORTUNITY</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      +{biggestOpportunity.weight} pts impact
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {biggestOpportunity.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                    {biggestOpportunity.whyItMatters}
                  </p>
                </div>

                <div className="shrink-0 self-start sm:self-auto">
                  <Link href={biggestOpportunity.actionHref}>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs gap-1.5 whitespace-nowrap"
                    >
                      <span>{biggestOpportunity.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* ================================================================= */}
          {/* ZONE 6: CURATED RECOMMENDATIONS & STAGE-MATCHED FUNDING           */}
          {/* ================================================================= */}
          {sections.products !== false && unifiedRecommendations && (
            <PersonalizedRecommendationsCard data={unifiedRecommendations} />
          )}

          {sections.funding !== false && (
            <div className="space-y-4">
              {fundingReadiness.score < 50 ? (
                <Card className="border-slate-200/90 bg-slate-50/60 shadow-2xs rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded">
                          STAGE 5: CAPITAL &amp; FUNDING
                        </span>
                        <span className="text-xs text-slate-400 font-medium">• Upcoming Stage</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Funding is an upcoming milestone for your profile
                      </h3>
                      <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                        Your business is in the foundational credit-building stage. Focus on completing your entity and establishing 3+ reporting tradelines to qualify for prime institutional terms.
                      </p>
                    </div>

                    <Link href="/funding" className="shrink-0">
                      <Button variant="secondary" size="sm" className="text-xs font-semibold gap-1.5 text-slate-800 shadow-2xs">
                        <span>Funding Prerequisites</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <FundingMatchesForYouCard
                  matches={personalizedFundingMatches}
                  isPro={hasFoundation}
                />
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* ZONE 7: CREDIQLY AI ADVISOR SUPPORT                               */}
          {/* ================================================================= */}
          {sections.ai_mentor !== false && (
            <div id="ai-mentor">
              <CrediqlyAIMentorCard context={aiMentorContext} />
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
