import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy-First Architecture</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Crediqly Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Last updated: September 2026 • Effective immediately
            </p>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6 text-sm text-slate-600 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    What We NEVER Ask For
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Crediqly will never request or store your Social Security Number (SSN), full banking credentials, credit card numbers, tax filings, or government identity documents.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
                <p>
                  We collect information you directly provide when registering an account and completing your business readiness profile:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                  <li>Account details (Name, business email address, login password).</li>
                  <li>Business details (Company name, legal structure, state of registration, industry, business age).</li>
                  <li>Readiness status indicators (Yes/No answers regarding whether your business holds an EIN, commercial bank account, website, phone, email, and address).</li>
                  <li>High-level funding targets and revenue estimates.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">2. How We Use Your Information</h3>
                <p>
                  Your information is utilized solely to provide, personalize, and improve your Crediqly roadmap:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                  <li>Generating step-by-step guidance on establishing business credit foundations.</li>
                  <li>Assessing funding readiness milestones.</li>
                  <li>Facilitating scheduled consultations with business-credit specialists.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">3. Data Security</h3>
                <p>
                  We protect your account data with enterprise-grade encryption and secure authentication powered by Supabase. We do not sell your personal or business data to third-party telemarketers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">4. Contact Us</h3>
                <p>
                  If you have any questions or requests regarding your data privacy, please contact our privacy desk at support@crediqly.com.
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
