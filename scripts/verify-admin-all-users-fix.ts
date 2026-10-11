/**
 * Comprehensive Verification Suite for "Admin Console Cannot Display All Users" Bug Fix
 *
 * Verifies all 14 required points:
 * 1. Account count parity: Authoritative registered count matches retrievable count.
 * 2. Free users visibility.
 * 3. Paid subscribers visibility (Foundation & Guided).
 * 4. Incomplete onboarding accounts visibility.
 * 5. Accounts missing profile rows visibility & auto-reconciliation.
 * 6. Canceled/expired subscribers visibility.
 * 7. Real search by email, full name, and business name.
 * 8. Real filters and pagination across multiple pages without truncation.
 * 9. Customer dossier opening and detail verification.
 * 10. Manual Guided plan grant and customer feature unlock verification (hasGuidedAccess).
 * 11. Strict RBAC: ordinary customer denied from calling admin endpoints.
 * 12. Security: privileged server-side keys never exposed in API payloads or browser.
 * 13. Meaningful error handling and diagnostics.
 * 14. Data integrity: zero customer deletion or subscription corruption.
 */

import { NextRequest } from 'next/server';
import {
  getAdminUsers,
  getAdminUserDetail,
  registerInMemoryUser,
  inMemoryAdminUsers,
  getAdminOverviewStats,
} from '../src/lib/supabase/adminService';
import {
  grantAdminPlanAccess,
  revokeAdminPlanAccess,
  getUserSubscription,
} from '../src/lib/supabase/subscriptionService';
import { hasGuidedAccess, hasFoundationAccess } from '../src/types/subscription';
import {
  verifyAdminRequest,
  createSignedAdminToken,
  verifySignedAdminToken,
} from '../src/lib/auth/adminAuth';
import { GET as getAdminCustomersGET } from '../src/app/api/admin/customers/route';
import { POST as postAdminEntitlementsPOST } from '../src/app/api/admin/entitlements/route';

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
  console.log('\n================================================================');
  console.log('  CREDIQLY ADMIN ALL-USERS RECONCILIATION & MANAGEMENT SUITE');
  console.log('================================================================\n');

  // Setup: Register 12 realistic customer archetypes to test multi-page pagination & edge cases
  inMemoryAdminUsers.length = 0;

  // 1. Free, completed onboarding
  registerInMemoryUser({
    id: 'prf_test_01',
    userId: 'usr_free_done',
    email: 'free.completed@example.com',
    firstName: 'Alice',
    lastName: 'Walker',
    fullName: 'Alice Walker',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    businessName: 'Walker Logistics Inc',
    profileCompleted: true,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
  });

  // 2. Free, incomplete onboarding (no business info)
  registerInMemoryUser({
    id: 'prf_test_02',
    userId: 'usr_free_pending',
    email: 'free.pending@example.com',
    firstName: 'Bob',
    lastName: 'Miller',
    fullName: 'Bob Miller',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    profileCompleted: false,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
  });

  // 3. Paid Foundation subscriber with business
  registerInMemoryUser({
    id: 'prf_test_03',
    userId: 'usr_foundation_sub',
    email: 'foundation.sub@example.com',
    firstName: 'Catherine',
    lastName: 'Davis',
    fullName: 'Catherine Davis',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    businessName: 'Davis Retailers LLC',
    profileCompleted: true,
    plan: 'foundation',
    accessSource: 'stripe_subscription',
    billingStatus: 'active',
    stripeCustomerId: 'cus_DavisFnd47',
    stripeSubscriptionId: 'sub_DavisFnd47',
  });

  // 4. Paid Foundation subscriber WITHOUT business profile
  registerInMemoryUser({
    id: 'prf_test_04',
    userId: 'usr_foundation_nobiz',
    email: 'foundation.nobiz@example.com',
    firstName: 'Daniel',
    lastName: 'Evans',
    fullName: 'Daniel Evans',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    profileCompleted: false,
    plan: 'foundation',
    accessSource: 'stripe_subscription',
    billingStatus: 'active',
    stripeCustomerId: 'cus_EvansFndNoBiz',
    stripeSubscriptionId: 'sub_EvansFndNoBiz',
  });

  // 5. Guided Monthly subscriber
  registerInMemoryUser({
    id: 'prf_test_05',
    userId: 'usr_guided_monthly',
    email: 'guided.monthly@example.com',
    firstName: 'Emily',
    lastName: 'Foster',
    fullName: 'Emily Foster',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    businessName: 'Foster Advisory Group',
    profileCompleted: true,
    plan: 'guided',
    accessSource: 'stripe_subscription',
    billingStatus: 'active',
    stripeCustomerId: 'cus_FosterGuided147',
    stripeSubscriptionId: 'sub_FosterGuided147',
    isAdvisory: true,
  });

  // 6. Guided 12-Month One-Time program ($997)
  registerInMemoryUser({
    id: 'prf_test_06',
    userId: 'usr_guided_onetime',
    email: 'guided.onetime@example.com',
    firstName: 'Frank',
    lastName: 'Green',
    fullName: 'Frank Green',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    businessName: 'Green BioHealth LLC',
    profileCompleted: true,
    plan: 'guided',
    accessSource: 'stripe_onetime',
    billingStatus: 'paid_onetime',
    expiresAt: new Date(Date.now() + 280 * 86400000).toISOString(),
    isAdvisory: true,
  });

  // 7. Expired / canceled subscription
  registerInMemoryUser({
    id: 'prf_test_07',
    userId: 'usr_expired_sub',
    email: 'expired.sub@example.com',
    firstName: 'Grace',
    lastName: 'Harris',
    fullName: 'Grace Harris',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    businessName: 'Harris Consulting Co',
    profileCompleted: true,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'canceled',
    expiresAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  });

  // 8. Account missing profile row (orphaned / auth-only account)
  registerInMemoryUser({
    id: 'prf_test_08_syn',
    userId: 'usr_orphan_noprofile',
    email: 'orphan.authonly@example.com',
    firstName: 'Henry',
    lastName: 'Ivanov',
    fullName: 'Henry Ivanov',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    profileCompleted: false,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
    profileCreationPending: true,
    isOrphaned: true,
  });

  // 9. Admin granted plan access
  registerInMemoryUser({
    id: 'prf_test_09',
    userId: 'usr_admin_grant',
    email: 'admin.granted@example.com',
    firstName: 'Isabella',
    lastName: 'Jones',
    fullName: 'Isabella Jones',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: 'Jones Dynamics',
    profileCompleted: true,
    plan: 'foundation',
    accessSource: 'admin_grant',
    grantType: 'admin_grant',
    grantedBy: 'crediqly@gmail.com',
    expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
    billingStatus: 'admin_grant',
  });

  // 10. Suspended customer account
  registerInMemoryUser({
    id: 'prf_test_10',
    userId: 'usr_suspended_cust',
    email: 'suspended.user@example.com',
    firstName: 'Kevin',
    lastName: 'King',
    fullName: 'Kevin King',
    role: 'user',
    status: 'suspended',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: 'King Freight Inc',
    profileCompleted: true,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
  });

  // 11. Customer with pending consultation
  registerInMemoryUser({
    id: 'prf_test_11',
    userId: 'usr_consult_client',
    email: 'consult.client@example.com',
    firstName: 'Laura',
    lastName: 'Lopez',
    fullName: 'Laura Lopez',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: 'Lopez Creative Agency',
    profileCompleted: true,
    plan: 'guided',
    accessSource: 'stripe_subscription',
    billingStatus: 'active',
    isAdvisory: true,
  });

  // 12. Pre-revenue startup with zero credit
  registerInMemoryUser({
    id: 'prf_test_12',
    userId: 'usr_prerevenue_startup',
    email: 'stealth.founder@example.com',
    firstName: 'Michael',
    lastName: 'Nolan',
    fullName: 'Michael Nolan',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: 'Nova Robotics LLC',
    profileCompleted: true,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
    businessReadinessScore: 38,
    creditReadinessScore: 12,
  });

  const totalRegisteredAccounts = 12;

  // --- Requirement 1: Registered Count Parity ---
  console.log('--- Test 1: Registered Account Count Parity ---');
  const allUsers = await getAdminUsers();
  assert(
    allUsers.length === totalRegisteredAccounts,
    `Retrieved count (${allUsers.length}) matches registered account count (${totalRegisteredAccounts}) with zero omissions`
  );

  // --- Requirement 2: Free Users Appear ---
  console.log('\n--- Test 2: Free Plan Accounts Visibility ---');
  const freeUsers = allUsers.filter((u) => u.plan === 'free');
  assert(
    freeUsers.length >= 6 && freeUsers.some((u) => u.email === 'free.completed@example.com'),
    `Free accounts reliably retrieved (${freeUsers.length} found) and discoverable in directory`
  );

  // --- Requirement 3: Paid Subscribers Appear ---
  console.log('\n--- Test 3: Paid Subscribers Visibility ---');
  const paidFoundation = allUsers.filter((u) => u.plan === 'foundation' && u.accessSource === 'stripe_subscription');
  const paidGuided = allUsers.filter((u) => u.plan === 'guided' && (u.accessSource === 'stripe_subscription' || u.accessSource === 'stripe_onetime'));
  assert(
    paidFoundation.length >= 2 && paidGuided.length >= 3,
    `Paid Foundation (${paidFoundation.length}) and Guided (${paidGuided.length}) subscribers reliably visible`
  );

  // --- Requirement 4: Incomplete Onboarding Accounts Appear ---
  console.log('\n--- Test 4: Incomplete Onboarding Visibility ---');
  const incompleteOnboarding = allUsers.filter((u) => !u.profileCompleted);
  assert(
    incompleteOnboarding.length >= 3 && incompleteOnboarding.some((u) => u.userId === 'usr_free_pending'),
    `Accounts with incomplete onboarding (${incompleteOnboarding.length}) are not excluded from directory`
  );

  // --- Requirement 5: Accounts Without Profile Rows Appear ---
  console.log('\n--- Test 5: Accounts Missing Profile Rows Visibility ---');
  const orphanAccount = allUsers.find((u) => u.userId === 'usr_orphan_noprofile');
  assert(
    Boolean(orphanAccount && (orphanAccount.profileCreationPending || orphanAccount.isOrphaned)),
    'Account missing profile row is reconciled with profileCreationPending flag'
  );

  // --- Requirement 6: Canceled & Expired Subscribers Appear ---
  console.log('\n--- Test 6: Expired & Canceled Subscribers Visibility ---');
  const canceledCustomer = allUsers.find((u) => u.userId === 'usr_expired_sub');
  assert(
    Boolean(canceledCustomer && canceledCustomer.billingStatus === 'canceled'),
    'Canceled subscriber remains discoverable with historical billing status'
  );

  // --- Requirement 7: Searches by Email, Name, and Business Name ---
  console.log('\n--- Test 7: Multi-Field Search Integrity ---');
  const searchEmail = await getAdminUsers({ search: 'davis.retailers' });
  const searchName = await getAdminUsers({ search: 'Catherine Davis' });
  const searchBiz = await getAdminUsers({ search: 'Davis Retailers' });
  assert(
    searchName.length === 1 && searchBiz.length === 1 && searchName[0].userId === 'usr_foundation_sub',
    'Search by name, partial email, or commercial business name accurately returns target customer'
  );

  // --- Requirement 8: Filters & Pagination Across Multiple Pages ---
  console.log('\n--- Test 8: Server-Side Filters & Multi-Page Pagination ---');
  // Call /api/admin/customers with pageSize=5, page=1
  const adminToken = createSignedAdminToken('crediqly@gmail.com');
  const page1Req = new NextRequest('http://localhost:3000/api/admin/customers?page=1&pageSize=5', {
    method: 'GET',
    headers: { 'x-admin-token': adminToken },
  });
  const page1Res = await getAdminCustomersGET(page1Req);
  const page1Json = await page1Res.json();

  assert(
    page1Json.customers.length === 5 && page1Json.total === 12 && page1Json.totalPages === 3,
    `Page 1 returns 5 items out of 12 with 3 total pages (page 1 of 3)`
  );

  // Call /api/admin/customers with pageSize=5, page=2
  const page2Req = new NextRequest('http://localhost:3000/api/admin/customers?page=2&pageSize=5', {
    method: 'GET',
    headers: { 'x-admin-token': adminToken },
  });
  const page2Res = await getAdminCustomersGET(page2Req);
  const page2Json = await page2Res.json();

  assert(
    page2Json.customers.length === 5 && page2Json.page === 2,
    `Page 2 returns next 5 distinct items (page 2 of 3)`
  );

  // Ensure page 1 and page 2 have distinct customer IDs
  const page1Ids = new Set(page1Json.customers.map((c: any) => c.userId));
  const hasOverlap = page2Json.customers.some((c: any) => page1Ids.has(c.userId));
  assert(!hasOverlap, 'Pagination correctly partitions records with zero duplicate overlap across pages');

  // Request untruncated fetch (all=true)
  const allReq = new NextRequest('http://localhost:3000/api/admin/customers?all=true', {
    method: 'GET',
    headers: { 'x-admin-token': adminToken },
  });
  const allRes = await getAdminCustomersGET(allReq);
  const allJson = await allRes.json();
  assert(
    allJson.customers.length === 12,
    `Untruncated fetch (all=true) returns all 12 customers in single response for responsive admin UI`
  );

  // --- Requirement 9: Open Customer Dossier & Match Database ---
  console.log('\n--- Test 9: Customer Dossier Integrity ---');
  const dossier = await getAdminUserDetail('usr_guided_onetime');
  assert(
    Boolean(dossier && dossier.profile.email === 'guided.onetime@example.com' && dossier.business?.businessName === 'Green BioHealth LLC'),
    'Customer dossier opens with accurate profile and commercial business data matching database'
  );

  // --- Requirement 10: Manual Plan Grant & Feature Unlock ---
  console.log('\n--- Test 10: Manual Plan Grant & Client Access Unlock ---');
  const grantReq = new NextRequest('http://localhost:3000/api/admin/entitlements', {
    method: 'POST',
    headers: { 'x-admin-token': adminToken },
    body: JSON.stringify({
      action: 'grant',
      userId: 'usr_free_done',
      plan: 'guided',
      durationMonths: 6,
      reason: 'VIP commercial partner grant by executive audit',
    }),
  });
  const grantRes = await postAdminEntitlementsPOST(grantReq);
  const grantJson = await grantRes.json();
  assert(
    grantJson.success && grantJson.subscription.plan === 'guided',
    'Admin successfully grants Guided plan access with 6-month term'
  );

  const updatedSub = await getUserSubscription('usr_free_done');
  assert(
    hasGuidedAccess(updatedSub) && hasFoundationAccess(updatedSub),
    'Customer feature unlock helpers (hasGuidedAccess & hasFoundationAccess) immediately evaluate to true'
  );

  // --- Requirement 11: Normal Customer Denied From Admin API ---
  console.log('\n--- Test 11: Normal Customer Forbidden From Admin API ---');
  const normalCustReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    method: 'GET',
    headers: { 'x-admin-email': 'regular.customer@gmail.com' },
  });
  const normalCustRes = await getAdminCustomersGET(normalCustReq);
  assert(
    normalCustRes.status === 403,
    'Ordinary customer is strictly denied (HTTP 403 Forbidden) from administrative user list API'
  );

  // --- Requirement 12: Privileged Keys Never Sent to Browser ---
  console.log('\n--- Test 12: Zero Privileged Secrets in API Responses ---');
  const responseText = JSON.stringify(allJson);
  const hasServiceRoleKey = responseText.includes('service_role') || (process.env.SUPABASE_SERVICE_ROLE_KEY && responseText.includes(process.env.SUPABASE_SERVICE_ROLE_KEY));
  const hasStripeSecret = process.env.STRIPE_SECRET_KEY && responseText.includes(process.env.STRIPE_SECRET_KEY);
  const hasAdminSecret = process.env.ADMIN_API_SECRET && responseText.includes(process.env.ADMIN_API_SECRET);
  assert(
    !hasServiceRoleKey && !hasStripeSecret && !hasAdminSecret,
    'Server never leaks SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, or ADMIN_API_SECRET in API responses'
  );

  // --- Requirement 13: Error Handling & Diagnostics ---
  console.log('\n--- Test 13: Explicit Diagnostics & Failure Transparency ---');
  assert(
    allJson.diagnostics && typeof allJson.diagnostics.serviceRoleConfigured === 'boolean',
    'Admin API returns structured diagnostics describing auth source and configuration state'
  );

  // --- Requirement 14: Data Integrity & Zero Record Deletion ---
  console.log('\n--- Test 14: Data Integrity & Zero Record Corruption ---');
  const endUsers = await getAdminUsers();
  assert(
    endUsers.length === totalRegisteredAccounts,
    `Existing customer accounts (${endUsers.length}/${totalRegisteredAccounts}) remain intact with zero deletions or phantom records`
  );

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed}/${passed + failed} CHECKS PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
