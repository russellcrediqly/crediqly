'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  ListOrdered,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RoadmapTask } from '@/lib/roadmap/types';
import { useSubscription } from '@/context/SubscriptionContext';
import { Lock } from 'lucide-react';

interface RoadmapTaskModalProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (taskKey: string) => void;
  onRequestReopen?: (task: RoadmapTask) => void;
}

export const RoadmapTaskModal: React.FC<RoadmapTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onToggleComplete,
  onRequestReopen,
}) => {
  const { isPro, upgradeToPro } = useSubscription();

  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'completed';
  const isLocked = !isPro && task.stage !== 'foundation';

  const priorityColor =
    task.priority === 'high'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : task.priority === 'medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${priorityColor}`}
              >
                {task.priority} Priority
              </span>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                  Not Started
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {task.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Why This Matters */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>Why This Matters</span>
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {task.whyItMatters}
            </p>
          </div>

          {/* What To Do */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-brand-600" />
              <span>Recommended Action Steps</span>
            </h4>
            <div className="space-y-2">
              {(isLocked ? task.whatToDo.slice(0, 1) : task.whatToDo).map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}

              {isLocked && task.whatToDo.length > 1 && (
                <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/70 space-y-2.5 mt-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Your next recommended action steps are available in Pro
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unlock full action guides, bureau reporting criteria, and direct application steps.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        upgradeToPro();
                      }}
                      className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1.5 shadow-xs w-full sm:w-auto"
                    >
                      <span>Upgrade to Pro — $39/mo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-[11px] text-slate-500">Cancel anytime • Instant access</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Things to Consider */}
          {task.thingsToConsider && task.thingsToConsider.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Things to Keep in Mind</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60 leading-relaxed">
                {task.thingsToConsider.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Link Note */}
          {task.actionHref && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                task.actionHref.startsWith('/products')
                  ? 'bg-brand-50/70 border-brand-200/80 text-brand-950'
                  : 'bg-slate-100/80 border-slate-200 text-slate-700'
              }`}
            >
              <div className="space-y-0.5">
                <span className="font-semibold block">
                  {task.actionHref.startsWith('/products')
                    ? 'Explore relevant business credit options:'
                    : 'This requirement can also be verified in your business profile:'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {task.actionHref.startsWith('/products')
                    ? 'Discover reporting vendors and credit builders suited for this step.'
                    : 'Keep your information updated for accurate readiness tracking.'}
                </span>
              </div>
              <Link href={task.actionHref} onClick={onClose} className="self-end sm:self-center shrink-0">
                <Button
                  variant={task.actionHref.startsWith('/products') ? 'primary' : 'outline'}
                  size="sm"
                  className={`text-xs gap-1.5 h-8 px-3 ${
                    task.actionHref.startsWith('/products')
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-xs'
                      : 'text-brand-700 border-brand-200 hover:bg-brand-50'
                  }`}
                >
                  <span>{task.actionLabel || (task.actionHref.startsWith('/products') ? 'Explore Options' : 'Update Profile')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Educational Disclaimer */}
          <div className="text-[11px] text-slate-400 italic">
            * Crediqly provides educational information and organization guidance. It does not provide legal advice or guarantee credit approval.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-600"
          >
            Close
          </Button>

          {isLocked && !isCompleted ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                upgradeToPro();
              }}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock with Pro</span>
            </Button>
          ) : (
            <Button
              variant={isCompleted ? 'outline' : 'primary'}
              size="sm"
              onClick={() => {
                if (isCompleted && onRequestReopen) {
                  onClose();
                  onRequestReopen(task);
                } else {
                  onToggleComplete(task.key);
                  onClose();
                }
              }}
              className={`text-xs gap-1.5 ${
                isCompleted
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Mark Incomplete' : 'Mark as Complete'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
