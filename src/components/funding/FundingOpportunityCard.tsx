'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Bookmark,
  Check,
  Building2,
  CreditCard,
  Layers,
  HelpCircle,
  Calendar,
  Gift,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { FundingMatchResult, FundingProduct } from '@/types/fundingProduct';
import { resolveFundingProductOutboundUrl } from '@/lib/supabase/fundingProductService';

interface FundingOpportunityCardProps {
  matchResult: FundingMatchResult;
  isTracked: boolean;
  onTrack: (product: FundingProduct) => Promise<void>;
  onSelectDetails: (matchResult: FundingMatchResult) => void;
  onOutboundClick: (product: FundingProduct) => void;
}

export const FundingOpportunityCard: React.FC<FundingOpportunityCardProps> = ({
  matchResult,
  isTracked,
  onTrack,
  onSelectDetails,
  onOutboundClick,
}) => {
  const {
    product,
    matchLevel,
    whyThisFits,
    recommendedForYou,
    whyThisMatches,
    whatYouMayNeed,
    whatToConsider,
    requirementSummary,
    checklistMet,
    checklistPending,
    nextStepsToImprove,
    isGrant,
  } = matchResult;

  const [tracking, setTracking] = useState(false);

  const handleTrackClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTracked || tracking) return;
    setTracking(true);
    try {
      await onTrack(product);
    } finally {
      setTracking(false);
    }
  };

  const isStrong = matchLevel === 'Strong Match';
  const isPreliminary = matchLevel === 'Preliminary Match';
  const isPossible = matchLevel === 'Possible Match' || matchLevel === 'Potential Match';
  const isNotReady = matchLevel === 'Not Ready Yet' || matchLevel === 'Not Recommended Yet';

  const displayReason = whyThisMatches || whyThisFits;
  const displayContext = recommendedForYou || (isGrant ? 'Non-Dilutive Small Business Grant' : `${product.category} Opportunity`);
  const outboundUrl = resolveFundingProductOutboundUrl(product);

  return (
    <Card
      className={`rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden bg-white ${
        isStrong
          ? 'border-emerald-300 ring-1 ring-emerald-400/20'
          : isPreliminary
          ? 'border-blue-200 ring-1 ring-blue-400/10'
          : isPossible
          ? 'border-brand-200/90'
          : 'border-slate-200 bg-slate-50/40 opacity-95'
      }`}
    >
      <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header Row: Category, Provider & Match Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {product.category}
                </span>

                {isGrant && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Gift className="w-3 h-3 text-purple-600" />
                    <span>Non-Dilutive Grant</span>
                  </span>
                )}

                {product.featured && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h3>
              <p className="text-xs font-bold text-slate-600">
                Provided by <span className="text-slate-900 font-extrabold">{product.provider}</span>
              </p>
            </div>

            {/* Match Level Indicator Badge */}
            <div className="shrink-0">
              <StatusBadge status={matchLevel} size="sm" />
            </div>
          </div>

          {/* Key Metrics Strip (Range, Term, Rate) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {isGrant ? 'Grant Amount' : 'Potential Range'}
              </span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {product.grantAmount || requirementSummary.fundingRange}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Typical Term
              </span>
              <span className="font-bold text-slate-800 text-xs truncate block">
                {requirementSummary.repayment}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {isGrant ? 'Deadline' : 'Rate / Terms'}
              </span>
              <span className="font-bold text-slate-800 text-xs truncate block" title={product.grantDeadline || requirementSummary.rates}>
                {product.grantDeadline || requirementSummary.rates}
              </span>
            </div>
          </div>

          {/* 1. RECOMMENDED FOR YOU (Context) */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 block">
              Recommended for you
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {displayContext}
            </p>
          </div>

          {/* 2. WHY THIS MATCHES */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Why this matches:
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {displayReason}
            </p>
          </div>

          {/* 3. WHAT YOU MAY NEED (Underwriting Requirements) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              What you may need:
            </span>
            {whatYouMayNeed && whatYouMayNeed.length > 0 ? (
              <div className="space-y-1">
                {whatYouMayNeed.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {checklistMet.slice(0, 2).map((item, idx) => (
                  <div key={`met-${idx}`} className="flex items-center gap-1.5 text-xs text-emerald-800">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
                {checklistPending.slice(0, 2).map((item, idx) => (
                  <div key={`pend-${idx}`} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NOT RECOMMENDED YET -> CLEAR PATH FORWARD (Milestones) */}
          {isNotReady && nextStepsToImprove && nextStepsToImprove.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Here's what would make this option more relevant:</span>
              </div>
              <ul className="space-y-1 text-slate-700 pl-4 list-disc text-[11px]">
                {nextStepsToImprove.slice(0, 3).map((step, idx) => (
                  <li key={`step-${idx}`}>{step}</li>
                ))}
              </ul>
              <Link
                href="/roadmap"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 underline pt-0.5"
              >
                <span>Complete Roadmapped Milestones</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* 4. WHAT TO CONSIDER */}
          <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="font-extrabold uppercase tracking-wider text-slate-400 block text-[10px]">
              What to consider:
            </span>
            <p className="leading-relaxed">
              {whatToConsider || `Rates and repayment terms are determined by ${product.provider}. No hard credit inquiry to review preliminary criteria.`}
            </p>
          </div>
        </div>

        {/* Card Footer Actions (5. CTA) */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => onSelectDetails(matchResult)}
            className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1 py-1"
          >
            <span>View Full Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Track Application */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTrackClick}
              disabled={isTracked || tracking}
              className={`text-xs font-semibold gap-1 whitespace-nowrap ${
                isTracked ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-700'
              }`}
              title={isTracked ? 'Application tracked in your pipeline' : 'Track in my applications'}
            >
              {isTracked ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tracked</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tracking ? 'Saving...' : 'Track'}</span>
                </>
              )}
            </Button>

            {/* Apply / Outbound Link */}
            <a
              href={outboundUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOutboundClick(product)}
              className="w-full sm:w-auto"
            >
              <Button
                variant={isStrong ? 'primary' : 'outline'}
                size="sm"
                className={`text-xs font-bold gap-1.5 w-full whitespace-nowrap ${
                  isStrong
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                    : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>{isGrant ? 'Apply for Grant' : 'Review Option'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
