import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

/**
 * Next.js Edge Middleware
 * 
 * 1. Explicitly allows Stripe Webhook requests to pass through without interference.
 * 2. Protects Admin API endpoints and administrative boundaries server-side.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Unconditionally bypass any middleware processing for the Stripe webhook endpoint
  if (pathname.startsWith('/api/stripe/webhook')) {
    return NextResponse.next();
  }

  // 2. Server-side Protection for Admin API Endpoints
  if (pathname.startsWith('/api/admin')) {
    const verification = verifyAdminRequest(request);
    if (!verification.authorized) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator credentials required.', code: 'ADMIN_UNAUTHORIZED' },
        { status: 403 }
      );
    }
  }

  // 3. Continue with normal request processing for other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/stripe/webhook (Stripe webhook endpoint)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     * - /public assets (images, icons, etc.)
     */
    '/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
};
