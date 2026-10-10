'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Lock,
  HelpCircle,
  ListOrdered,
  AlertOctagon,
  TrendingUp,
  MessageSquare,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MilestoneEducation } from '@/lib/roadmap/milestoneEducation';
import { useSubscription } from '@/context/SubscriptionContext';

interface MilestoneEducationModalProps {
  milestone: MilestoneEducation | null;
  isOpen: boolean;
  isCompleted: boolean;
  isBlockedByPrereq?: boolean;
  onClose: () => void;
  onToggleComplete: (idOrKey: string) => void;
  onAskAI?: (prompt: string, milestoneTitle: string) => void;
}

export const MilestoneEducationModal: React.FC<MilestoneEducationModalProps> = ({
  milestone,
  isOpen,
  isCompleted,
  isBlockedByPrereq = false,
  onClose,
  onToggleComplete,
  onAskAI,
}) => {
  const { isFoundation, isPro, upgradeToFoundation, upgradeToPro } = useSubscription();
  const hasFoundation = isFoundation || isPro;
  const handleUpgrade = upgradeToFoundation || upgradeToPro;
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  if (!isOpen || !milestone) return null;

  const isLocked = !hasFoundation && milestone.stageId > 1;

  const handleAskAIClick = async () => {
    if (onAskAI) {
      onAskAI(milestone.askAiPrompt, milestone.title);
      onClose();
      return;
    }

    try {
      setAiLoading(true);
      setAiAnswer(null);
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: milestone.askAiPrompt,
          context: {
            businessName: 'Your Business',
            journeyStage: milestone.stageName,
            activeMilestone: milestone.title,
          },
        }),
      });
      const data = await res.json();
      setAiAnswer(data.answer || 'Consult your Crediqly roadmap tasks for recommended steps.');
    } catch (err) {
      setAiAnswer('AI Advisor is currently unavailable. Please check your action steps below.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-100/80 px-2.5 py-0.5 rounded-full border border-brand-200">
                Stage {milestone.stageId} • {milestone.stageName}
              </span>

              {/* Verification Type Badge */}
              {milestone.completionType === 'system_verified' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>System verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Customer confirmed</span>
                </span>
              )}

              {/* Status Badge */}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Milestone Completed</span>
                </span>
              ) : isBlockedByPrereq ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Prerequisite Required</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>In Progress</span>
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {milestone.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>Effort: <strong className="text-slate-800">{milestone.estimatedEffort}</strong></span>
              <span>•</span>
              <span>Impact: <strong className="text-slate-800">{milestone.potentialImpact}</strong></span>
              <span>•</span>
              <span>Readiness Weight: <strong className="text-brand-700">+{milestone.weight} pts</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Prerequisite Alert if blocked */}
          {isBlockedByPrereq && milestone.prerequisiteTitle && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-xs text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-rose-950">
                  Prerequisite Step Required: {milestone.prerequisiteTitle}
                </strong>
                <p className="mt-0.5 text-rose-800 leading-relaxed">
                  To prevent confusing underwriting declines and ensure proper reporting sequence, complete {milestone.prerequisiteTitle} before starting this milestone.
                </p>
              </div>
            </div>
          )}

          {/* Verification Transparency Callout */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">
                Verification Transparency
              </span>
              <p className="mt-0.5 leading-relaxed">
                {milestone.verificationExplanation}
              </p>
            </div>
          </div>

          {/* Foundation Milestone Lock Notice */}
          {isLocked && (
            <div className="p-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-brand-50/40 space-y-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Foundation Guided Milestone
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upgrade to Crediqly Foundation ($47.99/mo) to unlock complete step-by-step reporting vendor guides, store cards, and revolving lines.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  handleUpgrade();
                }}
                className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white gap-1"
              >
                <span>Upgrade to Foundation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* 1. What It Is */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              1. What It Is
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {milestone.whatItIs}
            </p>
          </div>

          {/* 2. Why It Matters */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              2. Why It Matters
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-brand-50/40 p-3.5 rounded-xl border border-brand-100">
              {milestone.whyItMatters}
            </p>
          </div>

          {/* 3. What To Do */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-brand-600" />
              <span>3. What To Do</span>
            </h4>
            <div className="space-y-2">
              {milestone.whatToDo.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/60"
                >
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-black flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. What To Avoid */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>4. What To Avoid</span>
            </h4>
            <div className="space-y-2">
              {milestone.whatToAvoid.map((avoid, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-rose-950 leading-relaxed bg-rose-50/50 p-2.5 rounded-lg border border-rose-200/60"
                >
                  <span className="text-rose-600 font-bold shrink-0 mt-0.5">✕</span>
                  <span>{avoid}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. When To Move Forward */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>5. When To Move Forward</span>
            </h4>
            <p className="text-xs text-emerald-950 leading-relaxed bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
              {milestone.whenToMoveForward}
            </p>
          </div>

          {/* Ask AI About This Step */}
          <div className="p-4 rounded-xl border border-brand-200 bg-gradient-to-r from-indigo-50/50 via-white to-brand-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900">
                    Ask Crediqly AI About This Step
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    Get instant guidance tailored to this exact milestone.
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAskAIClick}
                disabled={aiLoading}
                className="text-xs border-brand-300 text-brand-800 hover:bg-brand-50 font-bold gap-1.5 shrink-0"
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                )}
                <span>Ask AI</span>
              </Button>
            </div>

            <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-brand-100">
              &ldquo;{milestone.askAiPrompt}&rdquo;
            </p>

            {aiAnswer && (
              <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 text-xs text-slate-800 leading-relaxed animate-in fade-in">
                <strong className="text-brand-900 font-bold block mb-1">
                  AI Advisor Response:
                </strong>
                {aiAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-600"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {milestone.actionHref && (
              <Link href={milestone.actionHref} onClick={onClose}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold border-brand-200 text-brand-800 hover:bg-brand-50 gap-1"
                >
                  <span>{milestone.actionLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            )}

            <Button
              variant={isCompleted ? 'outline' : 'primary'}
              size="sm"
              onClick={() => {
                onToggleComplete(milestone.roadmapTaskKey || milestone.id);
                onClose();
              }}
              className={`text-xs gap-1.5 font-bold ${
                isCompleted
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isCompleted
                  ? 'Mark Incomplete'
                  : milestone.completionType === 'customer_confirmation'
                  ? 'Confirm Complete'
                  : 'Mark as Complete'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
