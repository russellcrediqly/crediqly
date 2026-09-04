import { BusinessProfile } from '@/types/business';
import { RoadmapResult } from '@/lib/roadmap/types';
import { Product, RecommendedProduct, MatchLabel } from '@/types/product';

/**
 * Deterministic rule-based product recommendation engine.
 *
 * Evaluates the user's business profile and roadmap stage to score and rank
 * products with objective match labels and transparent rationale.
 *
 * Strictly zero AI / zero machine learning dependency.
 */
export function getRecommendedProducts(
  business: Partial<BusinessProfile> | null,
  roadmap: RoadmapResult | null,
  products: Product[]
): RecommendedProduct[] {
  const p = business || {};
  const activeProducts = products.filter((prod) => prod.status === 'active');

  const hasEIN = p.hasEIN === 'yes';
  const hasBank = p.hasBusinessBankAccount === 'yes';
  const hasCreditProfile = p.hasBusinessCreditProfile === 'yes';
  const hasReportingAccounts = p.hasReportingAccounts === 'yes';
  const isNewBusiness =
    p.businessAge === 'less_than_6_months' ||
    p.businessAge === '6_to_12_months' ||
    !p.businessAge;
  const hasStrongPersonalCredit =
    p.personalCreditRange === '720_plus' || p.personalCreditRange === '680_to_719';
  const hasLimitedPersonalCredit =
    p.personalCreditRange === 'below_600' || p.personalCreditRange === '600_to_679';

  // Determine current active roadmap stage
  const currentStage = roadmap?.nextBestAction?.stage || 'foundation';

  const scored: RecommendedProduct[] = activeProducts.map((prod) => {
    let score = 50; // base score
    let reason =
      'This product may be relevant as you explore commercial trade lines and credit-building options.';

    // --- Rule 1: Foundational Banking & Entity Setup ---
    if (!hasBank && prod.category === 'business_banking') {
      score += 45;
      reason =
        'Your profile indicates you need a dedicated commercial bank account. Separating business and personal finances is an essential requirement for lenders.';
    } else if (hasBank && prod.category === 'business_banking') {
      score -= 25; // User already has bank account
      reason =
        'You already reported a business bank account. You can explore this if you are seeking secondary accounts or cash-management sub-accounts.';
    }

    if (!hasEIN && prod.category === 'business_services') {
      score += 40;
      reason =
        'Establishing your legal business entity and obtaining an EIN is the first requirement before commercial credit bureaus will track your business.';
    }

    // --- Rule 2: No Credit Profile Established ---
    if (!hasCreditProfile) {
      if (prod.category === 'business_credit_builders') {
        score += 40;
        reason =
          'You are currently working on establishing your business-credit foundation. This account reports directly to commercial bureaus without requiring prior credit history.';
      } else if (prod.category === 'net_30') {
        score += 35;
        reason =
          'Tier-1 vendor accounts offer trade credit with straightforward requirements, helping you establish initial payment experiences with Dun & Bradstreet.';
      } else if (prod.category === 'business_credit_cards') {
        score -= 20; // Premature to recommend revolving cards
        reason =
          'Revolving business credit cards typically require established bureau history or cash reserves. Review foundational requirements before applying.';
      }
    }

    // --- Rule 3: Credit Profile Confirmed, but No Reporting Accounts ---
    if (hasCreditProfile && !hasReportingAccounts) {
      if (prod.category === 'net_30') {
        score += 45;
        reason =
          'Your business has a credit profile, but needs active reporting trade lines. Vendor accounts with confirmed bureau reporting build verifiable payment depth.';
      } else if (prod.category === 'business_credit_builders') {
        score += 35;
        reason =
          'Adding regular recurring payments or installment lines reinforces your trade line count across major commercial bureaus.';
      }
    }

    // --- Rule 4: Established Trade Lines & History ---
    if (hasReportingAccounts) {
      if (prod.category === 'net_60') {
        score += 40;
        reason =
          'With established trade lines, your business can explore extended net-60 vendor terms to increase available trade credit depth.';
      } else if (prod.category === 'business_credit_cards') {
        if (prod.personalGuaranteeRequired === 'no') {
          score += 40;
          reason =
            'Your business has reporting credit history. You may explore corporate cards that evaluate operating cash flow without requiring a personal guarantee.';
        } else if (hasStrongPersonalCredit) {
          score += 35;
          reason =
            'Your established reporting trade lines combined with strong personal credit make commercial credit lines and cards potentially suitable.';
        }
      }
    }

    // --- Rule 5: Business Age Considerations ---
    if (isNewBusiness) {
      if (prod.typicalBusinessAge === 'No minimum') {
        score += 10;
        if (prod.category === 'net_30' || prod.category === 'business_credit_builders') {
          reason += ' Designed for newer businesses with no minimum time-in-business requirement.';
        }
      } else if (prod.typicalBusinessAge?.includes('6+') || prod.typicalBusinessAge?.includes('1+')) {
        score -= 25; // May require more time in business
      }
    }

    // --- Rule 6: Personal Guarantee & Credit Constraints ---
    if (hasLimitedPersonalCredit && prod.personalGuaranteeRequired === 'no') {
      score += 15;
      reason += ' Requires zero personal credit check and no personal guarantee.';
    } else if (hasLimitedPersonalCredit && prod.personalGuaranteeRequired === 'yes') {
      score -= 25;
    }

    // --- Rule 7: Stage Synergy ---
    if (prod.recommendedStage === currentStage) {
      score += 10;
    }

    // Feature boost
    if (prod.featured) {
      score += 5;
    }

    // --- Rule 8: Admin Recommendation Priority ---
    // Priority: 1 = High (+15), 2 = Standard (+0), 3 = Deprioritized (-15)
    if (prod.priority === 1) {
      score += 15;
    } else if (prod.priority === 3) {
      score -= 15;
    }

    // Assign Match Label
    let matchLabel: MatchLabel = 'Explore';
    if (score >= 80) {
      matchLabel = 'Strong Match';
    } else if (score >= 60) {
      matchLabel = 'Potential Match';
    } else {
      matchLabel = 'Explore';
    }

    return {
      ...prod,
      matchScore: score,
      matchLabel,
      recommendationReason: reason.trim(),
    };
  });

  // Sort by matchScore descending (highest relevance first), tiebreak with priority
  return scored.sort((a, b) => b.matchScore - a.matchScore || (a.priority || 2) - (b.priority || 2));
}
