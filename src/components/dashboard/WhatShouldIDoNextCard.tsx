'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Info,
  Zap,
  Target,
  Clock,
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

  const renderPriorityBadge = (priority: RecommendedAction['priority']) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>High Priority</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Recommended</span>
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Good / On Track</span>
          </span>
        );
    }
  };

  const topAction = actions.length > 0 ? actions[0] : null;
  const subsequentActions = actions.length > 1 ? actions.slice(1) : [];

  return (
    <Card className={`border-brand-200 bg-white shadow-sm overflow-hidden rounded-2xl ${className}`}>
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-950 via-brand-950 to-indigo-950 text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-400/30 text-xs font-black uppercase tracking-wider backdrop-blur-xs">
                <Zap className="w-3.5 h-3.5 text-brand-300" />
                <span>Intelligent Recommendation Engine</span>
              </span>
              <span className="text-xs font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                {actions.length} Prioritized {actions.length === 1 ? 'Action' : 'Actions'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              WHAT SHOULD I DO NEXT?
            </h2>
            <p className="text-xs sm:text-sm text-brand-100/90 max-w-2xl leading-relaxed">
              Dynamically prioritized guidance based on your profile completion, credit depth, cash-flow stability, and funding requirements.
            </p>
          </div>

          <div className="shrink-0 hidden md:block">
            <Link href="/roadmap">
              <Button
                variant="outline-white"
                size="sm"
                className="text-xs font-bold gap-1.5 shadow-sm"
              >
                <span>View Full Roadmap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8 space-y-6">
        {actions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-emerald-950">
              All prioritized foundational actions completed!
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
              Your business profile, commercial credit depth, and funding baseline are in great standing. Continue maintaining clean on-time payment history.
            </p>
            <div className="pt-2">
              <Link href="/funding">
                <Button size="md" variant="primary" className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm">
                  Explore Capital &amp; Funding Matches →
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* FEATURED RECOMMENDATION HERO (Center-of-View Experience) */}
            {topAction && (
              <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/40 border-2 border-brand-400/80 shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-200/70 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                      #{topAction.order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md">
                          Top Recommended Action
                        </span>
                        {renderPriorityBadge(topAction.priority)}
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                        {topAction.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{topAction.potentialImpact}</span>
                    </span>
                  </div>
                </div>

                {/* Structured Guidance: What -> Why -> Next Step */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-white/90 border border-slate-200/90 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      1. Current Assessment
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {topAction.explanation}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/90 border border-brand-200/80 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800 block">
                      2. Why This Matters For Funding
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {topAction.whyItMatters}
                    </p>
                  </div>
                </div>

                {/* Hero Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-brand-200/60">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Estimated time: 5–10 minutes to review and execute</span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {onToggleComplete && topAction.roadmapTaskKey && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(topAction.roadmapTaskKey!)}
                        disabled={completingKey === topAction.roadmapTaskKey}
                        className="text-xs font-bold text-slate-800 hover:text-slate-900 border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                        <span>{completingKey === topAction.roadmapTaskKey ? 'Updating...' : 'Mark Complete'}</span>
                      </Button>
                    )}

                    <Link href={topAction.actionHref}>
                      <Button
                        variant="primary"
                        size="md"
                        className="text-xs font-extrabold gap-2 shadow-sm bg-brand-600 hover:bg-brand-500 text-white whitespace-nowrap"
                      >
                        <span>{topAction.actionLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* SUBSEQUENT RECOMMENDED ACTIONS (#2, #3) */}
            {subsequentActions.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Additional Next Steps in Queue
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {subsequentActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-5 sm:p-6 rounded-2xl bg-white hover:bg-slate-50/60 border border-slate-200/90 hover:border-slate-300 transition-all duration-200 shadow-2xs space-y-4"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                            #{action.order}
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              {action.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {renderPriorityBadge(action.priority)}
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>{action.potentialImpact}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                            Current Assessment
                          </span>
                          <p className="text-slate-700 leading-relaxed">
                            {action.explanation}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800 block">
                            Why It Matters
                          </span>
                          <p className="text-slate-600 leading-relaxed">
                            {action.whyItMatters}
                          </p>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="text-[11px] text-slate-400 font-medium">
                          Guidance recommendation • Unlocks as you complete earlier milestones
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {onToggleComplete && action.roadmapTaskKey && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggle(action.roadmapTaskKey!)}
                              disabled={completingKey === action.roadmapTaskKey}
                              className="text-xs font-semibold text-slate-800 hover:text-slate-900 border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              <span>{completingKey === action.roadmapTaskKey ? 'Updating...' : 'Mark Complete'}</span>
                            </Button>
                          )}

                          <Link href={action.actionHref}>
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs font-bold gap-1.5 shadow-xs bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap"
                            >
                              <span>{action.actionLabel}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pro Context Banner */}
        {!isPro && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Pro Guidance: </strong>
                Upgrade to Pro to unlock direct vendor application walkthroughs, Tier 2/3 tradeline catalogs, and customized bank checklists.
              </span>
            </div>
            <Link href="/pricing" className="shrink-0 font-bold text-brand-700 hover:text-brand-800 hover:underline">
              Explore Pro ($39/mo) →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

