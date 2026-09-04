'use client';

import React from 'react';
import Link from 'next/link';
import { RoadmapStage } from '@/lib/roadmap/types';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle2, Lock, ArrowRight, Layers } from 'lucide-react';

interface StageProgressListProps {
  stages: RoadmapStage[];
}

export const StageProgressList: React.FC<StageProgressListProps> = ({ stages }) => {
  return (
    <Card className="border-slate-200/80 bg-white shadow-xs">
      <CardContent className="p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Roadmap Stage Progress</span>
            </h3>
            <p className="text-xs text-slate-500">
              Click any stage to view and complete relevant roadmap actions.
            </p>
          </div>
          <Link
            href="/roadmap"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isComingNext = stage.status === 'coming_next';
            const isInProgress = stage.status === 'in_progress';

            const percentage = isComingNext
              ? 0
              : stage.applicableCount > 0
              ? Math.round((stage.completedCount / stage.applicableCount) * 100)
              : 0;

            const href = isComingNext ? '/roadmap?stage=funding' : `/roadmap?stage=${stage.id}`;

            return (
              <Link
                key={stage.id}
                href={href}
                className="group block p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-300 hover:bg-slate-50/70 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Stage {stage.order}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                        {stage.title}
                      </h4>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      )}
                      {isComingNext && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Coming Next
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">
                        {isComingNext
                          ? 'Locked'
                          : isCompleted
                          ? '100% Complete'
                          : `${percentage}% Complete`}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {!isComingNext && `(${stage.completedCount}/${stage.applicableCount})`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isComingNext ? (
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-600'
                            : isInProgress
                            ? 'bg-brand-600'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-slate-200 rounded-full w-full opacity-50" />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {stage.subtitle} — {stage.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
