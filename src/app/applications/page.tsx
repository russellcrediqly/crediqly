'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ApplicationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/funding-tracker');
  }, [router]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Funding Application Tracker
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Redirecting to your funding tracker...
            </p>
          </div>

          <EmptyState
            icon={FileCheck}
            title="Funding Tracker"
            description="Track your commercial funding opportunities, status updates, and next action steps."
            action={
              <Link href="/funding-tracker">
                <Button className="flex items-center gap-2">
                  <span>Go to Funding Tracker</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            }
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
