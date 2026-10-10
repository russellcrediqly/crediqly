'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Lock,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MilestoneEducation } from '@/lib/roadmap/milestoneEducation';
import { useSubscription } from '@/context/SubscriptionContext';

interface RoadmapMilestoneCardProps {
  milestone: MilestoneEducation;
  isCompleted: boolean;
  isNextBest?: boolean;
  isBlockedByPrereq?: boolean;
  completedAt?: string;
  onOpenEducation: (milestone: MilestoneEducation) => void;
  onToggleComplete: (idOrKey: string) => void;
  onRequestReopen?: (idOrKey: string, title: string) => void;
  onAskAI?: (prompt: string, title: string) => void;
}

export const RoadmapMilestoneCard: React.FC<RoadmapMilestoneCardProps> = ({
  milestone,
  isCompleted,
  isNextBest = false,
  isBlockedByPrereq = false,
  completedAt,
  onOpenEducation,
  onToggleComplete,
  onRequestReopen,
  onAskAI,
}) => {
  const { isFoundation, isPro } = useSubscription();
  const hasFoundation = isFoundation || isPro;
  const isLocked = !hasFoundation && milestone.stageId > 1;

  const targetKey = milestone.roadmapTaskKey || milestone.id;

  const handleToggleClick = () => {
    if (isLocked && !isCompleted) {
      onOpenEducation(milestone);
      return;
    }
    if (isCompleted && onRequestReopen) {
      onRequestReopen(targetKey, milestone.title);
    } else {
      onToggleComplete(targetKey);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 border ${
        isCompleted
          ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          : isNextBest
          ? 'border-brand-300 bg-white ring-2 ring-brand-500/15 shadow-sm'
          : isBlockedByPrereq
          ? 'bg-white border-slate-200/80 opacity-80'
          : 'bg-white border-slate-200 hover:border-brand-200 hover:shadow-2xs'
      }`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left info */}
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Toggle checkbox button */}
            <button
              onClick={handleToggleClick}
              title={
                isCompleted
                  ? 'Click to request reopen'
                  : milestone.completionType === 'customer_confirmation'
                  ? 'Confirm milestone completed'
                  : 'Mark milestone complete'
              }
              className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110 focus:outline-none"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
              ) : isBlockedByPrereq ? (
                <Lock className="w-5 h-5 text-slate-300" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 hover:text-brand-500 transition-colors" />
              )}
            </button>

            <div className="space-y-1.5 min-w-0">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {milestone.stageName} • Step {milestone.stepOrder}
                </span>

                {/* Verification transparency label */}
                {milestone.completionType === 'system_verified' ? (
                  <StatusBadge status="Verified" size="sm" />
                ) : (
                  <StatusBadge status="Customer Confirmed" size="sm" />
                )}

                {/* Next Best Action flag */}
                {isNextBest && !isCompleted && (
                  <StatusBadge status="Next" size="sm" />
                )}

                {/* Prerequisite blocked notice */}
                {isBlockedByPrereq && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Prereq: {milestone.prerequisiteTitle || 'Previous Step'}</span>
                  </span>
                )}

                {/* Foundation Milestone notice */}
                {isLocked && !isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                    <span>Foundation Milestone</span>
                  </span>
                )}

                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/70">
                  +{milestone.weight} pts
                </span>
              </div>

              {/* Title */}
              <h4
                onClick={() => onOpenEducation(milestone)}
                className={`text-sm sm:text-base font-bold cursor-pointer transition-colors ${
                  isCompleted
                    ? 'text-slate-700 line-through decoration-slate-300'
                    : 'text-slate-900 hover:text-brand-600'
                }`}
              >
                {milestone.title}
              </h4>

              {/* Short explanation */}
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {milestone.whyItMatters}
              </p>

              {/* Meta details */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium pt-0.5 flex-wrap">
                <span>Effort: <strong className="text-slate-600">{milestone.estimatedEffort}</strong></span>
                <span>•</span>
                <span>Impact: <strong className="text-slate-600">{milestone.potentialImpact}</strong></span>
                {isCompleted && completedAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Clock className="w-3 h-3" />
                      Completed {new Date(completedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {/* Ask AI button */}
              {onAskAI && (
                <button
                  type="button"
                  onClick={() => onAskAI(milestone.askAiPrompt, milestone.title)}
                  title="Ask AI Advisor about this step"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-md border border-brand-200 transition-colors"
                >
                  <MessageSquare className="w-3 h-3 text-brand-600" />
                  <span>Ask AI</span>
                </button>
              )}

              {/* Learn More / Micro-education guide */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenEducation(milestone)}
                className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1 h-auto gap-1"
              >
                <span>Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Action button */}
            {isLocked && !isCompleted ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenEducation(milestone)}
                className="text-xs px-3 py-1.5 h-auto bg-brand-600 hover:bg-brand-500 text-white gap-1 shadow-2xs font-bold"
              >
                <Lock className="w-3 h-3" />
                <span>Unlock Step</span>
              </Button>
            ) : isCompleted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleClick}
                className="text-xs px-3 py-1.5 h-auto border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <span>Reopen</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {milestone.actionHref && (
                  <Link href={milestone.actionHref}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 py-1.5 h-auto border-brand-200 text-brand-800 hover:bg-brand-50 font-bold gap-1"
                    >
                      <span>{milestone.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleToggleClick}
                  className="text-xs px-3 py-1.5 h-auto bg-brand-600 hover:bg-brand-500 text-white font-bold whitespace-nowrap"
                >
                  {milestone.completionType === 'customer_confirmation'
                    ? 'Confirm Step'
                    : 'Complete This Step'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
