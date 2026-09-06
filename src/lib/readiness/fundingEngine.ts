import type { BusinessProfile } from '@/types/business';
import { calculateMilestoneReadiness } from './readinessMilestoneEngine';
import type {
  FundingReadinessResult,
  FundingReadinessLevel,
  FundingCategoryScore,
  FundingFactor,
  FundingNextAction,
} from '@/types/funding';

/**
 * Deterministic rule-based engine that evaluates Funding Readiness
 * strictly from user business profile data.
 * Zero AI / Zero external API dependency.
 */

export function getFundingReadinessLevel(score: number): FundingReadinessLevel {
  if (score >= 85) return 'Strong Readiness';
  if (score >= 70) return 'Funding Ready';
  if (score >= 50) return 'Developing';
  if (score >= 30) return 'Building Readiness';
  return 'Getting Started';
}

export function getFundingReadinessDescription(level: FundingReadinessLevel): string {
  switch (level) {
    case 'Strong Readiness':
      return 'Your business currently shows strong funding readiness across foundation, commercial credit, and financial indicators based on the information you’ve provided.';
    case 'Funding Ready':
      return 'Your business appears reasonably prepared for funding based on the information provided, though individual lenders maintain specific underwriting requirements.';
    case 'Developing':
      return 'Your business has established a solid core foundation and should now focus on strengthening reporting trade lines and financial documentation.';
    case 'Building Readiness':
      return 'Your business has some fundamentals in place, but several essential credit and financial milestones must be completed to improve funding preparedness.';
    case 'Getting Started':
    default:
      return 'Your business is at the beginning of its journey. Establishing your business entity, EIN, and commercial banking is recommended before pursuing business funding.';
  }
}

/**
 * Evaluates business operating age score points (Max 10)
 */
function calculateAgePoints(age?: string): number {
  switch (age) {
    case '5+ years':
    case '3+ years':
    case '2–5 years':
      return 10;
    case '1–2 years':
      return 7;
    case '6–12 months':
      return 4;
    case 'Less than 6 months':
    case '3–6 months':
    case 'Less than 3 months':
      return 2;
    default:
      return 0;
  }
}

/**
 * Evaluates annual revenue score points (Max 10)
 */
function calculateRevenuePoints(revenue?: string): number {
  switch (revenue) {
    case '$1,000,000+':
    case '$500,000+':
    case '$250,000–$500,000':
      return 10;
    case '$100,000–$250,000':
      return 8;
    case '$50,000–$100,000':
      return 5;
    case '$10,000–$50,000':
      return 3;
    case 'Pre-revenue':
    case 'Under $10,000':
      return 1;
    default:
      return 0;
  }
}

/**
 * Evaluates personal credit tier score points (Max 10)
 */
function calculatePersonalCreditPoints(range?: string): number {
  switch (range) {
    case '720+':
    case '720–850':
    case 'Excellent (720+)':
      return 10;
    case '680–719':
    case 'Good (680–719)':
      return 8;
    case '640–679':
    case 'Fair (640–679)':
      return 5;
    case '600–639':
      return 3;
    case 'Under 600':
    case 'Poor':
      return 1;
    default:
      // Neutral default if unspecified
      return 2;
  }
}

/**
 * Evaluates credit account count score points (Max 5)
 */
function calculateAccountCountPoints(count?: string): number {
  switch (count) {
    case '10+':
      return 5;
    case '6-10':
    case '4-5':
      return 4;
    case '2-3':
      return 3;
    case '1':
      return 2;
    case 'none':
    case 'not_sure':
    default:
      return 0;
  }
}

/**
 * Primary calculation function for Funding Readiness
 */
export function calculateFundingReadiness(
  profile: Partial<BusinessProfile> | null
): FundingReadinessResult {
  const p = profile || {};
  const calculatedAt = new Date().toISOString();

  // --------------------------------------------------------------------------
  // 1. BUSINESS FOUNDATION (Max 25 pts)
  // --------------------------------------------------------------------------
  let foundationScore = 0;
  const positiveFactors: FundingFactor[] = [];
  const improvementFactors: FundingFactor[] = [];

  // Entity Type: 5 pts
  const hasValidEntity = Boolean(p.entityType && p.entityType !== 'Not sure' && p.entityType !== 'Sole Proprietorship');
  if (hasValidEntity) {
    foundationScore += 5;
    positiveFactors.push({
      id: 'fact_entity',
      title: `Formal business entity established (${p.entityType})`,
      category: 'foundation',
      impact: 'high',
    });
  } else if (p.entityType === 'Sole Proprietorship') {
    foundationScore += 2;
    improvementFactors.push({
      id: 'imp_entity_corp',
      title: 'Form a formal legal entity (LLC or Corporation) to protect personal liability and strengthen corporate standing',
      category: 'foundation',
      impact: 'high',
    });
  } else {
    improvementFactors.push({
      id: 'imp_entity',
      title: 'Establish a formal business entity (LLC or Corporation)',
      category: 'foundation',
      isVerificationNeeded: p.entityType === 'Not sure',
      impact: 'high',
    });
  }

  // EIN: 5 pts
  if (p.hasEIN === 'yes') {
    foundationScore += 5;
    positiveFactors.push({
      id: 'fact_ein',
      title: 'Federal Employer Identification Number (EIN) active',
      category: 'foundation',
      impact: 'high',
    });
  } else {
    improvementFactors.push({
      id: 'imp_ein',
      title: p.hasEIN === 'not_sure' ? 'Verify whether your business has a Federal EIN assigned' : 'Obtain a Federal EIN from the IRS',
      category: 'foundation',
      isVerificationNeeded: p.hasEIN === 'not_sure',
      impact: 'high',
    });
  }

  // Business Bank Account: 5 pts
  if (p.hasBusinessBankAccount === 'yes') {
    foundationScore += 5;
    positiveFactors.push({
      id: 'fact_bank',
      title: 'Dedicated commercial bank account established',
      category: 'foundation',
      impact: 'high',
    });
  } else {
    improvementFactors.push({
      id: 'imp_bank',
      title: p.hasBusinessBankAccount === 'not_sure' ? 'Confirm dedicated commercial bank account separation' : 'Open a dedicated commercial bank account',
      category: 'foundation',
      isVerificationNeeded: p.hasBusinessBankAccount === 'not_sure',
      impact: 'high',
    });
  }

  // Website: 3 pts
  if (p.hasWebsite === 'yes') {
    foundationScore += 3;
    positiveFactors.push({
      id: 'fact_website',
      title: 'Professional business website published',
      category: 'foundation',
      impact: 'medium',
    });
  } else {
    improvementFactors.push({
      id: 'imp_website',
      title: p.hasWebsite === 'not_sure' ? 'Verify business website domain and email connection' : 'Publish a professional business website',
      category: 'foundation',
      isVerificationNeeded: p.hasWebsite === 'not_sure',
      impact: 'medium',
    });
  }

  // Phone: 2 pts
  if (p.hasBusinessPhone === 'yes') {
    foundationScore += 2;
    positiveFactors.push({
      id: 'fact_phone',
      title: 'Dedicated business phone number established',
      category: 'foundation',
      impact: 'low',
    });
  } else {
    improvementFactors.push({
      id: 'imp_phone',
      title: p.hasBusinessPhone === 'not_sure' ? 'Verify dedicated business phone registration' : 'Set up a dedicated business phone line',
      category: 'foundation',
      isVerificationNeeded: p.hasBusinessPhone === 'not_sure',
      impact: 'low',
    });
  }

  // Email: 2 pts
  if (p.hasBusinessEmail === 'yes') {
    foundationScore += 2;
    positiveFactors.push({
      id: 'fact_email',
      title: 'Professional domain-matching business email',
      category: 'foundation',
      impact: 'low',
    });
  } else {
    improvementFactors.push({
      id: 'imp_email',
      title: p.hasBusinessEmail === 'not_sure' ? 'Verify professional business email' : 'Set up a domain-matching business email',
      category: 'foundation',
      isVerificationNeeded: p.hasBusinessEmail === 'not_sure',
      impact: 'low',
    });
  }

  // Address: 2 pts
  if (p.hasBusinessAddress === 'yes') {
    foundationScore += 2;
    positiveFactors.push({
      id: 'fact_address',
      title: 'Commercial business address verified',
      category: 'foundation',
      impact: 'low',
    });
  } else {
    improvementFactors.push({
      id: 'imp_address',
      title: p.hasBusinessAddress === 'not_sure' ? 'Confirm commercial business address details' : 'Secure a commercial physical or virtual office address',
      category: 'foundation',
      isVerificationNeeded: p.hasBusinessAddress === 'not_sure',
      impact: 'low',
    });
  }

  // License: 1 pt
  if (p.hasBusinessLicense === 'yes' || p.hasBusinessLicense === 'not_applicable') {
    foundationScore += 1;
    positiveFactors.push({
      id: 'fact_license',
      title: 'Required business licenses verified or not applicable',
      category: 'foundation',
      impact: 'low',
    });
  } else {
    improvementFactors.push({
      id: 'imp_license',
      title: p.hasBusinessLicense === 'not_sure' ? 'Check state and local licensing requirements' : 'Obtain necessary municipal and state business licenses',
      category: 'foundation',
      isVerificationNeeded: p.hasBusinessLicense === 'not_sure',
      impact: 'low',
    });
  }

  // Cap foundation at 25
  foundationScore = Math.min(25, Math.max(0, foundationScore));

  // --------------------------------------------------------------------------
  // 2. BUSINESS CREDIT (Max 30 pts)
  // --------------------------------------------------------------------------
  let creditScore = 0;

  // Credit Profile: 10 pts
  if (p.hasBusinessCreditProfile === 'yes') {
    creditScore += 10;
    positiveFactors.push({
      id: 'fact_credit_profile',
      title: 'Commercial credit profile established with major business bureaus',
      category: 'credit',
      impact: 'high',
    });
  } else {
    improvementFactors.push({
      id: 'imp_credit_profile',
      title: p.hasBusinessCreditProfile === 'not_sure' ? 'Verify your business credit profile with Dun & Bradstreet, Experian, or Equifax' : 'Establish a business credit profile with major bureaus',
      category: 'credit',
      isVerificationNeeded: p.hasBusinessCreditProfile === 'not_sure',
      impact: 'high',
    });
  }

  // Reporting Accounts: 10 pts
  if (p.hasReportingAccounts === 'yes') {
    creditScore += 10;
    positiveFactors.push({
      id: 'fact_reporting_accounts',
      title: 'Active vendor or trade lines reporting to commercial credit bureaus',
      category: 'credit',
      impact: 'high',
    });
  } else {
    improvementFactors.push({
      id: 'imp_reporting_accounts',
      title: p.hasReportingAccounts === 'not_sure' ? 'Check if any current vendors or suppliers report payment history' : 'Open Tier-1 Net-30 vendor accounts that report monthly payments',
      category: 'credit',
      isVerificationNeeded: p.hasReportingAccounts === 'not_sure',
      impact: 'high',
    });
  }

  // Credit Accounts Count: Max 5 pts
  const accountCountPts = calculateAccountCountPoints(p.businessCreditAccountCount);
  creditScore += accountCountPts;
  if (accountCountPts >= 4) {
    positiveFactors.push({
      id: 'fact_account_count',
      title: `Multiple active credit accounts (${p.businessCreditAccountCount || '4+'}) strengthening score depth`,
      category: 'credit',
      impact: 'medium',
    });
  } else {
    improvementFactors.push({
      id: 'imp_account_count',
      title: 'Build at least 3–5 reporting trade accounts to satisfy automated underwriting thresholds',
      category: 'credit',
      impact: 'medium',
    });
  }

  // Business Credit Card: 3 pts
  if (p.hasBusinessCreditCard === 'yes') {
    creditScore += 3;
    positiveFactors.push({
      id: 'fact_card',
      title: 'Dedicated business credit card actively utilized',
      category: 'credit',
      impact: 'medium',
    });
  } else {
    improvementFactors.push({
      id: 'imp_card',
      title: p.hasBusinessCreditCard === 'not_sure' ? 'Confirm whether existing cards are dedicated to business use' : 'Apply for a secured or unsecured business credit card',
      category: 'credit',
      isVerificationNeeded: p.hasBusinessCreditCard === 'not_sure',
      impact: 'medium',
    });
  }

  // Known Bureau Score or D-U-N-S: 2 pts
  if (p.knowsBusinessCreditScore === 'yes' || p.hasDuns === 'yes') {
    creditScore += 2;
    positiveFactors.push({
      id: 'fact_duns_score',
      title: 'Commercial identifier (D-U-N-S) or bureau score monitored',
      category: 'credit',
      impact: 'low',
    });
  } else {
    improvementFactors.push({
      id: 'imp_duns',
      title: 'Obtain a free Dun & Bradstreet D-U-N-S number for your legal entity',
      category: 'credit',
      impact: 'low',
    });
  }

  // Cap credit at 30
  creditScore = Math.min(30, Math.max(0, creditScore));

  // --------------------------------------------------------------------------
  // 3. FINANCIAL READINESS (Max 25 pts)
  // --------------------------------------------------------------------------
  let financialScore = 0;

  // Operating Age / Longevity: Max 10 pts
  const agePts = calculateAgePoints(p.businessAge);
  financialScore += agePts;
  if (agePts >= 7) {
    positiveFactors.push({
      id: 'fact_age',
      title: `Seasoned operating history (${p.businessAge || '2+ years'})`,
      category: 'financial',
      impact: 'high',
    });
  } else {
    improvementFactors.push({
      id: 'imp_age',
      title: 'Season your business operations and maintain continuous positive banking history',
      category: 'financial',
      impact: 'medium',
    });
  }

  // Annual Revenue Range: Max 10 pts
  const revPts = calculateRevenuePoints(p.annualRevenueRange);
  financialScore += revPts;
  if (revPts >= 5) {
    positiveFactors.push({
      id: 'fact_revenue',
      title: `Established commercial cash flow (${p.annualRevenueRange || '$50k+'})`,
      category: 'financial',
      impact: 'high',
    });
  } else {
    improvementFactors.push({
      id: 'imp_revenue',
      title: 'Focus on consistent commercial deposits to establish baseline revenue qualifications',
      category: 'financial',
      impact: 'high',
    });
  }

  // Commercial Banking Separation: 5 pts
  if (p.hasBusinessBankAccount === 'yes') {
    financialScore += 5;
    positiveFactors.push({
      id: 'fact_banking_separation',
      title: 'Clean separation of personal and business operating capital',
      category: 'financial',
      impact: 'high',
    });
  }

  // Cap financial at 25
  financialScore = Math.min(25, Math.max(0, financialScore));

  // --------------------------------------------------------------------------
  // 4. CREDIT & FUNDING PROFILE (Max 20 pts)
  // --------------------------------------------------------------------------
  let profileScore = 0;

  // Personal Credit Tier: Max 10 pts
  const personalCreditPts = calculatePersonalCreditPoints(p.personalCreditRange);
  profileScore += personalCreditPts;
  if (personalCreditPts >= 8) {
    positiveFactors.push({
      id: 'fact_personal_credit',
      title: `Strong personal credit profile (${p.personalCreditRange || 'Good/Excellent'}) for personal guarantee flexibility`,
      category: 'profile',
      impact: 'high',
    });
  } else if (personalCreditPts <= 3 && p.personalCreditRange) {
    improvementFactors.push({
      id: 'imp_personal_credit',
      title: 'Strengthen personal credit standing (many small business loans review owner credit)',
      category: 'profile',
      impact: 'medium',
    });
  }

  // Prior Funding History: 5 pts
  if (p.hasFundingHistory === 'yes') {
    profileScore += 5;
    positiveFactors.push({
      id: 'fact_prior_funding',
      title: 'Proven track record of managing and repaying commercial credit or capital',
      category: 'profile',
      impact: 'medium',
    });
  } else {
    improvementFactors.push({
      id: 'imp_prior_funding',
      title: 'Build commercial credit relationships with smaller credit lines before seeking large funding',
      category: 'profile',
      impact: 'low',
    });
  }

  // Funding Goals Articulation: Max 5 pts
  const hasAmount = Boolean(p.fundingAmount && p.fundingAmount.trim() !== '');
  const hasPurposes = Boolean(p.fundingPurpose && p.fundingPurpose.length > 0);

  if (hasAmount && hasPurposes) {
    profileScore += 5;
    positiveFactors.push({
      id: 'fact_funding_goals',
      title: `Clearly articulated capital goal (${p.fundingAmount}) for designated commercial use`,
      category: 'profile',
      impact: 'low',
    });
  } else if (hasAmount || hasPurposes) {
    profileScore += 3;
  } else {
    profileScore += 1;
    improvementFactors.push({
      id: 'imp_funding_goals',
      title: 'Define target capital amounts and specific business use-case justifications',
      category: 'profile',
      impact: 'low',
    });
  }

  // Cap profile at 20
  profileScore = Math.min(20, Math.max(0, profileScore));

  // --------------------------------------------------------------------------
  // TOTAL SCORE & READINESS LEVEL (Calculated Strictly From Milestone Engine)
  // --------------------------------------------------------------------------
  const milestoneRes = calculateMilestoneReadiness(p);
  const score = milestoneRes.score;
  const level = getFundingReadinessLevel(score);
  const description = getFundingReadinessDescription(level);

  // --------------------------------------------------------------------------
  // DETERMINE SINGLE NEXT BEST ACTION (From Milestone Progression)
  // --------------------------------------------------------------------------
  let nextBestAction: FundingNextAction;
  if (milestoneRes.nextMilestone) {
    const nm = milestoneRes.nextMilestone;
    nextBestAction = {
      id: `act_${nm.id}`,
      title: nm.title,
      explanation: nm.whyItMatters,
      actionLabel: nm.actionLabel,
      actionHref: nm.actionHref,
      roadmapTaskKey: nm.roadmapTaskKey,
      priority: 'high',
    };
  } else {
    nextBestAction = {
      id: 'act_funding_ready',
      title: 'Explore Matched Funding Opportunities',
      explanation: 'All 14 readiness milestones are complete. Your business profile demonstrates strong institutional foundation and documentation.',
      actionLabel: 'Explore Funding Matches',
      actionHref: '/funding',
      priority: 'low',
    };
  }

  // --------------------------------------------------------------------------
  // PRIORITIZED LIST OF UP TO 5 ACTIONS
  // --------------------------------------------------------------------------
  const prioritizedActions: FundingNextAction[] = milestoneRes.items
    .filter((i) => !i.isCompleted)
    .slice(0, 5)
    .map((i) => ({
      id: `p_act_${i.definition.id}`,
      title: i.definition.title,
      explanation: i.definition.whyItMatters,
      actionLabel: i.definition.actionLabel,
      actionHref: i.definition.actionHref,
      roadmapTaskKey: i.definition.roadmapTaskKey,
      priority: i.isBlockedByPrereq ? 'medium' : 'high',
    }));

  // --------------------------------------------------------------------------
  // CATEGORIES BREAKDOWN (4 categories x 25 pts = exactly 100)
  // --------------------------------------------------------------------------
  const foundationCompletedPts = milestoneRes.items
    .filter((i) => i.definition.category === 'foundation' && i.isCompleted)
    .reduce((s, i) => s + i.definition.weight, 0);

  const creditCompletedPts = milestoneRes.items
    .filter((i) => i.definition.category === 'bureau_tradelines' && i.isCompleted)
    .reduce((s, i) => s + i.definition.weight, 0);

  const financialCompletedPts = milestoneRes.items
    .filter((i) => i.definition.category === 'revolving_seasoning' && i.isCompleted)
    .reduce((s, i) => s + i.definition.weight, 0);

  const profileCompletedPts = milestoneRes.items
    .filter((i) => i.definition.category === 'funding_readiness' && i.isCompleted)
    .reduce((s, i) => s + i.definition.weight, 0);

  const categories: FundingReadinessResult['categories'] = {
    foundation: {
      category: 'foundation',
      label: 'Business Foundation',
      score: foundationCompletedPts,
      maxScore: 25,
      percentage: Math.round((foundationCompletedPts / 25) * 100),
    },
    businessCredit: {
      category: 'credit',
      label: 'Business Credit & Tradelines',
      score: creditCompletedPts,
      maxScore: 25,
      percentage: Math.round((creditCompletedPts / 25) * 100),
    },
    financialReadiness: {
      category: 'financial',
      label: 'Revolving Credit & Seasoning',
      score: financialCompletedPts,
      maxScore: 25,
      percentage: Math.round((financialCompletedPts / 25) * 100),
    },
    fundingProfile: {
      category: 'profile',
      label: 'Funding Preparation & Profile',
      score: profileCompletedPts,
      maxScore: 25,
      percentage: Math.round((profileCompletedPts / 25) * 100),
    },
  };

  return {
    score,
    level,
    description,
    categories,
    positiveFactors,
    improvementFactors,
    nextBestAction,
    prioritizedActions,
    calculatedAt,
  };
}
