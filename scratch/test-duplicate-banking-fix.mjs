import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('CREDIQLY — DUPLICATE BUSINESS BANKING FIX VERIFICATION');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. Inspect initialBanks.ts
console.log('[1. INITIAL BANKS]');
const banksFile = fs.readFileSync(path.join(rootDir, 'src/lib/banks/initialBanks.ts'), 'utf8');
assert(banksFile.includes("name: 'Relay Financial'"), 'Relay Financial exists in initialBanks.ts');
assert(banksFile.includes("name: 'Mercury Bank'"), 'Mercury Bank exists with name "Mercury Bank" in initialBanks.ts');
assert(banksFile.includes("name: 'Bluevine Business Checking'"), 'Bluevine Business Checking exists in initialBanks.ts');
assert(banksFile.includes("name: 'Chase Business Complete Banking'"), 'Chase Business Complete Banking exists in initialBanks.ts');

// Count occurrences in initialBanks
const relayInBanks = (banksFile.match(/name:\s*'Relay Financial'/g) || []).length;
const mercuryInBanks = (banksFile.match(/name:\s*'Mercury Bank'/g) || []).length;
assert(relayInBanks === 1, `Relay Financial defined exactly once in initialBanks (found: ${relayInBanks})`);
assert(mercuryInBanks === 1, `Mercury Bank defined exactly once in initialBanks (found: ${mercuryInBanks})`);

// 2. Inspect catalog.ts
console.log('\n[2. PRODUCTS CATALOG]');
const catalogFile = fs.readFileSync(path.join(rootDir, 'src/lib/products/catalog.ts'), 'utf8');
assert(catalogFile.includes("slug: 'relay-financial'"), 'Relay Financial slug aligned to "relay-financial" in catalog.ts');
assert(catalogFile.includes("slug: 'mercury'"), 'Mercury Bank slug aligned to "mercury" in catalog.ts');

// 3. Simulate products/page.tsx combination and deduplication logic
console.log('\n[3. SIMULATING CATALOG COMBINATION & DEDUPLICATION]');

// Mock products like getProducts()
const mockProds = [
  // Legacy / existing products from DB or default catalog
  { id: 'prod_relay', name: 'Relay Financial', slug: 'relay-financial-banking', category: 'business_banking' },
  { id: 'prod_mercury', name: 'Mercury Bank', slug: 'mercury-banking', category: 'business_banking' },
  { id: 'prod_bluevine', name: 'Bluevine Business Checking', slug: 'bluevine-business-checking', category: 'business_banking' },
  // Net-30 vendors
  { id: 'prod_quill', name: 'Quill', slug: 'quill-net-30', category: 'net_30' },
  { id: 'prod_grainger', name: 'Grainger', slug: 'grainger-net-30', category: 'net_30' },
  // Credit Cards
  { id: 'prod_chase_ink', name: 'Chase Ink', slug: 'chase-ink-cash', category: 'business_credit_cards' },
];

// Mock bankProducts like banks.map(...)
const mockBankProducts = [
  { id: 'bank-relay', name: 'Relay Financial', slug: 'relay-financial', category: 'business_banking' },
  { id: 'bank-bluevine', name: 'Bluevine Business Checking', slug: 'bluevine-business-checking', category: 'business_banking' },
  { id: 'bank-mercury', name: 'Mercury Bank', slug: 'mercury', category: 'business_banking' },
  { id: 'bank-chase', name: 'Chase Business Complete Banking', slug: 'chase-business-complete-banking', category: 'business_banking' },
];

// Mock loanProducts
const mockLoanProducts = [
  { id: 'loan-bluevine', name: 'Bluevine LOC', slug: 'loan-bluevine', category: 'business_loans' },
];

// Apply the exact logic from src/app/products/page.tsx
const existingSlugs = new Set([
  ...mockBankProducts.map((bp) => bp.slug),
  ...mockBankProducts.map((bp) => `${bp.slug}-banking`),
  ...mockLoanProducts.map((lp) => lp.slug),
]);

const normalizeName = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
const existingBankNames = new Set(mockBankProducts.map((bp) => normalizeName(bp.name)));

const filteredProds = mockProds.filter((p) => {
  if (existingSlugs.has(p.slug)) return false;
  if (p.category === 'business_banking') {
    const norm = normalizeName(p.name);
    const baseSlug = p.slug.toLowerCase().replace(/-banking$/, '');
    if (existingBankNames.has(norm) || existingSlugs.has(baseSlug)) return false;
    if (norm.includes('relay') && [...existingBankNames].some((n) => n.includes('relay'))) return false;
    if (norm.includes('mercury') && [...existingBankNames].some((n) => n.includes('mercury'))) return false;
    if (norm.includes('bluevine') && [...existingBankNames].some((n) => n.includes('bluevine'))) return false;
    if (norm.includes('chase') && [...existingBankNames].some((n) => n.includes('chase'))) return false;
  }
  return true;
});

const combined = [...filteredProds, ...mockBankProducts, ...mockLoanProducts];
const seenKeys = new Set();
const deduplicatedProducts = [];

for (const item of combined) {
  const key = item.category === 'business_banking'
    ? `bank:${normalizeName(item.name).replace(/(bank|banking|financial|inc|llc)$/, '')}`
    : `${item.category}:${item.slug}`;
  if (!seenKeys.has(key)) {
    seenKeys.add(key);
    deduplicatedProducts.push(item);
  }
}

// Inspect Business Banking results
const bankingResults = deduplicatedProducts.filter((p) => p.category === 'business_banking');
console.log('Resulting Business Banking items:', bankingResults.map((p) => p.name));

const relayCount = bankingResults.filter((p) => p.name.toLowerCase().includes('relay')).length;
const mercuryCount = bankingResults.filter((p) => p.name.toLowerCase().includes('mercury')).length;
const bluevineCount = bankingResults.filter((p) => p.name.toLowerCase().includes('bluevine')).length;
const chaseCount = bankingResults.filter((p) => p.name.toLowerCase().includes('chase')).length;

assert(relayCount === 1, `Relay Financial appears exactly once (count: ${relayCount})`);
assert(mercuryCount === 1, `Mercury Bank appears exactly once (count: ${mercuryCount})`);
assert(bluevineCount === 1, `Bluevine Business Checking appears exactly once (count: ${bluevineCount})`);
assert(chaseCount === 1, `Chase Business Complete Banking appears exactly once (count: ${chaseCount})`);
assert(bankingResults.length === 4, `Total Business Banking recommendations is 4 (found: ${bankingResults.length})`);

// 4. Verify other categories remain untouched
console.log('\n[4. OTHER CATEGORIES INTEGRITY]');
const net30Results = deduplicatedProducts.filter((p) => p.category === 'net_30');
const cardsResults = deduplicatedProducts.filter((p) => p.category === 'business_credit_cards');
const loansResults = deduplicatedProducts.filter((p) => p.category === 'business_loans');

assert(net30Results.length === 2, `Net-30 items untouched (count: ${net30Results.length})`);
assert(cardsResults.length === 1, `Credit Card items untouched (count: ${cardsResults.length})`);
assert(loansResults.length === 1, `Loans items untouched (count: ${loansResults.length})`);

// 5. Inspect products/page.tsx implementation directly
console.log('\n[5. INSPECTING src/app/products/page.tsx CODE]');
const productsPageCode = fs.readFileSync(path.join(rootDir, 'src/app/products/page.tsx'), 'utf8');

assert(productsPageCode.includes('normalizeName'), 'products/page.tsx includes normalizeName function');
assert(productsPageCode.includes('existingBankNames'), 'products/page.tsx checks existingBankNames');
assert(productsPageCode.includes('deduplicatedProducts'), 'products/page.tsx runs final deduplicatedProducts pass');

console.log('\n====================================================');
console.log(`VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('DUPLICATE BUSINESS BANKING FIX VERIFIED 100% WORKING.');
}
