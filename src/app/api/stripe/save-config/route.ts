import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { refreshStripeConfig, getStripeClient, STRIPE_CONFIG } from '@/lib/stripe/stripeServer';

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
    const body: SaveConfigRequest = await req.json().catch(() => ({}));

    const {
      publishableKey,
      secretKey,
      webhookSecret,
      proPriceId,
      advisorySetupPriceId,
      advisoryMonthlyPriceId,
    } = body;

    const trimmedPub = (publishableKey || '').trim();
    const trimmedSec = (secretKey || '').trim();
    const trimmedWh = (webhookSecret || '').trim();
    const trimmedPro = (proPriceId || '').trim();
    const trimmedSetup = (advisorySetupPriceId || '').trim();
    const trimmedMonthly = (advisoryMonthlyPriceId || '').trim();

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

    if (trimmedPro && !trimmedPro.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Pro Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (trimmedSetup && !trimmedSetup.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Advisory Setup Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (trimmedMonthly && !trimmedMonthly.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Advisory Monthly Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    // Prepare dictionary of environment variables to update
    // CRITICAL: Only include variables that have actual non-empty values!
    // NEVER overwrite an existing secret with empty string or delete it from process.env.
    const envUpdates: Record<string, string> = {};
    if (trimmedPub) envUpdates['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] = trimmedPub;
    if (trimmedSec) envUpdates['STRIPE_SECRET_KEY'] = trimmedSec;
    if (trimmedWh) envUpdates['STRIPE_WEBHOOK_SECRET'] = trimmedWh;
    if (trimmedPro) envUpdates['STRIPE_PRO_PRICE_ID'] = trimmedPro;
    if (trimmedSetup) envUpdates['STRIPE_ADVISORY_SETUP_PRICE_ID'] = trimmedSetup;
    if (trimmedMonthly) envUpdates['STRIPE_ADVISORY_MONTHLY_PRICE_ID'] = trimmedMonthly;

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
      const updatedKeys = new Set<string>();

      const updatedLines = lines.map((line) => {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=/);
        if (match) {
          const key = match[1];
          if (key in envUpdates) {
            updatedKeys.add(key);
            return `${key}=${envUpdates[key]}`;
          }
        }
        return line;
      });

      // Append any keys that weren't already present in .env.local
      const missingKeys = Object.entries(envUpdates).filter(([key]) => !updatedKeys.has(key));
      if (missingKeys.length > 0) {
        if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].trim() !== '') {
          updatedLines.push('');
        }
        updatedLines.push('# Stripe Production & Testing Configuration');
        for (const [key, val] of missingKeys) {
          updatedLines.push(`${key}=${val}`);
        }
      }

      fs.writeFileSync(envFilePath, updatedLines.join('\n'), 'utf8');
      envPersisted = true;
      envPersistNote = 'Configuration saved to .env.local and active in runtime.';
    } catch (fsErr: any) {
      // On Vercel / serverless environments, writeFileSync throws EROFS (Read-only filesystem).
      // We gracefully catch this and notify the user to also copy variables to Vercel dashboard.
      envPersisted = false;
      envPersistNote = 'Saved in runtime memory. On Vercel production, also add these variables in Vercel Project Settings.';
    }

    // 3. Test Stripe connectivity & validate prices
    let connectionStatus: 'connected' | 'error' | 'unconfigured' = 'unconfigured';
    let connectionMessage = 'No Stripe Secret Key configured.';
    let balanceAvailable = false;
    const client = getStripeClient();

    if (client) {
      try {
        await client.balance.retrieve();
        connectionStatus = 'connected';
        connectionMessage = 'Successfully verified connection to Stripe API.';
        balanceAvailable = true;
      } catch (err: any) {
        connectionStatus = 'error';
        connectionMessage = err.message || 'Failed to authenticate with Stripe API.';
      }
    }

    // Build copyable Vercel environment variables block
    const activePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    const activeSecret = process.env.STRIPE_SECRET_KEY || '';
    const activeWebhook = process.env.STRIPE_WEBHOOK_SECRET || '';
    const activePro = process.env.STRIPE_PRO_PRICE_ID || '';
    const activeSetup = process.env.STRIPE_ADVISORY_SETUP_PRICE_ID || '';
    const activeMonthly = process.env.STRIPE_ADVISORY_MONTHLY_PRICE_ID || '';

    const vercelEnvSnippet = [
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${activePublishable}`,
      `STRIPE_SECRET_KEY=${activeSecret}`,
      `STRIPE_WEBHOOK_SECRET=${activeWebhook}`,
      `STRIPE_PRO_PRICE_ID=${activePro}`,
      `STRIPE_ADVISORY_SETUP_PRICE_ID=${activeSetup}`,
      `STRIPE_ADVISORY_MONTHLY_PRICE_ID=${activeMonthly}`,
    ].join('\n');

    return NextResponse.json({
      success: true,
      message: 'Stripe configuration successfully updated and verified.',
      envPersisted,
      envPersistNote,
      connectionStatus,
      connectionMessage,
      balanceAvailable,
      vercelEnvSnippet,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error saving Stripe configuration:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while saving Stripe configuration.' },
      { status: 500 }
    );
  }
}

