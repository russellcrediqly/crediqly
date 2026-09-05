import { NextRequest } from 'next/server';

/**
 * Server-side Admin Role Verification
 * 
 * Verifies if a request or user is authorized as an administrator.
 */

// Dedicated administrator accounts
export const ADMIN_EMAILS = [
  'crediqly@gmail.com',
  'founder@crediqly.com',
  'admin@crediqly.com',
];

/**
 * Checks if a given email is a recognized administrator email
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Verifies if an incoming NextRequest possesses admin credentials.
 * Checks for Supabase auth cookies, authorization headers, or dev session markers.
 */
export function verifyAdminRequest(request: NextRequest): {
  authorized: boolean;
  email?: string;
  reason?: string;
} {
  // 1. Check Authorization Bearer token or custom Admin header
  const adminSecret = process.env.ADMIN_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const customAdminHeader = request.headers.get('x-admin-key');

  if (customAdminHeader && adminSecret && customAdminHeader === adminSecret) {
    return { authorized: true, email: 'system@crediqly.com' };
  }

  // 2. Inspect Supabase authentication cookie
  // Supabase stores access tokens in cookies like sb-<project-ref>-auth-token
  const cookies = request.cookies.getAll();
  const authCookie = cookies.find((c) => c.name.includes('auth-token') || c.name.includes('supabase'));

  // In production with Supabase, if auth cookie exists, we parse or inspect the JWT payload
  if (authCookie && authCookie.value) {
    try {
      let rawVal = authCookie.value;
      if (rawVal.startsWith('base64-')) {
        rawVal = Buffer.from(rawVal.substring(7), 'base64').toString('utf8');
      }
      // Check if raw value contains admin email
      for (const adminEmail of ADMIN_EMAILS) {
        if (rawVal.toLowerCase().includes(adminEmail)) {
          return { authorized: true, email: adminEmail };
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // 3. Check dev admin cookie for local sandbox environment
  const devAdminCookie = request.cookies.get('crediqly_dev_admin');
  if (devAdminCookie && devAdminCookie.value === 'true') {
    return { authorized: true, email: 'crediqly@gmail.com' };
  }

  return { authorized: false, reason: 'Unauthorized admin access attempt' };
}
