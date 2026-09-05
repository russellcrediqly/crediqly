import assert from 'node:assert';
import {
  sanitizeUserPrompt,
  sanitizeCustomerContext,
  buildAIMentorSystemPrompt,
} from '../src/lib/ai/mentorPrivacySanitizer.ts';
import { generateDeterministicAIMentorAnswer } from '../src/lib/ai/mentorFallbackEngine.ts';

console.log('🧪 RUNNING PHASE E: DATA-AWARE AI MENTOR TEST SUITE...\n');

// Mock customer profile data
const mockMidGrowthContext = {
  businessName: 'Midtown Logistics LLC',
  fundingReadinessScore: 68,
  readinessLevel: 'Developing',
  businessReadinessScore: 75,
  creditReadinessScore: 60,
  profileCompleted: true,
  profileCompletionPercentage: 100,
  businessAge: '1–2 years',
  annualRevenue: '$100,000–$250,000',
  personalCreditTier: 'Good (680–719)',
  hasBusinessCreditProfile: 'yes',
  currentJourneyStage: '03 — STRENGTHEN',
  readinessFactors: [
    { area: 'Business Profile', status: 'strong', score: 90 },
    { area: 'Business Age', status: 'good', score: 75 },
    { area: 'Business Credit Depth', status: 'needs_improvement', score: 50 },
    { area: 'Revenue', status: 'good', score: 70 },
    { area: 'Cash Flow Consistency', status: 'needs_improvement', score: 45 },
  ],
  topNextActions: [
    { title: 'Improve Business Credit Depth', priority: 'High', category: 'Credit Building' },
    { title: 'Maintain Consistent Business Deposits', priority: 'Medium', category: 'Banking' },
    { title: 'Review Funding Readiness', priority: 'Medium', category: 'Readiness' },
  ],
  fundingMatches: [
    { tier: 'Strong Match', category: 'Business Line of Credit', range: '$10K–$50K' },
    { tier: 'Possible Match', category: 'Business Credit Card', range: '$5K–$25K' },
    { tier: 'Improve Readiness First', category: 'SBA Financing', range: '$50K–$500K' },
  ],
};

const mockIncompleteContext = {
  businessName: 'Brand New Startup LLC',
  fundingReadinessScore: 25,
  readinessLevel: 'Getting Started',
  businessReadinessScore: 30,
  creditReadinessScore: 20,
  profileCompleted: false,
  profileCompletionPercentage: 35,
  currentJourneyStage: '01 — ESTABLISH',
  readinessFactors: [],
  topNextActions: [],
  fundingMatches: [],
};

// 1. Test Privacy Sanitizer & Secret Scrubbing
console.log('--- Test 1: Privacy Sanitizer & Credential Redaction ---');
const leakPrompt = 'My SSN is 123-45-6789, card 4111 2222 3333 4444, password: secretPassword123, key: sk_live_abcdef1234567890!';
const sanitized = sanitizeUserPrompt(leakPrompt);

assert.ok(!sanitized.includes('123-45-6789'), 'SSN must be redacted');
assert.ok(!sanitized.includes('4111 2222 3333 4444'), 'Payment card must be redacted');
assert.ok(!sanitized.includes('secretPassword123'), 'Password must be redacted');
assert.ok(!sanitized.includes('sk_live_abcdef1234567890'), 'Secret API key must be redacted');
assert.ok(sanitized.includes('[REDACTED_SENSITIVE_DATA]'), 'Redaction placeholder must be inserted');
console.log('Sanitized output:', sanitized);
console.log('✅ Test 1 Passed: Complete privacy defense verified.\n');

// 2. Test Question about Readiness
console.log('--- Test 2: Question about Readiness ---');
const readinessAnswer = generateDeterministicAIMentorAnswer(
  'What is lowering my funding readiness?',
  sanitizeCustomerContext(mockMidGrowthContext)
);
assert.ok(readinessAnswer.answer, 'Must generate answer');
assert.ok(
  readinessAnswer.answer.includes('Business Credit Depth') || readinessAnswer.answer.includes('Cash Flow Consistency'),
  'Must specifically reference real customer lag factors'
);
assert.ok(readinessAnswer.nextStep?.href.includes('readiness'), 'Next step must point to readiness audit');
console.log('Readiness Answer:', readinessAnswer.answer);
console.log('Next step:', readinessAnswer.nextStep?.label, '->', readinessAnswer.nextStep?.href);
console.log('✅ Test 2 Passed: Data-aware readiness analysis verified.\n');

// 3. Test Question about Next Action
console.log('--- Test 3: Question about Next Action ---');
const actionAnswer = generateDeterministicAIMentorAnswer(
  'What should I improve first?',
  sanitizeCustomerContext(mockMidGrowthContext)
);
assert.ok(actionAnswer.answer.includes('Improve Business Credit Depth'), 'Must prioritize customer top next action');
assert.ok(actionAnswer.nextStep, 'Must provide concrete next step');
console.log('Next Action Answer:', actionAnswer.answer);
console.log('✅ Test 3 Passed: Priority next action guidance verified.\n');

// 4. Test Question about Why Score is 68
console.log('--- Test 4: Question about Score Explanation ---');
const scoreAnswer = generateDeterministicAIMentorAnswer(
  'Why is my readiness score 68?',
  sanitizeCustomerContext(mockMidGrowthContext)
);
assert.ok(scoreAnswer.answer.includes('68/100'), 'Must explain customer exact score');
assert.ok(scoreAnswer.nextStep?.href.includes('readiness'), 'Must point to readiness factors');
console.log('Score Answer:', scoreAnswer.answer);
console.log('✅ Test 4 Passed: Score breakdown verified.\n');

// 5. Test Question about Roadmap
console.log('--- Test 5: Question about Roadmap ---');
const roadmapAnswer = generateDeterministicAIMentorAnswer(
  'What should I do on my roadmap?',
  sanitizeCustomerContext(mockMidGrowthContext)
);
assert.ok(roadmapAnswer.answer.includes('03 — STRENGTHEN'), 'Must cite customer current stage');
assert.ok(roadmapAnswer.nextStep?.href.includes('roadmap'), 'Must point to roadmap');
console.log('Roadmap Answer:', roadmapAnswer.answer);
console.log('✅ Test 5 Passed: Roadmap navigation verified.\n');

// 6. Test Missing Customer Data Handling
console.log('--- Test 6: Missing Customer Data Handling ---');
const incompleteAnswer = generateDeterministicAIMentorAnswer(
  'What should I improve first?',
  sanitizeCustomerContext(mockIncompleteContext)
);
assert.ok(incompleteAnswer.answer.includes('35% complete'), 'Must recognize incomplete profile');
assert.ok(incompleteAnswer.nextStep?.href.includes('onboarding'), 'Must guide user to complete profile first');
console.log('Incomplete Answer:', incompleteAnswer.answer);
console.log('✅ Test 6 Passed: Incomplete profile safely handled.\n');

// 7. Compliance & Prohibited Language Inspection
console.log('--- Test 7: Strict Compliance & Zero Guarantees ---');
const allGeneratedAnswers = [
  readinessAnswer.answer,
  actionAnswer.answer,
  scoreAnswer.answer,
  roadmapAnswer.answer,
  incompleteAnswer.answer,
].join(' ');

const prohibited = ['You qualify', 'you qualify', 'You will be approved', 'guaranteed approval', 'guaranteed funding'];
for (const term of prohibited) {
  assert.ok(!allGeneratedAnswers.includes(term), `Prohibited term "${term}" found in mentor answers!`);
}
console.log('✅ Test 7 Passed: 100% non-guarantee compliant.\n');

console.log('🎉 ALL PHASE E AI MENTOR TESTS PASSED PERFECTLY!');
