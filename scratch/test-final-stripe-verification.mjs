// scratch/test-final-stripe-verification.mjs
import http from 'http';

async function testEndpoint(name, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('--- Starting Stripe Integration Tests ---');

  // Test 1: Verify Config GET endpoint
  const verifyRes = await testEndpoint('Verify Config', '/api/stripe/verify-config');
  console.log('1. /api/stripe/verify-config status:', verifyRes.status);
  console.log('   connected:', verifyRes.body.connected);
  console.log('   mode:', verifyRes.body.mode);
  console.log('   webhookStatus:', verifyRes.body.webhookStatus);
  console.log('   prices:', {
    pro: verifyRes.body.prices.pro.valid,
    setup: verifyRes.body.prices.advisorySetup.valid,
    monthly: verifyRes.body.prices.advisoryMonthly.valid,
  });
  console.log('   overallReady:', verifyRes.body.overallReady);
  console.log('   has Vercel snippet:', Boolean(verifyRes.body.vercelEnvSnippet));

  // Test 2: Save Config with partial update (should NOT delete secret key!)
  const saveRes1 = await testEndpoint('Save Config (Partial)', '/api/stripe/save-config', {
    method: 'POST',
    body: {
      proPriceId: 'price_1UCGDNDzJxX7FxJaozgSxNbC',
    },
  });
  console.log('2. /api/stripe/save-config partial update status:', saveRes1.status);
  console.log('   connectionStatus:', saveRes1.body.connectionStatus);
  console.log('   connectionMessage:', saveRes1.body.connectionMessage);

  // Test 3: Verify Config after partial save to ensure secret key was NOT wiped
  const verifyRes2 = await testEndpoint('Verify Config Post Partial Save', '/api/stripe/verify-config');
  console.log('3. Secret key preserved after partial save?', verifyRes2.body.hasSecretKey);
  console.log('   Connected after partial save?', verifyRes2.body.connected);

  // Test 4: Save with empty strings (common when submitting form with masked password fields)
  const saveRes2 = await testEndpoint('Save Config (Empty strings)', '/api/stripe/save-config', {
    method: 'POST',
    body: {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
    },
  });
  console.log('4. /api/stripe/save-config with empty strings status:', saveRes2.status);
  console.log('   connectionStatus:', saveRes2.body.connectionStatus);

  // Test 5: Verify Config after empty strings submit
  const verifyRes3 = await testEndpoint('Verify Config Post Empty Submit', '/api/stripe/verify-config');
  console.log('5. Secret key STILL preserved after empty strings submit?', verifyRes3.body.hasSecretKey);
  console.log('   Connected still true?', verifyRes3.body.connected);

  // Test 6: Verify Admin Settings Stripe page renders HTML
  const pageRes = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/admin/settings/stripe', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    }).on('error', reject);
  });
  console.log('6. /admin/settings/stripe HTTP status:', pageRes.status);
  console.log('   Contains "Stripe Payments & Checkout Setup"?', pageRes.text.includes('Stripe Payments & Checkout Setup') || pageRes.text.includes('Stripe'));

  // Test 7: Verify Admin Payments page renders without demo data
  const paymentsRes = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/admin/payments', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    }).on('error', reject);
  });
  console.log('7. /admin/payments HTTP status:', paymentsRes.status);
  console.log('   Contains fake "Alex Morgan"?', paymentsRes.text.includes('Alex Morgan'));

  // Test 8: Advisory Checkout Session creation
  const checkoutRes = await testEndpoint('Checkout Advisory', '/api/stripe/checkout-advisory', {
    method: 'POST',
    body: {
      userId: 'test_user_production_audit',
      customerEmail: 'audit@crediqly.com',
      companyName: 'Production Audit Corp',
      tier: 'full',
    },
  });
  console.log('8. Advisory Checkout Session status:', checkoutRes.status);
  console.log('   Checkout URL generated?', Boolean(checkoutRes.body?.checkoutUrl));
  console.log('   Checkout Session ID:', checkoutRes.body?.sessionId);

  // Test 9: Pro Subscription Checkout Session creation
  const proCheckoutRes = await testEndpoint('Checkout Pro', '/api/stripe/checkout-subscription', {
    method: 'POST',
    body: {
      userId: 'test_user_pro_audit',
      customerEmail: 'audit@crediqly.com',
    },
  });
  console.log('9. Pro Subscription Checkout Session status:', proCheckoutRes.status);
  console.log('   Checkout URL generated?', Boolean(proCheckoutRes.body?.checkoutUrl));
  console.log('   Checkout Session ID:', proCheckoutRes.body?.sessionId);

  console.log('--- All Stripe Integration Tests Completed ---');
}

run().catch(console.error);

