import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Last updated: September 2026 • Crediqly Platform Terms
            </p>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6 text-sm text-slate-600 leading-relaxed">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using Crediqly, you agree to be bound by these Terms of Service. If you disagree with any portion, please discontinue using the platform.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">2. Educational & Informational Purpose</h3>
                <p>
                  Crediqly provides business credit educational materials, readiness checklists, and milestone-tracking software. Crediqly is NOT a credit reporting agency, bank, or direct lender.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">3. No Guaranteed Outcomes</h3>
                <p>
                  Crediqly does NOT guarantee funding approval, specific credit scores, or credit limit increases. Lenders and commercial credit bureaus make independent determinations based on their proprietary underwriting standards.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">4. User Account Responsibilities</h3>
                <p>
                  You are responsible for safeguarding your account credentials and ensuring the information you enter accurately reflects your business operations.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
