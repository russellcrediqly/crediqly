'use client';

import React from 'react';
import Link from 'next/link';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';
import { Button } from '@/components/ui/Button';
import {
  Compass,
  LayoutDashboard,
  DollarSign,
  ShieldCheck,
  Home,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Navbar Brand */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <Link href="/" className="inline-block">
          <CrediqlyLogo size="md" subtitle="Business Credit & Funding" />
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Platform</span>
        </div>
      </header>

      {/* Main 404 Card */}
      <main className="max-w-xl w-full mx-auto my-auto py-12 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
            <Compass className="w-8 h-8 text-brand-600" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60">
              404 • Page Not Found
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              We couldn't find that page
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              The link you clicked may be outdated, the page may have been relocated, or the URL might have a typo.
            </p>
          </div>

          {/* Quick Recovery Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto gap-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-xs px-5 py-2.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Command Center</span>
              </Button>
            </Link>

            <Link href="/funding" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto gap-2 text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-50 px-5 py-2.5 shadow-2xs"
              >
                <DollarSign className="w-4 h-4" />
                <span>Funding Marketplace</span>
              </Button>
            </Link>
          </div>

          {/* Secondary Links */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-800 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-slate-800 font-medium">
              Pricing Plans
            </Link>
            <span>•</span>
            <Link href="/consultation" className="hover:text-slate-800 font-medium">
              Need Help?
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-[11px] text-slate-400">
        © {new Date().getFullYear()} Crediqly. All rights reserved. Zero sensitive data architecture.
      </footer>
    </div>
  );
}
