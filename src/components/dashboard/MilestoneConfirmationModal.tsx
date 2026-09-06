'use client';

import React from 'react';
import { CheckCircle2, X, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ReadinessMilestoneDefinition } from '@/lib/readiness/readinessMilestoneEngine';

interface MilestoneConfirmationModalProps {
  milestone: ReadinessMilestoneDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const MilestoneConfirmationModal: React.FC<MilestoneConfirmationModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen || !milestone) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                {milestone.categoryLabel}
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Confirm Milestone Completion
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{milestone.title}</span>
              <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                +{milestone.weight} pts
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {milestone.description}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>Have you completed this step?</strong>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please confirm that your business has successfully established this milestone. Confirming will record completion in your permanent business record and update your Funding Readiness progress.
            </p>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-[11px] text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Real progress: Your score will mathematically increase by exactly {milestone.weight} points based on this verified milestone.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs text-slate-700"
          >
            Not Yet
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Yes, Mark Complete</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
