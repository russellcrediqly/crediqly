'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CustomerJourneyResult } from '@/lib/roadmap/customerJourney';
import type { RecommendedAction } from '@/lib/recommendations/nextActionsEngine';
import type { FundingReadinessResult } from '@/types/funding';
import type { BusinessProfile } from '@/types/business';
import type { ProgressHistoryItem } from '@/types/progress';
import { extractScoreProgression } from '@/lib/supabase/progressService';
import { estimateActionImpact } from '@/lib/readiness/potentialScoreEngine';
import {
  calculateMilestoneReadiness,
  ReadinessMilestoneDefinition,
  ReadinessMilestoneResult,
} from '@/lib/readiness/readinessMilestoneEngine';
import { MilestoneConfirmationModal } from '@/components/dashboard/MilestoneConfirmationModal';
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
  Info,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
} from 'lucide-react';

interface GuidedJourneyCardProps {
  journey: CustomerJourneyResult;
  fundingReadiness: FundingReadinessResult;
  business?: Partial<BusinessProfile> | null;
  history?: ProgressHistoryItem[];
  actions: RecommendedAction[];
  completedTasks?: string[];
  milestoneOverrides?: Record<string, Partial<ReadinessMilestoneDefinition>>;
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
  completedTasks = [],
  milestoneOverrides,
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
  const [confirmingMilestone, setConfirmingMilestone] = useState<ReadinessMilestoneDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [lastCompletedAction, setLastCompletedAction] = useState<{
    id: string;
    taskKey: string;
    title: string;
    weight?: number;
  } | null>(null);
  const [completionNotice, setCompletionNotice] = useState<{
    type: 'improved' | 'reassessed';
    prevScore?: number;
    newScore: number;
    delta?: number;
    taskTitle?: string;
  } | null>(null);

  const [selectedStageFilter, setSelectedStageFilter] = useState<'all' | 'foundation' | 'bureau_tradelines' | 'revolving_seasoning' | 'funding_readiness'>('all');
  const [showMilestonesList, setShowMilestonesList] = useState(true);

  // Compute the authentic 0–100 Business Credit & Funding Readiness Milestone progress
  const milestoneResult: ReadinessMilestoneResult = useMemo(() => {
    const combinedCompleted = Array.from(
      new Set([...(business?.completedDbTasks || []), ...(completedTasks || [])])
    );
    return calculateMilestoneReadiness(business || null, combinedCompleted, milestoneOverrides);
  }, [business, completedTasks, milestoneOverrides]);

  const activeMilestone = milestoneResult.nextMilestone;

  // Filtered milestones based on stage selection
  const filteredMilestones = useMemo(() => {
    if (selectedStageFilter === 'all') return milestoneResult.items;
    return milestoneResult.items.filter((item) => item.definition.category === selectedStageFilter);
  }, [milestoneResult.items, selectedStageFilter]);

  // The primary exact next step from recommendation engine, or fallback to activeStep
  const primaryAction = actions.length > 0 ? actions[0] : null;

  // Compute authentic estimated score impact using existing calculateFundingReadiness engine
  const impactEstimate = estimateActionImpact(business || null, primaryAction);

  // Compute lightweight score progression history
  const progression = extractScoreProgression(history, milestoneResult.score);

  // Handles confirmation modal submit for customer-verified milestones
  const handleConfirmMilestone = async () => {
    if (!confirmingMilestone) return;
    const milestone = confirmingMilestone;
    const keyToComplete = milestone.roadmapTaskKey || milestone.id;
    setModalLoading(true);
    setCompletingKey(keyToComplete);
    const scoreBefore = milestoneResult.score;

    try {
      if (onMarkActionComplete) {
        await onMarkActionComplete(keyToComplete, {
          milestoneId: milestone.id,
          title: milestone.title,
          category: milestone.categoryLabel,
          weight: milestone.weight,
        });
      } else if (onToggleComplete) {
        await onToggleComplete(keyToComplete);
      }

      const scoreAfter = Math.min(100, scoreBefore + milestone.weight);

      setLastCompletedAction({
        id: milestone.id,
        taskKey: keyToComplete,
        title: milestone.title,
        weight: milestone.weight,
      });

      setCompletionNotice({
        type: 'improved',
        prevScore: scoreBefore,
        newScore: scoreAfter,
        delta: milestone.weight,
        taskTitle: milestone.title,
      });

      setIsModalOpen(false);
      setConfirmingMilestone(null);
    } catch (err) {
      console.warn('Failed to complete milestone:', err);
    } finally {
      setModalLoading(false);
      setCompletingKey(null);
    }
  };

  const handleCompleteAction = async (target: RecommendedAction | ReadinessMilestoneDefinition) => {
    // If it is a milestone requiring customer confirmation, trigger modal
    if ('completionType' in target && target.completionType === 'customer_confirmation') {
      setConfirmingMilestone(target as ReadinessMilestoneDefinition);
      setIsModalOpen(true);
      return;
    }

    const keyToComplete = ('roadmapTaskKey' in target && target.roadmapTaskKey) ? target.roadmapTaskKey : target.id;
    setCompletingKey(keyToComplete);
    const scoreBefore = milestoneResult.score;
    const weight = 'weight' in target && typeof target.weight === 'number' ? target.weight : 5;

    try {
      if (onMarkActionComplete) {
        await onMarkActionComplete(keyToComplete, {
          title: target.title,
          category: 'categoryLabel' in target ? target.categoryLabel : (target as RecommendedAction).category,
          weight,
        });
      } else if (onToggleComplete) {
        await onToggleComplete(keyToComplete);
      }

      const scoreAfter = Math.min(100, scoreBefore + weight);

      setLastCompletedAction({
        id: target.id,
        taskKey: keyToComplete,
        title: target.title,
        weight,
      });

      setCompletionNotice({
        type: 'improved',
        prevScore: scoreBefore,
        newScore: scoreAfter,
        delta: weight,
        taskTitle: target.title,
      });
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

  const categoriesConfig = useMemo(() => {
    const cats: {
      id: string;
      title: string;
      label: string;
      maxWeight: number;
      earnedWeight: number;
      totalCount: number;
      completedCount: number;
      status: 'completed' | 'in_progress' | 'upcoming';
      actionHref: string;
      icon: any;
    }[] = [
      {
        id: 'foundation',
        title: 'Foundation & Entity',
        label: 'Step 1',
        maxWeight: 25,
        earnedWeight: 0,
        totalCount: 0,
        completedCount: 0,
        status: 'upcoming',
        actionHref: '/business',
        icon: Building,
      },
      {
        id: 'bureau_tradelines',
        title: 'Credit & Tradelines',
        label: 'Step 2',
        maxWeight: 25,
        earnedWeight: 0,
        totalCount: 0,
        completedCount: 0,
        status: 'upcoming',
        actionHref: '/products?category=net_30',
        icon: ShieldCheck,
      },
      {
        id: 'revolving_seasoning',
        title: 'Revolving & Seasoning',
        label: 'Step 3',
        maxWeight: 25,
        earnedWeight: 0,
        totalCount: 0,
        completedCount: 0,
        status: 'upcoming',
        actionHref: '/products?category=business_credit_cards',
        icon: CreditCard,
      },
      {
        id: 'funding_readiness',
        title: 'Funding Preparation',
        label: 'Step 4',
        maxWeight: 25,
        earnedWeight: 0,
        totalCount: 0,
        completedCount: 0,
        status: 'upcoming',
        actionHref: '/funding',
        icon: Target,
      },
    ];

    milestoneResult.items.forEach((item) => {
      const cat = cats.find((c) => c.id === item.definition.category);
      if (cat) {
        cat.totalCount += 1;
        if (item.isCompleted) {
          cat.completedCount += 1;
          cat.earnedWeight += item.definition.weight;
        }
      }
    });

    cats.forEach((cat) => {
      if (cat.earnedWeight >= cat.maxWeight) {
        cat.status = 'completed';
      } else if (cat.earnedWeight > 0 || (activeMilestone && activeMilestone.category === cat.id)) {
        cat.status = 'in_progress';
      } else {
        cat.status = 'upcoming';
      }
    });

    return cats;
  }, [milestoneResult, activeMilestone]);

  const subsequentMilestone = useMemo(() => {
    if (!activeMilestone) return null;
    const incompleteItems = milestoneResult.items.filter(
      (i) => !i.isCompleted && i.definition.id !== activeMilestone.id
    );
    return incompleteItems.length > 0 ? incompleteItems[0].definition : null;
  }, [milestoneResult.items, activeMilestone]);

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
                <span>{business?.businessName ? `${business.businessName.toUpperCase()}'S FUNDING JOURNEY` : 'YOUR CREDIQLY JOURNEY'}</span>
              </span>
              <span className="text-xs font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                Milestone {activeMilestone?.stepOrder || (milestoneResult.isJourneyComplete ? milestoneResult.totalMilestonesCount : 1)} of {milestoneResult.totalMilestonesCount}
              </span>
            </div>

            {/* High Funding Readiness Indicator */}
            {milestoneResult.isJourneyComplete ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>🎯 100/100 READINESS JOURNEY COMPLETE</span>
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
                  Funding Readiness Score
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/10">
                  {milestoneResult.currentStage}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white font-mono">
                    {milestoneResult.score}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">/ 100</span>
                </div>

                {/* Score Trail (e.g. 0 → 10 → 35) */}
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
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-200 block">
                  Current Program Stage
                </span>
                <span className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5 block truncate" title={milestoneResult.currentStage}>
                  {milestoneResult.currentStage}
                </span>
              </div>
              <span className="shrink-0 text-xs font-bold text-teal-300 bg-teal-900/40 border border-teal-500/30 px-2.5 py-1 rounded-lg whitespace-nowrap">
                Stage {milestoneResult.currentStageNumber} of 4
              </span>
            </div>

            {/* 3. Milestones Completed */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-200 block">
                  Milestones Completed
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {milestoneResult.completedMilestonesCount} of {milestoneResult.totalMilestonesCount}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">milestones</span>
                </div>
              </div>
              <span className="shrink-0 text-xs font-black text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-mono">
                {milestoneResult.percentage}%
              </span>
            </div>
          </div>

          {/* Legal Transparency & Integrity Disclaimer */}
          <div className="pt-2 border-t border-white/15 text-[11px] text-slate-300/90 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-300 shrink-0 mt-0.5" />
            <span>
              <strong>Crediqly Readiness Program:</strong> {milestoneResult.scoreExplanation} {milestoneResult.legalDisclaimer}
            </span>
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
                    ? `Milestone verified and completed. Your readiness score is mathematically updated to ${completionNotice.newScore} / 100. Next recommended milestone is active below.`
                    : `Your action has been recorded. Your readiness has been reassessed (${completionNotice.newScore} / 100).`}
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
        {/* SECTION 1: YOUR EXACT NEXT STEP / 100 COMPLETION HERO               */}
        {/* =================================================================== */}
        {milestoneResult.isJourneyComplete ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white border-2 border-emerald-500/80 shadow-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto text-3xl">
              🎯
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 inline-block">
                MILESTONE PROGRAM COMPLETED
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                🎯 CREDIQLY READINESS JOURNEY COMPLETE
              </h3>
              <p className="text-emerald-300 font-extrabold text-base sm:text-lg">
                Readiness Score: 100 / 100 • Status: Fully Prepared for Business Funding
              </p>
              <p className="text-xs text-slate-300 max-w-xl mx-auto pt-1 leading-relaxed">
                You have successfully completed all 14 business credit and funding readiness milestones. Your company profile demonstrates full institutional foundation, active bureau files, revolving credit capacity, and funding documentation readiness.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/funding">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-8 py-3.5 gap-2 shadow-lg hover:shadow-emerald-500/25"
                >
                  <span>Explore Funding Matches</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        ) : activeMilestone ? (
          <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-brand-50/60 via-white to-slate-50/80 border-2 border-brand-300 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-200/70 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full">
                    YOUR NEXT STEP • MILESTONE #{activeMilestone.stepOrder}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {activeMilestone.categoryLabel}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    activeMilestone.completionType === 'customer_confirmation'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : activeMilestone.completionType === 'admin_verified'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-teal-50 text-teal-700 border-teal-200'
                  }`}>
                    {activeMilestone.completionType === 'customer_confirmation'
                      ? 'Customer Confirmation'
                      : activeMilestone.completionType === 'admin_verified'
                      ? 'Admin Verified'
                      : 'System Verified'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeMilestone.title}
                </h3>
              </div>

              {/* Exact Weight Point Callout */}
              <div className="shrink-0">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3.5 py-1.5 rounded-full shadow-2xs font-mono">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+{activeMilestone.weight} pts towards Readiness Score</span>
                </div>
              </div>
            </div>

            {/* Structured Guidance: What -> Why It Matters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* Why This Step */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Why This Step
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {activeMilestone.description}
                </p>
              </div>

              {/* Why This Matters */}
              <div className="p-4 rounded-xl bg-white border border-brand-200/90 shadow-2xs space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800 block">
                  Why This Matters For Funding
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {activeMilestone.whyItMatters}
                </p>
              </div>
            </div>

            {/* Hero Action Controls & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-brand-200/60">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {activeMilestone.completionType === 'customer_confirmation'
                    ? 'Requires confirmation modal upon completion'
                    : 'Auto-verified or updated directly in business profile'}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Mark as Completed Button */}
                {(onMarkActionComplete || onToggleComplete) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteAction(activeMilestone)}
                    disabled={completingKey === (activeMilestone.roadmapTaskKey || activeMilestone.id)}
                    className="text-xs font-bold text-slate-800 hover:text-slate-900 border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    <span>
                      {completingKey === (activeMilestone.roadmapTaskKey || activeMilestone.id)
                        ? 'Updating...'
                        : 'Mark as Complete'}
                    </span>
                  </Button>
                )}

                {/* Primary CTA button */}
                <Link href={activeMilestone.actionHref}>
                  <Button
                    variant="primary"
                    size="md"
                    className="text-xs font-extrabold gap-2 shadow-xs bg-brand-600 hover:bg-brand-500 text-white whitespace-nowrap"
                  >
                    <span>{activeMilestone.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* =================================================================== */}
        {/* SECTION 2: YOUR ROAD AHEAD (4 Core Readiness Milestone Categories) */}
        {/* =================================================================== */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>YOUR ROAD AHEAD • 4 READINESS STAGES (14 MILESTONES)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                4 core categories totaling 100 points. Click any stage below to inspect its individual milestones.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedStageFilter('all')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                  selectedStageFilter === 'all'
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                All 14 Milestones
              </button>
              <Link
                href="/roadmap"
                className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View Full Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4 Progression Cards (Interactive Stage Selectors) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoriesConfig.map((cat, idx) => {
              const isCompleted = cat.status === 'completed';
              const isInProgress = cat.status === 'in_progress';
              const isSelected = selectedStageFilter === cat.id;
              const IconComp = cat.icon;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedStageFilter(selectedStageFilter === cat.id ? 'all' : (cat.id as any))}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 cursor-pointer text-left select-none ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-2 ring-brand-600/30'
                      : isInProgress
                      ? 'border-brand-300 bg-brand-50/30 hover:border-brand-400 hover:bg-brand-50/50'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 hover:bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2.5 min-w-0">
                    {/* Status & Icon */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 truncate">
                          STAGE {idx + 1}
                        </span>
                      </div>

                      <IconComp
                        className={`w-4 h-4 shrink-0 ${
                          isInProgress
                            ? 'text-brand-600'
                            : isCompleted
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`}
                      />
                    </div>

                    {/* Stage Title & Points */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <h5
                          className={`text-xs font-bold truncate min-w-0 flex-1 ${
                            isSelected || isInProgress
                              ? 'text-brand-950 font-black'
                              : isCompleted
                              ? 'text-slate-900'
                              : 'text-slate-600'
                          }`}
                          title={cat.title}
                        >
                          {cat.title}
                        </h5>
                        <span className="text-[11px] font-bold font-mono text-brand-700 shrink-0">
                          {cat.earnedWeight}/{cat.maxWeight} pts
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider inline-block ${
                          isCompleted
                            ? 'text-emerald-700'
                            : isInProgress
                            ? 'text-brand-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCompleted
                          ? '✓ Completed'
                          : isInProgress
                          ? '● In Progress'
                          : '○ Upcoming'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : isInProgress
                            ? 'bg-brand-600'
                            : 'bg-slate-300'
                        }`}
                        style={{
                          width: `${Math.round((cat.earnedWeight / cat.maxWeight) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>
                      {cat.completedCount} of {cat.totalCount} milestones
                    </span>
                    <span className="text-brand-600 font-bold flex items-center gap-0.5 text-[10px] uppercase">
                      <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================================================================= */}
          {/* SECTION 2B: ALL 14 READINESS JOURNEY MILESTONES (Interactive List) */}
          {/* ================================================================= */}
          <div className="pt-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {selectedStageFilter === 'all'
                    ? 'All 14 Journey Milestones'
                    : `Stage Milestones • ${categoriesConfig.find((c) => c.id === selectedStageFilter)?.title}`}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Showing {filteredMilestones.length} of {milestoneResult.totalMilestonesCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedStageFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStageFilter('all')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMilestonesList(!showMilestonesList)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <span>{showMilestonesList ? 'Collapse Milestones' : 'Expand Milestones'}</span>
                  {showMilestonesList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showMilestonesList && (
              <div className="space-y-2.5">
                {filteredMilestones.map((item) => {
                  const def = item.definition;
                  const isCompleted = item.isCompleted;
                  const isNext = item.isNextStep;
                  const isBlocked = item.isBlockedByPrereq;

                  return (
                    <div
                      key={def.id}
                      className={`p-4 sm:p-4.5 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-emerald-50/20 border-emerald-200/80 text-slate-800'
                          : isNext
                          ? 'bg-brand-50/40 border-brand-300 ring-2 ring-brand-500/20 shadow-xs'
                          : isBlocked
                          ? 'bg-slate-50/60 border-slate-200 text-slate-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                        {/* Milestone Identity & Description */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Step Number & Status Circle */}
                          <div className="shrink-0 pt-0.5">
                            {isCompleted ? (
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                                ✓
                              </div>
                            ) : isNext ? (
                              <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs animate-pulse font-mono">
                                #{def.stepOrder}
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200 font-mono">
                                #{def.stepOrder}
                              </div>
                            )}
                          </div>

                          {/* Text Info */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <h5
                                className={`text-sm font-bold tracking-tight ${
                                  isCompleted
                                    ? 'text-emerald-950 font-black'
                                    : isNext
                                    ? 'text-brand-950 font-black'
                                    : 'text-slate-900 font-bold'
                                }`}
                              >
                                {def.title}
                              </h5>

                              {/* Exact Points Badge */}
                              <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                                +{def.weight} pts
                              </span>

                              {/* Stage Tag */}
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {def.categoryLabel}
                              </span>

                              {/* Verification Type Badge */}
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                  def.completionType === 'customer_confirmation'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : def.completionType === 'admin_verified'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-teal-50 text-teal-700 border-teal-200'
                                }`}
                              >
                                {def.completionType === 'customer_confirmation'
                                  ? 'Customer Confirmation'
                                  : def.completionType === 'admin_verified'
                                  ? 'Admin Verified'
                                  : 'System Verified'}
                              </span>

                              {/* Status Tag */}
                              {isCompleted ? (
                                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  ✓ Completed
                                </span>
                              ) : isNext ? (
                                <span className="text-[10px] font-black text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                  ● Current Next Step
                                </span>
                              ) : isBlocked ? (
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Prerequisite Pending
                                </span>
                              ) : null}
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed font-normal">
                              {def.description}
                            </p>
                            <p className="text-[11px] text-brand-800/90 font-medium leading-relaxed">
                              <strong className="text-brand-900">Why it matters for funding:</strong> {def.whyItMatters}
                            </p>
                          </div>
                        </div>

                        {/* Milestone Actions */}
                        <div className="shrink-0 flex items-center gap-2 self-start sm:self-center pt-2 sm:pt-0">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300/80 px-3 py-1.5 rounded-lg">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <>
                              {/* Mark as Complete button */}
                              {(onMarkActionComplete || onToggleComplete) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCompleteAction(def)}
                                  disabled={completingKey === (def.roadmapTaskKey || def.id)}
                                  className="text-xs font-bold border-slate-300 text-slate-800 bg-white hover:bg-slate-50 shadow-2xs whitespace-nowrap"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                  <span>
                                    {completingKey === (def.roadmapTaskKey || def.id)
                                      ? 'Updating...'
                                      : 'Mark Complete'}
                                  </span>
                                </Button>
                              )}

                              {/* Primary Action Button */}
                              <Link href={def.actionHref}>
                                <Button
                                  variant={isNext ? 'primary' : 'outline'}
                                  size="sm"
                                  className={`text-xs font-bold whitespace-nowrap gap-1 ${
                                    isNext
                                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-xs'
                                      : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{def.actionLabel}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION 3: AFTER I COMPLETE THIS (Next Step & Funding Reveal)       */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                AFTER I COMPLETE THIS • FUNDING UNLOCK PROGRESSION
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {subsequentMilestone ? (
                  <>
                    <span className="text-sm font-bold text-slate-900">
                      Next: {subsequentMilestone.title}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      Potential impact: +{subsequentMilestone.weight} pts ({subsequentMilestone.categoryLabel})
                    </span>
                  </>
                ) : milestoneResult.isJourneyComplete ? (
                  <span className="text-sm font-bold text-emerald-700">
                    🎯 All 14 milestones complete! Ready for matched commercial funding facilities.
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-900">
                    Final milestone in the program before 100/100 complete.
                  </span>
                )}
              </div>
              {/* Dynamic Funding Unlock Guidance */}
              <p className="text-xs text-brand-700 font-semibold flex items-center gap-1.5 pt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span>
                  {milestoneResult.score < 25
                    ? 'Completing Stage 1 unlocks your first Tier-1 vendor credit & commercial checking accounts.'
                    : milestoneResult.score < 50
                    ? 'Completing Stage 2 establishes reporting bureau accounts and unlocks revolving business cards ($5K–$25K).'
                    : milestoneResult.score < 75
                    ? 'Completing Stage 3 optimizes payment track record and unlocks commercial credit lines ($25K–$100K).'
                    : milestoneResult.score < 100
                    ? 'Completing Stage 4 finalizes loan documentation for full term loans & SBA capital facilities ($100K–$500K+).'
                    : 'All commercial funding tiers and institutional lender criteria are fully unlocked!'}
                </span>
              </p>
            </div>
          </div>

          {/* Funding Destination Link */}
          <div className="shrink-0 flex items-center gap-2">
            <Link href="/funding">
              <Button
                variant="primary"
                size="sm"
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs gap-1.5 shadow-xs whitespace-nowrap"
              >
                <span>Reveal Funding Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>

      {/* Customer Confirmation Modal */}
      <MilestoneConfirmationModal
        milestone={confirmingMilestone}
        isOpen={isModalOpen}
        onClose={() => {
          if (!modalLoading) {
            setIsModalOpen(false);
            setConfirmingMilestone(null);
          }
        }}
        onConfirm={handleConfirmMilestone}
        isLoading={modalLoading}
      />
    </Card>
  );
};

