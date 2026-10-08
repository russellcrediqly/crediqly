'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/LoadingState';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { SectionInactiveNotice } from '@/components/common/SectionInactiveNotice';
import { ProGate } from '@/components/subscription/ProGate';
import { useSubscription } from '@/context/SubscriptionContext';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useRoadmap } from '@/context/RoadmapContext';
import { getProducts, trackProductClick } from '@/lib/supabase/productService';
import { getBanks } from '@/lib/supabase/bankService';
import { getFundingProducts } from '@/lib/supabase/fundingProductService';
import { getRecommendedProducts, getNormalizedProviderKey } from '@/lib/products/recommendationEngine';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { Product, RecommendedProduct, ProductCategory, CATEGORY_LABELS } from '@/types/product';
import { Bank } from '@/types/bank';
import { FundingProduct } from '@/types/fundingProduct';
import {
  CreditCard,
  Search,
  Sparkles,
  Info,
  ShieldCheck,
  Filter,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  DollarSign,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

const CATEGORY_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Recommendations' },
  { key: 'business_credit_builders', label: 'Business Credit Builders' },
  { key: 'net_30', label: 'Net-30 / Net-45 / Net-60' },
  { key: 'business_credit_cards', label: 'Business Credit Cards' },
  { key: 'business_banking', label: 'Business Banking' },
  { key: 'business_services', label: 'Business Services' },
  { key: 'business_loans', label: 'Business Loans' },
];

function CreditProductsContent() {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { business, loading: businessLoading } = useBusiness();
  const { roadmap, loading: roadmapLoading } = useRoadmap();
  const { sections } = usePlatformSections();
  const searchParams = useSearchParams();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | RecommendedProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'curated' | 'all'>('curated');

  // Sync category filter from URL query param if present (e.g. ?category=net_30)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setActiveCategory(cat);
      setViewMode('all');
    }
  }, [searchParams]);

  // Compute live funding readiness
  const fundingReadiness = useMemo(() => calculateFundingReadiness(business), [business]);

  // Load products, commercial banks, and loan/funding catalog
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const [prods, banks, funding] = await Promise.all([
          getProducts(),
          getBanks(),
          getFundingProducts(),
        ]);
        if (isMounted) {
          // Convert active banks to business_banking category products
          const bankProducts: Product[] = banks.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            category: 'business_banking',
            description: b.description,
            shortDescription: b.shortDescription || b.description,
            logoUrl: b.logoUrl,
            websiteUrl: b.websiteUrl,
            affiliateUrl: b.affiliateUrl,
            affiliateEnabled: b.affiliateEnabled,
            reportingBureaus: [],
            productType: 'Commercial Checking Account',
            terms: 'Commercial Checking',
            annualFee: '$0',
            minimumPurchase: b.minDeposit || 'No minimum deposit',
            subscriptionRequired: false,
            typicalBusinessAge: 'No minimum',
            einRequired: true,
            businessBankAccountRequired: false,
            businessWebsiteRequired: false,
            personalGuaranteeRequired: 'no',
            personalCreditRequirement: 'None',
            potentialFit: 'Startups and operating businesses needing dedicated commercial checking.',
            recommendedStage: b.recommendedStage || 'foundation',
            priority: b.priority,
            status: b.status,
            featured: b.featured,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
          }));

          // Convert active funding providers to business_loans category products
          const loanProducts: Product[] = funding.map((f) => ({
            id: f.id,
            name: `${f.provider} — ${f.name}`,
            slug: `loan-${f.id}`,
            category: 'business_loans',
            description: f.description,
            shortDescription: f.description,
            websiteUrl: f.websiteUrl,
            affiliateUrl: f.affiliateUrl,
            affiliateEnabled: f.affiliateEnabled,
            reportingBureaus: f.businessCreditRequired === 'yes' ? ['Commercial Bureaus'] : [],
            productType: f.category,
            terms: f.category,
            annualFee: 'Varies by loan',
            potentialFundingRange:
              f.minFundingAmount && f.maxFundingAmount
                ? `$${Math.round(f.minFundingAmount / 1000)}K–$${Math.round(f.maxFundingAmount / 1000)}K`
                : 'Funding Available',
            potentialFit: `Best for ${f.fundingPurposes.slice(0, 2).join(', ')}. Min revenue: ${f.minAnnualRevenue}.`,
            minimumPurchase: f.minAnnualRevenue ? `Min Revenue: ${f.minAnnualRevenue}` : undefined,
            subscriptionRequired: false,
            typicalBusinessAge: f.minBusinessAgeMonths > 0 ? `${f.minBusinessAgeMonths}+ months` : 'No minimum',
            einRequired: true,
            businessBankAccountRequired: true,
            businessWebsiteRequired: false,
            personalGuaranteeRequired: f.businessCreditRequired === 'yes' ? 'yes' : 'no',
            personalCreditRequirement: f.minPersonalCredit,
            recommendedStage: 'funding',
            priority: f.priority,
            status: f.status,
            featured: f.featured,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          }));

          // Combine with strict deduplication
          const combined = [...prods, ...bankProducts, ...loanProducts];
          const seenKeys = new Set<string>();
          const deduplicated: Product[] = [];

          for (const item of combined) {
            const key = getNormalizedProviderKey(item.name, item.category, item.slug);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              deduplicated.push(item);
            }
          }

          setAllProducts(deduplicated);
          setProductsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load products catalog:', err);
        if (isMounted) setProductsLoading(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute deterministic recommendations based on profile, roadmap, and funding readiness score
  const recommendedProducts = useMemo(() => {
    if (allProducts.length === 0) return [];
    return getRecommendedProducts(business, roadmap, allProducts, fundingReadiness.score);
  }, [business, roadmap, allProducts, fundingReadiness.score]);

  // Exactly Top 3 options curated for the user's current situation
  const top3Recommendations = useMemo(() => {
    return recommendedProducts.slice(0, 3);
  }, [recommendedProducts]);

  // Filtered products for full catalog
  const filteredCatalog = useMemo(() => {
    let list = recommendedProducts;

    if (activeCategory !== 'all') {
      if (activeCategory === 'net_30') {
        list = list.filter((p) => p.category === 'net_30' || p.category === 'net_60');
      } else {
        list = list.filter((p) => p.category === activeCategory);
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          CATEGORY_LABELS[p.category]?.toLowerCase().includes(q) ||
          p.reportingBureaus.some((b) => b.toLowerCase().includes(q))
      );
    }

    return list;
  }, [recommendedProducts, activeCategory, searchQuery]);

  const handleOpenDetail = (product: Product | RecommendedProduct) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleVisitProvider = (product: Product | RecommendedProduct) => {
    trackProductClick(user?.id, product.id);
  };

  if (sections.products === false) {
    return (
      <SectionInactiveNotice
        title="Credit Products Catalog Temporarily Inactive"
        description="The credit products catalog and recommendations are currently disabled by the administrator. Please return to your dashboard."
      />
    );
  }

  if (businessLoading || roadmapLoading || productsLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Loading business credit products & personalized recommendations..." />
      </div>
    );
  }

  return (
    <>
      <ProductDetailModal
        isOpen={modalOpen}
        product={selectedProduct}
        onClose={() => {
          setModalOpen(false);
          setSelectedProduct(null);
        }}
        onVisitProvider={handleVisitProvider}
      />

      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Intelligent Credit Marketplace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Curated Business Credit Products
          </h1>
          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Crediqly evaluated your business age, entity type, bank account status, and reporting tradelines to select options tailored to your current stage.
          </p>
        </div>

        {/* Transparent Affiliate & Educational Disclosure */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="leading-relaxed">
              <strong>Objective Matching & Disclosure:</strong> Crediqly provides educational resources and personalized organization tools. Recommendations are determined solely by your business operating profile and roadmap milestone progress. We may receive referral compensation from some providers at no cost to you, which never influences matching criteria or provider ranking.
            </p>
            <p className="text-[11px] text-slate-500">
              Approval decisions, terms, credit limits, and fees are determined exclusively by third-party providers.
            </p>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 1. CURATED TOP 3 HERO: "Options That Make the Most Sense Right Now" */}
        {/* =================================================================== */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-950 text-white space-y-6 shadow-md border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CURATED FOR YOUR CURRENT STAGE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Here are the 3 options that make the most sense for you right now
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Selected from our marketplace based on your current readiness score ({fundingReadiness.score}/100) and milestone progress.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 shrink-0 self-start sm:self-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('curated')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'curated'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Top 3 Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'all'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                View All Options ({allProducts.length})
              </button>
            </div>
          </div>

          {/* Top 3 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {top3Recommendations.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenDetail={handleOpenDetail}
                onVisitProvider={handleVisitProvider}
                isPro={isPro}
              />
            ))}
          </div>

          {viewMode === 'curated' && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('all')}
                className="text-xs text-white border-white/20 hover:bg-white/10 bg-transparent font-bold gap-1.5 px-4"
              >
                <span>Browse All {allProducts.length} Marketplace Options</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* PRO GATE FOR ADVANCED VENDORS & REVOLVING LINES */}
        {!isPro && (
          <ProGate
            compact
            featureName="Tier 2 & Tier 3 Vendor Tradelines & High-Limit Business Accounts"
            description="Unlock advanced vendor accounts, revolving credit lines, and full bureau reporting profiles with Crediqly Pro."
          />
        )}

        {/* =================================================================== */}
        {/* 2. FULL CATALOG VIEW WITH SIMPLE CATEGORIES & SEARCH                */}
        {/* =================================================================== */}
        {viewMode === 'all' && (
          <div className="space-y-6 pt-2">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/70 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Explore Full Product Catalog
                  </h2>
                  <p className="text-xs text-slate-500">
                    Filter by primary categories or search by provider name and bureau.
                  </p>
                </div>

                {/* Search Field */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search providers, bureaus..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = activeCategory === tab.key;
                  const isTabLocked =
                    !isPro &&
                    (tab.key === 'business_credit_cards' ||
                      tab.key === 'business_banking' ||
                      tab.key === 'business_loans');
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveCategory(tab.key)}
                      className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {isTabLocked && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          }`}
                        >
                          🔒 Pro
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dedicated Category Pro Lock Notice */}
            {!isPro &&
              (activeCategory === 'business_credit_cards' ||
                activeCategory === 'business_banking' ||
                activeCategory === 'business_loans') && (
                <ProGate
                  featureName={
                    activeCategory === 'business_credit_cards'
                      ? 'Business Credit Cards & Revolving Lines'
                      : activeCategory === 'business_banking'
                      ? 'Commercial Business Banking Directory'
                      : 'Commercial Loans & Capital Facilities'
                  }
                  description="Upgrade to Crediqly Pro or Premium Advisory to access underwriting matrices, higher limits, and direct application links."
                />
              )}

            {/* Product Cards Grid */}
            {filteredCatalog.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-10 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">No Products Found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No products matched your search or category filter. Try clearing filters to view all available products.
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveCategory('all');
                        setSearchQuery('');
                      }}
                      className="text-xs"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCatalog.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onOpenDetail={handleOpenDetail}
                    onVisitProvider={handleVisitProvider}
                    isPro={isPro}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-center space-y-1">
          <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-700" />
            <span>Underwriting & Recommendation Notice</span>
          </p>
          <p className="text-xs text-amber-800 leading-relaxed max-w-3xl mx-auto font-medium">
            Recommendations are based on reported profile information and are not guarantees of credit approval. All underwriting requirements and credit decisions are determined independently by each provider.
          </p>
        </div>
      </div>
    </>
  );
}

export default function CreditProductsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <LoadingState message="Loading credit products..." />
            </div>
          }
        >
          <CreditProductsContent />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
