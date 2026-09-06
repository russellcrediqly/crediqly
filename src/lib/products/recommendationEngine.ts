import { BusinessProfile } from '@/types/business';
import { RoadmapResult } from '@/lib/roadmap/types';
import { Product, RecommendedProduct, MatchLabel, MatchIndicator } from '@/types/product';

/**
 * Deterministic rule-based product recommendation engine.
 *
 * Evaluates the user's business profile, roadmap stage, and funding readiness score
 * to score and rank products with objective match indicators and transparent rationale.
 *
 * Strictly zero AI / zero machine learning dependency.
 * Compliance Note: All outputs are educational estimates based on user-reported data.
 */
export function getRecommendedProducts(
  business: Partial<BusinessProfile> | null,
  roadmap: RoadmapResult | null,
  products: Product[],
  fundingReadinessScore: number = 50
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
    p.businessAge === 'Less than 6 months' ||
    p.businessAge === 'Less than 3 months' ||
    !p.businessAge;
  const isEstablished =
    p.businessAge === '1_to_2_years' ||
    p.businessAge === '2_plus_years' ||
    p.businessAge === '1–2 years' ||
    p.businessAge === '2–5 years' ||
    p.businessAge === '3+ years' ||
    p.businessAge === '5+ years';

  const hasStrongPersonalCredit =
    p.personalCreditRange === '720_plus' ||
    p.personalCreditRange === '680_to_719' ||
    p.personalCreditRange === '720+' ||
    p.personalCreditRange === '680–719';
  const hasLimitedPersonalCredit =
    p.personalCreditRange === 'below_600' ||
    p.personalCreditRange === '600_to_679' ||
    p.personalCreditRange === 'Under 600' ||
    p.personalCreditRange === '600–639';

  // Determine current active roadmap stage
  const currentStage = roadmap?.nextBestAction?.stage || 'foundation';

  const scored: RecommendedProduct[] = activeProducts.map((prod) => {
    let score = 50; // base score
    let reason =
      'Based on the information in your Crediqly profile, this product may help you establish and expand commercial trade experiences.';

    // --- Rule 1: Foundational Banking & Entity Setup ---
    if (!hasBank && prod.category === 'business_banking') {
      score += 45;
      reason =
        'Your profile indicates you need a dedicated commercial bank account. Separating business and personal finances is an essential requirement for lenders.';
    } else if (hasBank && prod.category === 'business_banking') {
      score -= 25;
      reason =
        'You already reported an active business bank account. You can explore this if you need secondary cash-management accounts.';
    }

    if (!hasEIN && prod.category === 'business_services') {
      score += 40;
      reason =
        'Establishing your legal business entity and obtaining an EIN is the first requirement before commercial credit bureaus will track your business.';
    }

    // --- Rule 2: Net-30 Vendors (Foundational Trade Lines) ---
    if (prod.category === 'net_30') {
      if (!hasReportingAccounts || !hasCreditProfile) {
        score += 40;
        reason =
          'Tier-1 vendor accounts offer trade credit with accessible requirements, helping you build initial payment experiences with commercial credit bureaus.';
      } else if (hasReportingAccounts && isNewBusiness) {
        score += 30;
        reason =
          'Adding additional active vendor lines strengthens trade payment depth and reinforces your commercial bureau profile.';
      } else {
        score += 20;
        reason =
          'Vendor accounts provide 30-day payment terms for everyday supplies while maintaining consistent reporting activity.';
      }
    }

    // --- Rule 3: Business Credit Builders ---
    if (prod.category === 'business_credit_builders') {
      if (!hasCreditProfile) {
        score += 40;
        reason =
          'You are currently establishing your business-credit foundation. This account reports directly to commercial bureaus without requiring prior credit history.';
      } else if (!hasReportingAccounts) {
        score += 35;
        reason =
          'Adding regular recurring payments or installment lines reinforces your trade line count across major commercial bureaus.';
      } else {
        score += 15;
      }
    }

    // --- Rule 4: Business Credit Cards ---
    if (prod.category === 'business_credit_cards') {
      if (!hasBank) {
        score -= 30;
        reason =
          'Commercial card issuers typically require an active dedicated business bank account. Establish your business banking first.';
      } else if (!hasCreditProfile && !hasStrongPersonalCredit && prod.personalGuaranteeRequired === 'yes') {
        score -= 20;
        reason =
          'Revolving cards with personal guarantees look for established commercial history or good personal credit. Consider building tier-1 vendor lines first.';
      } else if (prod.personalGuaranteeRequired === 'no') {
        if (isEstablished || fundingReadinessScore >= 65) {
          score += 40;
          reason =
            'Your business operating profile makes corporate charge cards with zero personal guarantee a strong potential fit.';
        } else {
          score += 15;
          reason =
            'Corporate charge cards evaluate business cash balances and monthly revenue rather than owner personal credit.';
        }
      } else if (hasStrongPersonalCredit || fundingReadinessScore >= 70) {
        score += 35;
        reason =
          'Based on your reported credit profile and readiness progress, you may be a potential fit for revolving commercial rewards cards.';
      } else if (hasReportingAccounts) {
        score += 20;
        reason =
          'Your active reporting tradelines provide verifiable payment history that supports commercial credit card applications.';
      }
    }

    // --- Rule 5: Extended Net-60 Terms ---
    if (prod.category === 'net_60') {
      if (hasReportingAccounts && (isEstablished || fundingReadinessScore >= 60)) {
        score += 35;
        reason =
          'With established trade lines, your business can explore extended net-60 terms to increase available trade credit depth.';
      } else {
        score -= 10;
        reason =
          'Net-60 vendor terms usually require 6+ months in business or prior payment experiences with tier-1 suppliers.';
      }
    }

    // --- Rule 6: Time in Business Considerations ---
    if (isNewBusiness) {
      if (prod.typicalBusinessAge === 'No minimum') {
        score += 10;
        if (prod.category === 'net_30' || prod.category === 'business_credit_builders') {
          reason += ' Designed for newer businesses with no minimum time-in-business requirement.';
        }
      } else if (prod.typicalBusinessAge?.includes('6+') || prod.typicalBusinessAge?.includes('1+')) {
        score -= 20;
      }
    }

    // --- Rule 7: Personal Guarantee & Credit Constraints ---
    if (hasLimitedPersonalCredit && prod.personalGuaranteeRequired === 'no') {
      score += 15;
      reason += ' Evaluated without personal credit inquiry and requires no personal guarantee.';
    } else if (hasLimitedPersonalCredit && prod.personalGuaranteeRequired === 'yes') {
      score -= 20;
    }

    // --- Rule 8: Readiness Score Multiplier ---
    if (fundingReadinessScore >= 70) {
      if (prod.category === 'business_credit_cards' || prod.category === 'net_60') {
        score += 10;
      }
    } else if (fundingReadinessScore < 45) {
      if (prod.category === 'business_credit_cards') {
        score -= 15;
      }
    }

    // --- Rule 9: Stage Synergy & Featured Flag ---
    if (prod.recommendedStage === currentStage) {
      score += 10;
    }
    if (prod.featured) {
      score += 5;
    }

    // --- Rule 10: Admin Recommendation Priority ---
    // Priority: 1 = High (+15), 2 = Standard (+0), 3 = Deprioritized (-15)
    if (prod.priority === 1) {
      score += 15;
    } else if (prod.priority === 3) {
      score -= 15;
    }

    // Assign Match Label & Indicator
    let matchLabel: MatchLabel;
    let matchIndicator: MatchIndicator;

    if (score >= 75) {
      matchLabel = 'Strong Potential Match';
      matchIndicator = 'strong';
    } else if (score >= 50) {
      matchLabel = 'Possible Match';
      matchIndicator = 'possible';
    } else {
      matchLabel = 'Improve Readiness First';
      matchIndicator = 'improve_readiness';
      reason =
        'Improve readiness first: We suggest establishing active reporting tradelines and updating operating documentation before applying.';
    }

    return {
      ...prod,
      matchScore: score,
      matchLabel,
      matchIndicator,
      recommendationReason: reason.trim(),
    };
  });

  // Sort by matchScore descending (highest relevance first), tiebreak with priority
  return scored.sort((a, b) => b.matchScore - a.matchScore || (a.priority || 2) - (b.priority || 2));
}
