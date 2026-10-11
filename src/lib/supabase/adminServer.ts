import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthoritativeAuthUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt?: string;
  emailConfirmedAt?: string;
  userMetadata: Record<string, any>;
  phone?: string;
}

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Returns a privileged Supabase client configured with the service role key.
 * Strictly used in trusted server-side execution (API routes and server actions).
 * NEVER exposed to client-side code.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedAdminClient) return cachedAdminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}

/**
 * Checks whether the server environment possesses privileged Supabase Service Role credentials.
 */
export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Fetches all registered users directly from the authoritative auth.users table using Supabase Admin Auth API.
 * Handles API pagination so no registered users are omitted, regardless of account volume.
 */
export async function fetchAuthoritativeAuthUsers(): Promise<{
  users: AuthoritativeAuthUser[];
  error?: string;
}> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return {
      users: [],
      error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.',
    };
  }

  const allAuthUsers: AuthoritativeAuthUser[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error('Supabase Auth admin.listUsers error on page', page, error);
        return { users: allAuthUsers, error: error.message };
      }

      if (!data || !data.users || data.users.length === 0) {
        hasMore = false;
        break;
      }

      for (const u of data.users) {
        allAuthUsers.push({
          id: u.id,
          email: u.email || '',
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at || undefined,
          emailConfirmedAt: u.email_confirmed_at || undefined,
          userMetadata: (u.user_metadata as Record<string, any>) || {},
          phone: u.phone || undefined,
        });
      }

      if (data.users.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return { users: allAuthUsers };
  } catch (err: any) {
    console.error('Fatal error fetching authoritative auth.users:', err);
    return { users: allAuthUsers, error: err.message || 'Failed to list auth users.' };
  }
}

/**
 * Privileged multi-table database query bypassing PostgreSQL Row Level Security on the server.
 */
export async function fetchPrivilegedDatabaseTables(): Promise<{
  profiles: any[];
  businesses: any[];
  scores: any[];
  subscriptions: any[];
  consultations: any[];
  fundingApps: any[];
  payments: any[];
  error?: string;
} | null> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return null;

  try {
    const [
      { data: profiles, error: pError },
      { data: businesses, error: bError },
      { data: scores, error: sError },
      { data: subscriptions, error: subError },
      { data: consultations, error: cError },
      { data: fundingApps, error: aError },
      { data: payments, error: payError },
    ] = await Promise.all([
      adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
      adminClient.from('businesses').select('*'),
      adminClient.from('readiness_scores').select('*'),
      adminClient.from('subscriptions').select('*'),
      adminClient.from('consultations').select('*').order('created_at', { ascending: false }),
      adminClient.from('funding_applications').select('*'),
      adminClient.from('payments').select('*').order('created_at', { ascending: false }),
    ]);

    if (pError) console.warn('Privileged profiles query warning:', pError.message);
    if (bError) console.warn('Privileged businesses query warning:', bError.message);
    if (subError) console.warn('Privileged subscriptions query warning:', subError.message);

    return {
      profiles: profiles || [],
      businesses: businesses || [],
      scores: scores || [],
      subscriptions: subscriptions || [],
      consultations: consultations || [],
      fundingApps: fundingApps || [],
      payments: payments || [],
    };
  } catch (err: any) {
    console.error('Error executing privileged database queries:', err);
    return null;
  }
}

/**
 * Idempotently reconciles and creates a missing profile record in public.profiles.
 */
export async function reconcileMissingProfileRecord(user: AuthoritativeAuthUser): Promise<boolean> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return false;

  const rawName =
    user.userMetadata.name ||
    user.userMetadata.full_name ||
    `${user.userMetadata.first_name || ''} ${user.userMetadata.last_name || ''}`.trim();
  
  const firstName =
    user.userMetadata.first_name ||
    (rawName ? rawName.split(' ')[0] : user.email.split('@')[0]) ||
    'User';
  
  const lastName =
    user.userMetadata.last_name ||
    (rawName ? rawName.split(' ').slice(1).join(' ') : '') ||
    '';

  const role =
    user.email.toLowerCase() === 'crediqly@gmail.com' ||
    user.email.toLowerCase() === 'raselandahmed@gmail.com' ||
    user.email.toLowerCase() === 'founder@crediqly.com'
      ? 'admin'
      : 'user';

  try {
    const { error } = await adminClient.from('profiles').upsert(
      {
        user_id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.warn('Could not auto-reconcile profile for user', user.id, error.message);
      return false;
    }

    return true;
  } catch (e) {
    console.warn('Exception during profile auto-reconcile:', e);
    return false;
  }
}
