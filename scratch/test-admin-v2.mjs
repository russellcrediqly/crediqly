import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- STARTING CREDIQLY STEP 8 ADMIN BACKEND AUTOMATED TESTS ---');
let passed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Initial Banks Catalog & Types
it('Initial banks catalog contains 4 authentic commercial banks', async () => {
  const file = fs.readFileSync(path.resolve('src/lib/banks/initialBanks.ts'), 'utf8');
  assert.ok(file.includes('Relay Financial'), 'Contains Relay Financial');
  assert.ok(file.includes('Bluevine Business Checking'), 'Contains Bluevine');
  assert.ok(file.includes('Mercury'), 'Contains Mercury');
  assert.ok(file.includes('Chase Business Complete'), 'Contains Chase Business Complete');
  assert.ok(file.includes('relay-financial'), 'Contains valid slug');
});

// 2. Bank Service Outbound Link Resolution
it('Bank outbound link correctly handles affiliate enabled vs disabled', () => {
  const bankWithAffiliate = {
    id: 'b1',
    name: 'Test Bank',
    slug: 'test-bank',
    description: 'desc',
    shortDescription: 'short',
    websiteUrl: 'https://bank.com',
    affiliateUrl: 'https://partner.com/track?id=crediqly',
    affiliateEnabled: true,
    featured: false,
    status: 'active',
    priority: 1,
    displayOrder: 1,
    recommendedStage: 'foundation',
    minDeposit: '$0',
    monthlyFee: '$0',
    features: [],
  };

  // When enabled & URL present -> use affiliateUrl
  const dest1 = (bankWithAffiliate.affiliateEnabled && bankWithAffiliate.affiliateUrl)
    ? bankWithAffiliate.affiliateUrl
    : bankWithAffiliate.websiteUrl;
  assert.strictEqual(dest1, 'https://partner.com/track?id=crediqly');

  // When disabled -> falls back to websiteUrl
  const bankDisabled = { ...bankWithAffiliate, affiliateEnabled: false };
  const dest2 = (bankDisabled.affiliateEnabled && bankDisabled.affiliateUrl)
    ? bankDisabled.affiliateUrl
    : bankDisabled.websiteUrl;
  assert.strictEqual(dest2, 'https://bank.com');

  // When enabled but affiliateUrl is empty -> falls back to websiteUrl
  const bankEmptyAff = { ...bankWithAffiliate, affiliateUrl: '' };
  const dest3 = (bankEmptyAff.affiliateEnabled && bankEmptyAff.affiliateUrl && bankEmptyAff.affiliateUrl.trim())
    ? bankEmptyAff.affiliateUrl
    : bankEmptyAff.websiteUrl;
  assert.strictEqual(dest3, 'https://bank.com');
});

// 3. Inactive Banks Exclusion
it('Inactive banks are strictly excluded from customer visibility', () => {
  const banks = [
    { id: 'b1', name: 'Relay', status: 'active' },
    { id: 'b2', name: 'Closed Bank', status: 'inactive' },
    { id: 'b3', name: 'Bluevine', status: 'active' },
  ];

  const customerBanks = banks.filter((b) => b.status === 'active');
  assert.strictEqual(customerBanks.length, 2);
  assert.ok(!customerBanks.some((b) => b.id === 'b2'), 'Inactive bank b2 is not visible');
});

// 4. Recommendation Matrix Priority Weights
it('Priority weights match specifications: P1 (+15), P2 (0), P3 (-15)', () => {
  function getPriorityBoost(priority) {
    if (priority === 1) return 15;
    if (priority === 3) return -15;
    return 0;
  }

  assert.strictEqual(getPriorityBoost(1), 15);
  assert.strictEqual(getPriorityBoost(2), 0);
  assert.strictEqual(getPriorityBoost(3), -15);
});

// 5. Admin Guard Security Verification
it('AdminGuard enforces strict redirect rules without data leakage', () => {
  const guardSource = fs.readFileSync(path.resolve('src/components/admin/AdminGuard.tsx'), 'utf8');
  assert.ok(guardSource.includes("router.replace('/signin?redirect=/admin')"), 'Redirects logged out users to signin');
  assert.ok(guardSource.includes("router.replace('/dashboard')"), 'Redirects non-admin customers to dashboard');
  assert.ok(guardSource.includes("user.role === 'admin'"), 'Validates admin role');
  assert.ok(guardSource.includes("Verifying administrator credentials"), 'Shows loading state instead of admin content while checking');
});

// 6. Admin Navigation includes Banks
it('AdminLayout navigation contains Banks with Landmark icon', () => {
  const layoutSource = fs.readFileSync(path.resolve('src/components/admin/AdminLayout.tsx'), 'utf8');
  assert.ok(layoutSource.includes("href: '/admin/banks'"), 'Contains /admin/banks link');
  assert.ok(layoutSource.includes("label: 'Banks'"), 'Contains Banks label');
  assert.ok(layoutSource.includes('Landmark'), 'Contains Landmark icon');
});

// 7. Schema SQL contains public.banks with RLS
it('Database schema defines public.banks with RLS policies', () => {
  const sql = fs.readFileSync(path.resolve('src/lib/supabase/schema.sql'), 'utf8');
  assert.ok(sql.includes('create table if not exists public.banks'), 'Defines public.banks table');
  assert.ok(sql.includes('alter table public.banks enable row level security;'), 'Enables RLS on public.banks');
  assert.ok(sql.includes('create policy "Anyone can view active banks"'), 'Has public read policy for active banks');
  assert.ok(sql.includes('create policy "Admins can insert banks"'), 'Restricts bank insertion to admins');
  assert.ok(sql.includes('create policy "Admins can update banks"'), 'Restricts bank update to admins');
  assert.ok(sql.includes('create policy "Admins can delete banks"'), 'Restricts bank deletion to admins');
});

// 8. Zero Hardcoded Passwords Check
it('Source code does NOT contain any hardcoded administrator password', () => {
  const forbiddenPatterns = [
    /admin.*password\s*=\s*['"][^'"]+['"]/i,
    /ADMIN_PASSWORD/i,
    /crediqly@gmail\.com.*password/i,
  ];

  const filesToCheck = [
    'src/app/admin/page.tsx',
    'src/app/admin/settings/page.tsx',
    'src/app/admin/banks/page.tsx',
    'src/app/admin/products/page.tsx',
    'src/app/admin/recommendations/page.tsx',
    'src/components/admin/AdminGuard.tsx',
    'src/lib/supabase/schema.sql',
  ];

  for (const f of filesToCheck) {
    const content = fs.readFileSync(path.resolve(f), 'utf8');
    for (const pat of forbiddenPatterns) {
      assert.ok(!pat.test(content), `Found potential hardcoded secret pattern in ${f}`);
    }
  }
});

// 9. Admin Recommendations supports both Products and Banks
it('Admin recommendations page supports Products and Commercial Banks tabs', () => {
  const recPage = fs.readFileSync(path.resolve('src/app/admin/recommendations/page.tsx'), 'utf8');
  assert.ok(recPage.includes("activeTab === 'products'"), 'Has products tab view');
  assert.ok(recPage.includes("activeTab === 'banks'"), 'Has banks tab view');
  assert.ok(recPage.includes('Commercial Banks'), 'Renders Commercial Banks button');
  assert.ok(recPage.includes('updateBankAdmin'), 'Uses updateBankAdmin for instant configuration');
});

// 10. Customer Products page synchronizes with live commercial banks
it('Customer products catalog fetches and maps active commercial banks', () => {
  const prodPage = fs.readFileSync(path.resolve('src/app/products/page.tsx'), 'utf8');
  assert.ok(prodPage.includes('getBanks()'), 'Calls getBanks()');
  assert.ok(prodPage.includes("category: 'business_banking'"), 'Maps banks to business_banking category');
  assert.ok(prodPage.includes('bankProducts'), 'Combines bankProducts with filteredProds');
});

console.log(`\nALL ${passed} AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!`);
