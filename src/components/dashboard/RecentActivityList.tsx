'use client';

import React from 'react';
import Link from 'next/link';
import { ActivityLogItem } from '@/types/progress';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  RotateCcw,
  Building,
  ShieldCheck,
  Award,
  ArrowRight,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface RecentActivityListProps {
  activities: ActivityLogItem[];
  loading?: boolean;
  error?: string | null;
}

function formatRelativeDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  // Strip hours for calendar day comparison
  const dDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowDay.getTime() - dDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  loading = false,
  error = null,
}) => {
  return (
    <Card className="border-slate-200/80 bg-white shadow-xs">
      <CardContent className="p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Activity
            </h3>
          </div>
          <span className="text-xs text-slate-400">Latest meaningful actions</span>
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Activity is temporarily unavailable.</span>
          </div>
        ) : loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          /* Empty State per Spec (Prompt 25) */
          <div className="text-center py-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Your Activity</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven&apos;t completed any roadmap actions yet. Start by taking your next best action.
              </p>
            </div>
            <div>
              <Link href="/roadmap">
                <Button variant="outline" size="sm" className="gap-1.5 shadow-xs">
                  <span>View Your Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((act) => {
              let Icon = CheckCircle2;
              let iconColor = 'text-emerald-600 bg-emerald-50';

              if (act.activityType === 'task_reopened') {
                Icon = RotateCcw;
                iconColor = 'text-amber-600 bg-amber-50';
              } else if (act.activityType === 'profile_updated') {
                Icon = Building;
                iconColor = 'text-brand-600 bg-brand-50';
              } else if (act.activityType === 'readiness_updated') {
                Icon = ShieldCheck;
                iconColor = 'text-indigo-600 bg-indigo-50';
              } else if (act.activityType === 'milestone_completed') {
                Icon = Award;
                iconColor = 'text-purple-600 bg-purple-50';
              }

              return (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-200/60 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {act.title}
                      </p>
                      {act.description && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap flex-shrink-0 pt-0.5">
                    {formatRelativeDate(act.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
