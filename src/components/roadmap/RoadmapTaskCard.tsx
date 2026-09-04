'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RoadmapTask } from '@/lib/roadmap/types';
import { STAGE_DEFINITIONS } from '@/lib/roadmap/definitions';

interface RoadmapTaskCardProps {
  task: RoadmapTask;
  onOpenDetail: (task: RoadmapTask) => void;
  onToggleComplete: (taskKey: string) => void;
  onRequestReopen?: (task: RoadmapTask) => void;
  isNextBest?: boolean;
}

export const RoadmapTaskCard: React.FC<RoadmapTaskCardProps> = ({
  task,
  onOpenDetail,
  onToggleComplete,
  onRequestReopen,
  isNextBest = false,
}) => {
  const isCompleted = task.status === 'completed';
  const stageMeta = STAGE_DEFINITIONS[task.stage];

  const priorityColor =
    task.priority === 'high'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : task.priority === 'medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  const handleToggleClick = () => {
    if (isCompleted && onRequestReopen) {
      onRequestReopen(task);
    } else {
      onToggleComplete(task.key);
    }
  };

  return (
    <Card
      className={`transition-all ${
        isCompleted
          ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300 opacity-90'
          : isNextBest
          ? 'border-brand-300 bg-white ring-2 ring-brand-500/10 shadow-sm'
          : 'bg-white border-slate-200 hover:border-brand-200 hover:shadow-xs'
      }`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left: Icon and Core Info */}
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Completion Toggle Icon */}
            <button
              onClick={handleToggleClick}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
              className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110 focus:outline-none"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 hover:text-brand-500 transition-colors" />
              )}
            </button>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {stageMeta && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {stageMeta.title}
                  </span>
                )}

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColor}`}
                >
                  {task.priority} Priority
                </span>

                {task.isApplicable === false && (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Not Applicable to Entity
                  </span>
                )}

                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    {task.satisfiedByProfile ? 'Verified from profile' : 'Completed'}
                  </span>
                )}

                {isNextBest && !isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    Recommended Next
                  </span>
                )}
              </div>

              <h4
                onClick={() => onOpenDetail(task)}
                className={`text-sm sm:text-base font-bold cursor-pointer transition-colors ${
                  isCompleted
                    ? 'text-slate-700 line-through decoration-slate-300'
                    : 'text-slate-900 hover:text-brand-600'
                }`}
              >
                {task.title}
              </h4>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {task.whyItMatters}
              </p>

              {task.actionHref && !isCompleted && (
                <div className="pt-0.5">
                  <Link
                    href={task.actionHref}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors group"
                  >
                    <span className="group-hover:underline">{task.actionLabel || 'Explore Options'}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}

              {isCompleted && task.completedAt && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    Completed{' '}
                    {new Date(task.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenDetail(task)}
              className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1 h-auto gap-1"
            >
              <span>View Guide</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant={isCompleted ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleClick}
              className={`text-xs px-3 py-1.5 h-auto ${
                isCompleted
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
