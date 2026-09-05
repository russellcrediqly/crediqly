import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

export interface StripePersistentConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  proPriceId: string;
  advisorySetupPriceId: string;
  advisoryMonthlyPriceId: string;
  mode: 'test' | 'live' | 'inconsistent' | 'unconfigured';
  configured: boolean;
  lastVerifiedAt?: string;
  lastVerificationStatus?: string;
  lastError?: string;
  storageBackend: 'supabase_database' | 'server_file' | 'environment_variables';
  updatedAt: string;
}

export interface StripeSafeClientConfig {
  publishableKey: string;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  maskedSecretKey: string;
  hasWebhookSecret: boolean;
  maskedWebhookSecret: string;
  proPriceId: string;
  advisorySetupPriceId: string;
  advisoryMonthlyPriceId: string;
  mode: 'test' | 'live' | 'inconsistent' | 'unconfigured';
  configured: boolean;
  lastVerifiedAt?: string;
  lastVerificationStatus?: string;
  storageBackend: 'supabase_database' | 'server_file' | 'environment_variables';
  supabaseTableFound: boolean;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// 1. SERVER-SIDE AES-256-GCM ENCRYPTION FOR SENSITIVE TOKENS
// -----------------------------------------------------------------------------
function getMasterEncryptionKey(): Buffer {
  const seed =
    process.env.STRIPE_ENCRYPTION_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'crediqly_default_secure_vault_seed_32';
  return crypto.createHash('sha256').update(seed).digest(); // 32 bytes for aes-256
}

export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getMasterEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    console.error('Failed to encrypt Stripe secret:', err);
    return '';
  }
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText) return '';
  if (!cipherText.includes(':')) return cipherText; // Return as-is if unencrypted baseline
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;
    const [ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterEncryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Failed to decrypt Stripe secret:', err);
    return '';
  }
}

export function maskSecret(secret?: string, prefix = 'sk_'): string {
  if (!secret) return '';
  const clean = secret.trim();
  if (clean.length <= 10) return 'Configured ✓';
  const start = clean.slice(0, Math.min(prefix.length + 5, 8));
  const end = clean.slice(-4);
  return `${start}••••••••${end}`;
}

export function cleanString(val?: string): string {
  return (val || '').trim().replace(/^["']|["']$/g, '');
}

// -----------------------------------------------------------------------------
// 2. SERVER FILE PERSISTENCE (Tier 2 local/filesystem store)
// -----------------------------------------------------------------------------
const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'stripe-config.json');

function readLocalConfigFile(): Partial<StripePersistentConfig> | null {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        publishableKey: cleanString(parsed.publishableKey),
        secretKey: decryptSecret(parsed.encryptedSecretKey || parsed.secretKey || ''),
        webhookSecret: decryptSecret(parsed.encryptedWebhookSecret || parsed.webhookSecret || ''),
        proPriceId: cleanString(parsed.proPriceId),
        advisorySetupPriceId: cleanString(parsed.advisorySetupPriceId),
        advisoryMonthlyPriceId: cleanString(parsed.advisoryMonthlyPriceId),
        mode: parsed.mode,
        configured: Boolean(parsed.configured),
        lastVerifiedAt: parsed.lastVerifiedAt,
        lastVerificationStatus: parsed.lastVerificationStatus,
        lastError: parsed.lastError,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (e) {
    // Ignore if not readable
  }
  return null;
}

function writeLocalConfigFile(config: Partial<StripePersistentConfig>): boolean {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dataToStore = {
      publishableKey: config.publishableKey || '',
      encryptedSecretKey: encryptSecret(config.secretKey || ''),
      encryptedWebhookSecret: encryptSecret(config.webhookSecret || ''),
      proPriceId: config.proPriceId || '',
      advisorySetupPriceId: config.advisorySetupPriceId || '',
      advisoryMonthlyPriceId: config.advisoryMonthlyPriceId || '',
      mode: config.mode,
      configured: config.configured,
      lastVerifiedAt: config.lastVerifiedAt,
      lastVerificationStatus: config.lastVerificationStatus,
      lastError: config.lastError,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(dataToStore, null, 2), 'utf8');
    return true;
  } catch (e) {
    // Read-only filesystem in Vercel - safely handled
    return false;
  }
}

// -----------------------------------------------------------------------------
// 3. LOAD PERSISTENT CONFIGURATION (Tier 1 Supabase DB -> Tier 2 File -> Tier 3 Env)
// -----------------------------------------------------------------------------
let inMemoryCache: StripePersistentConfig | null = null;
let lastCacheTime = 0;

export async function loadPersistentStripeConfig(userAccessToken?: string): Promise<{
  config: StripePersistentConfig;
  supabaseTableFound: boolean;
}> {
  // 1. Check in-memory cache (valid for 5 seconds to reduce DB pressure)
  const now = Date.now();
  if (inMemoryCache && now - lastCacheTime < 5000) {
    return { config: inMemoryCache, supabaseTableFound: true };
  }

  let dbFound = false;
  let dbRecord: any = null;

  // 2. Query Supabase stripe_configuration table
  if (isSupabaseConfigured) {
    try {
      // Use authenticated client if token provided, otherwise standard client
      const client = userAccessToken
        ? createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${userAccessToken}` } } }
          )
        : supabase;

      if (client) {
        const { data, error } = await client
          .from('stripe_configuration')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (!error && data) {
          dbFound = true;
          dbRecord = data;
        } else if (!error && data === null) {
          dbFound = true; // Table exists, row empty
        } else if (error && error.code !== 'PGRST205') {
          // Table exists but RLS or other condition
          dbFound = true;
        }
      }
    } catch (err) {
      console.warn('Notice: Could not query Supabase stripe_configuration table:', err);
    }
  }

  // 3. Query Tier 2 local file
  const fileRecord = readLocalConfigFile();

  // 4. Query Tier 3 environment variables
  const envPub = cleanString(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const envSec = cleanString(process.env.STRIPE_SECRET_KEY);
  const envWh = cleanString(process.env.STRIPE_WEBHOOK_SECRET);
  const envPro = cleanString(process.env.STRIPE_PRO_PRICE_ID);
  const envSetup = cleanString(process.env.STRIPE_ADVISORY_SETUP_PRICE_ID);
  const envMonthly = cleanString(process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID);

  // Merge with precedence: Database > File > Environment Variables
  const publishableKey =
    cleanString(dbRecord?.publishable_key) ||
    cleanString(fileRecord?.publishableKey) ||
    envPub;

  const secretKey =
    decryptSecret(dbRecord?.encrypted_secret_key || '') ||
    fileRecord?.secretKey ||
    envSec;

  const webhookSecret =
    decryptSecret(dbRecord?.encrypted_webhook_secret || '') ||
    fileRecord?.webhookSecret ||
    envWh;

  const proPriceId =
    cleanString(dbRecord?.pro_price_id) ||
    cleanString(fileRecord?.proPriceId) ||
    envPro;

  const advisorySetupPriceId =
    cleanString(dbRecord?.advisory_setup_price_id) ||
    cleanString(fileRecord?.advisorySetupPriceId) ||
    envSetup;

  const advisoryMonthlyPriceId =
    cleanString(dbRecord?.advisory_monthly_price_id) ||
    cleanString(fileRecord?.advisoryMonthlyPriceId) ||
    envMonthly;

  // Determine mode
  const isTest = secretKey.startsWith('sk_test_');
  const isLive = secretKey.startsWith('sk_live_');
  const isPubTest = publishableKey.startsWith('pk_test_');
  const isPubLive = publishableKey.startsWith('pk_live_');

  let mode: 'test' | 'live' | 'inconsistent' | 'unconfigured' = 'unconfigured';
  if (isTest && (isPubTest || !publishableKey)) {
    mode = 'test';
  } else if (isLive && (isPubLive || !publishableKey)) {
    mode = 'live';
  } else if (secretKey && publishableKey && ((isTest && isPubLive) || (isLive && isPubTest))) {
    mode = 'inconsistent';
  }

  const configured = Boolean(
    secretKey &&
    secretKey.startsWith('sk_') &&
    mode !== 'inconsistent'
  );

  let storageBackend: 'supabase_database' | 'server_file' | 'environment_variables' = 'environment_variables';
  if (dbRecord && (dbRecord.publishable_key || dbRecord.encrypted_secret_key || dbRecord.pro_price_id)) {
    storageBackend = 'supabase_database';
  } else if (fileRecord && (fileRecord.publishableKey || fileRecord.secretKey || fileRecord.proPriceId)) {
    storageBackend = 'server_file';
  }

  const resolvedConfig: StripePersistentConfig = {
    publishableKey,
    secretKey,
    webhookSecret,
    proPriceId,
    advisorySetupPriceId,
    advisoryMonthlyPriceId,
    mode,
    configured,
    lastVerifiedAt: dbRecord?.last_verified_at || fileRecord?.lastVerifiedAt,
    lastVerificationStatus: dbRecord?.last_verification_status || fileRecord?.lastVerificationStatus,
    lastError: dbRecord?.last_error || fileRecord?.lastError,
    storageBackend,
    updatedAt: dbRecord?.updated_at || fileRecord?.updatedAt || new Date().toISOString(),
  };

  inMemoryCache = resolvedConfig;
  lastCacheTime = now;

  return { config: resolvedConfig, supabaseTableFound: dbFound };
}

// -----------------------------------------------------------------------------
// 4. SAVE PERSISTENT CONFIGURATION
// -----------------------------------------------------------------------------
export async function savePersistentStripeConfig(
  updates: {
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    proPriceId?: string;
    advisorySetupPriceId?: string;
    advisoryMonthlyPriceId?: string;
    mode?: 'test' | 'live';
    lastVerificationStatus?: string;
    lastError?: string;
  },
  userAccessToken?: string
): Promise<{
  success: boolean;
  persistedDb: boolean;
  persistedFile: boolean;
  storageBackend: 'supabase_database' | 'server_file';
  message: string;
}> {
  // 1. Load current configuration so we preserve existing values if inputs are omitted/empty
  const { config: current } = await loadPersistentStripeConfig(userAccessToken);

  const cleanPub = cleanString(updates.publishableKey) || current.publishableKey;
  const cleanSec = cleanString(updates.secretKey) || current.secretKey;
  const cleanWh = cleanString(updates.webhookSecret) || current.webhookSecret;
  const cleanPro = cleanString(updates.proPriceId) || current.proPriceId;
  const cleanSetup = cleanString(updates.advisorySetupPriceId) || current.advisorySetupPriceId;
  const cleanMonthly = cleanString(updates.advisoryMonthlyPriceId) || current.advisoryMonthlyPriceId;

  const isTest = cleanSec.startsWith('sk_test_');
  const isLive = cleanSec.startsWith('sk_live_');
  const mode = isLive ? 'live' : 'test';

  let persistedDb = false;
  let persistedFile = false;

  // 2. Persist to Supabase Database Table
  if (isSupabaseConfigured) {
    try {
      const client = userAccessToken
        ? createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${userAccessToken}` } } }
          )
        : supabase;

      if (client) {
        const payload: any = {
          id: 'default',
          publishable_key: cleanPub,
          encrypted_secret_key: encryptSecret(cleanSec),
          encrypted_webhook_secret: encryptSecret(cleanWh),
          pro_price_id: cleanPro,
          advisory_setup_price_id: cleanSetup,
          advisory_monthly_price_id: cleanMonthly,
          mode,
          configured: Boolean(cleanSec && cleanSec.startsWith('sk_')),
          last_verified_at: new Date().toISOString(),
          last_verification_status: updates.lastVerificationStatus || 'verified',
          last_error: updates.lastError || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await client
          .from('stripe_configuration')
          .upsert(payload, { onConflict: 'id' });

        if (!error) {
          persistedDb = true;
        } else {
          console.warn('Supabase stripe_configuration upsert error:', error.message);
        }
      }
    } catch (dbErr: any) {
      console.warn('Supabase DB persistence error:', dbErr.message);
    }
  }

  // 3. Persist to local JSON file
  persistedFile = writeLocalConfigFile({
    publishableKey: cleanPub,
    secretKey: cleanSec,
    webhookSecret: cleanWh,
    proPriceId: cleanPro,
    advisorySetupPriceId: cleanSetup,
    advisoryMonthlyPriceId: cleanMonthly,
    mode,
    configured: Boolean(cleanSec && cleanSec.startsWith('sk_')),
    lastVerifiedAt: new Date().toISOString(),
    lastVerificationStatus: updates.lastVerificationStatus || 'verified',
    lastError: updates.lastError,
  });

  // 4. Update runtime process.env
  if (cleanPub) {
    const pubKeyName = ['NEXT', 'PUBLIC', 'STRIPE', 'PUBLISHABLE', 'KEY'].join('_');
    (process.env as any)[pubKeyName] = cleanPub;
  }
  if (cleanSec) process.env.STRIPE_SECRET_KEY = cleanSec;
  if (cleanWh) process.env.STRIPE_WEBHOOK_SECRET = cleanWh;
  if (cleanPro) process.env.STRIPE_PRO_PRICE_ID = cleanPro;
  if (cleanSetup) process.env.STRIPE_ADVISORY_SETUP_PRICE_ID = cleanSetup;
  if (cleanMonthly) process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID = cleanMonthly;

  // Invalidate in-memory cache so next read fetches fresh data
  inMemoryCache = null;

  const storageBackend = persistedDb ? 'supabase_database' : 'server_file';
  const success = persistedDb || persistedFile;

  return {
    success,
    persistedDb,
    persistedFile,
    storageBackend,
    message: persistedDb
      ? 'Stripe configuration permanently stored in Supabase database.'
      : persistedFile
      ? 'Stripe configuration stored in persistent server file storage.'
      : 'Stripe configuration active in runtime.',
  };
}

// -----------------------------------------------------------------------------
// 5. SERVER-SIDE ADMIN AUTHORIZATION VERIFICATION
// -----------------------------------------------------------------------------
export async function verifyAdminRequest(req: Request): Promise<{
  authorized: boolean;
  userId?: string;
  error?: string;
}> {
  // Extract bearer token from Authorization header
  const authHeader = req.headers.get('authorization') || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // Extract from cookie if not in header
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/sb-([a-zA-Z0-9_-]+)-auth-token=([^;]+)/);
    if (match && match[2]) {
      try {
        const decoded = decodeURIComponent(match[2]);
        const parsed = JSON.parse(decoded);
        token = parsed[0] || parsed.access_token || '';
      } catch (e) {
        // Ignore cookie parsing error
      }
    }
  }

  // If Supabase is configured, verify token and check role = 'admin'
  if (isSupabaseConfigured && token) {
    try {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data: userData, error: userError } = await client.auth.getUser(token);
      if (userError || !userData?.user) {
        return { authorized: false, error: 'Invalid or expired session. Please log in again.' };
      }

      const userId = userData.user.id;

      // Check role in profiles table
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile?.role === 'admin') {
        return { authorized: true, userId };
      }

      return { authorized: false, error: 'Forbidden. Administrator privileges required.' };
    } catch (e: any) {
      console.warn('Admin token verification error:', e.message);
    }
  }

  // Local development / loopback fallback: allow authorization for localhost requests
  // or non-production environments. Outside callers on production domains must authenticate.
  const host = req.headers.get('host') || '';
  const isLoopback = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  if (isLoopback || process.env.NODE_ENV !== 'production') {
    return { authorized: true, userId: 'local-admin' };
  }

  return { authorized: false, error: 'Authentication required. Please log in as an administrator.' };
}
