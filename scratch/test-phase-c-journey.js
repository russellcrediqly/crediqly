// Automated test script for Phase C: 5-Stage Business Credit Journey
import assert from 'node:assert';

console.log('================================================================');
console.log('TEST SUITE: PHASE C — 5-STAGE BUSINESS CREDIT JOURNEY');
console.log('================================================================\n');

// Replication of calculateCustomerJourney logic for Node verification
function calculateCustomerJourney(business, businessReadiness, creditReadiness, fundingReadiness, trackedAppsCount = 0) {
  const isProfileComplete = Boolean(business?.profileCompleted);

  // Stage 1: 01 ESTABLISH
  const hasEntity = Boolean(business?.entityType && business.entityType.trim() !== '' && business.entityType !== 'Not sure');
  const hasEIN = business?.hasEIN === 'yes';
  const hasBank = business?.hasBusinessBankAccount === 'yes';
  const stage1Complete = isProfileComplete && hasEntity && hasEIN && hasBank;
  const stage1Progress = stage1Complete ? 100 : Math.round(((hasEntity ? 30 : 0) + (hasEIN ? 35 : 0) + (hasBank ? 35 : 0)));

  // Stage 2: 02 BUILD
  const hasCreditProfile = business?.hasBusinessCreditProfile === 'yes';
  const hasReporting = business?.hasReportingAccounts === 'yes';
  const stage2Complete = stage1Complete && (hasCreditProfile || hasReporting || creditReadiness.score >= 40);
  const stage2Progress = stage2Complete ? 100 : stage1Complete ? 50 : 15;

  // Stage 3: 03 STRENGTHEN
  const hasCard = business?.hasBusinessCreditCard === 'yes';
  const highAccountCount = business?.businessCreditAccountCount === '4-5' || business?.businessCreditAccountCount === '6-10' || business?.businessCreditAccountCount === '10+';
  const stage3Complete = stage2Complete && hasReporting && (hasCard || highAccountCount || creditReadiness.score >= 60);
  const stage3Progress = stage3Complete ? 100 : stage2Complete ? 60 : 10;

  // Stage 4: 04 FUNDING READY
  const isFundingScoreReady = fundingReadiness.score >= 70 || ['Strong Readiness', 'Funding Ready'].includes(fundingReadiness.level);
  const stage4Complete = stage3Complete && isFundingScoreReady;
  const stage4Progress = stage4Complete ? 100 : stage3Complete ? fundingReadiness.score : 10;

  // Stage 5: 05 SCALE
  const hasFinancingOrApps = trackedAppsCount > 0 || business?.hasFundingHistory === 'yes';
  const stage5Complete = stage4Complete && hasFinancingOrApps;
  const stage5Progress = stage5Complete ? 100 : stage4Complete ? 50 : 10;

  const stage1Status = stage1Complete ? 'completed' : 'in_progress';
  const stage2Status = stage2Complete ? 'completed' : stage1Complete ? 'in_progress' : 'upcoming';
  const stage3Status = stage3Complete ? 'completed' : stage2Complete ? 'in_progress' : 'upcoming';
  const stage4Status = stage4Complete ? 'completed' : stage3Complete ? 'in_progress' : 'upcoming';
  const stage5Status = stage5Complete ? 'completed' : stage4Complete ? 'in_progress' : 'upcoming';

  const stages = [
    {
      id: 1,
      numberPrefix: '01',
      title: 'Establish',
      fullTitle: '01 — ESTABLISH',
      shortExplanation: 'Establish your formal business entity, federal EIN, and dedicated commercial bank account.',
      status: stage1Status,
      progress: stage1Progress,
      recommendedAction: stage1Complete ? 'Business foundation and banking verified.' : 'Complete your profile questionnaire.',
      actionLabel: stage1Complete ? 'View Profile' : 'Complete Setup',
      actionHref: stage1Complete ? '/business' : '/onboarding',
    },
    {
      id: 2,
      numberPrefix: '02',
      title: 'Build',
      fullTitle: '02 — BUILD',
      shortExplanation: 'Register with major business credit bureaus and open initial Tier-1 Net-30 vendor tradelines.',
      status: stage2Status,
      progress: stage2Progress,
      recommendedAction: 'Open 2–3 Tier-1 Net-30 vendor accounts that report monthly.',
      actionLabel: 'Browse Net-30 Vendors',
      actionHref: '/products?category=net_30',
    },
    {
      id: 3,
      numberPrefix: '03',
      title: 'Strengthen',
      fullTitle: '03 — STRENGTHEN',
      shortExplanation: 'Continue building a stronger business-credit profile and improve your funding readiness.',
      status: stage3Status,
      progress: stage3Progress,
      recommendedAction: 'Establish revolving commercial credit cards and expand reporting accounts.',
      actionLabel: 'View Next Steps',
      actionHref: '/products?category=business_credit_cards',
    },
    {
      id: 4,
      numberPrefix: '04',
      title: 'Funding Ready',
      fullTitle: '04 — FUNDING READY',
      shortExplanation: 'Satisfy automated lender underwriting thresholds across cash flow, longevity, and credit depth.',
      status: stage4Status,
      progress: stage4Progress,
      recommendedAction: 'Review lender readiness factors and debt-service requirements.',
      actionLabel: 'Check Funding Criteria',
      actionHref: '/readiness',
    },
    {
      id: 5,
      numberPrefix: '05',
      title: 'Scale',
      fullTitle: '05 — SCALE',
      shortExplanation: 'Leverage established commercial credit to secure institutional capital and expand operations.',
      status: stage5Status,
      progress: stage5Progress,
      recommendedAction: 'Explore institutional term loans, lines of credit, and SBA capital.',
      actionLabel: 'Explore Funding Options',
      actionHref: '/funding',
    },
  ];

  const activeStep = stages.find((s) => s.status === 'in_progress') || (stage5Complete ? stages[4] : stages[0]);
  const currentStageLabel = `${activeStep.numberPrefix} — ${activeStep.title.toUpperCase()}`;

  return {
    stages,
    activeStep,
    totalSteps: 5,
    currentStageLabel,
  };
}

// -----------------------------------------------------------------------------
// TEST CASE 1: Brand New User / Incomplete Profile -> Should be in Stage 01 ESTABLISH
// -----------------------------------------------------------------------------
console.log('--- TEST CASE 1: Brand New / Incomplete Profile ---');
const res1 = calculateCustomerJourney(
  { profileCompleted: false, entityType: '' },
  { score: 10 },
  { score: 5 },
  { score: 15, level: 'Getting Started' }
);
console.log('Current Stage:', res1.currentStageLabel);
assert.strictEqual(res1.currentStageLabel, '01 — ESTABLISH');
assert.strictEqual(res1.stages[0].status, 'in_progress');
assert.strictEqual(res1.stages[1].status, 'upcoming');
console.log('✓ Stage 01 correct for brand new profile.\n');

// -----------------------------------------------------------------------------
// TEST CASE 2: Foundation Complete, No Credit Bureau Profile -> Should be in Stage 02 BUILD
// -----------------------------------------------------------------------------
console.log('--- TEST CASE 2: Foundation Complete, No Credit File ---');
const res2 = calculateCustomerJourney(
  {
    profileCompleted: true,
    entityType: 'Limited Liability Company (LLC)',
    hasEIN: 'yes',
    hasBusinessBankAccount: 'yes',
    hasBusinessCreditProfile: 'no',
    hasReportingAccounts: 'no',
  },
  { score: 70 },
  { score: 20 },
  { score: 40, level: 'Building Readiness' }
);
console.log('Current Stage:', res2.currentStageLabel);
assert.strictEqual(res2.currentStageLabel, '02 — BUILD');
assert.strictEqual(res2.stages[0].status, 'completed'); // ✓ Establish
assert.strictEqual(res2.stages[1].status, 'in_progress'); // → Build
assert.strictEqual(res2.stages[2].status, 'upcoming'); // ○ Strengthen
console.log('✓ Stage 02 correct when foundation is established.\n');

// -----------------------------------------------------------------------------
// TEST CASE 3: Credit Profile Established, Needs Tradelines & Cards -> Should be in Stage 03 STRENGTHEN
// -----------------------------------------------------------------------------
console.log('--- TEST CASE 3: Credit Profile Active, Needs Card & Tradelines ---');
const res3 = calculateCustomerJourney(
  {
    profileCompleted: true,
    entityType: 'Limited Liability Company (LLC)',
    hasEIN: 'yes',
    hasBusinessBankAccount: 'yes',
    hasBusinessCreditProfile: 'yes',
    hasReportingAccounts: 'no',
    hasBusinessCreditCard: 'no',
  },
  { score: 85 },
  { score: 45 },
  { score: 55, level: 'Developing' }
);
console.log('Current Stage:', res3.currentStageLabel);
console.log('Visual representation:');
res3.stages.forEach(s => {
  const symbol = s.status === 'completed' ? '✓' : s.status === 'in_progress' ? '→' : '○';
  console.log(` ${symbol} ${s.title}`);
});
assert.strictEqual(res3.currentStageLabel, '03 — STRENGTHEN');
assert.strictEqual(res3.stages[0].status, 'completed'); // ✓ Establish
assert.strictEqual(res3.stages[1].status, 'completed'); // ✓ Build
assert.strictEqual(res3.stages[2].status, 'in_progress'); // → Strengthen
assert.strictEqual(res3.stages[3].status, 'upcoming'); // ○ Funding Ready
assert.strictEqual(res3.stages[4].status, 'upcoming'); // ○ Scale
console.log('✓ Stage 03 correct matching prompt example: ✓ Establish, ✓ Build, → Strengthen, ○ Funding Ready, ○ Scale\n');

// -----------------------------------------------------------------------------
// TEST CASE 4: Tradelines & Card Active, Score < 70 -> Stage 04 FUNDING READY
// -----------------------------------------------------------------------------
console.log('--- TEST CASE 4: Tradelines Active, Preparing for Funding ---');
const res4 = calculateCustomerJourney(
  {
    profileCompleted: true,
    entityType: 'Limited Liability Company (LLC)',
    hasEIN: 'yes',
    hasBusinessBankAccount: 'yes',
    hasBusinessCreditProfile: 'yes',
    hasReportingAccounts: 'yes',
    businessCreditAccountCount: '4-5',
    hasBusinessCreditCard: 'yes',
  },
  { score: 90 },
  { score: 75 },
  { score: 68, level: 'Developing' }
);
console.log('Current Stage:', res4.currentStageLabel);
assert.strictEqual(res4.currentStageLabel, '04 — FUNDING READY');
assert.strictEqual(res4.stages[0].status, 'completed');
assert.strictEqual(res4.stages[1].status, 'completed');
assert.strictEqual(res4.stages[2].status, 'completed');
assert.strictEqual(res4.stages[3].status, 'in_progress');
console.log('✓ Stage 04 correct when credit depth is established.\n');

// -----------------------------------------------------------------------------
// TEST CASE 5: High Funding Readiness Score (85/100) & Applications -> Stage 05 SCALE
// -----------------------------------------------------------------------------
console.log('--- TEST CASE 5: High Funding Readiness & Applications ---');
const res5 = calculateCustomerJourney(
  {
    profileCompleted: true,
    entityType: 'Limited Liability Company (LLC)',
    hasEIN: 'yes',
    hasBusinessBankAccount: 'yes',
    hasBusinessCreditProfile: 'yes',
    hasReportingAccounts: 'yes',
    businessCreditAccountCount: '6-10',
    hasBusinessCreditCard: 'yes',
    hasFundingHistory: 'yes',
  },
  { score: 95 },
  { score: 85 },
  { score: 85, level: 'Strong Readiness' },
  1 // 1 tracked app
);
console.log('Current Stage:', res5.currentStageLabel);
assert.strictEqual(res5.stages[3].status, 'completed'); // ✓ Funding Ready
assert.strictEqual(res5.stages[4].status, 'completed'); // ✓ Scale
console.log('✓ Stage 05 correct for high readiness and active funding applications.\n');

// -----------------------------------------------------------------------------
// TEST CASE 6: Zero Lockout Check
// -----------------------------------------------------------------------------
console.log('--- TEST CASE 6: Zero Lockout Verification ---');
res1.stages.forEach(stage => {
  assert(stage.actionHref.startsWith('/'), `Stage actionHref must be an accessible internal route: ${stage.actionHref}`);
  assert(stage.shortExplanation.length > 10, 'Must have a descriptive explanation');
  assert(typeof stage.progress === 'number', 'Must have numeric progress');
});
console.log('✓ All 5 stages have navigable action routes with zero platform lockout.\n');

console.log('================================================================');
console.log('ALL PHASE C BUSINESS CREDIT JOURNEY TESTS PASSED! (6/6 PASS) ✓');
console.log('================================================================');
