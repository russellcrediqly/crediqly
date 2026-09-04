import Stripe from 'stripe';

let cachedStripe: Stripe | null = null;
let cachedKey = '';

export function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY || '';
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
    appInfo: {
      name: 'Crediqly Commercial Credit Platform',
      version: '1.0.0',
    },
  });
  return cachedStripe;
}

export let isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')
);

export function refreshStripeConfig() {
  const secret = process.env.STRIPE_SECRET_KEY || '';
  isStripeConfigured = Boolean(secret && secret.startsWith('sk_'));
  cachedStripe = null;
  cachedKey = '';
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
    return process.env.STRIPE_PRO_PRICE_ID || '';
  },
  get consultationPriceId() {
    return process.env.STRIPE_CONSULTATION_PRICE_ID || '';
  },
  get advisorySetupPriceId() {
    return process.env.STRIPE_ADVISORY_SETUP_PRICE_ID || '';
  },
  get advisoryMonthlyPriceId() {
    return process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID || '';
  },
  get webhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
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
