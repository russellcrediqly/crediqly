import { BusinessProfile } from '@/types/business';
import { RoadmapResult } from '@/lib/roadmap/types';
import { Product, RecommendedProduct } from '@/types/product';
import { FundingProduct, FundingMatchResult } from '@/types/fundingProduct';
import { getProducts } from '@/lib/supabase/productService';
import { getFundingProducts } from '@/lib/supabase/fundingProductService';
import { getRecommendedProducts } from '@/lib/products/recommendationEngine';
import { matchFundingProducts } from '@/lib/funding/fundingRecommendationEngine';

export interface UnifiedRecommendationItem {
  id: string;
  type: 'net_30' | 'credit_card' | 'loan' | 'credit_builder';
  categoryLabel: string;
  name: string;
  provider: string;
  matchIndicator: 'strong' | 'possible' | 'improve_readiness';
  matchLabel: string;
  estimatedTermsOrFunding: string;
  bestFor: string;
  reason: string;
  requirements: string[];
  ctaText: string;
  ctaUrl: string;
  isExternal: boolean;
  affiliateEnabled: boolean;
}

export interface UnifiedDashboardRecommendations {
  readinessScore: number;
  items: UnifiedRecommendationItem[];
  recommendedHighlights: string[];
  improveFirstHighlights: string[];
  disclaimer: string;
}

export const RECOMMENDATION_DISCLAIMER =
  'Recommendations are based on the information available in your Crediqly profile. They are not guarantees of approval. Final eligibility and approval are determined by the provider.';

/**
 * Generate a curated, personalized list of recommendations for the customer dashboard
 * spanning Net-30 vendors, business credit cards, and loan/funding providers.
 */
export async function getUnifiedDashboardRecommendations(
  business: Partial<BusinessProfile> | null,
  roadmap: RoadmapResult | null,
  readinessScore: number
): Promise<UnifiedDashboardRecommendations> {
  const [products, fundingProducts] = await Promise.all([
    getProducts(),
    getFundingProducts(),
  ]);

  const recommendedProducts = getRecommendedProducts(
    business,
    roadmap,
    products,
    readinessScore
  );

  const matchedFunding = matchFundingProducts(
    business,
    readinessScore,
    fundingProducts
  );

  const items: UnifiedRecommendationItem[] = [];
  const recommendedHighlights: string[] = [];
  const improveFirstHighlights: string[] = [];

  // 1. Top Net-30 Vendor
  const topNet30 = recommendedProducts.find((p) => p.category === 'net_30');
  if (topNet30) {
    items.push({
      id: topNet30.id,
      type: 'net_30',
      categoryLabel: 'Net-30 Vendor',
      name: topNet30.name,
      provider: topNet30.name,
      matchIndicator: topNet30.matchIndicator || 'strong',
      matchLabel: topNet30.matchLabel,
      estimatedTermsOrFunding: topNet30.terms || 'Net-30 Terms',
      bestFor: topNet30.potentialFit || 'Business credit building with tier-1 commercial trade lines',
      reason: topNet30.recommendationReason,
      requirements: [
        topNet30.einRequired ? 'EIN Required' : 'No EIN Required',
        topNet30.minimumPurchase ? `Min Purchase: ${topNet30.minimumPurchase}` : 'No minimum purchase',
        topNet30.reportingBureaus.length > 0 ? `Reports to ${topNet30.reportingBureaus.join(', ')}` : 'Vendor reporting',
      ],
      ctaText: 'Learn More',
      ctaUrl: topNet30.affiliateEnabled && topNet30.affiliateUrl ? topNet30.affiliateUrl : topNet30.websiteUrl,
      isExternal: true,
      affiliateEnabled: topNet30.affiliateEnabled,
    });
    if (topNet30.matchIndicator === 'strong') {
      recommendedHighlights.push(`${topNet30.name} (Net-30 vendor trade credit)`);
    }
  }

  // 2. Top Business Credit Card
  const topCard = recommendedProducts.find((p) => p.category === 'business_credit_cards');
  if (topCard) {
    items.push({
      id: topCard.id,
      type: 'credit_card',
      categoryLabel: 'Business Credit Card',
      name: topCard.name,
      provider: topCard.name,
      matchIndicator: topCard.matchIndicator || 'possible',
      matchLabel: topCard.matchLabel,
      estimatedTermsOrFunding: topCard.annualFee ? `Annual Fee: ${topCard.annualFee}` : 'Annual Fee: $0',
      bestFor: topCard.potentialFit || 'Everyday commercial purchases and cash-back rewards',
      reason: topCard.recommendationReason,
      requirements: [
        topCard.personalGuaranteeRequired === 'no' ? 'No Personal Guarantee' : 'Personal Guarantee Required',
        topCard.personalCreditRequirement ? `Credit: ${topCard.personalCreditRequirement}` : 'Baseline credit',
        topCard.introOffer ? topCard.introOffer : 'Rewards on business spending',
      ],
      ctaText: 'View Card',
      ctaUrl: topCard.affiliateEnabled && topCard.affiliateUrl ? topCard.affiliateUrl : topCard.websiteUrl,
      isExternal: true,
      affiliateEnabled: topCard.affiliateEnabled,
    });
    if (topCard.matchIndicator === 'strong' || topCard.matchIndicator === 'possible') {
      recommendedHighlights.push(`${topCard.name} (Business credit card)`);
    } else {
      improveFirstHighlights.push('Revolving credit cards (requires additional tradeline history)');
    }
  }

  // 3. Top Funding / Loan Provider
  const topFundingMatch = matchedFunding[0];
  if (topFundingMatch) {
    const fp = topFundingMatch.product;
    const isStrong = topFundingMatch.matchLevel === 'Strong Match';
    const isPossible = topFundingMatch.matchLevel === 'Potential Match';

    const indicator: 'strong' | 'possible' | 'improve_readiness' = isStrong
      ? 'strong'
      : isPossible
      ? 'possible'
      : 'improve_readiness';

    const label = isStrong
      ? 'Strong Potential Match'
      : isPossible
      ? 'Possible Match'
      : 'Improve Readiness First';

    items.push({
      id: fp.id,
      type: 'loan',
      categoryLabel: fp.category,
      name: fp.name,
      provider: fp.provider,
      matchIndicator: indicator,
      matchLabel: label,
      estimatedTermsOrFunding:
        fp.minFundingAmount && fp.maxFundingAmount
          ? `$${Math.round(fp.minFundingAmount / 1000)}K–$${Math.round(fp.maxFundingAmount / 1000)}K`
          : 'Funding Available',
      bestFor: `Working capital and ${fp.fundingPurposes.slice(0, 2).join(', ')}`,
      reason: topFundingMatch.whyThisFits,
      requirements: [
        `Min Time in Business: ${fp.minBusinessAgeMonths > 0 ? `${fp.minBusinessAgeMonths} months` : 'No minimum'}`,
        `Min Annual Revenue: ${fp.minAnnualRevenue}`,
        `Min Personal Credit: ${fp.minPersonalCredit}`,
      ],
      ctaText: 'View Details',
      ctaUrl: fp.affiliateEnabled && fp.affiliateUrl ? fp.affiliateUrl : fp.websiteUrl,
      isExternal: true,
      affiliateEnabled: fp.affiliateEnabled,
    });

    if (indicator === 'strong') {
      recommendedHighlights.push(`${fp.provider} (${fp.category})`);
    } else {
      improveFirstHighlights.push(`${fp.category} (Recommend establishing revenue and trade history first)`);
    }
  }

  // Fallback items if needed
  if (items.length === 0) {
    const defaultBuilder = recommendedProducts[0];
    if (defaultBuilder) {
      items.push({
        id: defaultBuilder.id,
        type: 'credit_builder',
        categoryLabel: 'Business Credit Builder',
        name: defaultBuilder.name,
        provider: defaultBuilder.name,
        matchIndicator: 'strong',
        matchLabel: 'Strong Potential Match',
        estimatedTermsOrFunding: 'Bureau Reporting',
        bestFor: 'Credit building foundation',
        reason: defaultBuilder.recommendationReason,
        requirements: ['EIN Required', 'Commercial Bank Account'],
        ctaText: 'Learn More',
        ctaUrl: defaultBuilder.websiteUrl,
        isExternal: true,
        affiliateEnabled: false,
      });
      recommendedHighlights.push(`${defaultBuilder.name} (Credit builder)`);
    }
  }

  // Ensure there is at least one "Improve Readiness First" item to guide the user
  if (improveFirstHighlights.length === 0) {
    if (readinessScore < 75) {
      improveFirstHighlights.push('Larger commercial term loans (Build 5+ trade lines and $100K+ annual revenue)');
    } else {
      improveFirstHighlights.push('SBA 7(a) prime financing (Requires 24+ months operating history and tax filings)');
    }
  }

  return {
    readinessScore,
    items,
    recommendedHighlights,
    improveFirstHighlights,
    disclaimer: RECOMMENDATION_DISCLAIMER,
  };
}
