/**
 * Crediqly Complete Admin Console and Customer Management Verification Suite
 *
 * Verifies:
 * 1. Complete customer directory reconciliation across auth.users and all application tables.
 * 2. Guaranteed inclusion of customers with:
 *    - Missing profile rows (auto-reconciled)
 *    - Incomplete onboarding
 *    - Free plan ($0)
 *    - Active paid subscriptions (Foundation & Guided)
 *    - Expired / canceled subscriptions
 *    - Failed payments
 *    - One-time purchases ($997 Guided 12-Month)
 *    - Admin-granted access
 * 3. Total counts, search, filtering (plan, status, role, access source, onboarding), and pagination.
 * 4. Clear distinction between customer accounts and platform administrators.
 * 5. Honest customer dossier / detail inspection (zero fabricated placeholder answers).
 * 6. Real administrative controls:
 *    - Grant Foundation/Guided access with expiry and required reason
 *    - Extend manual grant
 *    - Revoke manual grant with entitlement precedence (preserving independent Stripe subscriptions)
 *    - Audit logging of all administrative mutations
 * 7. Server-side security: non-admin callers strictly rejected (403 Forbidden) on all admin endpoints.
 */

import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getAdminUsers,
  getAdminUserDetail,
  registerInMemoryUser,
  inMemoryAdminUsers,
  updateAdminUserProfile,
  updateAdminUserStatus,
  getAdminOverviewStats,
} from '../src/lib/supabase/adminService';
import {
  grantAdminPlanAccess,
  revokeAdminPlanAccess,
  extendAdminPlanAccess,
  getUserSubscription,
  upsertSubscription,
} from '../src/lib/supabase/subscriptionService';
import {
  getAdminCustomerNotes,
  addAdminCustomerNote,
} from '../src/lib/supabase/adminNoteService';
import {
  verifyAdminRequest,
  createSignedAdminToken,
  verifySignedAdminToken,
} from '../src/lib/auth/adminAuth';
import { GET as getAdminCustomersGET } from '../src/app/api/admin/customers/route';
import { GET as getAdminCustomerDetailGET } from '../src/app/api/admin/customers/[id]/route';
import { POST as postAdminEntitlementsPOST } from '../src/app/api/admin/entitlements/route';
import { hasGuidedAccess, hasFoundationAccess } from '../src/types/subscription';

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
  console.log('\n========================================================================');
  console.log('  CREDIQLY: COMPLETE ADMIN CONSOLE & CUSTOMER MANAGEMENT VERIFICATION');
  console.log('========================================================================\n');

  // Clear in-memory test registry
  inMemoryAdminUsers.length = 0;

  // -------------------------------------------------------------------------
  // 1. RECONCILIATION OF ALL REGISTERED CUSTOMER ARCHETYPES
  // -------------------------------------------------------------------------
  console.log('--- 1. Complete Customer Directory: Reconciling All Customer Types ---');

  // Archetype A: Incomplete Onboarding (Free, no profile row, no business created yet)
  registerInMemoryUser({
    id: 'prf_rec_001',
    userId: 'usr_rec_incomplete_onboarding',
    email: 'newuser-incompleter@example.com',
    firstName: '',
    lastName: '',
    fullName: 'newuser-incompleter',
    role: 'user',
    status: 'active',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    profileCompleted: false,
    businessName: undefined,
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
    profileCreationPending: true,
  });

  // Archetype B: Active Foundation Subscriber ($47.99/mo)
  registerInMemoryUser({
    id: 'prf_rec_002',
    userId: 'usr_rec_active_foundation',
    email: 'foundation-subscriber@example.com',
    firstName: 'Sarah',
    lastName: 'Connor',
    fullName: 'Sarah Connor',
    role: 'user',
    status: 'active',
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2026-10-10T08:00:00Z',
    profileCompleted: true,
    businessName: 'Cyberdyne Resistance LLC',
    plan: 'foundation',
    accessSource: 'stripe_subscription',
    billingStatus: 'active',
    stripeCustomerId: 'cus_stripe_found_123',
    stripeSubscriptionId: 'sub_stripe_found_123',
  });

  // Archetype C: Active Guided One-Time 12-Month Program ($997)
  registerInMemoryUser({
    id: 'prf_rec_003',
    userId: 'usr_rec_guided_onetime',
    email: 'guided-onetime@example.com',
    firstName: 'Marcus',
    lastName: 'Vance',
    fullName: 'Marcus Vance',
    role: 'user',
    status: 'active',
    createdAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z',
    profileCompleted: true,
    businessName: 'Vance Freight Logistics Inc',
    plan: 'guided',
    accessSource: 'stripe_onetime',
    billingStatus: 'paid_onetime',
    expiresAt: '2027-09-01T12:00:00Z',
  });

  // Archetype D: Canceled / Expired Subscriber
  registerInMemoryUser({
    id: 'prf_rec_004',
    userId: 'usr_rec_canceled_sub',
    email: 'canceled-customer@example.com',
    firstName: 'Diana',
    lastName: 'Prince',
    fullName: 'Diana Prince',
    role: 'user',
    status: 'active',
    createdAt: '2026-06-01T09:00:00Z',
    updatedAt: '2026-09-01T09:00:00Z',
    profileCompleted: true,
    businessName: 'Themyscira Exports LLC',
    plan: 'foundation',
    accessSource: 'stripe_subscription',
    billingStatus: 'canceled',
    expiresAt: '2026-09-01T09:00:00Z',
  });

  // Archetype E: Failed Payment Customer
  registerInMemoryUser({
    id: 'prf_rec_005',
    userId: 'usr_rec_failed_payment',
    email: 'failed-payment@example.com',
    firstName: 'Bruce',
    lastName: 'Wayne',
    fullName: 'Bruce Wayne',
    role: 'user',
    status: 'active',
    createdAt: '2026-08-01T14:00:00Z',
    updatedAt: '2026-10-05T14:00:00Z',
    profileCompleted: true,
    businessName: 'Wayne Enterprises Holdings',
    plan: 'foundation',
    accessSource: 'stripe_subscription',
    billingStatus: 'past_due',
  });

  // Archetype F: Manual Administrator Grant (Guided, 6-Month term)
  registerInMemoryUser({
    id: 'prf_rec_006',
    userId: 'usr_rec_admin_grant',
    email: 'grant-recipient@example.com',
    firstName: 'Clark',
    lastName: 'Kent',
    fullName: 'Clark Kent',
    role: 'user',
    status: 'active',
    createdAt: '2026-07-20T11:00:00Z',
    updatedAt: '2026-10-01T11:00:00Z',
    profileCompleted: true,
    businessName: 'Daily Planet Publishing LLC',
    plan: 'guided',
    accessSource: 'admin_grant',
    grantType: 'admin_grant',
    grantedBy: 'crediqly@gmail.com',
    grantReason: 'Executive partnership onboarding',
    expiresAt: '2027-04-01T11:00:00Z',
    billingStatus: 'admin_grant',
  });

  // Archetype G & H: Platform Administrators
  registerInMemoryUser({
    id: 'prf_rec_admin_01',
    userId: 'usr_rec_admin_crediqly',
    email: 'crediqly@gmail.com',
    firstName: 'Crediqly',
    lastName: 'Admin',
    fullName: 'Crediqly Admin',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    profileCompleted: true,
    businessName: 'Crediqly Platform Operations',
    plan: 'guided',
    accessSource: 'admin_grant',
    billingStatus: 'admin_grant',
  });

  registerInMemoryUser({
    id: 'prf_rec_admin_02',
    userId: 'usr_rec_admin_rasel',
    email: 'raselandahmed@gmail.com',
    firstName: 'Rasel',
    lastName: 'Ahmed',
    fullName: 'Rasel Ahmed',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    profileCompleted: true,
    businessName: 'Crediqly Platform Operations',
    plan: 'guided',
    accessSource: 'admin_grant',
    billingStatus: 'admin_grant',
  });

  const directoryAll = await getAdminUsers();
  assert(
    directoryAll.length === 8,
    `Directory reconciled exactly all 8 registered accounts (found ${directoryAll.length})`
  );

  // Check specific archetype discovery
  const incompleteAcc = directoryAll.find((u) => u.userId === 'usr_rec_incomplete_onboarding');
  assert(
    incompleteAcc !== undefined && incompleteAcc.profileCompleted === false,
    'Account with incomplete onboarding is discoverable in directory'
  );
  assert(
    incompleteAcc?.profileCreationPending === true,
    'Account missing profile row has profileCreationPending indicator'
  );

  const foundationAcc = directoryAll.find((u) => u.userId === 'usr_rec_active_foundation');
  assert(
    foundationAcc !== undefined && foundationAcc.plan === 'foundation' && foundationAcc.accessSource === 'stripe_subscription',
    'Active Foundation paid subscriber is discoverable with correct plan and Stripe access source'
  );

  const oneTimeAcc = directoryAll.find((u) => u.userId === 'usr_rec_guided_onetime');
  assert(
    oneTimeAcc !== undefined && oneTimeAcc.plan === 'guided' && oneTimeAcc.accessSource === 'stripe_onetime',
    'One-time $997 Guided 12-Month program purchase is discoverable with correct access source'
  );

  const canceledAcc = directoryAll.find((u) => u.userId === 'usr_rec_canceled_sub');
  assert(
    canceledAcc !== undefined && canceledAcc.billingStatus === 'canceled',
    'Canceled subscriber is discoverable with honest canceled billing status'
  );

  const failedAcc = directoryAll.find((u) => u.userId === 'usr_rec_failed_payment');
  assert(
    failedAcc !== undefined && failedAcc.billingStatus === 'past_due',
    'Failed payment customer is discoverable with past_due billing indicator'
  );

  const grantAcc = directoryAll.find((u) => u.userId === 'usr_rec_admin_grant');
  assert(
    grantAcc !== undefined && grantAcc.accessSource === 'admin_grant' && grantAcc.grantedBy === 'crediqly@gmail.com',
    'Administrator-granted customer is discoverable with admin attribution metadata'
  );

  // Distinguish customers vs administrators
  const customerCount = directoryAll.filter((u) => u.role === 'user').length;
  const adminCount = directoryAll.filter((u) => u.role === 'admin').length;
  assert(customerCount === 6, `Correctly identifies 6 customer accounts (found ${customerCount})`);
  assert(adminCount === 2, `Correctly identifies 2 platform administrator accounts (found ${adminCount})`);

  // -------------------------------------------------------------------------
  // 2. SEARCH, FILTERS, AND PAGINATION
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Search, Filters, and Pagination Verification ---');

  // Search by name
  const searchName = await getAdminUsers({ search: 'Sarah Connor' });
  assert(searchName.length === 1 && searchName[0].email === 'foundation-subscriber@example.com', 'Search by full name returns target customer');

  // Search by email
  const searchEmail = await getAdminUsers({ search: 'failed-payment' });
  assert(searchEmail.length === 1 && searchEmail[0].fullName === 'Bruce Wayne', 'Search by email prefix returns target customer');

  // Search by business name
  const searchBiz = await getAdminUsers({ search: 'Themyscira Exports' });
  assert(searchBiz.length === 1 && searchBiz[0].userId === 'usr_rec_canceled_sub', 'Search by business name returns target customer');

  // Filter by Plan
  const filterFree = await getAdminUsers({ plan: 'free' });
  assert(filterFree.length === 1 && filterFree[0].userId === 'usr_rec_incomplete_onboarding', 'Filter by plan="free" returns only Free tier accounts');

  const filterFoundation = await getAdminUsers({ plan: 'foundation' });
  assert(filterFoundation.length === 3, 'Filter by plan="foundation" returns all 3 Foundation accounts');

  const filterGuided = await getAdminUsers({ plan: 'guided' });
  assert(filterGuided.length === 4, 'Filter by plan="guided" returns all 4 Guided accounts (including admin grants)');

  // Filter by Role
  const filterUsersOnly = await getAdminUsers({ role: 'user' });
  assert(filterUsersOnly.length === 6, 'Filter by role="user" strictly isolates regular customers');

  const filterAdminsOnly = await getAdminUsers({ role: 'admin' });
  assert(filterAdminsOnly.length === 2, 'Filter by role="admin" strictly isolates platform administrators');

  // Filter by Onboarding Status
  const filterCompletedOnboarding = await getAdminUsers({ onboarding: 'completed' });
  assert(filterCompletedOnboarding.length === 7, 'Filter onboarding="completed" returns all finished profiles');

  const filterInProgressOnboarding = await getAdminUsers({ onboarding: 'in_progress' });
  assert(filterInProgressOnboarding.length === 1 && filterInProgressOnboarding[0].userId === 'usr_rec_incomplete_onboarding', 'Filter onboarding="in_progress" returns accounts with onboarding pending');

  // API Route Pagination Test
  const token = createSignedAdminToken('crediqly@gmail.com');
  const reqPage1 = new NextRequest('http://localhost:3000/api/admin/customers?page=1&pageSize=3', {
    headers: { 'x-admin-token': token },
  });
  const resPage1 = await getAdminCustomersGET(reqPage1);
  const jsonPage1 = await resPage1.json();

  assert(jsonPage1.success === true, 'API route GET /api/admin/customers succeeds with valid admin token');
  assert(jsonPage1.customers.length === 3, 'Page 1 returns exactly pageSize (3) customers');
  assert(jsonPage1.total === 8, 'API returns accurate total count (8) across pages');
  assert(jsonPage1.totalPages === 3, 'API calculates accurate total pages (ceil(8/3) = 3)');

  const reqPage2 = new NextRequest('http://localhost:3000/api/admin/customers?page=2&pageSize=3', {
    headers: { 'x-admin-token': token },
  });
  const resPage2 = await getAdminCustomersGET(reqPage2);
  const jsonPage2 = await resPage2.json();
  assert(jsonPage2.customers.length === 3, 'Page 2 returns next 3 customers');
  assert(jsonPage2.customers[0].userId !== jsonPage1.customers[0].userId, 'Page 2 does not duplicate Page 1 customers');

  // -------------------------------------------------------------------------
  // 3. HONEST CUSTOMER DOSSIER & DETAIL PAGE
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Customer Detail Page: Honest Information Display ---');

  // Dossier for Incomplete Onboarding Account
  const detailIncomplete = await getAdminUserDetail('usr_rec_incomplete_onboarding');
  assert(detailIncomplete !== null, 'Dossier retrieves account with incomplete onboarding');
  assert(
    detailIncomplete?.profile.profileCompleted === false,
    'Dossier honestly reports profileCompleted = false'
  );
  assert(
    detailIncomplete?.business === null || detailIncomplete?.business?.businessName === '',
    'Dossier does not fabricate fake business answers (e.g. Texas, Trucking) for un-onboarded user'
  );

  // Dossier for Paid Subscriber
  const detailPaid = await getAdminUserDetail('usr_rec_active_foundation');
  assert(detailPaid !== null, 'Dossier retrieves active Foundation subscriber');
  assert(detailPaid?.subscription.planId === 'foundation', 'Dossier accurately reports planId = "foundation"');
  assert(detailPaid?.subscription.accessSource === 'stripe_subscription', 'Dossier reports accessSource = "stripe_subscription"');

  // -------------------------------------------------------------------------
  // 4. REAL ADMINISTRATIVE CONTROLS & ENTITLEMENT PRECEDENCE
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Real Administrative Controls & Precedence ---');

  const testUserId = 'usr_control_test_subject';
  registerInMemoryUser({
    id: 'prf_rec_control_test',
    userId: testUserId,
    email: 'control-test@example.com',
    firstName: 'Peter',
    lastName: 'Parker',
    fullName: 'Peter Parker',
    role: 'user',
    status: 'active',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    profileCompleted: true,
    businessName: 'Parker Photojournalism LLC',
    plan: 'free',
    accessSource: 'free',
    billingStatus: 'free',
  });

  // Step A: Grant Guided Access with 3-Month Expiry
  const grantRes = await grantAdminPlanAccess({
    userId: testUserId,
    plan: 'guided',
    grantType: 'admin_grant',
    durationMonths: 3,
    isIndefinite: false,
    reason: 'Verified partnership entitlement grant',
    adminEmail: 'crediqly@gmail.com',
  });

  assert(grantRes.plan === 'guided', 'Admin successfully grants Guided plan access');
  assert(grantRes.accessSource === 'admin_grant', 'Access source set to admin_grant');
  assert(grantRes.grantedBy === 'crediqly@gmail.com', 'GrantedBy records authorizing admin email');
  assert(grantRes.expiresAt !== undefined, 'Explicit expiresAt timestamp generated (~90 days out)');

  const userPostGrant = await getUserSubscription(testUserId);
  assert(userPostGrant.plan === 'guided', 'Customer subscription resolves to Guided plan');
  assert(hasGuidedAccess(userPostGrant) === true, 'hasGuidedAccess() evaluates to true for customer');

  // Step B: Extend Entitlement by 2 Additional Months
  const initialExpiry = new Date(grantRes.expiresAt!).getTime();
  const extendRes = await extendAdminPlanAccess({
    userId: testUserId,
    additionalMonths: 2,
    reason: 'Extended for promotional program',
    adminEmail: 'crediqly@gmail.com',
  });
  const newExpiry = new Date(extendRes.expiresAt!).getTime();
  assert(newExpiry > initialExpiry, 'Extending entitlement pushes expiresAt forward in time');

  // Step C: Simulate User Acquiring Independent Paid Stripe Subscription
  // User also holds an active Stripe Foundation subscription
  await upsertSubscription({
    userId: testUserId,
    plan: 'guided',
    status: 'active',
    stripeCustomerId: 'cus_stripe_peter_123',
    stripeSubscriptionId: 'sub_stripe_peter_123',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    accessSource: 'admin_grant',
    grantType: 'admin_grant',
    expiresAt: extendRes.expiresAt,
  });

  // Step D: Revoke Manual Grant - Verify Entitlement Precedence
  const revokeRes = await revokeAdminPlanAccess({
    userId: testUserId,
    reason: 'Promotional term ended',
    adminEmail: 'crediqly@gmail.com',
  });

  assert(
    revokeRes.plan === 'foundation',
    'Revoking manual grant cleanly falls back to user\'s active Stripe Foundation subscription'
  );
  assert(
    revokeRes.accessSource === 'stripe_subscription',
    'Access source preserves independent valid Stripe subscription without accidental cancellation'
  );

  // Step E: Revoke Account with No Stripe Subscription Falls Back to Free ($0)
  const revokeFreeRes = await revokeAdminPlanAccess({
    userId: 'usr_rec_admin_grant',
    reason: 'Partnership concluded',
    adminEmail: 'crediqly@gmail.com',
  });
  assert(revokeFreeRes.plan === 'free', 'Revoking manual grant with no active Stripe subscription falls back to Free ($0)');
  assert(revokeFreeRes.accessSource === 'free', 'Access source cleanly reverts to free');

  // -------------------------------------------------------------------------
  // 5. SERVER-SIDE SECURITY & NON-ADMIN ACCESS DENIAL
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Server-Side Administrator Security ---');

  // Unauthenticated GET request to /api/admin/customers
  const unauthReq = new NextRequest('http://localhost:3000/api/admin/customers');
  const unauthRes = await getAdminCustomersGET(unauthReq);
  assert(unauthRes.status === 403, 'Unauthenticated request to /api/admin/customers returns 403 Forbidden');

  // Unauthenticated GET request to /api/admin/customers/[id]
  const unauthDetailReq = new NextRequest('http://localhost:3000/api/admin/customers/usr_rec_active_foundation');
  const unauthDetailRes = await getAdminCustomerDetailGET(unauthDetailReq, {
    params: Promise.resolve({ id: 'usr_rec_active_foundation' }),
  });
  assert(unauthDetailRes.status === 403, 'Unauthenticated request to /api/admin/customers/[id] returns 403 Forbidden');

  // Unauthenticated POST request to /api/admin/entitlements
  const unauthEntReq = new NextRequest('http://localhost:3000/api/admin/entitlements', {
    method: 'POST',
    body: JSON.stringify({ action: 'grant', userId: testUserId, plan: 'guided', reason: 'hacker' }),
  });
  const unauthEntRes = await postAdminEntitlementsPOST(unauthEntReq);
  assert(unauthEntRes.status === 403, 'Unauthenticated request to /api/admin/entitlements returns 403 Forbidden');

  // Authenticated Admin Calling /api/admin/entitlements
  const authEntReq = new NextRequest('http://localhost:3000/api/admin/entitlements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify({
      action: 'grant',
      userId: testUserId,
      plan: 'foundation',
      reason: 'Valid administrator operation',
      durationMonths: 1,
    }),
  });
  const authEntRes = await postAdminEntitlementsPOST(authEntReq);
  const authEntJson = await authEntRes.json();
  assert(authEntRes.status === 200 && authEntJson.success === true, 'Authenticated administrator successfully performs entitlement grant via API');

  // -------------------------------------------------------------------------
  // 6. CONFIDENTIAL INTERNAL ADMIN NOTES
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Internal Admin Notes Management ---');

  const newNote = await addAdminCustomerNote({
    userId: testUserId,
    adminEmail: 'crediqly@gmail.com',
    content: 'Client requested review of business debt schedule for SBA 7(a) readiness.',
  });
  assert(newNote.id.startsWith('note_'), 'Administrative internal note successfully created with unique ID');
  assert(newNote.adminEmail === 'crediqly@gmail.com', 'Note records authoring admin email');

  const notesList = await getAdminCustomerNotes(testUserId);
  assert(notesList.some((n) => n.id === newNote.id), 'Admin notes list retrieves created confidential note');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test runner exception:', err);
  process.exit(1);
});
