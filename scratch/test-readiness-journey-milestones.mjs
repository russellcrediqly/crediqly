// scratch/test-readiness-journey-milestones.mjs
import {
  OFFICIAL_READINESS_MILESTONES,
  validateMilestoneWeights,
  calculateMilestoneReadiness,
} from '../src/lib/readiness/readinessMilestoneEngine.ts';

console.log('=== TEST 1: MILESTONE WEIGHT VALIDATION ===');
const weightValidation = validateMilestoneWeights();
console.log('Total weight of official milestones:', weightValidation.totalWeight);
console.log('Is valid (equals exactly 100):', weightValidation.isValid);
if (!weightValidation.isValid || weightValidation.totalWeight !== 100) {
  throw new Error(`Weights failed validation! Total: ${weightValidation.totalWeight}`);
}
console.log('✓ PASS: Weights equal exactly 100 points.\n');

console.log('=== TEST 2: INITIAL EMPTY PROFILE SCORE ===');
const emptyProfile = {};
const initialResult = calculateMilestoneReadiness(emptyProfile, []);
console.log('Initial score for brand new profile:', initialResult.score);
console.log('Completed milestones count:', initialResult.completedMilestonesCount);
console.log('Next milestone:', initialResult.nextMilestone?.title);
console.log('Is journey complete:', initialResult.isJourneyComplete);
if (initialResult.score !== 0) {
  throw new Error(`Expected initial score to be 0, got ${initialResult.score}`);
}
if (initialResult.nextMilestone?.id !== 'm_profile_entity') {
  throw new Error(`Expected next step to be m_profile_entity, got ${initialResult.nextMilestone?.id}`);
}
console.log('✓ PASS: Initial empty profile starts at 0/100 and prioritizes Step 1.\n');

console.log('=== TEST 3: STEP-BY-STEP PROGRESSION & DETERMINISTIC MATH ===');
// Step 1: Entity (+5 pts)
const step1Profile = { entityType: 'LLC' };
const r1 = calculateMilestoneReadiness(step1Profile, []);
console.log('After Step 1 (Entity): Score =', r1.score, '(Expected 5)');
if (r1.score !== 5) throw new Error(`Score mismatch at Step 1: ${r1.score}`);

// Step 2: EIN (+5 pts) -> 10 pts
const step2Profile = { ...step1Profile, hasEIN: 'yes' };
const r2 = calculateMilestoneReadiness(step2Profile, []);
console.log('After Step 2 (EIN): Score =', r2.score, '(Expected 10)');
if (r2.score !== 10) throw new Error(`Score mismatch at Step 2: ${r2.score}`);

// Step 3: Business Bank (+5 pts) -> 15 pts
const step3Profile = { ...step2Profile, hasBusinessBankAccount: 'yes' };
const r3 = calculateMilestoneReadiness(step3Profile, []);
console.log('After Step 3 (Bank): Score =', r3.score, '(Expected 15)');
if (r3.score !== 15) throw new Error(`Score mismatch at Step 3: ${r3.score}`);

// Step 4: Commercial Presence (+5 pts) -> 20 pts
const step4Profile = { ...step3Profile, hasWebsite: 'yes', hasBusinessPhone: 'yes', hasBusinessEmail: 'yes' };
const r4 = calculateMilestoneReadiness(step4Profile, []);
console.log('After Step 4 (Presence): Score =', r4.score, '(Expected 20)');
if (r4.score !== 20) throw new Error(`Score mismatch at Step 4: ${r4.score}`);

// Step 5: Commercial Address & License (+5 pts) -> 25 pts (Foundation Complete)
const step5Profile = { ...step4Profile, hasBusinessAddress: 'yes', hasBusinessLicense: 'yes' };
const r5 = calculateMilestoneReadiness(step5Profile, []);
console.log('After Step 5 (Foundation complete): Score =', r5.score, '(Expected 25)');
if (r5.score !== 25) throw new Error(`Score mismatch at Step 5: ${r5.score}`);
if (r5.nextMilestone?.id !== 'm_duns_bureau') {
  throw new Error(`Expected next milestone to be m_duns_bureau, got ${r5.nextMilestone?.id}`);
}
console.log('✓ PASS: Foundation completed, accurately advanced to Credit Profile & Tradelines (m_duns_bureau).\n');

console.log('=== TEST 4: CUSTOMER CONFIRMATION MILESTONE COMPLETION ===');
// Step 6: DUNS (+10 pts) -> 35 pts
const step6Profile = { ...step5Profile, hasBusinessCreditProfile: 'yes' };
const r6 = calculateMilestoneReadiness(step6Profile, []);
console.log('After Step 6 (DUNS): Score =', r6.score, '(Expected 35)');

// Step 7: Tradeline customer confirmation (+10 pts) -> 45 pts
const r7 = calculateMilestoneReadiness(step6Profile, ['m_tier1_tradelines']);
console.log('After Step 7 (Customer confirmed tradeline): Score =', r7.score, '(Expected 45)');
if (r7.score !== 45) throw new Error(`Score mismatch at Step 7: ${r7.score}`);

// Step 8: Credit depth customer confirmation (+5 pts) -> 50 pts
const r8 = calculateMilestoneReadiness(step6Profile, ['m_tier1_tradelines', 'm_credit_depth']);
console.log('After Step 8 (Credit depth confirmed): Score =', r8.score, '(Expected 50)');
if (r8.score !== 50) throw new Error(`Score mismatch at Step 8: ${r8.score}`);
console.log('✓ PASS: Customer confirmation tags correctly increase score with exact weight.\n');

console.log('=== TEST 5: FULL 14-MILESTONE 100/100 COMPLETION ===');
const fullTags = [
  'm_tier1_tradelines',
  'm_credit_depth',
  'm_revolving_card',
  'm_utilization_payment',
  'm_credit_monitoring',
  'm_funding_profile',
  'm_revenue_operating',
  'm_documentation_pack',
];
const fullProfile = {
  ...step6Profile,
  knowsBusinessCreditScore: 'yes',
  fundingAmount: '$150,000',
  annualRevenueRange: '$250,000 - $500,000',
  businessAge: '3 years',
};
const fullResult = calculateMilestoneReadiness(fullProfile, fullTags);
console.log('Full score:', fullResult.score, '/ 100');
console.log('Completed milestones count:', fullResult.completedMilestonesCount, 'of', fullResult.totalMilestonesCount);
console.log('Is journey complete:', fullResult.isJourneyComplete);
console.log('Next milestone:', fullResult.nextMilestone);
if (fullResult.score !== 100) {
  throw new Error(`Expected 100/100, got ${fullResult.score}`);
}
if (!fullResult.isJourneyComplete) {
  throw new Error('Expected isJourneyComplete to be true');
}
console.log('✓ PASS: 100/100 state successfully achieved and flagged.\n');

console.log('=== TEST 6: ADMIN WEIGHT OVERRIDES RECALCULATION ===');
const overrides = {
  m_profile_entity: { weight: 10, active: true },
  m_ein: { weight: 10, active: true },
  m_documentation_pack: { weight: 0, active: false },
};
const overrideResult = calculateMilestoneReadiness(step2Profile, [], overrides);
// Entity (10) + EIN (10) = 20 pts
console.log('Score with admin weight overrides (Entity 10 + EIN 10):', overrideResult.score, '(Expected 20)');
if (overrideResult.score !== 20) {
  throw new Error(`Expected 20 with overrides, got ${overrideResult.score}`);
}
console.log('✓ PASS: Score adapts dynamically to admin weight overrides.\n');

console.log('=== ALL TESTS PASSED! ===');
