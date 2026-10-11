import { NextResponse } from 'next/server';
import dns from 'dns/promises';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/status
 * Diagnostic endpoint for inspecting authentication provider health,
 * Supabase project connectivity, DNS resolution, and recovery redirect alignment.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crediqly.vercel.app';

  let hostname = '';
  let projectRef = '';
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      hostname = parsed.hostname;
      projectRef = hostname.split('.')[0] || '';
    } catch (e) {}
  }

  let dnsResolves = false;
  let dnsError: string | null = null;
  let addresses: string[] = [];

  if (hostname) {
    try {
      const result = await dns.lookup(hostname);
      dnsResolves = true;
      addresses = [result.address];
    } catch (err: any) {
      dnsResolves = false;
      dnsError = err?.code || err?.message || 'Host resolution failed';
    }
  }

  // Check HTTP connectivity if DNS resolves
  let httpReachable = false;
  let httpStatus: number | null = null;
  let httpError: string | null = null;

  if (dnsResolves && supabaseUrl) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: anonKey },
        signal: AbortSignal.timeout(3000),
      });
      httpStatus = res.status;
      httpReachable = res.ok || res.status === 200 || res.status === 401; // 401 still means host is alive
    } catch (err: any) {
      httpError = err?.message || 'HTTP request failed';
    }
  }

  const isPaused = !dnsResolves && dnsError === 'ENOTFOUND';

  const diagnostics = {
    timestamp: new Date().toISOString(),
    configured: Boolean(supabaseUrl && anonKey),
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Not configured',
    projectRef,
    hostname,
    dnsResolves,
    dnsAddresses: addresses,
    dnsError,
    httpReachable,
    httpStatus,
    httpError,
    isPaused,
    status: isPaused
      ? 'PAUSED_OR_INACTIVE'
      : dnsResolves && httpReachable
      ? 'ONLINE'
      : 'DEGRADED',
    appUrl,
    recoveryRedirectUrl: `${appUrl}/reset-password`,
    supabaseDashboardUrl: projectRef
      ? `https://supabase.com/dashboard/project/${projectRef}`
      : 'https://supabase.com/dashboard',
    actionRequired: !Boolean(supabaseUrl && anonKey)
      ? 'Supabase environment variables are missing in this environment. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment settings (e.g. Vercel Project Settings > Environment Variables) and redeploy.'
      : isPaused
      ? `Project '${projectRef}' appears to be PAUSED by Supabase due to inactivity. Go to https://supabase.com/dashboard/project/${projectRef} and click 'Resume project' (or Unpause). Once resumed, DNS and database access will be restored.`
      : null,
  };

  return NextResponse.json(diagnostics);
}
