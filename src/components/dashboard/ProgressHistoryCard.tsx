'use client';

import React from 'react';
import { ProgressHistoryItem } from '@/types/progress';
import { Card, CardContent } from '@/components/ui/Card';
import { History, TrendingUp, ShieldCheck, Info } from 'lucide-react';

interface ProgressHistoryCardProps {
  history: ProgressHistoryItem[];
  currentBusinessReadiness: number;
  currentCreditReadiness: number;
  loading?: boolean;
}

function formatDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export const ProgressHistoryCard: React.FC<ProgressHistoryCardProps> = ({
  history,
  currentBusinessReadiness,
  currentCreditReadiness,
  loading = false,
}) => {
  const previousRecord = history.length > 1 ? history[1] : null;

  return (
    <Card className="border-slate-200/80 bg-white shadow-xs">
      <CardContent className="p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Progress & Readiness History
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Historical milestones and readiness changes
          </span>
        </div>

        {/* Historical Readiness Comparison (Prompt 17) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Crediqly Business Readiness
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">
                Today: {currentBusinessReadiness}%
              </span>
              {previousRecord && (
                <span className="text-xs font-semibold text-slate-500">
                  Last update: {previousRecord.businessReadinessScore}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Internal readiness metric based on business profile
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Crediqly Credit Readiness
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">
                Today: {currentCreditReadiness}%
              </span>
              {previousRecord && (
                <span className="text-xs font-semibold text-slate-500">
                  Last update: {previousRecord.creditReadinessScore}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Internal trade line & vendor readiness evaluation
            </span>
          </div>
        </div>

        {/* Progress History List (Prompt 16) */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recorded Milestones Over Time
          </h4>

          {loading ? (
            <div className="space-y-2 py-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-8 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              Your progress history will appear here as you complete roadmap steps.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/70 rounded-xl overflow-hidden">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white hover:bg-slate-50/60 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-14 font-bold text-slate-700">
                      {formatDate(item.recordedAt)}
                    </span>
                    <span className="text-slate-500 font-medium">
                      Roadmap Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {item.roadmapProgress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Educational Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Crediqly Readiness metrics are internal educational indicators and do NOT represent official bureau credit scores.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
