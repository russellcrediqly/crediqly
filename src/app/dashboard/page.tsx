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
import { calculateFundingForecast } from '@/lib/forecast/fundingForecastEngine';
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
  CalendarCheck,
  Building2,
  ShieldCheck,
  Compass,
  Sparkles,
  Headphones,
  Calendar,
  Award,
  TrendingUp,
  DollarSign,
  Activity,
  Layers,
  ChevronRight,
  Target,
  Zap,
  Info,
  Clock,
  Briefcase,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { business } = useBusiness();
  const { roadmap, completedTasks, toggleTaskCompletion } = useRoadmap();
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
      subscriptionTier: isAdvisory ? 'Premium Advisory' : isPro ? 'Pro' : 'Free',
      isAdvisory,
      roadmap,
    });
  }, [
    business,
    completedTasks,
    fundingProducts,
    isPro,
    isAdvisory,
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
          {/* 1. WELCOME & STAGE COMMAND CENTER HEADER                         */}
          {/* ================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-6 sm:p-7 space-y-5">
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800 bg-brand-50 border border-brand-200/80 px-2.5 py-0.5 rounded-full">
                    Stage {customerJourney.activeStepNumber}: {customerJourney.currentStageLabel}
                  </span>
                  <StatusBadge
                    status={isProfileComplete ? 'Verified' : 'Needs Attention'}
                    size="sm"
                  />
                  {isAdvisory ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
                      <Headphones className="w-3 h-3 text-indigo-600" />
                      <span>Premium Advisory</span>
                    </span>
                  ) : isPro ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Pro Active</span>
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/readiness"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-brand-600" />
                    <span>Readiness Index: <strong className="font-mono">{fundingReadiness.score}</strong>/100</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>

              {/* Title & Primary Action Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {timeOfDayGreeting}, {business?.businessName || firstName}
                  </h1>
                  <p className="text-sm text-slate-600 max-w-2xl leading-relaxed font-normal">
                    Let&apos;s build your business toward stronger credit and funding. Follow your guided next step below.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  {!isPro && !isAdvisory && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={upgradeToPro}
                      className="text-xs font-bold gap-1.5 shadow-xs bg-brand-600 hover:bg-brand-500 text-white"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upgrade to Pro ($39/mo)</span>
                    </Button>
                  )}

                  {sections.consultation !== false && (
                    <Link href={isAdvisory ? '/consultation' : '/advisory'}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1.5 text-xs font-semibold shadow-2xs text-slate-800"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {latestConsultation &&
                          ['Requested', 'Confirmed', 'Rescheduled'].includes(latestConsultation.status)
                            ? 'View Advisory Session'
                            : isAdvisory
                            ? 'Book Monthly Session'
                            : 'Explore Advisory'}
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Business Profile Metadata Pill (When profile is complete) */}
              {isProfileComplete && business && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-slate-600">
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {business.businessName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-700">{business.entityType}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-700">{business.state}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-700">{business.businessAge}</span>
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
          </div>

          {/* Incomplete Profile Card (Condition B) */}
          {!isProfileComplete && sections.business_profile !== false && (
            <Card className="border-amber-300 bg-amber-50/60 shadow-xs overflow-hidden rounded-3xl">
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
                        Answer foundational business details to activate your readiness score and generate your tailored 5-stage funding roadmap.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link href="/onboarding">
                      <Button variant="primary" size="md" className="gap-2 shadow-xs font-bold whitespace-nowrap bg-amber-600 hover:bg-amber-500 text-white">
                        <span>Continue Setup</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

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
          {/* 2. YOUR NEXT STEP (NOW) & UP NEXT (NEXT) — COMMAND CENTER HERO   */}
          {/* ================================================================= */}
          {sections.roadmap !== false && (
            <div id="next-actions" className="space-y-3">
              <WhatShouldIDoNextCard
                actions={topRecommendedActions}
                onToggleComplete={toggleTaskCompletion}
                isPro={isPro}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. YOUR JOURNEY (COMPACT 5-STAGE ROADMAP INDICATOR)               */}
          {/* ================================================================= */}
          {sections.roadmap !== false && (
            <CustomerJourneyCard journey={customerJourney} />
          )}

          {/* ================================================================= */}
          {/* 4. COMPACT READINESS SUMMARY (Condition B)                        */}
          {/* ================================================================= */}
          {sections.funding_readiness !== false && (
            <Card className="border-slate-200/90 bg-white shadow-2xs overflow-hidden rounded-3xl">
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-brand-600" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Funding Readiness Index
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                          {fundingReadiness.score}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">/ 100</span>
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
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold text-slate-700 block">{readinessLabel}</span>
                      <span className="text-[11px] text-slate-500">
                        {milestoneReadiness.completedMilestonesCount} of {milestoneReadiness.totalMilestonesCount} milestones completed
                      </span>
                    </div>
                    <Link href="/readiness">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold border-slate-300 text-slate-800">
                        <span>View Full Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                  <strong>Readiness Insight:</strong> {fundingReadiness.level}. Completing your current next step will improve your business credit depth and readiness score.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ================================================================= */}
          {/* 5. RECOMMENDED FOR YOUR CURRENT STEP (Condition B — Stage-Aware)  */}
          {/* ================================================================= */}
          {sections.products !== false && unifiedRecommendations && (
            <div className="space-y-2">
              <PersonalizedRecommendationsCard data={unifiedRecommendations} />
            </div>
          )}

          {/* ================================================================= */}
          {/* 6. FUNDING STATUS & PREPARATION (Condition B — Stage-Aware)       */}
          {/* ================================================================= */}
          {sections.funding !== false && (
            <div className="space-y-4">
              {fundingReadiness.score < 50 ? (
                <Card className="border-slate-200/90 bg-slate-50/70 shadow-2xs overflow-hidden rounded-3xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">
                          Stage 5: Funding
                        </span>
                        <span className="text-xs font-medium text-slate-500">• Upcoming Stage</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Funding is a later step for your current profile.
                      </h3>
                      <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                        Your business is currently in the credit-building stage. Focus on completing your foundation and establishing reporting tradelines first to unlock competitive loan terms.
                      </p>
                    </div>

                    <Link href="/funding">
                      <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-slate-300 text-slate-800 shrink-0">
                        <span>See Funding Preparation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <FundingMatchesForYouCard
                  matches={personalizedFundingMatches}
                  isPro={isPro}
                />
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. CREDIQLY AI ADVISOR SUPPORT                                    */}
          {/* ================================================================= */}
          {sections.ai_mentor !== false && (
            <div id="ai-mentor">
              <CrediqlyAIMentorCard context={aiMentorContext} />
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. SUBSCRIPTION TIER & PLAN SUMMARY (Compact Contextual)          */}
          {/* ================================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                  isAdvisory
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700'
                    : isPro
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                    : 'bg-slate-800'
                }`}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Your Current Plan:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isAdvisory
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : isPro
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {isAdvisory ? 'Premium Advisory' : isPro ? 'Crediqly Pro — $39/mo' : 'Free Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  {isAdvisory
                    ? 'Full access to all 5 roadmap stages, 1-on-1 advisor sessions, priority tradeline reviews, and funding concierge.'
                    : isPro
                    ? 'Complete access to reporting tradeline directories, Tier 2-4 milestones, and advanced funding readiness guides.'
                    : 'Free tier includes Foundation setup and starter Net-30 accounts. Upgrade to unlock all 5 roadmap stages and revolving credit lines.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2.5">
              {isPro || isAdvisory ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCustomerPortal}
                  className="text-xs font-semibold text-slate-800 border-slate-300 hover:bg-slate-100 shadow-2xs"
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
                      className="text-xs font-bold border-purple-300 text-purple-700 hover:bg-purple-50 shadow-2xs"
                    >
                      <span>Explore Advisory</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Need Expert Help? Consultation Bar */}
          {sections.consultation !== false && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Need Expert Help?</h3>
                  {latestConsultation && (
                    <span className="text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md font-semibold">
                      Status: {latestConsultation.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Speak 1-on-1 with a Crediqly business credit specialist.
                </p>
              </div>
              <Link href="/consultation">
                <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-slate-300 text-slate-800">
                  <span>{latestConsultation ? 'View Consultation' : 'Book a Consultation'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
