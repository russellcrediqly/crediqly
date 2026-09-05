'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
} from 'lucide-react';
import type { BusinessProfile } from '@/types/business';
import type { FundingReadinessResult } from '@/types/funding';
import {
  hasSufficientFundingData,
  calculateMonthlyDelta,
  evaluateMajorReadinessAreas,
  extractReadinessInsights,
  MajorReadinessArea,
} from '@/lib/readiness/fundingFactors';

interface FundingReadinessScoreCardProps {
  profile?: Partial<BusinessProfile> | null;
  fundingReadiness: FundingReadinessResult;
  previousScore?: number;
  className?: string;
}

export const FundingReadinessScoreCard: React.FC<FundingReadinessScoreCardProps> = ({
  profile,
  fundingReadiness,
  previousScore,
  className = '',
}) => {
  const hasData = hasSufficientFundingData(profile);

  // --------------------------------------------------------------------------
  // INSUFFICIENT / EMPTY PROFILE DATA STATE
  // --------------------------------------------------------------------------
  if (!hasData) {
    return (
      <Card className={`border-slate-200/90 bg-white shadow-sm overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-black uppercase tracking-wider border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                <span>Crediqly Funding Readiness Score</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Funding Readiness Assessment
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full w-fit">
              Awaiting Profile Data
            </span>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Complete your profile to calculate your Funding Readiness.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                  Crediqly evaluates your business entity, operating age, reporting tradelines, revenue, and commercial banking consistency to determine your funding readiness. No fake numbers are displayed.
                </p>
              </div>
            </div>

            <Link href="/onboarding" className="shrink-0 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-xs whitespace-nowrap"
              >
                <span>Complete Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Educational Disclaimer Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Crediqly Funding Readiness Score:</strong> This is an educational readiness estimate based on information provided in your Crediqly profile. It is not an official credit bureau score and does not guarantee funding approval.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // ACTIVE POPULATED SCORE STATE
  // --------------------------------------------------------------------------
  const score = fundingReadiness.score;
  const level = fundingReadiness.level;
  const delta = calculateMonthlyDelta(score, previousScore);
  const majorAreas = evaluateMajorReadinessAreas(profile || {});
  const { strongAreas, areasToImprove, biggestOpportunity } = extractReadinessInsights(
    profile || {},
    fundingReadiness
  );

  const getLevelBadgeVariant = (lvl: string): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (lvl) {
      case 'Strong Readiness':
        return 'success';
      case 'Funding Ready':
        return 'info';
      case 'Developing':
      case 'Building Readiness':
        return 'warning';
      case 'Getting Started':
      default:
        return 'neutral';
    }
  };

  const renderIndicatorDot = (indicator: 'green' | 'amber' | 'red') => {
    switch (indicator) {
      case 'green':
        return (
          <span className="relative flex h-2.5 w-2.5 shrink-0" title="Strong / Good">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        );
      case 'amber':
        return (
          <span className="relative flex h-2.5 w-2.5 shrink-0" title="Needs Improvement / Information">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        );
      case 'red':
      default:
        return (
          <span className="relative flex h-2.5 w-2.5 shrink-0" title="Needs Attention / Not Provided">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
        );
    }
  };

  return (
    <Card className={`border-brand-200/90 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-indigo-950 text-white p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-400/30 text-xs font-black uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-brand-300" />
                <span>Crediqly Funding Readiness Score</span>
              </span>
              <span className="text-xs font-semibold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                Live Dynamic Calculation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Commercial Capital &amp; Lender Preparedness
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-200 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              Zero Bureau Inquiries
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-6 sm:p-8 space-y-7">
        {/* Main Stat & Major Areas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Big Score Card (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-brand-50/70 via-white to-slate-50 border border-brand-100 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Funding Readiness
                </span>
                <Badge variant={getLevelBadgeVariant(level)}>
                  {level}
                </Badge>
              </div>

              {/* Large Score Display */}
              <div className="flex items-baseline gap-2 pt-3">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                  {score}
                </span>
                <span className="text-2xl font-bold text-slate-400">/ 100</span>
              </div>

              {/* Monthly Trend Indicator */}
              <div className="flex items-center gap-2 pt-2">
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    delta.type === 'up'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : delta.type === 'down'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {delta.type === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                  {delta.type === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
                  {delta.type === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{delta.text}</span>
                </div>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    score >= 70 ? 'bg-emerald-600' : score >= 50 ? 'bg-brand-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(4, score)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Right Column: 5 Major Readiness Areas (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Major Readiness Areas
              </h3>
              <div className="space-y-2.5">
                {majorAreas.map((area) => (
                  <div
                    key={area.key}
                    className="p-3 sm:p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderIndicatorDot(area.indicator)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {area.name}
                          </span>
                          <span className="text-slate-400 text-xs font-medium">—</span>
                          <span
                            className={`text-xs font-bold ${
                              area.indicator === 'green'
                                ? 'text-emerald-700'
                                : area.indicator === 'amber'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {area.statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {area.detail}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        area.indicator === 'green'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : area.indicator === 'amber'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {area.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Breakdown: Strong Areas vs Areas to Improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Strong Areas */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Strong Areas
              </h4>
            </div>
            <ul className="space-y-2">
              {strongAreas.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
            <div className="flex items-center gap-2 text-amber-900">
              <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Areas to Improve
              </h4>
            </div>
            <ul className="space-y-2">
              {areasToImprove.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="text-amber-600 font-bold shrink-0 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Highlight: Biggest Opportunity Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-1.5 text-brand-200 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Biggest Opportunity</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white leading-snug">
              &ldquo;{biggestOpportunity.quote}&rdquo;
            </p>
          </div>

          <Link href={biggestOpportunity.ctaHref} className="shrink-0">
            <Button
              variant="secondary"
              size="md"
              className="gap-2 bg-white hover:bg-slate-100 text-brand-900 font-bold shadow-xs whitespace-nowrap w-full sm:w-auto border-0"
            >
              <span>{biggestOpportunity.ctaLabel}</span>
              <ChevronRight className="w-4 h-4 text-brand-700" />
            </Button>
          </Link>
        </div>

        {/* Educational Disclaimer Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Crediqly Funding Readiness Score:</strong> This is an educational readiness estimate based on information provided in your Crediqly profile. It is not an official credit bureau score and does not guarantee funding approval.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
