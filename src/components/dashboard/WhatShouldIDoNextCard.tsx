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
              <span className="text-xs font-black uppercase tracking-wider text-teal-300 bg-teal-900/60 border border-teal-400/40 px-2.5 py-0.5 rounded-full">
                YOUR NEXT STEP
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
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                      #{topAction.order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-md">
                          YOUR NEXT STEP
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
                      <span>Potential impact: {topAction.priority === 'High' ? 'High' : 'Moderate'}</span>
                    </span>
                  </div>
                </div>

                {/* Why this matters */}
                <div className="p-4 rounded-xl bg-white border border-brand-200/80 shadow-2xs space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800 block">
                    Why this matters
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {topAction.whyItMatters}
                  </p>
                </div>

                {/* What to do (4-Step Action Guide) */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50/90 border border-slate-200/90 shadow-2xs space-y-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block">
                    What to do
                  </span>
                  <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    <li className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Review the recommended options</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Choose an option that fits your business</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Complete the provider application</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        4
                      </span>
                      <span>Return to Crediqly and mark the milestone complete</span>
                    </li>
                  </ol>
                </div>

                {/* Effort, Impact & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-brand-200/60">
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Estimated effort: <strong>15–30 minutes</strong></span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-600">
                      Potential impact: <strong className="text-emerald-700">High</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Secondary: "Why am I seeing this?" */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById('why-seeing-this-detail');
                        if (el) el.classList.toggle('hidden');
                      }}
                      className="text-xs font-semibold text-slate-700 border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
                    >
                      <Info className="w-3.5 h-3.5 mr-1 text-brand-600" />
                      <span>Why am I seeing this?</span>
                    </Button>

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
                        className="text-xs font-black gap-2 shadow-sm bg-brand-600 hover:bg-brand-500 text-white whitespace-nowrap"
                      >
                        <span>{topAction.actionLabel || 'View Recommended Options'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Collapsible Expander: Why am I seeing this? */}
                <div id="why-seeing-this-detail" className="hidden p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Why Crediqly recommended this action:</span>
                  </div>
                  <p className="leading-relaxed text-indigo-900/90">
                    {topAction.explanation} Based on your completed milestones, this is mathematically identified as your single highest-leverage prerequisite. Completing it directly unblocks next-tier credit tradelines and commercial underwriting criteria.
                  </p>
                </div>
              </div>
            )}

            {/* NEXT UP (Concise list of next 3 actions) */}
            {subsequentActions.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-brand-600" />
                    <span>NEXT UP</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Showing next {subsequentActions.length} prioritized actions
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {subsequentActions.slice(0, 2).map((action, idx) => (
                    <div
                      key={action.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50/60 border border-slate-200/90 hover:border-slate-300 transition-all duration-200 shadow-2xs space-y-3"
                    >
                      {/* Action Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                            #{action.order}
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                              {action.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {renderPriorityBadge(action.priority)}
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {idx === 0 ? 'Next Dependent Action' : 'Upcoming Action'}
                          </span>
                        </div>
                      </div>

                      {/* Explanation & Reason */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Short Explanation
                          </span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {action.explanation}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 block">
                            Reason
                          </span>
                          <p className="text-slate-600 leading-relaxed">
                            {action.whyItMatters}
                          </p>
                        </div>
                      </div>

                      {/* Dependency & CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">
                          <strong>Dependency: </strong>
                          {idx === 0
                            ? `Recommended after completing #${topAction?.order || 1}`
                            : 'Unlocks as earlier stages season'}
                        </span>

                        <div className="flex items-center gap-2">
                          {onToggleComplete && action.roadmapTaskKey && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggle(action.roadmapTaskKey!)}
                              disabled={completingKey === action.roadmapTaskKey}
                              className="text-xs font-semibold text-slate-800 border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              <span>{completingKey === action.roadmapTaskKey ? 'Updating...' : 'Mark Complete'}</span>
                            </Button>
                          )}

                          <Link href={action.actionHref}>
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs font-bold gap-1 shadow-xs bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap"
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


