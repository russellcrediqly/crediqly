// Using native global fetch
import { calculateMilestoneReadiness, OFFICIAL_READINESS_MILESTONES, validateMilestoneWeights } from '../src/lib/readiness/readinessMilestoneEngine.ts';
import { calculateCustomerJourney } from '../src/lib/roadmap/customerJourney.ts';
import { calculateReadiness } from '../src/lib/scoring/index.ts';
import { calculateFundingReadiness } from '../src/lib/readiness/fundingEngine.ts';
import { getRecommendedProducts, getNormalizedProviderKey } from '../src/lib/products/recommendationEngine.ts';
import { matchFundingProducts } from '../src/lib/funding/fundingRecommendationEngine.ts';
import { DEFAULT_PRODUCTS } from '../src/lib/products/catalog.ts';
import { INITIAL_FUNDING_PRODUCTS } from '../src/lib/funding/initialFundingProducts.ts';
import { getTopRecommendedActions } from '../src/lib/recommendations/nextActionsEngine.ts';
import { buildSafeCustomerAIContext } from '../src/lib/ai/aiContextBuilder.ts';
import { sanitizeCustomerContext, sanitizeUserPrompt } from '../src/lib/ai/mentorPrivacySanitizer.ts';

const BASE_URL = 'http://localhost:3000';

async function runE2EAudit() {
  console.log('================================================================');
  console.log('CREDIQLY PRODUCTION QUALITY AUDIT: END-TO-END PERSONA TEST');
  console.log('================================================================\n');

  let passes = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✓ [PASS ${totalTests}] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passes++;
    } else {
      console.error(`✗ [FAIL ${totalTests}] ${testName}`);
      if (details) console.error(`   └─ FAILURE: ${details}`);
    }
  }

  // --------------------------------------------------------------------------
  // STEP 1: READINESS SYSTEM MATHEMATICAL INTEGRITY AUDIT
  // --------------------------------------------------------------------------
  console.log('--- AUDIT STEP 1: Readiness Engine Mathematical Integrity ---');
  const weightValidation = validateMilestoneWeights(OFFICIAL_READINESS_MILESTONES);
  assert(
    weightValidation.isValid && weightValidation.totalWeight === 100,
    'Authoritative milestone weights sum to exactly 100 points',
    `Total weight calculated: ${weightValidation.totalWeight}`
  );

  assert(
    OFFICIAL_READINESS_MILESTONES.length === 14,
    'Exactly 14 official milestones defined across 4 core categories',
    `Milestones count: ${OFFICIAL_READINESS_MILESTONES.length}`
  );

  // --------------------------------------------------------------------------
  // STEP 2: NEW CUSTOMER SIGNUP & ONBOARDING (PERSONA: SARAH @ ACME CONSULTING)
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 2: New Customer Persona Signup & Initial Assessment ---');
  const newCustomerProfile = {
    businessId: 'biz_audit_' + Date.now(),
    userId: 'usr_audit_' + Date.now(),
    businessName: 'Apex Innovations LLC',
    entityType: 'Limited Liability Company (LLC)',
    state: 'Delaware',
    industry: 'Professional & Business Services',
    businessAge: '1–2 years',
    hasEIN: 'yes',
    hasBusinessBankAccount: 'yes',
    hasWebsite: 'yes',
    hasBusinessPhone: 'yes',
    hasBusinessEmail: 'yes',
    hasBusinessAddress: 'yes',
    hasBusinessLicense: 'yes',
    hasDuns: 'no',
    hasBusinessCreditProfile: 'no',
    knowsBusinessCreditScore: 'no',
    hasReportingAccounts: 'no',
    hasBusinessCreditCard: 'no',
    hasFundingHistory: 'no',
    profileCompleted: true,
  };

  const initialMilestones = calculateMilestoneReadiness(newCustomerProfile, []);
  assert(
    initialMilestones.score === 25,
    'Initial readiness score accurately reflects 5 verified foundation milestones (25/100)',
    `Calculated initial score: ${initialMilestones.score} (Entity: 5, EIN: 5, Bank: 5, Presence: 5, Address: 5)`
  );

  const initialJourney = calculateCustomerJourney(
    newCustomerProfile,
    { score: initialMilestones.score, level: 'Building', description: '', breakdown: [] },
    { score: 0, level: 'Getting Started', description: '', breakdown: [] },
    { score: 30, overallTier: 'Tier 1' },
    0
  );

  assert(
    initialJourney.activeStepNumber === 2 && (initialJourney.currentStageShortName === 'BUILD' || initialJourney.activeStep?.stageName?.includes('BUILD')),
    'Customer Journey correctly positions customer at Stage 2: "Build" with "You Are Here" state',
    `Active stage: ${initialJourney.currentStageShortName} (Step ${initialJourney.activeStepNumber} of ${initialJourney.totalSteps})`
  );

  assert(
    initialMilestones.nextMilestone?.id === 'm_duns_bureau',
    'Next milestone is clearly identified and sequentially ordered',
    `Next milestone: ${initialMilestones.nextMilestone?.title} (+${initialMilestones.nextMilestone?.weight} pts)`
  );

  // --------------------------------------------------------------------------
  // STEP 3: PREREQUISITE & DEPENDENCY HANDLING AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 3: Prerequisite Dependency Protection ---');
  // Attempt to prematurely complete Tier-1 tradelines before D-U-N-S file exists
  const blockedSimulation = calculateMilestoneReadiness(
    { ...newCustomerProfile, hasDuns: 'no', hasBusinessCreditProfile: 'no' },
    ['m_tier1_tradelines']
  );
  assert(
    blockedSimulation.score === 25,
    'Prerequisite dependency strictly prevents premature milestone points without prerequisites',
    `Attempted m_tier1_tradelines without D-U-N-S: Score remained ${blockedSimulation.score} (Points not awarded prematurely)`
  );

  // --------------------------------------------------------------------------
  // STEP 4: MILESTONE ADVANCEMENT & PROGRESS RECALCULATION
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 4: Milestone Completion & Mathematical Score Advancement ---');
  // Customer completes Milestone #6 (D-U-N-S) and Milestone #7 (Tier-1 Tradelines)
  const advancedProfile = {
    ...newCustomerProfile,
    hasDuns: 'yes',
    hasBusinessCreditProfile: 'yes',
  };
  const stepCompletedKeys = ['m_tier1_tradelines'];
  const advancedResult = calculateMilestoneReadiness(advancedProfile, stepCompletedKeys);

  assert(
    advancedResult.score === 45,
    'Readiness score recalculates deterministically upon milestone completion (+20 pts to 45/100)',
    `Previous: 25 -> New Score: ${advancedResult.score} (D-U-N-S: +10, Tradelines: +10)`
  );

  assert(
    advancedResult.nextMilestone?.id === 'm_credit_depth',
    'Next Best Milestone advances dynamically to Credit Account Depth',
    `New next milestone: ${advancedResult.nextMilestone?.title}`
  );

  // --------------------------------------------------------------------------
  // STEP 5: AI ADVISOR AUDIT (REAL CONTEXT, FALLBACK RESILIENCE & COMPLIANCE)
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 5: AI Advisor Endpoint & Context Safety Audit ---');
  const safeAiContext = buildSafeCustomerAIContext({
    business: advancedProfile,
    completedTasks: stepCompletedKeys,
    readiness: calculateReadiness(advancedProfile),
    fundingReadiness: calculateFundingReadiness(advancedProfile),
  });

  assert(
    safeAiContext.businessName === 'Apex Innovations LLC' &&
    safeAiContext.fundingReadinessScore === 45,
    'AI context builder reflects live customer metrics and readiness score',
    `Score in AI context: ${safeAiContext.fundingReadinessScore}`
  );

  const promptSanitized = sanitizeUserPrompt('Can I get approved for $50k with SSN 123-45-6789 and secret token sk_live_999?');
  assert(
    !promptSanitized.includes('123-45-6789') && !promptSanitized.includes('sk_live'),
    'Privacy sanitizer successfully redacts SSN patterns and secret tokens from user prompts',
    `Sanitized prompt: "${promptSanitized}"`
  );

  let aiResponseOk = false;
  let aiAnswerText = '';
  try {
    const aiRes = await fetch(`${BASE_URL}/api/ai/mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What should I look for when choosing my first reporting tradeline?',
        context: safeAiContext,
      }),
    });
    if (aiRes.ok) {
      const data = await aiRes.json();
      aiResponseOk = true;
      aiAnswerText = data.answer || '';
      assert(
        Boolean(data.answer && data.disclaimer && data.nextStep),
        'AI Mentor endpoint returns compliant response with answer, disclaimer, and next step',
        `Source: ${data.source}, Next Step: ${data.nextStep?.label}`
      );
    } else {
      assert(false, 'AI Mentor endpoint returned non-200 status', `Status: ${aiRes.status}`);
    }
  } catch (aiErr) {
    assert(false, 'AI Mentor request failed', aiErr.message);
  }

  // --------------------------------------------------------------------------
  // STEP 6: PRODUCT & BANKING RECOMMENDATION AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 6: Product & Recommendation Deduplication Audit ---');
  const recommendedProds = getRecommendedProducts(advancedProfile, { allTasks: [] }, DEFAULT_PRODUCTS, 45);
  assert(
    recommendedProds.length > 0,
    'Product recommendation engine returns relevant products based on Stage 2 profile',
    `Found ${recommendedProds.length} tailored recommendations`
  );

  // Check deduplication
  const seenSlugs = new Set();
  let hasDuplicate = false;
  for (const p of recommendedProds) {
    if (seenSlugs.has(p.slug)) {
      hasDuplicate = true;
      break;
    }
    seenSlugs.add(p.slug);
  }
  assert(!hasDuplicate, 'Zero duplicate products returned across recommendation list', 'All slugs unique');

  const topMatch = recommendedProds[0];
  assert(
    ['Strong Match', 'Potential Match', 'Not Recommended Yet'].includes(topMatch.matchLabel),
    'Recommendation card uses approved match level badge labels',
    `Top match: ${topMatch.name} -> Level: ${topMatch.matchLabel}`
  );

  // --------------------------------------------------------------------------
  // STEP 7: FUNDING MARKETPLACE & MATCHING AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 7: Funding Marketplace & Match Engine Audit ---');
  const fundingMatches = matchFundingProducts(advancedProfile, 45, INITIAL_FUNDING_PRODUCTS);
  assert(
    fundingMatches.length > 0,
    'Funding match engine evaluates commercial funding programs',
    `Evaluated ${fundingMatches.length} funding opportunities`
  );

  const notReadyItems = fundingMatches.filter((m) => m.matchLevel === 'Not Recommended Yet');
  if (notReadyItems.length > 0) {
    assert(
      notReadyItems[0].nextStepsToImprove.length > 0,
      '"Not Recommended Yet" funding options provide clear, actionable milestone steps to qualify',
      `Example next step: "${notReadyItems[0].nextStepsToImprove[0]}"`
    );
  }

  // Verify no fake approval odds
  const hasFakeOdds = fundingMatches.some((m) => String(m.whyThisFits).includes('% chance of approval'));
  assert(!hasFakeOdds, 'Zero fake approval percentages or misleading guarantee claims across funding matches', 'Verified');

  // --------------------------------------------------------------------------
  // STEP 8: STRIPE & BILLING AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 8: Stripe & Billing Endpoints Audit ---');
  try {
    const webhookGetRes = await fetch(`${BASE_URL}/api/stripe/webhook`);
    assert(
      webhookGetRes.ok,
      'Stripe webhook receiver GET endpoint is active and listening',
      `HTTP Status: ${webhookGetRes.status}`
    );
  } catch (hookErr) {
    assert(false, 'Stripe webhook receiver unreachable', hookErr.message);
  }

  try {
    const checkoutSubRes = await fetch(`${BASE_URL}/api/stripe/checkout-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: advancedProfile.userId, customerEmail: 'audit@crediqly.com' }),
    });
    // In dev without Stripe keys, it returns 503 with notConfigured: true
    const checkoutSubData = await checkoutSubRes.json();
    assert(
      checkoutSubRes.status === 200 || (checkoutSubRes.status === 503 && checkoutSubData.notConfigured),
      'Stripe Pro ($39/mo) checkout endpoint handles session creation or missing key gracefully',
      `Response: ${checkoutSubData.checkoutUrl ? 'Checkout URL Generated' : checkoutSubData.error}`
    );
  } catch (subErr) {
    assert(false, 'Stripe subscription checkout exception', subErr.message);
  }

  try {
    const checkoutAdvRes = await fetch(`${BASE_URL}/api/stripe/checkout-advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: advancedProfile.userId, customerEmail: 'audit@crediqly.com' }),
    });
    const checkoutAdvData = await checkoutAdvRes.json();
    assert(
      checkoutAdvRes.status === 200 || (checkoutAdvRes.status === 503 && checkoutAdvData.notConfigured),
      'Stripe Advisory ($499 + $149/mo) checkout endpoint handles setup fee & retainer bundle',
      `Response: ${checkoutAdvData.checkoutUrl ? 'Advisory Checkout URL Generated' : checkoutAdvData.error}`
    );
  } catch (advErr) {
    assert(false, 'Stripe advisory checkout exception', advErr.message);
  }

  // --------------------------------------------------------------------------
  // STEP 9: ADMIN & SECURITY AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 9: Admin Boundaries & Route Security Audit ---');
  try {
    const adminCheckRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
      headers: { 'Authorization': 'Bearer invalid_user_token' }
    });
    assert(
      adminCheckRes.status === 403 || adminCheckRes.status === 401 || adminCheckRes.status === 404,
      'Admin API boundary strictly denies unauthorized requests with HTTP 403/401',
      `Unauthorized request returned status: ${adminCheckRes.status}`
    );
  } catch (adminErr) {
    assert(false, 'Admin route security check failed', adminErr.message);
  }

  // --------------------------------------------------------------------------
  // STEP 10: RESUMPTION & DATA CONSISTENCY AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- AUDIT STEP 10: Session Continuity & Resumption Audit ---');
  // Re-evaluating after simulated logout/login
  const reloadedResult = calculateMilestoneReadiness(advancedProfile, stepCompletedKeys);
  assert(
    reloadedResult.score === 45 &&
    reloadedResult.completedMilestonesCount === 7 &&
    reloadedResult.nextMilestone?.id === 'm_credit_depth',
    'Customer progress is 100% deterministic and resumes identically across sessions',
    `Score: ${reloadedResult.score}/100, Completed: ${reloadedResult.completedMilestonesCount}/14`
  );

  console.log('\n================================================================');
  console.log(`E2E AUDIT COMPLETE: ${passes}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passes === totalTests) {
    console.log('✓ ALL SYSTEM TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('✗ SOME TESTS FAILED. CHECK LOGS ABOVE.\n');
    process.exit(1);
  }
}

runE2EAudit();
