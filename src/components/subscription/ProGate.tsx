'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSubscription } from '@/context/SubscriptionContext';

interface ProGateProps {
  children?: React.ReactNode;
  featureName?: string;
  description?: string;
  compact?: boolean;
}

export const ProGate: React.FC<ProGateProps> = ({
  children,
  featureName = 'Premium Commercial Tools',
  description = 'Upgrade to Crediqly Pro to unlock this feature, full vendor net-30 accounts, and personalized funding recommendations.',
  compact = false,
}) => {
  const { isPro, loading, upgradeToPro } = useSubscription();

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 animate-pulse text-xs text-slate-400">
        Checking access permissions...
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (compact) {
    return (
      <div className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/50 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 block truncate">{featureName}</span>
            <span className="text-[11px] text-slate-500 block truncate">Available on Crediqly Pro ($39/mo)</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={upgradeToPro}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shrink-0 gap-1"
        >
          <span>Upgrade</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/40 via-white to-slate-50 p-6 sm:p-8 text-center overflow-hidden shadow-xs">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 mx-auto flex items-center justify-center shadow-xs">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold tracking-wide uppercase mb-1">
            <Sparkles className="w-3 h-3 text-brand-600" />
            <span>Crediqly Pro Feature</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Unlock {featureName}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={upgradeToPro}
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-2 shadow-sm"
          >
            <span>Upgrade to Pro — $39/mo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <Link href="/pricing" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Compare Plans
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Billed monthly via Stripe. Cancel anytime in one click.</span>
        </div>
      </div>
    </div>
  );
};
