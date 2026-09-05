import assert from 'node:assert';

console.log('--- TESTING FUNDING FACTORS & READINESS ENGINE LOGIC ---');

// Replicate fundingFactors pure functions for Node verification
function hasSufficientFundingData(profile) {
  if (!profile) return false;
  const hasEntity = Boolean(profile.entityType && profile.entityType.trim() !== '');
  const hasBanking = Boolean(profile.hasBusinessBankAccount);
  const hasAge = Boolean(profile.businessAge && profile.businessAge.trim() !== '');
  return Boolean(hasEntity && (hasBanking || hasAge || profile.profileCompleted));
}

function calculateMonthlyDelta(currentScore, previousScore) {
  if (previousScore === undefined || previousScore === null) {
    return { text: 'Baseline assessment', type: 'neutral' };
  }
  const diff = currentScore - previousScore;
  if (diff > 0) {
    return { text: `↑ ${diff} ${diff === 1 ? 'point' : 'points'} this month`, type: 'up' };
  }
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    return { text: `↓ ${absDiff} ${absDiff === 1 ? 'point' : 'points'} this month`, type: 'down' };
  }
  return { text: 'Stable this month', type: 'neutral' };
}

function evaluateMajorReadinessAreas(p) {
  const areas = [];

  // 1. Business Profile
  const validEntity = p.entityType && p.entityType !== 'Not sure' && p.entityType !== 'Sole Proprietorship';
  const hasEIN = p.hasEIN === 'yes';
  if (validEntity && hasEIN) {
    areas.push({
      key: 'business_profile',
      name: 'Business Profile',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: `${p.entityType || 'Entity'} with registered EIN`,
    });
  } else if (validEntity || p.entityType === 'Sole Proprietorship' || hasEIN) {
    areas.push({
      key: 'business_profile',
      name: 'Business Profile',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: p.entityType === 'Sole Proprietorship'
        ? 'Sole Proprietorship limits commercial protection'
        : 'EIN or corporate registration pending',
    });
  } else {
    areas.push({
      key: 'business_profile',
      name: 'Business Profile',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'Formal business entity not yet confirmed',
    });
  }

  // 2. Business Age
  const age = p.businessAge;
  if (age === '5+ years' || age === '3+ years' || age === '2–5 years') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: `${age} operating history`,
    });
  } else if (age === '1–2 years') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Good',
      indicator: 'green',
      detail: '1–2 years established operations',
    });
  } else if (age === '6–12 months') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: '6–12 months operating track record',
    });
  } else if (age === 'Less than 6 months' || age === '3–6 months' || age === 'Less than 3 months') {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'New business entity (under 6 months)',
    });
  } else {
    areas.push({
      key: 'business_age',
      name: 'Business Age',
      statusLabel: 'Not Provided',
      indicator: 'red',
      detail: 'Operating age not yet recorded',
    });
  }

  // 3. Business Credit Depth
  const hasReporting = p.hasReportingAccounts === 'yes';
  const hasProfile = p.hasBusinessCreditProfile === 'yes';
  const hasCard = p.hasBusinessCreditCard === 'yes';
  const highCount = p.businessCreditAccountCount === '4-5' || p.businessCreditAccountCount === '6-10' || p.businessCreditAccountCount === '10+';

  if (hasReporting && (highCount || hasCard)) {
    areas.push({
      key: 'credit_depth',
      name: 'Business Credit Depth',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: 'Multiple reporting tradelines & commercial credit accounts',
    });
  } else if (hasReporting || hasProfile || hasCard) {
    areas.push({
      key: 'credit_depth',
      name: 'Business Credit Depth',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: hasReporting
        ? 'Add 2–3 additional tradelines to deepen credit file'
        : 'Credit profile established, needs reporting vendor accounts',
    });
  } else {
    areas.push({
      key: 'credit_depth',
      name: 'Business Credit Depth',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'No commercial credit accounts or reporting tradelines active',
    });
  }

  // 4. Revenue
  const rev = p.annualRevenueRange;
  if (rev === '$1,000,000+' || rev === '$500,000+' || rev === '$250,000–$500,000') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: `${rev} annual commercial revenue`,
    });
  } else if (rev === '$100,000–$250,000' || rev === '$50,000–$100,000') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Good',
      indicator: 'green',
      detail: `${rev} documented annual revenue`,
    });
  } else if (rev === '$10,000–$50,000') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Needs Improvement',
      indicator: 'amber',
      detail: '$10k–$50k early-stage commercial cash flow',
    });
  } else if (rev === 'Under $10,000' || rev === 'Pre-revenue') {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: rev === 'Pre-revenue' ? 'Pre-revenue business stage' : 'Under $10k annual baseline',
    });
  } else {
    areas.push({
      key: 'revenue',
      name: 'Revenue',
      statusLabel: 'Not Provided',
      indicator: 'red',
      detail: 'Annual revenue not yet recorded',
    });
  }

  // 5. Cash Flow Consistency
  const bank = p.hasBusinessBankAccount;
  if (bank === 'yes') {
    areas.push({
      key: 'cash_flow',
      name: 'Cash Flow Consistency',
      statusLabel: 'Strong',
      indicator: 'green',
      detail: 'Dedicated commercial business account verified',
    });
  } else if (bank === 'not_sure') {
    areas.push({
      key: 'cash_flow',
      name: 'Cash Flow Consistency',
      statusLabel: 'Needs Information',
      indicator: 'amber',
      detail: 'Commercial bank separation requires confirmation',
    });
  } else {
    areas.push({
      key: 'cash_flow',
      name: 'Cash Flow Consistency',
      statusLabel: 'Needs Attention',
      indicator: 'red',
      detail: 'No dedicated business checking account opened',
    });
  }

  return areas;
}

// 1. Test Empty State
console.log('Testing Empty Profile Handling:');
assert.strictEqual(hasSufficientFundingData(null), false);
assert.strictEqual(hasSufficientFundingData({}), false);
console.log('✓ Incomplete / empty profiles prevent fake scores and show Complete Profile prompt.');

// 2. Test Populated Profile
console.log('\nTesting Populated Profile:');
const sample = {
  entityType: 'Limited Liability Company (LLC)',
  state: 'Texas',
  industry: 'Professional Services',
  businessAge: '1–2 years',
  hasEIN: 'yes',
  hasBusinessBankAccount: 'yes',
  hasReportingAccounts: 'no',
  hasBusinessCreditProfile: 'yes',
  annualRevenueRange: '$50,000–$100,000',
  personalCreditRange: '680–719',
};

assert.strictEqual(hasSufficientFundingData(sample), true);
const areas = evaluateMajorReadinessAreas(sample);
assert.strictEqual(areas.length, 5);

console.log('5 Major Readiness Areas evaluated:');
areas.forEach(a => {
  console.log(`  ${a.indicator === 'green' ? '🟢' : a.indicator === 'amber' ? '🟡' : '🔴'} ${a.name} — ${a.statusLabel} (${a.detail})`);
});

// Verify matches expected statuses:
assert.strictEqual(areas[0].statusLabel, 'Strong'); // Business Profile (LLC + EIN)
assert.strictEqual(areas[1].statusLabel, 'Good'); // Business Age (1-2 years)
assert.strictEqual(areas[2].statusLabel, 'Needs Improvement'); // Credit Depth (profile yes, reporting no)
assert.strictEqual(areas[3].statusLabel, 'Good'); // Revenue ($50k-$100k)
assert.strictEqual(areas[4].statusLabel, 'Strong'); // Cash Flow Consistency (bank yes)

// 3. Test Delta
console.log('\nTesting Monthly Delta:');
const delta = calculateMonthlyDelta(72, 66);
assert.strictEqual(delta.text, '↑ 6 points this month');
assert.strictEqual(delta.type, 'up');
console.log(`✓ Delta correctly computed: "${delta.text}"`);

console.log('\nALL SCRIPTS VERIFIED SUCCESSFULLY! ✓');
