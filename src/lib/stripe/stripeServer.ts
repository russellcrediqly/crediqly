import Stripe from 'stripe';

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
  // Plan 2: Foundation ($47.99/mo recurring)
  get foundationPriceId() {
    return cleanKey(process.env.STRIPE_FOUNDATION_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID);
  },
  // Plan 3: Guided Monthly ($147.99/mo recurring)
  get guidedPriceId() {
    return cleanKey(process.env.STRIPE_GUIDED_PRICE_ID || process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID);
  },
  // Plan 3: Guided 12-Month Program ($997 one-time payment)
  get guidedOneTimePriceId() {
    return cleanKey(process.env.STRIPE_GUIDED_ONETIME_PRICE_ID || process.env.STRIPE_INTENSIVE_PRICE_ID);
  },
  // Legacy / compatibility alias for 12-month Guided program
  get intensivePriceId() {
    return cleanKey(process.env.STRIPE_GUIDED_ONETIME_PRICE_ID || process.env.STRIPE_INTENSIVE_PRICE_ID);
  },
  // Legacy price ID accessors maintained for backward compatibility
  get proPriceId() {
    return cleanKey(process.env.STRIPE_FOUNDATION_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID);
  },
  get consultationPriceId() {
    return cleanKey(process.env.STRIPE_CONSULTATION_PRICE_ID);
  },
  get advisorySetupPriceId() {
    return cleanKey(process.env.STRIPE_ADVISORY_SETUP_PRICE_ID);
  },
  get advisoryMonthlyPriceId() {
    return cleanKey(process.env.STRIPE_GUIDED_PRICE_ID || process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID);
  },
  get webhookSecret() {
    return cleanKey(process.env.STRIPE_WEBHOOK_SECRET);
  },

  // Authoritative approved price amounts in cents
  foundationPriceCents: 4799, // $47.99/month recurring
  guidedPriceCents: 14799, // $147.99/month recurring
  guidedOneTimePriceCents: 99700, // $997.00 one-time (12-month program)
  intensivePriceCents: 99700, // $997.00 compatibility alias

  // Legacy cents aliases
  proPriceCents: 4799, // $47.99
  consultationPriceCents: 9900, // $99.00
  advisorySetupPriceCents: 49900, // $499.00
  advisoryMonthlyPriceCents: 14799, // $147.99
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
