'use client';

import React from 'react';
import { Product, RecommendedProduct, CATEGORY_LABELS } from '@/types/product';
import { Button } from '@/components/ui/Button';
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Info,
  Building,
  CreditCard,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | RecommendedProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onVisitProvider?: (product: Product | RecommendedProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onVisitProvider,
}) => {
  if (!isOpen || !product) return null;

  const isRecommended = 'matchLabel' in product;
  const matchLabel = isRecommended ? (product as RecommendedProduct).matchLabel : null;
  const recommendationReason = isRecommended
    ? (product as RecommendedProduct).recommendationReason
    : null;

  const targetUrl =
    product.affiliateEnabled && product.affiliateUrl
      ? product.affiliateUrl
      : product.websiteUrl;

  const handleVisit = () => {
    if (onVisitProvider) {
      onVisitProvider(product);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 font-black text-base">
              {product.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[product.category] || product.category}
                </span>
                {matchLabel && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {matchLabel}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Personalized recommendation reason */}
          {recommendationReason && (
            <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200/80 text-brand-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-brand-900">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Why This May Be Relevant For You</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                {recommendationReason}
              </p>
            </div>
          )}

          {/* Full Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Overview
            </h4>
            <p className="text-slate-700 leading-relaxed text-sm">
              {product.description}
            </p>
          </div>

          {/* Reporting Information */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Commercial Credit Bureau Reporting</span>
            </h4>
            {product.reportingBureaus && product.reportingBureaus.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-slate-600">
                  This provider is verified to report account and payment data to:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {product.reportingBureaus.map((b) => (
                    <span
                      key={b}
                      className="font-bold text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-md text-[11px]"
                    >
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">
                This product does not report directly to credit bureaus or is a foundational banking/legal service.
              </p>
            )}
          </div>

          {/* Requirements & Eligibility Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Provider Requirements & Eligibility
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>EIN Required: {product.einRequired ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>
                  Business Bank: {product.businessBankAccountRequired ? 'Required' : 'Not required'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>
                  Personal Guarantee:{' '}
                  {product.personalGuaranteeRequired === 'no'
                    ? 'No PG Required'
                    : product.personalGuaranteeRequired === 'yes'
                    ? 'Personal Guarantee Required'
                    : 'Check provider'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>
                  Time in Business:{' '}
                  {product.typicalBusinessAge || 'Check provider requirements'}
                </span>
              </div>
            </div>
            {product.personalCreditRequirement && (
              <p className="text-[11px] text-slate-500 pt-1">
                Personal Credit: <strong>{product.personalCreditRequirement}</strong>
              </p>
            )}
          </div>

          {/* Pricing / Minimum order information */}
          {product.minimumPurchase && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Minimum Qualifying Activity:</span>
              <span className="font-bold text-slate-800">{product.minimumPurchase}</span>
            </div>
          )}

          {/* Professional Educational Disclosure */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Disclosure</span>
            </div>
            <p className="leading-relaxed">
              The information and resources provided are for educational purposes only. Requirements, terms, availability, and eligibility may vary by provider. Review all terms carefully before taking action. Some links may provide a commission to Crediqly at no additional cost to you.
            </p>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 sticky bottom-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-600"
          >
            Close
          </Button>

          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleVisit}
            className="inline-block"
          >
            <Button
              variant="primary"
              size="md"
              className="gap-2 shadow-xs text-xs font-semibold px-4"
            >
              <span>Visit Provider</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
