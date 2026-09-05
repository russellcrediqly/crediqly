'use client';

import React from 'react';
import Link from 'next/link';
import { CustomerJourneyResult, JourneyStage } from '@/lib/roadmap/customerJourney';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
  CreditCard,
  Target,
  DollarSign,
  TrendingUp,
  Layers,
  Sparkles,
  ChevronRight,
  Circle,
  HelpCircle,
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

  const getStageIcon = (iconName: JourneyStage['iconName'], iconClassName: string) => {
    switch (iconName) {
      case 'establish':
        return <Building className={iconClassName} />;
      case 'build':
        return <ShieldCheck className={iconClassName} />;
      case 'strengthen':
        return <CreditCard className={iconClassName} />;
      case 'funding_ready':
        return <Target className={iconClassName} />;
      case 'scale':
        return <TrendingUp className={iconClassName} />;
      default:
        return <Layers className={iconClassName} />;
    }
  };

  const renderStatusBadge = (status: JourneyStage['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-100 text-brand-800 border border-brand-300 animate-pulse">
            <ArrowRight className="w-3 h-3 text-brand-600" />
            <span>Current Stage</span>
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Circle className="w-2.5 h-2.5 text-slate-400" />
            <span>Upcoming</span>
          </span>
        );
    }
  };

  return (
    <Card className={`border-brand-200/90 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Top Banner: Your Current Stage Hero */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-indigo-950 text-white p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-400/30 text-xs font-black uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-brand-300" />
                <span>Business Credit Journey</span>
              </span>
              <span className="text-xs font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full">
                Stage {activeStepNumber} of {totalSteps}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-xs uppercase tracking-widest text-brand-300 font-bold block">
                Your Current Stage:
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentStageLabel}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              &ldquo;{activeStep.shortExplanation}&rdquo;
            </p>
          </div>

          {/* Active Stage Next Action Box */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15 max-w-md">
            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-200 block">
                Recommended Action
              </span>
              <p className="text-xs font-medium text-white leading-snug line-clamp-2">
                {activeStep.recommendedAction}
              </p>
            </div>
            <Link href={activeStep.actionHref} className="shrink-0 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs gap-1.5 shadow-md whitespace-nowrap"
              >
                <span>{activeStep.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Connected Route Map Timeline Stepper */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Route Map • 5 Guided Stages</span>
            </span>
            <span className="text-[11px] font-medium text-white/70">
              Current Position: <strong className="text-white font-bold">{currentStageLabel}</strong>
            </span>
          </div>

          <div className="relative">
            {/* Desktop Connected Bar */}
            <div className="hidden lg:grid grid-cols-5 gap-3 items-center relative">
              {stages.map((stg, idx) => {
                const isComp = stg.status === 'completed';
                const isCurr = stg.status === 'in_progress';
                const isNext = !isComp && !isCurr;

                return (
                  <div key={stg.id} className="relative">
                    {/* Connector line behind nodes */}
                    {idx < stages.length - 1 && (
                      <div
                        className={`absolute top-4 left-[50%] right-[-50%] h-0.5 z-0 transition-all ${
                          isComp
                            ? 'bg-emerald-400'
                            : isCurr
                            ? 'bg-gradient-to-r from-teal-400 to-white/20'
                            : 'bg-white/20'
                        }`}
                      />
                    )}

                    <Link
                      href={stg.actionHref}
                      className={`relative z-10 flex flex-col items-center text-center group p-2.5 rounded-2xl transition-all duration-200 ${
                        isCurr
                          ? 'bg-white/15 border-2 border-teal-300 shadow-md backdrop-blur-xs ring-4 ring-teal-400/20'
                          : isComp
                          ? 'bg-white/10 border border-emerald-400/40 hover:bg-white/15'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Step Circle Node */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-transform group-hover:scale-105 shadow-sm ${
                          isCurr
                            ? 'bg-white text-slate-950 ring-2 ring-teal-300'
                            : isComp
                            ? 'bg-emerald-400 text-emerald-950'
                            : 'bg-white/20 text-white/80'
                        }`}
                      >
                        {isComp ? '✓' : isCurr ? '→' : stg.numberPrefix}
                      </div>

                      <span
                        className={`mt-2 text-xs font-extrabold tracking-tight truncate max-w-full ${
                          isCurr ? 'text-white' : isComp ? 'text-emerald-200' : 'text-white/70'
                        }`}
                      >
                        {stg.title}
                      </span>

                      <span
                        className={`text-[10px] mt-0.5 font-bold uppercase tracking-wider ${
                          isCurr
                            ? 'text-teal-300'
                            : isComp
                            ? 'text-emerald-300'
                            : 'text-white/50'
                        }`}
                      >
                        {isComp ? 'Completed' : isCurr ? 'In Progress' : 'Upcoming'}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Mobile / Tablet Scrollable Pills */}
            <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
              {stages.map((stg, idx) => {
                const isComp = stg.status === 'completed';
                const isCurr = stg.status === 'in_progress';

                return (
                  <React.Fragment key={stg.id}>
                    <Link
                      href={stg.actionHref}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl shrink-0 transition-all ${
                        isCurr
                          ? 'bg-white text-brand-950 font-black shadow-md ring-2 ring-teal-300'
                          : isComp
                          ? 'text-emerald-200 bg-emerald-900/40 border border-emerald-500/40'
                          : 'text-white/70 bg-white/10 border border-white/10'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isCurr
                            ? 'bg-brand-600 text-white'
                            : isComp
                            ? 'bg-emerald-400 text-emerald-950'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {isComp ? '✓' : isCurr ? '→' : stg.numberPrefix}
                      </span>
                      <span>{stg.title}</span>
                    </Link>
                    {idx < stages.length - 1 && (
                      <span className="text-white/30 font-bold shrink-0">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress summary & Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/85">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong className="text-white">Why this matters: </strong>
              {activeStep.whyItMatters}
            </span>
          </div>

          <span className="text-brand-200 font-bold whitespace-nowrap shrink-0">
            Journey Progress: {overallProgress}% ({completedStepsCount} of {totalSteps} stages complete)
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-white/15 rounded-full h-2 mt-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-400 via-emerald-400 to-brand-300 h-full rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${Math.max(5, overallProgress)}%` }}
          />
        </div>
      </div>

      {/* 5-Stage Progression Cards Grid (Responsive Mobile & Desktop) */}
      <CardContent className="p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>5-Stage Progression Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these stages to build commercial credit and qualify for funding. All sections remain freely accessible at any time.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
            Guidance System • Zero Locking
          </span>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                  isInProgress
                    ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-2 ring-brand-500/10'
                    : isCompleted
                    ? 'border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top: Number badge, Icon, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          isInProgress
                            ? 'bg-brand-600 text-white'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {stage.numberPrefix}
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {stage.title}
                      </span>
                    </div>

                    {getStageIcon(
                      stage.iconName,
                      `w-4 h-4 ${
                        isInProgress
                          ? 'text-brand-600'
                          : isCompleted
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    {renderStatusBadge(stage.status)}
                  </div>

                  {/* Short Explanation */}
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[3rem]">
                    {stage.shortExplanation}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Progress</span>
                      <span>{stage.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : isInProgress
                            ? 'bg-brand-600'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <Link href={stage.actionHref} className="block w-full">
                    <Button
                      variant={isInProgress ? 'primary' : 'outline'}
                      size="sm"
                      className={`w-full text-xs font-bold gap-1 justify-between shadow-2xs ${
                        isInProgress
                          ? 'bg-brand-600 hover:bg-brand-500 text-white'
                          : 'border-slate-300 bg-white text-slate-800 hover:text-brand-900 hover:border-brand-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{stage.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer footer: Guidance system only, zero lockout */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>The Business Credit Journey is a guidance framework. All Crediqly features remain unlocked.</span>
          </div>
          <Link href="/roadmap" className="text-brand-700 font-bold hover:underline">
            View Complete Roadmap Tasks →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
