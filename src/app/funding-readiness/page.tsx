'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  History,
  Coins,
  Compass,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { getFundingReadiness, getFundingReadinessHistory } from '@/lib/supabase/fundingService';
import { FundingReadinessResult, FundingHistoryEntry, FundingReadinessLevel } from '@/types/funding';

export default function FundingReadinessPage() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const { sections } = usePlatformSections();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [readinessResult, setReadinessResult] = useState<FundingReadinessResult | null>(null);
  const [history, setHistory] = useState<FundingHistoryEntry[]>([]);

  const isProfileComplete = Boolean(business && business.profileCompleted);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [result, hist] = await Promise.all([
          getFundingReadiness(user.id, business),
          getFundingReadinessHistory(user.id, 5),
        ]);

        if (isMounted) {
          setReadinessResult(result);
          setHistory(hist);
        }
      } catch (err) {
        console.warn('Error loading funding readiness data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, business]);

  const getLevelBadge = (level: FundingReadinessLevel) => {
    switch (level) {
      case 'Strong Readiness':
        return <Badge variant="success">Strong Readiness</Badge>;
      case 'Funding Ready':
        return <Badge variant="info">Funding Ready</Badge>;
      case 'Developing':
        return <Badge variant="warning">Developing</Badge>;
      case 'Building Readiness':
        return <Badge variant="warning">Building Readiness</Badge>;
      case 'Getting Started':
      default:
        return <Badge variant="neutral">Getting Started</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'foundation':
        return <Building2 className="w-4 h-4 text-brand-600" />;
      case 'credit':
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
      case 'financial':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'profile':
      default:
        return <FileText className="w-4 h-4 text-teal-600" />;
    }
  };

  if (sections.funding_readiness === false) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <SectionInactiveNotice
            title="Funding Readiness Assessment Temporarily Inactive"
            description="The funding readiness assessment is currently disabled by the administrator. Please return to your main dashboard."
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (loading || !readinessResult) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingState message="Calculating Funding Readiness..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const {
    score,
    level,
    description,
    categories,
    positiveFactors,
    improvementFactors,
    nextBestAction,
    prioritizedActions,
  } = readinessResult;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                  Internal Assessment
                </span>
                <span className="text-xs text-slate-400">Zero Bureau Inquiries</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Funding Readiness
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                See how prepared your business is before pursuing funding.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link href="/roadmap">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <span>View Roadmap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Incomplete Profile Alert (if applicable) */}
          {!isProfileComplete && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                      Incomplete Business Profile
                    </h4>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      Complete your profile to improve the accuracy of your Funding Readiness assessment and unlock tailored recommendations.
                    </p>
                  </div>
                </div>
                <Link href="/onboarding" className="flex-shrink-0">
                  <Button variant="primary" size="sm" className="text-xs gap-1 whitespace-nowrap">
                    <span>Complete Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Main Score & Readiness Hero Card */}
          <Card className="border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Funding Preparedness Level
                  </span>
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                      {score}
                      <span className="text-2xl sm:text-3xl font-bold text-slate-400"> / 100</span>
                    </span>
                    <div>{getLevelBadge(level)}</div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    {description}
                  </p>
                </div>

                <div className="flex flex-col justify-center items-start md:items-end gap-2 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 min-w-[220px]">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Assessment Status
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Calculated from Profile Data</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    No soft or hard credit pulls
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <ProgressBar
                  value={score}
                  color={score >= 70 ? 'brand' : score >= 50 ? 'emerald' : 'amber'}
                  showPercentage={false}
                  className="h-3 rounded-full"
                />
              </div>

              {/* Statutory Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Notice: </span>
                Funding Readiness is an internal Crediqly assessment based on the information you provide. It is not a lender decision, credit score, pre-approval, or guarantee of funding. Actual requirements and decisions vary by provider.
              </div>
            </div>
          </Card>

          {/* READINESS CATEGORY BREAKDOWN (4 Categories) */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Readiness Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Evaluation across the four pillars commercial lenders inspect.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Business Foundation */}
              <Card className="border-slate-200/80 hover:border-brand-200 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Foundation</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      {categories.foundation.score} / {categories.foundation.maxScore}
                    </span>
                  </div>
                  <ProgressBar
                    value={categories.foundation.percentage}
                    color="brand"
                    showPercentage={false}
                    className="h-2"
                  />
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Entity structure, active EIN, dedicated bank account, and commercial address.
                  </p>
                </CardContent>
              </Card>

              {/* 2. Business Credit */}
              <Card className="border-slate-200/80 hover:border-brand-200 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Business Credit</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      {categories.businessCredit.score} / {categories.businessCredit.maxScore}
                    </span>
                  </div>
                  <ProgressBar
                    value={categories.businessCredit.percentage}
                    color="brand"
                    showPercentage={false}
                    className="h-2"
                  />
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Bureau files, trade accounts count, reporting lines, and business credit cards.
                  </p>
                </CardContent>
              </Card>

              {/* 3. Financial Readiness */}
              <Card className="border-slate-200/80 hover:border-brand-200 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Financial Readiness</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      {categories.financialReadiness.score} / {categories.financialReadiness.maxScore}
                    </span>
                  </div>
                  <ProgressBar
                    value={categories.financialReadiness.percentage}
                    color="emerald"
                    showPercentage={false}
                    className="h-2"
                  />
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Business operating longevity, verified commercial banking, and annual revenue range.
                  </p>
                </CardContent>
              </Card>

              {/* 4. Credit & Funding Profile */}
              <Card className="border-slate-200/80 hover:border-brand-200 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Funding Profile</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      {categories.fundingProfile.score} / {categories.fundingProfile.maxScore}
                    </span>
                  </div>
                  <ProgressBar
                    value={categories.fundingProfile.percentage}
                    color="emerald"
                    showPercentage={false}
                    className="h-2"
                  />
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Personal credit range tier, prior funding track record, and articulated target goals.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* YOUR NEXT BEST ACTION HERO CARD */}
          <Card className="border-brand-200 bg-gradient-to-r from-brand-50/70 via-white to-teal-50/40 shadow-xs">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-900 bg-brand-100/80 px-2.5 py-0.5 rounded-full">
                        Your Next Best Action
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        Highest Leverage
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {nextBestAction.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                      {nextBestAction.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Link href={nextBestAction.actionHref}>
                    <Button variant="primary" size="md" className="gap-2 whitespace-nowrap shadow-sm">
                      <span>{nextBestAction.actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TWO COLUMN GRID: WHAT'S HELPING vs WHAT'S HOLDING BACK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. WHAT'S HELPING YOUR READINESS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  What&apos;s helping your readiness
                </h3>
              </div>

              {positiveFactors.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="p-6 text-center text-xs text-slate-500">
                    No positive markers verified yet. Complete your foundational questionnaire to highlight strengths.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2.5">
                  {positiveFactors.map((f) => (
                    <Card key={f.id} className="border-slate-200/90 bg-white">
                      <CardContent className="p-3.5 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {f.title}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* 2. WHAT'S HOLDING YOU BACK */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  What could improve your readiness
                </h3>
              </div>

              {improvementFactors.length === 0 ? (
                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardContent className="p-6 text-center text-xs text-emerald-800 font-medium">
                    Excellent work! Your business profile has satisfied all major foundation, credit, and financial milestones.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2.5">
                  {improvementFactors.map((f) => (
                    <Card key={f.id} className="border-slate-200/90 bg-white">
                      <CardContent className="p-3.5 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {f.isVerificationNeeded ? (
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              {f.title}
                            </p>
                            {f.isVerificationNeeded && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                                Verification Needed
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS TO IMPROVE FUNDING READINESS (Prioritized List) */}
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Actions to Improve Funding Readiness
              </h3>
              <p className="text-xs text-slate-500">
                Ranked sequence of steps tailored to your current gaps.
              </p>
            </div>

            <div className="space-y-3">
              {prioritizedActions.map((action, idx) => (
                <Card key={action.id} className="border-slate-200/90 bg-white hover:border-brand-200 transition-colors">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {action.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                            {action.explanation}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 sm:self-center">
                        <Link href={action.actionHref}>
                          <Button variant="outline" size="sm" className="text-xs gap-1 whitespace-nowrap">
                            <span>{action.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* SCORE HISTORY & SUBTLE CREDIT PRODUCTS CTA (2 Cards Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Score History (1 col) */}
            <Card className="border-slate-200/90 bg-white">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Funding Readiness History
                  </h4>
                </div>

                {history.length <= 1 ? (
                  <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-medium text-slate-600">Initial Snapshot Recorded</p>
                    <p className="text-[11px] leading-relaxed">
                      Your Funding Readiness history will appear here as your profile and progress change over time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((h, i) => (
                      <div
                        key={h.id || i}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                      >
                        <span className="font-semibold text-slate-600">
                          {i === 0 ? 'Today' : i === 1 ? 'Previous' : 'Earlier'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{h.score} / 100</span>
                          <span className="text-[10px] text-slate-400">({h.level})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subtle Credit Products CTA (2 cols) */}
            <Card className="lg:col-span-2 border-brand-200/80 bg-gradient-to-r from-brand-50/50 via-white to-indigo-50/40">
              <CardContent className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800">
                      Credit Building Marketplace
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Ready to build commercial trade lines?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Once your business foundation is established, explore business credit products that report to Dun & Bradstreet, Experian, and Equifax to improve your funding readiness score.
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <Link href="/products">
                    <Button variant="primary" size="md" className="gap-2 shadow-sm whitespace-nowrap">
                      <span>Explore Credit Products</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
