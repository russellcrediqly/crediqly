'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useBusiness } from '@/context/BusinessContext';
import { useRoadmap } from '@/context/RoadmapContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { RoadmapTaskCard } from '@/components/roadmap/RoadmapTaskCard';
import { RoadmapTaskModal } from '@/components/roadmap/RoadmapTaskModal';
import { TaskReopenModal } from '@/components/roadmap/TaskReopenModal';
import { RoadmapMilestoneCard } from '@/components/roadmap/RoadmapMilestoneCard';
import { MilestoneEducationModal } from '@/components/roadmap/MilestoneEducationModal';
import { MilestoneCompletionToast } from '@/components/roadmap/MilestoneCompletionToast';
import { calculateReadiness } from '@/lib/scoring';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { calculateCustomerJourney } from '@/lib/roadmap/customerJourney';
import {
  calculateMilestoneReadiness,
  OFFICIAL_READINESS_MILESTONES,
  ReadinessMilestoneDefinition,
} from '@/lib/readiness/readinessMilestoneEngine';
import {
  MILESTONE_EDUCATION_REGISTRY,
  STAGE_PROGRAM_OVERVIEWS,
  getMilestoneEducation,
  MilestoneEducation,
} from '@/lib/roadmap/milestoneEducation';
import { RoadmapTask } from '@/lib/roadmap/types';
import {
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  RotateCcw,
  Target,
  Building,
  CreditCard,
  TrendingUp,
  Layers,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

function CreditRoadmapContent() {
  const { business, loading: businessLoading } = useBusiness();
  const {
    roadmap,
    completedTasks,
    loading: roadmapLoading,
    toggleTaskCompletion,
    setTaskStatus,
    actionRecords,
  } = useRoadmap();
  const { sections } = usePlatformSections();
  const { isFoundation, isPro, upgradeToFoundation, upgradeToPro } = useSubscription();
  const hasFoundation = isFoundation || isPro;
  const handleUpgrade = upgradeToFoundation || upgradeToPro;
  const searchParams = useSearchParams();

  // Active stage filter: 'all' | '1' | '2' | '3' | '4' | '5' | 'completed'
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'program' | 'tasks'>('program');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneEducation | null>(null);
  const [educationModalOpen, setEducationModalOpen] = useState(false);

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [taskToReopen, setTaskToReopen] = useState<{ key: string; title: string } | null>(null);

  // Completion toast state
  const [toastData, setToastData] = useState<{
    isOpen: boolean;
    title: string;
    completionType: 'system_verified' | 'customer_confirmation';
    weight: number;
    newScore: number;
    nextMilestoneTitle?: string;
    nextMilestoneHref?: string;
    targetKey: string;
  }>({
    isOpen: false,
    title: '',
    completionType: 'customer_confirmation',
    weight: 5,
    newScore: 0,
    targetKey: '',
  });

  // Calculate live readiness engines
  const readiness = useMemo(() => calculateReadiness(business), [business]);
  const fundingReadiness = useMemo(() => calculateFundingReadiness(business), [business]);

  // Deterministic 5-Stage Customer Journey
  const customerJourney = useMemo(() => {
    return calculateCustomerJourney(
      business,
      readiness.businessReadiness,
      readiness.creditReadiness,
      fundingReadiness,
      0
    );
  }, [business, readiness.businessReadiness, readiness.creditReadiness, fundingReadiness]);

  // Authoritative 14-Milestone Readiness Calculation
  const milestoneReadiness = useMemo(() => {
    return calculateMilestoneReadiness(business, completedTasks);
  }, [business, completedTasks]);

  // Sync active stage with customer's current journey step on initial mount or query
  useEffect(() => {
    const stageQuery = searchParams.get('stage') || searchParams.get('filter');
    if (stageQuery) {
      if (stageQuery === 'foundation' || stageQuery === '1') setActiveStageId(1);
      else if (stageQuery === 'credit_foundation' || stageQuery === 'build' || stageQuery === '2') setActiveStageId(2);
      else if (stageQuery === 'building' || stageQuery === 'strengthen' || stageQuery === '3') setActiveStageId(3);
      else if (stageQuery === 'optimization' || stageQuery === 'funding_ready' || stageQuery === '4') setActiveStageId(4);
      else if (stageQuery === 'funding' || stageQuery === 'scale' || stageQuery === '5') setActiveStageId(5);
    } else if (customerJourney?.activeStepNumber) {
      setActiveStageId(customerJourney.activeStepNumber);
    }
  }, [searchParams, customerJourney?.activeStepNumber]);

  const isProfileComplete = Boolean(business && business.profileCompleted);

  // Next Milestone Hero resolution
  const nextMilestoneDef = milestoneReadiness.nextMilestone;
  const nextMilestoneEdu = useMemo(() => {
    if (!nextMilestoneDef) return null;
    return getMilestoneEducation(nextMilestoneDef.id);
  }, [nextMilestoneDef]);

  // Stage Overview definition
  const currentStageProgram = STAGE_PROGRAM_OVERVIEWS[activeStageId] || STAGE_PROGRAM_OVERVIEWS[1];
  const userCurrentStageId = customerJourney.activeStepNumber;

  // Milestones for the active stage tab
  const stageMilestones = useMemo(() => {
    return Object.values(MILESTONE_EDUCATION_REGISTRY).filter((m) => m.stageId === activeStageId);
  }, [activeStageId]);

  // Completed count in active stage
  const stageCompletedCount = useMemo(() => {
    const stageMilestoneIds = new Set(stageMilestones.map((m) => m.id));
    return milestoneReadiness.items.filter(
      (item) => stageMilestoneIds.has(item.definition.id) && item.isCompleted
    ).length;
  }, [stageMilestones, milestoneReadiness.items]);

  // Handlers
  const handleOpenTaskDetail = (task: RoadmapTask) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleOpenMilestoneEducation = (milestone: MilestoneEducation) => {
    setSelectedMilestone(milestone);
    setEducationModalOpen(true);
  };

  const handleRequestReopen = (key: string, title: string) => {
    setTaskToReopen({ key, title });
    setReopenModalOpen(true);
  };

  const handleConfirmReopen = async () => {
    if (taskToReopen) {
      await toggleTaskCompletion(taskToReopen.key);
      setTaskToReopen(null);
    }
  };

  const handleToggleMilestone = async (idOrKey: string) => {
    const wasCompleted = completedTasks.includes(idOrKey) || Boolean(business?.completedDbTasks?.includes(idOrKey));
    await toggleTaskCompletion(idOrKey);

    if (!wasCompleted) {
      // Trigger confirmation toast
      const edu = getMilestoneEducation(idOrKey);
      const title = edu?.title || 'Milestone';
      const weight = edu?.weight || 5;
      const compType = edu?.completionType || 'customer_confirmation';
      const simulatedResult = calculateMilestoneReadiness(business, Array.from(new Set([...completedTasks, idOrKey])));
      const newScore = simulatedResult.score;
      const simulatedNext = simulatedResult.nextMilestone;
      const nextEdu = simulatedNext ? getMilestoneEducation(simulatedNext.id) : null;

      setToastData({
        isOpen: true,
        title,
        completionType: compType,
        weight,
        newScore,
        nextMilestoneTitle: nextEdu?.title || nextMilestoneEdu?.title,
        nextMilestoneHref: nextEdu?.actionHref || nextMilestoneEdu?.actionHref,
        targetKey: idOrKey,
      });
    }
  };

  const handleAskAIAboutStep = (prompt: string, title: string) => {
    setSelectedMilestone(getMilestoneEducation(title) || null);
    // Open education modal with AI section activated
    setEducationModalOpen(true);
  };

  if (sections.roadmap === false) {
    return (
      <SectionInactiveNotice
        title="Credit Roadmap Temporarily Inactive"
        description="The credit roadmap is currently disabled by the administrator. Please return to your main dashboard."
      />
    );
  }

  if (businessLoading || roadmapLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Personalizing your business-credit journey..." />
      </div>
    );
  }

  return (
    <>
      {/* Task Modal for detailed operational tasks */}
      <RoadmapTaskModal
        task={selectedTask}
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onToggleComplete={toggleTaskCompletion}
        onRequestReopen={(task) => handleRequestReopen(task.key, task.title)}
        onSetStatus={setTaskStatus}
        actionRecord={selectedTask ? actionRecords[selectedTask.key] : undefined}
      />

      {/* Reopening Confirmation Modal */}
      <TaskReopenModal
        isOpen={reopenModalOpen}
        task={taskToReopen ? ({ key: taskToReopen.key, title: taskToReopen.title } as RoadmapTask) : null}
        onClose={() => {
          setReopenModalOpen(false);
          setTaskToReopen(null);
        }}
        onConfirm={handleConfirmReopen}
      />

      {/* Milestone Education Modal */}
      <MilestoneEducationModal
        milestone={selectedMilestone}
        isOpen={educationModalOpen}
        isCompleted={
          selectedMilestone
            ? Boolean(
                completedTasks.includes(selectedMilestone.roadmapTaskKey || selectedMilestone.id) ||
                business?.completedDbTasks?.includes(selectedMilestone.roadmapTaskKey || selectedMilestone.id)
              )
            : false
        }
        isBlockedByPrereq={
          selectedMilestone
            ? Boolean(
                milestoneReadiness.items.find((i) => i.definition.id === selectedMilestone.id)?.isBlockedByPrereq
              )
            : false
        }
        onClose={() => {
          setEducationModalOpen(false);
          setSelectedMilestone(null);
        }}
        onToggleComplete={handleToggleMilestone}
        onAskAI={handleAskAIAboutStep}
      />

      {/* Completion Confirmation Toast */}
      <MilestoneCompletionToast
        isOpen={toastData.isOpen}
        title={toastData.title}
        completionType={toastData.completionType}
        weight={toastData.weight}
        newScore={toastData.newScore}
        nextMilestoneTitle={toastData.nextMilestoneTitle}
        nextMilestoneHref={toastData.nextMilestoneHref}
        onUndo={() => {
          if (toastData.targetKey) {
            toggleTaskCompletion(toastData.targetKey);
            setToastData((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onDismiss={() => setToastData((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="space-y-8 max-w-5xl">
        {/* =========================================================================
            TOP SECTION: PRIMARY GUIDANCE MESSAGE & WELCOME
        ========================================================================= */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-800 bg-brand-100/90 px-3 py-1 rounded-full border border-brand-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-brand-700" />
              <span>Step-by-Step Program</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              Personalized for {business?.businessName || 'Your Business'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Business Credit &amp; Funding Roadmap
          </h1>

          {/* Primary Product Principle Message */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-brand-50/90 via-indigo-50/40 to-white border border-brand-200 text-slate-800 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                &ldquo;You don&apos;t need to figure everything out at once. Crediqly guides you through the steps in the right order.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Incomplete Profile Prompt if user hasn't onboarded yet */}
        {!isProfileComplete && (
          <Card className="border-amber-200 bg-amber-50/50 shadow-xs">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Complete your business profile to personalize your roadmap
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Answer a few quick questions about your EIN, banking, and trade lines so Crediqly can tailor your exact next steps.
                  </p>
                </div>
              </div>
              <Link href="/onboarding">
                <Button variant="primary" size="sm" className="whitespace-nowrap gap-1.5 shadow-xs">
                  <span>Complete Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Free Tier Promotional Banner */}
        {!hasFoundation && (
          <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/30 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Free Tier Active
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Stage 1 Establish Free • Stages 2–5 Guided in Foundation
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Unlock Complete 5-Stage Guided Business Credit Building
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Free accounts can build their Foundation profile and open commercial accounts. Upgrade to <strong>Foundation ($47.99/mo)</strong> or <strong>Guided ($147.99/mo)</strong> to unlock Tier-1 reporting vendor guides, store cards, revolving lines, and direct funding matching.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpgrade}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1 shadow-xs px-4"
              >
                <span>Upgrade to Foundation ($47.99/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold"
                >
                  <span>Explore Guided ($147.99/mo)</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            PROGRAM PROGRESS & OVERALL READINESS DASHBOARD
        ========================================================================= */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Authoritative Readiness Index
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {milestoneReadiness.score}/100
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">
                    {milestoneReadiness.completedMilestonesCount} of {milestoneReadiness.totalMilestonesCount} official milestones completed
                  </span>
                </div>
              </div>

              {/* Current Stage Indicator with "You are here" callout */}
              <div className="flex flex-col sm:items-end gap-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-900 border border-brand-200 text-xs font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                  <span>You Are Here: {customerJourney.stages.find((s) => s.id === userCurrentStageId)?.title || 'Establish'}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Stage {userCurrentStageId} of 5 Active
                </span>
              </div>
            </div>

            <ProgressBar
              value={milestoneReadiness.score}
              color="brand"
              showPercentage={false}
              className="h-2.5"
            />

            {/* Transparency Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Calculated deterministically from active profile and completed milestones</span>
              </span>
              <span className="text-slate-400">
                Zero arbitrary scores • Verified &amp; Customer Confirmed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* =========================================================================
            HERO: YOUR NEXT BEST ACTION / NEXT MILESTONE
        ========================================================================= */}
        <Card className="border-brand-200 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/40 shadow-xs overflow-hidden">
          <CardContent className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-2xs">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-brand-900 bg-brand-100/80 px-2.5 py-0.5 rounded-full">
                  Your Next Best Milestone
                </span>
              </div>

              {nextMilestoneDef && (
                <span className="text-xs font-bold text-slate-500">
                  Worth <strong className="text-brand-700">+{nextMilestoneDef.weight} pts</strong> toward 100
                </span>
              )}
            </div>

            {nextMilestoneDef && nextMilestoneEdu ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Stage {nextMilestoneEdu.stageId} • {nextMilestoneEdu.stageName}
                    </span>
                    <StatusBadge
                      status={
                        nextMilestoneDef.completionType === 'system_verified'
                          ? 'Verified'
                          : 'Customer Confirmed'
                      }
                      size="sm"
                    />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {nextMilestoneDef.title}
                  </h3>
                </div>

                {/* Structured Next Step Breakdown: What, Why, How */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/90 border border-brand-100 text-xs text-slate-700 space-y-1">
                    <strong className="text-brand-900 font-bold block">
                      What it is:
                    </strong>
                    <p className="line-clamp-3 leading-relaxed">
                      {nextMilestoneEdu.whatItIs}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/90 border border-brand-100 text-xs text-slate-700 space-y-1">
                    <strong className="text-brand-900 font-bold block">
                      Why this matters:
                    </strong>
                    <p className="line-clamp-3 leading-relaxed">
                      {nextMilestoneEdu.whyItMatters}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/90 border border-brand-100 text-xs text-slate-700 space-y-1">
                    <strong className="text-brand-900 font-bold block">
                      What to expect:
                    </strong>
                    <p className="line-clamp-3 leading-relaxed">
                      {nextMilestoneEdu.whenToMoveForward}
                    </p>
                  </div>
                </div>

                {/* Next Milestone CTAs */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link href={nextMilestoneDef.actionHref}>
                    <Button variant="primary" size="sm" className="gap-1.5 shadow-xs font-bold">
                      <span>{nextMilestoneDef.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenMilestoneEducation(nextMilestoneEdu)}
                    className="text-xs border-brand-200 text-brand-800 hover:bg-brand-50 font-bold gap-1"
                  >
                    <span>View Step Guide</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleAskAIAboutStep(nextMilestoneEdu.askAiPrompt, nextMilestoneEdu.title)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                    <span>Ask AI About This Step</span>
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleMilestone(nextMilestoneDef.id)}
                    className="text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 ml-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-400 hover:text-emerald-600" />
                    <span>
                      {nextMilestoneDef.completionType === 'customer_confirmation'
                        ? 'Confirm Step'
                        : 'Complete This Step'}
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-emerald-800">
                  Outstanding Work! All Milestones Satisfied
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  You have completed all 14 official business-credit and readiness milestones. Maintain your on-time payment habits and explore matched funding opportunities below.
                </p>
                <div className="pt-2">
                  <Link href="/funding">
                    <Button variant="primary" size="sm" className="gap-1.5 font-bold shadow-xs">
                      <span>Explore Funding Opportunities</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* =========================================================================
            STAGE PROGRESSION ROUTE MAP: DESKTOP & MOBILE RESPONSIVE TIMELINE
        ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              5-Stage Program Progression
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Select any stage to inspect milestones &amp; resources
            </span>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden md:grid grid-cols-5 gap-2.5">
            {customerJourney.stages.map((stage) => {
              const isSelected = activeStageId === stage.id;
              const isUserCurrent = userCurrentStageId === stage.id;
              const isComp = stage.status === 'completed';

              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all duration-150 ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/80 shadow-xs ring-2 ring-brand-500/20'
                      : isComp
                      ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 text-slate-700'
                      : isUserCurrent
                      ? 'border-brand-300 bg-white ring-1 ring-brand-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Stage {stage.numberPrefix}
                    </span>
                    {isComp ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isUserCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                    ) : (
                      <Circle className="w-3 h-3 text-slate-300" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {stage.title}
                    </h4>
                    {isUserCurrent && (
                      <span className="text-[10px] font-bold text-brand-700">
                        You Are Here
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium">
                    {stage.status === 'completed'
                      ? 'Completed'
                      : `${stage.progress}% progress`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile Vertical Responsive Stepper */}
          <div className="md:hidden space-y-2">
            {customerJourney.stages.map((stage) => {
              const isSelected = activeStageId === stage.id;
              const isUserCurrent = userCurrentStageId === stage.id;
              const isComp = stage.status === 'completed';

              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/90 ring-2 ring-brand-500/20'
                      : isComp
                      ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isComp
                          ? 'bg-emerald-100 text-emerald-800'
                          : isUserCurrent
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isComp ? '✓' : stage.numberPrefix}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {stage.title}
                        </span>
                        {isUserCurrent && (
                          <span className="text-[9px] font-black uppercase text-brand-700 bg-brand-100 px-1.5 py-0.2 rounded">
                            You Are Here
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {stage.shortExplanation}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-brand-600' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            ACTIVE STAGE BANNER: YOU ARE HERE & BIGGEST OPPORTUNITY
        ========================================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                  Stage {currentStageProgram.stageId} • {currentStageProgram.stageName}
                </span>
                {userCurrentStageId === currentStageProgram.stageId && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Active Position
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentStageProgram.title}: {currentStageProgram.subtitle}
              </h2>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Stage Progress
              </span>
              <span className="text-sm font-black text-white">
                {stageCompletedCount} of {stageMilestones.length} milestones complete
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
            {currentStageProgram.explanation}
          </p>

          {/* Biggest Opportunity Right Now */}
          <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[10px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your Biggest Opportunity Right Now:</span>
            </div>
            <p className="text-slate-100 leading-relaxed">
              {currentStageProgram.biggestOpportunity}
            </p>
          </div>
        </div>

        {/* =========================================================================
            STAGE 4/5 FUNDING TRANSITION BANNER
        ========================================================================= */}
        {(milestoneReadiness.score >= 70 || activeStageId >= 4) && (
          <Card className="border-teal-300 bg-gradient-to-r from-teal-50/80 via-white to-brand-50/50 shadow-xs">
            <CardContent className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                    <Target className="w-3 h-3 text-teal-700" />
                    <span>Funding Transition Threshold</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Readiness {milestoneReadiness.score}/100
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Explore Matched Commercial Funding Opportunities
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You may now have a stronger profile to explore funding options. Let&apos;s review matches before you apply. We evaluate criteria to avoid unnecessary inquiries.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                <Link href="/funding">
                  <Button variant="primary" size="sm" className="text-xs font-bold gap-1 shadow-xs bg-teal-700 hover:bg-teal-600 text-white whitespace-nowrap">
                    <span>Review Funding Matches</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/readiness">
                  <Button variant="outline" size="sm" className="text-xs font-bold border-teal-200 text-teal-900 hover:bg-teal-50 whitespace-nowrap">
                    <span>Full Audit</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* =========================================================================
            STAGE MILESTONES & RECOMMENDED ACTIONS
        ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Stage {activeStageId} Milestones ({stageMilestones.length})
              </h3>
              <p className="text-xs text-slate-500">
                Core database-backed requirements. Customer-confirmed items are distinctly marked.
              </p>
            </div>

            {/* View Mode Toggle: Program Milestones vs All Tasks */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('program')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  viewMode === 'program'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Milestones ({stageMilestones.length})
              </button>
              <button
                onClick={() => setViewMode('tasks')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  viewMode === 'tasks'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Checklist Tasks
              </button>
            </div>
          </div>

          {/* Program Milestones List */}
          {viewMode === 'program' ? (
            <div className="space-y-3">
              {stageMilestones.map((milestone) => {
                const targetKey = milestone.roadmapTaskKey || milestone.id;
                const isCompleted =
                  completedTasks.includes(targetKey) ||
                  Boolean(business?.completedDbTasks?.includes(targetKey));
                const item = milestoneReadiness.items.find((i) => i.definition.id === milestone.id);
                const isNextBest = milestoneReadiness.nextMilestone?.id === milestone.id;
                const isBlocked = Boolean(item?.isBlockedByPrereq);

                return (
                  <RoadmapMilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    isCompleted={isCompleted}
                    isNextBest={isNextBest}
                    isBlockedByPrereq={isBlocked}
                    onOpenEducation={handleOpenMilestoneEducation}
                    onToggleComplete={handleToggleMilestone}
                    onRequestReopen={handleRequestReopen}
                    onAskAI={handleAskAIAboutStep}
                  />
                );
              })}
            </div>
          ) : (
            /* Tactical Checklist Tasks for Advanced Review */
            <div className="space-y-3">
              {roadmap.allTasks
                .filter((t) => {
                  if (activeStageId === 1) return t.stage === 'foundation';
                  if (activeStageId === 2) return t.stage === 'credit_foundation';
                  if (activeStageId === 3) return t.stage === 'building';
                  if (activeStageId === 4) return t.stage === 'optimization';
                  return t.stage === 'funding';
                })
                .map((task) => (
                  <RoadmapTaskCard
                    key={task.key}
                    task={task}
                    onOpenDetail={handleOpenTaskDetail}
                    onToggleComplete={toggleTaskCompletion}
                    onRequestReopen={(t) => handleRequestReopen(t.key, t.title)}
                    isNextBest={roadmap.nextBestAction?.key === task.key}
                  />
                ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            STAGE RECOMMENDED PRODUCTS & TRADELINES
        ========================================================================= */}
        {currentStageProgram.recommendedProductsCategory && (
          <Card className="border-brand-200 bg-white shadow-xs">
            <CardContent className="p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 block">
                    Curated Stage Resources
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Recommended {currentStageProgram.recommendedProductsTitle || 'Financial Products'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Selected specifically to help satisfy milestones in Stage {currentStageProgram.stageId} ({currentStageProgram.stageName}).
                  </p>
                </div>

                <Link href={`/products?category=${currentStageProgram.recommendedProductsCategory}`}>
                  <Button variant="outline" size="sm" className="text-xs border-brand-200 text-brand-800 hover:bg-brand-50 font-bold gap-1">
                    <span>View All Category Options</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {currentStageProgram.recommendedProductsCategory === 'business_banking' ? (
                  <>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Digital Commercial Checking</span>
                      <p className="text-slate-600 text-[11px]">Fee-free online checking with instant virtual debit and sub-accounts.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">Reports deposits &amp; statements</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">National Brick-and-Mortar</span>
                      <p className="text-slate-600 text-[11px]">Full branch access for cash deposits and local business banker relationship.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">Ideal for cash-intensive trades</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Interest Business Checking</span>
                      <p className="text-slate-600 text-[11px]">Earn competitive APY on operational balances while maintaining liquidity.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">High deposit yield</span>
                    </div>
                  </>
                ) : currentStageProgram.recommendedProductsCategory === 'net_30' ? (
                  <>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Shipping &amp; Packaging Vendors</span>
                      <p className="text-slate-600 text-[11px]">Reports monthly to D&amp;B and Experian with standard supply orders.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">Fast initial Paydex trigger</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Office Supply Net-30</span>
                      <p className="text-slate-600 text-[11px]">Low opening purchase minimums for everyday supplies and technology.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">No personal guarantee</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Digital Business Builders</span>
                      <p className="text-slate-600 text-[11px]">Subscriptions that report commercial tradelines with monthly payment tracking.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">Multi-bureau reporting</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Corporate Charge Cards</span>
                      <p className="text-slate-600 text-[11px]">No preset spending limits with automated rewards and expense management.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">0% revolving APR options</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Fleet &amp; Fuel Credit</span>
                      <p className="text-slate-600 text-[11px]">Nationwide commercial fuel accounts that report to Dun &amp; Bradstreet.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">Tier-2 store depth</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <span className="font-bold text-slate-800 block">Cash Back Business Cards</span>
                      <p className="text-slate-600 text-[11px]">1.5%–2% unlimited cash back across all operational and vendor expenses.</p>
                      <span className="text-[10px] font-semibold text-emerald-700 block pt-1">Expands revolving credit</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* =========================================================================
            CONTEXTUAL UPGRADE PATH: DONE-FOR-YOU ADVISORY
        ========================================================================= */}
        <Card className="border-brand-200 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/50 shadow-xs">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full">
                    Done-For-You Support
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  Need expert assistance completing your roadmap?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  Get dedicated 1-on-1 strategy, hands-on tradeline setup, and monthly advisor checkpoints while you build.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/consultation">
                <Button size="sm" variant="outline" className="text-xs border-brand-200 text-brand-800 hover:bg-brand-50 whitespace-nowrap font-bold">
                  <span>Schedule Consultation</span>
                </Button>
              </Link>
              <Link href="/advisory">
                <Button size="sm" variant="primary" className="text-xs gap-1.5 whitespace-nowrap shadow-xs bg-brand-600 hover:bg-brand-500 font-bold">
                  <span>Explore Advisory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Educational Disclaimer Footer */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Crediqly provides educational information and personalized organizational guidance. It does not provide formal legal advice, credit repair guarantees, or ensure funding approval. Customer-confirmed milestones represent self-reported actions.
          </p>
        </div>
      </div>
    </>
  );
}

export default function CreditRoadmapPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <LoadingState message="Loading credit roadmap..." />
            </div>
          }
        >
          <CreditRoadmapContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
