'use client';

import React from 'react';
import Link from 'next/link';
import { CustomerJourneyResult, JourneyStage } from '@/lib/roadmap/customerJourney';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  CircleDot,
  Clock,
  ArrowRight,
  ShieldCheck,
  Compass,
  Building,
  CreditCard,
  Target,
  DollarSign,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface CustomerJourneyCardProps {
  journey: CustomerJourneyResult;
}

export const CustomerJourneyCard: React.FC<CustomerJourneyCardProps> = ({ journey }) => {
  const { activeStep, activeStepNumber, totalSteps, stages, completedStepsCount, overallProgress } = journey;

  const getStageIcon = (iconName: JourneyStage['iconName'], className: string) => {
    switch (iconName) {
      case 'profile':
        return <Building className={className} />;
      case 'foundation':
        return <ShieldCheck className={className} />;
      case 'credit':
        return <CreditCard className={className} />;
      case 'readiness':
        return <Layers className={className} />;
      case 'funding_readiness':
        return <Target className={className} />;
      case 'funding_options':
        return <DollarSign className={className} />;
      default:
        return <Compass className={className} />;
    }
  };

  return (
    <Card className="border-brand-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Banner: Prominent YOUR NEXT STEP Hero */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 text-white p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-400/30 text-xs font-black uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-brand-300 animate-pulse" />
                <span>Your Next Step</span>
              </span>
              <span className="text-xs font-bold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full">
                Step {activeStepNumber} of {totalSteps}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeStep.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {activeStep.description}
            </p>
          </div>

          {/* Action CTA Box */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/15">
            <div className="text-left space-y-0.5">
              <span className="text-[11px] font-bold text-brand-200 uppercase tracking-wider block">
                Recommended Action
              </span>
              <span className="text-xs font-medium text-white/90 block max-w-xs line-clamp-1">
                {activeStep.detail}
              </span>
            </div>
            <Link href={activeStep.actionHref}>
              <Button
                variant="primary"
                size="md"
                className="bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs gap-1.5 shadow-md whitespace-nowrap"
              >
                <span>{activeStep.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Why this step matters + Journey Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-white/85">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="leading-tight">
              <strong className="text-white">Why this matters: </strong>
              {activeStep.whyItMatters}
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <span className="text-xs font-bold text-brand-200 whitespace-nowrap">
              Journey Progress: <strong>{overallProgress}%</strong> ({completedStepsCount} of {totalSteps} stages complete)
            </span>
          </div>
        </div>

        {/* Overall Progress Bar Track */}
        <div className="w-full bg-white/15 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, overallProgress)}%` }}
          />
        </div>
      </div>

      {/* 6-Stage Progression Grid */}
      <CardContent className="p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>6-Stage Business Credit &amp; Funding Journey</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these stages to build commercial credit and qualify for funding. All sections remain freely accessible at any time.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
            Guidance Only • Zero Locking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const isUpcoming = stage.status === 'upcoming';

            return (
              <Link
                key={stage.id}
                href={stage.actionHref}
                className={`group block p-4 rounded-xl border transition-all duration-200 ${
                  isInProgress
                    ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-2 ring-brand-500/10'
                    : isCompleted
                    ? 'border-emerald-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isInProgress
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        stage.id
                      )}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Stage {stage.id}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isCompleted ? (
                    <Badge variant="success" className="text-[10px] font-bold">
                      Completed
                    </Badge>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold">
                      <CircleDot className="w-3 h-3 animate-pulse text-brand-600" />
                      In Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Upcoming
                    </span>
                  )}
                </div>

                <h4
                  className={`text-sm font-bold tracking-tight mb-1 transition-colors ${
                    isInProgress
                      ? 'text-brand-900'
                      : isCompleted
                      ? 'text-slate-900 group-hover:text-emerald-800'
                      : 'text-slate-800 group-hover:text-slate-900'
                  }`}
                >
                  {stage.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {stage.description}
                </p>

                {/* Progress bar per stage */}
                <div className="space-y-1 pt-1 border-t border-slate-100/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-500">
                      {stage.detail}
                    </span>
                    <span
                      className={`font-bold ${
                        isCompleted
                          ? 'text-emerald-700'
                          : isInProgress
                          ? 'text-brand-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.progress}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isInProgress
                          ? 'bg-brand-600'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.max(4, stage.progress)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold pt-1">
                  <span
                    className={`flex items-center gap-1 group-hover:underline ${
                      isInProgress ? 'text-brand-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <span>{stage.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
