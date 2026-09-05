'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function FundingReadinessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/readiness');
  }, [router]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              Unified Readiness Audit
            </h2>
            <p className="text-xs text-slate-500">
              Funding Readiness is now consolidated inside your Unified Readiness Audit. Forwarding you now...
            </p>
          </div>
          <Link href="/readiness">
            <Button size="sm" className="bg-brand-600 text-white text-xs gap-1.5">
              <span>Go to Readiness Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
