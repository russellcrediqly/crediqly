'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Bookmark,
  Check,
  Building2,
  Gift,
  FileText,
  DollarSign,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { FundingMatchResult, FundingProduct } from '@/types/fundingProduct';

interface FundingDetailsModalProps {
  matchResult: FundingMatchResult | null;
  onClose: () => void;
  isTracked: boolean;
  onTrack: (product: FundingProduct) => Promise<void>;
  onOutboundClick: (product: FundingProduct) => void;
}

export const FundingDetailsModal: React.FC<FundingDetailsModalProps> = ({
  matchResult,
  onClose,
  isTracked,
  onTrack,
  onOutboundClick,
}) => {
  if (!matchResult) return null;

  const { product, matchLevel, whyThisFits, requirementSummary, checklistMet, checklistPending, nextStepsToImprove, isGrant } = matchResult;

  const isStrong = matchLevel === 'Strong Match';
  const isPossible = matchLevel === 'Possible Match' || matchLevel === 'Potential Match';
  const isNotReady = matchLevel === 'Not Ready Yet';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
              {product.category}
            </span>

            {isGrant && (
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 bg-purple-900/60 border border-purple-400/40 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Gift className="w-3 h-3 text-purple-300" />
                <span>Non-Dilutive Grant</span>
              </span>
            )}

            {isStrong ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-mono">
                🟢 Strong Match
              </span>
            ) : isPossible ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-mono">
                🟡 Possible Match
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 bg-slate-800 border border-slate-600 px-2.5 py-0.5 rounded-full font-mono">
                🔴 Not Ready Yet
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {product.name}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Offered by <span className="text-white font-bold">{product.provider}</span>
            {product.lastReviewedDate && ` • Last reviewed: ${product.lastReviewedDate}`}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Overview Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Opportunity Overview
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                {isGrant ? 'Award Amount' : 'Funding Range'}
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {product.grantAmount || requirementSummary.fundingRange}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Typical Term
              </span>
              <span className="text-xs font-bold text-slate-800">
                {requirementSummary.repayment}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Min. In Business
              </span>
              <span className="text-xs font-bold text-slate-800">
                {requirementSummary.minAge}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Min. Revenue
              </span>
              <span className="text-xs font-bold text-slate-800">
                {requirementSummary.minRevenue}
              </span>
            </div>
          </div>

          {/* Rate / Cost Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Pricing, Rates &amp; Fee Structure
            </span>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              {requirementSummary.rates}
            </p>
            <p className="text-[11px] text-slate-500">
              Advertised or typical provider parameters. Specific offer terms are set directly by the funding provider during formal application review.
            </p>
          </div>

          {/* Grant Details (if applicable) */}
          {isGrant && (
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2 text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 block">
                Grant Application &amp; Eligibility Guidelines
              </span>
              {product.grantDeadline && (
                <div className="text-slate-800">
                  <strong>Deadline:</strong> {product.grantDeadline}
                </div>
              )}
              {product.eligibilityNotes && (
                <div className="text-slate-700">
                  <strong>Eligibility:</strong> {product.eligibilityNotes}
                </div>
              )}
              {product.locationRestrictions && (
                <div className="text-slate-700">
                  <strong>Location Scope:</strong> {product.locationRestrictions}
                </div>
              )}
            </div>
          )}

          {/* Why Matched */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Why You're Seeing This Match
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-brand-50/50 p-3 rounded-xl border border-brand-100">
              {whyThisFits}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  Criteria Met Based on Profile:
                </span>
                {checklistMet.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {checklistPending.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-800 block">
                    Verification Needed:
                  </span>
                  {checklistPending.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Readiness Next Steps (if Not Ready Yet) */}
          {isNotReady && nextStepsToImprove && nextStepsToImprove.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>To Prepare for This Type of Financing:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-4 list-disc">
                {nextStepsToImprove.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ul>
              <div className="pt-1">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 underline"
                >
                  <span>Go to My Readiness Journey &amp; Next Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Transparent Regulatory Disclaimer */}
          <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong>Marketplace Transparency Notice:</strong> Crediqly provides preliminary matching based on information available in your profile. Funding providers make their own approval and underwriting decisions. Terms, rates, requirements, and availability may change. No credit check has been performed by Crediqly.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold w-full sm:w-auto"
          >
            Close
          </Button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onTrack(product)}
              disabled={isTracked}
              className={`text-xs font-semibold gap-1 ${
                isTracked ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'text-slate-800'
              }`}
            >
              {isTracked ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tracked in My Applications</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Track Application</span>
                </>
              )}
            </Button>

            <a
              href={product.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOutboundClick(product)}
              className="w-full sm:w-auto"
            >
              <Button
                variant={isStrong ? 'primary' : 'outline'}
                size="sm"
                className={`text-xs font-black gap-1.5 w-full shadow-xs ${
                  isStrong
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-brand-600 hover:bg-brand-500 text-white'
                }`}
              >
                <span>{isGrant ? 'Apply for Grant' : 'Check With Provider'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
