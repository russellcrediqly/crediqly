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
  // Plan 2: Foundation ($39.99/mo promotional offer, $49.99/mo regular)
  get foundationPriceId() {
    return cleanKey(process.env.STRIPE_FOUNDATION_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID);
  },
  // Plan 3: Guided ($149.99/mo promotional offer, $199.99/mo regular)
  get guidedPriceId() {
    return cleanKey(process.env.STRIPE_GUIDED_PRICE_ID || process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID);
  },
  // Premium Service: Funding Readiness Intensive ($999 one-time)
  get intensivePriceId() {
    return cleanKey(process.env.STRIPE_INTENSIVE_PRICE_ID);
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

  // Authoritative price amounts in cents
  foundationPriceCents: 3999, // $39.99/month promotional/current offer
  foundationRegularPriceCents: 4999, // $49.99/month regular/reference
  guidedPriceCents: 14999, // $149.99/month promotional/current offer
  guidedRegularPriceCents: 19999, // $199.99/month regular/reference
  intensivePriceCents: 99900, // $999.00 one-time payment

  // Legacy cents aliases
  proPriceCents: 3999, // $39.99
  consultationPriceCents: 9900, // $99.00
  advisorySetupPriceCents: 49900, // $499.00
  advisoryMonthlyPriceCents: 14999, // $149.99
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
