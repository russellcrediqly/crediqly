import type { BusinessProfile } from '@/types/business';
import type { FundingProduct } from '@/types/fundingProduct';
import { matchFundingProducts } from './fundingRecommendationEngine';
import { resolveFundingProductOutboundUrl } from '@/lib/supabase/fundingProductService';

export interface PersonalizedFundingTier {
  tier: 'strong' | 'possible' | 'improve_readiness';
  badgeLabel: 'Strong Match' | 'Possible Match' | 'Improve Readiness First';
  badgeColor: 'emerald' | 'amber' | 'rose';
  category: string;
  productName: string;
  providerName: string;
  estimatedRange: string;
  whyText?: string;
  requirements?: string[];
  preparationNote?: string;
  ctaText: string;
  ctaUrl: string;
  isExternal: boolean;
  productId: string;
}

export interface PersonalizedFundingMatchesResult {
  strongMatch: PersonalizedFundingTier | null;
  possibleMatch: PersonalizedFundingTier | null;
  improveReadinessMatch: PersonalizedFundingTier | null;
  complianceNotice: string;
}

/**
 * Format numerical funding range into clean human-friendly strings like "$10K–$50K".
 */
export function formatFundingRange(min?: number, max?: number, fallback = '$10K–$50K'): string {
  if (!min && !max) return fallback;
  const formatVal = (val: number) => {
    if (val >= 1000000) {
      const m = val / 1000000;
      return `$${Number.isInteger(m) ? m : m.toFixed(1)}M`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return `$${Number.isInteger(k) ? k : k.toFixed(0)}K`;
    }
    return `$${val}`;
  };

  if (min && max) {
    return `${formatVal(min)}–${formatVal(max)}`;
  }
  if (max) return `Up to ${formatVal(max)}`;
  if (min) return `From ${formatVal(min)}`;
  return fallback;
}

/**
 * Deterministically compute the 3 personalized funding match tiers for a customer:
 * 1. 🟢 Strong Match (e.g., Business Line of Credit)
 * 2. 🟡 Possible Match (e.g., Business Credit Card)
 * 3. 🔴 Improve Readiness First (e.g., SBA Financing)
 *
 * Strict Compliance:
 * - NEVER guarantee approval or qualify.
 * - Always use conditional terminology ("Potential Match", "Strong Match", "Based on the information provided").
 * - Reuses existing profile & admin funding products catalog.
 */
export function getPersonalizedFundingMatches(
  profile: Partial<BusinessProfile> | null,
  fundingReadinessScore: number,
  products: FundingProduct[]
): PersonalizedFundingMatchesResult {
  const complianceNotice =
    'Educational Guidance: Matches are educational estimates based on the information provided and provider criteria. Crediqly does not originate loans or guarantee credit approval. Eligibility varies by provider.';

  const activeProducts = products.filter((p) => p.status === 'active');
  if (activeProducts.length === 0) {
    return {
      strongMatch: null,
      possibleMatch: null,
      improveReadinessMatch: null,
      complianceNotice,
    };
  }

  // Run core matching algorithm
  const matched = matchFundingProducts(profile, fundingReadinessScore, activeProducts);

  // Find SBA or highest requirement product
  const sbaProduct =
    activeProducts.find((p) => p.category === 'SBA-related Financing') ||
    activeProducts.find((p) => p.minBusinessAgeMonths >= 24) ||
    activeProducts[activeProducts.length - 1];

  // Candidates for strong & possible matches (excluding SBA to ensure distinct tiers)
  const nonSbaMatches = matched.filter(
    (m) => m.product.id !== sbaProduct?.id && m.product.category !== 'SBA-related Financing'
  );

  const topMatch = nonSbaMatches[0] || matched[0];
  const secondMatch =
    nonSbaMatches.find((m) => m.product.id !== topMatch?.product.id && m.product.category !== topMatch?.product.category) ||
    nonSbaMatches[1] ||
    matched.find((m) => m.product.id !== topMatch?.product.id) ||
    topMatch;

  // Build 🟢 Strong Match
  let strongMatch: PersonalizedFundingTier | null = null;
  if (topMatch) {
    const p = topMatch.product;
    const url = resolveFundingProductOutboundUrl(p);

    let range = formatFundingRange(p.minFundingAmount, p.maxFundingAmount, '$10K–$50K');
    if (p.category === 'Business Line of Credit') {
      range = '$10K–$50K';
    } else if (p.category === 'Business Credit Card') {
      range = '$5K–$25K';
    }

    strongMatch = {
      tier: 'strong',
      badgeLabel: 'Strong Match',
      badgeColor: 'emerald',
      category: p.category,
      productName: p.name,
      providerName: p.provider,
      estimatedRange: range,
      whyText: 'Your current profile appears suitable for this funding category based on the information provided.',
      ctaText: 'Learn More',
      ctaUrl: url || '/funding',
      isExternal: Boolean(url && url.startsWith('http')),
      productId: p.id,
    };
  }

  // Build 🟡 Possible Match
  let possibleMatch: PersonalizedFundingTier | null = null;
  if (secondMatch && secondMatch.product.id !== topMatch?.product.id) {
    const p = secondMatch.product;
    const url = resolveFundingProductOutboundUrl(p);

    let range = formatFundingRange(p.minFundingAmount, p.maxFundingAmount, '$5K–$30K');
    if (p.category === 'Business Credit Card') {
      range = '$2.5K–$25K';
    }

    possibleMatch = {
      tier: 'possible',
      badgeLabel: 'Possible Match',
      badgeColor: 'amber',
      category: p.category,
      productName: p.name,
      providerName: p.provider,
      estimatedRange: range,
      requirements: [
        'Business established',
        'Business banking active',
        'Credit profile in good standing',
      ],
      ctaText: 'Explore',
      ctaUrl: url || '/funding',
      isExternal: Boolean(url && url.startsWith('http')),
      productId: p.id,
    };
  } else if (topMatch) {
    // Fallback if only 1 non-SBA product exists
    possibleMatch = {
      tier: 'possible',
      badgeLabel: 'Possible Match',
      badgeColor: 'amber',
      category: 'Business Credit Card',
      productName: 'Commercial Credit Line & Cards',
      providerName: 'Commercial Card Partner',
      estimatedRange: '$5K–$25K',
      requirements: ['Business established', 'Business banking active', 'Credit profile in good standing'],
      ctaText: 'Explore',
      ctaUrl: '/funding',
      isExternal: false,
      productId: 'card_fallback',
    };
  }

  // Build 🔴 Improve Readiness First (e.g., SBA Financing)
  let improveReadinessMatch: PersonalizedFundingTier | null = null;
  if (sbaProduct) {
    improveReadinessMatch = {
      tier: 'improve_readiness',
      badgeLabel: 'Improve Readiness First',
      badgeColor: 'rose',
      category: sbaProduct.category === 'SBA-related Financing' ? 'SBA Financing' : sbaProduct.category,
      productName: sbaProduct.name,
      providerName: sbaProduct.provider,
      estimatedRange: formatFundingRange(sbaProduct.minFundingAmount, sbaProduct.maxFundingAmount, '$50K–$500K'),
      preparationNote: 'Your current profile may benefit from additional preparation before exploring this option.',
      requirements: [
        '24+ months operating history',
        '$100,000+ verifiable annual revenue',
        'Commercial credit profile with positive tradelines',
      ],
      ctaText: 'See What To Improve',
      ctaUrl: '/readiness?tab=funding',
      isExternal: false,
      productId: sbaProduct.id,
    };
  }

  return {
    strongMatch,
    possibleMatch,
    improveReadinessMatch,
    complianceNotice,
  };
}
