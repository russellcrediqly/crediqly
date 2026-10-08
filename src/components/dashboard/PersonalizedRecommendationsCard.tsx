'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type {
  UnifiedDashboardRecommendations,
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

  return (
    <Card className={`border-slate-200/90 bg-white shadow-xs overflow-hidden rounded-2xl ${className}`}>
      <CardContent className="p-6 sm:p-7 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                STAGE-MATCHED RECOMMENDATIONS
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">Curated for your profile</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
              Recommended For Your Current Step
            </h2>
          </div>

          <Link
            href="/products"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dynamic Readiness Insights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended for your profile:</span>
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
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Prerequisites for next tier:</span>
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

        {/* 1–3 Curated Recommendation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Category & Match Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.categoryLabel}
                  </span>
                  <StatusBadge status={item.matchLabel} size="sm" />
                </div>

                {/* Name & Terms */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {item.estimatedTermsOrFunding}
                  </p>
                </div>

                {/* Why it is relevant */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Underwriting Rationale:
                  </span>
                  <p className="text-slate-600 leading-relaxed line-clamp-3">
                    {item.reason}
                  </p>
                </div>
              </div>

              {/* Action Button: Links to Products / Funding Details */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href="/products"
                  className="flex-1"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-bold flex items-center justify-center gap-1.5 h-8 bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  >
                    <span>Review Option</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>

                <a
                  href="#ai-mentor"
                  title={`Ask Crediqly AI why ${item.name} is recommended`}
                  className="px-2.5 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ask AI</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Section Footer: View All Link & Educational Disclaimer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p className="leading-relaxed max-w-xl text-[11px]">
            {disclaimer}
          </p>

          <Link href="/products" className="flex-shrink-0">
            <span className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1">
              <span>View All Verified Products &amp; Tradelines</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
