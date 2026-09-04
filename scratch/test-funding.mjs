/**
 * Crediqly Step 8: Funding Readiness Verification Script
 * Validates deterministic calculations, edge cases, "not sure" intelligence,
 * roadmap integration, navigation, and database schema.
 */

import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('🧪 CREDIQLY STEP 8: FUNDING READINESS VERIFICATION');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// 1. FILE INTEGRITY & ARCHITECTURE
// -----------------------------------------------------------------------------
console.log('--- 1. FILE INTEGRITY & ARCHITECTURE ---');

const requiredFiles = [
  'src/types/funding.ts',
  'src/lib/readiness/fundingEngine.ts',
  'src/lib/readiness/index.ts',
  'src/lib/supabase/fundingService.ts',
  'src/app/funding-readiness/page.tsx',
  'src/app/signin/page.tsx',
  'src/app/funding/page.tsx',
  'src/lib/roadmap/definitions.ts',
  'src/lib/roadmap/engine.ts',
  'src/app/dashboard/page.tsx',
  'src/app/roadmap/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/users/[id]/page.tsx',
  'src/lib/supabase/schema.sql',
];

for (const relPath of requiredFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
}

// -----------------------------------------------------------------------------
// 2. SCENARIO 1: NEW BUSINESS (MINIMAL INFORMATION)
// -----------------------------------------------------------------------------
console.log('\n--- 2. SCENARIO 1: NEW BUSINESS (MINIMAL INFORMATION) ---');

import { calculateFundingReadiness, getFundingReadinessLevel } from '../src/lib/readiness/fundingEngine.ts';

const newBizProfile = {
  userId: 'usr_new_001',
  businessName: 'Fresh Startup LLC',
  entityType: 'LLC',
  state: 'Delaware',
  industry: 'Software',
  businessAge: 'Less than 3 months',
  hasEIN: 'no',
  hasBusinessBankAccount: 'no',
  hasWebsite: 'no',
  hasBusinessPhone: 'no',
  hasBusinessEmail: 'no',
  hasBusinessAddress: 'no',
  hasBusinessLicense: 'no',
  hasDuns: 'no',
  hasBusinessCreditProfile: 'no',
  hasReportingAccounts: 'no',
  hasBusinessCreditCard: 'no',
  profileCompleted: false,
};

const newBizResult = calculateFundingReadiness(newBizProfile);
assert(typeof newBizResult.score === 'number', 'Score is a valid number');
assert(newBizResult.score >= 0 && newBizResult.score <= 30, `Score is appropriately low for brand new business (Got: ${newBizResult.score})`);
assert(newBizResult.level === 'Getting Started', `Level is 'Getting Started' (Got: ${newBizResult.level})`);
assert(newBizResult.improvementFactors.length > 0, 'Missing factors are accurately identified in improvementFactors');
assert(newBizResult.nextBestAction && newBizResult.nextBestAction.title.includes('bank account'), `Prescribes bank account next best action (Got: ${newBizResult.nextBestAction.title})`);
assert(newBizResult.prioritizedActions.length > 0, 'Generates prioritized list of actions for new business');

// -----------------------------------------------------------------------------
// 3. SCENARIO 2: MATURE & ESTABLISHED BUSINESS PROFILE
// -----------------------------------------------------------------------------
console.log('\n--- 3. SCENARIO 2: MATURE & ESTABLISHED BUSINESS PROFILE ---');

const strongBizProfile = {
  userId: 'usr_strong_002',
  businessName: 'Summit Logistics Corp',
  entityType: 'Corporation',
  state: 'Texas',
  industry: 'Logistics',
  businessAge: '5+ years',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  hasWebsite: 'yes',
  hasBusinessPhone: 'yes',
  hasBusinessEmail: 'yes',
  hasBusinessAddress: 'yes',
  hasBusinessLicense: 'yes',
  hasDuns: 'yes',
  hasBusinessCreditProfile: 'yes',
  knowsBusinessCreditScore: 'yes',
  hasReportingAccounts: 'yes',
  businessCreditAccountCount: '10+',
  hasBusinessCreditCard: 'yes',
  annualRevenueRange: '$500,000+',
  personalCreditRange: '720+',
  hasFundingHistory: 'yes',
  fundingAmount: '$100,000–$250,000',
  fundingPurpose: ['Fleet expansion', 'Working capital'],
  profileCompleted: true,
};

const strongBizResult = calculateFundingReadiness(strongBizProfile);
assert(strongBizResult.score >= 85, `Mature business receives high score (Got: ${strongBizResult.score})`);
assert(strongBizResult.level === 'Strong Readiness', `Level is 'Strong Readiness' (Got: ${strongBizResult.level})`);
assert(strongBizResult.positiveFactors.length >= 8, `Positive factors reflect genuine achievements (${strongBizResult.positiveFactors.length} factors)`);
assert(strongBizResult.categories.foundation.score === 25, `Foundation category reaches max 25 (Got: ${strongBizResult.categories.foundation.score})`);
assert(strongBizResult.categories.businessCredit.score === 30, `Credit category reaches max 30 (Got: ${strongBizResult.categories.businessCredit.score})`);
assert(strongBizResult.categories.financialReadiness.score === 25, `Financial category reaches max 25 (Got: ${strongBizResult.categories.financialReadiness.score})`);
assert(strongBizResult.categories.fundingProfile.score === 20, `Profile category reaches max 20 (Got: ${strongBizResult.categories.fundingProfile.score})`);
assert(strongBizResult.score === 100, `Total score reaches 100 points for pristine profile (Got: ${strongBizResult.score})`);

// -----------------------------------------------------------------------------
// 4. SCENARIO 3: "NOT SURE" INTELLIGENCE
// -----------------------------------------------------------------------------
console.log('\n--- 4. SCENARIO 3: "NOT SURE" INTELLIGENCE ---');

const notSureBizProfile = {
  userId: 'usr_unsure_003',
  businessName: 'Apex Advisory LLC',
  entityType: 'LLC',
  hasEIN: 'not_sure',
  hasBusinessBankAccount: 'yes',
  hasBusinessCreditProfile: 'not_sure',
  hasReportingAccounts: 'not_sure',
  hasWebsite: 'not_sure',
};

const notSureResult = calculateFundingReadiness(notSureBizProfile);
const verificationItems = notSureResult.improvementFactors.filter((f) => f.isVerificationNeeded);
assert(verificationItems.length >= 3, `Items with 'not_sure' are tagged as Verification Needed (Found: ${verificationItems.length})`);
const einVerification = verificationItems.find((f) => f.id === 'imp_ein');
assert(einVerification && einVerification.title.toLowerCase().includes('verify'), `EIN verification item explicitly prompts review (Got: ${einVerification?.title})`);

// -----------------------------------------------------------------------------
// 5. SCENARIO 4: INCOMPLETE / NULL PROFILE HANDLING
// -----------------------------------------------------------------------------
console.log('\n--- 5. SCENARIO 4: INCOMPLETE & NULL PROFILE HANDLING ---');

const nullResult = calculateFundingReadiness(null);
assert(nullResult.score >= 0 && nullResult.score <= 10, 'Null profile computes safely without error');
assert(nullResult.level === 'Getting Started', 'Null profile assigns Getting Started level');

const emptyResult = calculateFundingReadiness({});
assert(emptyResult.score >= 0 && emptyResult.score <= 10, 'Empty object profile computes safely');

// -----------------------------------------------------------------------------
// 6. SCENARIO 5: SUPABASE DDL & SCHEMA AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 6. SCENARIO 5: SUPABASE DDL & SCHEMA AUDIT ---');

const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/supabase/schema.sql'), 'utf-8');
assert(schemaSql.includes('create table if not exists public.funding_readiness'), 'public.funding_readiness table defined in schema.sql');
assert(schemaSql.includes('alter table public.funding_readiness enable row level security'), 'funding_readiness enables RLS');
assert(schemaSql.includes('auth.uid() = user_id or public.is_admin()'), 'funding_readiness enforces user isolation and admin access');
assert(schemaSql.includes('alter table public.businesses') && schemaSql.includes('funding_readiness_score'), 'businesses table includes funding_readiness_score column');
assert(schemaSql.includes('alter table public.progress_history') && schemaSql.includes('funding_readiness_score'), 'progress_history includes funding_readiness_score column');

// -----------------------------------------------------------------------------
// 7. SCENARIO 6: ROADMAP STAGE 5 INTEGRATION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 7. SCENARIO 6: ROADMAP STAGE 5 INTEGRATION AUDIT ---');

const definitionsTs = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/roadmap/definitions.ts'), 'utf-8');
assert(definitionsTs.includes('task_fund_readiness_assessment'), 'task_fund_readiness_assessment defined in roadmap definitions');
assert(definitionsTs.includes('task_fund_organize_bank_statements'), 'task_fund_organize_bank_statements defined');
assert(definitionsTs.includes('task_fund_financial_documentation'), 'task_fund_financial_documentation defined');
assert(definitionsTs.includes('task_fund_ownership_tax_returns'), 'task_fund_ownership_tax_returns defined');
assert(definitionsTs.includes('task_fund_know_requirements'), 'task_fund_know_requirements defined');

const roadmapPageTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/app/roadmap/page.tsx'), 'utf-8');
assert(!roadmapPageTsx.includes('Stage 5: Funding Preparation Locked State'), 'Stage 5 locked state removed from roadmap page');
assert(roadmapPageTsx.includes('Stage 5 Active'), 'Stage 5 active banner present in roadmap page');

// -----------------------------------------------------------------------------
// 8. SCENARIO 7: DASHBOARD & ADMIN INTEGRATION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 8. SCENARIO 7: DASHBOARD & ADMIN INTEGRATION AUDIT ---');

const dashboardTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/app/dashboard/page.tsx'), 'utf-8');
assert(dashboardTsx.includes('calculateFundingReadiness'), 'Dashboard imports and calculates fundingReadiness');
assert(dashboardTsx.includes('Funding Readiness Card (Step 8)'), 'Dashboard renders dedicated Funding Readiness card');
assert(dashboardTsx.includes('grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'), 'Dashboard uses 4-column score cards grid');

const navLayoutTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/layout/DashboardLayout.tsx'), 'utf-8');
assert(navLayoutTsx.includes("href: '/funding-readiness'"), 'DashboardLayout includes /funding-readiness in navigation');

const adminUsersTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/app/admin/users/page.tsx'), 'utf-8');
assert(adminUsersTsx.includes('Fund'), 'Admin user list displays Fund score column');

const adminUserDetailTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/app/admin/users/[id]/page.tsx'), 'utf-8');
assert(adminUserDetailTsx.includes('Funding Readiness (Step 8)'), 'Admin user detail renders dedicated Funding Readiness metric card');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
if (failCount === 0) {
  console.log(`🎉 ALL ${passCount} STEP 8 VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
} else {
  console.error(`❌ VERIFICATION COMPLETED WITH ${failCount} FAILURES (${passCount} passed).`);
  process.exit(1);
}
console.log('================================================================\n');
