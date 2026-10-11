'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Subscription } from '@/types/subscription';

interface CustomerPlanOverviewCardProps {
  subscription: Subscription | null;
  hasFoundation: boolean;
  hasGuided: boolean;
  loading?: boolean;
  upgradeToFoundation: () => Promise<void>;
  upgradeToGuided: (billing?: 'monthly' | 'one_time') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  onOpenConsultation?: () => void;
  className?: string;
}

export const CustomerPlanOverviewCard: React.FC<CustomerPlanOverviewCardProps> = ({
  subscription,
  hasFoundation,
  hasGuided,
  loading = false,
  upgradeToFoundation,
  upgradeToGuided,
  openCustomerPortal,
  onOpenConsultation,
  className = '',
}) => {
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const handleUpgradeFoundation = async () => {
    try {
      setUpgradingPlan('foundation');
      await upgradeToFoundation();
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleUpgradeGuided = async (billing: 'monthly' | 'one_time' = 'monthly') => {
    try {
      setUpgradingPlan(billing === 'monthly' ? 'guided_monthly' : 'guided_onetime');
      await upgradeToGuided(billing);
    } finally {
      setUpgradingPlan(null);
    }
  };

  const planName = hasGuided
    ? subscription?.accessSource === 'stripe_onetime'
      ? 'Guided 12-Month Program'
      : 'Guided Plan'
    : hasFoundation
    ? 'Foundation Plan'
    : 'Free Starter Plan';

  const planPriceText = hasGuided
    ? subscription?.accessSource === 'stripe_onetime'
      ? '$997 / 12 months'
      : '$147.99 / month'
    : hasFoundation
    ? '$47.99 / month'
    : '$0 / forever';

  const billingStatus = subscription?.billingStatus || subscription?.status || 'active';
  const isPastDue = billingStatus === 'past_due' || subscription?.status === 'past_due';
  const isCanceled = billingStatus === 'canceled' || subscription?.status === 'cancelled';

  const accessSourceLabel = (() => {
    if (subscription?.accessSource === 'stripe_subscription') {
      return 'Stripe Monthly Subscription';
    }
    if (subscription?.accessSource === 'stripe_onetime') {
      return '12-Month Program (One-Time Payment)';
    }
    if (subscription?.accessSource === 'admin_grant') {
      return subscription?.grantedBy
        ? `Administrative Grant (${subscription.grantedBy})`
        : 'Administrative Grant';
    }
    if (subscription?.accessSource === 'complimentary') {
      return 'Complimentary Partner Access';
    }
    return 'Free Tier ($0)';
  })();

  const termText = (() => {
    if (subscription?.expiresAt) {
      return `Access expires ${new Date(subscription.expiresAt).toLocaleDateString()}`;
    }
    if (subscription?.currentPeriodEnd) {
      const dateStr = new Date(subscription.currentPeriodEnd).toLocaleDateString();
      if (subscription.cancelAtPeriodEnd) {
        return `Cancels on ${dateStr}`;
      }
      if (subscription.accessSource === 'stripe_onetime') {
        return `Valid through ${dateStr} (No automatic renewal)`;
      }
      return `Next billing date: ${dateStr}`;
    }
    if (hasFoundation || hasGuided) {
      return 'Active recurring access';
    }
    return 'No expiration';
  })();

  const freeIncludedBenefits = [
    '21-Point Business Compliance & Secretary of State Audit',
    'Baseline Funding Readiness Score (0–100 Assessment)',
    'Stage 1 Establish Foundational Roadmap Tasks',
    'Starter Net-30 Vendor Tradeline Catalog (3 accounts)',
  ];

  const foundationIncludedBenefits = [
    'All Free discovery tools & 21-point compliance audit',
    'Complete 4-Tier Interactive Credit Building Roadmap',
    'Full Net-30 & Vendor Tradelines Catalog (Tiers 1, 2 & 3)',
    'Commercial Banks Directory & Underwriting Criteria',
    'Crediqly AI Mentor tailored to your business profile',
    'Continuous factor gap analysis & score tracking',
  ];

  const guidedIncludedBenefits = [
    'Everything in Foundation included',
    '1 Scheduled 1-on-1 Strategy Consultation per month with Credit Specialist',
    'Priority underwriting document & roadmap review',
    'Custom funding application sequencing & preparation',
    'Direct priority support with expedited response time',
  ];

  const currentBenefits = hasGuided
    ? guidedIncludedBenefits
    : hasFoundation
    ? foundationIncludedBenefits
    : freeIncludedBenefits;

  return (
    <Card className={`border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden ${className}`}>
      {/* Top Past-Due Warning Banner */}
      {isPastDue && (
        <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">
              Payment past due: Your latest subscription payment could not be processed. Please update your payment method in the Stripe Customer Portal to avoid interruption.
            </span>
          </div>
          {subscription?.stripeCustomerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={openCustomerPortal}
              className="text-xs font-bold border-amber-300 text-amber-900 bg-white hover:bg-amber-100 shrink-0"
            >
              Update Payment
            </Button>
          )}
        </div>
      )}

      {/* Top Canceled Notice Banner */}
      {isCanceled && !hasFoundation && !hasGuided && (
        <div className="p-3.5 bg-slate-100 border-b border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Your previous subscription concluded on {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'a prior date'} and your account has reverted to the Free plan.
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpgradeFoundation}
            className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shrink-0"
          >
            Reactivate Foundation ($47.99/mo)
          </Button>
        </div>
      )}

      <CardContent className="p-6 sm:p-7 space-y-6">
        {/* Header Block: Plan & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CURRENT MEMBERSHIP
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                  hasGuided
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : hasFoundation
                    ? 'bg-brand-50 text-brand-900 border border-brand-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {planName}
              </span>
              <span className="text-xs text-slate-400 font-medium">({planPriceText})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>{accessSourceLabel}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{termText}</span>
              </span>
            </div>
          </div>

          {/* Action Button: Customer Portal or Upgrade */}
          <div className="flex items-center gap-2 shrink-0">
            {subscription?.stripeCustomerId && (
              <Button
                variant="outline"
                size="sm"
                onClick={openCustomerPortal}
                className="text-xs font-semibold text-slate-700 border-slate-300 gap-1.5 h-8"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>Billing &amp; Invoices</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Button>
            )}

            {hasGuided && onOpenConsultation && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenConsultation}
                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1.5 h-8 shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Strategy Call</span>
              </Button>
            )}
          </div>
        </div>

        {/* Plan Feature Matrix: Included Benefits vs Locked Upgrade Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Column A: Included in your Plan */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Included in Your {planName}
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              {currentBenefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column B: Locked Features & Upgrade Pathway */}
          <div className="space-y-3 md:border-l md:border-slate-100 md:pl-6">
            {!hasGuided && (
              <>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Available with Upgrade
                  </h4>
                </div>

                {!hasFoundation ? (
                  /* Free user upgrade pathway */
                  <div className="space-y-3">
                    <ul className="space-y-2 text-xs text-slate-500">
                      <li className="flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Foundation:</strong> Complete 4-Tier Interactive Roadmap ($47.99/mo)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Foundation:</strong> Tiers 1, 2, 3 Tradeline Catalog &amp; Bank Criteria</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Guided:</strong> 1-on-1 Monthly Strategy Consultation with Specialist ($147.99/mo)</span>
                      </li>
                    </ul>

                    <div className="pt-2 flex flex-wrap gap-2.5">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleUpgradeFoundation}
                        isLoading={upgradingPlan === 'foundation'}
                        className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1 shadow-xs"
                      >
                        <span>Upgrade to Foundation ($47.99/mo)</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>

                      <Link href="/pricing">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs font-semibold text-slate-800 border-slate-300"
                        >
                          <span>Explore Guided ($147.99/mo)</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Foundation user upgrade to Guided pathway */
                  <div className="space-y-3">
                    <ul className="space-y-2 text-xs text-slate-500">
                      <li className="flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Guided:</strong> 1-on-1 Monthly Strategy Consultation with Credit Specialist</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Guided:</strong> Priority Underwriting Document &amp; Application Sequencing Review</span>
                      </li>
                    </ul>

                    <div className="pt-2 flex flex-wrap gap-2.5">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpgradeGuided('monthly')}
                        isLoading={upgradingPlan === 'guided_monthly'}
                        className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1 shadow-xs"
                      >
                        <span>Upgrade to Guided ($147.99/mo)</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpgradeGuided('one_time')}
                        isLoading={upgradingPlan === 'guided_onetime'}
                        className="text-xs font-semibold text-slate-800 border-slate-300"
                      >
                        <span>12-Month Plan ($997)</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {hasGuided && (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Highest Membership Tier Active
                  </h4>
                </div>
                <p className="leading-relaxed text-slate-600">
                  You have full commercial credit building tools, verified tradelines, commercial bank criteria, and dedicated monthly 1-on-1 strategy meetings unlocked.
                </p>
                <div className="pt-2">
                  <Link href="/pricing" className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline flex items-center gap-1">
                    <span>View Full Plan Feature Comparison</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
