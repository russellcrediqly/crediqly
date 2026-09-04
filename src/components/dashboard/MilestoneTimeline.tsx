'use client';

import React from 'react';
import { Milestone } from '@/types/progress';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ milestones }) => {
  return (
    <Card className="border-slate-200/80 bg-white shadow-xs">
      <CardContent className="p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Milestones & Journey Progression
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic progress stages calculated from your verified business data.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              Pending
            </span>
          </div>
        </div>

        {/* Timeline List (Connected steps) */}
        <div className="relative">
          <div className="space-y-3">
            {milestones.map((m) => {
              const isCompleted = m.status === 'completed';
              const isInProgress = m.status === 'in_progress';
              const isComingNext = m.status === 'coming_next';
              const isNotStarted = m.status === 'not_started';

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/30 border-emerald-200/70'
                      : isInProgress
                      ? 'bg-brand-50/40 border-brand-200 ring-1 ring-brand-500/20'
                      : isComingNext
                      ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200/80 text-slate-600'
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="flex-shrink-0 pt-0.5">
                    {isCompleted ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isInProgress ? (
                      <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : isComingNext ? (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Circle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Milestone Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Milestone {m.order}
                        </span>
                        <h4
                          className={`text-sm font-bold tracking-tight ${
                            isCompleted
                              ? 'text-emerald-950'
                              : isInProgress
                              ? 'text-brand-950'
                              : isComingNext
                              ? 'text-slate-500'
                              : 'text-slate-800'
                          }`}
                        >
                          {m.title}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 self-start sm:self-auto ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-brand-100 text-brand-800'
                            : isComingNext
                            ? 'bg-slate-200/80 text-slate-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isCompleted && '✓ Completed'}
                        {isInProgress && '● In Progress'}
                        {isComingNext && '🔒 Locked / Coming Next'}
                        {isNotStarted && '○ Not Started'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
