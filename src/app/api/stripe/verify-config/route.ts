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
    pro: PriceCheck;
    advisorySetup: PriceCheck;
    advisoryMonthly: PriceCheck;
  } = {
    pro: {
      id: STRIPE_CONFIG.proPriceId,
      configured: Boolean(STRIPE_CONFIG.proPriceId),
      valid: false,
      expected: '$39/month recurring',
    },
    advisorySetup: {
      id: STRIPE_CONFIG.advisorySetupPriceId,
      configured: Boolean(STRIPE_CONFIG.advisorySetupPriceId),
      valid: false,
      expected: '$499 one-time',
    },
    advisoryMonthly: {
      id: STRIPE_CONFIG.advisoryMonthlyPriceId,
      configured: Boolean(STRIPE_CONFIG.advisoryMonthlyPriceId),
      valid: false,
      expected: '$149/month recurring',
    },
  };

  if (apiStatus === 'working' && stripe) {
    // Validate Pro Price
    if (STRIPE_CONFIG.proPriceId) {
      try {
        const p = await stripe.prices.retrieve(STRIPE_CONFIG.proPriceId);
        const amount = p.unit_amount || 0;
        const interval = p.recurring?.interval;
        prices.pro.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
        if (amount === 3900 && interval === 'month') {
          prices.pro.valid = true;
        } else {
          prices.pro.error = `Price exists but does not match expected $39/month (Found: ${prices.pro.actual})`;
        }
      } catch (err: any) {
        prices.pro.error = `Price ID ${STRIPE_CONFIG.proPriceId} not found in Stripe account: ${err.message}`;
      }
    } else {
      prices.pro.error = 'STRIPE_PRO_PRICE_ID environment variable is missing.';
    }

    // Validate Advisory Setup Price
    if (STRIPE_CONFIG.advisorySetupPriceId) {
      try {
        const p = await stripe.prices.retrieve(STRIPE_CONFIG.advisorySetupPriceId);
        const amount = p.unit_amount || 0;
        prices.advisorySetup.actual = `$${(amount / 100).toFixed(2)} one-time`;
        if (amount === 49900 && p.type === 'one_time') {
          prices.advisorySetup.valid = true;
        } else {
          prices.advisorySetup.error = `Price exists but does not match expected $499 one-time (Found: ${prices.advisorySetup.actual})`;
        }
      } catch (err: any) {
        prices.advisorySetup.error = `Price ID ${STRIPE_CONFIG.advisorySetupPriceId} not found in Stripe account: ${err.message}`;
      }
    } else {
      prices.advisorySetup.error = 'STRIPE_ADVISORY_SETUP_PRICE_ID environment variable is missing.';
    }

    // Validate Advisory Monthly Price
    if (STRIPE_CONFIG.advisoryMonthlyPriceId) {
      try {
        const p = await stripe.prices.retrieve(STRIPE_CONFIG.advisoryMonthlyPriceId);
        const amount = p.unit_amount || 0;
        const interval = p.recurring?.interval;
        prices.advisoryMonthly.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
        if (amount === 14900 && interval === 'month') {
          prices.advisoryMonthly.valid = true;
        } else if (p.type === 'one_time') {
          prices.advisoryMonthly.error = `Price is configured as one-time instead of monthly recurring. Recommended recurring price ID: price_1UCIXzDzJxX7FxJaQ2BIUoLs`;
        } else {
          prices.advisoryMonthly.error = `Price exists but does not match expected $149/month (Found: ${prices.advisoryMonthly.actual})`;
        }
      } catch (err: any) {
        prices.advisoryMonthly.error = `Price ID ${STRIPE_CONFIG.advisoryMonthlyPriceId} not found in Stripe account: ${err.message}`;
      }
    } else {
      prices.advisoryMonthly.error = 'STRIPE_ADVISORY_MONTHLY_PRICE_ID environment variable is missing.';
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
      } catch (e) {
        // Table might not be migrated yet or empty
      }
    }
  }

  // 5. Build Comprehensive Checklist
  const checklist = [
    {
      id: 'api_connection',
      label: 'Stripe API Connection',
      status: apiStatus === 'working' ? 'pass' : 'fail',
      detail: apiStatus === 'working' ? 'CONNECTED ✓ (Verified via balance retrieve)' : apiMessage,
    },
    {
      id: 'mode_consistency',
      label: 'Key Mode Consistency',
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
      id: 'pro_price',
      label: 'Crediqly Pro Price ($39/mo)',
      status: prices.pro.valid ? 'pass' : prices.pro.configured ? 'fail' : 'warning',
      detail: prices.pro.valid
        ? 'VERIFIED ✓ ($39.00/month recurring)'
        : prices.pro.error || 'NOT CONFIGURED: Price ID required',
    },
    {
      id: 'advisory_setup_price',
      label: 'Advisory Setup Price ($499 one-time)',
      status: prices.advisorySetup.valid ? 'pass' : prices.advisorySetup.configured ? 'fail' : 'warning',
      detail: prices.advisorySetup.valid
        ? 'VERIFIED ✓ ($499.00 one-time)'
        : prices.advisorySetup.error || 'NOT CONFIGURED: Price ID required',
    },
    {
      id: 'advisory_monthly_price',
      label: 'Advisory Retainer Price ($149/mo)',
      status: prices.advisoryMonthly.valid ? 'pass' : prices.advisoryMonthly.configured ? 'fail' : 'warning',
      detail: prices.advisoryMonthly.valid
        ? 'VERIFIED ✓ ($149.00/month recurring)'
        : prices.advisoryMonthly.error || 'NOT CONFIGURED: Price ID required',
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
      id: 'webhook_health',
      label: 'Webhook Event Delivery',
      status: webhookStatus === 'active' ? 'pass' : hasWebhookSecret ? 'warning' : 'fail',
      detail:
        webhookStatus === 'active'
          ? `ACTIVE ✓ (Last event: ${lastEventType} at ${new Date(lastEventAt!).toLocaleTimeString()})`
          : hasWebhookSecret
          ? 'WAITING FOR FIRST EVENT (Endpoint /api/stripe/webhook registered and ready)'
          : 'NOT CONFIGURED: Please create webhook endpoint in Stripe Dashboard.',
    },
  ];

  const overallReady =
    apiStatus === 'working' &&
    mode !== 'inconsistent' &&
    prices.pro.valid &&
    prices.advisorySetup.valid &&
    prices.advisoryMonthly.valid &&
    hasWebhookSecret;

  // Build copyable Vercel environment variables block
  const vercelEnvSnippet = [
    `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${publishableKey}`,
    `STRIPE_SECRET_KEY=${secretKey}`,
    `STRIPE_WEBHOOK_SECRET=${webhookSecret}`,
    `STRIPE_PRO_PRICE_ID=${STRIPE_CONFIG.proPriceId}`,
    `STRIPE_ADVISORY_SETUP_PRICE_ID=${STRIPE_CONFIG.advisorySetupPriceId}`,
    `STRIPE_ADVISORY_MONTHLY_PRICE_ID=${STRIPE_CONFIG.advisoryMonthlyPriceId}`,
  ].join('\n');

  return NextResponse.json({
    connected: apiStatus === 'working',
    mode,
    apiStatus,
    apiMessage,
    webhookStatus,
    lastEventAt,
    lastEventType,
    publishableKey: publishableKey || '',
    hasPublishableKey: Boolean(publishableKey),
    hasSecretKey: Boolean(secretKey),
    maskedSecretKey: secretKey ? `${secretKey.slice(0, 8)}••••••••${secretKey.slice(-4)}` : '',
    hasWebhookSecret,
    maskedWebhookSecret: webhookSecret ? `${webhookSecret.slice(0, 8)}••••••••${webhookSecret.slice(-4)}` : '',
    prices,
    checklist,
    overallReady,
    vercelEnvSnippet,
    checkedAt: new Date().toISOString(),
  });
}

