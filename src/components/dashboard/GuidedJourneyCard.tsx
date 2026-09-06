'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CustomerJourneyResult } from '@/lib/roadmap/customerJourney';
import type { RecommendedAction } from '@/lib/recommendations/nextActionsEngine';
import type { FundingReadinessResult } from '@/types/funding';
import type { BusinessProfile } from '@/types/business';
import type { ProgressHistoryItem } from '@/types/progress';
import { extractScoreProgression } from '@/lib/supabase/progressService';
import { estimateActionImpact } from '@/lib/readiness/potentialScoreEngine';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  CreditCard,
  Target,
  TrendingUp,
  Layers,
  Circle,
  Clock,
  Compass,
  Zap,
  Lock,
  X,
  TrendingDown,
  Minus,
  RotateCw,
  Undo2,
} from 'lucide-react';

interface GuidedJourneyCardProps {
  journey: CustomerJourneyResult;
  fundingReadiness: FundingReadinessResult;
  business?: Partial<BusinessProfile> | null;
  history?: ProgressHistoryItem[];
  actions: RecommendedAction[];
  onToggleComplete?: (taskKey: string) => Promise<void>;
  onMarkActionComplete?: (actionId: string, metadata?: Record<string, any>) => Promise<void>;
  onUndoActionComplete?: (actionId: string) => Promise<void>;
  onReassessReadiness?: () => Promise<void>;
  isPro?: boolean;
  isAdvisory?: boolean;
  onUpgradeToPro?: () => void;
  className?: string;
}

export const GuidedJourneyCard: React.FC<GuidedJourneyCardProps> = ({
  journey,
  fundingReadiness,
  business,
  history = [],
  actions,
  onToggleComplete,
  onMarkActionComplete,
  onUndoActionComplete,
  onReassessReadiness,
  isPro = false,
  isAdvisory = false,
  onUpgradeToPro,
  className = '',
}) => {
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [isReassessing, setIsReassessing] = useState(false);
  const [lastCompletedAction, setLastCompletedAction] = useState<{
    id: string;
    taskKey: string;
    title: string;
  } | null>(null);
  const [completionNotice, setCompletionNotice] = useState<{
    type: 'improved' | 'reassessed';
    prevScore?: number;
    newScore: number;
    delta?: number;
    taskTitle?: string;
  } | null>(null);

  const {
    stages,
    activeStep,
    activeStepNumber,
    totalSteps,
    completedStepsCount,
    overallProgress,
    currentStageLabel,
    currentStageShortName,
    completedMilestonesSummary,
    currentFocus,
    afterThis,
    isFundingReady,
  } = journey;

  // The primary exact next step from recommendation engine, or fallback to activeStep
  const primaryAction = actions.length > 0 ? actions[0] : null;

  // Compute authentic estimated score impact using existing calculateFundingReadiness engine
  const impactEstimate = estimateActionImpact(business || null, primaryAction);

  // Compute lightweight score progression history
  const progression = extractScoreProgression(history, fundingReadiness.score);

  const handleCompleteAction = async (action: RecommendedAction) => {
    const keyToComplete = action.roadmapTaskKey || action.id;
    setCompletingKey(keyToComplete);
    const scoreBefore = fundingReadiness.score;

    try {
      if (onMarkActionComplete) {
        await onMarkActionComplete(keyToComplete, { title: action.title, category: action.category });
      } else if (onToggleComplete) {
        await onToggleComplete(keyToComplete);
      }

      setLastCompletedAction({
        id: action.id,
        taskKey: keyToComplete,
        title: action.title,
      });

      // Compute authentic score after this database update
      const updatedBusiness = { ...(business || {}) };
      if (action.roadmapTaskKey === 'task_reporting_accounts' || action.id === 'rec_credit_depth') {
        updatedBusiness.hasReportingAccounts = 'yes';
        updatedBusiness.businessCreditAccountCount = '1-3';
      } else if (action.roadmapTaskKey === 'task_build_business_card' || action.id === 'rec_credit_card') {
        updatedBusiness.hasBusinessCreditCard = 'yes';
      } else if (action.roadmapTaskKey === 'task_bank_account' || action.id === 'rec_bank_account') {
        updatedBusiness.hasBusinessBankAccount = 'yes';
      } else if (action.roadmapTaskKey === 'task_ein' || action.id === 'rec_ein') {
        updatedBusiness.hasEIN = 'yes';
      } else if (action.roadmapTaskKey === 'task_profile_bureau' || action.id === 'rec_credit_profile') {
        updatedBusiness.hasBusinessCreditProfile = 'yes';
      }

      const calcResult = calculateFundingReadiness(updatedBusiness);
      const scoreAfter = Math.max(calcResult.score, fundingReadiness.score);

      if (scoreAfter > scoreBefore) {
        setCompletionNotice({
          type: 'improved',
          prevScore: scoreBefore,
          newScore: scoreAfter,
          delta: scoreAfter - scoreBefore,
          taskTitle: action.title,
        });
      } else {
        setCompletionNotice({
          type: 'reassessed',
          newScore: scoreAfter,
          taskTitle: action.title,
        });
      }
    } catch (err) {
      console.warn('Failed to complete action:', err);
    } finally {
      setCompletingKey(null);
    }
  };

  const handleUndo = async (actionKey: string) => {
    try {
      if (onUndoActionComplete) {
        await onUndoActionComplete(actionKey);
      } else if (onToggleComplete) {
        await onToggleComplete(actionKey);
      }
      setLastCompletedAction(null);
      setCompletionNotice(null);
    } catch (err) {
      console.warn('Failed to undo action completion:', err);
    }
  };

  const handleReassess = async () => {
    setIsReassessing(true);
    try {
      if (onReassessReadiness) {
        await onReassessReadiness();
      }
    } finally {
      setIsReassessing(false);
    }
  };

  // Stage Icon resolver
  const getStageIcon = (iconName: string, iconClass: string) => {
    switch (iconName) {
      case 'establish':
        return <Building className={iconClass} />;
      case 'build':
        return <ShieldCheck className={iconClass} />;
      case 'strengthen':
        return <CreditCard className={iconClass} />;
      case 'funding_ready':
        return <Target className={iconClass} />;
      case 'scale':
        return <TrendingUp className={iconClass} />;
      default:
        return <Layers className={iconClass} />;
    }
  };

  const isProUser = isPro || isAdvisory;
  const isActionProLocked = !isProUser && primaryAction?.id === 'task_pro_gated';

  return (
    <Card className={`border-slate-200/90 bg-white shadow-xs overflow-hidden rounded-2xl ${className}`}>
      {/* ===================================================================== */}
      {/* TOP HERO: YOUR CREDIQLY JOURNEY & CURRENT POSITION                   */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-slate-950 via-brand-950 to-indigo-950 text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Section Subtitle & Milestones Tag */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-400/30 text-xs font-black uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-brand-300" />
                <span>YOUR CREDIQLY JOURNEY</span>
              </span>
              <span className="text-xs font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                Step {activeStepNumber} of {totalSteps}
              </span>
            </div>

            {/* High Funding Readiness Indicator */}
            {isFundingReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>YOU&apos;RE MOVING TOWARD FUNDING READINESS</span>
              </span>
            ) : progression.hasImproved ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>+{progression.netDelta} pts since starting</span>
              </span>
            ) : null}
          </div>

          {/* Current Position Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 1. Funding Readiness with Progression */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-200 block">
                  Funding Readiness
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/10">
                  {fundingReadiness.level}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white font-mono">
                    {fundingReadiness.score}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">/ 100</span>
                </div>

                {/* Score Trail (e.g. 60 → 66) */}
                {progression.historyTrail.length > 1 && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">
                      Readiness Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-300">
                      {progression.historyTrail.slice(-3).join(' → ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Current Stage */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-200 block">
                  Current Stage
                </span>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 block truncate">
                  {currentStageShortName}
                </span>
              </div>
              <span className="text-xs font-bold text-teal-300 bg-teal-900/40 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                Step {activeStepNumber}
              </span>
            </div>

            {/* 3. Milestones Completed */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-200 block">
                  Journey Progress
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {completedStepsCount} of {totalSteps}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">milestones</span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-mono">
                {overallProgress}%
              </span>
            </div>
          </div>

          {/* Completed Summary & Current Focus */}
          <div className="pt-2 border-t border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">You have completed:</span>
              {completedMilestonesSummary.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-emerald-200 bg-emerald-900/30 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-medium"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-brand-100">
              <span className="font-bold text-teal-300">Current focus:</span>
              <span className="font-medium text-white/95 line-clamp-1">{currentFocus}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* =================================================================== */}
        {/* REAL-TIME REASSESSMENT & IMPROVEMENT NOTICE                        */}
        {/* =================================================================== */}
        {completionNotice && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              completionNotice.type === 'improved'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  completionNotice.type === 'improved'
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {completionNotice.type === 'improved' ? (
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-slate-700" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black tracking-tight">
                    {completionNotice.type === 'improved'
                      ? `🎉 READINESS IMPROVED — ${completionNotice.prevScore} → ${completionNotice.newScore}`
                      : '✓ ACTION COMPLETED — Readiness Reassessed'}
                  </h4>
                  {completionNotice.type === 'improved' && completionNotice.delta && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-200 text-emerald-900 font-mono">
                      +{completionNotice.delta} readiness points
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {completionNotice.type === 'improved'
                    ? `Action completed. Your readiness has improved to ${completionNotice.newScore} / 100. Your next recommended step is active below.`
                    : `Your action has been marked complete. Your readiness has been reassessed (${completionNotice.newScore} / 100). Complete the next recommended action to continue improving your score.`}
                </p>
              </div>
            </div>

            {/* Notice Action Controls: Undo, Reassess, Close */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
              {/* Undo Button */}
              {lastCompletedAction && (
                <button
                  type="button"
                  onClick={() => handleUndo(lastCompletedAction.taskKey)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Marked by mistake? <span className="font-bold underline">Undo</span></span>
                </button>
              )}

              {/* Reassess Readiness Button */}
              {onReassessReadiness && (
                <button
                  type="button"
                  onClick={handleReassess}
                  disabled={isReassessing}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-brand-600 ${isReassessing ? 'animate-spin' : ''}`} />
                  <span>{isReassessing ? 'Reassessing...' : 'Reassess Readiness'}</span>
                </button>
              )}

              <button
                onClick={() => setCompletionNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION 1: YOUR EXACT NEXT STEP (Featured Center-of-View Hero)     */}
        {/* =================================================================== */}
        <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-brand-50/60 via-white to-slate-50/80 border-2 border-brand-300 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-200/70 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full">
                  YOUR NEXT STEP
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Prioritized guidance for {currentStageLabel}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {primaryAction ? primaryAction.title : activeStep.recommendedAction}
              </h3>
            </div>

            {/* Potential Score Estimate Callout */}
            <div className="shrink-0 flex items-center gap-2">
              {impactEstimate.isPredictable && impactEstimate.estimatedScore ? (
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Estimated After Completion
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs font-mono">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{impactEstimate.estimatedScore} / 100 (+{impactEstimate.estimatedDelta} pts)</span>
                  </div>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>{primaryAction?.potentialImpact || `Potential Impact: ${impactEstimate.impactLevel}`}</span>
                </span>
              )}
            </div>
          </div>

          {/* Structured Guidance: What -> Why It Matters -> Potential Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Why This Step */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Why This Step
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {primaryAction
                  ? primaryAction.explanation
                  : 'Based on your current profile, completing this milestone is one of the areas with the greatest opportunity to improve your funding readiness.'}
              </p>
            </div>

            {/* Why This Matters */}
            <div className="p-4 rounded-xl bg-white border border-brand-200/90 shadow-2xs space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800 block">
                Why This Matters For Funding
              </span>
              <p className="text-slate-600 leading-relaxed">
                {primaryAction ? primaryAction.whyItMatters : activeStep.whyItMatters}
              </p>
            </div>
          </div>

          {/* Potential Impact Explanation Line */}
          <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
            <span className="font-bold text-slate-700">Potential Impact:</span>
            <span>{impactEstimate.message}</span>
            <span className="text-slate-400 italic">({impactEstimate.disclaimer})</span>
          </div>

          {/* Hero Action Controls & CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-brand-200/60">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Estimated time: 5–10 minutes to execute</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Mark as Completed Button (if actionable roadmap task or recommendation) */}
              {(onMarkActionComplete || onToggleComplete) && primaryAction && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompleteAction(primaryAction)}
                  disabled={completingKey === (primaryAction.roadmapTaskKey || primaryAction.id)}
                  className="text-xs font-bold text-slate-800 hover:text-slate-900 border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  <span>
                    {completingKey === (primaryAction.roadmapTaskKey || primaryAction.id)
                      ? 'Reassessing...'
                      : 'Mark as Completed'}
                  </span>
                </Button>
              )}

              {/* Start This Step CTA */}
              {isActionProLocked ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onUpgradeToPro}
                  className="text-xs font-extrabold gap-2 shadow-xs bg-brand-600 hover:bg-brand-500 text-white"
                >
                  <Lock className="w-4 h-4" />
                  <span>Unlock This Step with Pro</span>
                </Button>
              ) : (
                <Link href={primaryAction ? primaryAction.actionHref : activeStep.actionHref}>
                  <Button
                    variant="primary"
                    size="md"
                    className="text-xs font-extrabold gap-2 shadow-xs bg-brand-600 hover:bg-brand-500 text-white whitespace-nowrap"
                  >
                    <span>
                      {primaryAction ? primaryAction.actionLabel : activeStep.actionLabel}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 2: YOUR ROAD AHEAD (5-Stage Simple Progression)            */}
        {/* =================================================================== */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>YOUR ROAD AHEAD</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                5 clear milestones guiding your business from profile completion to funding ready.
              </p>
            </div>
            <Link
              href="/roadmap"
              className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Full Roadmap Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 5 Progression Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stages.map((stg) => {
              const isCompleted = stg.status === 'completed';
              const isInProgress = stg.status === 'in_progress';

              return (
                <Link
                  key={stg.id}
                  href={stg.actionHref}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 group ${
                    isInProgress
                      ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-2 ring-brand-500/15'
                      : isCompleted
                      ? 'border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Status & Icon */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs ${
                            isInProgress
                              ? 'bg-brand-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isCompleted ? '✓' : stg.id}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 truncate">
                          Step {stg.id}
                        </span>
                      </div>

                      {getStageIcon(
                        stg.iconName,
                        `w-3.5 h-3.5 ${
                          isInProgress
                            ? 'text-brand-600'
                            : isCompleted
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`
                      )}
                    </div>

                    {/* Stage Title */}
                    <div>
                      <h5
                        className={`text-xs font-bold truncate ${
                          isInProgress ? 'text-brand-950 font-black' : isCompleted ? 'text-slate-900' : 'text-slate-600'
                        }`}
                      >
                        {stg.title}
                      </h5>
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider inline-block mt-0.5 ${
                          isInProgress
                            ? 'text-brand-700'
                            : isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCompleted
                          ? '✓ Completed'
                          : isInProgress
                          ? '● YOU ARE HERE'
                          : '○ Upcoming'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : isInProgress
                            ? 'bg-brand-600'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${stg.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 group-hover:text-brand-700">
                    <span className="truncate">{stg.actionLabel}</span>
                    <ArrowRight className="w-3 h-3 shrink-0 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 3: AFTER I COMPLETE THIS (Next Milestone Preview)          */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                AFTER I COMPLETE THIS
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-sm font-bold text-slate-900">
                  Next: {afterThis.nextStepTitle}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600 font-medium">
                  Potential impact: {afterThis.potentialReadiness}
                </span>
              </div>
            </div>
          </div>

          {/* Funding Destination Link when ready */}
          {isFundingReady ? (
            <Link href="/funding">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-xs whitespace-nowrap"
              >
                <span>Explore Funding Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <div className="shrink-0 text-xs text-slate-400 italic">
              Automated milestone progression
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
