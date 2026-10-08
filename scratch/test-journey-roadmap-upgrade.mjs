import assert from 'node:assert';
import { calculateCustomerJourney } from '../src/lib/roadmap/customerJourney.ts';
import {
  calculateMilestoneReadiness,
  OFFICIAL_READINESS_MILESTONES,
  validateMilestoneWeights,
} from '../src/lib/readiness/readinessMilestoneEngine.ts';
import {
  MILESTONE_EDUCATION_REGISTRY,
  STAGE_PROGRAM_OVERVIEWS,
  getMilestoneEducation,
} from '../src/lib/roadmap/milestoneEducation.ts';

console.log('================================================================');
console.log('TEST SUITE: GUIDED JOURNEY & ROADMAP UPGRADE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: 5-Stage Guided Progression Names & Structure
// -----------------------------------------------------------------------------
console.log('--- TEST 1: 5-Stage Guided Progression ---');
const emptyJourney = calculateCustomerJourney(
  { profileCompleted: false, entityType: '' },
  { score: 0 },
  { score: 0 },
  { score: 10, level: 'Getting Started' }
);

assert.strictEqual(emptyJourney.totalSteps, 5, 'Must have exactly 5 journey stages');
assert.strictEqual(emptyJourney.stages[0].stageName, 'ESTABLISH');
assert.strictEqual(emptyJourney.stages[1].stageName, 'BUILD');
assert.strictEqual(emptyJourney.stages[2].stageName, 'STRENGTHEN');
assert.strictEqual(emptyJourney.stages[3].stageName, 'FUNDING READY');
assert.strictEqual(emptyJourney.stages[4].stageName, 'SCALE');

assert.strictEqual(emptyJourney.stages[0].title, 'Establish');
assert.strictEqual(emptyJourney.stages[1].title, 'Build');
assert.strictEqual(emptyJourney.stages[2].title, 'Strengthen');
assert.strictEqual(emptyJourney.stages[3].title, 'Funding Ready');
assert.strictEqual(emptyJourney.stages[4].title, 'Scale');

assert.strictEqual(emptyJourney.activeStepNumber, 1);
assert.strictEqual(emptyJourney.currentStageShortName, 'ESTABLISH');
assert.strictEqual(emptyJourney.currentStageLabel, '01 — ESTABLISH');
console.log('✓ 5 stages correctly configured (Establish → Build → Strengthen → Funding Ready → Scale)\n');

// -----------------------------------------------------------------------------
// TEST 2: "You Are Here" Progression Across States
// -----------------------------------------------------------------------------
console.log('--- TEST 2: "You Are Here" State Advancement ---');

// State 2: Foundation Complete -> Stage 2 (Build)
const buildProfile = {
  profileCompleted: true,
  entityType: 'LLC',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  hasBusinessCreditProfile: 'no',
  hasReportingAccounts: 'no',
};
const buildJourney = calculateCustomerJourney(
  buildProfile,
  { score: 80 },
  { score: 20 },
  { score: 35, level: 'Building Readiness' }
);
assert.strictEqual(buildJourney.activeStepNumber, 2);
assert.strictEqual(buildJourney.currentStageShortName, 'BUILD');
assert.strictEqual(buildJourney.stages[0].status, 'completed');
assert.strictEqual(buildJourney.stages[1].status, 'in_progress');
assert.strictEqual(buildJourney.stages[2].status, 'upcoming');
console.log('✓ Stage 2 (Build) active when foundation is established.');

// State 3: Bureau Active + Reporting Tradelines -> Stage 3 (Strengthen)
const strengthenProfile = {
  ...buildProfile,
  hasBusinessCreditProfile: 'yes',
  hasReportingAccounts: 'yes',
  businessCreditAccountCount: '1-3',
  hasBusinessCreditCard: 'no',
};
const strengthenJourney = calculateCustomerJourney(
  strengthenProfile,
  { score: 90 },
  { score: 45 },
  { score: 55, level: 'Building Readiness' }
);
assert.strictEqual(strengthenJourney.activeStepNumber, 3);
assert.strictEqual(strengthenJourney.currentStageShortName, 'STRENGTHEN');
assert.strictEqual(strengthenJourney.stages[0].status, 'completed');
assert.strictEqual(strengthenJourney.stages[1].status, 'completed');
assert.strictEqual(strengthenJourney.stages[2].status, 'in_progress');
console.log('✓ Stage 3 (Strengthen) active when tradelines are established.');

// State 4: High Readiness (70+) -> Stage 4 (Funding Ready)
const fundingReadyProfile = {
  ...strengthenProfile,
  hasBusinessCreditCard: 'yes',
  businessCreditAccountCount: '4-5',
};
const fundingJourney = calculateCustomerJourney(
  fundingReadyProfile,
  { score: 95 },
  { score: 80 },
  { score: 68, level: 'Developing' }
);
assert.strictEqual(fundingJourney.activeStepNumber, 4);
assert.strictEqual(fundingJourney.currentStageShortName, 'FUNDING READY');
console.log('✓ Stage 4 (Funding Ready) active when credit depth established and preparing for funding.');

// State 5: Active Funding Application / History -> Stage 5 (Scale)
const scaleJourney = calculateCustomerJourney(
  fundingReadyProfile,
  { score: 100 },
  { score: 90 },
  { score: 85, level: 'Funding Ready' },
  1 // 1 tracked funding application
);
assert.strictEqual(scaleJourney.activeStepNumber, 5);
assert.strictEqual(scaleJourney.currentStageShortName, 'SCALE');
assert.strictEqual(scaleJourney.stages[3].status, 'completed');
assert.strictEqual(scaleJourney.stages[4].status, 'completed');
console.log('✓ Stage 5 (Scale) active when funding applications are tracked.\n');

// -----------------------------------------------------------------------------
// TEST 3: Prerequisite Dependency Flow
// -----------------------------------------------------------------------------
console.log('--- TEST 3: Prerequisite Dependency Chain ---');
// Prerequisite Chain:
// Entity -> EIN -> Bank -> DUNS -> Tradelines -> Credit Depth -> Revolving Card -> Utilization
const entityDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_profile_entity');
const einDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_ein');
const bankDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_business_bank');
const dunsDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_duns_bureau');
const tradelineDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_tier1_tradelines');
const depthDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_credit_depth');
const cardDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_revolving_card');
const utilDef = OFFICIAL_READINESS_MILESTONES.find((m) => m.id === 'm_utilization_payment');

assert.strictEqual(einDef.prerequisiteId, 'm_profile_entity', 'EIN requires Entity');
assert.strictEqual(bankDef.prerequisiteId, 'm_ein', 'Bank requires EIN');
assert.strictEqual(dunsDef.prerequisiteId, 'm_business_bank', 'DUNS requires Bank');
assert.strictEqual(tradelineDef.prerequisiteId, 'm_duns_bureau', 'Tradelines require DUNS');
assert.strictEqual(depthDef.prerequisiteId, 'm_tier1_tradelines', 'Credit Depth requires Tradelines');
assert.strictEqual(cardDef.prerequisiteId, 'm_tier1_tradelines', 'Revolving Card requires Tradelines');
assert.strictEqual(utilDef.prerequisiteId, 'm_revolving_card', 'Utilization requires Revolving Card');

// Verify that if a user tries to self-confirm tradelines without having bank/DUNS,
// the milestone engine flags isBlockedByPrereq = true!
const skipPrereqProfile = {
  entityType: 'LLC',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'no', // Missing bank!
  hasReportingAccounts: 'yes', // User self-reports tradeline!
};
const skipResult = calculateMilestoneReadiness(skipPrereqProfile, ['m_tier1_tradelines']);
const tradelineItem = skipResult.items.find((i) => i.definition.id === 'm_tier1_tradelines');
assert.strictEqual(tradelineItem.isBlockedByPrereq, true, 'Tradeline must be blocked when Bank is missing');
assert.strictEqual(tradelineItem.isCompleted, false, 'Blocked tradeline cannot award points');
console.log('✓ Prerequisite chain strictly enforced. Blocked milestones award zero premature points.\n');

// -----------------------------------------------------------------------------
// TEST 4: Verification Transparency (Customer Confirmed vs System Verified)
// -----------------------------------------------------------------------------
console.log('--- TEST 4: Verification Transparency Labeling ---');
const customerConfirmedCount = OFFICIAL_READINESS_MILESTONES.filter(
  (m) => m.completionType === 'customer_confirmation'
).length;
const systemVerifiedCount = OFFICIAL_READINESS_MILESTONES.filter(
  (m) => m.completionType === 'system_verified'
).length;

assert(customerConfirmedCount >= 5, 'Must have at least 5 customer-confirmed milestones');
assert(systemVerifiedCount >= 7, 'Must have at least 7 system-verified milestones');

// Tradelines, Depth, Revolving Card, Low Utilization, Document Pack MUST be customer_confirmation
assert.strictEqual(tradelineDef.completionType, 'customer_confirmation');
assert.strictEqual(depthDef.completionType, 'customer_confirmation');
assert.strictEqual(cardDef.completionType, 'customer_confirmation');
assert.strictEqual(utilDef.completionType, 'customer_confirmation');

// Entity, EIN, Bank, Address MUST be system_verified
assert.strictEqual(entityDef.completionType, 'system_verified');
assert.strictEqual(einDef.completionType, 'system_verified');
assert.strictEqual(bankDef.completionType, 'system_verified');
console.log(`✓ Verification types verified: ${systemVerifiedCount} System Verified, ${customerConfirmedCount} Customer Confirmed.\n`);

// -----------------------------------------------------------------------------
// TEST 5: Micro-Education Knowledge Base Completeness
// -----------------------------------------------------------------------------
console.log('--- TEST 5: Micro-Education Knowledge Base ---');
assert(Object.keys(MILESTONE_EDUCATION_REGISTRY).length >= 14, 'All 14 milestones must have micro-education');

for (const [id, edu] of Object.entries(MILESTONE_EDUCATION_REGISTRY)) {
  assert(edu.whatItIs && edu.whatItIs.length > 20, `Milestone ${id} must have concise What It Is`);
  assert(edu.whyItMatters && edu.whyItMatters.length > 20, `Milestone ${id} must have Why It Matters`);
  assert(Array.isArray(edu.whatToDo) && edu.whatToDo.length >= 2, `Milestone ${id} must have What To Do steps`);
  assert(Array.isArray(edu.whatToAvoid) && edu.whatToAvoid.length >= 1, `Milestone ${id} must have What To Avoid`);
  assert(edu.whenToMoveForward && edu.whenToMoveForward.length > 10, `Milestone ${id} must have When To Move Forward`);
  assert(edu.askAiPrompt && edu.askAiPrompt.length > 15, `Milestone ${id} must have Ask AI prompt`);
}
console.log('✓ All 14 milestones contain complete, concise 5-section micro-education & AI prompts.\n');

// -----------------------------------------------------------------------------
// TEST 6: Stage Opportunities & Funding Transition Language
// -----------------------------------------------------------------------------
console.log('--- TEST 6: Stage Opportunities & Funding Transition ---');
for (let stageNum = 1; stageNum <= 5; stageNum++) {
  const overview = STAGE_PROGRAM_OVERVIEWS[stageNum];
  assert(overview, `Stage ${stageNum} must have program overview`);
  assert(overview.biggestOpportunity, `Stage ${stageNum} must specify biggest opportunity`);
  assert(overview.objective, `Stage ${stageNum} must specify objective`);
}

// Stage 4 funding transition language check
const stage4Overview = STAGE_PROGRAM_OVERVIEWS[4];
assert(stage4Overview.fundingTransitionNotice, 'Stage 4 must have funding transition notice');
assert(
  stage4Overview.fundingTransitionNotice.includes('You may now have a stronger profile to explore funding options'),
  'Must match non-guaranteed funding transition language'
);
assert(
  !stage4Overview.fundingTransitionNotice.includes('guaranteed approval'),
  'Must NOT promise guaranteed approval'
);
console.log('✓ Stage opportunities and conditional funding transition language verified.\n');

// -----------------------------------------------------------------------------
// TEST 7: Milestone Weight Total Check
// -----------------------------------------------------------------------------
console.log('--- TEST 7: Milestone Weight Sum Validation ---');
const validation = validateMilestoneWeights();
assert.strictEqual(validation.isValid, true, 'Official milestones must sum to exactly 100 points');
assert.strictEqual(validation.totalWeight, 100);
console.log('✓ Official milestones sum to exactly 100 points.\n');

console.log('================================================================');
console.log('ALL GUIDED JOURNEY & ROADMAP UPGRADE TESTS PASSED! (7/7 PASS) ✓');
console.log('================================================================');
