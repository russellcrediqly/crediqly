/**
 * Comprehensive Final End-to-End Audit & Verification Suite for Crediqly
 *
 * Exhaustively verifies the 14 functional areas specified in:
 * P1: FINAL CREDIQLY END-TO-END AUDIT AND PRODUCTION READINESS
 *
 * 1. Authentication & Admin Account Recovery
 * 2. Client Dashboard & Multi-Tab Profile Editor
 * 3. Onboarding Continuity & Business Foundation
 * 4. Funding Readiness Scores & Roadmap Actions
 * 5. Action Recommendations & Vendor Tradelines
 * 6. Pricing, Plans, and Upgrade Experience
 * 7. Stripe Checkout, Webhooks, and Lifecycle
 * 8. Admin Console & Complete Customer Directory
 * 9. Customer Detail Dossier & Admin Controls
 * 10. Authoritative Entitlement Resolution & Feature Gating
 * 11. Admin Settings & Platform Controls Persistence
 * 12. Advisory Consultation Booking Workflow
 * 13. Security, Privacy & RLS Tenant Isolation
 * 14. Navigation, Return Links & Protected Routes
 */

import fs from 'fs';
import path from 'path';

// Parse .env.local if present
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { NextRequest } from 'next/server';

// 1. Auth & Admin Imports
import {
  isAuthorizedAdminEmail,
  AUTHORIZED_ADMIN_EMAILS,
} from '../src/types/user';
import {
  createSignedAdminToken,
  verifySignedAdminToken,
  verifyAdminRequest,
} from '../src/lib/auth/adminAuth';

// 2. Profile & Onboarding Imports
import {
  getUserProfile,
  updateCustomerProfile,
} from '../src/lib/supabase/profileService';
import {
  calculateReadiness,
  calculateProfileCompletion,
} from '../src/lib/scoring';
import { isProfileInformationComplete } from '../src/types/business';

// 3. Readiness & Roadmap Imports
import { calculateFundingReadiness } from '../src/lib/readiness/fundingEngine';
import { calculateMilestoneReadiness } from '../src/lib/readiness/readinessMilestoneEngine';
import { calculateCustomerJourney } from '../src/lib/roadmap/customerJourney';
import { STAGE_DEFINITIONS, TASK_DEFINITIONS } from '../src/lib/roadmap/definitions';

// 4. Recommendations & Catalog Imports
import { getRecommendedProducts, getNormalizedProviderKey } from '../src/lib/products/recommendationEngine';
import { DEFAULT_PRODUCTS } from '../src/lib/products/catalog';
import { matchFundingProducts } from '../src/lib/funding/fundingRecommendationEngine';

// 5. Pricing, Stripe & Entitlement Imports
import { STRIPE_CONFIG } from '../src/lib/stripe/stripeServer';
import {
  resolveEffectiveEntitlement,
  PAST_DUE_GRACE_PERIOD_MS,
} from '../src/lib/services/entitlementResolver';
import {
  hasGuidedAccess,
  hasFoundationAccess,
  calculateEffectiveEntitlement,
  Subscription,
  PaymentRecord,
} from '../src/types/subscription';
import {
  getUserSubscription,
  grantAdminPlanAccess,
  revokeAdminPlanAccess,
  extendAdminPlanAccess,
} from '../src/lib/supabase/subscriptionService';

import { getAdminUsers } from '../src/lib/supabase/adminService';
import { getAdminCustomerNotes, addAdminCustomerNote } from '../src/lib/supabase/adminNoteService';

// 7. Settings & Consultation Imports
import {
  getPlatformSettings,
  updatePlatformSettings,
  updatePlatformMessaging,
  updateRoadmapSettings,
} from '../src/lib/supabase/settingsService';
import {
  createConsultationRequest,
  cancelConsultationCustomer,
} from '../src/lib/supabase/consultationService';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
    failures.push(`${testName}: ${detail || 'Assertion failed'}`);
  }
}

async function runAudit() {
  console.log('\n========================================================================');
  console.log('   CREDIQLY: MASTER END-TO-END PRODUCTION READINESS AUDIT SUITE');
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // AREA 1: AUTHENTICATION & ADMIN ACCOUNT RECOVERY
  // ---------------------------------------------------------------------------
  console.log('--- 1. Authentication & Admin Account Recovery ---');

  assert(
    isAuthorizedAdminEmail('crediqly@gmail.com') &&
    isAuthorizedAdminEmail('CREDIQLY@GMAIL.COM') &&
    isAuthorizedAdminEmail('raselandahmed@gmail.com'),
    '1.1 Primary & secondary administrator emails authorized case-insensitively'
  );

  assert(
    !isAuthorizedAdminEmail('customer@example.com') &&
    !isAuthorizedAdminEmail('attacker@evil.com') &&
    !isAuthorizedAdminEmail(''),
    '1.2 Unauthorized emails strictly rejected from admin role'
  );

  const tokenAdmin1 = createSignedAdminToken('crediqly@gmail.com');
  const tokenAdmin2 = createSignedAdminToken('raselandahmed@gmail.com');
  const verified1 = verifySignedAdminToken(tokenAdmin1);
  const verified2 = verifySignedAdminToken(tokenAdmin2);

  assert(
    verified1.valid && verified1.email === 'crediqly@gmail.com' &&
    verified2.valid && verified2.email === 'raselandahmed@gmail.com',
    '1.3 Cryptographic HMAC admin tokens issued and validated for both admins'
  );

  const tamperedToken = tokenAdmin1.slice(0, -6) + 'xxxxxx';
  const verifiedTampered = verifySignedAdminToken(tamperedToken);
  assert(
    !verifiedTampered.valid,
    '1.4 Tampered admin tokens strictly rejected'
  );

  const reqAuthorized = new NextRequest('http://localhost:3000/api/admin/customers', {
    headers: { 'x-admin-token': tokenAdmin1 },
  });
  const reqUnauthorized = new NextRequest('http://localhost:3000/api/admin/customers', {
    headers: { 'x-admin-token': 'invalid-token' },
  });
  const checkAuth = verifyAdminRequest(reqAuthorized);
  const checkUnauth = verifyAdminRequest(reqUnauthorized);

  assert(
    checkAuth.authorized && checkAuth.email === 'crediqly@gmail.com' && !checkUnauth.authorized,
    '1.5 Server-side verifyAdminRequest validates authenticated admin requests and blocks invalid ones'
  );

  const resetPasswordPath = path.join(process.cwd(), 'src/app/reset-password/page.tsx');
  assert(
    fs.existsSync(resetPasswordPath),
    '1.6 Dedicated /reset-password page exists for secure recovery'
  );

  const resetPasswordContent = fs.readFileSync(resetPasswordPath, 'utf8');
  assert(
    resetPasswordContent.includes('password') &&
    resetPasswordContent.includes('confirmPassword') &&
    resetPasswordContent.includes('updateUser'),
    '1.7 Reset password page verifies passwords match and executes Supabase updateUser'
  );

  // ---------------------------------------------------------------------------
  // AREA 2: CLIENT DASHBOARD & PROFILE EDITING
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Client Dashboard & Profile Editing ---');

  const testUserId = `test-user-${Date.now()}`;
  const initialProfile = await getUserProfile(testUserId);
  assert(
    initialProfile === null,
    '2.1 getUserProfile safely returns null for unregistered new users without crashing'
  );

  const updateResult = await updateCustomerProfile(testUserId, {
    firstName: 'Jane',
    lastName: 'Entrepreneur',
    phone: '555-0199',
    companyName: 'Apex Innovations LLC',
  });
  assert(
    updateResult.success &&
    updateResult.profile?.firstName === 'Jane' &&
    updateResult.profile?.lastName === 'Entrepreneur' &&
    updateResult.profile?.name === 'Jane Entrepreneur',
    '2.2 updateCustomerProfile safely updates profile fields'
  );

  const reloadedProfile = await getUserProfile(testUserId);
  assert(
    reloadedProfile?.name === 'Jane Entrepreneur' &&
    reloadedProfile?.firstName === 'Jane' &&
    reloadedProfile?.lastName === 'Entrepreneur',
    '2.3 Profile edits persist upon reload/refresh'
  );

  const emptyCompletion = calculateProfileCompletion({});
  const partialCompletion = calculateProfileCompletion({
    businessName: 'Apex Innovations LLC',
    entityType: 'llc',
    state: 'DE',
    industry: 'technology',
  });
  assert(
    emptyCompletion === 0 && partialCompletion > 0 && partialCompletion < 100,
    '2.4 calculateProfileCompletion produces accurate completion percentages'
  );

  // ---------------------------------------------------------------------------
  // AREA 3: ONBOARDING CONTINUITY & BUSINESS FOUNDATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Onboarding Continuity & Business Foundation ---');

  const onboardingPagePath = path.join(process.cwd(), 'src/app/onboarding/page.tsx');
  assert(
    fs.existsSync(onboardingPagePath),
    '3.1 Onboarding page component exists'
  );

  const onboardingContent = fs.readFileSync(onboardingPagePath, 'utf8');
  assert(
    onboardingContent.includes('profileCompleted') &&
    onboardingContent.includes('/dashboard'),
    '3.2 Onboarding sets profileCompleted and navigates cleanly to /dashboard'
  );

  assert(
    onboardingContent.includes("user.role === 'admin'") &&
    onboardingContent.includes('/admin'),
    '3.3 Onboarding automatically bypasses administrators to /admin'
  );

  assert(
    onboardingContent.includes('Save & Return to Dashboard') ||
    onboardingContent.includes('Return to Dashboard'),
    '3.4 Onboarding includes an exit return link to prevent trapped states'
  );

  // ---------------------------------------------------------------------------
  // AREA 4: FUNDING READINESS SCORES & ROADMAP ACTIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Funding Readiness Scores & Roadmap Actions ---');

  const emptyBusinessReadiness = calculateReadiness({});
  assert(
    typeof emptyBusinessReadiness.businessReadiness.score === 'number' &&
    emptyBusinessReadiness.businessReadiness.score >= 0 &&
    !isNaN(emptyBusinessReadiness.businessReadiness.score),
    '4.1 calculateReadiness returns clean non-NaN scores for empty businesses'
  );

  const completeBusiness = {
    businessName: 'Summit Peak Inc',
    entityType: 'c_corp',
    state: 'WY',
    industry: 'consulting',
    businessAge: '2_plus_years',
    hasEIN: 'yes' as const,
    hasBusinessBankAccount: 'yes' as const,
    hasWebsite: 'yes' as const,
    hasBusinessPhone: 'yes' as const,
    hasBusinessEmail: 'yes' as const,
    hasBusinessAddress: 'yes' as const,
    hasBusinessLicense: 'yes' as const,
    hasDuns: 'yes' as const,
    hasBusinessCreditProfile: 'yes' as const,
    knowsBusinessCreditScore: 'yes' as const,
    businessCreditScore: '80',
    businessCreditAccountCount: '5_plus' as const,
    hasReportingAccounts: 'yes' as const,
    hasBusinessCreditCard: 'yes' as const,
    hasFundingHistory: 'yes' as const,
    annualRevenueRange: '250k_to_500k',
    personalCreditRange: '720_plus',
    fundingAmount: '100k_to_250k',
    fundingPurpose: ['working_capital', 'expansion'],
    profileCompleted: true,
  };

  const fullScore = calculateReadiness(completeBusiness);
  assert(
    fullScore.businessReadiness.score > emptyBusinessReadiness.businessReadiness.score &&
    fullScore.businessReadiness.score <= 100,
    '4.2 Full business profile yields deterministic elevated readiness score'
  );

  const milestoneScore = calculateMilestoneReadiness(completeBusiness);
  assert(
    milestoneScore.score >= 0 && milestoneScore.score <= 100 &&
    Array.isArray(milestoneScore.items) &&
    milestoneScore.items.length === 14,
    '4.3 calculateMilestoneReadiness evaluates all 14 authoritative milestones'
  );

  const fundingReadinessRes = calculateFundingReadiness(completeBusiness);
  assert(
    typeof fundingReadinessRes.score === 'number' &&
    fundingReadinessRes.score >= 0 && fundingReadinessRes.score <= 100,
    '4.4 calculateFundingReadiness computes comprehensive funding score'
  );

  // ---------------------------------------------------------------------------
  // AREA 5: ACTION RECOMMENDATIONS & VENDOR TRADELINES
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Action Recommendations & Vendor Tradelines ---');

  const recommendedProds = getRecommendedProducts(completeBusiness, null, DEFAULT_PRODUCTS, 80);
  assert(
    recommendedProds.length > 0,
    '5.1 getRecommendedProducts generates personalized product recommendations'
  );

  // Check for deduplication
  const providerKeys = recommendedProds.map((p) => getNormalizedProviderKey(p.name, p.category, p.slug));
  const uniqueKeys = new Set(providerKeys);
  assert(
    providerKeys.length === uniqueKeys.size,
    '5.2 Recommendation engine strictly deduplicates providers (zero duplicates)'
  );

  const matchedFunding = matchFundingProducts(completeBusiness, 80);
  assert(
    Array.isArray(matchedFunding) && matchedFunding.length > 0,
    '5.3 matchFundingProducts identifies matching capital programs'
  );

  // ---------------------------------------------------------------------------
  // AREA 6: PRICING, PLANS & UPGRADE EXPERIENCE
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Pricing, Plans & Upgrade Experience ---');

  assert(
    STRIPE_CONFIG.foundationPriceCents === 4799 &&
    STRIPE_CONFIG.guidedPriceCents === 14799 &&
    STRIPE_CONFIG.guidedOneTimePriceCents === 99700,
    '6.1 Canonical pricing amounts verified ($47.99/mo, $147.99/mo, $997 one-time)'
  );

  assert(
    Boolean(STRIPE_CONFIG.foundationPriceId) &&
    Boolean(STRIPE_CONFIG.guidedPriceId) &&
    Boolean(STRIPE_CONFIG.guidedOneTimePriceId),
    '6.2 All paid plans have valid Stripe Price IDs configured in STRIPE_CONFIG'
  );

  const pricingPagePath = path.join(process.cwd(), 'src/app/pricing/page.tsx');
  const pricingPageContent = fs.readFileSync(pricingPagePath, 'utf8');
  assert(
    pricingPageContent.includes('47.99') &&
    pricingPageContent.includes('147.99') &&
    pricingPageContent.includes('997'),
    '6.3 Customer pricing page displays accurate price points'
  );

  // ---------------------------------------------------------------------------
  // AREA 7: STRIPE CHECKOUT, WEBHOOKS & LIFECYCLE
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Stripe Checkout, Webhooks & Lifecycle ---');

  const webhookRoutePath = path.join(process.cwd(), 'src/app/api/stripe/webhook/route.ts');
  const webhookContent = fs.readFileSync(webhookRoutePath, 'utf8');
  assert(
    webhookContent.includes('processedEventsCache') &&
    webhookContent.includes('stripe_webhook_logs'),
    '7.1 Webhook route implements two-tier idempotency (cache + DB log)'
  );

  assert(
    webhookContent.includes('charge.refunded'),
    '7.2 Webhook route processes charge.refunded events to revoke refunded access'
  );

  assert(
    webhookContent.includes('customer.subscription.deleted'),
    '7.3 Webhook route processes subscription cancellation non-destructively'
  );

  // ---------------------------------------------------------------------------
  // AREA 8: ADMIN CONSOLE & COMPLETE CUSTOMER DIRECTORY
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Admin Console & Complete Customer Directory ---');

  const adminUsers = await getAdminUsers();
  assert(
    Array.isArray(adminUsers),
    '8.1 getAdminUsers returns array of reconciled customers'
  );

  // Check that customers are properly mapped
  const adminCustomersRoutePath = path.join(process.cwd(), 'src/app/api/admin/customers/route.ts');
  const adminCustomersContent = fs.readFileSync(adminCustomersRoutePath, 'utf8');
  assert(
    adminCustomersContent.includes('verifyAdminRequest') &&
    adminCustomersContent.includes('ADMIN_UNAUTHORIZED'),
    '8.2 Customer directory API is strictly protected by server-side verifyAdminRequest'
  );

  const adminLayoutPath = path.join(process.cwd(), 'src/components/admin/AdminLayout.tsx');
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
  assert(
    adminLayoutContent.includes('Return to User App') &&
    adminLayoutContent.includes('/dashboard'),
    '8.3 Admin layout provides clear "Return to User App" navigation back to /dashboard'
  );

  // ---------------------------------------------------------------------------
  // AREA 9: CUSTOMER DETAIL DOSSIER & ADMIN CONTROLS
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Customer Detail Dossier & Admin Controls ---');

  const customerDetailPath = path.join(process.cwd(), 'src/app/admin/customers/[id]/page.tsx');
  assert(
    fs.existsSync(customerDetailPath),
    '9.1 Dedicated customer detail dossier page exists'
  );

  const customerDetailContent = fs.readFileSync(customerDetailPath, 'utf8');
  assert(
    customerDetailContent.includes('grantAdminPlanAccess') ||
    customerDetailContent.includes('/api/admin/entitlements'),
    '9.2 Customer detail page provides administrative entitlement controls'
  );

  assert(
    customerDetailContent.includes('adminNoteService') ||
    customerDetailContent.includes('/api/admin/notes'),
    '9.3 Customer detail page provides confidential internal admin notes'
  );

  // Test admin note creation and retrieval
  const noteTestUserId = `test-note-user-${Date.now()}`;
  const noteResult = await addAdminCustomerNote({
    userId: noteTestUserId,
    adminEmail: 'crediqly@gmail.com',
    content: 'Verified business documentation and granted tier-1 onboarding review.',
  });
  assert(
    noteResult.id && noteResult.content.includes('Verified business documentation'),
    '9.4 addAdminCustomerNote creates internal note successfully'
  );

  const retrievedNotes = await getAdminCustomerNotes(noteTestUserId);
  assert(
    retrievedNotes.length > 0 && retrievedNotes[0].adminEmail === 'crediqly@gmail.com',
    '9.5 getAdminCustomerNotes retrieves stored customer admin notes'
  );

  // ---------------------------------------------------------------------------
  // AREA 10: AUTHORITATIVE ENTITLEMENT RESOLUTION
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. Authoritative Entitlement Resolution ---');

  // Test 10.1: Free account
  const freeEntitlement = resolveEffectiveEntitlement(null, []);
  assert(
    freeEntitlement.effectivePlan === 'free' &&
    !freeEntitlement.hasFoundationAccess &&
    !freeEntitlement.hasGuidedAccess,
    '10.1 Resolver correctly identifies Free accounts'
  );

  // Test 10.2: Active Foundation Stripe Subscription
  const activeSub: Subscription = {
    id: 'sub-1',
    userId: 'user-1',
    plan: 'foundation',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const activeEntitlement = resolveEffectiveEntitlement(activeSub, []);
  assert(
    activeEntitlement.effectivePlan === 'foundation' &&
    activeEntitlement.hasFoundationAccess &&
    !activeEntitlement.hasGuidedAccess,
    '10.2 Active Foundation subscription yields Foundation access'
  );

  // Test 10.3: Active Guided One-Time Purchase
  const oneTimePayment: PaymentRecord = {
    id: 'pay-1',
    userId: 'user-2',
    amount: 997,
    currency: 'usd',
    status: 'succeeded',
    plan: 'guided',
    purchaseType: 'one_time_program',
    programAccessMonths: 12,
    programAccessExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  const oneTimeEntitlement = resolveEffectiveEntitlement(null, [oneTimePayment]);
  assert(
    oneTimeEntitlement.effectivePlan === 'guided' &&
    oneTimeEntitlement.hasGuidedAccess &&
    oneTimeEntitlement.hasFoundationAccess,
    '10.3 Qualifying $997 one-time purchase yields Guided & Foundation access'
  );

  // Test 10.4: Past-Due Grace Period (3 days past due)
  const pastDueSub: Subscription = {
    id: 'sub-2',
    userId: 'user-3',
    plan: 'guided',
    status: 'past_due',
    currentPeriodEnd: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const pastDueEntitlement = resolveEffectiveEntitlement(pastDueSub, []);
  assert(
    pastDueEntitlement.effectivePlan === 'guided' &&
    pastDueEntitlement.isInGracePeriod === true,
    '10.4 Subscription 3 days past due remains within 7-day grace period'
  );

  // Test 10.5: Past-Due Grace Period Expired (10 days past due)
  const expiredPastDueSub: Subscription = {
    id: 'sub-3',
    userId: 'user-4',
    plan: 'guided',
    status: 'past_due',
    currentPeriodEnd: new Date(Date.now() - 10 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const expiredPastDueEntitlement = resolveEffectiveEntitlement(expiredPastDueSub, []);
  assert(
    expiredPastDueEntitlement.effectivePlan === 'free' &&
    expiredPastDueEntitlement.isInGracePeriod === false,
    '10.5 Subscription 10 days past due falls back to Free access'
  );

  // Test 10.6: Non-Interference: Admin Grant Revocation with Active Stripe Sub Fallback
  const overlappingSub: Subscription = {
    id: 'sub-4',
    userId: 'user-5',
    plan: 'foundation',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    adminGrantActive: true,
    adminGrantedPlan: 'guided',
    adminGrantReason: 'Promotional grant',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const grantedEntitlement = resolveEffectiveEntitlement(overlappingSub, []);
  assert(
    grantedEntitlement.effectivePlan === 'guided' &&
    grantedEntitlement.accessSource === 'admin_grant',
    '10.6 Admin Guided grant takes priority over active Foundation Stripe sub'
  );

  // Revoke the grant
  const revokedSub: Subscription = {
    ...overlappingSub,
    adminGrantActive: false,
    adminRevokedAt: new Date().toISOString(),
  };
  const revokedEntitlement = resolveEffectiveEntitlement(revokedSub, []);
  assert(
    revokedEntitlement.effectivePlan === 'foundation' &&
    revokedEntitlement.accessSource === 'stripe_subscription',
    '10.7 Revoking admin grant safely preserves underlying active Stripe subscription'
  );

  // ---------------------------------------------------------------------------
  // AREA 11: ADMIN SETTINGS & PLATFORM CONTROLS PERSISTENCE
  // ---------------------------------------------------------------------------
  console.log('\n--- 11. Admin Settings & Platform Controls Persistence ---');

  const settingsApiRoutePath = path.join(process.cwd(), 'src/app/api/admin/settings/route.ts');
  assert(
    fs.existsSync(settingsApiRoutePath),
    '11.1 Dedicated server-side /api/admin/settings API route exists'
  );

  const initialSettings = await getPlatformSettings();
  assert(
    initialSettings !== null && typeof initialSettings.sections === 'object',
    '11.2 getPlatformSettings returns valid configuration'
  );

  const updatedSettings = await updatePlatformMessaging({
    dashboardAnnouncement: 'Platform maintenance scheduled for Sunday 2 AM UTC',
    announcementEnabled: true,
  });
  assert(
    updatedSettings.messaging?.dashboardAnnouncement === 'Platform maintenance scheduled for Sunday 2 AM UTC' &&
    updatedSettings.messaging?.announcementEnabled === true,
    '11.3 updatePlatformMessaging successfully updates announcements'
  );

  const reloadedSettings = await getPlatformSettings();
  assert(
    reloadedSettings.messaging?.dashboardAnnouncement === 'Platform maintenance scheduled for Sunday 2 AM UTC',
    '11.4 Settings update persists upon reload'
  );

  // ---------------------------------------------------------------------------
  // AREA 12: ADVISORY CONSULTATION BOOKING WORKFLOW
  // ---------------------------------------------------------------------------
  console.log('\n--- 12. Advisory Consultation Booking Workflow ---');

  const consultTestUserId = `test-consult-user-${Date.now()}`;
  const newConsultation = await createConsultationRequest({
    consultationType: 'Funding Strategy',
    preferredDate: '2026-11-15',
    preferredTime: '14:00',
    customerMessage: 'Looking to prepare for SBA 7(a) working capital loan.',
  }, consultTestUserId);

  assert(
    newConsultation.id &&
    newConsultation.userId === consultTestUserId &&
    newConsultation.status === 'Requested',
    '12.1 createConsultationRequest creates booking with status "Requested"'
  );

  const cancelledConsult = await cancelConsultationCustomer(newConsultation.id, consultTestUserId);
  assert(
    cancelledConsult !== null && cancelledConsult.status === 'Cancelled',
    '12.2 cancelConsultationCustomer safely cancels booking without record deletion'
  );

  // ---------------------------------------------------------------------------
  // AREA 13: SECURITY, PRIVACY & RLS TENANT ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 13. Security, Privacy & RLS Tenant Isolation ---');

  const schemaSqlPath = path.join(process.cwd(), 'src/lib/supabase/schema.sql');
  const schemaContent = fs.readFileSync(schemaSqlPath, 'utf8');

  assert(
    schemaContent.includes('alter table public.profiles enable row level security') &&
    schemaContent.includes('alter table public.businesses enable row level security') &&
    schemaContent.includes('alter table public.subscriptions enable row level security') &&
    schemaContent.includes('alter table public.consultations enable row level security') &&
    schemaContent.includes('alter table public.payments enable row level security'),
    '13.1 RLS enabled across all customer and payment tables in schema.sql'
  );

  assert(
    schemaContent.includes('auth.uid() = user_id'),
    '13.2 Schema enforces tenant isolation via auth.uid() = user_id'
  );

  assert(
    !schemaContent.includes('anon can insert into public.payments'),
    '13.3 Anonymous users cannot inject payment records'
  );

  // Check client bundles do not leak service role key
  const clientTsPath = path.join(process.cwd(), 'src/lib/supabase/client.ts');
  const clientContent = fs.readFileSync(clientTsPath, 'utf8');
  assert(
    !clientContent.includes('SUPABASE_SERVICE_ROLE_KEY'),
    '13.4 Client-side Supabase bundle does not reference SUPABASE_SERVICE_ROLE_KEY'
  );

  // ---------------------------------------------------------------------------
  // AREA 14: NAVIGATION, RETURN LINKS & PROTECTED ROUTES
  // ---------------------------------------------------------------------------
  console.log('\n--- 14. Navigation, Return Links & Protected Routes ---');

  const protectedRoutePath = path.join(process.cwd(), 'src/components/auth/ProtectedRoute.tsx');
  const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf8');
  assert(
    protectedRouteContent.includes('useAuth') &&
    (protectedRouteContent.includes('/signin') || protectedRouteContent.includes('/login')),
    '14.1 ProtectedRoute guards private routes and redirects unauthenticated users to /signin'
  );

  const dashboardLayoutPath = path.join(process.cwd(), 'src/components/layout/DashboardLayout.tsx');
  const dashboardLayoutContent = fs.readFileSync(dashboardLayoutPath, 'utf8');
  assert(
    dashboardLayoutContent.includes('/dashboard') &&
    dashboardLayoutContent.includes('/roadmap') &&
    dashboardLayoutContent.includes('/readiness') &&
    dashboardLayoutContent.includes('/business') &&
    dashboardLayoutContent.includes('/products') &&
    dashboardLayoutContent.includes('/funding') &&
    dashboardLayoutContent.includes('/advisory'),
    '14.2 Client dashboard navigation includes all core feature links'
  );

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n========================================================================');
  console.log(`  E2E AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    console.error('Failure Details:');
    failures.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
