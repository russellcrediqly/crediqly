import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware
 * 
 * Explicitly allows Stripe Webhook requests to pass through without any
 * session, authentication, or redirection interference.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Unconditionally bypass any middleware processing for the Stripe webhook endpoint
  if (pathname.startsWith('/api/stripe/webhook')) {
    return NextResponse.next();
  }

  // 2. Continue with normal request processing for other routes
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
