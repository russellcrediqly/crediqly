'use client';

import React from 'react';
import Link from 'next/link';
import { CustomerJourneyResult, JourneyStage } from '@/lib/roadmap/customerJourney';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
  CreditCard,
  Target,
  TrendingUp,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface CustomerJourneyCardProps {
  journey: CustomerJourneyResult;
  className?: string;
}

export const CustomerJourneyCard: React.FC<CustomerJourneyCardProps> = ({
  journey,
  className = '',
}) => {
  const {
    activeStep,
    activeStepNumber,
    totalSteps,
    stages,
    completedStepsCount,
    overallProgress,
    currentStageLabel,
  } = journey;

  return (
    <Card className={`border-slate-200/90 bg-white shadow-xs overflow-hidden rounded-2xl ${className}`}>
      <CardContent className="p-6 sm:p-7 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>BUSINESS CREDIT JOURNEY</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-900">
              Stage {activeStepNumber} of {totalSteps}: {currentStageLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Progress:</span>
              <span className="text-xs font-mono font-bold text-slate-900">{overallProgress}%</span>
              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, overallProgress)}%` }}
                />
              </div>
            </div>

            <Link
              href="/roadmap"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 ml-2 transition-colors"
            >
              <span>Full Roadmap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Compact Horizontal Pipeline (Desktop) */}
        <div className="hidden lg:grid grid-cols-5 gap-2 relative pt-2">
          {stages.map((stg, idx) => {
            const isCompleted = stg.status === 'completed';
            const isCurrent = stg.status === 'in_progress';

            return (
              <div key={stg.id} className="relative">
                {/* Connecting hairline */}
                {idx < stages.length - 1 && (
                  <div
                    className={`absolute top-4 left-[50%] right-[-50%] h-[2px] z-0 transition-colors ${
                      isCompleted ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  />
                )}

                <Link
                  href={stg.actionHref}
                  className={`relative z-10 flex flex-col items-center text-center p-2.5 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-slate-50 border border-slate-300 shadow-2xs'
                      : isCompleted
                      ? 'hover:bg-slate-50/60'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                      isCurrent
                        ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span>{stg.numberPrefix}</span>
                    )}
                  </div>

                  <span
                    className={`mt-2 text-xs font-bold truncate max-w-full ${
                      isCurrent ? 'text-slate-900 font-extrabold' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {stg.title}
                  </span>

                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                    {isCompleted ? 'Completed' : isCurrent ? 'Active' : 'Upcoming'}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Mobile / Tablet Condensed Pipeline */}
        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {stages.map((stg) => {
            const isCompleted = stg.status === 'completed';
            const isCurrent = stg.status === 'in_progress';

            return (
              <Link
                key={stg.id}
                href={stg.actionHref}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  isCurrent
                    ? 'border-slate-900 bg-slate-50 shadow-2xs'
                    : isCompleted
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-100 bg-slate-50/50 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    isCurrent
                      ? 'bg-slate-900 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? '✓' : stg.numberPrefix}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{stg.title}</div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {isCompleted ? 'Completed' : isCurrent ? 'Active' : 'Upcoming'}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Concise Contextual Footer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <p className="leading-snug">
            <strong className="text-slate-700">Stage Objective:</strong> {activeStep.shortExplanation}
          </p>
          <span className="text-[11px] text-slate-400 shrink-0">
            {completedStepsCount} of {totalSteps} stages completed
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
