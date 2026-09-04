import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  ArrowRight,
  ShieldCheck,
  Building,
  GitBranch,
  TrendingUp,
  Headphones,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/40 via-white to-slate-50 pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Safe & Simple Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold mb-6 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero Sensitive Data Required • No SSN • No Bank Logins</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Build Business Credit.{' '}
              <span className="text-brand-600">Become Funding Ready.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Crediqly gives you a personalized step-by-step roadmap to build your business credit and prepare for potential funding opportunities.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto px-8 gap-2 shadow-md">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-7">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Core Purpose Statement */}
            <div className="mt-12 p-4 max-w-xl mx-auto rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center gap-2 text-sm font-medium text-slate-700">
              <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>Core Purpose: <strong>&ldquo;Tell the business owner what they should do next.&rdquo;</strong></span>
            </div>
          </div>
        </section>

        {/* Value Pillars Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                Clear & Structured Process
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                How Crediqly Works For You
              </h3>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                We remove the guesswork from business credit. Follow an orderly, milestone-based journey designed specifically for U.S. small business owners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pillar 1 */}
              <Card className="hover:border-brand-300 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                    <Building className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    1. Establish Foundation
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Verify key foundational elements like business entity structure, commercial phone, professional email, and banking.
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 2 */}
              <Card className="hover:border-brand-300 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <GitBranch className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    2. Build Credit Profile
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Learn how tier-1 vendor accounts, net-30 terms, and reporting credit lines establish your company&apos;s independent credit file.
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 3 */}
              <Card className="hover:border-brand-300 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    3. Assess Readiness
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Evaluate operational metrics and age milestones to understand what lenders look for before submitting applications.
                  </p>
                </CardContent>
              </Card>

              {/* Pillar 4 */}
              <Card className="hover:border-brand-300 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    4. Specialist Guidance
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Book an individual session with a business-credit advisor for personalized guidance and roadmap alignment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Privacy First Banner */}
        <section id="foundation" className="py-12 bg-slate-50 border-t border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-lg font-bold text-slate-900">
                  Our Privacy-First Commitment
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Crediqly does NOT request or store your SSN, banking passwords, personal tax returns, or driver&apos;s license. We assess your readiness through simple, high-level indicators so your sensitive credentials remain strictly yours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section id="readiness" className="py-16 md:py-20 bg-navy-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to take control of your business credit?
            </h3>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Create your free account today, complete your basic business profile in minutes, and get your next best action.
            </p>
            <div className="pt-2 flex justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8 shadow-lg bg-brand-500 hover:bg-brand-600 text-white font-bold">
                  Start Your Roadmap
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
