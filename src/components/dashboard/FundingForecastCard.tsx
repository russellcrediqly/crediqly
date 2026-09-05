'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { FundingForecastResult } from '@/types/forecast';
import { useSubscription } from '@/context/SubscriptionContext';

interface FundingForecastCardProps {
  forecast: FundingForecastResult;
  className?: string;
  isPro?: boolean;
}

export const FundingForecastCard: React.FC<FundingForecastCardProps> = ({
  forecast,
  className = '',
  isPro: propIsPro,
}) => {
  const { isPro: contextIsPro, upgradeToPro } = useSubscription();
  const isPro = propIsPro !== undefined ? propIsPro : contextIsPro;
  // --------------------------------------------------------------------------
  // INSUFFICIENT DATA / UNAVAILABLE STATE
  // --------------------------------------------------------------------------
  if (!forecast.isAvailable) {
    return (
      <Card
        className={`border-slate-200/90 bg-white shadow-xs overflow-hidden ${className}`}
        id="funding-forecast"
      >
        <CardContent className="p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Planning Estimate
                </span>
                <span className="text-xs text-slate-400">Next 90 Days</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                CREDIQLY FUNDING FORECAST
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60 w-fit">
              Data Pending
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Forecast unavailable
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {forecast.unavailableReason || 'Add more business information to receive a forecast.'}
                </p>
              </div>
            </div>

            <Link href={forecast.recommendation.actionHref} className="shrink-0">
              <Button size="sm" className="text-xs font-bold gap-1.5 shadow-xs bg-slate-900 hover:bg-slate-800 text-white">
                <span>{forecast.recommendation.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Forecasts require verified operating history, revenue range, and active business banking to generate realistic 90-day cash flow projections.
          </p>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // SUFFICIENT DATA / ACTIVE FORECAST STATE
  // --------------------------------------------------------------------------
  const getRiskBadge = (risk: 'LOW' | 'MODERATE' | 'HIGH') => {
    switch (risk) {
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>LOW RISK</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>HIGH RISK</span>
          </span>
        );
      case 'MODERATE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>MODERATE RISK</span>
          </span>
        );
    }
  };

  const getConfidenceBadge = (conf: 'High' | 'Moderate' | 'Low') => {
    switch (conf) {
      case 'High':
        return <Badge variant="success">Confidence: High</Badge>;
      case 'Low':
        return <Badge variant="neutral">Confidence: Low</Badge>;
      case 'Moderate':
      default:
        return <Badge variant="warning">Confidence: Moderate</Badge>;
    }
  };

  return (
    <Card
      className={`border-indigo-200/80 bg-gradient-to-b from-slate-50/50 via-white to-white shadow-xs overflow-hidden ${className}`}
      id="funding-forecast"
    >
      <CardContent className="p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                Planning Estimate
              </span>
              <span className="text-xs text-slate-400 font-medium">Based on information provided</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              CREDIQLY FUNDING FORECAST
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Projected 90-day cash-flow profile and working-capital planning estimate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{forecast.horizonLabel}</span>
            </span>
            {getConfidenceBadge(forecast.confidence)}
          </div>
        </div>

        {/* 3 Metrics Projection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Revenue */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px]">Projected Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {forecast.revenue?.formatted || '$0'}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Estimated 90-day commercial receipts
            </p>
          </div>

          {/* Expenses */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px]">Estimated Expenses</span>
              <Layers className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {forecast.expenses?.formatted || '$0'}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Projected operational overhead &amp; payroll
            </p>
          </div>

          {/* Working Capital Need */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs text-indigo-700">
              <span className="font-bold uppercase tracking-wider text-[10px]">Estimated Working-Capital Need</span>
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-950 tracking-tight">
              {forecast.workingCapitalNeed?.formatted || '$0'}
            </div>
            <p className="text-[11px] text-indigo-700/80 leading-snug">
              Recommended liquidity buffer
            </p>
          </div>
        </div>

        {!isPro ? (
          /* Pro Locked Preview for 90-Day Simulation & Detailed Scenarios */
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white p-6 text-center space-y-4 shadow-xs">
            <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-2xs">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                <span>🔒 Pro Feature</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Unlock 90-Day Cash-Flow Scenario Simulation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upgrade to Crediqly Pro to view month-by-month cash burn projections, deficit horizon detection, and custom liquidity scenarios.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <Button
                onClick={() => upgradeToPro()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs gap-1.5 w-full sm:w-auto"
              >
                <span>Upgrade to Pro — $39/mo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  className="text-xs font-bold text-slate-700 hover:bg-slate-50 border-slate-300 w-full sm:w-auto"
                >
                  <span>Compare Plans</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Confidence Note if Low */}
            {forecast.confidenceNote && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{forecast.confidenceNote}</span>
              </div>
            )}

            {/* Cash-Flow Risk Assessment & Explanation */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cash-flow risk:
                </span>
                {getRiskBadge(forecast.cashFlowRisk)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {forecast.riskExplanation}
              </p>
            </div>

            {/* Recommendation Integration */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">
                  Crediqly Recommendation
                </span>
                <h4 className="text-base font-extrabold text-white">
                  {forecast.recommendation.title}
                </h4>
                <p className="text-xs text-indigo-100/90 leading-relaxed max-w-xl">
                  Forecast indicates potential working-capital need. Compare matched credit lines and term options suited to your profile.
                </p>
              </div>

              <Link href={forecast.recommendation.actionHref} className="shrink-0">
                <Button
                  className="bg-white hover:bg-indigo-50 text-indigo-900 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs gap-1.5 w-full sm:w-auto transition-colors"
                >
                  <span>{forecast.recommendation.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-700" />
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* Educational Compliance Disclaimer */}
        <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{forecast.disclaimer}</span>
        </div>
      </CardContent>
    </Card>
  );
};
