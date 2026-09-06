import type { BusinessProfile } from '../../types/business';
import type {
  FundingProduct,
  FundingMatchResult,
  FundingMatchLevel,
} from '../../types/fundingProduct';

function parseBusinessAgeMonths(age?: string | number): number | null {
  if (typeof age === 'number') return age;
  if (!age || age === 'not_sure' || age === 'Not sure') return null;
  const clean = String(age).replace(/[–—]/g, '-').trim();
  if (clean.includes('5+')) return 60;
  if (clean.includes('3+') || clean.includes('2-5') || clean.includes('3-5')) return 36;
  if (clean.includes('1-2')) return 18;
  if (clean.includes('6-12')) return 9;
  if (clean.includes('3-6')) return 4;
  if (clean.toLowerCase().includes('less than') || clean.toLowerCase().includes('startup')) return 1;
  const num = parseInt(clean.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
}

function parseRevenueNumber(rev?: string | number): number | null {
  if (typeof rev === 'number') return rev;
  if (!rev || rev === 'not_sure' || rev === 'Not sure') return null;
  const clean = String(rev).replace(/[–—]/g, '-').trim();
  if (clean.includes('1,000,000') || clean.includes('1M')) return 1000000;
  if (clean.includes('500,000')) return 500000;
  if (clean.includes('250,000')) return 250000;
  if (clean.includes('100,000')) return 100000;
  if (clean.includes('50,000')) return 50000;
  if (clean.includes('25,000') || clean.includes('10,000')) return 25000;
  if (clean.toLowerCase().includes('under') || clean.toLowerCase().includes('pre-revenue')) return 5000;
  const num = parseInt(clean.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
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

function parsePersonalCreditScore(tier?: string | number): number | null {
  if (typeof tier === 'number') return tier;
  if (!tier || tier === 'not_sure' || tier === 'Not sure') return null;
  const clean = String(tier).replace(/[–—]/g, '-').trim();
  if (clean.includes('720+') || clean.includes('720-850') || clean.toLowerCase().includes('excellent')) return 740;
  if (clean.includes('680-719') || clean.toLowerCase().includes('good')) return 700;
  if (clean.includes('640-679') || clean.toLowerCase().includes('fair')) return 660;
  if (clean.includes('600-639')) return 620;
  if (clean.toLowerCase().includes('under') || clean.toLowerCase().includes('poor') || clean.includes('580-619') || clean.toLowerCase().includes('below 580')) return 550;
  const num = parseInt(clean.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
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
    const checklistMet: string[] = [];
    const checklistPending: string[] = [];
    const nextStepsToImprove: string[] = [];
    let hasDisqualification = false;
    let hasUnverifiedKeyField = false;
    const isGrant = product.category === 'Grant';

    // =========================================================================
    // 1. Business Age Evaluation
    // =========================================================================
    if (product.minBusinessAgeMonths > 0) {
      if (userAgeMonths === null) {
        verificationNotes.push('Business operating longevity needs verification with provider.');
        checklistPending.push(`Operating age requirement: ${product.minBusinessAgeMonths}+ months (unverified)`);
        hasUnverifiedKeyField = true;
      } else if (userAgeMonths >= product.minBusinessAgeMonths) {
        score += 15;
        matchedStrengths.push('Operating longevity aligns with criteria');
        checklistMet.push(`Operating age requirement satisfied (${product.minBusinessAgeMonths}+ months)`);
      } else {
        score -= 25;
        hasDisqualification = true;
        checklistPending.push(`Operating seasoning needed (requires ${product.minBusinessAgeMonths} months)`);
        nextStepsToImprove.push(`Build operational seasoning towards ${product.minBusinessAgeMonths} months (Milestone #13)`);
      }
    } else {
      score += 5; // Open to new entities
      checklistMet.push('Open to new and early-stage entities');
    }

    // =========================================================================
    // 2. Annual Revenue Evaluation
    // =========================================================================
    const reqRevenue = parseMinRevenueRequirement(product.minAnnualRevenue);
    if (reqRevenue > 0) {
      if (userRevenue === null) {
        verificationNotes.push('Annual revenue range should be verified with provider.');
        checklistPending.push(`Revenue requirement: ${product.minAnnualRevenue}/yr (unverified)`);
        hasUnverifiedKeyField = true;
      } else if (userRevenue >= reqRevenue) {
        score += 15;
        matchedStrengths.push('Reported revenue meets baseline threshold');
        checklistMet.push(`Reported revenue satisfies baseline (${product.minAnnualRevenue}/yr)`);
      } else {
        score -= 25;
        hasDisqualification = true;
        checklistPending.push(`Annual revenue threshold: requires ${product.minAnnualRevenue}/yr`);
        nextStepsToImprove.push(`Grow operating business deposits and revenue documentation (Milestone #13)`);
      }
    } else {
      score += 5;
      checklistMet.push('No minimum revenue requirement');
    }

    // =========================================================================
    // 3. Personal Credit Evaluation (Skipped for Grants)
    // =========================================================================
    if (!isGrant) {
      const reqCredit = parseMinPersonalCreditRequirement(product.minPersonalCredit);
      if (reqCredit > 0) {
        if (userCredit === null) {
          verificationNotes.push('Personal credit tier should be verified with provider.');
          checklistPending.push(`Credit tier requirement: ${product.minPersonalCredit} (unverified)`);
          hasUnverifiedKeyField = true;
        } else if (userCredit >= reqCredit) {
          score += 10;
          matchedStrengths.push('Personal credit tier satisfies provider baseline');
          checklistMet.push(`Personal credit satisfies baseline (${product.minPersonalCredit})`);
        } else {
          score -= 20;
          hasDisqualification = true;
          checklistPending.push(`Credit baseline: ${product.minPersonalCredit} required`);
          nextStepsToImprove.push(`Strengthen credit profile and maintain revolving utilization under 30% (Milestone #10)`);
        }
      } else {
        checklistMet.push('No minimum personal credit score requirement');
      }
    } else {
      checklistMet.push('Non-dilutive grant award: zero credit check required');
    }

    // =========================================================================
    // 4. Commercial Business Credit Required
    // =========================================================================
    if (product.businessCreditRequired === 'yes') {
      if (hasBizCredit === 'yes' || hasBizCredit === true) {
        score += 10;
        matchedStrengths.push('Active commercial credit profile established');
        checklistMet.push('Active commercial credit bureau profile established');
      } else if (hasBizCredit === 'not_sure') {
        verificationNotes.push('Verify whether business credit profile is registered with commercial bureaus.');
        checklistPending.push('Commercial bureau profile registration (pending verification)');
        hasUnverifiedKeyField = true;
      } else {
        score -= 20;
        hasDisqualification = true;
        checklistPending.push('Commercial bureau registration required');
        nextStepsToImprove.push(`Register and activate D-U-N-S and bureau file (Milestone #06)`);
        nextStepsToImprove.push(`Establish tier-1 vendor Net-30 reporting tradelines (Milestone #07)`);
      }
    }

    // =========================================================================
    // 5. Funding Purpose Alignment
    // =========================================================================
    if (userGoal && product.fundingPurposes && product.fundingPurposes.length > 0) {
      const normalizedGoal = userGoal.toLowerCase();
      const matchesGoal = product.fundingPurposes.some((purpose) =>
        normalizedGoal.includes(purpose.toLowerCase()) || purpose.toLowerCase().includes(normalizedGoal)
      );
      if (matchesGoal) {
        score += 15;
        matchedStrengths.push(`Directly matches your stated focus on ${userGoal}`);
        checklistMet.push(`Matches purpose: ${userGoal}`);
      }
    }

    // =========================================================================
    // 6. Funding Readiness Adjustment
    // =========================================================================
    if (fundingReadinessScore >= 70) {
      score += 15;
    } else if (fundingReadinessScore >= 50) {
      score += 5;
    } else if (fundingReadinessScore < 30 && (product.category === 'SBA-related Financing' || product.minBusinessAgeMonths >= 24)) {
      score -= 20;
      hasDisqualification = true;
      nextStepsToImprove.push('Complete foundational readiness milestones (Milestones #01 to #05)');
    }

    // =========================================================================
    // 7. Admin Priority Boost
    // =========================================================================
    if (product.priority === 1) score += 10;
    if (product.priority === 3) score -= 10;
    if (product.featured) score += 5;

    // =========================================================================
    // 8. Match Level Classification (Never fake approval)
    // =========================================================================
    let matchLevel: FundingMatchLevel = 'Possible Match';

    if (isGrant) {
      matchLevel = score >= 50 ? 'Strong Match' : 'Possible Match';
    } else if (hasDisqualification) {
      matchLevel = 'Not Ready Yet';
    } else if (!hasUnverifiedKeyField && score >= 70) {
      matchLevel = 'Strong Match';
    } else {
      matchLevel = 'Possible Match';
    }

    // =========================================================================
    // 9. Deterministic "Why this fits" narrative
    // =========================================================================
    let whyThisFits = '';
    if (matchLevel === 'Strong Match') {
      if (isGrant) {
        whyThisFits = 'Your business profile is eligible to apply for this non-dilutive grant opportunity. Zero repayment required.';
      } else if (matchedStrengths.length >= 2) {
        whyThisFits = `Your reported business profile (${matchedStrengths.slice(0, 2).join(', ').toLowerCase()}) aligns strongly with the baseline parameters for this option.`;
      } else {
        whyThisFits = 'Your profile appears consistent with provider underwriting baselines based on reported information.';
      }
    } else if (matchLevel === 'Possible Match') {
      if (hasUnverifiedKeyField) {
        whyThisFits = 'You may fit the basic profile for this option, but additional documentation (such as banking activity or operating history) may be required.';
      } else {
        whyThisFits = 'Potential preliminary fit. Review provider criteria and terms to confirm your specific business eligibility.';
      }
    } else {
      whyThisFits = 'Your current readiness profile suggests completing additional foundational or credit-building steps before pursuing this financing option.';
    }

    // =========================================================================
    // 10. Requirement Summary
    // =========================================================================
    const requirementSummary = {
      minAge: product.minBusinessAgeMonths > 0 ? `${product.minBusinessAgeMonths}+ months in business` : 'No minimum age',
      minRevenue: product.minAnnualRevenue && product.minAnnualRevenue !== '$0' ? `${product.minAnnualRevenue}/year` : 'No minimum revenue',
      minCredit: isGrant
        ? 'None (Grant)'
        : product.minPersonalCredit && product.minPersonalCredit !== 'None'
        ? `${product.minPersonalCredit} personal score`
        : 'No minimum credit score',
      fundingRange: product.minFundingAmount && product.maxFundingAmount
        ? `$${product.minFundingAmount.toLocaleString()} – $${product.maxFundingAmount.toLocaleString()}`
        : 'Varies by provider',
      repayment: product.typicalTermRange || (product.repaymentType || (isGrant ? 'Non-repayable Grant' : 'Fixed Term')),
      rates: product.rateTermsInfo || 'Rate/terms determined by provider',
    };

    return {
      product,
      matchLevel,
      score,
      whyThisFits,
      verificationNotes,
      requirementSummary,
      checklistMet,
      checklistPending,
      nextStepsToImprove,
      isGrant,
    };
  });

  // Sort: Strong Match first, then Possible Match, then Not Ready Yet; then score descending
  const levelWeights: Record<FundingMatchLevel, number> = {
    'Strong Match': 300,
    'Possible Match': 200,
    'Potential Match': 200,
    'Explore': 150,
    'Not Ready Yet': 100,
  };

  return results.sort((a, b) => {
    const weightDiff = (levelWeights[b.matchLevel] || 0) - (levelWeights[a.matchLevel] || 0);
    if (weightDiff !== 0) return weightDiff;
    if (b.score !== a.score) return b.score - a.score;
    return a.product.priority - b.product.priority;
  });
}
