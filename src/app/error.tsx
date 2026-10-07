'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  ShieldCheck,
  Mail,
} from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime client exceptions to console for telemetry
    console.error('Unhandled Crediqly runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Navbar Brand */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <Link href="/" className="inline-block">
          <CrediqlyLogo size="md" subtitle="Business Credit & Funding" />
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Session Protected</span>
        </div>
      </header>

      {/* Main Error Recovery Card */}
      <main className="max-w-xl w-full mx-auto my-auto py-12 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
              System Recovery
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              Something went temporarily wrong
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              We encountered an unexpected issue while rendering this page. Your data and progress remain completely safe in your account.
            </p>
          </div>

          {/* Recovery Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => reset()}
              className="w-full sm:w-auto gap-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-xs px-5 py-2.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto gap-2 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-50 px-5 py-2.5 shadow-2xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>

          {/* Support Link */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Need assistance? Reach our team at support@crediqly.com</span>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-[11px] text-slate-400">
        © {new Date().getFullYear()} Crediqly. All rights reserved. Error Code: {error.digest || 'RUNTIME_EXCEPTION'}
      </footer>
    </div>
  );
}
