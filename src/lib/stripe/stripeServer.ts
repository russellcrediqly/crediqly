import Stripe from 'stripe';
import { loadPersistentStripeConfig } from './stripeConfigStorage';

let cachedStripe: Stripe | null = null;
let cachedKey = '';

export function cleanKey(val?: string): string {
  return (val || '').trim().replace(/^["']|["']$/g, '');
}

export function getStripeClient(): Stripe | null {
  const secret = cleanKey(process.env.STRIPE_SECRET_KEY);
  if (!secret || !secret.startsWith('sk_')) {
    cachedStripe = null;
    cachedKey = '';
    return null;
  }
  if (cachedStripe && cachedKey === secret) {
    return cachedStripe;
  }
  cachedKey = secret;
  cachedStripe = new Stripe(secret, {
    apiVersion: '2024-11-20.acacia' as any,
    typescript: true,
    timeout: 20000,
    maxNetworkRetries: 2,
    appInfo: {
      name: 'Crediqly Commercial Credit Platform',
      version: '1.0.0',
    },
  });
  return cachedStripe;
}

export let isStripeConfigured = Boolean(
  cleanKey(process.env.STRIPE_SECRET_KEY).startsWith('sk_')
);

export function refreshStripeConfig() {
  const secret = cleanKey(process.env.STRIPE_SECRET_KEY);
  isStripeConfigured = Boolean(secret && secret.startsWith('sk_'));
  cachedStripe = null;
  cachedKey = '';
}

/**
 * Synchronize runtime process.env with the authoritative persistent configuration (Supabase / server storage)
 */
export async function syncStripeConfigFromStorage(userAccessToken?: string) {
  try {
    const { config, supabaseTableFound } = await loadPersistentStripeConfig(userAccessToken);
    if (config.publishableKey) {
      const pubKeyName = ['NEXT', 'PUBLIC', 'STRIPE', 'PUBLISHABLE', 'KEY'].join('_');
      (process.env as any)[pubKeyName] = config.publishableKey;
    }
    if (config.secretKey) process.env.STRIPE_SECRET_KEY = config.secretKey;
    if (config.webhookSecret) process.env.STRIPE_WEBHOOK_SECRET = config.webhookSecret;
    if (config.proPriceId) process.env.STRIPE_PRO_PRICE_ID = config.proPriceId;
    if (config.advisorySetupPriceId) process.env.STRIPE_ADVISORY_SETUP_PRICE_ID = config.advisorySetupPriceId;
    if (config.advisoryMonthlyPriceId) process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID = config.advisoryMonthlyPriceId;
    refreshStripeConfig();
    return { config, supabaseTableFound };
  } catch (e) {
    refreshStripeConfig();
    return null;
  }
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient();
    if (!client) return undefined;
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export const STRIPE_CONFIG = {
  get proPriceId() {
    return cleanKey(process.env.STRIPE_PRO_PRICE_ID);
  },
  get consultationPriceId() {
    return cleanKey(process.env.STRIPE_CONSULTATION_PRICE_ID);
  },
  get advisorySetupPriceId() {
    return cleanKey(process.env.STRIPE_ADVISORY_SETUP_PRICE_ID);
  },
  get advisoryMonthlyPriceId() {
    return cleanKey(process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID);
  },
  get webhookSecret() {
    return cleanKey(process.env.STRIPE_WEBHOOK_SECRET);
  },
  proPriceCents: 3900, // $39.00
  consultationPriceCents: 9900, // $99.00
  advisorySetupPriceCents: 49900, // $499.00 one-time setup
  advisoryMonthlyPriceCents: 14900, // $149.00/month recurring
};

/**
 * Returns the base application URL for Stripe Checkout return / cancel URLs.
 */
export function getAppBaseUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    if (host) {
      return `${proto}://${host}`;
    }
  }
  return 'http://localhost:3000';
}
