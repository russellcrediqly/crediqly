'use client';

import React from 'react';
import Link from 'next/link';
import { Product, RecommendedProduct, CATEGORY_LABELS } from '@/types/product';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Building,
  Info,
  CreditCard,
  Building2,
  Lock,
  Check,
  AlertCircle,
  ArrowRight,
  Landmark,
} from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';

interface ProductCardProps {
  product: Product | RecommendedProduct;
  onOpenDetail: (product: Product | RecommendedProduct) => void;
  onVisitProvider?: (product: Product | RecommendedProduct) => void;
  isPro?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onVisitProvider,
  isPro: propIsPro,
}) => {
  const { isPro: contextIsPro, upgradeToPro } = useSubscription();
  const isPro = propIsPro !== undefined ? propIsPro : contextIsPro;

  const isProLocked =
    !isPro &&
    (product.category === 'net_60' ||
      product.category === 'business_credit_cards' ||
      product.category === 'business_banking' ||
      product.category === 'business_loans');

  const recProd = product as Partial<RecommendedProduct>;
  const isRecommended = Boolean(recProd.matchLabel);
  const matchLabel = recProd.matchLabel || null;

  const recommendedForYou = recProd.recommendedForYou || (
    product.category === 'business_banking'
      ? 'Foundational Business Banking'
      : product.category === 'net_30'
      ? 'Tier-1 Vendor Account'
      : product.category === 'business_credit_cards'
      ? 'Revolving Business Credit'
      : 'Recommended Credit Resource'
  );

  const whyThisMatches = recProd.whyThisMatches || recProd.recommendationReason || product.description;
  const whatYouMayNeed = recProd.whatYouMayNeed || [];
  const whatToConsider = recProd.whatToConsider || (
    product.reportingBureaus && product.reportingBureaus.length > 0
      ? `Reports to ${product.reportingBureaus.join(', ')}. Review current provider terms before applying.`
      : 'Verify current provider underwriting terms before submitting an application.'
  );
  const bankingFit = recProd.bankingFit;
  const nextStepsToImprove = recProd.nextStepsToImprove;
  const isNotRecommendedYet = matchLabel === 'Not Recommended Yet' || matchLabel === 'Improve Readiness First';

  // Resilient outbound link resolution: never produce broken outbound links
  const targetUrl =
    product.affiliateEnabled && product.affiliateUrl && product.affiliateUrl.trim().length > 0
      ? product.affiliateUrl.trim()
      : (product.websiteUrl && product.websiteUrl.trim().length > 0 ? product.websiteUrl.trim() : '#');

  const handleVisit = () => {
    if (onVisitProvider) {
      onVisitProvider(product);
    }
  };

  return (
    <Card className="flex flex-col justify-between border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all bg-white group rounded-2xl overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header row: Category & Match Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              {product.terms && (
                <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                  {product.terms}
                </span>
              )}
            </div>

            {isProLocked ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-600" />
                <span>Pro Locked</span>
              </span>
            ) : matchLabel ? (
              <StatusBadge status={matchLabel} size="sm" />
            ) : null}
          </div>

          {/* Provider Identity */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center shrink-0 font-black text-sm">
              {product.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                onClick={() => onOpenDetail(product)}
                className="text-base font-bold text-slate-900 group-hover:text-brand-600 cursor-pointer transition-colors leading-tight"
              >
                {product.name}
              </h3>
              {product.productType && (
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  {product.productType}
                </span>
              )}
            </div>
          </div>

          {/* 1. RECOMMENDED FOR YOU (Context) */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 block">
              Recommended for you
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {recommendedForYou}
            </p>
          </div>

          {/* 2. WHY THIS MATCHES */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Why this matches:
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {whyThisMatches}
            </p>
          </div>

          {/* 3. WHAT YOU MAY NEED (Prerequisites Checklist) */}
          {whatYouMayNeed.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                What you may need:
              </span>
              <div className="space-y-1">
                {whatYouMayNeed.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANKING SPECIALIZATION BOX (When applicable) */}
          {product.category === 'business_banking' && bankingFit && (
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold">
                <Landmark className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span>Commercial Banking Fit</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-700">
                <div>
                  <strong className="text-indigo-900 font-semibold">Suitable Stage: </strong>
                  <span>{bankingFit.suitableStage}</span>
                </div>
                <div>
                  <strong className="text-indigo-900 font-semibold">Foundation Role: </strong>
                  <span>{bankingFit.foundationSupport}</span>
                </div>
                <div>
                  <strong className="text-indigo-900 font-semibold">Funding Preparation: </strong>
                  <span>{bankingFit.fundingPrepSupport}</span>
                </div>
              </div>
            </div>
          )}

          {/* NOT RECOMMENDED YET -> CLEAR PATH FORWARD */}
          {isNotRecommendedYet && nextStepsToImprove && nextStepsToImprove.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Here's what would make this option more relevant:</span>
              </div>
              <ul className="space-y-1 text-slate-700 pl-4 list-disc text-[11px]">
                {nextStepsToImprove.slice(0, 2).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 underline pt-0.5"
              >
                <span>View My Action Steps</span>
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
              {whatToConsider}
            </p>
          </div>
        </div>

        {/* Action Buttons (5. CTA) */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenDetail(product)}
            className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1 h-8 gap-1"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          {isProLocked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => upgradeToPro()}
              className="text-xs border-indigo-300 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 gap-1.5 h-8 px-3 font-bold shadow-2xs"
            >
              <Lock className="w-3 h-3 text-indigo-700" />
              <span>Unlock with Pro</span>
            </Button>
          ) : (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleVisit}
              className="inline-block"
            >
              <Button
                variant={matchLabel === 'Strong Match' ? 'primary' : 'outline'}
                size="sm"
                className={`text-xs gap-1.5 h-8 px-3.5 font-bold ${
                  matchLabel === 'Strong Match'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                    : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>
                  {product.category === 'business_banking'
                    ? 'Review Banking Option'
                    : product.category === 'business_credit_cards'
                    ? 'Review Card'
                    : 'Review Option'}
                </span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
