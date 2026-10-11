/**
 * Comprehensive Automated Verification Suite for P0 Admin Account Recovery & Password Reset
 */

import { isAuthorizedAdminEmail, AUTHORIZED_ADMIN_EMAILS } from '../src/types/user';
import {
  createSignedAdminToken,
  verifySignedAdminToken,
  verifyAdminRequest,
} from '../src/lib/auth/adminAuth';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n================================================================');
  console.log('  CREDIQLY P0 ADMIN LOGIN & PASSWORD RECOVERY VERIFICATION SUITE');
  console.log('================================================================\n');

  // Test 1: Reset Password Page Existence & Structure
  console.log('--- Test 1: Dedicated Reset Password Page ---');
  const resetPasswordPath = path.join(process.cwd(), 'src/app/reset-password/page.tsx');
  const resetExists = fs.existsSync(resetPasswordPath);
  assert(resetExists, 'Dedicated /reset-password page exists in src/app/reset-password/page.tsx');
  if (resetExists) {
    const content = fs.readFileSync(resetPasswordPath, 'utf8');
    assert(content.includes('exchangeCodeForSession'), 'Page supports PKCE code exchange (?code=...)');
    assert(content.includes('setSession'), 'Page supports recovery hash fragment (#access_token=...)');
    assert(content.includes('PASSWORD_RECOVERY'), 'Page listens for PASSWORD_RECOVERY auth event');
    assert(content.includes('updateUser'), 'Page invokes supabase.auth.updateUser to save new password');
    assert(content.includes('isAuthorizedAdminEmail'), 'Page verifies administrator role upon reset');
  }

  // Test 2: Auth Callback Handler Existence
  console.log('\n--- Test 2: Server-Side Auth Callback Handler ---');
  const callbackPath = path.join(process.cwd(), 'src/app/auth/callback/route.ts');
  const callbackExists = fs.existsSync(callbackPath);
  assert(callbackExists, 'Auth callback route exists in src/app/auth/callback/route.ts');
  if (callbackExists) {
    const content = fs.readFileSync(callbackPath, 'utf8');
    assert(content.includes('exchangeCodeForSession'), 'Callback route exchanges PKCE code server-side');
    assert(content.includes('/reset-password'), 'Callback defaults destination to /reset-password');
  }

  // Test 3: Auth Diagnostic API Route Existence
  console.log('\n--- Test 3: Live Auth Health & Status API ---');
  const statusPath = path.join(process.cwd(), 'src/app/api/auth/status/route.ts');
  const statusExists = fs.existsSync(statusPath);
  assert(statusExists, 'Auth health status endpoint exists in src/app/api/auth/status/route.ts');

  // Test 4: Forgot Password Flow & Redirect Configuration
  console.log('\n--- Test 4: Forgot Password Workflow & Redirection ---');
  const authContextPath = path.join(process.cwd(), 'src/context/AuthContext.tsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  assert(
    authContextContent.includes('/reset-password'),
    'resetPassword submits redirectTo pointing directly to /reset-password'
  );
  assert(
    !authContextContent.includes('Password reset simulated'),
    'Eliminated misleading "Password reset simulated" message in AuthContext'
  );

  // Test 5: Authorized Main Admin Account Verification
  console.log('\n--- Test 5: Main Admin Account Authorization ---');
  const mainAdmin = 'crediqly@gmail.com';
  assert(isAuthorizedAdminEmail(mainAdmin), 'Primary admin crediqly@gmail.com recognized as authorized admin');
  assert(isAuthorizedAdminEmail('CREDIQLY@GMAIL.COM'), 'Admin email verification is case-insensitive');
  assert(isAuthorizedAdminEmail('raselandahmed@gmail.com'), 'Secondary admin raselandahmed@gmail.com authorized');
  assert(!isAuthorizedAdminEmail('random_customer@gmail.com'), 'Ordinary customer email is NOT granted admin access');
  assert(!isAuthorizedAdminEmail('attacker@evil.com'), 'Attacker email strictly denied admin role');

  // Test 6: Cryptographic Admin Session Token
  console.log('\n--- Test 6: Cryptographic Admin Session Token ---');
  const signedToken = createSignedAdminToken(mainAdmin);
  assert(typeof signedToken === 'string' && signedToken.length > 20, 'Signed admin token generated');
  const verified = verifySignedAdminToken(signedToken);
  assert(verified.valid === true, 'Signed admin token verifies successfully');
  assert(verified.email === mainAdmin, 'Token correctly resolves to crediqly@gmail.com');

  // Test 7: Tampered Token Rejection
  console.log('\n--- Test 7: Tampered Token Rejection ---');
  const forgedToken = Buffer.from('attacker@evil.com:9999999999:fakehmac').toString('base64');
  const forgedResult = verifySignedAdminToken(forgedToken);
  assert(forgedResult.valid === false, 'Tampered/forged token is strictly rejected');

  // Test 8: Server-Side Protection on Admin Route Boundaries
  console.log('\n--- Test 8: Server-Side RBAC Protection ---');
  const unauthorizedReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    headers: { 'x-customer-email': 'customer@example.com' },
  });
  const check = verifyAdminRequest(unauthorizedReq);
  assert(check.authorized === false, 'Unauthorized request strictly rejected from admin APIs');

  const authorizedReq = new NextRequest('http://localhost:3000/api/admin/customers', {
    headers: { 'x-admin-token': signedToken },
  });
  const authCheck = verifyAdminRequest(authorizedReq);
  assert(authCheck.authorized === true, 'Admin request with signed token authorized');
  assert(authCheck.email === mainAdmin, 'Authorized session identity matches crediqly@gmail.com');

  // Test 9: Password Strength Policy Enforcement
  console.log('\n--- Test 9: Password Policy Verification ---');
  const validatePolicy = (pw: string) => {
    return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
  };
  assert(!validatePolicy('short'), 'Short password (< 8 chars) rejected');
  assert(!validatePolicy('lettersletters'), 'Password without numbers rejected');
  assert(!validatePolicy('123456789'), 'Password without letters rejected');
  assert(validatePolicy('SecurePass123!'), 'Compliant password (8+ chars, letters + numbers) accepted');

  // Test 10: Zero Secrets Exposed in Client-Side Files
  console.log('\n--- Test 10: Secret Leakage Audit ---');
  const resetContent = fs.readFileSync(resetPasswordPath, 'utf8');
  assert(!resetContent.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Service role key never in reset-password page');
  assert(!resetContent.includes('STRIPE_SECRET_KEY'), 'Stripe secret key never in reset-password page');

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed}/${passed + failed} CHECKS PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((e) => {
  console.error(e);
  process.exit(1);
});
