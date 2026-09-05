'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSubscription } from '@/context/SubscriptionContext';

interface ProGateProps {
  children?: React.ReactNode;
  previewContent?: React.ReactNode;
  featureName?: string;
  description?: string;
  bullets?: string[];
  compact?: boolean;
  blurPreview?: boolean;
  ctaText?: string;
}

export const ProGate: React.FC<ProGateProps> = ({
  children,
  previewContent,
  featureName = 'Premium Commercial Tools',
  description = 'Upgrade to Crediqly Pro to unlock this feature, full vendor net-30 accounts, and personalized funding recommendations.',
  bullets,
  compact = false,
  blurPreview = false,
  ctaText = 'Upgrade to Pro — $39/mo',
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
      <div className="p-4 rounded-xl border border-brand-200/80 bg-gradient-to-r from-brand-50/60 via-white to-indigo-50/40 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
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
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shrink-0 gap-1 shadow-xs"
        >
          <span>Upgrade</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  // Preview + Unlock Mode
  if (blurPreview && (children || previewContent)) {
    return (
      <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Blurred preview content */}
        <div className="filter blur-[3.5px] opacity-35 pointer-events-none select-none max-h-72 overflow-hidden">
          {previewContent || children}
        </div>

        {/* Floating Unlock Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent flex flex-col items-center justify-end p-6 text-center space-y-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Lock className="w-3 h-3 text-brand-600" />
            <span>{featureName}</span>
          </div>
          <div className="space-y-1 max-w-md">
            <h4 className="text-base font-bold text-slate-900">
              Unlock with Crediqly Pro
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={upgradeToPro}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300">
                Compare Plans
              </Button>
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 pt-0.5">Cancel anytime • Instant access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/70 via-white to-brand-50/30 p-6 sm:p-8 text-center overflow-hidden shadow-xs">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white mx-auto flex items-center justify-center shadow-sm">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3 h-3 text-brand-600" />
            <span>Crediqly Pro Feature</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Unlock {featureName}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description}
          </p>

          {bullets && bullets.length > 0 && (
            <div className="pt-2 text-left space-y-1.5 max-w-sm mx-auto">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}
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
              className="w-full sm:w-auto text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50"
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

