import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  loadPersistentStripeConfig,
  maskSecret,
} from '@/lib/stripe/stripeConfigStorage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Extract bearer token if present to authenticate with Supabase RLS
  const authHeader = req.headers.get('authorization') || '';
  const userAccessToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;

  // 1. Load authoritative configuration from persistent backend (Supabase DB -> File -> Env)
  const { config, supabaseTableFound } = await loadPersistentStripeConfig(userAccessToken);

  const {
    publishableKey,
    secretKey,
    webhookSecret,
    proPriceId,
    advisorySetupPriceId,
    advisoryMonthlyPriceId,
    mode,
    storageBackend,
  } = config;

  // 2. Safe Connection Test with live Stripe API
  let apiStatus: 'working' | 'error' | 'unconfigured' = 'unconfigured';
  let apiMessage = 'Stripe Secret Key is missing or unconfigured.';
  let stripeClient: Stripe | null = null;

  if (secretKey && secretKey.startsWith('sk_')) {
    try {
      stripeClient = new Stripe(secretKey, {
        apiVersion: '2024-11-20.acacia' as any,
        typescript: true,
        timeout: 15000,
        maxNetworkRetries: 2,
      });

      await stripeClient.balance.retrieve();
      apiStatus = 'working';
      apiMessage = 'Stripe API connection verified successfully.';
    } catch (err: any) {
      apiStatus = 'error';
      apiMessage = err.message || 'Could not authenticate with Stripe API.';
    }
  }

  // 3. Price Validations against Stripe API
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
      id: proPriceId,
      configured: Boolean(proPriceId),
      valid: false,
      expected: '$39/month recurring',
    },
    advisorySetup: {
      id: advisorySetupPriceId,
      configured: Boolean(advisorySetupPriceId),
      valid: false,
      expected: '$499 one-time',
    },
    advisoryMonthly: {
      id: advisoryMonthlyPriceId,
      configured: Boolean(advisoryMonthlyPriceId),
      valid: false,
      expected: '$149/month recurring',
    },
  };

  if (apiStatus === 'working' && stripeClient) {
    // Validate Pro Price ($39/mo)
    if (proPriceId) {
      try {
        const p = await stripeClient.prices.retrieve(proPriceId);
        const amount = p.unit_amount || 0;
        const interval = p.recurring?.interval;
        prices.pro.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
        if (amount === 3900 && interval === 'month') {
          prices.pro.valid = true;
        } else {
          prices.pro.error = `Price amount does not match expected $39/month (Found: ${prices.pro.actual})`;
        }
      } catch (err: any) {
        prices.pro.error = `Price ID ${proPriceId} not found in Stripe account: ${err.message}`;
      }
    } else {
      prices.pro.error = 'STRIPE_PRO_PRICE_ID is missing.';
    }

    // Validate Advisory Setup Price ($499 one-time)
    if (advisorySetupPriceId) {
      try {
        const p = await stripeClient.prices.retrieve(advisorySetupPriceId);
        const amount = p.unit_amount || 0;
        prices.advisorySetup.actual = `$${(amount / 100).toFixed(2)} one-time`;
        if (amount === 49900 && p.type === 'one_time') {
          prices.advisorySetup.valid = true;
        } else {
          prices.advisorySetup.error = `Price amount does not match expected $499 one-time (Found: ${prices.advisorySetup.actual})`;
        }
      } catch (err: any) {
        prices.advisorySetup.error = `Price ID ${advisorySetupPriceId} not found in Stripe account: ${err.message}`;
      }
    } else {
      prices.advisorySetup.error = 'STRIPE_ADVISORY_SETUP_PRICE_ID is missing.';
    }

    // Validate Advisory Monthly Price ($149/mo)
    if (advisoryMonthlyPriceId) {
      try {
        const p = await stripeClient.prices.retrieve(advisoryMonthlyPriceId);
        const amount = p.unit_amount || 0;
        const interval = p.recurring?.interval;
        prices.advisoryMonthly.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
        if (amount === 14900 && interval === 'month') {
          prices.advisoryMonthly.valid = true;
        } else {
          prices.advisoryMonthly.error = `Price amount does not match expected $149/month (Found: ${prices.advisoryMonthly.actual})`;
        }
      } catch (err: any) {
        prices.advisoryMonthly.error = `Price ID ${advisoryMonthlyPriceId} not found in Stripe account: ${err.message}`;
      }
    } else {
      prices.advisoryMonthly.error = 'STRIPE_ADVISORY_MONTHLY_PRICE_ID is missing.';
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
        // Table not yet migrated or empty
      }
    }
  }

  // 5. Checklist Items
  const checklist = [
    {
      id: 'api_connection',
      label: 'Stripe API Connection',
      status: apiStatus === 'working' ? 'pass' : 'fail',
      detail: apiStatus === 'working' ? 'CONNECTED ✓ (Verified via Stripe balance retrieve)' : apiMessage,
    },
    {
      id: 'mode_consistency',
      label: 'Key Mode Consistency',
      status: mode === 'inconsistent' ? 'fail' : mode === 'unconfigured' ? 'warning' : 'pass',
      detail:
        mode === 'test'
          ? 'TEST MODE (sk_test_ / pk_test_ active)'
          : mode === 'live'
          ? 'LIVE MODE (sk_live_ / pk_live_ active)'
          : mode === 'inconsistent'
          ? 'MODE MISMATCH ERROR: Secret and Publishable keys must both be Test or both be Live.'
          : 'NOT CONFIGURED: Missing Stripe credentials.',
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
          ? 'WAITING FOR FIRST EVENT (Endpoint /api/stripe/webhook registered and listening)'
          : 'NOT CONFIGURED: Please add endpoint in Stripe Dashboard -> Webhooks.',
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
    `STRIPE_PRO_PRICE_ID=${proPriceId}`,
    `STRIPE_ADVISORY_SETUP_PRICE_ID=${advisorySetupPriceId}`,
    `STRIPE_ADVISORY_MONTHLY_PRICE_ID=${advisoryMonthlyPriceId}`,
  ].join('\n');

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
    maskedSecretKey: maskSecret(secretKey),
    hasWebhookSecret,
    maskedWebhookSecret: maskSecret(webhookSecret, 'whsec_'),
    prices,
    checklist,
    overallReady,
    storageBackend,
    supabaseTableFound,
    vercelEnvSnippet,
    checkedAt: new Date().toISOString(),
  });
}
