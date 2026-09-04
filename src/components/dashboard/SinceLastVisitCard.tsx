'use client';

import React from 'react';
import { SinceLastVisitSummary } from '@/types/progress';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle2, Sparkles, Clock, Check } from 'lucide-react';

interface SinceLastVisitCardProps {
  summary: SinceLastVisitSummary | null;
  loading?: boolean;
}

export const SinceLastVisitCard: React.FC<SinceLastVisitCardProps> = ({
  summary,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
    );
  }

  const hasChanges = Boolean(summary && summary.hasChanges && summary.items.length > 0);

  return (
    <Card className="border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 shadow-xs">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Since Your Last Visit
              </span>
              <h4 className="text-xs font-bold text-slate-800">
                {hasChanges ? 'Recent updates to your account' : "You're all caught up."}
              </h4>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasChanges ? (
              summary!.items.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-full"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{item}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 font-medium">
                No new changes since your last session.
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
