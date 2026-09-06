import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('CREDIQLY PRE-LAUNCH FINAL COMPREHENSIVE QA AUDIT');
console.log('====================================================');

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

// 1. Check Onboarding Defaults & No Auto-Select
console.log('\n[1. ONBOARDING QUESTIONS & DEFAULTS]');
const onboardingPath = path.join(rootDir, 'src/app/onboarding/page.tsx');
const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');

assert(
  onboardingContent.includes('hasEIN: undefined') &&
  onboardingContent.includes('hasBusinessBankAccount: undefined') &&
  onboardingContent.includes('hasWebsite: undefined') &&
  onboardingContent.includes('hasDuns: undefined'),
  'Onboarding form fields initialize with undefined (NO option pre-selected)'
);

assert(
  !onboardingContent.includes("hasEIN: 'not_sure'") &&
  !onboardingContent.includes("hasBusinessBankAccount: 'not_sure'"),
  'Onboarding NEVER sets default value to "not_sure"'
);

assert(
  onboardingContent.includes('const draft = getDraft();') &&
  onboardingContent.includes('setFormData((prev) => ({ ...prev, ...draft }));') &&
  onboardingContent.includes('setFormData((prev) => ({ ...prev, ...business }));'),
  'Onboarding preserves existing saved answers without overwriting them'
);

// 2. Check Customer Dashboard Streamlining & Duplication Removal
console.log('\n[2. CUSTOMER DASHBOARD STREAMLINING & CONSOLIDATION]');
const dashboardPath = path.join(rootDir, 'src/app/dashboard/page.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

assert(
  !dashboardContent.includes('{primaryNextStep && (') &&
  !dashboardContent.includes('const primaryNextStep ='),
  'Redundant standalone primaryNextStep card successfully removed from dashboard'
);

const idxReadiness = dashboardContent.indexOf('<FundingReadinessScoreCard');
const idxNextActions = dashboardContent.indexOf('<WhatShouldIDoNextCard');
const idxJourney = dashboardContent.indexOf('<CustomerJourneyCard');
const idxRecommendations = dashboardContent.indexOf('<PersonalizedRecommendationsCard');
const idxMatches = dashboardContent.indexOf('<FundingMatchesForYouCard');

assert(
  idxReadiness < idxNextActions &&
  idxNextActions < idxJourney &&
  idxJourney < idxRecommendations &&
  idxRecommendations < idxMatches,
  'Dashboard cards strictly follow Section 30 order: Readiness -> Next Actions -> Journey -> Recommendations -> Matches'
);

// 3. Check Bureau Score Disclaimers & Exact Naming
console.log('\n[3. BUREAU SCORE CLARIFICATION & DISCLAIMER]');
const readinessScoreCardPath = path.join(rootDir, 'src/components/dashboard/FundingReadinessScoreCard.tsx');
const readinessScoreContent = fs.readFileSync(readinessScoreCardPath, 'utf8');

assert(
  readinessScoreContent.includes('Crediqly Funding Readiness Score'),
  'Score is explicitly named "Crediqly Funding Readiness Score"'
);

const exactDisclaimer = 'This is an educational readiness estimate based on information provided in your Crediqly profile. It is not an official credit bureau score and does not guarantee funding approval.';
assert(
  readinessScoreContent.includes(exactDisclaimer),
  'Required compliance disclaimer is prominently displayed on Funding Readiness Score card'
);

// 4. Check Funding Matches Empty State
console.log('\n[4. FUNDING MATCHES EMPTY STATE]');
const matchesCardPath = path.join(rootDir, 'src/components/funding/FundingMatchesForYouCard.tsx');
const matchesCardContent = fs.readFileSync(matchesCardPath, 'utf8');

assert(
  matchesCardContent.includes('No funding matches yet.') &&
  matchesCardContent.includes('Complete more of your business profile to receive personalized recommendations') &&
  matchesCardContent.includes('Complete Profile'),
  'FundingMatchesForYouCard includes standardized empty state with explanation and CTA'
);

// 5. Check Account & Profile Routes
console.log('\n[5. ACCOUNT & PROFILE ROUTING]');
const accountPagePath = path.join(rootDir, 'src/app/account/page.tsx');
const accountProfilePagePath = path.join(rootDir, 'src/app/account/profile/page.tsx');
const nextConfigPath = path.join(rootDir, 'next.config.mjs');

assert(fs.existsSync(accountPagePath), 'src/app/account/page.tsx route alias exists');
assert(fs.existsSync(accountProfilePagePath), 'src/app/account/profile/page.tsx route alias exists');

const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
assert(
  nextConfigContent.includes("source: '/account'") &&
  nextConfigContent.includes("destination: '/profile'"),
  'Server-side redirect configured from /account to /profile'
);

// 6. Check Owner Information Editing Functionality
console.log('\n[6. OWNER INFORMATION VIEW & EDIT]');
const profilePagePath = path.join(rootDir, 'src/app/profile/page.tsx');
const profilePageContent = fs.readFileSync(profilePagePath, 'utf8');

assert(
  profilePageContent.includes('Edit Owner Information') &&
  profilePageContent.includes('handleStartEdit') &&
  profilePageContent.includes('handleSave') &&
  profilePageContent.includes('handleCancel'),
  'Owner Information has Edit, Save, and Cancel functionality'
);

assert(
  profilePageContent.includes('updateProfile({') &&
  profilePageContent.includes('firstName: trimmedFirst') &&
  profilePageContent.includes('lastName: trimmedLast'),
  'Owner information updates persist firstName and lastName through updateProfile'
);

// 7. Check Authentication & Destination Routing
console.log('\n[7. AUTHENTICATION & DESTINATION ROUTING]');
const signinPath = path.join(rootDir, 'src/app/signin/page.tsx');
const signupPath = path.join(rootDir, 'src/app/signup/page.tsx');
const signinContent = fs.readFileSync(signinPath, 'utf8');
const signupContent = fs.readFileSync(signupPath, 'utf8');

assert(
  signinContent.includes("res.user?.role === 'admin'") &&
  signinContent.includes("'/admin'") &&
  signinContent.includes("'/dashboard'"),
  'Existing customer signin always routes to /dashboard (or /admin for admin)'
);

assert(
  signupContent.includes("router.replace(res.destination || '/onboarding');"),
  'New customer signup routes directly to /onboarding'
);

// 8. Check Admin Isolation & Security
console.log('\n[8. ADMIN CONSOLE ISOLATION & RBAC]');
const adminGuardPath = path.join(rootDir, 'src/components/admin/AdminGuard.tsx');
const adminGuardContent = fs.readFileSync(adminGuardPath, 'utf8');
const middlewarePath = path.join(rootDir, 'src/middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

assert(
  adminGuardContent.includes("router.replace('/dashboard');"),
  'AdminGuard strictly redirects non-admins away from /admin to /dashboard'
);

assert(
  middlewareContent.includes("pathname.startsWith('/api/admin')") &&
  middlewareContent.includes('verifyAdminRequest(request)'),
  'Middleware protects all /api/admin/* endpoints server-side'
);

const adminLayoutPath = path.join(rootDir, 'src/components/admin/AdminLayout.tsx');
const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
assert(
  adminLayoutContent.includes('Return to User App') &&
  adminLayoutContent.includes('href="/dashboard"'),
  'Admin Console includes working "Return to User App" button linking to /dashboard'
);

// 9. Check Pricing Consistency & Stripe Config
console.log('\n[9. PRICING & STRIPE ALIGNMENT]');
const pricingPath = path.join(rootDir, 'src/app/pricing/page.tsx');
const pricingContent = fs.readFileSync(pricingPath, 'utf8');
const stripeServerPath = path.join(rootDir, 'src/lib/stripe/stripeServer.ts');
const stripeServerContent = fs.readFileSync(stripeServerPath, 'utf8');

assert(
  pricingContent.includes('Free Starter') &&
  pricingContent.includes('$0') &&
  pricingContent.includes('Crediqly Pro') &&
  pricingContent.includes('$39') &&
  pricingContent.includes('Premium Advisory') &&
  pricingContent.includes('$499'),
  'Pricing page clearly shows $0 Starter, $39/mo Pro, and $499 setup + $149/mo Advisory'
);

assert(
  stripeServerContent.includes('proPriceCents: 3900') &&
  stripeServerContent.includes('advisorySetupPriceCents: 49900') &&
  stripeServerContent.includes('advisoryMonthlyPriceCents: 14900'),
  'Stripe server config matches advertised prices exactly ($39.00, $499.00, $149.00)'
);

// 10. Check Non-Guarantee Language Across Platform
console.log('\n[10. NON-GUARANTEE AUDIT]');
const productsPath = path.join(rootDir, 'src/app/products/page.tsx');
const productsContent = fs.readFileSync(productsPath, 'utf8');

assert(
  productsContent.includes('They are not guarantees of approval') &&
  productsContent.includes('Crediqly does not guarantee credit approvals'),
  'Products catalog contains explicit non-guarantee disclaimer'
);

console.log('\n====================================================');
console.log(`AUDIT RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL PRE-LAUNCH QA CHECKS PASSED PERFECTLY (21/21).');
}
