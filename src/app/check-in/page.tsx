'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Building2,
  CreditCard,
  Compass,
  AlertCircle,
  HelpCircle,
  FileCheck,
  RefreshCw,
  Lock,
  Check,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useRoadmap } from '@/context/RoadmapContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { calculateReadiness } from '@/lib/scoring';
import { calculateMilestoneReadiness } from '@/lib/readiness/readinessMilestoneEngine';
import { logActivity } from '@/lib/supabase/activityService';
import {
  getLatestCheckIn,
  submitMonthlyCheckIn,
  isCheckInDue,
} from '@/lib/supabase/checkInService';
import { MonthlyCheckInRecord, MonthlyCheckInResponses } from '@/types/checkIn';

const QUESTIONS = [
  {
    id: 'openedNewCreditAccounts',
    title: 'New Commercial Credit Accounts',
    question: 'Have you opened any new business credit accounts this past month?',
    description: 'Vendor accounts, supplier credit, fleet cards, or equipment financing.',
    options: [
      { value: 'yes', label: 'Yes, opened new accounts', hint: 'We will update your credit profile.' },
      { value: 'no', label: 'No new accounts this month', hint: 'Continuing with existing accounts.' },
    ],
  },
  {
    id: 'vendorAccountsReporting',
    title: 'Bureau Reporting Status',
    question: 'Have any of your vendor accounts begun reporting to credit bureaus?',
    description: 'Reporting to Dun & Bradstreet, Experian Commercial, or Equifax Business.',
    options: [
      { value: 'yes', label: 'Yes, confirmed reporting', hint: 'Tradelines are visible on your reports.' },
      { value: 'unsure', label: 'Unsure / Still Waiting', hint: 'Most vendors report within 30–60 days.' },
      { value: 'no', label: 'Not yet', hint: 'Focus on vendor accounts that report promptly.' },
    ],
  },
  {
    id: 'appliedForFunding',
    title: 'Financing Applications',
    question: 'Have you applied for any business loans, lines of credit, or financing?',
    description: 'Direct applications to commercial banks, online lenders, or SBA lenders.',
    options: [
      { value: 'yes', label: 'Yes, applied for financing', hint: 'We will keep track of your active inquiries.' },
      { value: 'no', label: 'No applications submitted', hint: 'Protecting your credit score from hard inquiries.' },
    ],
  },
  {
    id: 'revenueChange',
    title: 'Monthly Revenue Trend',
    question: 'How has your business revenue trended over the past 30 days?',
    description: 'Underwriters look for consistent or growing monthly deposits in your business bank account.',
    options: [
      { value: 'increased', label: 'Revenue increased', hint: 'Expands your qualifying funding limits.' },
      { value: 'steady', label: 'Remained steady', hint: 'Consistent cash flow demonstrates stability.' },
      { value: 'decreased', label: 'Decreased / Seasonal Dip', hint: 'Focus on low-tier credit and vendor tradelines.' },
    ],
  },
  {
    id: 'newBusinessCreditCards',
    title: 'Commercial Credit Cards',
    question: 'Have you added or activated any new business credit cards?',
    description: 'Dedicated business cards (e.g. Chase Ink, Amex Business, Capital One Spark).',
    options: [
      { value: 'yes', label: 'Yes, added a business card', hint: 'Strengthens your revolving credit history.' },
      { value: 'no', label: 'No new business cards', hint: 'Focus on vendor tier-1 tradelines first.' },
    ],
  },
  {
    id: 'completedPreviousAction',
    title: 'Milestone Execution',
    question: 'Did you complete the last action item recommended by Crediqly?',
    description: 'Checking off recommended actions moves your business along the commercial roadmap.',
    options: [
      { value: 'yes', label: 'Yes, completed it fully', hint: 'Will automatically advance your next best milestone.' },
      { value: 'partially', label: 'In progress / Partially done', hint: 'Keep up the momentum!' },
      { value: 'not_yet', label: 'Not yet started', hint: 'We can guide you through the exact steps.' },
    ],
  },
  {
    id: 'entityOrContactChanges',
    title: 'Business Information Changes',
    question: 'Any recent changes to your business address, phone, or corporate filing?',
    description: 'Consistency across state records, Secretary of State, and 411 directories is crucial.',
    options: [
      { value: 'no', label: 'No changes, everything matches', hint: 'Perfect commercial directory consistency.' },
      { value: 'yes', label: 'Yes, address or phone changed', hint: 'We recommend updating your Business Profile.' },
    ],
  },
];

export default function MonthlyCheckInPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { business, saveBusinessProfile } = useBusiness();
  const { roadmap, toggleTaskCompletion, refreshRoadmap } = useRoadmap();
  const { isPro, upgradeToPro, upgradeToAdvisory } = useSubscription();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestRecord, setLatestRecord] = useState<MonthlyCheckInRecord | null>(null);
  const [isDue, setIsDue] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSubmitted, setCompletedSubmitted] = useState(false);

  // Form State
  const [responses, setResponses] = useState<MonthlyCheckInResponses>({
    openedNewCreditAccounts: 'no',
    vendorAccountsReporting: 'unsure',
    appliedForFunding: 'no',
    revenueChange: 'steady',
    newBusinessCreditCards: 'no',
    completedPreviousAction: 'not_yet',
    entityOrContactChanges: 'no',
    notes: '',
  });

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  const isProfileComplete = Boolean(business && business.profileCompleted);

  const initialScore = useMemo(() => {
    if (!isProfileComplete) return 0;
    return calculateMilestoneReadiness(business).score;
  }, [isProfileComplete, business]);

  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [latest, due] = await Promise.all([
          getLatestCheckIn(user.id),
          isCheckInDue(user.id),
        ]);
        if (isMounted) {
          setLatestRecord(latest);
          setIsDue(due);
          if (latest && !due) {
            // Already completed this month, prefill
            setResponses(latest.responses);
          }
        }
      } catch (err) {
        console.warn('Error checking monthly status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleOptionSelect = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    try {
      setSubmitting(true);

      // 1. Update business profile parameters based on check-in responses
      const profileUpdates: Record<string, any> = {};

      if (responses.openedNewCreditAccounts === 'yes') {
        profileUpdates.hasBusinessCreditProfile = 'yes';
        profileUpdates.hasReportingAccounts = 'yes';
      }

      if (responses.vendorAccountsReporting === 'yes') {
        profileUpdates.hasReportingAccounts = 'yes';
        profileUpdates.hasBusinessCreditProfile = 'yes';
      }

      if (responses.newBusinessCreditCards === 'yes') {
        profileUpdates.hasBusinessCreditCard = 'yes';
      }

      if (Object.keys(profileUpdates).length > 0) {
        await saveBusinessProfile(profileUpdates);
      }

      // 2. If user completed previous action and there is an active milestone task, complete it
      const activeTask = roadmap.nextBestAction || roadmap.allTasks?.find((t) => t.status === 'not_started' || t.status === 'in_progress');
      if (responses.completedPreviousAction === 'yes' && activeTask) {
        await toggleTaskCompletion(activeTask.key);
        await refreshRoadmap();
      }

      // 3. Recalculate score & next best action
      const newMilestoneRes = calculateMilestoneReadiness({ ...business, ...profileUpdates } as any);
      const newScore = isProfileComplete ? newMilestoneRes.score : initialScore;
      const updatedNextActionTitle = newMilestoneRes.nextMilestone?.title || activeTask?.title || 'Review Vendor Tradelines';

      // 4. Save check-in record
      const record = await submitMonthlyCheckIn({
        userId: user.id,
        businessId: business?.businessId,
        responses,
        previousScore: initialScore,
        newScore,
        nextBestActionTitle: updatedNextActionTitle,
      });

      // 5. Log activity
      await logActivity(user.id, {
        activityType: 'readiness_updated',
        title: `Completed ${currentMonthName} Business Credit Check-In`,
        description: `Check-in recorded with score of ${newScore}%. Next action calibrated.`,
        businessId: business?.businessId,
      });

      setLatestRecord(record);
      setIsDue(false);
      setCompletedSubmitted(true);
    } catch (err) {
      console.error('Failed to submit monthly check-in:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingState message="Loading your business check-in..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const currentQ = QUESTIONS[currentStep];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 max-w-3xl mx-auto pb-16 font-sans">
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
              <span className="text-xs font-medium text-slate-500">Monthly Routine</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Impact on Credit
              </span>
            </div>
          </div>

          {/* Header Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                <span>Monthly Business Credit Check-In</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {currentMonthName} Check-In
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Take 60 seconds each month to log account updates, vendor reporting, and milestone progress. We will automatically calibrate your credit standing and recalculate your Next Best Action.
              </p>
            </div>
          </div>

          {/* FREE TIER PROMOTIONAL GATE FOR MONTHLY CHECK-IN */}
          {!isPro ? (
            <div className="space-y-6">
              <div className="rounded-3xl border-2 border-brand-300 bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/40 p-6 sm:p-8 shadow-md">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Monthly Check-In — Premium &amp; Advisory Feature</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Calibrate Your Credit Standing Monthly
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Automated monthly trajectory tracking continuously recalibrates your commercial readiness score, verifies credit bureau reporting updates across D&amp;B, Experian, and Equifax, and updates your personalized Next Best Action.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 text-left">
                    {/* Crediqly Pro */}
                    <div className="p-5 rounded-2xl bg-white border-2 border-brand-200 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-brand-700">Self-Directed</span>
                          <span className="text-lg font-black text-slate-900">
                            $39<span className="text-xs font-normal text-slate-500">/mo</span>
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">Crediqly Pro</h3>
                        <ul className="text-xs text-slate-600 space-y-2 pt-1">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Monthly 60-second score recalibration &amp; progress deltas</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Unlock full 4-stage credit roadmap &amp; revolving milestones</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Complete 17+ commercial lenders &amp; pre-qualification simulator</span>
                          </li>
                        </ul>
                      </div>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={upgradeToPro}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-2.5 mt-2 gap-1.5 shadow-xs"
                      >
                        <span>Unlock with Pro ($39/mo)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Premium Advisory */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-brand-50/50 border-2 border-purple-200 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-purple-700">Done-For-You</span>
                          <span className="text-lg font-black text-slate-900">
                            $499 <span className="text-xs font-normal text-slate-500">+ $199/mo</span>
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">Premium Advisory</h3>
                        <ul className="text-xs text-slate-600 space-y-2 pt-1">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <span>Dedicated credit strategist reviews &amp; files check-in for you</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <span>Direct lender introductions &amp; personalized capital packaging</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <span>Full white-glove credit building &amp; bureau dispute support</span>
                          </li>
                        </ul>
                      </div>
                      <Link href="/advisory">
                        <Button
                          variant="primary"
                          size="md"
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 mt-2 gap-1.5 shadow-xs"
                        >
                          <span>Explore Premium Advisory</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ALREADY SUBMITTED STATE / SUCCESS CONFIRMATION */}
              {(completedSubmitted || (!isDue && latestRecord && currentStep === 0 && !completedSubmitted)) ? (
            <Card className="border-emerald-200 bg-white shadow-lg overflow-hidden">
              <div className="bg-emerald-500/10 border-b border-emerald-100 p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Check-In Logged
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      {latestRecord?.monthYear || currentMonthName}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Your Business Standing is Fully Up to Date!
                  </h2>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Score & Progression Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">
                      Readiness Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {latestRecord?.newScore !== undefined ? `${latestRecord.newScore}%` : `${initialScore}%`}
                      </span>
                      {latestRecord?.previousScore !== undefined && latestRecord.newScore !== undefined && (
                        <span className="text-xs font-bold text-emerald-600">
                          {latestRecord.newScore >= latestRecord.previousScore ? '↑ Maintained/Gained' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">
                      Roadmap Milestones
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {roadmap.completedCount}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        of {roadmap.applicableTotalCount} completed
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">
                      Reporting Tradelines
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {business?.hasReportingAccounts === 'yes' ? 'Active' : 'Building'}
                      </span>
                      <span className="text-xs font-medium text-emerald-600">
                        {business?.hasReportingAccounts === 'yes' ? 'Verified' : 'In progress'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recalculated Next Best Action */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50 via-white to-teal-50 border border-brand-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                        Recalculated For You
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        Your Next Best Action
                      </h3>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-base font-extrabold text-slate-900">
                      {roadmap.nextBestAction?.title || 'Review Your Tier-1 Vendor Accounts'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {roadmap.nextBestAction?.whyItMatters || 'Executing this task strengthens your commercial credit file for upcoming funding eligibility.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-brand-100/60 flex items-center justify-between">
                    <Link href={roadmap.nextBestAction?.actionHref || '/roadmap'}>
                      <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1.5">
                        <span>{roadmap.nextBestAction?.actionLabel || 'Execute Milestone'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDue(true);
                      setCompletedSubmitted(false);
                      setCurrentStep(0);
                    }}
                    className="text-xs font-semibold gap-1.5 w-full sm:w-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake or Update Check-In</span>
                  </Button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link href="/dashboard" className="flex-1 sm:flex-initial">
                      <Button variant="outline" size="sm" className="text-xs font-semibold w-full">
                        Return to Dashboard
                      </Button>
                    </Link>
                    <Link href="/roadmap" className="flex-1 sm:flex-initial">
                      <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold w-full">
                        View Full Roadmap
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* WIZARD QUESTIONS */
            <Card className="border-slate-200 shadow-lg overflow-hidden">
              {/* Step Progress Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
                    Step {currentStep + 1} of {QUESTIONS.length}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {currentQ.title}
                  </h2>
                </div>

                {/* Mini Progress Dots */}
                <div className="flex items-center gap-1.5">
                  {QUESTIONS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentStep
                          ? 'w-6 bg-brand-600'
                          : idx < currentStep
                          ? 'w-2 bg-emerald-500'
                          : 'w-2 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {currentQ.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {currentQ.description}
                  </p>
                </div>

                {/* Question Options */}
                <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                    const isSelected = (responses as any)[currentQ.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleOptionSelect(currentQ.id, opt.value)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                          isSelected
                            ? 'bg-brand-50/70 border-brand-500 shadow-xs ring-2 ring-brand-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`text-sm font-bold block ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>
                            {opt.label}
                          </span>
                          <span className="text-xs text-slate-500 block">
                            {opt.hint}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Notes on final question */}
                {currentStep === QUESTIONS.length - 1 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Additional Notes or Reflections (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={responses.notes || ''}
                      onChange={(e) => setResponses((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g., Applied for Uline net-30, opened Chase business account..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentStep === 0 || submitting}
                    className="text-xs font-semibold gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Button>

                  {currentStep < QUESTIONS.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold gap-1 shadow-xs"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shadow-sm"
                    >
                      {submitting ? (
                        <span>Calibrating Profile...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit & Recalculate Standing</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
