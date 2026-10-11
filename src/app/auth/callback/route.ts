import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /auth/callback
 * Handles Supabase Authentication PKCE code exchange redirects for email verification and password recovery.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/reset-password';
  const type = requestUrl.searchParams.get('type') || '';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!code || !supabaseUrl || !supabaseAnonKey) {
    // If no code, redirect directly to the intended destination or signin
    const redirectUrl = new URL(next, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Create response to allow setting session cookies
  const targetRedirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(targetRedirectUrl);

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.warn('Auth callback exchangeCodeForSession failed:', error.message);
      // Append error parameter to destination so UI can provide helpful feedback
      targetRedirectUrl.searchParams.set('error', 'invalid_code');
      return NextResponse.redirect(targetRedirectUrl);
    }
  } catch (err: any) {
    console.error('Exception in auth callback route:', err);
    targetRedirectUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(targetRedirectUrl);
  }

  return response;
}
