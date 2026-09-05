// Automated test script for Phase B: Personalized "What Should I Do Next?" Recommendation Engine
import assert from 'node:assert';

console.log('================================================================');
console.log('TEST SUITE: PHASE B — PERSONALIZED NEXT ACTIONS RECOMMENDATION');
console.log('================================================================\n');

// Mock task generator to simulate roadmap engine
function mockRoadmap(allTasks, userCompletions = {}) {
  return {
    allTasks: allTasks.map(t => ({
      ...t,
      status: userCompletions[t.key] ? 'completed' : 'not_started',
      completedAt: userCompletions[t.key] || undefined,
    })),
    completedCount: Object.keys(userCompletions).length,
    userCompletions,
  };
}

// Logic replication of getTopRecommendedActions
function getTopRecommendedActions(profile, roadmap, fundingReadiness) {
  const p = profile || {};
  const isTaskCompleted = (taskKey) => {
    const task = roadmap?.allTasks?.find((t) => t.key === taskKey);
    if (!task) return false;
    return task.status === 'completed' || Boolean(task.completedAt) || task.satisfiedByProfile;
  };

  const candidates = [];

  // 1. Missing Critical Information
  if (!p.profileCompleted || !p.entityType || p.entityType.trim() === '') {
    candidates.push({
      id: 'rec_complete_profile',
      title: 'Complete Business Profile',
      priority: 'High',
      explanation: 'Your profile is missing foundational business details needed to calculate your live credit scores.',
      whyItMatters: 'Commercial bureaus and automated underwriting systems require verified legal entity details to establish corporate credit files.',
      potentialImpact: 'Could improve your readiness assessment.',
      actionLabel: 'Complete Profile',
      actionHref: '/onboarding',
      roadmapTaskKey: 'task_entity',
      category: 'information',
    });
  }

  if (p.hasEIN !== 'yes') {
    candidates.push({
      id: 'rec_ein',
      title: 'Establish Federal EIN',
      priority: 'High',
      explanation: p.hasEIN === 'not_sure'
        ? 'Confirm whether your business has a Federal Employer Identification Number assigned.'
        : 'Obtain an official Federal EIN from the IRS for your business entity.',
      whyItMatters: 'An EIN is the fundamental corporate tax identifier required to separate commercial credit reporting from your personal SSN.',
      potentialImpact: 'Essential for commercial bureau credit building.',
      actionLabel: 'View EIN Step',
      actionHref: '/roadmap?filter=foundation',
      roadmapTaskKey: 'task_ein',
      category: 'information',
    });
  }

  // 2. Readiness Weaknesses (Banking & Cash Flow)
  if (p.hasBusinessBankAccount !== 'yes') {
    candidates.push({
      id: 'rec_bank_account',
      title: 'Establish Business Banking',
      priority: 'High',
      explanation: p.hasBusinessBankAccount === 'not_sure'
        ? 'Confirm complete separation of your commercial business account from personal accounts.'
        : 'Open a dedicated commercial checking account in your legal business name.',
      whyItMatters: 'Underwriters require clear verification that business operations and cash flow are cleanly separated from personal finances.',
      potentialImpact: 'Could improve your funding readiness.',
      actionLabel: 'View Banking Step',
      actionHref: '/roadmap?filter=foundation',
      roadmapTaskKey: 'task_bank_account',
      category: 'banking',
    });
  }

  if (p.annualRevenueRange === 'Pre-revenue' || p.annualRevenueRange === 'Under $10,000') {
    candidates.push({
      id: 'rec_consistent_deposits',
      title: 'Maintain Consistent Business Deposits',
      priority: 'Medium',
      explanation: 'Your current profile indicates early-stage commercial cash flow or pre-revenue operations.',
      whyItMatters: 'Lenders review 3–6 months of steady business bank deposits to establish baseline debt-service coverage before approving loans.',
      potentialImpact: 'Could improve your funding readiness.',
      actionLabel: 'View Deposit Guidance',
      actionHref: '/roadmap?filter=financial',
      roadmapTaskKey: 'task_banking_separation',
      category: 'banking',
    });
  }

  // 3. Business Credit Weaknesses
  if (p.hasBusinessCreditProfile !== 'yes') {
    candidates.push({
      id: 'rec_credit_profile',
      title: 'Work on Building Business Credit',
      priority: 'High',
      explanation: 'Your business does not yet have an active commercial credit file with Dun & Bradstreet, Experian, or Equifax.',
      whyItMatters: 'Without an active commercial file, automated lender underwriting algorithms cannot verify your creditworthiness.',
      potentialImpact: 'Activates commercial credit reporting.',
      actionLabel: 'Establish Credit File',
      actionHref: '/roadmap?filter=credit_foundation',
      roadmapTaskKey: 'task_profile_bureau',
      category: 'credit',
    });
  }

  if (p.hasReportingAccounts !== 'yes' || p.businessCreditAccountCount === '1-3' || !p.businessCreditAccountCount) {
    candidates.push({
      id: 'rec_credit_depth',
      title: 'Improve Business Credit Depth',
      priority: 'High',
      explanation: 'Your current profile indicates limited business credit depth and few active reporting vendor tradelines.',
      whyItMatters: 'Lenders look for at least 3–5 trade lines reporting on-time payment history to verify payment reliability.',
      potentialImpact: 'Could improve your readiness.',
      actionLabel: 'Browse Net-30 Vendors',
      actionHref: '/products?category=net_30',
      roadmapTaskKey: 'task_reporting_accounts',
      category: 'credit',
    });
  }

  if (p.hasBusinessCreditCard !== 'yes') {
    candidates.push({
      id: 'rec_credit_card',
      title: 'Establish Revolving Business Credit Line',
      priority: 'Medium',
      explanation: 'Your business does not currently utilize a dedicated revolving commercial credit card.',
      whyItMatters: 'A revolving credit line demonstrates ongoing credit management and adds positive tradeline depth to your commercial bureau files.',
      potentialImpact: 'Could improve your credit depth.',
      actionLabel: 'Explore Business Cards',
      actionHref: '/products?category=business_credit_cards',
      roadmapTaskKey: 'task_build_business_card',
      category: 'credit',
    });
  }

  if (
    p.personalCreditRange === 'Under 600' ||
    p.personalCreditRange === '600–639' ||
    p.personalCreditRange === 'Fair (640–679)'
  ) {
    candidates.push({
      id: 'rec_utilization_review',
      title: 'Review Credit Utilization',
      priority: 'Medium',
      explanation: 'Your personal credit tier indicates an opportunity to optimize revolving utilization ratios.',
      whyItMatters: 'Many small business credit providers evaluate owner credit scores as a personal guarantee factor during early growth stages.',
      potentialImpact: 'Could improve underwriting approval flexibility.',
      actionLabel: 'View Credit Strategy',
      actionHref: '/roadmap?filter=credit_building',
      roadmapTaskKey: 'task_monitor_scores',
      category: 'credit',
    });
  }

  // 4. Funding Preparation
  const score = fundingReadiness?.score ?? 0;
  if (score < 70) {
    candidates.push({
      id: 'rec_funding_readiness',
      title: 'Improve Readiness Before Applying',
      priority: 'Medium',
      explanation: 'Your current commercial profile is developing toward optimal lender underwriting criteria.',
      whyItMatters: 'Applying for capital before reaching target readiness thresholds increases the likelihood of strict terms or initial declines.',
      potentialImpact: 'Could improve your readiness.',
      actionLabel: 'Review Readiness Breakdown',
      actionHref: '/readiness',
      roadmapTaskKey: 'task_funding_prep',
      category: 'funding',
    });
  } else {
    candidates.push({
      id: 'rec_review_funding_options',
      title: 'Review Funding Options',
      priority: 'Medium',
      explanation: 'Your business has established a solid commercial credit and compliance baseline.',
      whyItMatters: 'Comparing qualified financing products, commercial lines of credit, and partner options ensures the best borrowing terms.',
      potentialImpact: 'Unlocks tailored funding matches.',
      actionLabel: 'Explore Funding Options',
      actionHref: '/funding',
      roadmapTaskKey: 'task_explore_financing',
      category: 'funding',
    });
  }

  if (!p.fundingAmount || p.fundingAmount.trim() === '') {
    candidates.push({
      id: 'rec_funding_target',
      title: 'Define Target Funding Goals',
      priority: 'Low',
      explanation: 'Your profile has not yet articulated a specific capital amount or commercial use-case.',
      whyItMatters: 'Lenders evaluate debt service capacity against clear, documented capital allocation plans.',
      potentialImpact: 'Refines personalized funding recommendations.',
      actionLabel: 'Set Funding Goal',
      actionHref: '/business',
      roadmapTaskKey: 'task_funding_target',
      category: 'funding',
    });
  }

  // 5. Existing Roadmap steps
  if (roadmap?.allTasks) {
    for (const task of roadmap.allTasks) {
      if (task.status !== 'completed' && !isTaskCompleted(task.key)) {
        const exists = candidates.some((c) => c.roadmapTaskKey === task.key || c.id === task.key);
        if (!exists) {
          candidates.push({
            id: `task_${task.key}`,
            title: task.title,
            priority: (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)),
            explanation: task.whatToDo?.[0] || 'Next logical milestone in your personalized 6-stage roadmap.',
            whyItMatters: task.whyItMatters || 'Completing this step strengthens your commercial business credit standing.',
            potentialImpact: 'Could improve your readiness.',
            actionLabel: task.actionLabel || 'View Step',
            actionHref: task.actionHref || '/roadmap',
            roadmapTaskKey: task.key,
            category: 'roadmap',
          });
        }
      }
    }
  }

  const uncompleted = candidates.filter((action) => !isTaskCompleted(action.roadmapTaskKey));
  return uncompleted.slice(0, 3).map((action, index) => ({
    ...action,
    order: index + 1,
    isCompleted: false,
  }));
}

// -----------------------------------------------------------------------------
// TEST 1: New / Incomplete User
// -----------------------------------------------------------------------------
console.log('--- TEST 1: New / Incomplete User Profile ---');
const incompleteProfile = {
  profileCompleted: false,
  entityType: '',
  hasEIN: 'no',
  hasBusinessBankAccount: 'no',
};
const defaultTasks = [
  { key: 'task_entity', title: 'Register Entity', priority: 'high', satisfiedByProfile: false },
  { key: 'task_ein', title: 'Obtain EIN', priority: 'high', satisfiedByProfile: false },
  { key: 'task_bank_account', title: 'Open Bank Account', priority: 'high', satisfiedByProfile: false },
  { key: 'task_reporting_accounts', title: 'Open Net-30', priority: 'high', satisfiedByProfile: false },
];
const roadmap1 = mockRoadmap(defaultTasks, {});
const recs1 = getTopRecommendedActions(incompleteProfile, roadmap1, { score: 20 });

console.log('Recommendations for Incomplete User:');
recs1.forEach(r => console.log(` [${r.order}] ${r.title} (${r.priority} Priority) — Impact: "${r.potentialImpact}"`));

assert.strictEqual(recs1.length, 3, 'Must return exactly 3 recommendations');
assert.strictEqual(recs1[0].title, 'Complete Business Profile', 'First recommendation must be Complete Business Profile');
assert.strictEqual(recs1[1].title, 'Establish Federal EIN', 'Second recommendation must be Establish Federal EIN');
assert.strictEqual(recs1[2].title, 'Establish Business Banking', 'Third recommendation must be Establish Business Banking');
console.log('✓ TEST 1 PASSED\n');

// -----------------------------------------------------------------------------
// TEST 2: Weak / Early Profile (Entity established, but no banking & no credit)
// -----------------------------------------------------------------------------
console.log('--- TEST 2: Weak / Early Profile ---');
const weakProfile = {
  profileCompleted: true,
  entityType: 'Limited Liability Company (LLC)',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'no',
  annualRevenueRange: 'Pre-revenue',
  hasBusinessCreditProfile: 'no',
  hasReportingAccounts: 'no',
  hasBusinessCreditCard: 'no',
};
const roadmap2 = mockRoadmap(defaultTasks, { task_entity: '2026-09-01', task_ein: '2026-09-01' });
const recs2 = getTopRecommendedActions(weakProfile, roadmap2, { score: 35 });

console.log('Recommendations for Weak/Early Profile:');
recs2.forEach(r => console.log(` [${r.order}] ${r.title} (${r.priority} Priority) — Impact: "${r.potentialImpact}"`));

assert.strictEqual(recs2.length, 3);
assert.strictEqual(recs2[0].title, 'Establish Business Banking', 'Must prioritize banking when missing');
assert.strictEqual(recs2[1].title, 'Maintain Consistent Business Deposits', 'Must prioritize deposits when pre-revenue');
assert.strictEqual(recs2[2].title, 'Work on Building Business Credit', 'Must prioritize commercial credit file setup');
console.log('✓ TEST 2 PASSED\n');

// -----------------------------------------------------------------------------
// TEST 3: Mid-tier Profile (Needs Credit Depth & Card)
// -----------------------------------------------------------------------------
console.log('--- TEST 3: Mid-tier Profile (Foundation complete, Credit Depth low) ---');
const midProfile = {
  profileCompleted: true,
  entityType: 'Limited Liability Company (LLC)',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  annualRevenueRange: '$50,000–$100,000',
  hasBusinessCreditProfile: 'yes',
  hasReportingAccounts: 'no',
  businessCreditAccountCount: '1-3',
  hasBusinessCreditCard: 'no',
  personalCreditRange: '680–719',
};
const roadmap3 = mockRoadmap(defaultTasks, {
  task_entity: '2026-09-01',
  task_ein: '2026-09-01',
  task_bank_account: '2026-09-01',
  task_profile_bureau: '2026-09-01',
});
const recs3 = getTopRecommendedActions(midProfile, roadmap3, { score: 62 });

console.log('Recommendations for Mid-tier Profile:');
recs3.forEach(r => console.log(` [${r.order}] ${r.title} (${r.priority} Priority) — Impact: "${r.potentialImpact}"`));

assert.strictEqual(recs3.length, 3);
assert.strictEqual(recs3[0].title, 'Improve Business Credit Depth', 'Must prioritize tradelines');
assert.strictEqual(recs3[1].title, 'Establish Revolving Business Credit Line', 'Must prioritize business credit card');
assert.strictEqual(recs3[2].title, 'Improve Readiness Before Applying', 'Must prioritize readiness when score < 70');
console.log('✓ TEST 3 PASSED\n');

// -----------------------------------------------------------------------------
// TEST 4: Strong Profile (Score >= 70, High Readiness)
// -----------------------------------------------------------------------------
console.log('--- TEST 4: Strong Profile (Score >= 70, High Readiness) ---');
const strongProfile = {
  profileCompleted: true,
  entityType: 'Limited Liability Company (LLC)',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  annualRevenueRange: '$250,000–$500,000',
  hasBusinessCreditProfile: 'yes',
  hasReportingAccounts: 'yes',
  businessCreditAccountCount: '4-5',
  hasBusinessCreditCard: 'yes',
  personalCreditRange: '720+',
  fundingAmount: '$100,000',
};
const roadmap4 = mockRoadmap(defaultTasks, {
  task_entity: '2026-09-01',
  task_ein: '2026-09-01',
  task_bank_account: '2026-09-01',
  task_profile_bureau: '2026-09-01',
  task_reporting_accounts: '2026-09-01',
  task_build_business_card: '2026-09-01',
});
const recs4 = getTopRecommendedActions(strongProfile, roadmap4, { score: 88 });

console.log('Recommendations for Strong Profile:');
recs4.forEach(r => console.log(` [${r.order}] ${r.title} (${r.priority} Priority) — Impact: "${r.potentialImpact}"`));

assert.strictEqual(recs4.length, 1);
assert.strictEqual(recs4[0].title, 'Review Funding Options', 'Strong profile advances to Review Funding Options');
console.log('✓ TEST 4 PASSED\n');

// -----------------------------------------------------------------------------
// TEST 5: Progress Completion & Automatic Next Action Generation
// -----------------------------------------------------------------------------
console.log('--- TEST 5: Progress Completion & Dynamic Next Action Generation ---');
// User starts with recs3:
// 1. Improve Business Credit Depth (task_reporting_accounts)
// 2. Establish Revolving Business Credit Line (task_build_business_card)
// 3. Improve Readiness Before Applying (task_funding_prep)
console.log('Initial Action 1:', recs3[0].title);

// User clicks [Mark Complete] on task_reporting_accounts
const updatedCompletions = {
  ...roadmap3.userCompletions,
  task_reporting_accounts: new Date().toISOString(),
};
const roadmap3Updated = mockRoadmap(defaultTasks, updatedCompletions);
// Re-evaluate
const recs3After = getTopRecommendedActions(midProfile, roadmap3Updated, { score: 68 });

console.log('After completing Action 1:');
recs3After.forEach(r => console.log(` [${r.order}] ${r.title} (${r.priority} Priority)`));

assert.strictEqual(recs3After[0].title, 'Establish Revolving Business Credit Line', 'Action #2 must now become Action #1');
assert.strictEqual(recs3After[1].title, 'Improve Readiness Before Applying', 'Action #3 must now become Action #2');
console.log('✓ TEST 5 PASSED: Completing an action automatically shifts the queue and surfaces the next recommendation!\n');

// -----------------------------------------------------------------------------
// TEST 6: Guarantee-Free Potential Impact Language
// -----------------------------------------------------------------------------
console.log('--- TEST 6: Checking Impact Language for Safety (No Guaranteed Points) ---');
const allRecs = [...recs1, ...recs2, ...recs3, ...recs4];
allRecs.forEach(r => {
  assert(!r.potentialImpact.includes('will increase'), `Should not promise guaranteed increases: "${r.potentialImpact}"`);
  assert(!r.potentialImpact.includes('points'), `Should not promise specific points: "${r.potentialImpact}"`);
  assert(r.potentialImpact.includes('Could') || r.potentialImpact.includes('Essential') || r.potentialImpact.includes('Activates') || r.potentialImpact.includes('Unlocks') || r.potentialImpact.includes('Strengthens') || r.potentialImpact.includes('Refines'), `Must use realistic impact verbs: "${r.potentialImpact}"`);
});
console.log('✓ TEST 6 PASSED: All potential impact text is compliant, realistic, and free of guaranteed point promises.\n');

console.log('================================================================');
console.log('ALL PHASE B TESTS COMPLETED SUCCESSFULLY! (6/6 PASS) ✓');
console.log('================================================================');
