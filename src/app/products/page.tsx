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
import { getRecommendedProducts } from '@/lib/products/recommendationEngine';
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
} from 'lucide-react';

const CATEGORY_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Recommendations' },
  { key: 'net_30', label: 'Net-30 Vendors' },
  { key: 'business_credit_cards', label: 'Business Credit Cards' },
  { key: 'business_credit_builders', label: 'Credit Builders' },
  { key: 'business_loans', label: 'Loans & Funding' },
  { key: 'net_60', label: 'Net-60 Terms' },
  { key: 'business_banking', label: 'Business Banking' },
  { key: 'business_services', label: 'Business Services' },
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

  // Sync category filter from URL query param if present (e.g. ?category=net_30)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setActiveCategory(cat);
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

          // Combine catalogs with robust deduplication for business banking and other providers
          const existingSlugs = new Set([
            ...bankProducts.map((bp) => bp.slug),
            ...bankProducts.map((bp) => `${bp.slug}-banking`),
            ...loanProducts.map((lp) => lp.slug),
          ]);

          const normalizeName = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
          const existingBankNamesList = bankProducts.map((bp) => normalizeName(bp.name));
          const existingBankNames = new Set(existingBankNamesList);

          const filteredProds = prods.filter((p) => {
            if (existingSlugs.has(p.slug)) return false;
            if (p.category === 'business_banking') {
              const norm = normalizeName(p.name);
              const baseSlug = p.slug.toLowerCase().replace(/-banking$/, '');
              if (existingBankNames.has(norm) || existingSlugs.has(baseSlug)) return false;
              // Guard against naming variations (e.g. Relay / Relay Financial, Mercury / Mercury Bank)
              if (norm.includes('relay') && existingBankNamesList.some((n) => n.includes('relay'))) return false;
              if (norm.includes('mercury') && existingBankNamesList.some((n) => n.includes('mercury'))) return false;
              if (norm.includes('bluevine') && existingBankNamesList.some((n) => n.includes('bluevine'))) return false;
              if (norm.includes('chase') && existingBankNamesList.some((n) => n.includes('chase'))) return false;
            }
            return true;
          });

          // Final deduplication pass to guarantee every business banking recommendation appears exactly once
          const combined = [...filteredProds, ...bankProducts, ...loanProducts];
          const seenKeys = new Set<string>();
          const deduplicatedProducts: Product[] = [];

          for (const item of combined) {
            const key = item.category === 'business_banking'
              ? `bank:${normalizeName(item.name).replace(/(bank|banking|financial|inc|llc)$/, '')}`
              : `${item.category}:${item.slug}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              deduplicatedProducts.push(item);
            }
          }

          setAllProducts(deduplicatedProducts);
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

  // Top 3-5 recommended products
  const topRecommendations = useMemo(() => {
    return recommendedProducts.slice(0, 4);
  }, [recommendedProducts]);

  const topRecIds = useMemo(() => {
    return new Set(topRecommendations.map((p) => p.id));
  }, [topRecommendations]);

  // Filtered products for the "Explore All" section
  const filteredCatalog = useMemo(() => {
    let list = recommendedProducts;

    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          CATEGORY_LABELS[p.category].toLowerCase().includes(q) ||
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
              Credit Marketplace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Credit Products
          </h1>
          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Explore business credit accounts, vendor trade lines, cards, and banking services that may fit your current business-credit journey.
          </p>
        </div>

        {/* Educational Disclosure Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="leading-relaxed">
              <strong>Disclosure:</strong> The information and resources provided are for educational purposes only. Requirements, terms, availability, and eligibility may vary by provider. Review all terms carefully before taking action. Some links may provide a commission to Crediqly at no additional cost to you.
            </p>
            <p className="text-[11px] text-slate-500">
              Crediqly does not submit applications on your behalf, nor do we guarantee approval or credit-score increases. Always verify current provider terms and eligibility before applying.
            </p>
          </div>
        </div>

        {/* 1. RECOMMENDED FOR YOU SECTION (Prompt 16) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/70 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Recommended for You
                </h2>
                <p className="text-xs text-slate-500">
                  Tailored matches based on your business profile and roadmap stage.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Ranked by eligibility & roadmap relevance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {topRecommendations.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenDetail={handleOpenDetail}
                onVisitProvider={handleVisitProvider}
                isPro={isPro}
              />
            ))}
          </div>
        </div>

        {/* PRO GATE: ADVANCED VENDOR TRADELINES & REVOLVING ACCOUNTS */}
        {!isPro && (
          <ProGate
            compact
            featureName="Tier 2 & Tier 3 Vendor Tradelines & High-Limit Business Accounts"
            description="Unlock advanced vendor accounts, revolving credit lines, and full bureau reporting profiles with Crediqly Pro."
          />
        )}

        {/* 2. EXPLORE ALL PRODUCTS SECTION (Prompt 13, 14, 16) */}
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/70 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Explore All Products
                </h2>
                <p className="text-xs text-slate-500">
                  Browse by category or search by provider name, bureau, or features.
                </p>
              </div>

              {/* Search Field (Prompt 14) */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search business credit products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
                />
              </div>
            </div>

            {/* Category Filter Pills (Prompt 13) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.key;
                const isTabLocked =
                  !isPro &&
                  (tab.key === 'net_60' ||
                    tab.key === 'business_credit_cards' ||
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
            (activeCategory === 'net_60' ||
              activeCategory === 'business_credit_cards' ||
              activeCategory === 'business_banking' ||
              activeCategory === 'business_loans') && (
              <ProGate
                featureName={
                  activeCategory === 'net_60'
                    ? 'Tier 2 & Tier 3 Net-60 Vendor Tradelines'
                    : activeCategory === 'business_credit_cards'
                    ? 'Business Credit Cards & Revolving Credit Lines'
                    : activeCategory === 'business_banking'
                    ? 'Commercial Business Banking Directory'
                    : 'Commercial Loans & Capital Facilities'
                }
                description={
                  activeCategory === 'net_60'
                    ? 'Upgrade to Crediqly Pro or Premium Advisory to unlock vetted Tier 2 and Tier 3 Net-60 vendor accounts, higher credit limits, and multiple bureau reporting.'
                    : activeCategory === 'business_credit_cards'
                    ? 'Upgrade to Crediqly Pro or Premium Advisory to access unsecured corporate credit cards, 0% introductory APR lines, and underwriting qualification criteria.'
                    : activeCategory === 'business_banking'
                    ? 'Upgrade to Crediqly Pro or Premium Advisory to access commercial banking underwriting matrices, business checking fee comparisons, and lender rating guidelines.'
                    : 'Upgrade to Crediqly Pro or Premium Advisory to view verified commercial loan facilities, SBA lender criteria, and matched funding terms.'
                }
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

        {/* Compliance Educational Disclaimer */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-center space-y-1">
          <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-700" />
            <span>Important Recommendation Notice</span>
          </p>
          <p className="text-xs text-amber-800 leading-relaxed max-w-3xl mx-auto font-medium">
            Recommendations are based on the information available in your Crediqly profile. They are not guarantees of approval. Final eligibility and approval are determined by the provider.
          </p>
        </div>

        {/* Footer Editorial & Provider Disclosure */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            Editorial and Provider Disclosure
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl mx-auto">
            Crediqly provides educational resources and personalized organization tools. We may receive compensation from certain product partners when you click links or open accounts. This compensation never influences our rule-based recommendations. Crediqly does not guarantee credit approvals or specific credit scores. All terms, fees, and requirements are determined solely by the respective third-party providers.
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
