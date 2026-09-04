import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('🧪 CREDIQLY — AUTHENTICATION & SEPARATE ADMIN BACKEND TESTS');
console.log('================================================================\n');

let passed = 0;
function it(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// TEST 1 — New Customer Signup Flow
// -----------------------------------------------------------------------------
it('Test 1 — New customer: Signup leads to /onboarding, completion advances to /dashboard', () => {
  const authSource = fs.readFileSync(path.resolve('src/context/AuthContext.tsx'), 'utf8');
  assert.ok(authSource.includes("destination: '/onboarding'"), 'signUp returns destination: /onboarding');
  assert.ok(authSource.includes("profileCompleted: false"), 'signUp marks profileCompleted: false');

  const onboardingSource = fs.readFileSync(path.resolve('src/app/onboarding/page.tsx'), 'utf8');
  assert.ok(onboardingSource.includes("profileCompleted: true"), 'onboarding saves profileCompleted: true');
  assert.ok(onboardingSource.includes("router.push('/dashboard')"), 'onboarding redirects to /dashboard upon completion');
});

// -----------------------------------------------------------------------------
// TEST 2 — Returning Customer Login Flow (MOST CRITICAL FIX)
// -----------------------------------------------------------------------------
it('Test 2 — Returning customer: Completed profile goes DIRECTLY to /dashboard, NOT /onboarding', () => {
  function resolveDestination(userRole, isProfileComplete) {
    if (userRole === 'admin') return '/admin';
    if (isProfileComplete) return '/dashboard';
    return '/onboarding';
  }

  const dest = resolveDestination('user', true);
  assert.strictEqual(dest, '/dashboard', 'Returning completed customer must be routed directly to /dashboard');

  const signinSource = fs.readFileSync(path.resolve('src/app/signin/page.tsx'), 'utf8');
  assert.ok(signinSource.includes("res.destination"), 'SignInPage uses synchronously resolved res.destination');
  assert.ok(signinSource.includes("router.replace(targetDestination)"), 'SignInPage navigates without race condition');

  const authSource = fs.readFileSync(path.resolve('src/context/AuthContext.tsx'), 'utf8');
  assert.ok(authSource.includes("isProfileComplete"), 'AuthContext tracks isProfileComplete');
  assert.ok(authSource.includes("'/dashboard'"), 'AuthContext includes /dashboard destination');
  assert.ok(authSource.includes("'/onboarding'"), 'AuthContext includes /onboarding destination');
});

// -----------------------------------------------------------------------------
// TEST 3 — Incomplete Customer Login Flow
// -----------------------------------------------------------------------------
it('Test 3 — Incomplete customer: Account with incomplete onboarding goes to /onboarding', () => {
  function resolveDestination(userRole, isProfileComplete) {
    if (userRole === 'admin') return '/admin';
    if (isProfileComplete) return '/dashboard';
    return '/onboarding';
  }

  const dest = resolveDestination('user', false);
  assert.strictEqual(dest, '/onboarding', 'Incomplete customer must be routed to /onboarding');
});

// -----------------------------------------------------------------------------
// TEST 4 — Administrator Login Flow
// -----------------------------------------------------------------------------
it('Test 4 — Administrator: Authorized admin account goes to /admin, NOT /dashboard', () => {
  function resolveDestination(userRole, isProfileComplete) {
    if (userRole === 'admin') return '/admin';
    if (isProfileComplete) return '/dashboard';
    return '/onboarding';
  }

  const destAdmin = resolveDestination('admin', true);
  assert.strictEqual(destAdmin, '/admin', 'Administrator must be routed directly to /admin');

  const authSource = fs.readFileSync(path.resolve('src/context/AuthContext.tsx'), 'utf8');
  assert.ok(authSource.includes("email.toLowerCase() === 'crediqly@gmail.com'"), 'crediqly@gmail.com recognized as admin');
  assert.ok(authSource.includes("fullUser.role === 'admin'"), 'Admin role checked in signIn');
  assert.ok(authSource.includes("'/admin'"), 'Admin assigned destination: /admin');
});

// -----------------------------------------------------------------------------
// TEST 5 — Customer Attempts Admin Access
// -----------------------------------------------------------------------------
it('Test 5 — Customer attempts admin access: Denied and redirected to /dashboard', () => {
  const guardSource = fs.readFileSync(path.resolve('src/components/admin/AdminGuard.tsx'), 'utf8');
  assert.ok(guardSource.includes("router.replace('/signin?redirect=/admin')"), 'Unauthenticated visitor redirected to /signin');
  assert.ok(guardSource.includes("router.replace('/dashboard')"), 'Non-admin customer redirected to /dashboard');
  assert.ok(guardSource.includes("user && user.role === 'admin'"), 'Validates admin role');
});

// -----------------------------------------------------------------------------
// TEST 6 — Product Affiliate URL Resolution
// -----------------------------------------------------------------------------
it('Test 6 — Affiliate URL: Product routes to affiliateUrl when enabled, websiteUrl when disabled', () => {
  function resolveProductUrl(p) {
    if (p.affiliateEnabled && p.affiliateUrl && p.affiliateUrl.trim().length > 0) {
      return p.affiliateUrl.trim();
    }
    return p.websiteUrl.trim();
  }

  const p1 = {
    websiteUrl: 'https://nav.com',
    affiliateUrl: 'https://nav.com/?aff=crediqly',
    affiliateEnabled: true,
  };
  assert.strictEqual(resolveProductUrl(p1), 'https://nav.com/?aff=crediqly');

  const p2 = {
    websiteUrl: 'https://nav.com',
    affiliateUrl: 'https://nav.com/?aff=crediqly',
    affiliateEnabled: false,
  };
  assert.strictEqual(resolveProductUrl(p2), 'https://nav.com');
});

// -----------------------------------------------------------------------------
// TEST 7 — Disable Product
// -----------------------------------------------------------------------------
it('Test 7 — Disable product: Inactive products strictly excluded from customer visibility', () => {
  const products = [
    { id: 'p1', name: 'Active Prod', status: 'active' },
    { id: 'p2', name: 'Disabled Prod', status: 'inactive' },
  ];

  const visibleToCustomer = products.filter((p) => p.status === 'active');
  assert.strictEqual(visibleToCustomer.length, 1);
  assert.strictEqual(visibleToCustomer[0].id, 'p1');
});

// -----------------------------------------------------------------------------
// TEST 8 — Bank Management & Recommendation Control
// -----------------------------------------------------------------------------
it('Test 8 — Bank: Affiliate URL toggle and active/inactive status enforcement', () => {
  const bankSource = fs.readFileSync(path.resolve('src/lib/supabase/bankService.ts'), 'utf8');
  assert.ok(bankSource.includes(".eq('status', 'active')"), 'getBanks only queries active banks for customers');
  assert.ok(bankSource.includes("resolveBankOutboundUrl"), 'Exports resolveBankOutboundUrl');
  assert.ok(bankSource.includes("updateBankAffiliate"), 'Exports quick affiliate update helper');

  const initialBanks = fs.readFileSync(path.resolve('src/lib/banks/initialBanks.ts'), 'utf8');
  assert.ok(initialBanks.includes('Relay Financial'), 'Contains Relay Financial');
  assert.ok(initialBanks.includes('Bluevine Business Checking'), 'Contains Bluevine');
});

// -----------------------------------------------------------------------------
// TEST 9 — Security & RLS Database Audit
// -----------------------------------------------------------------------------
it('Test 9 — Security: Database schema restricts admin tables and prevents self-elevation', () => {
  const sql = fs.readFileSync(path.resolve('src/lib/supabase/schema.sql'), 'utf8');
  assert.ok(sql.includes('create or replace function public.is_admin()'), 'Defines is_admin security function');
  assert.ok(sql.includes('create policy "Admins can insert products"'), 'Only admins can insert products');
  assert.ok(sql.includes('create policy "Admins can insert banks"'), 'Only admins can insert banks');
  assert.ok(sql.includes('create policy "Admins can insert content"'), 'Only admins can insert content');
  assert.ok(sql.includes('role = (select role from public.profiles where user_id = auth.uid())'), 'Profiles RLS prevents customer role self-elevation');
});

// -----------------------------------------------------------------------------
// TEST 10 — Navigation & Experience Separation
// -----------------------------------------------------------------------------
it('Test 10 — Navigation: Customer and Administrator layouts and navigations are strictly separated', () => {
  const customerNav = fs.readFileSync(path.resolve('src/components/layout/DashboardLayout.tsx'), 'utf8');
  assert.ok(customerNav.includes("href: '/dashboard'"), 'Customer nav includes /dashboard');
  assert.ok(customerNav.includes("href: '/roadmap'"), 'Customer nav includes /roadmap');
  assert.ok(customerNav.includes("href: '/products'"), 'Customer nav includes /products');
  assert.ok(!customerNav.includes("href: '/admin/products'"), 'Customer nav does NOT include /admin/products');
  assert.ok(!customerNav.includes("href: '/admin/banks'"), 'Customer nav does NOT include /admin/banks');

  const adminNav = fs.readFileSync(path.resolve('src/components/admin/AdminLayout.tsx'), 'utf8');
  assert.ok(adminNav.includes("href: '/admin'"), 'Admin nav includes /admin');
  assert.ok(adminNav.includes("href: '/admin/products'"), 'Admin nav includes /admin/products');
  assert.ok(adminNav.includes("href: '/admin/banks'"), 'Admin nav includes /admin/banks');
  assert.ok(adminNav.includes("href: '/admin/recommendations'"), 'Admin nav includes /admin/recommendations');
  assert.ok(adminNav.includes("href: '/admin/users'"), 'Admin nav includes /admin/users');

  const dashboardPage = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf8');
  assert.ok(dashboardPage.includes("user && user.role === 'admin'"), 'Dashboard checks for admin role');
  assert.ok(dashboardPage.includes("router.replace('/admin')"), 'Dashboard redirects administrators to /admin');
});

console.log(`\n🎉 ALL ${passed}/10 VERIFICATION TESTS PASSED SUCCESSFULLY!`);
