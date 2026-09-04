'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

interface SectionInactiveNoticeProps {
  title?: string;
  description?: string;
}

export const SectionInactiveNotice: React.FC<SectionInactiveNoticeProps> = ({
  title = 'Section Currently Unavailable',
  description = 'This platform section is temporarily inactive or undergoing scheduled updates by the administrator. Please return to your main dashboard or check back soon.',
}) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 font-sans">
      <Card className="border-slate-200 bg-white shadow-sm text-center">
        <CardContent className="p-8 sm:p-10 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="md" className="gap-2 shadow-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
