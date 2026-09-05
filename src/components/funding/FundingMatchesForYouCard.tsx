'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  CreditCard,
  Briefcase,
  DollarSign,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type {
  PersonalizedFundingMatchesResult,
  PersonalizedFundingTier,
} from '@/lib/funding/personalizedMatchesEngine';
import { recordFundingProductClick } from '@/lib/supabase/fundingProductService';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

interface FundingMatchesForYouCardProps {
  matches: PersonalizedFundingMatchesResult;
  className?: string;
  isPro?: boolean;
}

export const FundingMatchesForYouCard: React.FC<FundingMatchesForYouCardProps> = ({
  matches,
  className = '',
  isPro: propIsPro,
}) => {
  const { user } = useAuth();
  const { isPro: contextIsPro } = useSubscription();
  const isPro = propIsPro !== undefined ? propIsPro : contextIsPro;
  const { strongMatch, possibleMatch, improveReadinessMatch, complianceNotice } = matches;

  const handleOutboundClick = (item: PersonalizedFundingTier) => {
    if (item.productId) {
      recordFundingProductClick(item.productId, user?.id);
    }
    if (item.isExternal && item.ctaUrl) {
      window.open(item.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderBadge = (tier: 'strong' | 'possible' | 'improve_readiness', label: string) => {
    switch (tier) {
      case 'strong':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 {label}</span>
          </span>
        );
      case 'possible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>🟡 {label}</span>
          </span>
        );
      case 'improve_readiness':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-900 border border-rose-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>🔴 {label}</span>
          </span>
        );
    }
  };

  return (
    <section className={`space-y-4 ${className}`} aria-label="Funding Matches For You">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
              Personalized Matching
            </span>
            <span className="text-xs text-slate-400">Based on the information provided</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            FUNDING MATCHES FOR YOU
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Commercial funding categories tailored to your operating history, reported revenue, and readiness tier.
          </p>
        </div>

        <Link
          href="/funding"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>View All Funding Options</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Pro Directory Banner */}
      {!isPro ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-brand-50/90 via-indigo-50/50 to-slate-50 border border-brand-200/80 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping shrink-0" />
            <span className="font-semibold text-slate-800">
              Showing 3 of 10+ matching commercial funding opportunities
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-slate-500">
              Unlock complete lender directory &amp; criteria with Pro
            </span>
          </div>
          <Link
            href="/pricing"
            className="font-bold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 shrink-0"
          >
            <span>Unlock All 10+ with Pro 🔒</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 font-medium">
          <span className="flex items-center gap-2">
            <span>⭐</span>
            <span>Pro Member: Complete commercial funding directory &amp; direct criteria unlocked.</span>
          </span>
          <Link href="/funding" className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 shrink-0">
            <span>Browse Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3-Column Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: 🟢 STRONG MATCH */}
        {strongMatch ? (
          <Card className="border-emerald-200/90 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between bg-gradient-to-b from-emerald-50/20 via-white to-white shadow-xs overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Badge */}
                <div className="flex items-center justify-between gap-2">
                  {renderBadge(strongMatch.tier, strongMatch.badgeLabel)}
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {strongMatch.providerName}
                  </span>
                </div>

                {/* Category & Title */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {strongMatch.category}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {strongMatch.productName}
                  </p>
                </div>

                {/* Estimated Range */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100/90 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Estimated Range
                  </span>
                  <span className="text-xl font-extrabold text-emerald-950 tracking-tight">
                    {strongMatch.estimatedRange}
                  </span>
                </div>

                {/* Why it fits */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-700 block">Why:</span>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {strongMatch.whyText}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 mt-auto">
                {strongMatch.isExternal ? (
                  <Button
                    onClick={() => handleOutboundClick(strongMatch)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                    size="sm"
                  >
                    <span>{strongMatch.ctaText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href={strongMatch.ctaUrl} className="w-full block">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                      size="sm"
                    >
                      <span>{strongMatch.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-[10px] text-slate-400 text-center block mt-1.5">
                  Eligibility varies by provider.
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* CARD 2: 🟡 POSSIBLE MATCH */}
        {possibleMatch ? (
          <Card className="border-amber-200/90 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between bg-gradient-to-b from-amber-50/20 via-white to-white shadow-xs overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Badge */}
                <div className="flex items-center justify-between gap-2">
                  {renderBadge(possibleMatch.tier, possibleMatch.badgeLabel)}
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {possibleMatch.providerName}
                  </span>
                </div>

                {/* Category & Title */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {possibleMatch.category}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {possibleMatch.productName}
                  </p>
                </div>

                {/* Estimated Range */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100/90 space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Estimated Range
                  </span>
                  <span className="text-xl font-extrabold text-amber-950 tracking-tight">
                    {possibleMatch.estimatedRange}
                  </span>
                </div>

                {/* Basic Requirements */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 block">Basic requirements:</span>
                  <ul className="space-y-1">
                    {possibleMatch.requirements?.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-slate-600 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 mt-auto">
                {possibleMatch.isExternal ? (
                  <Button
                    onClick={() => handleOutboundClick(possibleMatch)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-xs"
                    size="sm"
                  >
                    <span>{possibleMatch.ctaText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Link href={possibleMatch.ctaUrl} className="w-full block">
                    <Button
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-xs"
                      size="sm"
                    >
                      <span>{possibleMatch.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                <span className="text-[10px] text-slate-400 text-center block mt-1.5">
                  Eligibility varies by provider.
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* CARD 3: 🔴 IMPROVE READINESS FIRST */}
        {improveReadinessMatch ? (
          <Card className="border-rose-200/90 hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between bg-gradient-to-b from-rose-50/20 via-white to-white shadow-xs overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Badge */}
                <div className="flex items-center justify-between gap-2">
                  {renderBadge(improveReadinessMatch.tier, improveReadinessMatch.badgeLabel)}
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {improveReadinessMatch.providerName}
                  </span>
                </div>

                {/* Category & Title */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {improveReadinessMatch.category}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {improveReadinessMatch.productName}
                  </p>
                </div>

                {/* Estimated Range */}
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100/90 space-y-0.5">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Target Program Size
                  </span>
                  <span className="text-xl font-extrabold text-rose-950 tracking-tight">
                    {improveReadinessMatch.estimatedRange}
                  </span>
                </div>

                {/* Preparation Note & Baseline Requirements */}
                <div className="space-y-1.5 text-xs">
                  <p className="text-rose-900/90 font-medium text-xs italic bg-rose-50/80 p-2.5 rounded-lg border border-rose-100">
                    &ldquo;{improveReadinessMatch.preparationNote}&rdquo;
                  </p>
                  <span className="font-bold text-slate-700 block text-[11px] pt-1">
                    Typical provider requirements:
                  </span>
                  <ul className="space-y-1">
                    {improveReadinessMatch.requirements?.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-600 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 mt-auto">
                <Link href={improveReadinessMatch.ctaUrl} className="w-full block">
                  <Button
                    variant="outline"
                    className="w-full border-rose-300 bg-rose-50/60 text-rose-900 hover:bg-rose-100 hover:text-rose-950 hover:border-rose-400 font-bold text-xs gap-1.5 shadow-xs"
                    size="sm"
                  >
                    <span>{improveReadinessMatch.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <span className="text-[10px] text-slate-400 text-center block mt-1.5">
                  Eligibility varies by provider.
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Educational Compliance Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[11px]">
          <strong className="text-slate-700 font-bold">Important Educational Disclaimer: </strong>
          Crediqly is an educational platform and not a direct lender or credit broker. Matches are categorized based on self-reported profile data and provider guidelines. We never guarantee loan approval or credit extension. Underwriting guidelines and final credit decisions are determined solely by independent providers. Eligibility varies by provider.
        </p>
      </div>
    </section>
  );
};
