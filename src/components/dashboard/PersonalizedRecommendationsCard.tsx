'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Info,
  Building2,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  UnifiedDashboardRecommendations,
  UnifiedRecommendationItem,
} from '@/lib/recommendations/unifiedRecommendationService';

interface PersonalizedRecommendationsCardProps {
  data: UnifiedDashboardRecommendations;
  className?: string;
}

export const PersonalizedRecommendationsCard: React.FC<PersonalizedRecommendationsCardProps> = ({
  data,
  className = '',
}) => {
  const { readinessScore, items, recommendedHighlights, improveFirstHighlights, disclaimer } = data;

  const renderIndicatorBadge = (indicator: 'strong' | 'possible' | 'improve_readiness', label: string) => {
    switch (indicator) {
      case 'strong':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 {label}</span>
          </span>
        );
      case 'possible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>🟡 {label}</span>
          </span>
        );
      case 'improve_readiness':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>🔴 {label}</span>
          </span>
        );
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <Card className={`border-slate-200/90 shadow-xs overflow-hidden ${className}`}>
      <CardContent className="p-5 sm:p-7 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/70">
                Personalized For Your Stage
              </span>
              <span className="text-xs text-slate-400">Based on Crediqly profile</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              RECOMMENDED FOR YOU
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Targeted business credit and funding options evaluated against your operating history and readiness tier.
            </p>
          </div>

          {/* Funding Readiness Score Connection */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Funding Readiness
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-black border ${getScoreColorClass(
                readinessScore
              )}`}
            >
              {readinessScore} / 100
            </span>
          </div>
        </div>

        {/* Dynamic Readiness Insights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended for your current profile:</span>
            </div>
            <ul className="space-y-1 pl-5 text-slate-600 list-disc">
              {recommendedHighlights.slice(0, 2).map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
              <span>Not yet ideal / Improve readiness first:</span>
            </div>
            <ul className="space-y-1 pl-5 text-slate-600 list-disc">
              {improveFirstHighlights.slice(0, 2).map((item, idx) => (
                <li key={idx} className="leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3 Simple Recommendation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-white hover:border-brand-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                {/* Category & Match Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.categoryLabel}
                  </span>
                  {renderIndicatorBadge(item.matchIndicator, item.matchLabel)}
                </div>

                {/* Name */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs font-semibold text-brand-700 mt-0.5">
                    {item.estimatedTermsOrFunding}
                  </p>
                </div>

                {/* Best For */}
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Best for: </span>
                  <span className="line-clamp-2">{item.bestFor}</span>
                </div>

                {/* Rationale snippet */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-normal">
                  {item.reason}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <a
                  href={item.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold border-brand-200 text-brand-700 hover:bg-brand-50 flex items-center justify-center gap-1.5 h-8"
                  >
                    <span>{item.ctaText}</span>
                    <ExternalLink className="w-3 h-3 text-brand-600" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Section Footer: View All Link & Educational Disclaimer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
            {disclaimer}
          </p>

          <Link href="/products" className="flex-shrink-0">
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs font-bold gap-1.5 px-4"
            >
              <span>View All Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
