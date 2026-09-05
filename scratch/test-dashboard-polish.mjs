import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 RUNNING CREDIQLY DASHBOARD UI/UX ORGANIZATION & POLISH TEST SUITE...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ Passed: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ Failed: ${testName}`);
    process.exitCode = 1;
  }
}

const rootDir = process.cwd();

// Test 1: Button Component Accessible Contrast & Touch Sizes
console.log('--- Test Suite 1: Button Typography & Contrast ---');
const buttonFile = fs.readFileSync(path.join(rootDir, 'src/components/ui/Button.tsx'), 'utf-8');
assert(buttonFile.includes('border-slate-300'), 'Button outline has clear border-slate-300');
assert(buttonFile.includes('text-slate-800'), 'Button outline has high-contrast text-slate-800');
assert(buttonFile.includes('min-h-[36px]'), 'Button sm size has touch target protection (min-h-[36px])');
assert(buttonFile.includes('min-h-[42px]'), 'Button md size has touch target protection (min-h-[42px])');
assert(buttonFile.includes('font-semibold'), 'Base button typography uses font-semibold');

// Test 2: Grouped Navigation in DashboardLayout
console.log('\n--- Test Suite 2: Grouped Sidebar Navigation ---');
const layoutFile = fs.readFileSync(path.join(rootDir, 'src/components/layout/DashboardLayout.tsx'), 'utf-8');
assert(layoutFile.includes("title: 'MY BUSINESS'"), 'Navigation has MY BUSINESS category');
assert(layoutFile.includes("title: 'BUILD CREDIT'"), 'Navigation has BUILD CREDIT category');
assert(layoutFile.includes("title: 'FUNDING'"), 'Navigation has FUNDING category');
assert(layoutFile.includes("title: 'ACCOUNT'"), 'Navigation has ACCOUNT category');
assert(layoutFile.includes("label: 'Command Center'"), 'Dashboard link labeled Command Center');
assert(layoutFile.includes("href: '/business'"), 'Business Profile route exists in nav');
assert(layoutFile.includes("href: '/readiness'"), 'Readiness Audit route exists in nav');
assert(layoutFile.includes("href: '/roadmap'"), 'Credit Roadmap route exists in nav');

// Test 3: Relocated Features on Proper Pages
console.log('\n--- Test Suite 3: Secondary Features on Dedicated Pages ---');
const roadmapFile = fs.readFileSync(path.join(rootDir, 'src/app/roadmap/page.tsx'), 'utf-8');
assert(roadmapFile.includes('StageProgressList'), 'StageProgressList successfully moved to /roadmap');
assert(roadmapFile.includes('MilestoneTimeline'), 'MilestoneTimeline successfully moved to /roadmap');
assert(roadmapFile.includes('calculateMilestones'), 'calculateMilestones imported and used in /roadmap');

const readinessFile = fs.readFileSync(path.join(rootDir, 'src/app/readiness/page.tsx'), 'utf-8');
assert(readinessFile.includes('ProgressHistoryCard'), 'ProgressHistoryCard successfully moved to /readiness');
assert(readinessFile.includes('RecentActivityList'), 'RecentActivityList successfully moved to /readiness');
assert(readinessFile.includes('getProgressHistory'), 'getProgressHistory used in /readiness');
assert(readinessFile.includes('getRecentActivities'), 'getRecentActivities used in /readiness');

// Test 4: Dashboard Command Center Consolidation & Redundancy Removal
console.log('\n--- Test Suite 4: Dashboard Command Center Structure & De-duplication ---');
const dashboardFile = fs.readFileSync(path.join(rootDir, 'src/app/dashboard/page.tsx'), 'utf-8');
// Must contain Command Center elements:
assert(dashboardFile.includes('COMMAND CENTER'), 'Dashboard displays COMMAND CENTER banner');
assert(dashboardFile.includes('FundingReadinessScoreCard'), 'Funding Readiness Score Card mounted');
assert(dashboardFile.includes('YOUR NEXT STEP'), 'Clear primary action "YOUR NEXT STEP" hero present');
assert(dashboardFile.includes('CustomerJourneyCard'), 'CustomerJourneyCard mounted');
assert(dashboardFile.includes('WhatShouldIDoNextCard'), 'WhatShouldIDoNextCard mounted');
assert(dashboardFile.includes('FundingMatchesForYouCard'), 'FundingMatchesForYouCard mounted');
assert(dashboardFile.includes('FundingForecastCard'), 'FundingForecastCard mounted');
assert(dashboardFile.includes('CrediqlyAIMentorCard'), 'CrediqlyAIMentorCard mounted');
assert(dashboardFile.includes('Your Current Plan:'), 'Compact plan summary mounted');

// Must NOT contain redundant duplicate sections:
assert(!dashboardFile.includes('YOUR READINESS & PERFORMANCE METRICS'), 'Duplicate 4-card readiness grid removed from dashboard');
assert(!dashboardFile.includes('What affects your readiness?'), 'Duplicate factors breakdown removed from dashboard');
assert(!dashboardFile.includes('ProductCard'), 'Duplicate product cards removed from dashboard');
assert(!dashboardFile.includes('Funding Activity</h3>'), 'Duplicate application tracking table removed from dashboard');
assert(!dashboardFile.includes('Business Profile Complete</h3>'), 'Duplicate profile table removed from dashboard');

console.log(`\n🎉 Results: ${passedTests}/${totalTests} tests passed!`);
if (passedTests === totalTests) {
  console.log('⭐ ALL POLISH & ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!');
}
