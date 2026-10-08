'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  X,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MilestoneCompletionToastProps {
  isOpen: boolean;
  title: string;
  completionType: 'system_verified' | 'customer_confirmation';
  weight: number;
  newScore: number;
  nextMilestoneTitle?: string;
  nextMilestoneHref?: string;
  onUndo?: () => void;
  onDismiss: () => void;
}

export const MilestoneCompletionToast: React.FC<MilestoneCompletionToastProps> = ({
  isOpen,
  title,
  completionType,
  weight,
  newScore,
  nextMilestoneTitle,
  nextMilestoneHref,
  onUndo,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 sm:p-5 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Milestone Updated
              </span>
              {completionType === 'system_verified' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-900/50 px-2 py-0.5 rounded-md border border-sky-700/50">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>System verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded-md border border-amber-700/50">
                  <UserCheck className="w-2.5 h-2.5" />
                  <span>Customer confirmed</span>
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white truncate">
              {title}
            </h4>

            <p className="text-xs text-slate-300">
              Funding Readiness updated to <strong className="text-white font-extrabold">{newScore}/100</strong> (+{weight} pts).
            </p>

            {nextMilestoneTitle && (
              <div className="pt-2 text-xs flex items-center gap-1.5 text-teal-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                <span className="truncate">
                  Next: <strong>{nextMilestoneTitle}</strong>
                </span>
                {nextMilestoneHref && (
                  <Link
                    href={nextMilestoneHref}
                    className="underline hover:text-white shrink-0 ml-1 inline-flex items-center gap-0.5"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onUndo && (
            <button
              onClick={onUndo}
              title="Undo completion"
              className="p-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
