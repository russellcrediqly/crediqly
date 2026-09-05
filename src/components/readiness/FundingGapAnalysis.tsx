'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  CreditCard,
  DollarSign,
  Briefcase,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSubscription } from '@/context/SubscriptionContext';
import { FundingReadinessResult } from '@/types/funding';

interface FundingGapAnalysisProps {
  fundingResult: FundingReadinessResult | null;
  isProfileComplete: boolean;
  compact?: boolean;
}

interface GapItem {
  id: string;
  categoryKey: 'foundation' | 'businessCredit' | 'financialReadiness' | 'fundingProfile';
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'Needs Attention' | 'Developing' | 'Needs Verification' | 'Strong';
  statusBadgeVariant: 'warning' | 'info' | 'neutral' | 'success';
  explanation: string;
  actionText: string;
  actionHref: string;
  actionButtonLabel: string;
}

export const FundingGapAnalysis: React.FC<FundingGapAnalysisProps> = ({
  fundingResult,
  isProfileComplete,
  compact = false,
}) => {
  const { isPro, upgradeToPro } = useSubscription();

  if (!fundingResult || !isProfileComplete) {
    return (
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Complete Business Profile to Unlock Gap Analysis
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crediqly evaluates 4 core readiness categories to identify what is holding your business back from funding. Complete your profile to view your customized gap analysis.
            </p>
          </div>
          <div>
            <Link href="/onboarding">
              <Button size="sm" variant="primary" className="text-xs font-bold gap-1.5 shadow-xs bg-brand-600 hover:bg-brand-500">
                <span>Complete Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { categories, score, level, nextBestAction } = fundingResult;

  // Build structured gap items from existing category scores
  const allGaps: GapItem[] = [
    {
      id: 'foundation',
      categoryKey: 'foundation',
      title: 'Business Foundation & Entity Legality',
      score: categories.foundation.score,
      maxScore: categories.foundation.maxScore,
      percentage: categories.foundation.percentage,
      status:
        categories.foundation.percentage >= 80
          ? 'Strong'
          : categories.foundation.percentage >= 50
          ? 'Developing'
          : categories.foundation.score === 0
          ? 'Needs Verification'
          : 'Needs Attention',
      statusBadgeVariant:
        categories.foundation.percentage >= 80
          ? 'success'
          : categories.foundation.percentage >= 50
          ? 'info'
          : categories.foundation.score === 0
          ? 'neutral'
          : 'warning',
      explanation:
        categories.foundation.percentage >= 80
          ? 'Your legal entity, EIN, and commercial banking foundation are verified and meeting underwriter expectations.'
          : 'Your business foundation needs additional development. Separating commercial and personal finances is a strict prerequisite for commercial credit and loans.',
      actionText: 'Ensure EIN, dedicated business checking, and public business listings are verified.',
      actionHref: '/roadmap?stage=foundation',
      actionButtonLabel: 'View Foundation Steps',
    },
    {
      id: 'businessCredit',
      categoryKey: 'businessCredit',
      title: 'Commercial Credit Depth & Tradelines',
      score: categories.businessCredit.score,
      maxScore: categories.businessCredit.maxScore,
      percentage: categories.businessCredit.percentage,
      status:
        categories.businessCredit.percentage >= 80
          ? 'Strong'
          : categories.businessCredit.percentage >= 50
          ? 'Developing'
          : categories.businessCredit.score === 0
          ? 'Needs Verification'
          : 'Needs Attention',
      statusBadgeVariant:
        categories.businessCredit.percentage >= 80
          ? 'success'
          : categories.businessCredit.percentage >= 50
          ? 'info'
          : categories.businessCredit.score === 0
          ? 'neutral'
          : 'warning',
      explanation:
        categories.businessCredit.percentage >= 80
          ? 'Active trade credit accounts are reporting on-time payment history to major commercial bureaus.'
          : 'Your profile shows limited reporting credit activity. Tier-1 vendor accounts establish verifiable payment track records across Dun & Bradstreet, Experian, and Equifax.',
      actionText: 'Open initial Net-30 vendor accounts that report monthly to commercial credit bureaus.',
      actionHref: '/products?category=net_30',
      actionButtonLabel: 'View Recommended Products',
    },
    {
      id: 'financialReadiness',
      categoryKey: 'financialReadiness',
      title: 'Financial Readiness & Operating Cash Flow',
      score: categories.financialReadiness.score,
      maxScore: categories.financialReadiness.maxScore,
      percentage: categories.financialReadiness.percentage,
      status:
        categories.financialReadiness.percentage >= 80
          ? 'Strong'
          : categories.financialReadiness.percentage >= 50
          ? 'Developing'
          : categories.financialReadiness.score === 0
          ? 'Needs Verification'
          : 'Needs Attention',
      statusBadgeVariant:
        categories.financialReadiness.percentage >= 80
          ? 'success'
          : categories.financialReadiness.percentage >= 50
          ? 'info'
          : categories.financialReadiness.score === 0
          ? 'neutral'
          : 'warning',
      explanation:
        categories.financialReadiness.percentage >= 80
          ? 'Your reported operating age and annual revenue establish strong debt-service capability.'
          : 'Commercial lenders evaluate operating revenue consistency and cash flow reserves before extending credit lines or term loans.',
      actionText: 'Organize 3–6 months of business bank statements and update financial records.',
      actionHref: '/roadmap?stage=funding',
      actionButtonLabel: 'View Financial Milestones',
    },
    {
      id: 'fundingProfile',
      categoryKey: 'fundingProfile',
      title: 'Credit Profile & Financing Preparedness',
      score: categories.fundingProfile.score,
      maxScore: categories.fundingProfile.maxScore,
      percentage: categories.fundingProfile.percentage,
      status:
        categories.fundingProfile.percentage >= 80
          ? 'Strong'
          : categories.fundingProfile.percentage >= 50
          ? 'Developing'
          : categories.fundingProfile.score === 0
          ? 'Needs Verification'
          : 'Needs Attention',
      statusBadgeVariant:
        categories.fundingProfile.percentage >= 80
          ? 'success'
          : categories.fundingProfile.percentage >= 50
          ? 'info'
          : categories.fundingProfile.score === 0
          ? 'neutral'
          : 'warning',
      explanation:
        categories.fundingProfile.percentage >= 80
          ? 'Clear target capital objectives and financing parameters are articulated.'
          : 'Defining specific target capital ranges and building credit relationships with smaller credit lines improves lender underwriting confidence.',
      actionText: 'Review exploratory funding options that align with your operating timeline.',
      actionHref: '/funding',
      actionButtonLabel: 'Explore Funding Directory',
    },
  ];

  // Sort gaps by deficit: highest gap first (lowest percentage)
  const sortedGaps = [...allGaps].sort((a, b) => a.percentage - b.percentage);

  // Free users see the top 2 gaps; Pro users see all 4
  const displayedGaps = isPro ? sortedGaps : sortedGaps.slice(0, 2);

  return (
    <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
      <CardContent className="p-6 sm:p-7 space-y-6">
        {/* Header with Live Score Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                Funding Gap Analysis
              </span>
              <span className="text-xs text-slate-500 font-medium">
                What is holding your business back?
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Your Funding Readiness Gaps
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Based on your self-reported profile, we identified where your business stands across the 4 key categories commercial underwriters evaluate.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shrink-0 self-start sm:self-center">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {score}
                <span className="text-xs text-slate-400 font-medium"> / 100</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Readiness Score
              </span>
            </div>
            <div className="h-9 w-px bg-slate-200" />
            <div>
              <Badge
                variant={
                  score >= 70
                    ? 'success'
                    : score >= 50
                    ? 'info'
                    : score >= 30
                    ? 'warning'
                    : 'neutral'
                }
                className="text-xs font-bold uppercase"
              >
                {level}
              </Badge>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Evaluated from profile
              </span>
            </div>
          </div>
        </div>

        {/* SECTION: YOUR BIGGEST GAPS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Biggest Gaps
            </h4>
            <span className="text-xs text-slate-400 font-medium">
              Ranked by category point deficit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedGaps.map((gap, idx) => (
              <div
                key={gap.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  gap.status === 'Needs Attention'
                    ? 'border-amber-200 bg-amber-50/40'
                    : gap.status === 'Developing'
                    ? 'border-brand-200 bg-brand-50/30'
                    : gap.status === 'Needs Verification'
                    ? 'border-slate-200 bg-slate-50/60'
                    : 'border-emerald-200 bg-emerald-50/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      Gap #{idx + 1}
                    </span>
                    <Badge variant={gap.statusBadgeVariant} className="text-[10px] font-bold">
                      {gap.status}
                    </Badge>
                  </div>

                  <h5 className="text-sm font-bold text-slate-900 leading-snug">
                    {gap.title}
                  </h5>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Category Score</span>
                      <span className="font-bold text-slate-800">
                        {gap.score} / {gap.maxScore} pts ({gap.percentage}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={gap.percentage}
                      color={
                        gap.percentage >= 80
                          ? 'emerald'
                          : gap.percentage >= 50
                          ? 'brand'
                          : 'amber'
                      }
                      showPercentage={false}
                      className="h-1.5"
                    />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {gap.explanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium truncate">
                    {gap.actionText}
                  </span>
                  <Link href={gap.actionHref} className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2.5 font-semibold text-brand-700 border-brand-200 hover:bg-brand-50"
                    >
                      <span>{gap.actionButtonLabel}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free Preview Unlock Prompt (Phase 6 & 7) */}
        {!isPro && (
          <div className="p-4 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Unlock Full Institutional Gap Analysis with Crediqly Pro
                </span>
                <span className="text-xs text-slate-600 block">
                  Access bank rating ratios, DSCR underwriting benchmarks, and full tradeline gap sequencing.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <Button
                size="sm"
                onClick={upgradeToPro}
                className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white gap-1 shadow-xs"
              >
                <span>Upgrade to Pro — $39/mo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* SECTION: WHAT TO WORK ON FIRST */}
        {nextBestAction && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50/80 via-teal-50/40 to-white border border-brand-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-900 bg-brand-100/70 px-2.5 py-0.5 rounded-full">
                What to Work on First
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  {nextBestAction.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {nextBestAction.explanation}
                </p>
              </div>

              <div className="shrink-0">
                <Link href={nextBestAction.actionHref}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold gap-1.5 shadow-xs bg-brand-600 hover:bg-brand-500 text-white whitespace-nowrap"
                  >
                    <span>{nextBestAction.actionLabel || 'View Your Next Action'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Non-Guaranteed Regulatory Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Educational Evaluation Disclaimer: </span>
          Gap designations and readiness indicators reflect internal evaluations based solely on self-reported profile data. They do not constitute credit repair, pre-qualification, or lending approval guarantees. Actual lender underwriting requirements vary by financial institution.
        </div>
      </CardContent>
    </Card>
  );
};
