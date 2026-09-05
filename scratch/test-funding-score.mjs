// Automated test suite for Crediqly Funding Readiness Score (Phase A)
import assert from 'node:assert';

console.log('--- TEST 1: Importing and Verifying Funding Readiness Logic ---');

// Dynamic import of TypeScript/ESM module via tsx / ts-node or plain node test
// We can test the helper functions directly:
import {
  hasSufficientFundingData,
  calculateMonthlyDelta,
  evaluateMajorReadinessAreas,
  extractReadinessInsights,
} from '../src/lib/readiness/fundingFactors.ts';

import { calculateFundingReadiness } from '../src/lib/readiness/fundingEngine.ts';

console.log('Loaded fundingFactors and fundingEngine successfully.');

// Test Case A: Empty / Insufficient profile data
console.log('\n--- TEST Case A: Empty Profile ---');
const emptyProfile = null;
const partialProfile = { businessName: 'Acme Inc' };
assert.strictEqual(hasSufficientFundingData(emptyProfile), false, 'Empty profile should not have sufficient data');
assert.strictEqual(hasSufficientFundingData(partialProfile), false, 'Partial profile without entity/banking/age should not have sufficient data');
console.log('✓ Incomplete profiles correctly flagged for Complete Profile empty state (no fake scores fabricated)');

// Test Case B: Populated Profile (Example matching prompt: ~72 / 100)
console.log('\n--- TEST Case B: Populated Profile ---');
const sampleProfile = {
  userId: 'test-user-123',
  businessName: 'Apex Logistics LLC',
  entityType: 'Limited Liability Company (LLC)',
  state: 'Delaware',
  industry: 'Transportation & Logistics',
  businessAge: '1–2 years',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  hasWebsite: 'yes',
  hasBusinessPhone: 'yes',
  hasBusinessEmail: 'yes',
  hasBusinessAddress: 'yes',
  hasBusinessLicense: 'yes',
  hasDuns: 'yes',
  hasBusinessCreditProfile: 'yes',
  hasReportingAccounts: 'no',
  businessCreditAccountCount: '1-3',
  hasBusinessCreditCard: 'no',
  annualRevenueRange: '$50,000–$100,000',
  personalCreditRange: '680–719',
  fundingAmount: '$50,000',
  fundingPurpose: ['Working Capital'],
  profileCompleted: true,
};

assert.strictEqual(hasSufficientFundingData(sampleProfile), true, 'Sample profile should have sufficient data');

const fundingResult = calculateFundingReadiness(sampleProfile);
console.log(`Calculated Score: ${fundingResult.score} / 100 (${fundingResult.level})`);
assert(fundingResult.score >= 50 && fundingResult.score <= 85, 'Score should be in realistic funding range');

// Verify 5 Major Readiness Areas
const areas = evaluateMajorReadinessAreas(sampleProfile);
console.log('\nMajor Readiness Areas:');
areas.forEach(a => {
  console.log(` - ${a.indicator === 'green' ? '🟢' : a.indicator === 'amber' ? '🟡' : '🔴'} ${a.name} — ${a.statusLabel} (${a.detail})`);
});

assert.strictEqual(areas.length, 5, 'Must evaluate exactly 5 major readiness areas');
const areaKeys = areas.map(a => a.key);
assert(areaKeys.includes('business_profile'), 'Must include business_profile');
assert(areaKeys.includes('business_age'), 'Must include business_age');
assert(areaKeys.includes('credit_depth'), 'Must include credit_depth');
assert(areaKeys.includes('revenue'), 'Must include revenue');
assert(areaKeys.includes('cash_flow'), 'Must include cash_flow');

// Verify Strong Areas & Areas to Improve
const insights = extractReadinessInsights(sampleProfile, fundingResult);
console.log('\nStrong Areas:');
insights.strongAreas.forEach(s => console.log(` ✓ ${s}`));
assert(insights.strongAreas.length >= 2, 'Should extract at least 2 strong areas');

console.log('\nAreas to Improve:');
insights.areasToImprove.forEach(i => console.log(` → ${i}`));
assert(insights.areasToImprove.length >= 2, 'Should extract at least 2 areas to improve');

console.log(`\nBiggest Opportunity: "${insights.biggestOpportunity.quote}"`);
console.log(`CTA: [${insights.biggestOpportunity.ctaLabel}] -> ${insights.biggestOpportunity.ctaHref}`);
assert(insights.biggestOpportunity.quote.length > 5, 'Biggest opportunity quote must be present');
assert(insights.biggestOpportunity.ctaHref.startsWith('/'), 'CTA href must be a valid internal route');

// Test Case C: Monthly Delta Calculation
console.log('\n--- TEST Case C: Monthly Delta Calculation ---');
const deltaUp = calculateMonthlyDelta(72, 66);
console.log('Delta when score increased from 66 to 72:', deltaUp);
assert.strictEqual(deltaUp.text, '↑ 6 points this month');
assert.strictEqual(deltaUp.type, 'up');

const deltaDown = calculateMonthlyDelta(70, 75);
console.log('Delta when score decreased from 75 to 70:', deltaDown);
assert.strictEqual(deltaDown.text, '↓ 5 points this month');
assert.strictEqual(deltaDown.type, 'down');

const deltaStable = calculateMonthlyDelta(72, 72);
console.log('Delta when score unchanged:', deltaStable);
assert.strictEqual(deltaStable.text, 'Stable this month');
assert.strictEqual(deltaStable.type, 'neutral');

const deltaBaseline = calculateMonthlyDelta(72, undefined);
console.log('Delta when no previous history:', deltaBaseline);
assert.strictEqual(deltaBaseline.text, 'Baseline assessment');

console.log('\n=============================================');
console.log('ALL FUNDING READINESS SCORE TESTS PASSED! ✓');
console.log('=============================================');
