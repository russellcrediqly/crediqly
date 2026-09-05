import assert from 'node:assert';
import { INITIAL_FUNDING_PRODUCTS } from '../src/lib/funding/initialFundingProducts.ts';
import { getPersonalizedFundingMatches } from '../src/lib/funding/personalizedMatchesEngine.ts';
import { resolveFundingProductOutboundUrl } from '../src/lib/supabase/fundingProductService.ts';

console.log('🧪 RUNNING PHASE D: PERSONALIZED FUNDING MATCH TEST SUITE...\n');

// 1. Test Profiles
const earlyStageProfile = {
  businessName: 'Early Tech LLC',
  businessAge: 'Less than 6 months',
  annualRevenueRange: 'Under $10,000',
  personalCreditRange: '600–639',
  hasBusinessCreditProfile: 'no',
  fundingPurpose: ['Working Capital'],
  profileCompleted: true,
};

const midGrowthProfile = {
  businessName: 'Midtown Logistics LLC',
  businessAge: '1–2 years',
  annualRevenueRange: '$100,000–$250,000',
  personalCreditRange: '680–719',
  hasBusinessCreditProfile: 'yes',
  fundingPurpose: ['Working Capital', 'Payroll'],
  profileCompleted: true,
};

const advancedProfile = {
  businessName: 'Apex Enterprise Corp',
  businessAge: '3+ years',
  annualRevenueRange: '$500,000+',
  personalCreditRange: '720+',
  hasBusinessCreditProfile: 'yes',
  fundingPurpose: ['Expansion'],
  profileCompleted: true,
};

// 2. Test Execution
console.log('--- Test 1: Mid Growth Profile Matches ---');
const midMatches = getPersonalizedFundingMatches(midGrowthProfile, 72, INITIAL_FUNDING_PRODUCTS);

assert.ok(midMatches.strongMatch, 'Must have a Strong Match');
console.log('🟢 Strong Match:', midMatches.strongMatch.category, '| Range:', midMatches.strongMatch.estimatedRange);
assert.strictEqual(midMatches.strongMatch.tier, 'strong');
assert.strictEqual(midMatches.strongMatch.badgeLabel, 'Strong Match');
assert.strictEqual(midMatches.strongMatch.badgeColor, 'emerald');
assert.ok(midMatches.strongMatch.estimatedRange.includes('$'), 'Estimated range must be formatted');
assert.ok(midMatches.strongMatch.whyText?.includes('suitable for this funding category'), 'Must have compliant why text');
assert.ok(midMatches.strongMatch.ctaUrl, 'Must have valid CTA URL');

assert.ok(midMatches.possibleMatch, 'Must have a Possible Match');
console.log('🟡 Possible Match:', midMatches.possibleMatch.category, '| Range:', midMatches.possibleMatch.estimatedRange);
assert.strictEqual(midMatches.possibleMatch.tier, 'possible');
assert.strictEqual(midMatches.possibleMatch.badgeLabel, 'Possible Match');
assert.strictEqual(midMatches.possibleMatch.badgeColor, 'amber');
assert.ok(midMatches.possibleMatch.requirements && midMatches.possibleMatch.requirements.length >= 2, 'Must have basic requirements');

assert.ok(midMatches.improveReadinessMatch, 'Must have Improve Readiness First');
console.log('🔴 Improve Readiness First:', midMatches.improveReadinessMatch.category, '| Target Range:', midMatches.improveReadinessMatch.estimatedRange);
assert.strictEqual(midMatches.improveReadinessMatch.tier, 'improve_readiness');
assert.strictEqual(midMatches.improveReadinessMatch.badgeLabel, 'Improve Readiness First');
assert.strictEqual(midMatches.improveReadinessMatch.badgeColor, 'rose');
assert.ok(midMatches.improveReadinessMatch.preparationNote?.includes('benefit from additional preparation'), 'Must have preparation note');
assert.ok(midMatches.improveReadinessMatch.ctaUrl.includes('readiness'), 'CTA must route to readiness');

console.log('✅ Test 1 Passed!\n');

console.log('--- Test 2: Compliance Terminology Verification ---');
const allText = JSON.stringify(midMatches);

// Prohibited non-compliant phrases
const prohibited = ['You qualify', 'you qualify', 'You will be approved', 'you will be approved', 'Guaranteed funding', 'guaranteed funding'];
for (const phrase of prohibited) {
  assert.ok(!allText.includes(phrase), `Text must NEVER contain prohibited phrase: "${phrase}"`);
}

// Mandatory compliant phrases
assert.ok(allText.includes('Strong Match'), 'Must include Strong Match');
assert.ok(allText.includes('Possible Match'), 'Must include Possible Match');
assert.ok(allText.includes('Based on the information provided') || allText.includes('based on the information provided'), 'Must include "based on the information provided"');
assert.ok(allText.includes('Eligibility varies by provider'), 'Must include "Eligibility varies by provider"');

console.log('✅ Test 2 Passed: 100% compliant copy verified!\n');

console.log('--- Test 3: Affiliate URL Resolution & Fallback ---');
const productWithAffiliateDisabled = {
  ...INITIAL_FUNDING_PRODUCTS[0],
  websiteUrl: 'https://fundbox.com',
  affiliateUrl: 'https://fundbox.com/partner/test',
  affiliateEnabled: false,
};
assert.strictEqual(
  resolveFundingProductOutboundUrl(productWithAffiliateDisabled),
  'https://fundbox.com',
  'Should fall back to websiteUrl when affiliate is disabled'
);

const productWithAffiliateEnabled = {
  ...INITIAL_FUNDING_PRODUCTS[0],
  websiteUrl: 'https://fundbox.com',
  affiliateUrl: 'https://fundbox.com/partner/test',
  affiliateEnabled: true,
};
assert.strictEqual(
  resolveFundingProductOutboundUrl(productWithAffiliateEnabled),
  'https://fundbox.com/partner/test',
  'Should use affiliateUrl when affiliate is enabled'
);

const productWithEmptyAffiliate = {
  ...INITIAL_FUNDING_PRODUCTS[0],
  websiteUrl: 'https://fundbox.com',
  affiliateUrl: '',
  affiliateEnabled: true,
};
assert.strictEqual(
  resolveFundingProductOutboundUrl(productWithEmptyAffiliate),
  'https://fundbox.com',
  'Should cleanly fall back to websiteUrl when affiliateUrl is empty'
);

console.log('✅ Test 3 Passed: Affiliate URL fallback robust!\n');

console.log('--- Test 4: Early Stage Profile Handling ---');
const earlyMatches = getPersonalizedFundingMatches(earlyStageProfile, 28, INITIAL_FUNDING_PRODUCTS);
assert.ok(earlyMatches.strongMatch, 'Early stage must still get appropriate accessible matches');
assert.ok(earlyMatches.possibleMatch, 'Early stage must get possible match');
assert.ok(earlyMatches.improveReadinessMatch, 'Early stage must get improve readiness match (e.g. SBA)');
console.log('Early Stage Strong Match:', earlyMatches.strongMatch.category);
console.log('Early Stage Improve Readiness:', earlyMatches.improveReadinessMatch.category);
console.log('✅ Test 4 Passed!\n');

console.log('🎉 ALL PHASE D FUNDING MATCH TESTS PASSED PERFECTLY!');
