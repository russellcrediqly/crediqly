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
  Gift,
  Search,
  SlidersHorizontal,
  Bookmark,
  RotateCcw,
  Lock,
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
import { useSubscription } from '@/context/SubscriptionContext';
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
import { FundingOpportunityCard } from '@/components/funding/FundingOpportunityCard';
import { FundingDetailsModal } from '@/components/funding/FundingDetailsModal';
import { PreQualificationModal, PrequalCriteria } from '@/components/funding/PreQualificationModal';

export default function FundingPage() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const { isPro, upgradeToPro, upgradeToAdvisory } = useSubscription();
  const { sections, settings } = usePlatformSections();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FundingProduct[]>([]);
  const [readiness, setReadiness] = useState<FundingReadinessResult | null>(null);
  const [trackedApps, setTrackedApps] = useState<FundingApplication[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View state & filters
  const [activeTab, setActiveTab] = useState<'marketplace' | 'top_matches' | 'grants' | 'tracked'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAmount, setSelectedAmount] = useState<string>('all');
  const [selectedRepayment, setSelectedRepayment] = useState<string>('all');
  const [selectedMatchLevel, setSelectedMatchLevel] = useState<string>('all');

  // Modal states
  const [selectedModalMatch, setSelectedModalMatch] = useState<FundingMatchResult | null>(null);
  const [isPrequalOpen, setIsPrequalOpen] = useState(false);
  const [activePrequalCriteria, setActivePrequalCriteria] = useState<PrequalCriteria | null>(null);

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
        console.warn('Error loading funding marketplace data:', err);
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

  const handleOutboundClick = (product: FundingProduct) => {
    recordFundingProductClick(product.id, user?.id);
    const url = resolveFundingProductOutboundUrl(product);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Construct effective profile (combining base business profile with pre-qual simulator inputs if active)
  const effectiveProfile = useMemo(() => {
    if (!activePrequalCriteria) return business;
    return {
      ...(business || {}),
      fundingAmount: activePrequalCriteria.fundingAmount,
      annualRevenueRange: activePrequalCriteria.annualRevenue,
      businessAge: activePrequalCriteria.businessAge,
      industry: activePrequalCriteria.industry,
      personalCreditRange: activePrequalCriteria.creditProfile,
      fundingPurpose: [activePrequalCriteria.fundingPurpose],
    };
  }, [business, activePrequalCriteria]);

  // Compute matched recommendations deterministically
  const matchedResults = useMemo(() => {
    return matchFundingProducts(effectiveProfile, readiness?.score ?? 0, products);
  }, [effectiveProfile, readiness?.score, products]);

  // Top 3 Strongest matches
  const topMatches = useMemo(() => {
    return matchedResults.slice(0, 3);
  }, [matchedResults]);

  // Grants only
  const grantMatches = useMemo(() => {
    return matchedResults.filter((m) => m.product.category === 'Grant');
  }, [matchedResults]);

  // Filtered Marketplace opportunities
  const filteredMarketplaceResults = useMemo(() => {
    return matchedResults.filter((match) => {
      const p = match.product;

      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          p.name.toLowerCase().includes(q) ||
          p.provider.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // 3. Repayment Filter
      if (selectedRepayment !== 'all') {
        if (p.repaymentType !== selectedRepayment) return false;
      }

      // 4. Match Level Filter
      if (selectedMatchLevel !== 'all') {
        if (match.matchLevel !== selectedMatchLevel) return false;
      }

      // 5. Funding Amount Filter
      if (selectedAmount !== 'all') {
        const min = p.minFundingAmount || 0;
        const max = p.maxFundingAmount || 10000000;
        switch (selectedAmount) {
          case 'under_10k':
            if (min > 10000) return false;
            break;
          case '10k_25k':
            if (max < 10000 || min > 25000) return false;
            break;
          case '25k_50k':
            if (max < 25000 || min > 50000) return false;
            break;
          case '50k_100k':
            if (max < 50000 || min > 100000) return false;
            break;
          case '100k_plus':
            if (max < 100000) return false;
            break;
        }
      }

      return true;
    });
  }, [matchedResults, searchQuery, selectedCategory, selectedRepayment, selectedMatchLevel, selectedAmount]);

  if (sections.funding === false) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <SectionInactiveNotice
            title="Funding Marketplace Temporarily Inactive"
            description="The funding marketplace is currently disabled by the administrator. Please return to your main dashboard."
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
            <LoadingState message="Matching funding marketplace opportunities for your business profile..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const score = readiness.score;
  const is100 = score >= 100;
  const isHigh = score >= 70;
  const isMedium = score >= 40 && score < 70;
  const isEarly = score < 40;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 pb-12">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. HERO HEADER: STAGE-AWARE FUNDING MARKETPLACE                   */}
          {/* ================================================================= */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900 text-white shadow-md border border-slate-800 relative overflow-hidden space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CURATED COMMERCIAL MARKETPLACE</span>
                  </span>

                  {is100 ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-950/70 border border-teal-500/30 px-2.5 py-1 rounded-full">
                      🎯 100/100 JOURNEY COMPLETED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                      Readiness Score: {score} / 100
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Crediqly Funding Marketplace
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {is100
                    ? "Congratulations! You've completed the core Crediqly readiness journey. Based on your institutional foundation, here are top matching commercial options to explore."
                    : isHigh
                    ? 'High Readiness Profile: Multiple commercial lines of credit, revenue-based financing, and term loan options are becoming relevant for your business.'
                    : isMedium
                    ? 'Developing Readiness: Foundational lines and vendor tradelines are accessible as you progress through revolving credit seasoning.'
                    : 'Building Foundation: Explore early accessible capital and non-dilutive grants while building your credit profile towards institutional loans.'}
                </p>
              </div>

              {/* Header Controls: Pre-Qual & Tracker */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (isPro) {
                      setIsPrequalOpen(true);
                    } else {
                      upgradeToPro();
                    }
                  }}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs gap-2 shadow-xs py-3"
                >
                  <Sparkles className="w-4 h-4 text-brand-200" />
                  <span>{activePrequalCriteria ? 'Edit Pre-Qualification' : '⚡ Check My Options (Zero Impact)'}</span>
                </Button>

                <Link
                  href="/funding-tracker"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-500 shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto"
                >
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>My Pipeline</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {trackedApps.length}
                  </span>
                </Link>
              </div>
            </div>

            {/* Active Pre-Qual Simulated Badge Bar (if active) */}
            {activePrequalCriteria && (
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-teal-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Active Simulation:</span>
                  </span>
                  <span className="text-white/90">
                    {activePrequalCriteria.fundingAmount} target • {activePrequalCriteria.annualRevenue} revenue • {activePrequalCriteria.businessAge} in business • {activePrequalCriteria.industry}
                  </span>
                </div>
                <button
                  onClick={() => setActivePrequalCriteria(null)}
                  className="text-xs font-bold text-slate-300 hover:text-white underline self-start sm:self-center"
                >
                  Reset to Profile
                </button>
              </div>
            )}

            {/* Transparency Banner */}
            <div className="pt-3 border-t border-white/15 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <span>
                <strong>No Hard Credit Checks:</strong> Crediqly preliminary matching evaluates customer-reported information against provider criteria. Final approval and underwriting decisions are determined exclusively by each funding provider.
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. FREE TIER PROMOTION SHOWCASE vs ACTIVE PRO FULL MARKETPLACE    */}
          {/* ================================================================= */}
          {!isPro ? (
            <div className="space-y-6">
              {/* Premium & Advisory Promotion Showcase */}
              <div className="rounded-3xl border-2 border-brand-300 bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/40 p-6 sm:p-8 shadow-md">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Funding Marketplace — Premium &amp; Advisory Feature</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Unlock Institutional Commercial Funding
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
                    Based on your Crediqly readiness score, access 17+ commercial lenders, SBA facilities, equipment financing, non-dilutive small business grants, and the Pre-Qualification Simulator.
                  </p>

                  {/* Dual Tier Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 text-left">
                    {/* Option 1: Pro */}
                    <div className="p-5 rounded-2xl bg-white border-2 border-brand-200 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-brand-700">DIY Platform</span>
                          <span className="text-lg font-black text-slate-900">
                            $39<span className="text-xs font-normal text-slate-500">/mo</span>
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">Crediqly Pro</h3>
                        <ul className="text-xs text-slate-600 space-y-2 pt-1">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Full 17+ Commercial Lenders Directory</strong> with underwriting thresholds
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Pre-Qualification Simulator</strong> with live parameter testing
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Direct Lender Application Links</strong> &amp; pipeline tracking
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Small Business Grants Directory</strong> ($0 repayment)
                            </span>
                          </li>
                        </ul>
                      </div>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={upgradeToPro}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-2.5 mt-2 gap-1.5 shadow-xs"
                      >
                        <span>Upgrade to Pro — $39/mo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Option 2: Advisory */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white border border-purple-500/30 shadow-md space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-purple-300">Done-For-You</span>
                          <span className="text-lg font-black text-white">
                            $499 <span className="text-xs font-normal text-purple-300">+ $199/mo</span>
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white">Done-For-You Premium Advisory</h3>
                        <ul className="text-xs text-slate-200 space-y-2 pt-1">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Everything in Pro included</strong> with full platform access
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Dedicated Funding Advisor</strong> assigned to your business
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Concierge Document Pack Preparation</strong> (financials, bank records)
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>1-on-1 Monthly Strategy Sessions</strong> before submitting applications
                            </span>
                          </li>
                        </ul>
                      </div>
                      <Link href="/advisory">
                        <Button
                          variant="primary"
                          size="md"
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 mt-2 gap-1.5 shadow-xs"
                        >
                          <span>Explore Premium Advisory</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Locked Teaser Opportunities Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Sample Matched Opportunities Preview
                    </h3>
                    <p className="text-xs text-slate-500">
                      Preview of lenders matching your commercial standing. Complete underwriting requirements and direct application links are unlocked for Pro and Advisory members.
                    </p>
                  </div>
                  <Badge variant="neutral" className="text-xs font-semibold">
                    Free Tier Preview
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                  {matchedResults.slice(0, 2).map((res) => (
                    <div key={res.product.id} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                      <div className="opacity-40 filter blur-[1.5px] pointer-events-none p-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">{res.product.provider}</span>
                          <span className="text-xs font-extrabold text-emerald-600">{res.matchLevel}</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">{res.product.name}</h4>
                        <div className="text-xs text-slate-600">
                          Funding range: {res.product.minFundingAmount ? `$${res.product.minFundingAmount.toLocaleString()} – $${(res.product.maxFundingAmount || 0).toLocaleString()}` : 'Flexible'}
                        </div>
                        <div className="h-8 bg-slate-100 rounded-lg" />
                      </div>

                      {/* Locked Overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">
                            Direct Application &amp; Lender Criteria Locked
                          </span>
                          <span className="text-[11px] text-slate-200 block">
                            Upgrade to Pro or Advisory to unlock full details
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={upgradeToPro}
                          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1 shadow-xs px-4"
                        >
                          <span>Unlock with Pro</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* NAVIGATION TABS (Marketplace, Top Matches, Grants, Pipeline) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 flex-wrap gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('marketplace')}
                    className={`text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl transition-all ${
                      activeTab === 'marketplace'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    All Opportunities ({matchedResults.length})
                  </button>

              <button
                type="button"
                onClick={() => setActiveTab('top_matches')}
                className={`text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'top_matches'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Top Matches ({topMatches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('grants')}
                className={`text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'grants'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Small Business Grants ({grantMatches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tracked')}
                className={`text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'tracked'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Tracked Pipeline ({trackedApps.length})</span>
              </button>
            </div>

            <Link href="/readiness">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1 text-brand-700">
                <span>Readiness Audit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: ALL MARKETPLACE OPPORTUNITIES + SIMPLE FILTERS             */}
          {/* ================================================================= */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search provider or loan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Funding Amount */}
                  <div>
                    <select
                      value={selectedAmount}
                      onChange={(e) => setSelectedAmount(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="all">All Funding Amounts</option>
                      <option value="under_10k">Under $10,000</option>
                      <option value="10k_25k">$10,000 – $25,000</option>
                      <option value="25k_50k">$25,000 – $50,000</option>
                      <option value="50k_100k">$50,000 – $100,000</option>
                      <option value="100k_plus">$100,000+</option>
                    </select>
                  </div>

                  {/* Funding Type */}
                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="all">All Funding Types</option>
                      <option value="Business Line of Credit">Business Line of Credit</option>
                      <option value="Term Loan">Business Term Loan</option>
                      <option value="Business Credit Card">Business Credit Card</option>
                      <option value="Equipment Financing">Equipment Financing</option>
                      <option value="Working Capital">Working Capital Advance</option>
                      <option value="SBA-related Financing">SBA 7(a) / Express</option>
                      <option value="Revenue-based Financing">Revenue-Based Financing</option>
                      <option value="Invoice Financing">Invoice Factoring</option>
                      <option value="Grant">Grants (Non-dilutive)</option>
                    </select>
                  </div>

                  {/* Repayment Type */}
                  <div>
                    <select
                      value={selectedRepayment}
                      onChange={(e) => setSelectedRepayment(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="all">All Repayment Terms</option>
                      <option value="Revolving">Revolving Line</option>
                      <option value="Short Term">Short Term (&lt;12 mos)</option>
                      <option value="Medium Term">Medium Term (12–36 mos)</option>
                      <option value="Long Term">Long Term (36+ mos)</option>
                      <option value="Grant">Grant ($0 Repayment)</option>
                    </select>
                  </div>

                  {/* Match Status */}
                  <div>
                    <select
                      value={selectedMatchLevel}
                      onChange={(e) => setSelectedMatchLevel(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="all">All Match Levels</option>
                      <option value="Strong Match">🟢 Strong Match</option>
                      <option value="Possible Match">🟡 Possible Match</option>
                      <option value="Not Ready Yet">🔴 Not Ready Yet</option>
                    </select>
                  </div>
                </div>

                {/* Active Filter Clear */}
                {(selectedCategory !== 'all' ||
                  selectedAmount !== 'all' ||
                  selectedRepayment !== 'all' ||
                  selectedMatchLevel !== 'all' ||
                  searchQuery.trim() !== '') && (
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Showing {filteredMarketplaceResults.length} of {matchedResults.length} opportunities</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedAmount('all');
                        setSelectedRepayment('all');
                        setSelectedMatchLevel('all');
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Marketplace Cards Grid */}
              {filteredMarketplaceResults.length === 0 ? (
                <Card className="border-slate-200 bg-white p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    No matching funding opportunities found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try relaxing your filters, changing your requested funding amount, or clearing your search criteria.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedAmount('all');
                      setSelectedRepayment('all');
                      setSelectedMatchLevel('all');
                      setSearchQuery('');
                    }}
                    className="text-xs font-bold"
                  >
                    Reset Filters
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMarketplaceResults.map((match) => (
                    <FundingOpportunityCard
                      key={match.product.id}
                      matchResult={match}
                      isTracked={trackedProductIds.has(match.product.id)}
                      onTrack={handleTrackProduct}
                      onSelectDetails={(res) => setSelectedModalMatch(res)}
                      onOutboundClick={handleOutboundClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: TOP MATCHES (Top 3 Tiered Recommendations)                */}
          {/* ================================================================= */}
          {activeTab === 'top_matches' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <span className="font-extrabold uppercase tracking-wider block text-emerald-900">
                  Curated For Your Profile
                </span>
                <p className="text-slate-700 leading-relaxed">
                  These opportunities represent the highest preliminary alignment with your reported business age, revenue range, credit score, and commercial bureau status.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {topMatches.map((match) => (
                  <FundingOpportunityCard
                    key={match.product.id}
                    matchResult={match}
                    isTracked={trackedProductIds.has(match.product.id)}
                    onTrack={handleTrackProduct}
                    onSelectDetails={(res) => setSelectedModalMatch(res)}
                    onOutboundClick={handleOutboundClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: GRANTS DIRECTORY (Non-dilutive Free Capital)              */}
          {/* ================================================================= */}
          {activeTab === 'grants' && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white space-y-1.5 border border-purple-800/40">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-black text-white">
                    Small Business Grants Directory
                  </h3>
                </div>
                <p className="text-xs text-purple-200 leading-relaxed max-w-2xl">
                  Small business grants provide non-dilutive, non-repayable capital ($0 repayment). Unlike commercial loans, grants are awarded based on business mission, ownership demographics, operational milestones, and contest criteria.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {grantMatches.map((match) => (
                  <FundingOpportunityCard
                    key={match.product.id}
                    matchResult={match}
                    isTracked={trackedProductIds.has(match.product.id)}
                    onTrack={handleTrackProduct}
                    onSelectDetails={(res) => setSelectedModalMatch(res)}
                    onOutboundClick={handleOutboundClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: MY TRACKED APPLICATIONS PIPELINE                          */}
          {/* ================================================================= */}
          {activeTab === 'tracked' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    My Saved Application Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Keep track of opportunities you are researching or currently applying to.
                  </p>
                </div>
                <Link href="/funding-tracker">
                  <Button variant="outline" size="sm" className="text-xs font-bold gap-1">
                    <span>Manage Full Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {trackedApps.length === 0 ? (
                <Card className="border-slate-200 bg-white p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    No applications tracked yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Track" on any marketplace card to bookmark it to your pipeline and monitor your status.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('marketplace')}
                    className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                  >
                    Browse Marketplace
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {trackedApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {app.category}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {app.productName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Provider: <strong>{app.providerName}</strong> • Target: <strong>${(app.requestedAmount || 0).toLocaleString()}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                          Status: {app.status}
                        </span>
                        <Link href="/funding-tracker">
                          <Button variant="outline" size="sm" className="text-xs font-semibold">
                            Update
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

          {/* ================================================================= */}
          {/* PRO GATED: LENDER UNDERWRITING MATRIX                              */}
          {/* ================================================================= */}
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
                      Lender Underwriting Matrix &amp; Capital Preparation Engine
                    </h3>
                    <p className="text-xs text-slate-500">
                      Institutional underwriting benchmarks for Tier 1 &amp; Tier 2 commercial lenders
                    </p>
                  </div>
                </div>
                <Badge variant="info">Pro Unlocked</Badge>
              </div>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <span className="font-bold text-slate-900 block">DSCR &amp; Cash Flow Benchmarks</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Most commercial term lenders require a minimum 1.25x Debt Service Coverage Ratio and at least 3 consecutive months of operating deposits above $10,000.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <span className="font-bold text-slate-900 block">Bank Rating &amp; Balance Volatility</span>
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

          {/* ================================================================= */}
          {/* CONSULTATION ASSISTANCE BANNER                                   */}
          {/* ================================================================= */}
          <Card className="border-brand-200 bg-brand-50/50 shadow-xs">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
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
              <Link href="/consultation" className="shrink-0">
                <Button size="sm" variant="primary" className="text-xs gap-1.5 whitespace-nowrap bg-brand-600 hover:bg-brand-500 text-white">
                  <span>Request a Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* ================================================================= */}
          {/* COMPLIANCE & AFFILIATE DISCLOSURE                                 */}
          {/* ================================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-2 leading-relaxed">
            <p>
              <span className="font-semibold text-slate-700">Exploratory Assessment Disclosure: </span>
              Match indicators (Strong Match, Possible Match, Not Ready Yet) are internal Crediqly evaluations based on the business information you have provided and administrator-defined provider criteria. Match designations do not represent pre-approval, loan offers, qualification guarantees, or lender underwriting decisions. Actual requirements and approval terms are established solely by individual providers.
            </p>
            <p>
              <span className="font-semibold text-slate-700">Partner &amp; Provider Disclosure: </span>
              The information and resources provided are for educational purposes only. Requirements, terms, availability, and eligibility may vary by provider. Review all terms carefully before taking action. Some links on this page are partner referral links, meaning Crediqly may receive compensation if you choose to work with a partner, at no additional cost to you. We do not originate loans or broker credit agreements.
            </p>
          </div>
        </div>

        {/* Modals */}
        <FundingDetailsModal
          matchResult={selectedModalMatch}
          onClose={() => setSelectedModalMatch(null)}
          isTracked={selectedModalMatch ? trackedProductIds.has(selectedModalMatch.product.id) : false}
          onTrack={handleTrackProduct}
          onOutboundClick={handleOutboundClick}
        />

        <PreQualificationModal
          isOpen={isPrequalOpen}
          onClose={() => setIsPrequalOpen(false)}
          profile={business}
          currentCriteria={activePrequalCriteria}
          onApplyCriteria={(crit) => {
            setActivePrequalCriteria(crit);
            showToast('Applied preliminary pre-qualification criteria');
          }}
          onResetCriteria={() => {
            setActivePrequalCriteria(null);
            showToast('Reset criteria to your business profile');
          }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
