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
import { ConsultationModal } from '@/components/ui/ConsultationModal';
import { calculateReadiness, calculateProfileCompletion } from '@/lib/scoring';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { calculateCustomerJourney } from '@/lib/roadmap/customerJourney';
import { CustomerJourneyCard } from '@/components/dashboard/CustomerJourneyCard';
import { GuidedJourneyCard } from '@/components/dashboard/GuidedJourneyCard';
import { FundingReadinessScoreCard } from '@/components/dashboard/FundingReadinessScoreCard';
import { WhatShouldIDoNextCard } from '@/components/dashboard/WhatShouldIDoNextCard';
import { getTopRecommendedActions } from '@/lib/recommendations/nextActionsEngine';
import { getPersonalizedFundingMatches } from '@/lib/funding/personalizedMatchesEngine';
import { FundingMatchesForYouCard } from '@/components/funding/FundingMatchesForYouCard';
import { calculateFundingForecast } from '@/lib/forecast/fundingForecastEngine';
import { FundingForecastCard } from '@/components/dashboard/FundingForecastCard';
import { CrediqlyAIMentorCard } from '@/components/dashboard/CrediqlyAIMentorCard';
import { PersonalizedRecommendationsCard } from '@/components/dashboard/PersonalizedRecommendationsCard';
import {
  getUnifiedDashboardRecommendations,
  UnifiedDashboardRecommendations,
} from '@/lib/recommendations/unifiedRecommendationService';
import type { SafeCustomerAIContext } from '@/types/aiMentor';
import { evaluateMajorReadinessAreas } from '@/lib/readiness/fundingFactors';
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
  CalendarCheck,
  Building2,
  ShieldCheck,
  Compass,
  Sparkles,
  Headphones,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { business, refreshBusiness } = useBusiness();
  const { roadmap, completedTasks, toggleTaskCompletion, markActionCompleted, undoActionCompletion } = useRoadmap();
  const { sections, settings } = usePlatformSections();
  const { isPro, isAdvisory, upgradeToPro, openCustomerPortal, refreshSubscription, verifyCheckoutSession } = useSubscription();
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

  // Compute previous funding score from progress history for monthly delta
  const previousFundingScore = useMemo(() => {
    if (!history || history.length < 2) return undefined;
    for (let i = 1; i < history.length; i++) {
      if (typeof history[i].fundingReadinessScore === 'number') {
        return history[i].fundingReadinessScore;
      }
    }
    return undefined;
  }, [history]);

  // Compute top 3 recommended next actions (Phase B)
  const topRecommendedActions = useMemo(() => {
    return getTopRecommendedActions(business, roadmap, fundingReadiness);
  }, [business, roadmap, fundingReadiness]);

  // Compute personalized funding matches (Phase D)
  const personalizedFundingMatches = useMemo(() => {
    return getPersonalizedFundingMatches(business, fundingReadiness.score, fundingProducts);
  }, [business, fundingReadiness.score, fundingProducts]);

  // Compute 90-day funding forecast & cash-flow profile (Phase F)
  const fundingForecast = useMemo(() => {
    return calculateFundingForecast(business, fundingReadiness.score, latestCheckIn);
  }, [business, fundingReadiness.score, latestCheckIn]);

  // Construct safe customer context for Crediqly AI Mentor (Phase E)
  const aiMentorContext: SafeCustomerAIContext = useMemo(() => {
    const rawPurpose = Array.isArray(business?.fundingPurpose)
      ? business?.fundingPurpose.join(', ')
      : business?.fundingPurpose || '';

    const matchesList = [];
    if (personalizedFundingMatches.strongMatch) {
      matchesList.push({
        tier: personalizedFundingMatches.strongMatch.badgeLabel,
        category: personalizedFundingMatches.strongMatch.category,
        range: personalizedFundingMatches.strongMatch.estimatedRange,
      });
    }
    if (personalizedFundingMatches.possibleMatch) {
      matchesList.push({
        tier: personalizedFundingMatches.possibleMatch.badgeLabel,
        category: personalizedFundingMatches.possibleMatch.category,
        range: personalizedFundingMatches.possibleMatch.estimatedRange,
      });
    }
    if (personalizedFundingMatches.improveReadinessMatch) {
      matchesList.push({
        tier: personalizedFundingMatches.improveReadinessMatch.badgeLabel,
        category: personalizedFundingMatches.improveReadinessMatch.category,
        range: personalizedFundingMatches.improveReadinessMatch.estimatedRange,
      });
    }

    const majorAreas = evaluateMajorReadinessAreas(business || {});

    return {
      businessName: business?.businessName,
      fundingReadinessScore: fundingReadiness.score,
      readinessLevel: fundingReadiness.level,
      businessReadinessScore: readiness.businessReadiness.score,
      creditReadinessScore: readiness.creditReadiness.score,
      profileCompleted: Boolean(business?.profileCompleted),
      profileCompletionPercentage,
      businessAge: business?.businessAge,
      annualRevenue: business?.annualRevenueRange,
      personalCreditTier: business?.personalCreditRange,
      hasBusinessCreditProfile: business?.hasBusinessCreditProfile,
      entityType: business?.entityType,
      fundingGoal: rawPurpose,
      currentJourneyStage: customerJourney.currentStageLabel || customerJourney.activeStep?.fullTitle || '01 — ESTABLISH',
      readinessFactors: majorAreas.map((a) => ({
        area: a.name,
        status: a.indicator === 'green' ? 'strong' : a.indicator === 'amber' ? 'good' : 'needs_improvement',
        score: a.indicator === 'green' ? 90 : a.indicator === 'amber' ? 70 : 45,
      })),
      topNextActions: topRecommendedActions.map((a) => ({
        title: a.title,
        priority: a.priority,
        category: a.category,
      })),
      fundingMatches: matchesList,
    };
  }, [
    business,
    fundingReadiness,
    readiness,
    profileCompletionPercentage,
    customerJourney.currentStageLabel,
    customerJourney.activeStep?.fullTitle,
    topRecommendedActions,
    personalizedFundingMatches,
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

        // Record initial snapshot if profile is complete
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

  // Load unified recommendations (Net-30, Credit Cards, Loans)
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ConsultationModal
          isOpen={consultationOpen}
          onClose={() => setConsultationOpen(false)}
          userEmail={user?.email}
          userName={user?.name}
        />

        <div className="space-y-7 max-w-5xl mx-auto">
          {/* Admin Platform Announcement Banner */}
          {settings?.messaging?.announcementEnabled && settings?.messaging?.dashboardAnnouncement && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 text-white shadow-xs flex items-start gap-3.5 border border-brand-500/30">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
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

          {/* Pro Upgrade Welcome Banner */}
          {upgradedNotice && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md flex items-start justify-between gap-3.5 border border-emerald-400/30">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    Welcome to Crediqly Pro! Your full access is active.
                  </h4>
                  <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                    Your account has been upgraded. Full commercial credit building roadmap stages, verified reporting tradelines, and advanced funding readiness insights are completely unlocked.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUpgradedNotice(false)}
                className="text-white/90 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/10 hover:bg-black/20 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. WELCOME / BUSINESS OVERVIEW HEADER (Command Center)           */}
          {/* ================================================================= */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full">
                    COMMAND CENTER
                  </span>
                  {isProfileComplete && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Profile Verified</span>
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome, {firstName}
                </h1>
                <p className="text-sm text-slate-500">
                  {settings?.messaging?.welcomeMessage && settings.messaging.welcomeMessage.trim() !== ''
                    ? settings.messaging.welcomeMessage
                    : isProfileComplete
                    ? `Commercial credit & funding readiness command center for ${business?.businessName || 'your business'}.`
                    : 'Start by completing your business profile to generate your tailored credit roadmap.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {isAdvisory ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold shadow-2xs">
                    <Headphones className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Premium Advisory Active</span>
                  </span>
                ) : isPro ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Pro Active</span>
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={upgradeToPro}
                    className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade to Pro ($39/mo)</span>
                  </Button>
                )}

                {sections.consultation !== false && (
                  <Link href={isAdvisory ? '/consultation' : '/advisory'}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-slate-300 text-slate-800 bg-white hover:bg-slate-50 text-xs font-semibold"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-brand-600" />
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

            {/* Business Metadata Row (when profile is complete) */}
            {isProfileComplete && business && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-600">
                  <span className="font-bold text-slate-900">{business.businessName}</span>
                  <span className="text-slate-300">•</span>
                  <span>{business.entityType}</span>
                  <span className="text-slate-300">•</span>
                  <span>{business.state}</span>
                  <span className="text-slate-300">•</span>
                  <span>{business.businessAge}</span>
                  {business.industry && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>{business.industry}</span>
                    </>
                  )}
                </div>

                <Link
                  href="/business"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  <span>Edit Profile Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Incomplete Profile Progress Card */}
          {!isProfileComplete && sections.business_profile !== false && (
            <Card className="border-amber-300 bg-amber-50/60 shadow-xs overflow-hidden">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                      <AlertCircle className="w-6 h-6 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">
                          Complete Your Business Profile
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200/80 text-amber-900 border border-amber-300">
                          Profile completion: {profileCompletionPercentage}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
                        Answer foundational questions to activate your commercial credit readiness scores and generate your tailored 5-stage funding roadmap.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link href="/onboarding">
                      <Button variant="primary" size="md" className="gap-2 shadow-xs font-bold whitespace-nowrap bg-amber-600 hover:bg-amber-500 text-white">
                        <span>Continue Setup</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Profile Completion Progress Bar */}
                <div className="space-y-1.5 pt-3 border-t border-amber-200/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Profile Questions Answered</span>
                    <span className="text-amber-800 font-bold">{profileCompletionPercentage}% Complete</span>
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, profileCompletionPercentage)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================================================= */}
          {/* 2. GUIDED BUSINESS CREDIT & FUNDING JOURNEY (Consolidated)        */}
          {/* ================================================================= */}
          <GuidedJourneyCard
            journey={customerJourney}
            fundingReadiness={fundingReadiness}
            business={business}
            history={history}
            actions={topRecommendedActions}
            completedTasks={completedTasks}
            milestoneOverrides={settings?.readinessMilestoneSettings?.milestoneOverrides}
            onToggleComplete={toggleTaskCompletion}
            onMarkActionComplete={markActionCompleted}
            onUndoActionComplete={undoActionCompletion}
            onReassessReadiness={refreshBusiness}
            isPro={isPro}
            isAdvisory={isAdvisory}
            onUpgradeToPro={upgradeToPro}
          />

          {/* ================================================================= */}
          {/* 3. DETAILED FUNDING READINESS AUDIT BREAKDOWN                      */}
          {/* ================================================================= */}
          {sections.funding_readiness !== false && (
            <div className="space-y-3">
              <FundingReadinessScoreCard
                profile={business}
                fundingReadiness={fundingReadiness}
                previousScore={previousFundingScore}
              />
              <div className="flex justify-end">
                <Link
                  href="/readiness"
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1.5"
                >
                  <span>View Full Readiness Audit &amp; Gap Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5B. EXPANDED PERSONALIZED RECOMMENDATIONS (Net-30, Cards, Loans)  */}
          {/* ================================================================= */}
          {unifiedRecommendations && (
            <PersonalizedRecommendationsCard data={unifiedRecommendations} />
          )}

          {/* ================================================================= */}
          {/* 6. FUNDING OPPORTUNITIES & FORECAST (Phase D & Phase F)           */}
          {/* ================================================================= */}
          {sections.funding !== false && (
            <div className="space-y-4">
              <FundingMatchesForYouCard
                matches={personalizedFundingMatches}
                isPro={isPro}
              />

              {sections.funding_forecast !== false && (
                <FundingForecastCard
                  forecast={fundingForecast}
                  isPro={isPro}
                />
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. CREDIQLY AI MENTOR (Phase E)                                  */}
          {/* ================================================================= */}
          {sections.ai_mentor !== false && (
            <CrediqlyAIMentorCard context={aiMentorContext} />
          )}

          {/* ================================================================= */}
          {/* 8. CURRENT PLAN / UPGRADE SUMMARY (Compact)                       */}
          {/* ================================================================= */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                  isAdvisory ? 'bg-indigo-600' : isPro ? 'bg-brand-600' : 'bg-slate-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Current Plan:
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {isAdvisory ? 'Premium Advisory' : isPro ? 'Crediqly Pro — $39/mo' : 'Free Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAdvisory
                    ? 'Full access to all 6 roadmap tiers, dedicated 1-on-1 advisor sessions, and tradeline concierge.'
                    : isPro
                    ? 'Complete access to reporting tradeline directories, Tier 2-4 milestones, and funding guides.'
                    : 'Free tier includes Foundation setup and starter Net-30 vendor accounts. Upgrade to unlock all 4 roadmap stages, Tier 2/3 store cards, revolving lines, and direct commercial funding.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2.5">
              {isPro || isAdvisory ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCustomerPortal}
                  className="text-xs font-semibold text-slate-800 border-slate-300 hover:bg-slate-100"
                >
                  <span>Manage Subscription</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={upgradeToPro}
                    className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade to Pro ($39/mo)</span>
                  </Button>
                  <Link href="/advisory">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <span>Explore Advisory</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
