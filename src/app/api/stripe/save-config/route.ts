import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { refreshStripeConfig, getStripeClient, STRIPE_CONFIG } from '@/lib/stripe/stripeServer';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

interface SaveConfigRequest {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  foundationPriceId?: string;
  guidedPriceId?: string;
  intensivePriceId?: string;
  // Legacy aliases
  proPriceId?: string;
  advisorySetupPriceId?: string;
  advisoryMonthlyPriceId?: string;
}

export async function POST(req: Request) {
  try {
    const authVerification = verifyAdminRequest(req as any);
    if (!authVerification.authorized) {
      return NextResponse.json(
        { error: 'Forbidden: Administrator credentials required.' },
        { status: 403 }
      );
    }

    const body: SaveConfigRequest = await req.json().catch(() => ({}));

    const {
      publishableKey,
      secretKey,
      webhookSecret,
      foundationPriceId,
      guidedPriceId,
      intensivePriceId,
      proPriceId,
      advisorySetupPriceId,
      advisoryMonthlyPriceId,
    } = body;

    const trimmedPub = (publishableKey || '').trim();
    const trimmedSec = (secretKey || '').trim();
    const trimmedWh = (webhookSecret || '').trim();
    const trimmedFoundation = (foundationPriceId || proPriceId || '').trim();
    const trimmedGuided = (guidedPriceId || advisoryMonthlyPriceId || '').trim();
    const trimmedIntensive = (intensivePriceId || '').trim();
    const trimmedSetup = (advisorySetupPriceId || '').trim();

    // Validate key formats ONLY IF provided
    if (trimmedPub && !trimmedPub.startsWith('pk_')) {
      return NextResponse.json(
        { error: 'Invalid Publishable Key. Stripe publishable keys must begin with "pk_test_" or "pk_live_".' },
        { status: 400 }
      );
    }

    if (trimmedSec && !trimmedSec.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Invalid Secret Key. Stripe secret keys must begin with "sk_test_" or "sk_live_".' },
        { status: 400 }
      );
    }

    if (trimmedWh && !trimmedWh.startsWith('whsec_')) {
      return NextResponse.json(
        { error: 'Invalid Webhook Signing Secret. Stripe webhook secrets must begin with "whsec_".' },
        { status: 400 }
      );
    }

    if (trimmedFoundation && !trimmedFoundation.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Foundation Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (trimmedGuided && !trimmedGuided.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Guided Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (trimmedIntensive && !trimmedIntensive.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Intensive Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    // Prepare dictionary of environment variables to update
    const envUpdates: Record<string, string> = {};
    if (trimmedPub) envUpdates['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] = trimmedPub;
    if (trimmedSec) envUpdates['STRIPE_SECRET_KEY'] = trimmedSec;
    if (trimmedWh) envUpdates['STRIPE_WEBHOOK_SECRET'] = trimmedWh;
    if (trimmedFoundation) {
      envUpdates['STRIPE_FOUNDATION_PRICE_ID'] = trimmedFoundation;
      envUpdates['STRIPE_PRO_PRICE_ID'] = trimmedFoundation;
    }
    if (trimmedGuided) {
      envUpdates['STRIPE_GUIDED_PRICE_ID'] = trimmedGuided;
      envUpdates['STRIPE_ADVISORY_MONTHLY_PRICE_ID'] = trimmedGuided;
    }
    if (trimmedIntensive) {
      envUpdates['STRIPE_INTENSIVE_PRICE_ID'] = trimmedIntensive;
    }
    if (trimmedSetup) {
      envUpdates['STRIPE_ADVISORY_SETUP_PRICE_ID'] = trimmedSetup;
    }

    // 1. Update runtime process.env for provided variables
    for (const [key, val] of Object.entries(envUpdates)) {
      if (val) {
        process.env[key] = val;
      }
    }

    // Refresh active stripe server instance
    refreshStripeConfig();

    // 2. Safely attempt to persist to .env.local on disk (local development)
    let envPersisted = false;
    let envPersistNote = 'Configuration updated in runtime memory.';
    try {
      const envFilePath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      if (fs.existsSync(envFilePath)) {
        envContent = fs.readFileSync(envFilePath, 'utf8');
      }

      // Parse and update lines
      const lines = envContent.split(/\r?\n/);
      const updatedLines = [...lines];

      for (const [key, val] of Object.entries(envUpdates)) {
        const lineIdx = updatedLines.findIndex((l) => l.startsWith(`${key}=`));
        if (lineIdx >= 0) {
          updatedLines[lineIdx] = `${key}=${val}`;
        } else {
          // Add before any trailing comments or at end
          updatedLines.push(`${key}=${val}`);
        }
      }

      fs.writeFileSync(envFilePath, updatedLines.join('\n'), 'utf8');
      envPersisted = true;
      envPersistNote = 'Configuration successfully persisted to .env.local and active in memory.';
    } catch (fsErr: any) {
      console.warn('Could not persist Stripe settings to .env.local (read-only filesystem or serverless):', fsErr.message);
      envPersistNote = 'Updated in active runtime memory. For permanent production deployments, add these environment variables to your host settings (e.g. Vercel dashboard).';
    }

    // 3. Perform a quick verification of new settings
    let testResult: { connected: boolean; message: string; prices: Record<string, any> } = {
      connected: false,
      message: 'Keys saved. Testing connection...',
      prices: {},
    };

    const client = getStripeClient();
    if (client) {
      try {
        await client.balance.retrieve();
        testResult.connected = true;
        testResult.message = 'Stripe connection successfully validated with updated credentials!';
      } catch (err: any) {
        testResult.connected = false;
        testResult.message = `Keys saved, but Stripe connection test failed: ${err.message}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe configuration updated successfully.',
      persistedToDisk: envPersisted,
      persistenceNote: envPersistNote,
      testResult,
      updatedKeys: Object.keys(envUpdates),
    });
  } catch (err: any) {
    console.error('Error saving Stripe configuration:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save Stripe configuration.' },
      { status: 500 }
    );
  }
}
