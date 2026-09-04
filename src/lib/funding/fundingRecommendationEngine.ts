import type { BusinessProfile } from '@/types/business';
import type {
  FundingProduct,
  FundingMatchResult,
  FundingMatchLevel,
} from '@/types/fundingProduct';

function parseBusinessAgeMonths(age?: string): number | null {
  if (!age || age === 'not_sure' || age === 'Not sure') return null;
  switch (age) {
    case '5+ years':
      return 60;
    case '3+ years':
    case '2–5 years':
      return 36;
    case '1–2 years':
      return 18;
    case '6–12 months':
      return 9;
    case 'Less than 6 months':
    case '3–6 months':
      return 4;
    case 'Less than 3 months':
      return 1;
    default:
      return null;
  }
}

function parseRevenueNumber(rev?: string): number | null {
  if (!rev || rev === 'not_sure' || rev === 'Not sure') return null;
  switch (rev) {
    case '$1,000,000+':
      return 1000000;
    case '$500,000+':
      return 500000;
    case '$250,000–$500,000':
      return 250000;
    case '$100,000–$250,000':
      return 100000;
    case '$50,000–$100,000':
      return 50000;
    case '$10,000–$50,000':
      return 25000;
    case 'Under $10,000':
    case 'Pre-revenue':
      return 5000;
    default:
      return null;
  }
}

function parseMinRevenueRequirement(revStr?: string): number {
  if (!revStr || revStr === '$0' || revStr.toLowerCase() === 'none') return 0;
  if (revStr.includes('250,000')) return 250000;
  if (revStr.includes('100,000')) return 100000;
  if (revStr.includes('50,000')) return 50000;
  if (revStr.includes('25,000')) return 25000;
  const num = parseInt(revStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function parsePersonalCreditScore(tier?: string): number | null {
  if (!tier || tier === 'not_sure' || tier === 'Not sure') return null;
  switch (tier) {
    case '720+':
    case '720–850':
    case 'Excellent (720+)':
      return 740;
    case '680–719':
    case 'Good (680–719)':
      return 700;
    case '640–679':
    case 'Fair (640–679)':
      return 660;
    case '600–639':
      return 620;
    case 'Under 600':
    case 'Poor':
      return 550;
    default:
      return null;
  }
}

function parseMinPersonalCreditRequirement(creditStr?: string): number {
  if (!creditStr || creditStr.toLowerCase() === 'none' || creditStr === 'No minimum') return 0;
  const num = parseInt(creditStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Deterministic recommendation matching engine for commercial funding options.
 * Zero AI / Zero external API dependency.
 */
export function matchFundingProducts(
  profile: Partial<BusinessProfile> | null,
  fundingReadinessScore: number,
  products: FundingProduct[]
): FundingMatchResult[] {
  const p = profile || {};
  const activeProducts = products.filter((item) => item.status === 'active');

  const anyProfile = p as any;
  const userAgeMonths = parseBusinessAgeMonths(p.businessAge || anyProfile.business_age);
  const userRevenue = parseRevenueNumber(p.annualRevenueRange || anyProfile.annualRevenue || anyProfile.annual_revenue_range);
  const userCredit = parsePersonalCreditScore(p.personalCreditRange || anyProfile.personalCreditScoreRange || anyProfile.personal_credit_range);
  const hasBizCredit = p.hasBusinessCreditProfile || anyProfile.has_business_credit_profile;
  const rawPurpose = Array.isArray(p.fundingPurpose)
    ? p.fundingPurpose.join(' ')
    : (p.fundingPurpose || anyProfile.fundingGoal || anyProfile.funding_purpose || '');
  const userGoal = String(rawPurpose || '');

  const results: FundingMatchResult[] = activeProducts.map((product) => {
    let score = 50; // Baseline neutrality
    const verificationNotes: string[] = [];
    const matchedStrengths: string[] = [];
    let hasDisqualification = false;
    let hasUnverifiedKeyField = false;

    // 1. Business Age Evaluation
    if (product.minBusinessAgeMonths > 0) {
      if (userAgeMonths === null) {
        verificationNotes.push('Business operating longevity needs verification with provider.');
        hasUnverifiedKeyField = true;
      } else if (userAgeMonths >= product.minBusinessAgeMonths) {
        score += 15;
        matchedStrengths.push('Operating longevity aligns with criteria');
      } else {
        score -= 25;
        hasDisqualification = true;
      }
    } else {
      score += 5; // Open to new entities
    }

    // 2. Annual Revenue Evaluation
    const reqRevenue = parseMinRevenueRequirement(product.minAnnualRevenue);
    if (reqRevenue > 0) {
      if (userRevenue === null) {
        verificationNotes.push('Annual revenue range should be verified with provider.');
        hasUnverifiedKeyField = true;
      } else if (userRevenue >= reqRevenue) {
        score += 15;
        matchedStrengths.push('Reported revenue meets baseline threshold');
      } else {
        score -= 25;
        hasDisqualification = true;
      }
    } else {
      score += 5;
    }

    // 3. Personal Credit Evaluation
    const reqCredit = parseMinPersonalCreditRequirement(product.minPersonalCredit);
    if (reqCredit > 0) {
      if (userCredit === null) {
        verificationNotes.push('Personal credit tier should be verified with provider.');
        hasUnverifiedKeyField = true;
      } else if (userCredit >= reqCredit) {
        score += 10;
        matchedStrengths.push('Personal credit tier satisfies provider baseline');
      } else {
        score -= 20;
        hasDisqualification = true;
      }
    }

    // 4. Commercial Business Credit Required
    if (product.businessCreditRequired === 'yes') {
      if (hasBizCredit === 'yes') {
        score += 10;
        matchedStrengths.push('Active commercial credit profile established');
      } else if (hasBizCredit === 'not_sure') {
        verificationNotes.push('Verify whether business credit profile is registered with commercial bureaus.');
        hasUnverifiedKeyField = true;
      } else {
        score -= 20;
        hasDisqualification = true;
      }
    }

    // 5. Funding Purpose Alignment
    if (userGoal && product.fundingPurposes && product.fundingPurposes.length > 0) {
      const normalizedGoal = userGoal.toLowerCase();
      const matchesGoal = product.fundingPurposes.some((purpose) =>
        normalizedGoal.includes(purpose.toLowerCase()) || purpose.toLowerCase().includes(normalizedGoal)
      );
      if (matchesGoal) {
        score += 15;
        matchedStrengths.push(`Directly matches your stated focus on ${userGoal}`);
      }
    }

    // 6. Funding Readiness Adjustment
    if (fundingReadinessScore >= 70) {
      score += 10;
    } else if (fundingReadinessScore < 40) {
      score -= 5;
    }

    // 7. Admin Priority Boost
    // Priority 1 = +10, Priority 2 = 0, Priority 3 = -10
    if (product.priority === 1) score += 10;
    if (product.priority === 3) score -= 10;
    if (product.featured) score += 5;

    // 8. Match Level Classification
    let matchLevel: FundingMatchLevel = 'Explore';

    if (!hasDisqualification && !hasUnverifiedKeyField && score >= 75) {
      matchLevel = 'Strong Match';
    } else if (!hasDisqualification && (score >= 50 || hasUnverifiedKeyField)) {
      matchLevel = 'Potential Match';
    } else {
      matchLevel = 'Explore';
    }

    // 9. Deterministic "Why this fits" narrative
    let whyThisFits = '';
    if (matchedStrengths.length >= 2) {
      whyThisFits = `Your reported business information (${matchedStrengths.slice(0, 2).join(', ').toLowerCase()}) aligns well with the baseline parameters for this option.`;
    } else if (matchedStrengths.length === 1) {
      whyThisFits = `${matchedStrengths[0]}. Review provider terms for specific underwriting details.`;
    } else if (hasUnverifiedKeyField) {
      whyThisFits = 'This option may fit your general profile, though some requirements (such as operating longevity or revenue) still need verification with the provider.';
    } else if (product.minBusinessAgeMonths <= 3) {
      whyThisFits = 'Accessible option with minimal operational history requirements, suitable for earlier stage businesses.';
    } else {
      whyThisFits = 'Explore this provider to evaluate whether their terms and capital structure suit your current business priorities.';
    }

    // 10. Requirement Summary
    const requirementSummary = {
      minAge: product.minBusinessAgeMonths > 0 ? `${product.minBusinessAgeMonths}+ months in business` : 'No minimum age',
      minRevenue: product.minAnnualRevenue && product.minAnnualRevenue !== '$0' ? `${product.minAnnualRevenue}/year` : 'No minimum revenue',
      minCredit: product.minPersonalCredit && product.minPersonalCredit !== 'None' ? `${product.minPersonalCredit} personal score` : 'No minimum credit score',
      fundingRange: product.minFundingAmount && product.maxFundingAmount
        ? `$${product.minFundingAmount.toLocaleString()} – $${product.maxFundingAmount.toLocaleString()}`
        : 'Varies by provider',
    };

    return {
      product,
      matchLevel,
      score,
      whyThisFits,
      verificationNotes,
      requirementSummary,
    };
  });

  // Sort by match level priority, then score descending, then product priority ascending
  const levelWeights: Record<FundingMatchLevel, number> = {
    'Strong Match': 300,
    'Potential Match': 200,
    'Explore': 100,
  };

  return results.sort((a, b) => {
    const weightDiff = levelWeights[b.matchLevel] - levelWeights[a.matchLevel];
    if (weightDiff !== 0) return weightDiff;
    if (b.score !== a.score) return b.score - a.score;
    return a.product.priority - b.product.priority;
  });
}
