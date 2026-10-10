/**
 * Crediqly Comprehensive Production Readiness Verification Matrix
 * 
 * Tests:
 * 1. Global Pricing & Stripe constants integrity
 * 2. Deterministic Scoring Engine across edge cases (Null, Pre-revenue, Mid-market, Mature)
 * 3. Deterministic Funding Match Engine & Disclaimers
 * 4. Deterministic Product Recommendation Engine
 * 5. Customer Journey Engine
 * 6. Edge-case safety (No NaNs, No Infinite values, strictly bounded in [0, 100])
 */

import { STRIPE_CONFIG } from '../src/lib/stripe/stripeServer';
import {
  calculateBusinessReadiness,
  calculateCreditReadiness,
  getScoreLevel,
} from '../src/lib/scoring/engine';
import { calculateFundingReadiness } from '../src/lib/readiness/fundingEngine';
import { calculateMilestoneReadiness } from '../src/lib/readiness/readinessMilestoneEngine';
import { matchFundingProducts } from '../src/lib/funding/fundingRecommendationEngine';
import { getRecommendedProducts } from '../src/lib/products/recommendationEngine';
import { calculateCustomerJourney } from '../src/lib/roadmap/customerJourney';
import { DEFAULT_PRODUCTS } from '../src/lib/products/catalog';
import type { BusinessProfile } from '../src/types/business';
import type { FundingProduct } from '../src/types/fundingProduct';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('🚀 CREDIQLY PRODUCTION READINESS VERIFICATION MATRIX');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// TEST SUITE 1: Pricing & Plans Standardized Integrity
// ---------------------------------------------------------------------------
console.log('📦 1. VERIFYING GLOBAL PRICING & STRIPE TIER CONFIG');

assert(
  STRIPE_CONFIG.foundationPriceCents === 4799,
  'Foundation monthly plan price is exactly $47.99 (4,799 cents)'
);

assert(
  STRIPE_CONFIG.guidedPriceCents === 14799,
  'Guided monthly plan price is exactly $147.99 (14,799 cents)'
);

assert(
  STRIPE_CONFIG.guidedOneTimePriceCents === 99700,
  'Guided 12-Month program price is exactly $997.00 (99,700 cents)'
);

assert(
  STRIPE_CONFIG.intensivePriceCents === 99700,
  'Intensive program price equals $997.00 for legacy checkout compatibility'
);

// Verify plan ID accessors exist on STRIPE_CONFIG
assert(
  'foundationPriceId' in STRIPE_CONFIG,
  'STRIPE_CONFIG defines foundationPriceId accessor'
);
assert(
  'guidedPriceId' in STRIPE_CONFIG,
  'STRIPE_CONFIG defines guidedPriceId accessor'
);
assert(
  'guidedOneTimePriceId' in STRIPE_CONFIG,
  'STRIPE_CONFIG defines guidedOneTimePriceId accessor'
);

// ---------------------------------------------------------------------------
// TEST SUITE 2: Deterministic Scoring Engine Edge Cases
// ---------------------------------------------------------------------------
console.log('\n📊 2. VERIFYING SCORING ENGINE (0-100 DETERMINISTIC BOUNDS)');

// Case A: Null / Empty profile
const emptyProfile: Partial<BusinessProfile> = {};
const scoreEmptyBiz = calculateBusinessReadiness(emptyProfile);
const scoreEmptyFunding = calculateFundingReadiness(emptyProfile);
const scoreEmptyMilestone = calculateMilestoneReadiness(emptyProfile);

assert(
  !isNaN(scoreEmptyBiz.score) && scoreEmptyBiz.score >= 0 && scoreEmptyBiz.score <= 100,
  'Empty business profile produces non-NaN business score in [0, 100]'
);
assert(
  !isNaN(scoreEmptyFunding.score) && scoreEmptyFunding.score >= 0 && scoreEmptyFunding.score <= 100,
  'Empty business profile produces non-NaN funding score in [0, 100]'
);
assert(
  !isNaN(scoreEmptyMilestone.score) && scoreEmptyMilestone.score >= 0 && scoreEmptyMilestone.score <= 100,
  'Empty business profile produces non-NaN milestone score in [0, 100]'
);
assert(
  scoreEmptyBiz.level === 'Getting Started' || scoreEmptyBiz.score < 40,
  'Empty business profile categorized as Getting Started / baseline'
);

// Case B: Brand New Pre-Revenue Startup (LLC formed, EIN, Bank, Pre-revenue, <3 months)
const startupProfile: Partial<BusinessProfile> = {
  entityType: 'Limited Liability Company (LLC)',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  hasWebsite: 'no',
  hasBusinessPhone: 'no',
  hasBusinessEmail: 'no',
  hasBusinessAddress: 'no',
  hasBusinessLicense: 'not_applicable',
  hasDuns: 'no',
  hasBusinessCreditProfile: 'no',
  businessAge: 'Less than 3 months',
  annualRevenueRange: 'Pre-revenue',
  personalCreditRange: '640–679',
};

const startupBizScore = calculateBusinessReadiness(startupProfile);
const startupFundingScore = calculateFundingReadiness(startupProfile);

assert(
  startupBizScore.score > 0 && startupBizScore.score <= 60,
  `Pre-revenue startup receives realistic foundation score (${startupBizScore.score}/100)`
);
assert(
  startupFundingScore.score > 0 && startupFundingScore.score <= 60,
  `Pre-revenue startup receives realistic funding readiness score (${startupFundingScore.score}/100)`
);

// Case C: Mature Entity (LLC, EIN, Bank, 5+ years, D-U-N-S, Credit Profile, $500k+ revenue, 720+ credit)
const matureProfile: Partial<BusinessProfile> = {
  entityType: 'Limited Liability Company (LLC)',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  hasWebsite: 'yes',
  hasBusinessPhone: 'yes',
  hasBusinessEmail: 'yes',
  hasBusinessAddress: 'yes',
  hasBusinessLicense: 'yes',
  hasDuns: 'yes',
  hasBusinessCreditProfile: 'yes',
  hasReportingAccounts: 'yes',
  businessCreditAccountCount: '10+',
  hasBusinessCreditCard: 'yes',
  hasFundingHistory: 'yes',
  fundingPurpose: ['Expansion'],
  fundingAmount: '$250,000',
  knowsBusinessCreditScore: 'yes',
  businessAge: '5+ years',
  annualRevenueRange: '$500,000–$1,000,000',
  personalCreditRange: '720+',
};

const matureBizScore = calculateBusinessReadiness(matureProfile);
const matureFundingScore = calculateFundingReadiness(matureProfile);

assert(
  matureBizScore.score >= 80 && matureBizScore.score <= 100,
  `Mature business profile achieves Strong Foundation score (${matureBizScore.score}/100)`
);
assert(
  matureFundingScore.score >= 70 && matureFundingScore.score <= 100,
  `Mature business profile achieves Funding Ready score (${matureFundingScore.score}/100)`
);

// ---------------------------------------------------------------------------
// TEST SUITE 3: Funding Recommendations Integrity (Never Fake Approvals)
// ---------------------------------------------------------------------------
console.log('\n🎯 3. VERIFYING FUNDING MATCH ENGINE (HONEST MATCHES & NO FAKE APPROVALS)');

const sampleProducts: FundingProduct[] = [
  {
    id: 'sba_7a',
    name: 'SBA 7(a) Working Capital Loan',
    provider: 'SBA Preferred Lender Network',
    category: 'SBA-related Financing',
    description: 'Government-guaranteed commercial loan program for small business expansion.',
    websiteUrl: 'https://www.sba.gov',
    affiliateEnabled: false,
    status: 'active',
    minFundingAmount: 50000,
    maxFundingAmount: 5000000,
    minBusinessAgeMonths: 24,
    minAnnualRevenue: '$100,000',
    minPersonalCredit: '680',
    businessCreditRequired: 'yes',
    typicalTermRange: '5–10 years',
    rateTermsInfo: 'Prime + 2.25% to Prime + 4.75%',
    repaymentType: 'Long Term',
    fundingPurposes: ['Working Capital', 'Expansion', 'Equipment'],
    priority: 1,
    featured: true,
  },
  {
    id: 'amber_grant',
    name: 'Womens Net Amber Grant',
    provider: 'WomensNet',
    category: 'Grant',
    description: 'Monthly non-dilutive grant award honoring women entrepreneurs.',
    websiteUrl: 'https://womensnet.net',
    affiliateEnabled: false,
    status: 'active',
    minFundingAmount: 10000,
    maxFundingAmount: 25000,
    minBusinessAgeMonths: 0,
    minAnnualRevenue: '$0',
    minPersonalCredit: 'None',
    businessCreditRequired: 'no',
    typicalTermRange: 'Non-repayable',
    rateTermsInfo: 'Zero interest, non-dilutive grant award',
    repaymentType: 'Grant',
    fundingPurposes: ['Startup', 'Growth', 'Working Capital'],
    grantDeadline: 'Monthly rolling deadline',
    priority: 1,
    featured: true,
  },
];

// For a new startup with <3 months and pre-revenue:
// SBA 7(a) MUST NOT be Strong Match (needs 24 mo age, $100k revenue, credit profile)
const startupFundingMatches = matchFundingProducts(startupProfile, startupFundingScore.score, sampleProducts);
const startupSBAMatch = startupFundingMatches.find((m) => m.product.id === 'sba_7a');

assert(
  startupSBAMatch !== undefined,
  'SBA loan evaluated by match engine'
);

assert(
  startupSBAMatch?.matchLevel === 'Not Recommended Yet',
  `Pre-revenue startup is NOT falsely matched for 24-month SBA loan (Level: ${startupSBAMatch?.matchLevel})`
);

assert(
  (startupSBAMatch?.nextStepsToImprove.length ?? 0) > 0,
  'Disqualified product includes actionable improvement milestones'
);

// Non-dilutive grant with 0 requirements SHOULD be open/matchable
const startupGrantMatch = startupFundingMatches.find((m) => m.product.id === 'amber_grant');
assert(
  startupGrantMatch?.isGrant === true && startupGrantMatch?.matchLevel === 'Strong Match',
  'Non-dilutive grant is correctly identified as Strong Match for startup'
);

// ---------------------------------------------------------------------------
// TEST SUITE 4: Product Catalog Recommendations
// ---------------------------------------------------------------------------
console.log('\n🛍️  4. VERIFYING PRODUCTS & TRADELINES ENGINE');

const recommendedStartupProducts = getRecommendedProducts(startupProfile, null, DEFAULT_PRODUCTS, startupBizScore.score);
assert(
  Array.isArray(recommendedStartupProducts) && recommendedStartupProducts.length > 0,
  `Product catalog generates recommended tradelines for startup (${recommendedStartupProducts.length} items)`
);

// Net 30 should be prominently recommended for early-stage credit building
const net30Product = recommendedStartupProducts.find((p) => p.category === 'net_30');
assert(
  net30Product !== undefined,
  'Tier 1 Net-30 vendor tradelines provided for early credit building'
);

// ---------------------------------------------------------------------------
// TEST SUITE 5: Customer Journey Engine
// ---------------------------------------------------------------------------
console.log('\n🗺️  5. VERIFYING CUSTOMER JOURNEY DETERMINISTIC ENGINE');

const journey = calculateCustomerJourney(startupProfile, startupBizScore);
assert(
  journey !== null && typeof journey.overallProgress === 'number',
  'Customer journey generates structured progression data'
);

assert(
  journey.activeStep.id === 1 || journey.activeStep.id === 2,
  `Early business correctly placed at Stage 1 or 2 (${journey.activeStep.title})`
);

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`🏁 VERIFICATION COMPLETE: ${passedChecks}/${totalChecks} TESTS PASSED`);
if (passedChecks === totalChecks) {
  console.log('🎉 ALL PRODUCTION READINESS VERIFICATION CHECKS PASSED!');
} else {
  console.error(`⚠️ ${totalChecks - passedChecks} CHECKS FAILED.`);
}
console.log('======================================================\n');
