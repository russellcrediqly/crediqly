import http from 'http';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- STARTING UI/UX UPGRADE VALIDATION SUITE ---');
  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details}`);
    }
  }

  // 1. Pricing Page Verification
  console.log('\n[1. Testing Pricing Page]');
  const pricingRes = await fetchPage('http://localhost:3000/pricing');
  assert('Pricing page returns 200', pricingRes.status === 200);
  assert('Contains Transparent High-Value Pricing badge', pricingRes.body.includes('Transparent, High-Value Pricing'));
  assert('Contains Trust Highlights (256-Bit Encryption, Stripe Checkout)', 
    pricingRes.body.includes('256-Bit Bank-Grade Encryption') && 
    pricingRes.body.includes('Stripe Verified Checkout')
  );
  assert('Contains Pro Plan as Most Popular / Recommended', 
    pricingRes.body.includes('Most Popular — Recommended')
  );
  assert('Contains Premium Advisory Plan with VIP Guidance', 
    pricingRes.body.includes('Premium Advisory') && pricingRes.body.includes('VIP Concierge')
  );
  assert('Contains Feature Comparison Table', 
    pricingRes.body.includes('Compare Plan Capabilities') && 
    pricingRes.body.includes('Platform Capability')
  );

  // Check no accidental white-on-white button in pricing HTML
  const hasWhiteOnWhitePricing = /bg-white[^"]*text-white/.test(pricingRes.body);
  assert('Zero white-on-white text in pricing page buttons', !hasWhiteOnWhitePricing);

  // 2. Dashboard Verification
  console.log('\n[2. Testing Dashboard Page]');
  const dashRes = await fetchPage('http://localhost:3000/dashboard');
  assert('Dashboard page returns 200', dashRes.status === 200);
  assert('Contains What Should I Do Next section', 
    dashRes.body.includes('WHAT SHOULD I DO NEXT?') || dashRes.body.includes('Intelligent Recommendation Engine')
  );
  assert('Contains Route Map / Customer Journey', 
    dashRes.body.includes('Business Credit Journey') || dashRes.body.includes('Route Map')
  );
  assert('Contains Funding Matches section', 
    dashRes.body.includes('FUNDING MATCHES FOR YOU')
  );

  // 3. Roadmap Page Verification
  console.log('\n[3. Testing Roadmap Page]');
  const roadmapRes = await fetchPage('http://localhost:3000/roadmap');
  assert('Roadmap page returns 200', roadmapRes.status === 200);
  assert('Contains Business Credit Roadmap title', roadmapRes.body.includes('Your Business Credit Roadmap'));

  // 4. Funding Page Verification
  console.log('\n[4. Testing Funding Page]');
  const fundingRes = await fetchPage('http://localhost:3000/funding');
  assert('Funding page returns 200', fundingRes.status === 200);

  // 5. Readiness Page Verification
  console.log('\n[5. Testing Readiness Page]');
  const readinessRes = await fetchPage('http://localhost:3000/readiness');
  assert('Readiness page returns 200', readinessRes.status === 200);

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
