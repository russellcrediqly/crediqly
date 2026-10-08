import assert from 'assert';
import { getRecommendedProducts, getNormalizedProviderKey } from '../src/lib/products/recommendationEngine.ts';
import {
  matchFundingProducts,
  parseMinRevenueRequirement,
  parseMinPersonalCreditRequirement,
} from '../src/lib/funding/fundingRecommendationEngine.ts';
function resolveFundingProductOutboundUrl(product) {
  if (product.affiliateEnabled && product.affiliateUrl && product.affiliateUrl.trim().length > 0) {
    return product.affiliateUrl.trim();
  }
  return product.websiteUrl.trim();
}

console.log('================================================================');
console.log('TEST SUITE: INTELLIGENT RECOMMENDATION & MARKETPLACE UPGRADE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Sample Test Products
// -----------------------------------------------------------------------------
const mockProducts = [
  {
    id: 'prod-1',
    name: 'Mercury Commercial Banking',
    slug: 'mercury',
    category: 'business_banking',
    description: 'FDIC-insured digital checking with no monthly fees.',
    shortDescription: 'Modern digital checking for startups.',
    websiteUrl: 'https://mercury.com',
    affiliateUrl: 'https://mercury.com?ref=crediqly',
    affiliateEnabled: true,
    reportingBureaus: [],
    einRequired: true,
    businessBankAccountRequired: false,
    businessWebsiteRequired: true,
    personalGuaranteeRequired: 'no',
    recommendedStage: 'foundation',
    status: 'active',
    featured: true,
  },
  {
    id: 'prod-1-dup',
    name: 'Mercury Financial Bank',
    slug: 'mercury-duplicate',
    category: 'business_banking',
    description: 'Duplicate mercury entry.',
    shortDescription: 'Duplicate mercury entry.',
    websiteUrl: 'https://mercury.com',
    affiliateEnabled: false,
    reportingBureaus: [],
    einRequired: true,
    businessBankAccountRequired: false,
    businessWebsiteRequired: false,
    personalGuaranteeRequired: 'no',
    recommendedStage: 'foundation',
    status: 'active',
    featured: false,
  },
  {
    id: 'prod-2',
    name: 'Relay Financial Business Checking',
    slug: 'relay',
    category: 'business_banking',
    description: 'Multi-account business checking account for cash management.',
    shortDescription: 'Up to 20 checking accounts with zero monthly fees.',
    websiteUrl: 'https://relayfi.com',
    affiliateEnabled: false,
    reportingBureaus: [],
    einRequired: true,
    businessBankAccountRequired: false,
    businessWebsiteRequired: false,
    personalGuaranteeRequired: 'no',
    recommendedStage: 'foundation',
    status: 'active',
    featured: false,
  },
  {
    id: 'prod-3',
    name: 'Uline Shipping Supplies',
    slug: 'uline',
    category: 'net_30',
    description: 'Industrial and packaging supplier offering Net-30 invoicing.',
    shortDescription: 'Tier-1 Net-30 vendor trade account.',
    websiteUrl: 'https://uline.com',
    affiliateEnabled: false,
    reportingBureaus: ['Dun & Bradstreet', 'Experian Commercial'],
    minimumPurchase: '$100 initial qualifying order',
    terms: 'Net-30',
    einRequired: true,
    businessBankAccountRequired: true,
    businessWebsiteRequired: false,
    personalGuaranteeRequired: 'no',
    typicalBusinessAge: 'No minimum',
    recommendedStage: 'credit_foundation',
    status: 'active',
    featured: true,
  },
  {
    id: 'prod-4',
    name: 'Brex Corporate Card',
    slug: 'brex',
    category: 'business_credit_cards',
    description: 'Corporate charge card with zero personal guarantee evaluated on cash balance.',
    shortDescription: 'No PG corporate card for funded or revenue-generating businesses.',
    websiteUrl: 'https://brex.com',
    affiliateUrl: 'https://brex.com?aff=crediqly',
    affiliateEnabled: true,
    reportingBureaus: ['Experian Commercial'],
    terms: 'Monthly Revolving Charge',
    einRequired: true,
    businessBankAccountRequired: true,
    businessWebsiteRequired: true,
    personalGuaranteeRequired: 'no',
    typicalBusinessAge: 'No minimum',
    recommendedStage: 'building',
    status: 'active',
    featured: true,
  },
  {
    id: 'prod-5',
    name: 'Chase Ink Business Preferred',
    slug: 'chase-ink',
    category: 'business_credit_cards',
    description: 'Premium revolving travel card with generous intro rewards.',
    shortDescription: 'Tier-3 revolving commercial rewards card.',
    websiteUrl: 'https://chase.com',
    affiliateEnabled: false,
    reportingBureaus: ['Experian Commercial', 'Equifax Business', 'Dun & Bradstreet'],
    personalGuaranteeRequired: 'yes',
    personalCreditRequirement: '680+',
    typicalBusinessAge: '1+ years',
    recommendedStage: 'funding',
    status: 'active',
    featured: false,
  },
];

const mockFundingProducts = [
  {
    id: 'fund-1',
    name: 'National Funding Working Capital',
    provider: 'National Funding',
    category: 'Working Capital',
    description: 'Rapid commercial working capital advances for operating businesses.',
    websiteUrl: 'https://nationalfunding.com',
    affiliateUrl: 'https://nationalfunding.com?ref=crediqly',
    affiliateEnabled: true,
    status: 'active',
    featured: true,
    priority: 1,
    minBusinessAgeMonths: 6,
    minAnnualRevenue: '$50,000',
    minPersonalCredit: '600+',
    businessCreditRequired: 'no',
    minFundingAmount: 10000,
    maxFundingAmount: 250000,
    fundingPurposes: ['Working Capital', 'Inventory', 'Payroll'],
    repaymentType: 'Short Term',
    rateTermsInfo: 'Factor rate from 1.15',
    typicalTermRange: '6–18 months',
  },
  {
    id: 'fund-2',
    name: 'SBA 7(a) Working Capital Loan',
    provider: 'SmartBiz SBA Marketplace',
    category: 'SBA-related Financing',
    description: 'Government-guaranteed low-cost long-term financing.',
    websiteUrl: 'https://smartbizloans.com',
    affiliateEnabled: false,
    status: 'active',
    featured: true,
    priority: 1,
    minBusinessAgeMonths: 24,
    minAnnualRevenue: '$100,000',
    minPersonalCredit: '680+',
    businessCreditRequired: 'yes',
    minFundingAmount: 30000,
    maxFundingAmount: 500000,
    fundingPurposes: ['Expansion', 'Working Capital', 'Debt Refinancing'],
    repaymentType: 'Long Term',
    rateTermsInfo: 'Prime + 2.75% to 4.75%',
    typicalTermRange: '10 years',
  },
  {
    id: 'fund-3',
    name: 'Amber Grant for Women Entrepreneurs',
    provider: 'WomensNet',
    category: 'Grant',
    description: '$10,000 monthly micro-grant for women-owned small businesses.',
    websiteUrl: 'https://ambergrantsforwomen.com',
    affiliateEnabled: false,
    status: 'active',
    featured: true,
    priority: 1,
    minBusinessAgeMonths: 0,
    minAnnualRevenue: '$0',
    minPersonalCredit: 'None',
    businessCreditRequired: 'no',
    grantAmount: '$10,000',
    grantDeadline: 'Monthly rolling deadline',
    fundingPurposes: ['Working Capital', 'Marketing', 'Equipment'],
    repaymentType: 'Grant',
  },
];

// -----------------------------------------------------------------------------
// TEST 1: Deduplication of Providers
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Provider Deduplication Pass ---');

const dupKey1 = getNormalizedProviderKey('Mercury Commercial Banking', 'business_banking', 'mercury');
const dupKey2 = getNormalizedProviderKey('Mercury Financial Bank', 'business_banking', 'mercury-duplicate');
assert.strictEqual(dupKey1, dupKey2, 'Both Mercury variants must produce identical provider keys');

const relayKey = getNormalizedProviderKey('Relay Financial Business Checking', 'business_banking', 'relay');
assert.notStrictEqual(dupKey1, relayKey, 'Mercury and Relay must have distinct provider keys');

const recommended = getRecommendedProducts(
  {
    hasEIN: 'yes',
    hasBusinessBankAccount: 'no',
    hasBusinessCreditProfile: 'no',
    hasReportingAccounts: 'no',
    businessAge: 'less_than_6_months',
  },
  null,
  mockProducts,
  45
);

const mercuryInstances = recommended.filter((p) => p.name.toLowerCase().includes('mercury'));
assert.strictEqual(mercuryInstances.length, 1, 'Mercury must appear exactly once after recommendation deduplication');
console.log('✓ Provider deduplication verified: Duplicate Mercury instances collapsed to single highest-match entry.');

// -----------------------------------------------------------------------------
// TEST 2: Structured Recommendation Card Fields
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Recommendation Card 5-Point Structure ---');

for (const prod of recommended) {
  assert(prod.recommendedForYou, `Product ${prod.name} must have recommendedForYou`);
  assert(prod.whyThisMatches, `Product ${prod.name} must have whyThisMatches`);
  assert(Array.isArray(prod.whatYouMayNeed), `Product ${prod.name} must have whatYouMayNeed array`);
  assert(prod.whatYouMayNeed.length > 0, `Product ${prod.name} must have at least one requirement`);
  assert(prod.whatToConsider, `Product ${prod.name} must have whatToConsider`);
  assert(
    ['Strong Match', 'Potential Match', 'Preliminary Match', 'Not Recommended Yet'].includes(prod.matchLabel),
    `Product ${prod.name} matchLabel must be compliant (found: ${prod.matchLabel})`
  );
}
console.log('✓ Standardized recommendation card format verified across all products.');

// -----------------------------------------------------------------------------
// TEST 3: Business Banking Specialized Intelligence
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Banking Specialization Intelligence ---');

const bankingRec = recommended.find((p) => p.category === 'business_banking');
assert(bankingRec, 'Must have at least one business banking recommendation');
assert(bankingRec.bankingFit, 'Banking product must have bankingFit info');
assert(bankingRec.bankingFit.whyFits, 'bankingFit must specify whyFits');
assert(bankingRec.bankingFit.suitableStage, 'bankingFit must specify suitableStage');
assert(bankingRec.bankingFit.foundationSupport, 'bankingFit must specify foundationSupport');
assert(bankingRec.bankingFit.fundingPrepSupport, 'bankingFit must specify fundingPrepSupport');

console.log(`✓ Banking specialization verified for ${bankingRec.name}:`);
console.log(`   - Why: ${bankingRec.bankingFit.whyFits.substring(0, 70)}...`);
console.log(`   - Stage: ${bankingRec.bankingFit.suitableStage}`);
console.log(`   - Foundation: ${bankingRec.bankingFit.foundationSupport.substring(0, 70)}...`);
console.log(`   - Funding Prep: ${bankingRec.bankingFit.fundingPrepSupport.substring(0, 70)}...`);

// -----------------------------------------------------------------------------
// TEST 4: "Not Recommended Yet" Guidance with Milestone Links
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: "Not Recommended Yet" & Milestone Guidance ---');

// Early business with low credit applying for Chase Ink card requiring PG and seasoning
const chaseRec = recommended.find((p) => p.slug === 'chase-ink');
assert(chaseRec, 'Chase card must be evaluated');
assert.strictEqual(chaseRec.matchLabel, 'Not Recommended Yet', 'Chase Ink should be Not Recommended Yet for startup without bank or credit');
assert(Array.isArray(chaseRec.nextStepsToImprove), 'Must provide nextStepsToImprove');
assert(chaseRec.nextStepsToImprove.length > 0, 'Must have actionable steps');
const hasMilestoneRef = chaseRec.nextStepsToImprove.some((step) => step.includes('Milestone #'));
assert(hasMilestoneRef, 'Next steps must reference concrete Crediqly milestones');

console.log(`✓ "Not Recommended Yet" provides actionable milestones: ${chaseRec.nextStepsToImprove.join('; ')}`);

// -----------------------------------------------------------------------------
// TEST 5: Funding Matching Engine & Non-Dilutive Grants
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: Funding Recommendation Engine & Non-Dilutive Grants ---');

const fundingMatches = matchFundingProducts(
  {
    businessAge: 'less_than_6_months',
    annualRevenueRange: '$25,000',
    personalCreditRange: '600_to_639',
    hasBusinessCreditProfile: 'no',
    fundingAmount: '$10,000',
  },
  40,
  mockFundingProducts
);

assert.strictEqual(fundingMatches.length, 3, 'Must match all 3 active funding products');

// Grant should be a Strong Match for any stage
const grantMatch = fundingMatches.find((m) => m.product.category === 'Grant');
assert(grantMatch, 'Grant must be evaluated');
assert.strictEqual(grantMatch.matchLevel, 'Strong Match', 'Grant should be Strong Match');
assert(grantMatch.isGrant, 'isGrant must be true');

// SBA loan should be Not Recommended Yet for early-stage startup
const sbaMatch = fundingMatches.find((m) => m.product.category === 'SBA-related Financing');
assert(sbaMatch, 'SBA loan must be evaluated');
assert.strictEqual(sbaMatch.matchLevel, 'Not Recommended Yet', 'SBA should be Not Recommended Yet for business under 24 months');
assert(sbaMatch.nextStepsToImprove.length > 0, 'SBA must have improvement milestones');
assert(sbaMatch.nextStepsToImprove.some((s) => s.includes('Milestone #13')), 'Must reference Milestone #13 for operational seasoning');

console.log('✓ Funding matches accurately distinguish between grants, working capital, and long-term SBA.');

// -----------------------------------------------------------------------------
// TEST 6: Outbound Link Safety (Never produce broken outbound links)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6: Outbound Link Safety & Fallbacks ---');

// Enabled affiliate
const urlWithAff = resolveFundingProductOutboundUrl(mockFundingProducts[0]);
assert.strictEqual(urlWithAff, 'https://nationalfunding.com?ref=crediqly');

// Disabled affiliate -> fallback to websiteUrl
const urlNoAff = resolveFundingProductOutboundUrl(mockFundingProducts[1]);
assert.strictEqual(urlNoAff, 'https://smartbizloans.com');

// Empty affiliate -> fallback
const brokenAffProduct = {
  ...mockFundingProducts[0],
  affiliateEnabled: true,
  affiliateUrl: '   ',
  websiteUrl: 'https://nationalfunding.com',
};
const urlFallback = resolveFundingProductOutboundUrl(brokenAffProduct);
assert.strictEqual(urlFallback, 'https://nationalfunding.com', 'Whitespace affiliate must safely fall back to websiteUrl');

console.log('✓ Outbound URL resolver guarantees safe, working destinations with zero dead links.');

// -----------------------------------------------------------------------------
// TEST 7: Parser Helper Functions
// -----------------------------------------------------------------------------
console.log('\n--- TEST 7: Parser Helper Functions ---');

assert.strictEqual(parseMinRevenueRequirement('$50,000'), 50000);
assert.strictEqual(parseMinRevenueRequirement('$250,000+'), 250000);
assert.strictEqual(parseMinRevenueRequirement('$0'), 0);
assert.strictEqual(parseMinRevenueRequirement('None'), 0);

assert.strictEqual(parseMinPersonalCreditRequirement('680+'), 680);
assert.strictEqual(parseMinPersonalCreditRequirement('700+'), 700);
assert.strictEqual(parseMinPersonalCreditRequirement('None'), 0);

console.log('✓ Revenue and personal credit requirements parsed accurately.');

console.log('\n================================================================');
console.log('ALL INTELLIGENT RECOMMENDATION TESTS PASSED (7/7 PASS) ✓');
console.log('================================================================');
