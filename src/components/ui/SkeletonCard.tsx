'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <Card
          key={`skeleton-${idx}`}
          className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs animate-pulse"
        >
          <CardContent className="p-5 sm:p-6 space-y-4">
            {/* Header: Category tag & Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-200 rounded-md" />
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
              <div className="h-3 w-1/3 bg-slate-100 rounded-md" />
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="space-y-1">
                <div className="h-2.5 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded font-mono" />
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-14 bg-slate-200 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-12 bg-slate-200 rounded" />
                <div className="h-4 w-14 bg-slate-200 rounded" />
              </div>
            </div>

            {/* Tags & Description line */}
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-5/6 bg-slate-100 rounded" />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};
