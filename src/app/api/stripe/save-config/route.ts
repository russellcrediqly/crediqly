import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  savePersistentStripeConfig,
  loadPersistentStripeConfig,
  verifyAdminRequest,
  maskSecret,
  cleanString,
} from '@/lib/stripe/stripeConfigStorage';
import { refreshStripeConfig, getStripeClient } from '@/lib/stripe/stripeServer';

interface SaveConfigRequest {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  proPriceId?: string;
  advisorySetupPriceId?: string;
  advisoryMonthlyPriceId?: string;
}

export async function POST(req: Request) {
  try {
    // 1. Server-side Admin Authorization Verification (Phase 4)
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized. Administrator privileges required.' },
        { status: 401 }
      );
    }

    // Extract bearer token to authenticate Supabase RLS write
    const authHeader = req.headers.get('authorization') || '';
    const userAccessToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;

    const body: SaveConfigRequest = await req.json().catch(() => ({}));

    const trimmedPub = cleanString(body.publishableKey);
    const trimmedSec = cleanString(body.secretKey);
    const trimmedWh = cleanString(body.webhookSecret);
    const trimmedPro = cleanString(body.proPriceId);
    const trimmedSetup = cleanString(body.advisorySetupPriceId);
    const trimmedMonthly = cleanString(body.advisoryMonthlyPriceId);

    // 2. Format Validations (Only for newly provided values)
    if (trimmedPub && !trimmedPub.startsWith('pk_')) {
      return NextResponse.json(
        { error: 'Invalid Publishable Key format. Stripe publishable keys must begin with "pk_test_" or "pk_live_".' },
        { status: 400 }
      );
    }

    if (trimmedSec && !trimmedSec.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Invalid Secret Key format. Stripe secret keys must begin with "sk_test_" or "sk_live_".' },
        { status: 400 }
      );
    }

    if (trimmedWh && !trimmedWh.startsWith('whsec_')) {
      return NextResponse.json(
        { error: 'Invalid Webhook Signing Secret format. Stripe webhook secrets must begin with "whsec_".' },
        { status: 400 }
      );
    }

    if (trimmedPro && !trimmedPro.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Pro Price ID format. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (trimmedSetup && !trimmedSetup.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Advisory Setup Price ID format. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (trimmedMonthly && !trimmedMonthly.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Advisory Monthly Price ID format. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    // 3. Load currently active persistent configuration to merge and preserve existing values
    const { config: currentConfig } = await loadPersistentStripeConfig(userAccessToken);
    const candidateSecret = trimmedSec || currentConfig.secretKey;
    const candidatePub = trimmedPub || currentConfig.publishableKey;
    const candidateWh = trimmedWh || currentConfig.webhookSecret;
    const candidatePro = trimmedPro || currentConfig.proPriceId;
    const candidateSetup = trimmedSetup || currentConfig.advisorySetupPriceId;
    const candidateMonthly = trimmedMonthly || currentConfig.advisoryMonthlyPriceId;

    // 4. Test Stripe Live API BEFORE Overwriting Configuration (Phase 15 & 16 Failure Safety)
    let liveStripeClient: Stripe | null = null;
    let balanceVerified = false;

    if (candidateSecret) {
      try {
        const testClient = new Stripe(candidateSecret, {
          apiVersion: '2024-11-20.acacia' as any,
          typescript: true,
          timeout: 15000,
          maxNetworkRetries: 1,
        });

        await testClient.balance.retrieve();
        liveStripeClient = testClient;
        balanceVerified = true;
      } catch (testErr: any) {
        // If the user submitted an explicit new secret key that failed, reject immediately
        // to prevent corrupting a previously working configuration
        if (trimmedSec) {
          return NextResponse.json(
            {
              error: `Stripe connection test failed with provided Secret Key: ${testErr.message || 'Invalid API key'}`,
              preservedPrevious: Boolean(currentConfig.secretKey),
            },
            { status: 400 }
          );
        }
      }
    }

    // 5. Verify Candidate Price IDs against live Stripe account
    const priceAudit: Record<string, { valid: boolean; actual?: string; error?: string }> = {
      pro: { valid: false },
      advisorySetup: { valid: false },
      advisoryMonthly: { valid: false },
    };

    if (liveStripeClient) {
      // Validate Pro Price
      if (candidatePro) {
        try {
          const p = await liveStripeClient.prices.retrieve(candidatePro);
          const amount = p.unit_amount || 0;
          const interval = p.recurring?.interval;
          priceAudit.pro.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
          if (amount === 3900 && interval === 'month') {
            priceAudit.pro.valid = true;
          } else {
            priceAudit.pro.error = `Price amount does not match expected $39/month (Found: ${priceAudit.pro.actual})`;
          }
        } catch (err: any) {
          priceAudit.pro.error = `Price ID ${candidatePro} not found in Stripe account.`;
        }
      }

      // Validate Advisory Setup Price
      if (candidateSetup) {
        try {
          const p = await liveStripeClient.prices.retrieve(candidateSetup);
          const amount = p.unit_amount || 0;
          priceAudit.advisorySetup.actual = `$${(amount / 100).toFixed(2)} one-time`;
          if (amount === 49900 && p.type === 'one_time') {
            priceAudit.advisorySetup.valid = true;
          } else {
            priceAudit.advisorySetup.error = `Price amount does not match expected $499 one-time (Found: ${priceAudit.advisorySetup.actual})`;
          }
        } catch (err: any) {
          priceAudit.advisorySetup.error = `Price ID ${candidateSetup} not found in Stripe account.`;
        }
      }

      // Validate Advisory Monthly Price
      if (candidateMonthly) {
        try {
          const p = await liveStripeClient.prices.retrieve(candidateMonthly);
          const amount = p.unit_amount || 0;
          const interval = p.recurring?.interval;
          priceAudit.advisoryMonthly.actual = `$${(amount / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
          if (amount === 14900 && interval === 'month') {
            priceAudit.advisoryMonthly.valid = true;
          } else {
            priceAudit.advisoryMonthly.error = `Price amount does not match expected $149/month (Found: ${priceAudit.advisoryMonthly.actual})`;
          }
        } catch (err: any) {
          priceAudit.advisoryMonthly.error = `Price ID ${candidateMonthly} not found in Stripe account.`;
        }
      }
    }

    // 6. Persist to Multi-Tier Backend (Supabase Database + Local Server File Store)
    const isLive = candidateSecret.startsWith('sk_live_');
    const mode = isLive ? 'live' : 'test';

    const persistResult = await savePersistentStripeConfig(
      {
        publishableKey: candidatePub,
        secretKey: candidateSecret,
        webhookSecret: candidateWh,
        proPriceId: candidatePro,
        advisorySetupPriceId: candidateSetup,
        advisoryMonthlyPriceId: candidateMonthly,
        mode,
        lastVerificationStatus: balanceVerified ? 'verified' : 'unverified',
      },
      userAccessToken
    );

    refreshStripeConfig();

    return NextResponse.json({
      success: true,
      message: persistResult.message,
      persistedDb: persistResult.persistedDb,
      persistedFile: persistResult.persistedFile,
      storageBackend: persistResult.storageBackend,
      connectionStatus: balanceVerified ? 'connected' : candidateSecret ? 'error' : 'unconfigured',
      connectionMessage: balanceVerified
        ? 'Successfully authenticated and verified connection with Stripe API.'
        : 'Stripe credentials saved, awaiting live connection verification.',
      mode,
      publishableKey: candidatePub,
      hasSecretKey: Boolean(candidateSecret),
      maskedSecretKey: maskSecret(candidateSecret),
      hasWebhookSecret: Boolean(candidateWh),
      maskedWebhookSecret: maskSecret(candidateWh, 'whsec_'),
      priceAudit,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error saving persistent Stripe configuration:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while persisting Stripe configuration.' },
      { status: 500 }
    );
  }
}
