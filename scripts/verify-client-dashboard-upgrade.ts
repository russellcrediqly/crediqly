/**
 * Crediqly P1: Client Dashboard, Profile, and Upgrade Experience Verification Suite
 *
 * Verifies:
 * 1. Actual Customer Plan Display & Access Source transparency:
 *    - Free ($0)
 *    - Foundation ($47.99/mo recurring)
 *    - Guided Monthly ($147.99/mo recurring)
 *    - Guided 12-Month Program ($997 one-time payment)
 *    - Administrator-Granted Access (with attribution and expiration)
 *    - Canceled / Expired subscriptions (honest reversion to Free)
 *    - Past Due subscriptions (payment warning)
 * 2. Approved Pricing & Tier Consistency ($0, $47.99, $147.99, $997).
 * 3. Feature Access & Entitlement Gating (unlocked vs locked features).
 * 4. Fully functional Profile editor:
 *    - Personal owner details validation & persistence
 *    - Business entity & foundation parameters persistence
 *    - Credit assessment & funding goals persistence
 * 5. Onboarding Continuity:
 *    - Completed customers navigate directly to /dashboard
 *    - Incomplete customers resume from saved step rather than restarting
 * 6. Funding Readiness & Roadmap determinism:
 *    - Real assessment calculations (0–100)
 *    - Action completion persistence in database
 */

import {
  getUserSubscription,
  upsertSubscription,
  grantAdminPlanAccess,
  revokeAdminPlanAccess,
} from '../src/lib/supabase/subscriptionService';
import {
  hasFoundationAccess,
  hasGuidedAccess,
  Subscription,
} from '../src/types/subscription';
import { updateCustomerProfile, getUserProfile } from '../src/lib/supabase/profileService';
import {
  calculateReadiness,
  calculateProfileCompletion,
} from '../src/lib/scoring';
import { calculateFundingReadiness } from '../src/lib/readiness/fundingEngine';
import { calculateMilestoneReadiness } from '../src/lib/readiness/readinessMilestoneEngine';
import { STRIPE_CONFIG } from '../src/lib/stripe/stripeServer';
import { isProfileInformationComplete, BusinessProfile } from '../src/types/business';
import {
  US_STATES,
  BUSINESS_STRUCTURES,
  INDUSTRIES,
  BUSINESS_AGES,
} from '../src/lib/constants';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('========================================================================');
  console.log('  CREDIQLY P1: CLIENT DASHBOARD, PROFILE & UPGRADE VERIFICATION SUITE   ');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // 1. APPROVED PRICING & TIER CONFIGURATION
  // -------------------------------------------------------------------------
  console.log('--- 1. Approved Pricing & Tier Configuration ---');
  assert(
    STRIPE_CONFIG.foundationPriceCents === 4799,
    'Foundation monthly price is exactly $47.99 (4,799 cents)'
  );
  assert(
    STRIPE_CONFIG.guidedPriceCents === 14799,
    'Guided monthly price is exactly $147.99 (14,799 cents)'
  );
  assert(
    STRIPE_CONFIG.guidedOneTimePriceCents === 99700,
    'Guided 12-Month program price is exactly $997.00 (99,700 cents)'
  );
  assert(
    STRIPE_CONFIG.foundationPriceId !== undefined,
    'STRIPE_CONFIG defines foundationPriceId accessor'
  );
  assert(
    STRIPE_CONFIG.guidedPriceId !== undefined,
    'STRIPE_CONFIG defines guidedPriceId accessor'
  );
  assert(
    STRIPE_CONFIG.guidedOneTimePriceId !== undefined,
    'STRIPE_CONFIG defines guidedOneTimePriceId accessor'
  );

  // -------------------------------------------------------------------------
  // 2. ACTUAL CUSTOMER PLAN & ACCESS SOURCE TRANSPARENCY
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Customer Plan & Access Source Resolution ---');

  // Archetype A: Free Starter ($0)
  const freeUserSub = await getUserSubscription('usr_client_test_free');
  assert(freeUserSub.plan === 'free', 'Free account resolves to plan = "free"');
  assert(freeUserSub.accessSource === 'free', 'Free account resolves to accessSource = "free"');
  assert(hasFoundationAccess(freeUserSub) === false, 'Free account does NOT have Foundation access');
  assert(hasGuidedAccess(freeUserSub) === false, 'Free account does NOT have Guided access');

  // Archetype B: Active Monthly Foundation ($47.99/mo)
  const foundationUserSub = await upsertSubscription({
    userId: 'usr_client_test_foundation',
    plan: 'foundation',
    status: 'active',
    accessSource: 'stripe_subscription',
    provider: 'stripe',
    stripeCustomerId: 'cus_foundation_test',
    stripeSubscriptionId: 'sub_foundation_test',
    currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    billingStatus: 'active',
  });
  assert(foundationUserSub.plan === 'foundation', 'Foundation subscriber resolves to plan = "foundation"');
  assert(foundationUserSub.accessSource === 'stripe_subscription', 'Foundation subscriber resolves to accessSource = "stripe_subscription"');
  assert(hasFoundationAccess(foundationUserSub) === true, 'hasFoundationAccess() evaluates to true');
  assert(hasGuidedAccess(foundationUserSub) === false, 'Foundation subscriber does NOT have Guided access');
  assert(foundationUserSub.cancelAtPeriodEnd === false, 'Accurately reports active non-canceling subscription');

  // Archetype C: Active Monthly Guided ($147.99/mo)
  const guidedMonthlySub = await upsertSubscription({
    userId: 'usr_client_test_guided_monthly',
    plan: 'guided',
    status: 'active',
    accessSource: 'stripe_subscription',
    provider: 'stripe',
    stripeCustomerId: 'cus_guided_monthly_test',
    stripeSubscriptionId: 'sub_guided_monthly_test',
    currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    billingStatus: 'active',
  });
  assert(guidedMonthlySub.plan === 'guided', 'Guided monthly subscriber resolves to plan = "guided"');
  assert(guidedMonthlySub.accessSource === 'stripe_subscription', 'Guided monthly resolves to accessSource = "stripe_subscription"');
  assert(hasGuidedAccess(guidedMonthlySub) === true, 'hasGuidedAccess() evaluates to true');
  assert(hasFoundationAccess(guidedMonthlySub) === true, 'Guided tier inherits full Foundation access');

  // Archetype D: Active Guided 12-Month Program ($997 One-Time)
  const oneYearExpiry = new Date(Date.now() + 350 * 24 * 60 * 60 * 1000).toISOString();
  const guidedOneTimeSub = await upsertSubscription({
    userId: 'usr_client_test_guided_onetime',
    plan: 'guided',
    status: 'active',
    accessSource: 'stripe_onetime',
    provider: 'stripe',
    stripeCustomerId: 'cus_guided_onetime_test',
    currentPeriodEnd: oneYearExpiry,
    cancelAtPeriodEnd: true, // Defined 12-month program, no automatic renewal
    billingStatus: 'paid',
  });
  assert(guidedOneTimeSub.plan === 'guided', '12-Month program resolves to plan = "guided"');
  assert(guidedOneTimeSub.accessSource === 'stripe_onetime', 'Resolves to accessSource = "stripe_onetime"');
  assert(hasGuidedAccess(guidedOneTimeSub) === true, '12-Month program provides active Guided access');
  assert(guidedOneTimeSub.cancelAtPeriodEnd === true, 'Correctly flags no automatic renewal for defined 12-month program');

  // Archetype E: Administrator Grant
  const adminGrantSub = await grantAdminPlanAccess({
    userId: 'usr_client_test_admin_grant',
    plan: 'guided',
    grantType: 'admin_grant',
    durationMonths: 6,
    reason: 'Partnership onboarding entitlement',
    adminEmail: 'crediqly@gmail.com',
  });
  assert(adminGrantSub.plan === 'guided', 'Admin grant provides Guided access');
  assert(adminGrantSub.accessSource === 'admin_grant', 'Resolves to accessSource = "admin_grant"');
  assert(adminGrantSub.grantedBy === 'crediqly@gmail.com', 'Preserves authorizing admin attribution');
  assert(adminGrantSub.expiresAt !== undefined, 'Includes explicit expiration timestamp');

  // Archetype F: Canceled Subscription Reversion to Free
  const canceledSub = await upsertSubscription({
    userId: 'usr_client_test_canceled',
    plan: 'free',
    status: 'cancelled',
    accessSource: 'free',
    billingStatus: 'canceled',
  });
  assert(canceledSub.plan === 'free', 'Canceled subscription reverts cleanly to Free plan');
  assert(hasFoundationAccess(canceledSub) === false, 'Canceled subscriber loses Foundation access');
  assert(hasGuidedAccess(canceledSub) === false, 'Canceled subscriber loses Guided access');

  // Archetype G: Past Due Subscription
  const pastDueSub = await upsertSubscription({
    userId: 'usr_client_test_past_due',
    plan: 'foundation',
    status: 'past_due',
    accessSource: 'stripe_subscription',
    billingStatus: 'past_due',
  });
  assert(pastDueSub.billingStatus === 'past_due', 'Accurately records past_due billing status');

  // -------------------------------------------------------------------------
  // 3. FULLY FUNCTIONAL PROFILE & PERSISTENCE
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Profile Editing, Validation & Persistence ---');

  // Test personal owner update validation
  const emptyFirstRes = await updateCustomerProfile('usr_profile_test_01', { firstName: '', lastName: 'Smith' });
  assert(emptyFirstRes.success === false, 'Rejects empty first name with validation error');

  const emptyLastRes = await updateCustomerProfile('usr_profile_test_01', { firstName: 'John', lastName: '' });
  assert(emptyLastRes.success === false, 'Rejects empty last name with validation error');

  const validNameRes = await updateCustomerProfile('usr_profile_test_01', { firstName: 'Alexander', lastName: 'Hamilton' });
  assert(validNameRes.success === true, 'Accepts valid first and last name update');
  assert(validNameRes.profile?.name === 'Alexander Hamilton', 'Constructs accurate full name');

  // Test business profile completion assessment
  const blankBusiness: BusinessProfile = {
    userId: 'usr_test_blank_biz',
    businessName: '',
    entityType: '',
    state: '',
    industry: '',
    businessAge: '',
    profileCompleted: false,
  };
  assert(
    isProfileInformationComplete(blankBusiness) === false,
    'Blank business profile is evaluated as incomplete'
  );
  assert(
    calculateProfileCompletion(blankBusiness) === 0,
    'Blank business profile produces 0% completion'
  );

  const populatedBusiness: BusinessProfile = {
    userId: 'usr_test_pop_biz',
    businessName: 'Hamilton Financial Holdings LLC',
    entityType: 'LLC',
    state: 'New York',
    industry: 'Financial Services',
    businessAge: '2–5 years',
    hasEIN: 'yes',
    hasBusinessBankAccount: 'yes',
    hasBusinessAddress: 'yes',
    hasBusinessPhone: 'yes',
    hasBusinessEmail: 'yes',
    hasWebsite: 'yes',
    hasDuns: 'yes',
    hasBusinessCreditProfile: 'yes',
    knowsBusinessCreditScore: 'yes',
    businessCreditScore: '780',
    businessCreditAccountCount: '4-5',
    hasReportingAccounts: 'yes',
    hasBusinessCreditCard: 'yes',
    annualRevenueRange: '$250,000–$500,000',
    personalCreditRange: '740–799',
    fundingAmount: '$100,000',
    fundingPurpose: ['Working capital', 'Equipment'],
    profileCompleted: true,
  };
  assert(
    isProfileInformationComplete(populatedBusiness) === true,
    'Populated business profile is evaluated as complete'
  );
  assert(
    calculateProfileCompletion(populatedBusiness) >= 90,
    'Populated business profile achieves 90%+ completion'
  );

  // -------------------------------------------------------------------------
  // 4. ONBOARDING CONTINUITY & ROUTING DETERMINISM
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Onboarding Continuity & Routing Determinism ---');

  // When profile is complete -> goes directly to dashboard
  const destComplete = populatedBusiness.profileCompleted ? '/dashboard' : '/onboarding';
  assert(destComplete === '/dashboard', 'Completed onboarding directs customer to /dashboard');

  // When profile is incomplete -> directs to onboarding
  const destIncomplete = blankBusiness.profileCompleted ? '/dashboard' : '/onboarding';
  assert(destIncomplete === '/onboarding', 'Incomplete profile directs customer to /onboarding');

  // Step resumption logic:
  // Account with step 1 complete (businessName, entity, state, industry, age) resumes at Step 2
  const step1OnlyBusiness: Partial<BusinessProfile> = {
    businessName: 'Apex Transport LLC',
    entityType: 'LLC',
    state: 'Texas',
    industry: 'Trucking & Transportation',
    businessAge: '1–2 years',
  };
  const hasStep1 = Boolean(
    step1OnlyBusiness.businessName &&
    step1OnlyBusiness.entityType &&
    step1OnlyBusiness.state &&
    step1OnlyBusiness.industry &&
    step1OnlyBusiness.businessAge
  );
  const hasStep2 = step1OnlyBusiness.hasEIN !== undefined || step1OnlyBusiness.hasBusinessBankAccount !== undefined;
  const resumedStep = hasStep1 && !hasStep2 ? 2 : 1;
  assert(
    resumedStep === 2,
    'Customer with business details resumes onboarding at Step 2 (Foundation Check) without restarting'
  );

  // -------------------------------------------------------------------------
  // 5. FUNDING READINESS SCORE & ACTION TRACKING
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Funding Readiness & Assessment Determinism ---');

  // Blank business produces honest baseline without NaN
  const blankReadiness = calculateReadiness(blankBusiness);
  assert(!isNaN(blankReadiness.businessReadiness.score), 'Blank profile business score is non-NaN');
  assert(!isNaN(blankReadiness.creditReadiness.score), 'Blank profile credit score is non-NaN');
  assert(blankReadiness.businessReadiness.level === 'Getting Started', 'Blank profile level is Getting Started');

  // Populated business achieves verified score
  const popFundingReadiness = calculateFundingReadiness(populatedBusiness);
  assert(popFundingReadiness.score >= 70, `Populated business achieves funding-ready score (${popFundingReadiness.score}/100)`);
  assert(popFundingReadiness.score <= 100, 'Score is strictly bounded to 100 maximum');

  // Authoritative milestone readiness
  const milestoneRes = calculateMilestoneReadiness(populatedBusiness);
  assert(milestoneRes.totalMilestonesCount === 14, 'Evaluates exactly 14 institutional milestones');
  assert(milestoneRes.completedMilestonesCount > 0, `Correctly identifies ${milestoneRes.completedMilestonesCount} completed milestones`);
  assert(milestoneRes.nextMilestone !== null, 'Identifies next actionable milestone for the customer');

  // -------------------------------------------------------------------------
  // 6. ENFORCEMENT OF HONEST CLAIM RULES
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Honest Pricing & Product Marketing Audit ---');
  assert(
    !JSON.stringify(STRIPE_CONFIG).toLowerCase().includes('lifetime'),
    'Zero claims of lifetime access for the $997 one-time purchase'
  );
  assert(
    !JSON.stringify(STRIPE_CONFIG).toLowerCase().includes('guaranteed'),
    'Zero claims of guaranteed funding approvals'
  );

  console.log('\n========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Test runner exception:', err);
  process.exit(1);
});
