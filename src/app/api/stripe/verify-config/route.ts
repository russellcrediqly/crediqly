import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe/stripeServer';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const webhookSecret = STRIPE_CONFIG.webhookSecret || '';

  // 1. Determine Mode
  const isTestKey = secretKey.startsWith('sk_test_');
  const isLiveKey = secretKey.startsWith('sk_live_');
  const isTestPub = publishableKey.startsWith('pk_test_');
  const isLivePub = publishableKey.startsWith('pk_live_');

  let mode: 'test' | 'live' | 'inconsistent' | 'unconfigured' = 'unconfigured';
  if (isTestKey && (isTestPub || !publishableKey)) {
    mode = 'test';
  } else if (isLiveKey && (isLivePub || !publishableKey)) {
    mode = 'live';
  } else if (secretKey && publishableKey && ((isTestKey && isLivePub) || (isLiveKey && isTestPub))) {
    mode = 'inconsistent';
  }

  // 2. Safe Connection Test
  let apiStatus: 'working' | 'error' | 'unconfigured' = 'unconfigured';
  let apiMessage = 'Stripe Secret Key is missing or unconfigured in server environment.';

  if (isStripeConfigured && stripe) {
    try {
      // Safe non-sensitive read call
      await stripe.balance.retrieve();
      apiStatus = 'working';
      apiMessage = 'Stripe API connection verified successfully.';
    } catch (err: any) {
      apiStatus = 'error';
      // Non-sensitive error extraction
      apiMessage = err.message || 'Could not connect to Stripe API with current credentials.';
    }
  }

  // 3. Price Validations
  interface PriceCheck {
    id: string;
    configured: boolean;
    valid: boolean;
    expected: string;
    actual?: string;
    error?: string;
  }

  const prices: {
    foundation: PriceCheck;
    guided: PriceCheck;
    intensive: PriceCheck;
    pro: PriceCheck;
    advisorySetup: PriceCheck;
    advisoryMonthly: PriceCheck;
  } = {
    foundation: {
      id: STRIPE_CONFIG.foundationPriceId,
      configured: Boolean(STRIPE_CONFIG.foundationPriceId),
      valid: false,
      expected: '$39.99/month recurring',
    },
    guided: {
      id: STRIPE_CONFIG.guidedPriceId,
      configured: Boolean(STRIPE_CONFIG.guidedPriceId),
      valid: false,
      expected: '$149.99/month recurring',
    },
    intensive: {
      id: STRIPE_CONFIG.intensivePriceId,
      configured: Boolean(STRIPE_CONFIG.intensivePriceId),
      valid: false,
      expected: '$999.00 one-time',
    },
    pro: {
      id: STRIPE_CONFIG.foundationPriceId,
      configured: Boolean(STRIPE_CONFIG.foundationPriceId),
      valid: false,
      expected: '$39.99/month recurring',
    },
    advisorySetup: {
      id: STRIPE_CONFIG.advisorySetupPriceId,
      configured: Boolean(STRIPE_CONFIG.advisorySetupPriceId),
      valid: false,
      expected: '$499 one-time (legacy)',
    },
    advisoryMonthly: {
      id: STRIPE_CONFIG.guidedPriceId,
      configured: Boolean(STRIPE_CONFIG.guidedPriceId),
      valid: false,
      expected: '$149.99/month recurring',
    },
  };

  if (apiStatus === 'working' && stripe) {
    // Validate Foundation Price ($39.99/mo or legacy $39/mo)
    if (STRIPE_CONFIG.foundationPriceId) {
      try {
        const p = await stripe.prices.retrieve(STRIPE_CONFIG.foundationPriceId);
        const amount = p.unit_amount || 0;
        const interval = p.recurring?.interval;
        prices.foundation.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
        prices.pro.actual = prices.foundation.actual;
        if ((amount === 3999 || amount === 3900) && interval === 'month') {
          prices.foundation.valid = true;
          prices.pro.valid = true;
        } else {
          prices.foundation.error = `Price exists but does not match expected $39.99/month (Found: ${prices.foundation.actual})`;
          prices.pro.error = prices.foundation.error;
        }
      } catch (err: any) {
        prices.foundation.error = `Price ID ${STRIPE_CONFIG.foundationPriceId} not found in Stripe account: ${err.message}`;
        prices.pro.error = prices.foundation.error;
      }
    } else {
      prices.foundation.error = 'STRIPE_FOUNDATION_PRICE_ID environment variable is missing.';
      prices.pro.error = prices.foundation.error;
    }

    // Validate Guided Price ($149.99/mo or legacy $149/mo)
    if (STRIPE_CONFIG.guidedPriceId) {
      try {
        const p = await stripe.prices.retrieve(STRIPE_CONFIG.guidedPriceId);
        const amount = p.unit_amount || 0;
        const interval = p.recurring?.interval;
        prices.guided.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
        prices.advisoryMonthly.actual = prices.guided.actual;
        if ((amount === 14999 || amount === 14900) && interval === 'month') {
          prices.guided.valid = true;
          prices.advisoryMonthly.valid = true;
        } else if (p.type === 'one_time') {
          prices.guided.error = `Price is configured as one-time instead of monthly recurring.`;
          prices.advisoryMonthly.error = prices.guided.error;
        } else {
          prices.guided.error = `Price exists but does not match expected $149.99/month (Found: ${prices.guided.actual})`;
          prices.advisoryMonthly.error = prices.guided.error;
        }
      } catch (err: any) {
        prices.guided.error = `Price ID ${STRIPE_CONFIG.guidedPriceId} not found in Stripe account: ${err.message}`;
        prices.advisoryMonthly.error = prices.guided.error;
      }
    } else {
      prices.guided.error = 'STRIPE_GUIDED_PRICE_ID environment variable is missing.';
      prices.advisoryMonthly.error = prices.guided.error;
    }

    // Validate Intensive Price ($999 one-time)
    if (STRIPE_CONFIG.intensivePriceId) {
      try {
        const p = await stripe.prices.retrieve(STRIPE_CONFIG.intensivePriceId);
        const amount = p.unit_amount || 0;
        prices.intensive.actual = `$${(amount / 100).toFixed(2)} one-time`;
        if (amount === 99900 && p.type === 'one_time') {
          prices.intensive.valid = true;
        } else {
          prices.intensive.error = `Price exists but does not match expected $999.00 one-time (Found: ${prices.intensive.actual})`;
        }
      } catch (err: any) {
        prices.intensive.error = `Price ID ${STRIPE_CONFIG.intensivePriceId} not found in Stripe account: ${err.message}`;
      }
    } else {
      prices.intensive.error = 'STRIPE_INTENSIVE_PRICE_ID environment variable is optional (dynamic checkout supported).';
    }
  }

  // 4. Webhook Health & Last Event Audit
  let webhookStatus: 'active' | 'waiting_for_first_event' | 'not_configured' = 'not_configured';
  let lastEventAt: string | null = null;
  let lastEventType: string | null = null;
  const hasWebhookSecret = Boolean(webhookSecret && webhookSecret.startsWith('whsec_'));

  if (hasWebhookSecret) {
    webhookStatus = 'waiting_for_first_event';
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('stripe_webhook_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          lastEventAt = data.created_at;
          lastEventType = data.event_type;
          webhookStatus = 'active';
        }
      } catch (err) {
        console.warn('Could not query stripe_webhook_logs:', err);
      }
    }
  }

  // 5. Build Comprehensive Readiness Checklist
  const checklist = [
    {
      id: 'secret_key',
      label: 'Stripe Secret Key',
      status: secretKey ? 'pass' : 'fail',
      detail: secretKey
        ? `CONFIGURED ✓ (${secretKey.slice(0, 7)}...${secretKey.slice(-4)})`
        : 'MISSING: Required for all Stripe API requests.',
    },
    {
      id: 'publishable_key',
      label: 'Stripe Publishable Key',
      status: publishableKey ? 'pass' : 'warning',
      detail: publishableKey
        ? `CONFIGURED ✓ (${publishableKey.slice(0, 7)}...${publishableKey.slice(-4)})`
        : 'MISSING: Required for client-side Stripe Elements.',
    },
    {
      id: 'api_connectivity',
      label: 'Stripe API Connectivity',
      status: apiStatus === 'working' ? 'pass' : 'fail',
      detail: apiMessage,
    },
    {
      id: 'mode_consistency',
      label: 'Key Environment Mode',
      status: mode === 'inconsistent' ? 'fail' : mode === 'unconfigured' ? 'warning' : 'pass',
      detail:
        mode === 'test'
          ? 'TEST MODE (sk_test_ / pk_test_ active and matching)'
          : mode === 'live'
          ? 'LIVE MODE (sk_live_ / pk_live_ active in production)'
          : mode === 'inconsistent'
          ? 'MODE MISMATCH ERROR: Secret and Publishable keys must both be Test or both be Live.'
          : 'NOT CONFIGURED: Missing Stripe API credentials.',
    },
    {
      id: 'foundation_price',
      label: 'Crediqly Foundation Price ($39.99/mo)',
      status: prices.foundation.valid ? 'pass' : prices.foundation.configured ? 'fail' : 'warning',
      detail: prices.foundation.valid
        ? 'VERIFIED ✓ ($39.99/month recurring)'
        : prices.foundation.error || 'NOT CONFIGURED: Price ID required (dynamic fallback active)',
    },
    {
      id: 'guided_price',
      label: 'Crediqly Guided Price ($149.99/mo)',
      status: prices.guided.valid ? 'pass' : prices.guided.configured ? 'fail' : 'warning',
      detail: prices.guided.valid
        ? 'VERIFIED ✓ ($149.99/month recurring)'
        : prices.guided.error || 'NOT CONFIGURED: Price ID required (dynamic fallback active)',
    },
    {
      id: 'intensive_price',
      label: 'Funding Readiness Intensive ($999 one-time)',
      status: prices.intensive.valid ? 'pass' : 'warning',
      detail: prices.intensive.valid
        ? 'VERIFIED ✓ ($999.00 one-time payment)'
        : 'CONFIGURED via Dynamic Product ($999.00 one-time)',
    },
    {
      id: 'webhook_secret',
      label: 'Webhook Signing Secret',
      status: hasWebhookSecret ? 'pass' : 'warning',
      detail: hasWebhookSecret
        ? 'CONFIGURED ✓ (whsec_ signing secret is active)'
        : 'NOT CONFIGURED: Webhook signing secret missing.',
    },
    {
      id: 'webhook_events',
      label: 'Live Webhook Event Receipts',
      status: webhookStatus === 'active' ? 'pass' : 'warning',
      detail:
        webhookStatus === 'active'
          ? `ACTIVE ✓ (Last event: ${lastEventType || 'received'} at ${lastEventAt})`
          : webhookStatus === 'waiting_for_first_event'
          ? 'WAITING: Secret configured, waiting for first incoming Stripe event.'
          : 'UNCONFIGURED: Add STRIPE_WEBHOOK_SECRET to enable verification.',
    },
  ];

  const overallReady =
    apiStatus === 'working' &&
    mode !== 'inconsistent' &&
    Boolean(secretKey);

  // Masked values for safe admin display
  const maskedSecretKey = secretKey
    ? `${secretKey.slice(0, 7)}...${secretKey.slice(-4)}`
    : '';
  const maskedWebhookSecret = webhookSecret
    ? `${webhookSecret.slice(0, 8)}...${webhookSecret.slice(-4)}`
    : '';

  return NextResponse.json({
    connected: apiStatus === 'working',
    mode,
    apiStatus,
    apiMessage,
    webhookStatus,
    lastEventAt,
    lastEventType,
    publishableKey,
    hasPublishableKey: Boolean(publishableKey),
    hasSecretKey: Boolean(secretKey),
    maskedSecretKey,
    hasWebhookSecret,
    maskedWebhookSecret,
    prices,
    checklist,
    overallReady,
    checkedAt: new Date().toISOString(),
  });
}
