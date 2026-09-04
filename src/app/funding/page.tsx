'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Building2,
  CreditCard,
  Briefcase,
  ChevronRight,
  Info,
  Plus,
  Check,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { ProGate } from '@/components/subscription/ProGate';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { getFundingReadiness } from '@/lib/supabase/fundingService';
import {
  getFundingProducts,
  resolveFundingProductOutboundUrl,
  recordFundingProductClick,
} from '@/lib/supabase/fundingProductService';
import {
  getUserFundingApplications,
  createFundingApplication,
} from '@/lib/supabase/fundingApplicationService';
import { matchFundingProducts } from '@/lib/funding/fundingRecommendationEngine';
import {
  FundingProduct,
  FundingCategory,
  FundingMatchResult,
  FundingMatchLevel,
} from '@/types/fundingProduct';
import { FundingApplication } from '@/types/fundingApplication';
import { FundingReadinessResult } from '@/types/funding';

export default function FundingPage() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const { sections, settings } = usePlatformSections();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FundingProduct[]>([]);
  const [readiness, setReadiness] = useState<FundingReadinessResult | null>(null);
  const [trackedApps, setTrackedApps] = useState<FundingApplication[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [activeProducts, readinessResult, userApps] = await Promise.all([
          getFundingProducts(),
          getFundingReadiness(user.id, business),
          getUserFundingApplications(user.id),
        ]);

        if (isMounted) {
          setProducts(activeProducts);
          setReadiness(readinessResult);
          setTrackedApps(userApps);
        }
      } catch (err) {
        console.warn('Error loading funding recommendations data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, business]);

  const trackedProductIds = useMemo(() => {
    return new Set(trackedApps.map((a) => a.fundingProductId));
  }, [trackedApps]);

  const handleTrackProduct = async (product: FundingProduct) => {
    if (!user?.id) return;
    try {
      const created = await createFundingApplication(
        {
          fundingProductId: product.id,
          providerName: product.provider,
          productName: product.name,
          category: product.category,
          requestedAmount: product.minFundingAmount || 10000,
          status: 'Interested',
        },
        user.id
      );

      setTrackedApps((prev) => {
        if (prev.some((a) => a.id === created.id)) return prev;
        return [created, ...prev];
      });

      showToast(`Added "${product.name}" to your Funding Tracker`);
    } catch (err) {
      console.warn('Failed to track product:', err);
      showToast('Could not add to tracker');
    }
  };

  // Compute matched recommendations deterministically
  const matchedResults = useMemo(() => {
    return matchFundingProducts(business, readiness?.score ?? 0, products);
  }, [business, readiness?.score, products]);

  // Top recommendations (top 3 strongest matches)
  const topRecommendations = useMemo(() => {
    return matchedResults.slice(0, 3);
  }, [matchedResults]);

  // Filtered list for "Explore All Funding Options"
  const filteredAllProducts = useMemo(() => {
    return matchedResults.filter((item) => {
      const p = item.product;
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchesPurpose =
        selectedPurpose === 'all' ||
        (p.fundingPurposes &&
          p.fundingPurposes.some(
            (purpose) =>
              purpose.toLowerCase() === selectedPurpose.toLowerCase()
          ));
      return matchesCategory && matchesPurpose;
    });
  }, [matchedResults, selectedCategory, selectedPurpose]);

  const handleOutboundClick = (product: FundingProduct) => {
    recordFundingProductClick(product.id, user?.id);
    const url = resolveFundingProductOutboundUrl(product);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getMatchBadge = (level: FundingMatchLevel) => {
    switch (level) {
      case 'Strong Match':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Strong Match
          </span>
        );
      case 'Potential Match':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-800 bg-brand-100/80 px-2.5 py-0.5 rounded-full border border-brand-200">
            <Sparkles className="w-3 h-3 text-brand-600" />
            Potential Match
          </span>
        );
      case 'Explore':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Info className="w-3 h-3 text-slate-500" />
            Explore
          </span>
        );
    }
  };

  const CATEGORY_OPTIONS: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'all' },
    { label: 'Lines of Credit', value: 'Business Line of Credit' },
    { label: 'Term Loans', value: 'Term Loan' },
    { label: 'Equipment Financing', value: 'Equipment Financing' },
    { label: 'Working Capital', value: 'Working Capital' },
    { label: 'SBA Financing', value: 'SBA-related Financing' },
    { label: 'Business Credit Cards', value: 'Business Credit Card' },
  ];

  const PURPOSE_OPTIONS: { label: string; value: string }[] = [
    { label: 'All Purposes', value: 'all' },
    { label: 'Working Capital', value: 'Working Capital' },
    { label: 'Equipment', value: 'Equipment' },
    { label: 'Expansion', value: 'Expansion' },
    { label: 'Inventory', value: 'Inventory' },
    { label: 'Payroll', value: 'Payroll' },
    { label: 'Marketing', value: 'Marketing' },
  ];

  if (sections.funding === false) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <SectionInactiveNotice
            title="Funding Recommendations Temporarily Inactive"
            description="Personalized commercial funding recommendations are currently disabled by the administrator. Please return to your main dashboard."
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (loading || !readiness) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-[400px] flex items-center justify-center">
            <LoadingState message="Matching funding options for your business profile..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const isLowReadiness = readiness.score < 50;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 pb-12">
          {/* Toast feedback */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                  Exploratory Directory
                </span>
                <span className="text-xs text-slate-400">
                  Based on Your Business Profile
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Funding Options
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {settings?.messaging?.fundingGuidanceMessage ||
                  'Explore funding options that may fit your business profile.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/funding-tracker">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <FileCheck className="w-3.5 h-3.5 text-brand-600" />
                  <span>Funding Tracker ({trackedApps.length})</span>
                </Button>
              </Link>
              <Link href="/funding-readiness">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <span>Readiness Assessment</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Funding Readiness Summary Bar */}
          <Card className="border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Your Funding Readiness
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-0.5">
                      <span className="text-2xl font-black text-slate-900">
                        {readiness.score}
                        <span className="text-sm font-semibold text-slate-400">
                          {' '}
                          / 100
                        </span>
                      </span>
                      <Badge
                        variant={
                          readiness.score >= 70
                            ? 'info'
                            : readiness.score >= 50
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {readiness.level}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed hidden lg:block">
                    Options are matched against your profile parameters. Review
                    provider requirements before applying.
                  </p>
                  <Link href="/funding-readiness" className="flex-shrink-0">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <span>View Readiness</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Low readiness notice (does not block browsing) */}
              {isLowReadiness && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-xl border border-amber-100">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-snug">
                      <span className="font-bold">Recommendation:</span> Before
                      applying, consider completing the highest-priority actions
                      in your Funding Readiness roadmap to improve your baseline.
                    </p>
                  </div>
                  <Link href="/roadmap" className="flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs gap-1 whitespace-nowrap bg-amber-600 hover:bg-amber-700"
                    >
                      <span>Improve Readiness</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 1: RECOMMENDED FOR YOU (Top Strongest Matches) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Recommended for Your Business
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Based on the business information you&apos;ve provided, these options may be worth exploring.
                </p>
              </div>
            </div>

            {topRecommendations.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-8 text-center text-xs text-slate-500">
                  No active funding options available right now. Please check back soon.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {topRecommendations.map((match) => {
                  const p = match.product;
                  return (
                    <Card
                      key={p.id}
                      className="border-slate-200/90 hover:border-brand-300 transition-all flex flex-col justify-between bg-white shadow-xs overflow-hidden"
                    >
                      <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* Top Tag & Match Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {p.provider}
                            </span>
                            {getMatchBadge(match.matchLevel)}
                          </div>

                          {/* Product Title & Category */}
                          <div>
                            <h3 className="text-base font-bold text-slate-900 leading-snug">
                              {p.name}
                            </h3>
                            <span className="text-xs font-semibold text-brand-700">
                              {p.category}
                            </span>
                          </div>

                          {/* Short Description */}
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {p.description}
                          </p>

                          {/* "Why this may fit" box */}
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                              <span>Why this may fit</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {match.whyThisFits}
                            </p>
                          </div>

                          {/* Key Requirements Summary */}
                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Min. Age</span>
                              <span className="font-semibold text-slate-800">
                                {match.requirementSummary.minAge}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Min. Revenue</span>
                              <span className="font-semibold text-slate-800">
                                {match.requirementSummary.minRevenue}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Credit Score</span>
                              <span className="font-semibold text-slate-800">
                                {match.requirementSummary.minCredit}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Potential Range</span>
                              <span className="font-semibold text-slate-800">
                                {match.requirementSummary.fundingRange}
                              </span>
                            </div>
                          </div>

                          {/* Verification notes if applicable */}
                          {match.verificationNotes.length > 0 && (
                            <div className="space-y-1">
                              {match.verificationNotes.map((note, idx) => (
                                <p
                                  key={idx}
                                  className="text-[10px] text-amber-700 flex items-center gap-1"
                                >
                                  <HelpCircle className="w-3 h-3 flex-shrink-0" />
                                  <span>{note}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CTA Buttons: Explore + Track */}
                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOutboundClick(p)}
                            className="flex-1 text-xs gap-1.5 justify-center shadow-xs"
                          >
                            <span>Explore Option</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>

                          {trackedProductIds.has(p.id) ? (
                            <Link href="/funding-tracker">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 text-emerald-700 bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60 whitespace-nowrap"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tracker</span>
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTrackProduct(p)}
                              className="text-xs gap-1 text-slate-700 whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Track This</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: EXPLORE ALL FUNDING OPTIONS */}
          <div className="space-y-5 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Explore All Funding Options
                </h2>
                <p className="text-xs text-slate-500">
                  Browse all active funding programs currently available in Crediqly.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {PURPOSE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid of All Active Funding Options */}
            {filteredAllProducts.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-8 text-center text-xs text-slate-500">
                  No funding options match the selected filters. Try adjusting your category or purpose.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAllProducts.map((match) => {
                  const p = match.product;
                  return (
                    <Card
                      key={p.id}
                      className="border-slate-200/80 hover:border-slate-300 transition-colors flex flex-col justify-between bg-white shadow-xs"
                    >
                      <CardContent className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {p.provider}
                            </span>
                            {getMatchBadge(match.matchLevel)}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {p.name}
                            </h4>
                            <span className="text-xs font-semibold text-brand-700">
                              {p.category}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>

                          <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Min. Business Age:</span>
                              <span className="font-semibold text-slate-700">
                                {match.requirementSummary.minAge}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Min. Annual Revenue:</span>
                              <span className="font-semibold text-slate-700">
                                {match.requirementSummary.minRevenue}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Potential Amount:</span>
                              <span className="font-semibold text-slate-700">
                                {match.requirementSummary.fundingRange}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOutboundClick(p)}
                            className="flex-1 text-xs gap-1.5 justify-center"
                          >
                            <span>Learn More</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>

                          {trackedProductIds.has(p.id) ? (
                            <Link href="/funding-tracker">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 text-emerald-700 bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60 whitespace-nowrap"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tracker</span>
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTrackProduct(p)}
                              className="text-xs gap-1 text-slate-700 whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Track This</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* PRO GATED: INSTITUTIONAL LENDER UNDERWRITING MATRIX */}
          <ProGate
            featureName="Lender Underwriting Matrix & Capital Preparation Engine"
            description="Access our proprietary lender approval criteria database, bank underwriting ratios, and institutional capital readiness checklists with Crediqly Pro."
          >
            <Card className="border-brand-200 bg-white shadow-xs overflow-hidden">
              <div className="bg-brand-50/60 p-4 sm:p-5 border-b border-brand-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Lender Underwriting Matrix & Capital Preparation Engine
                    </h3>
                    <p className="text-xs text-slate-500">
                      Institutional underwriting benchmarks for Tier 1 & Tier 2 commercial lenders
                    </p>
                  </div>
                </div>
                <Badge variant="info">Pro Unlocked</Badge>
              </div>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <span className="font-bold text-slate-900 block">DSCR & Cash Flow Benchmarks</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Most commercial term lenders require a minimum 1.25x Debt Service Coverage Ratio and at least 3 consecutive months of operating deposits above $10,000.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <span className="font-bold text-slate-900 block">Bank Rating & Balance Volatility</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Aim to maintain an average daily bank ledger balance above $10,000 to earn a High 4 or Low 5 internal bank rating before submitting commercial applications.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <span className="font-bold text-slate-900 block">Tradeline Diversity Weighting</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      SBA and institutional lenders look for at least 5 reporting commercial tradelines with minimum credit limits of $2,500+ reporting positive on-time payment history.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ProGate>

          {/* STEP 12: FUNDING CONSULTATION ASSISTANCE BANNER */}
          <Card className="border-brand-200 bg-brand-50/50 shadow-xs">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Want help choosing your funding strategy?
                  </h4>
                  <p className="text-xs text-slate-600">
                    Get 1-on-1 personalized guidance on comparing commercial capital options and lender timing.
                  </p>
                </div>
              </div>
              <Link href="/consultation" className="flex-shrink-0">
                <Button size="sm" variant="primary" className="text-xs gap-1.5 whitespace-nowrap">
                  <span>Request a Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* COMPLIANCE & AFFILIATE DISCLOSURE */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-2 leading-relaxed">
            <p>
              <span className="font-semibold text-slate-700">Exploratory Assessment Disclosure: </span>
              Match indicators (Strong Match, Potential Match, Explore) are internal Crediqly evaluations based on the business information you have provided and administrator-defined provider criteria. Match designations do not represent pre-approval, loan offers, qualification guarantees, or lender underwriting decisions. Actual requirements and approval terms are established solely by individual providers.
            </p>
            <p>
              <span className="font-semibold text-slate-700">Partner & Affiliate Disclosure: </span>
              Crediqly is an independent educational and readiness platform. Some links on this page are partner or affiliate referral links, meaning Crediqly may receive compensation if you click through or choose to work with a partner, at no additional cost to you. We do not originate loans or broker credit agreements.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
