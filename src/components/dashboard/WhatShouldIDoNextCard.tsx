'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Target,
  ShieldCheck,
} from 'lucide-react';
import type { RecommendedAction } from '@/lib/recommendations/nextActionsEngine';

interface WhatShouldIDoNextCardProps {
  actions: RecommendedAction[];
  onToggleComplete?: (taskKey: string) => Promise<void>;
  isPro?: boolean;
  className?: string;
}

export const WhatShouldIDoNextCard: React.FC<WhatShouldIDoNextCardProps> = ({
  actions,
  onToggleComplete,
  isPro = false,
  className = '',
}) => {
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleToggle = async (taskKey: string) => {
    if (!onToggleComplete) return;
    setCompletingKey(taskKey);
    try {
      await onToggleComplete(taskKey);
    } catch (err) {
      console.warn('Failed to complete recommendation:', err);
    } finally {
      setCompletingKey(null);
    }
  };

  const topAction = actions.length > 0 ? actions[0] : null;
  const subsequentActions = actions.length > 1 ? actions.slice(1, 3) : [];

  return (
    <Card className={`border-slate-200/90 bg-white shadow-xs overflow-hidden rounded-2xl ${className}`}>
      <CardContent className="p-6 sm:p-8 space-y-6">
        {actions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              All prioritized foundational actions completed
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your business foundation, commercial credit depth, and funding profile are in strong standing. Maintain clean, on-time trade payments.
            </p>
            <div className="pt-2">
              <Link href="/funding">
                <Button size="md" variant="primary" className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs">
                  Explore Funding Matches →
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* DOMINANT PRIMARY ACTION FOCAL POINT */}
            {topAction && (
              <div className="space-y-5">
                {/* Eyebrow & Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                      YOUR NEXT STEP
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Step #{topAction.order} of {actions.length}
                    </span>
                    <StatusBadge
                      status={topAction.priority === 'High' ? 'Needs Attention' : 'Next'}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>15–30 min</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-emerald-700">
                      High Impact
                    </span>
                  </div>
                </div>

                {/* Main Headline */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {topAction.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {topAction.whyItMatters}
                  </p>
                </div>

                {/* Structured Action Guidance */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Execution Steps
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span className="leading-snug">Review stage-matched requirements and criteria</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span className="leading-snug">Select the verified option fitting your entity</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span className="leading-snug">Complete the direct provider application</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        4
                      </span>
                      <span className="leading-snug">Confirm completion to advance readiness index</span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA & Secondary Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Info className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      <span>{showExplanation ? 'Hide Rationale' : 'Why am I seeing this?'}</span>
                    </Button>

                    <a
                      href="#ai-mentor"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                      <span>Ask AI Advisor</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {onToggleComplete && topAction.roadmapTaskKey && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggle(topAction.roadmapTaskKey!)}
                        disabled={completingKey === topAction.roadmapTaskKey}
                        className="text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        <span>{completingKey === topAction.roadmapTaskKey ? 'Updating...' : 'Mark Completed'}</span>
                      </Button>
                    )}

                    <Link href={topAction.actionHref}>
                      <Button
                        variant="primary"
                        size="md"
                        className="text-xs font-bold gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-xs whitespace-nowrap"
                      >
                        <span>{topAction.actionLabel || 'View Recommended Options'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Collapsible Rationale Block */}
                {showExplanation && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 transition-all">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                      <span>Underwriting &amp; Algorithmic Rationale:</span>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      {topAction.explanation} Based on your completed milestones, this action directly unblocks next-tier credit tradelines and commercial underwriting criteria.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* UP NEXT QUEUE (Max 2 upcoming milestones in clean quiet rows) */}
            {subsequentActions.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 pb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-slate-400" />
                    <span>UP NEXT</span>
                  </span>
                  <Link
                    href="/roadmap"
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>View Full Roadmap</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {subsequentActions.map((action, idx) => (
                    <div
                      key={action.id}
                      className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                          {action.order}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">
                            {action.title}
                          </h4>
                          <p className="text-slate-500 text-[11px] truncate max-w-lg mt-0.5">
                            {action.whyItMatters}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {idx === 0 ? 'Next Up' : 'Upcoming'}
                        </span>
                        <Link href={action.actionHref}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs font-semibold gap-1 h-7 text-slate-800"
                          >
                            <span>{action.actionLabel}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
