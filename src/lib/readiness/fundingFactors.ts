import type { BusinessProfile } from '@/types/business';
import type { FundingReadinessResult } from '@/types/funding';

export interface MajorReadinessArea {
  key: 'business_profile' | 'business_age' | 'credit_depth' | 'revenue' | 'cash_flow';
  name: string;
  statusLabel: string; // 'Strong' | 'Good' | 'Needs Improvement' | 'Needs Attention' | 'Needs Information' | 'Not Provided'
  indicator: 'green' | 'amber' | 'red';
  detail: string;
}

export interface FundingReadinessDisplayData {
  hasSufficientData: boolean;
  score: number;
  level: string;
  monthlyDeltaText: string;
  monthlyDeltaType: 'up' | 'down' | 'neutral';
  majorAreas: MajorReadinessArea[];
  strongAreas: string[];
  areasToImprove: string[];
  biggestOpportunity: {
    quote: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

/**
 * Evaluates whether profile has enough data to calculate a genuine funding readiness score.
 */
export function hasSufficientFundingData(profile?: Partial<BusinessProfile> | null): boolean {
  if (!profile) return false;
  // Needs at least basic entity information and commercial foundation
  const hasEntity = Boolean(profile.entityType && profile.entityType.trim() !== '');
  const hasBanking = Boolean(profile.hasBusinessBankAccount);
  const hasAge = Boolean(profile.businessAge && profile.businessAge.trim() !== '');
  return Boolean(hasEntity && (hasBanking || hasAge || profile.profileCompleted));
}

/**
 * Calculates monthly score delta by comparing current score against previous snapshot.
 */
export function calculateMonthlyDelta(
  currentScore: number,
  previousScore?: number
): { text: string; type: 'up' | 'down' | 'neutral' } {
  if (previousScore === undefined || previousScore === null) {
    return {
      text: 'Baseline assessment',
      type: 'neutral',
    };
  }

  const diff = currentScore - previousScore;
  if (diff > 0) {
    return {
      text: `↑ ${diff} ${diff === 1 ? 'point' : 'points'} this month`,
      type: 'up',
    };
  }
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    return {
      text: `↓ ${absDiff} ${absDiff === 1 ? 'point' : 'points'} this month`,
      type: 'down',
    };
  }
  return {
    text: 'Stable this month',
    type: 'neutral',
  };
}

/**
 * Evaluates the 5 major readiness areas requested:
 * 1. Business Profile
 * 2. Business Age
 * 3. Business Credit Depth
 * 4. Revenue
 * 5. Cash Flow Consistency
 */
export function evaluateMajorReadinessAreas(p: Partial<BusinessProfile>): MajorReadinessArea[] {
  const areas: MajorReadinessArea[] = [];

  // 1. Business Profile
  const validEntity = p.entityType && p.entityType !== 'Not sure' && p.entityType !== 'Sole Proprietorship';
  const hasEIN = p.hasEIN === 'yes';
  if (validEntity && hasEIN) {
    areas.push({
      key: 'business_profile',
      name: 'Business Profile',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: `${p.entityType || 'Entity'} with registered EIN`,
    });
  } else if (validEntity || p.entityType === 'Sole Proprietorship' || hasEIN) {
    areas.push({
      key: 'business_profile',
      name: 'Business Profile',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: p.entityType === 'Sole Proprietorship'
        ? 'Sole Proprietorship limits commercial protection'
        : 'EIN or corporate registration pending',
    });
  } else {
    areas.push({
      key: 'business_profile',
      name: 'Business Profile',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'Formal business entity not yet confirmed',
    });
  }

  // 2. Business Age
  const age = p.businessAge;
  if (age === '5+ years' || age === '3+ years' || age === '2–5 years') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: `${age} operating history`,
    });
  } else if (age === '1–2 years') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Good',
      indicator: 'green',
      detail: '1–2 years established operations',
    });
  } else if (age === '6–12 months') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: '6–12 months operating track record',
    });
  } else if (age === 'Less than 6 months' || age === '3–6 months' || age === 'Less than 3 months') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'New business entity (under 6 months)',
    });
  } else {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Not Provided',
      indicator: 'red',
      detail: 'Operating age not yet recorded',
    });
  }

  // 3. Business Credit Depth
  const hasReporting = p.hasReportingAccounts === 'yes';
  const hasProfile = p.hasBusinessCreditProfile === 'yes';
  const hasCard = p.hasBusinessCreditCard === 'yes';
  const highCount = p.businessCreditAccountCount === '4-5' || p.businessCreditAccountCount === '6-10' || p.businessCreditAccountCount === '10+';

  if (hasReporting && (highCount || hasCard)) {
    areas.push({
      key: 'credit_depth',
      name: 'Business Credit Depth',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: 'Multiple reporting tradelines & commercial credit accounts',
    });
  } else if (hasReporting || hasProfile || hasCard) {
    areas.push({
      key: 'credit_depth',
      name: 'Business Credit Depth',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: hasReporting
        ? 'Add 2–3 additional tradelines to deepen credit file'
        : 'Credit profile established, needs reporting vendor accounts',
    });
  } else {
    areas.push({
      key: 'credit_depth',
      name: 'Business Credit Depth',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'No commercial credit accounts or reporting tradelines active',
    });
  }

  // 4. Revenue
  const rev = p.annualRevenueRange;
  if (rev === '$1,000,000+' || rev === '$500,000+' || rev === '$250,000–$500,000') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: `${rev} annual commercial revenue`,
    });
  } else if (rev === '$100,000–$250,000' || rev === '$50,000–$100,000') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Good',
      indicator: 'green',
      detail: `${rev} documented annual revenue`,
    });
  } else if (rev === '$10,000–$50,000') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: '$10k–$50k early-stage commercial cash flow',
    });
  } else if (rev === 'Under $10,000' || rev === 'Pre-revenue') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: rev === 'Pre-revenue' ? 'Pre-revenue business stage' : 'Under $10k annual baseline',
    });
  } else {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Not Provided',
      indicator: 'red',
      detail: 'Annual revenue not yet recorded',
    });
  }

  // 5. Cash Flow Consistency
  const bank = p.hasBusinessBankAccount;
  if (bank === 'yes') {
    areas.push({
      key: 'cash_flow',
      name: 'Cash Flow Consistency',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: 'Dedicated commercial business account verified',
    });
  } else if (bank === 'not_sure') {
    areas.push({
      key: 'cash_flow',
      name: 'Cash Flow Consistency',
      statusLabel: 'Needs Information',
      indicator: 'amber',
      detail: 'Commercial bank separation requires confirmation',
    });
  } else {
    areas.push({
      key: 'cash_flow',
      name: 'Cash Flow Consistency',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'No dedicated business checking account opened',
    });
  }

  return areas;
}

/**
 * Builds itemized Strong Areas and Areas to Improve lists, plus the single Biggest Opportunity.
 */
export function extractReadinessInsights(
  p: Partial<BusinessProfile>,
  fundingReadiness: FundingReadinessResult
): {
  strongAreas: string[];
  areasToImprove: string[];
  biggestOpportunity: { quote: string; ctaLabel: string; ctaHref: string };
} {
  const strong: string[] = [];
  const improve: string[] = [];

  // Entity structure
  if (p.entityType && p.entityType !== 'Not sure' && p.entityType !== 'Sole Proprietorship') {
    strong.push(`Entity structure established (${p.entityType})`);
  } else {
    improve.push('Form an LLC or Corporation to protect personal liability');
  }

  // Bank account
  if (p.hasBusinessBankAccount === 'yes') {
    strong.push('Business bank account active and separated');
  } else {
    improve.push('Open a dedicated commercial checking account');
  }

  // EIN
  if (p.hasEIN === 'yes') {
    strong.push('Federal EIN registered and active');
  } else {
    improve.push('Verify or obtain a Federal EIN from the IRS');
  }

  // Operating Age
  if (p.businessAge === '5+ years' || p.businessAge === '3+ years' || p.businessAge === '2–5 years') {
    strong.push(`${p.businessAge} operating history`);
  } else if (p.businessAge === '1–2 years') {
    strong.push('Established 1–2 year operating longevity');
  } else if (p.businessAge) {
    improve.push('Season business operations and maintain continuous positive banking history');
  }

  // Personal Credit Profile
  if (
    p.personalCreditRange === '720+' ||
    p.personalCreditRange === '720–850' ||
    p.personalCreditRange === 'Excellent (720+)' ||
    p.personalCreditRange === '680–719' ||
    p.personalCreditRange === 'Good (680–719)'
  ) {
    strong.push(`Good personal credit profile (${p.personalCreditRange})`);
  } else if (p.personalCreditRange) {
    improve.push('Strengthen personal credit profile to enhance personal guarantee terms');
  }

  // Reporting Accounts & Credit Depth
  if (p.hasReportingAccounts === 'yes') {
    strong.push('Active trade lines reporting to commercial bureaus');
  } else {
    improve.push('Open 2–3 additional Tier-1 vendor trade lines');
  }

  if (p.hasBusinessCreditProfile === 'yes') {
    strong.push('Commercial credit profile active with major bureaus');
  } else {
    improve.push('Establish commercial credit file with Dun & Bradstreet, Experian & Equifax');
  }

  if (p.hasBusinessCreditCard === 'yes') {
    strong.push('Dedicated revolving business credit card active');
  } else {
    improve.push('Apply for a dedicated revolving commercial credit card');
  }

  // Revenue
  if (
    p.annualRevenueRange === '$1,000,000+' ||
    p.annualRevenueRange === '$500,000+' ||
    p.annualRevenueRange === '$250,000–$500,000' ||
    p.annualRevenueRange === '$100,000–$250,000'
  ) {
    strong.push(`Documented commercial revenue (${p.annualRevenueRange})`);
  } else if (p.annualRevenueRange === '$50,000–$100,000') {
    strong.push(`Baseline annual revenue established (${p.annualRevenueRange})`);
  } else {
    improve.push('Increase monthly commercial deposit volume and documentation');
  }

  // Ensure items in strong and improve
  const strongSlice = strong.slice(0, 4);
  const improveSlice = improve.slice(0, 4);

  // Determine Biggest Opportunity
  let biggestOpportunity = {
    quote: 'Improve your business credit depth.',
    ctaLabel: 'View Recommendations',
    ctaHref: '/products?category=net_30',
  };

  if (p.hasBusinessBankAccount !== 'yes') {
    biggestOpportunity = {
      quote: 'Open a dedicated commercial bank account to establish financial separation.',
      ctaLabel: 'View Banking Steps',
      ctaHref: '/roadmap?filter=foundation',
    };
  } else if (p.hasReportingAccounts !== 'yes') {
    biggestOpportunity = {
      quote: 'Improve your business credit depth with Tier-1 vendor trade lines.',
      ctaLabel: 'View Recommendations',
      ctaHref: '/products?category=net_30',
    };
  } else if (p.hasBusinessCreditProfile !== 'yes') {
    biggestOpportunity = {
      quote: 'Establish your commercial credit files across major credit bureaus.',
      ctaLabel: 'View Bureau Setup',
      ctaHref: '/roadmap?filter=credit_foundation',
    };
  } else if (p.hasBusinessCreditCard !== 'yes') {
    biggestOpportunity = {
      quote: 'Add a revolving commercial credit card to expand your available credit.',
      ctaLabel: 'View Recommended Cards',
      ctaHref: '/products?category=business_credit_cards',
    };
  } else if (p.annualRevenueRange === 'Pre-revenue' || p.annualRevenueRange === 'Under $10,000') {
    biggestOpportunity = {
      quote: 'Build consistent monthly commercial deposits to unlock revenue-based funding.',
      ctaLabel: 'View Funding Options',
      ctaHref: '/funding',
    };
  }

  return {
    strongAreas: strongSlice,
    areasToImprove: improveSlice,
    biggestOpportunity,
  };
}
