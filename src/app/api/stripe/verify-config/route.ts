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
  let webhookStatus: 'healthy' | 'needs_attention' | 'not_configured' = 'not_configured';
  let lastEventAt: string | null = null;
  let lastEventType: string | null = null;
  const hasWebhookSecret = Boolean(webhookSecret && webhookSecret.startsWith('whsec_'));

  if (hasWebhookSecret) {
    webhookStatus = 'needs_attention'; // Default until confirmed event
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
          webhookStatus = 'healthy';
        }
      } catch (e) {
        // Table might not be migrated yet
      }
    }
  }

  // 5. Build Comprehensive Checklist
  const checklist = [
    {
      id: 'api_connection',
      label: 'Stripe API Connection',
      status: apiStatus === 'working' ? 'pass' : 'fail',
      detail: apiMessage,
    },
    {
      id: 'mode_consistency',
      label: 'Key Mode Consistency',
      status: mode === 'inconsistent' ? 'fail' : mode === 'unconfigured' ? 'warning' : 'pass',
      detail:
        mode === 'test'
          ? 'Configured in Test Mode (safe for testing)'
          : mode === 'live'
          ? 'Configured in Live Production Mode'
          : mode === 'inconsistent'
          ? 'Mismatched keys: Secret and Publishable keys must both be Test or both be Live.'
          : 'Missing Stripe API credentials.',
    },
    {
      id: 'pro_price',
      label: 'Crediqly Pro Price ($39/mo)',
      status: prices.pro.valid ? 'pass' : prices.pro.configured ? 'fail' : 'warning',
      detail: prices.pro.valid
        ? 'Verified: $39.00/month recurring'
        : prices.pro.error || 'Price ID configuration required',
    },
    {
      id: 'advisory_setup_price',
      label: 'Premium Advisory Setup Price ($499)',
      status: prices.advisorySetup.valid ? 'pass' : prices.advisorySetup.configured ? 'fail' : 'warning',
      detail: prices.advisorySetup.valid
        ? 'Verified: $499.00 one-time setup'
        : prices.advisorySetup.error || 'Price ID configuration required',
    },
    {
      id: 'advisory_monthly_price',
      label: 'Premium Advisory Monthly Price ($149/mo)',
      status: prices.advisoryMonthly.valid ? 'pass' : prices.advisoryMonthly.configured ? 'fail' : 'warning',
      detail: prices.advisoryMonthly.valid
        ? 'Verified: $149.00/month recurring'
        : prices.advisoryMonthly.error || 'Price ID configuration required',
    },
    {
      id: 'webhook_secret',
      label: 'Webhook Signing Secret (STRIPE_WEBHOOK_SECRET)',
      status: hasWebhookSecret ? 'pass' : 'warning',
      detail: hasWebhookSecret
        ? 'Configured with whsec_... signature token'
        : 'Missing signing secret. Configure in Stripe Dashboard -> Webhooks -> Reveal Secret.',
    },
    {
      id: 'webhook_health',
      label: 'Webhook Endpoint Verification',
      status: webhookStatus === 'healthy' ? 'pass' : hasWebhookSecret ? 'warning' : 'fail',
      detail:
        webhookStatus === 'healthy'
          ? `Healthy: Last event received at ${new Date(lastEventAt!).toLocaleString()} (${lastEventType})`
          : hasWebhookSecret
          ? 'Listening for events at /api/stripe/webhook'
          : 'Webhook signing secret not configured.',
    },
  ];

  const overallReady = checklist.every((c) => c.status === 'pass');

  return NextResponse.json({
    connected: apiStatus === 'working',
    mode,
    apiStatus,
    apiMessage,
    webhookStatus,
    lastEventAt,
    lastEventType,
    hasPublishableKey: Boolean(publishableKey),
    hasSecretKey: Boolean(secretKey),
    hasWebhookSecret,
    prices,
    checklist,
    overallReady,
    checkedAt: new Date().toISOString(),
  });
}
