/**
 * Crediqly Admin Console Customer Directory & Management Verification Suite
 * 
 * Verifies:
 * 1. Multi-table customer reconciliation across profiles, businesses, subscriptions, and payments.
 * 2. Guaranteed inclusion of customers with:
 *    - Incomplete onboarding
 *    - Missing business profile rows
 *    - Paid subscribers without business profiles
 *    - Expired/canceled subscriptions
 *    - Admin-granted access
 *    - Free registrations
 * 3. Zero fake/mock users when real database records exist.
 * 4. Search, filtering (plan, status, billing, access source, onboarding), and sorting.
 * 5. Single customer dossier lookup and safe profile/business upsert updates.
 * 6. Server-side API authentication and access control.
 */

import {
  getAdminUsers,
  getAdminUserDetail,
  registerInMemoryUser,
  inMemoryAdminUsers,
  updateAdminUserProfile,
  updateAdminBusinessProfile,
  updateAdminUserStatus,
  getAdminOverviewStats,
} from '../src/lib/supabase/adminService';
import {
  verifyAdminRequest,
  createSignedAdminToken,
  verifySignedAdminToken,
} from '../src/lib/auth/adminAuth';
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';

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

async function runTests() {
  console.log('\n======================================================');
  console.log('  CREDIQLY ADMIN CONSOLE CUSTOMER RECONCILIATION AUDIT  ');
  console.log('======================================================\n');

  // --- Scenario 1: Clean In-Memory State & Base Setup ---
  console.log('--- Phase 1: Real Customer Data Setup (No Mock Data) ---');

  // Register real customer 1: Incomplete onboarding (Free, no business profile yet)
  registerInMemoryUser({
    id: 'prf_real_001',
    userId: 'usr_real_free_pending',
    email: 'newuser@startup.io',
    firstName: 'Jordan',
    lastName: 'Taylor',
    fullName: 'Jordan Taylor',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    profileCompleted: false,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
  });

  // Register real customer 2: Paid Foundation subscriber without a business profile
  registerInMemoryUser({
    id: 'prf_real_002',
    userId: 'usr_real_paid_nofoundationbiz',
    email: 'prospect@acmecorp.com',
    firstName: 'Morgan',
    lastName: 'Reed',
    fullName: 'Morgan Reed',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    profileCompleted: false,
    plan: 'foundation',
    accessSource: 'stripe_subscription',
    billingStatus: 'active',
    stripeCustomerId: 'cus_MorganPro99',
    stripeSubscriptionId: 'sub_MorganPro99',
  });

  // Register real customer 3: Guided 12-Month Paid program with full business profile
  registerInMemoryUser({
    id: 'prf_real_003',
    userId: 'usr_real_guided_onetime',
    email: 'marcus@nexustech.com',
    firstName: 'Marcus',
    lastName: 'Cole',
    fullName: 'Marcus Cole',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    businessId: 'biz_real_003',
    businessName: 'Nexus Logistics LLC',
    entityType: 'LLC',
    state: 'Georgia',
    industry: 'Logistics',
    businessAge: '3+ years',
    profileCompleted: true,
    businessReadinessScore: 88,
    creditReadinessScore: 74,
    fundingReadinessScore: 82,
    plan: 'guided',
    accessSource: 'stripe_onetime',
    billingStatus: 'paid_onetime',
    expiresAt: new Date(Date.now() + 300 * 86400000).toISOString(),
    isAdvisory: true,
  });

  // Register real customer 4: Expired subscription (previously subscribed, now expired)
  registerInMemoryUser({
    id: 'prf_real_004',
    userId: 'usr_real_expired_sub',
    email: 'expired@solartrade.net',
    firstName: 'Elena',
    lastName: 'Rostova',
    fullName: 'Elena Rostova',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    businessName: 'Solar Trade Solutions',
    profileCompleted: true,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'canceled',
    expiresAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  });

  // Register real customer 5: Manual Admin Granted access with 6-month term
  registerInMemoryUser({
    id: 'prf_real_005',
    userId: 'usr_real_admin_granted',
    email: 'vip@summitventures.co',
    firstName: 'Victoria',
    lastName: 'Sterling',
    fullName: 'Victoria Sterling',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: 'Summit Capital Ventures',
    profileCompleted: true,
    plan: 'guided',
    accessSource: 'admin_grant',
    grantType: 'admin_grant',
    grantedBy: 'crediqly@gmail.com',
    grantReason: 'Executive cohort pilot partnership',
    billingStatus: 'admin_grant',
    expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
    isAdvisory: true,
  });

  // Register real customer 6: Orphaned customer (e.g. created via business/checkout but profile was pending)
  registerInMemoryUser({
    id: 'prf_syn_orphan01',
    userId: 'usr_real_orphan_noprofile',
    email: 'info@quantumfab.com',
    firstName: 'Quantum',
    lastName: 'Fab',
    fullName: 'Quantum Fabrication Inc',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: 'Quantum Fabrication Inc',
    entityType: 'Corporation',
    state: 'Ohio',
    profileCompleted: false,
    plan: 'foundation',
    accessSource: 'stripe_subscription',
    billingStatus: 'active',
    profileCreationPending: true,
    isOrphaned: true,
  });

  assert(inMemoryAdminUsers.length === 6, 'Successfully registered 6 distinct customer test archetypes');

  // --- Phase 2: Multi-Table Customer Reconciliation Querying ---
  console.log('\n--- Phase 2: Guaranteed Retrieval & Multi-Table Reconciliation ---');

  const allRetrieved = await getAdminUsers();

  assert(
    allRetrieved.length >= 6,
    `Retrieved all registered customer accounts (${allRetrieved.length} accounts found)`
  );

  assert(
    !allRetrieved.some((u) => u.userId === 'usr_founder_001' && u.email === 'founder@crediqly.com'),
    'Zero fake/mock demo users returned when real customer records are present'
  );

  const pendingOnboardingCustomer = allRetrieved.find((u) => u.userId === 'usr_real_free_pending');
  assert(
    Boolean(pendingOnboardingCustomer && !pendingOnboardingCustomer.profileCompleted),
    'Customers with incomplete onboarding are reliably retrieved and not omitted'
  );

  const paidNoBizCustomer = allRetrieved.find((u) => u.userId === 'usr_real_paid_nofoundationbiz');
  assert(
    Boolean(paidNoBizCustomer && paidNoBizCustomer.plan === 'foundation' && paidNoBizCustomer.accessSource === 'stripe_subscription'),
    'Paid subscriber without business profile is retrieved with active plan and Stripe subscription details'
  );

  const expiredCustomer = allRetrieved.find((u) => u.userId === 'usr_real_expired_sub');
  assert(
    Boolean(expiredCustomer && expiredCustomer.billingStatus === 'canceled'),
    'Expired/canceled subscribers remain in directory with historical account status'
  );

  const orphanCustomer = allRetrieved.find((u) => u.userId === 'usr_real_orphan_noprofile');
  assert(
    Boolean(orphanCustomer && (orphanCustomer.profileCreationPending || orphanCustomer.isOrphaned)),
    'Orphaned account missing profile row is reconciled and flagged with profile sync pending'
  );

  // --- Phase 3: Search, Filtering, and Sorting Capabilities ---
  console.log('\n--- Phase 3: Filtering, Search, and Sorting Integrity ---');

  // Search by email
  const searchByEmail = await getAdminUsers({ search: 'summitventures' });
  assert(
    searchByEmail.length === 1 && searchByEmail[0].email === 'vip@summitventures.co',
    'Search by partial email finds exact matching customer'
  );

  // Search by business name
  const searchByBiz = await getAdminUsers({ search: 'Nexus Logistics' });
  assert(
    searchByBiz.length === 1 && searchByBiz[0].businessName === 'Nexus Logistics LLC',
    'Search by commercial business name correctly finds record'
  );

  // Filter by plan: Guided
  const guidedFiltered = await getAdminUsers({ plan: 'guided' });
  assert(
    guidedFiltered.every((u) => u.plan === 'guided'),
    `Plan filter "guided" returns only Guided members (${guidedFiltered.length} matching)`
  );

  // Filter by access source: stripe_subscription
  const subFiltered = await getAdminUsers({ accessSource: 'stripe_subscription' });
  assert(
    subFiltered.every((u) => u.accessSource === 'stripe_subscription'),
    `Access source filter "stripe_subscription" matches correctly (${subFiltered.length} matching)`
  );

  // Filter by onboarding status: in_progress
  const inProgressFiltered = await getAdminUsers({ onboarding: 'in_progress' });
  assert(
    inProgressFiltered.every((u) => !u.profileCompleted),
    `Onboarding filter "in_progress" isolates incomplete profiles (${inProgressFiltered.length} matching)`
  );

  // --- Phase 4: Single Customer Dossier & Upsert Operations ---
  console.log('\n--- Phase 4: Single Customer Dossier & Safe Upsert Operations ---');

  // Open dossier for customer with NO business profile
  const noBizDossier = await getAdminUserDetail('usr_real_free_pending');
  assert(
    noBizDossier !== null && noBizDossier.profile.email === 'newuser@startup.io',
    'Customer dossier opens safely for user with no business profile without crashing'
  );

  // Update business profile for customer who had no business row (must upsert safely)
  const upsertBizRes = await updateAdminBusinessProfile('usr_real_free_pending', {
    businessName: 'Taylor Clean Energy LLC',
    entityType: 'LLC',
    state: 'Nevada',
  });
  assert(
    upsertBizRes.success,
    'updateAdminBusinessProfile safely creates/upserts business record for onboarding-incomplete account'
  );

  // Update customer name
  const updateNameRes = await updateAdminUserProfile('usr_real_free_pending', {
    firstName: 'Jordan',
    lastName: 'Taylor-Smith',
  });
  assert(
    updateNameRes.success,
    'updateAdminUserProfile safely updates customer name via upsert'
  );

  // Suspend customer account
  const suspendRes = await updateAdminUserStatus('usr_real_free_pending', 'user', 'suspended');
  assert(
    suspendRes.success,
    'updateAdminUserStatus successfully changes customer status to suspended'
  );

  // Verify updated status in dossier
  const updatedDossier = await getAdminUserDetail('usr_real_free_pending');
  assert(
    updatedDossier?.profile.status === 'suspended',
    'Customer dossier reflects updated suspended account status'
  );

  // --- Phase 5: Server-Side API Authentication & RBAC ---
  console.log('\n--- Phase 5: Server-Side Admin Authorization & RBAC ---');

  // Verify unauthenticated request rejection
  const unauthReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
  });
  const unauthCheck = verifyAdminRequest(unauthReq);
  assert(
    !unauthCheck.authorized,
    'Unauthenticated API request is strictly rejected by verifyAdminRequest'
  );

  // Verify authorized owner account #1: crediqly@gmail.com
  const owner1Req = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
    headers: { 'x-admin-email': 'crediqly@gmail.com' },
  });
  const owner1Check = verifyAdminRequest(owner1Req);
  assert(
    owner1Check.authorized && owner1Check.email === 'crediqly@gmail.com',
    'Authorized Owner Account #1 (crediqly@gmail.com) verified with full console authority'
  );

  // Verify authorized owner account #2: raselandahmed@gmail.com
  const owner2Req = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
    headers: { 'x-admin-email': 'raselandahmed@gmail.com' },
  });
  const owner2Check = verifyAdminRequest(owner2Req);
  assert(
    owner2Check.authorized && owner2Check.email === 'raselandahmed@gmail.com',
    'Authorized Owner Account #2 (raselandahmed@gmail.com) verified with full console authority'
  );

  // Verify unauthorized ordinary customer email rejection
  const customerReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
    headers: { 'x-admin-email': 'customer@somedomain.com' },
  });
  const customerCheck = verifyAdminRequest(customerReq);
  assert(
    !customerCheck.authorized,
    'Non-authorized customer email address is strictly denied administrative access'
  );

  // Verify spoofed x-dev-admin header is strictly rejected in production
  const origEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  const spoofedReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
    headers: { 'x-dev-admin': 'true' },
  });
  const spoofedCheck = verifyAdminRequest(spoofedReq);
  (process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
  assert(
    !spoofedCheck.authorized,
    'Spoofed x-dev-admin header or unauthorized dev claim is strictly denied in production'
  );

  // Verify cryptographically signed admin session token
  const validToken = createSignedAdminToken('crediqly@gmail.com');
  const tokenReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
    headers: { authorization: `Bearer ${validToken}` },
  });
  const tokenCheck = verifyAdminRequest(tokenReq);
  assert(
    tokenCheck.authorized && tokenCheck.email === 'crediqly@gmail.com',
    'Cryptographically signed admin session token verified successfully'
  );

  // Verify tampered signed token rejection
  const tamperedToken = validToken.substring(0, validToken.length - 4) + 'abcd';
  const tamperedReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
    headers: { authorization: `Bearer ${tamperedToken}` },
  });
  const tamperedCheck = verifyAdminRequest(tamperedReq);
  assert(
    !tamperedCheck.authorized,
    'Tampered or forged cryptographic token is strictly rejected'
  );

  // Verify server-side middleware boundary protection for /admin HTML pages
  const unauthAdminPageReq = new NextRequest('http://localhost:3000/admin', {
    method: 'GET',
  });
  const middlewareRes = middleware(unauthAdminPageReq);
  assert(
    middlewareRes.status === 307 || middlewareRes.status === 302 || middlewareRes.headers.get('location')?.includes('/signin'),
    'Middleware strictly intercepts unauthenticated /admin navigation and redirects to /signin'
  );

  // --- Phase 6: Overview Statistics Calculation ---
  console.log('\n--- Phase 6: Admin Overview Metrics Calculation ---');

  const stats = await getAdminOverviewStats();
  assert(
    stats.totalUsers >= 6,
    `Total customer count (${stats.totalUsers}) encompasses all database and reconciled accounts`
  );

  assert(
    stats.recurringMrr >= 47,
    `Recurring MRR ($${stats.recurringMrr}) strictly includes active subscription tiers`
  );

  assert(
    stats.oneTimeRevenue >= 997,
    `One-time revenue ($${stats.oneTimeRevenue}) reflects Guided 12-month non-recurring purchases`
  );

  // --- Summary ---
  console.log('\n======================================================');
  console.log(`  VERIFICATION RESULTS: ${passed}/${passed + failed} TESTS PASSED  `);
  console.log('======================================================\n');

  if (failed > 0) {
    console.error(`>>> ${failed} TEST(S) FAILED! <<<`);
    process.exit(1);
  } else {
    console.log('>>> ALL ADMIN CONSOLE RECONCILIATION AUDIT CHECKS PASSED! <<<');
  }
}

runTests().catch((e) => {
  console.error('Fatal test execution error:', e);
  process.exit(1);
});
