import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSignedAdminToken, verifyAdminRequest, isAuthorizedAdminEmail } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * GET/POST /api/admin/token
 * Returns or sets a cryptographically signed admin session token for authorized owner accounts.
 */
export async function GET(req: NextRequest) {
  return handleTokenRequest(req);
}

export async function POST(req: NextRequest) {
  return handleTokenRequest(req);
}

async function handleTokenRequest(req: NextRequest) {
  // 1. Check existing verified admin session (cookie, admin key, signed token)
  const verification = verifyAdminRequest(req);
  let adminEmail = verification.email;

  // 2. Check Supabase bearer token / session JWT if provided
  if (!adminEmail) {
    const authHeader = req.headers.get('authorization') || req.headers.get('x-supabase-auth');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = authHeader.substring(7).trim();
      try {
        const { getSupabaseAdminClient } = await import('@/lib/supabase/adminServer');
        const supabaseAdmin = getSupabaseAdminClient();
        if (supabaseAdmin) {
          const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);
          if (user?.email && isAuthorizedAdminEmail(user.email)) {
            adminEmail = user.email.toLowerCase();
          }
        }
      } catch (e) {}
    }
  }

  // 3. Check crediqly_admin_email cookie
  if (!adminEmail) {
    const adminCookie = req.cookies.get('crediqly_admin_email');
    if (adminCookie?.value && isAuthorizedAdminEmail(decodeURIComponent(adminCookie.value))) {
      adminEmail = decodeURIComponent(adminCookie.value).toLowerCase();
    }
  }

  // 4. Check verified admin email header or body (must be in AUTHORIZED_ADMIN_EMAILS list)
  if (!adminEmail) {
    const headerEmail = req.headers.get('x-admin-email');
    if (headerEmail && isAuthorizedAdminEmail(headerEmail)) {
      adminEmail = headerEmail.toLowerCase();
    }

    if (!adminEmail) {
      try {
        const body = await req.json().catch(() => ({}));
        if (body?.email && isAuthorizedAdminEmail(body.email)) {
          adminEmail = body.email.toLowerCase();
        }
      } catch (e) {}
    }
  }

  if (!adminEmail || !isAuthorizedAdminEmail(adminEmail)) {
    return NextResponse.json(
      { error: 'Forbidden: Valid administrator credentials required.', code: 'ADMIN_UNAUTHORIZED' },
      { status: 403 }
    );
  }

  const token = createSignedAdminToken(adminEmail);
  const response = NextResponse.json({
    success: true,
    token,
    email: adminEmail,
  });

  // Set signed token cookie (24 hour expiration)
  response.cookies.set('crediqly_admin_token', token, {
    path: '/',
    maxAge: 86400,
    httpOnly: false, // Accessible to client for header injection
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
