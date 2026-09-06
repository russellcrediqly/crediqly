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
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useBusiness } from '@/context/BusinessContext';
import { useRoadmap } from '@/context/RoadmapContext';
import { RoadmapTaskCard } from '@/components/roadmap/RoadmapTaskCard';
import { RoadmapTaskModal } from '@/components/roadmap/RoadmapTaskModal';
import { TaskReopenModal } from '@/components/roadmap/TaskReopenModal';
import { StageProgressList } from '@/components/dashboard/StageProgressList';
import { MilestoneTimeline } from '@/components/dashboard/MilestoneTimeline';
import { calculateMilestones } from '@/lib/milestones/engine';
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
  AlertCircle,
  RotateCcw,
  Calendar,
} from 'lucide-react';

function CreditRoadmapContent() {
  const { business, loading: businessLoading } = useBusiness();
  const {
    roadmap,
    loading: roadmapLoading,
    toggleTaskCompletion,
    setTaskStatus,
    actionRecords,
  } = useRoadmap();
  const { sections } = usePlatformSections();
  const searchParams = useSearchParams();

  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Step 6: Task Reopening Modal State (Prompt 15)
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [taskToReopen, setTaskToReopen] = useState<RoadmapTask | null>(null);

  // Sync stage filter from URL query param if present
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam) {
      setActiveStageFilter(stageParam);
    }
  }, [searchParams]);

  const isProfileComplete = Boolean(business && business.profileCompleted);

  const handleOpenDetail = (task: RoadmapTask) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleRequestReopen = (task: RoadmapTask) => {
    setTaskToReopen(task);
    setReopenModalOpen(true);
  };

  const handleConfirmReopen = () => {
    if (taskToReopen) {
      toggleTaskCompletion(taskToReopen.key);
      setTaskToReopen(null);
    }
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
        <LoadingState message="Personalizing your credit roadmap..." />
      </div>
    );
  }

  // Filter tasks based on stage tab
  const displayedTasks =
    activeStageFilter === 'all'
      ? roadmap.allTasks.filter((t) => t.stage !== 'funding')
      : activeStageFilter === 'completed'
      ? roadmap.allTasks.filter((t) => t.status === 'completed')
      : roadmap.allTasks.filter((t) => t.stage === activeStageFilter);

  // Compute deterministic milestones from real data
  const milestones = useMemo(() => {
    return calculateMilestones(business, roadmap);
  }, [business, roadmap]);

  const nextBest = roadmap.nextBestAction;

  return (
    <>
      {/* Task Detail Modal */}
      <RoadmapTaskModal
        task={selectedTask}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTask(null);
        }}
        onToggleComplete={toggleTaskCompletion}
        onRequestReopen={handleRequestReopen}
        onSetStatus={setTaskStatus}
        actionRecord={selectedTask ? actionRecords[selectedTask.key] : undefined}
      />

      {/* Reopening Confirmation Modal (Prompt 15) */}
      <TaskReopenModal
        isOpen={reopenModalOpen}
        task={taskToReopen}
        onClose={() => {
          setReopenModalOpen(false);
          setTaskToReopen(null);
        }}
        onConfirm={handleConfirmReopen}
      />

      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Action-Oriented Journey
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your Business Credit Roadmap
          </h1>
          <p className="text-sm text-slate-500">
            A personalized step-by-step plan based on your current business profile.
          </p>
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

        {/* Overall Roadmap Progress Card (Prompt 3: Completed applicable / Total applicable) */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Roadmap Progress
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {roadmap.percentage}%
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">
                    {roadmap.completedCount} of {roadmap.applicableTotalCount} applicable steps completed
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Calculated from active profile</span>
              </div>
            </div>

            <ProgressBar
              value={roadmap.percentage}
              color="brand"
              showPercentage={false}
              className="h-2.5"
            />

            {/* Motivational Encouragement Banner (Phase 7 & 10) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-50/80 via-emerald-50/50 to-white border border-brand-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                {roadmap.completedCount > 0 ? (
                  <p className="text-slate-700">
                    <strong className="text-emerald-800 font-bold">Great momentum!</strong>{' '}
                    You have verified {roadmap.completedCount} of {roadmap.applicableTotalCount} milestones. Keep following the sequential tiers to establish maximum commercial credibility.
                  </p>
                ) : (
                  <p className="text-slate-700">
                    <strong className="text-brand-900 font-bold">Ready to build:</strong>{' '}
                    Your personalized roadmap is queued up. Complete foundational tasks first to ensure smooth approval on later vendor tradelines.
                  </p>
                )}
              </div>
            </div>

            {/* Visual Business Journey Path: Start → Build → Improve → Funding Ready → Grow */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                <span>Business Credit Route</span>
                <span className="hidden sm:inline text-brand-700 font-bold">
                  Start → Build → Improve → Funding Ready → Grow
                </span>
              </div>

              {/* Stage Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {roadmap.stages.map((stage) => {
                  const isStageComplete = stage.status === 'completed';
                  const isComingNext = stage.status === 'coming_next';
                  const isInProgress = stage.status === 'in_progress';
                  const journeyPhaseLabel =
                    stage.order === 1
                      ? 'Start'
                      : stage.order === 2
                      ? 'Build'
                      : stage.order === 3
                      ? 'Improve'
                      : stage.order === 4
                      ? 'Funding Ready'
                      : 'Grow';

                  return (
                    <div
                      key={stage.id}
                      onClick={() => setActiveStageFilter(stage.id)}
                      className={`cursor-pointer p-2.5 rounded-xl border flex flex-col justify-between gap-1 transition-all ${
                        activeStageFilter === stage.id
                          ? 'ring-2 ring-brand-500 bg-brand-50/60 border-brand-300'
                          : isStageComplete
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          : isInProgress
                          ? 'bg-brand-50/40 border-brand-200 text-brand-950 ring-1 ring-brand-500/20'
                          : isComingNext
                          ? 'bg-slate-50 border-slate-200/80 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {journeyPhaseLabel}
                        </span>
                        {isStageComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isComingNext ? (
                          <Lock className="w-3 h-3 text-slate-400" />
                        ) : isInProgress ? (
                          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                      <span className="font-bold text-[11px] truncate">{stage.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {isComingNext
                          ? 'Coming next'
                          : `${stage.completedCount} of ${stage.applicableCount}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prominent Next Best Action Hero Card */}
        <Card className="border-brand-200 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/40 shadow-xs overflow-hidden">
          <CardContent className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-900 bg-brand-100/70 px-2.5 py-0.5 rounded-full">
                Your Next Best Action
              </span>
            </div>

            {nextBest ? (
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {nextBest.title}
                </h3>
                <div className="p-3.5 rounded-xl bg-white/80 border border-brand-100 text-xs text-slate-700 leading-relaxed max-w-3xl">
                  <strong className="text-brand-900 font-semibold block mb-0.5">
                    Why this matters:
                  </strong>
                  {nextBest.whyItMatters}
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenDetail(nextBest)}
                    className="gap-1.5 shadow-xs"
                  >
                    <span>Start This Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTaskCompletion(nextBest.key)}
                    className="text-xs border-brand-200 text-brand-800 hover:bg-brand-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-brand-600" />
                    <span>Mark Complete</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-emerald-800">
                  Your business credit foundation is in great shape!
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  You have satisfied all foundational and credit building milestone tasks. Continue maintaining clean on-time payment history as you prepare for future funding opportunities.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage Filter Navigation Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setActiveStageFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  activeStageFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Tasks ({roadmap.allTasks.filter((t) => t.stage !== 'funding').length})
              </button>

              {roadmap.stages.map((stage) => {
                const isActive = activeStageFilter === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStageFilter(stage.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{stage.title}</span>
                    {stage.id === 'funding' ? (
                      <Lock className="w-3 h-3 text-slate-400" />
                    ) : (
                      <span className="text-[10px] opacity-80">
                        ({stage.completedCount}/{stage.applicableCount})
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => setActiveStageFilter('completed')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeStageFilter === 'completed'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completed ({roadmap.completedCount})</span>
              </button>
            </div>
          </div>

          {/* Stage Description Banner (if filtering by a specific stage) */}
          {activeStageFilter !== 'all' && activeStageFilter !== 'completed' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">
                {roadmap.stages.find((s) => s.id === activeStageFilter)?.title}
              </span>
              <p>
                {roadmap.stages.find((s) => s.id === activeStageFilter)?.description}
              </p>
            </div>
          )}

          {/* Stage 5: Funding Preparation Banner */}
          {activeStageFilter === 'funding' && (
            <Card className="border-brand-200 bg-gradient-to-r from-brand-50/60 via-white to-teal-50/40">
              <CardContent className="p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="text-[10px] uppercase font-bold">
                        Stage 5 Active
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        Capital Preparation
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Funding Readiness & Documentation
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Prepare your commercial accounts, financial records, and operating profiles before applying for formal business financing. Check your live Funding Readiness score anytime.
                    </p>
                  </div>
                  <Link href="/readiness" className="flex-shrink-0">
                    <Button variant="primary" size="sm" className="gap-1.5 shadow-sm whitespace-nowrap">
                      <span>View Readiness Audit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task List */}
          <div className="space-y-3">
            {displayedTasks.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-8 text-center text-slate-500 text-xs">
                  No tasks found for this view.
                </CardContent>
              </Card>
            ) : (
              displayedTasks.map((task) => (
                <RoadmapTaskCard
                  key={task.key}
                  task={task}
                  onOpenDetail={handleOpenDetail}
                  onToggleComplete={toggleTaskCompletion}
                  onRequestReopen={handleRequestReopen}
                  isNextBest={nextBest?.key === task.key}
                />
              ))
            )}
          </div>
        </div>

        {/* Detailed Stage Progress & Milestone Breakdown */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-200/80 pb-2.5">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Stage Progress &amp; Milestone Timeline
            </h2>
            <p className="text-xs text-slate-500">
              Detailed tracking across all active credit-building stages and milestone benchmarks.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StageProgressList stages={roadmap.stages} />
            <MilestoneTimeline milestones={milestones} />
          </div>
        </div>

        {/* Phase 15: Contextual Upgrade Path to Advisory */}
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
                  Want our team to build this with you? Explore Premium Advisory.
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  Get dedicated 1-on-1 strategy, hands-on tradeline setup, and monthly advisor checkpoints while you build.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/advisory">
                <Button size="sm" variant="primary" className="text-xs gap-1.5 whitespace-nowrap shadow-xs bg-brand-600 hover:bg-brand-500">
                  <span>Explore Advisory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href="/consultation">
                <Button size="sm" variant="outline" className="text-xs border-brand-200 text-brand-800 hover:bg-brand-50 whitespace-nowrap">
                  <span>Strategy Call</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Educational Disclaimer Footer */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Crediqly provides educational information and personalized organizational guidance. It does not provide formal legal advice, credit repair guarantees, or ensure funding approval.
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
