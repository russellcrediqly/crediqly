'use client';

import React from 'react';
import { Product, RecommendedProduct, CATEGORY_LABELS } from '@/types/product';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  const isRecommended = 'matchLabel' in product;
  const matchLabel = isRecommended ? (product as RecommendedProduct).matchLabel : null;
  const recommendationReason = isRecommended
    ? (product as RecommendedProduct).recommendationReason
    : null;

  const targetUrl =
    product.affiliateEnabled && product.affiliateUrl
      ? product.affiliateUrl
      : product.websiteUrl;

  const handleVisit = (e: React.MouseEvent) => {
    if (onVisitProvider) {
      onVisitProvider(product);
    }
  };

  const getMatchBadge = (label: string) => {
    switch (label) {
      case 'Strong Potential Match':
      case 'Strong Match':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Possible Match':
      case 'Potential Match':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Improve Readiness First':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'Explore':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getMatchIndicatorDot = (label: string) => {
    if (label.includes('Strong')) return '🟢';
    if (label.includes('Possible') || label.includes('Potential')) return '🟡';
    if (label.includes('Improve')) return '🔴';
    return '⚪';
  };

  return (
    <Card className="flex flex-col justify-between border-slate-200/80 hover:border-brand-300 hover:shadow-xs transition-all bg-white group">
      <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3.5">
          {/* Header row: Category & Match Badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/70">
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              {product.terms && (
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
                  {product.terms}
                </span>
              )}
            </div>

            {isProLocked ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-600" />
                <span>Pro Locked</span>
              </span>
            ) : matchLabel ? (
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${getMatchBadge(
                  matchLabel
                )}`}
              >
                <span>{getMatchIndicatorDot(matchLabel)}</span>
                <span>{matchLabel}</span>
              </span>
            ) : null}
          </div>

          {/* Provider Identity */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100/80 text-brand-700 flex items-center justify-center flex-shrink-0 font-black text-sm">
              {product.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
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

          {/* Short Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Bureau Reporting Tags */}
          {product.reportingBureaus && product.reportingBureaus.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Reports To:
              </span>
              <div className="flex flex-wrap gap-1">
                {product.reportingBureaus.map((bureau) => (
                  <span
                    key={bureau}
                    className="text-[10px] font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200/70 px-2 py-0.5 rounded"
                  >
                    {bureau}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Requirement Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-500">
            {product.annualFee && (
              <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded font-semibold text-slate-800">
                Annual Fee: {product.annualFee}
              </span>
            )}
            {product.minimumPurchase && product.category === 'net_30' && (
              <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded text-slate-700">
                {product.minimumPurchase}
              </span>
            )}
            {product.einRequired && (
              <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded">
                EIN Required
              </span>
            )}
            {product.personalGuaranteeRequired === 'no' && (
              <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded text-emerald-800 font-semibold bg-emerald-50/50">
                No Personal Guarantee
              </span>
            )}
            {product.typicalBusinessAge && (
              <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded">
                Age: {product.typicalBusinessAge}
              </span>
            )}
          </div>

          {/* Recommendation rationale snippet */}
          {recommendationReason && (
            <div className="p-2.5 rounded-lg bg-slate-50/90 border border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800 font-semibold block mb-0.5">
                Why this is recommended:
              </strong>
              {recommendationReason}
            </div>
          )}
        </div>

        {/* Action Buttons */}
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
              <span>Unlock with Pro / Advisory</span>
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
                variant="outline"
                size="sm"
                className="text-xs border-brand-200 text-brand-700 hover:bg-brand-50 gap-1 h-8 px-3 font-semibold"
              >
                <span>
                  {product.category === 'business_credit_cards'
                    ? 'View Card'
                    : product.category === 'net_30'
                    ? 'Learn More'
                    : 'Visit Provider'}
                </span>
                <ExternalLink className="w-3 h-3 text-brand-600" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
