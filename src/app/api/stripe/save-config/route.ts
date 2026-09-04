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
      publishableKey = '',
      secretKey = '',
      webhookSecret = '',
      proPriceId = '',
      advisorySetupPriceId = '',
      advisoryMonthlyPriceId = '',
    } = body;

    // Validate key formats if provided
    if (publishableKey && !publishableKey.startsWith('pk_')) {
      return NextResponse.json(
        { error: 'Invalid Publishable Key. Stripe publishable keys must begin with "pk_test_" or "pk_live_".' },
        { status: 400 }
      );
    }

    if (secretKey && !secretKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: 'Invalid Secret Key. Stripe secret keys must begin with "sk_test_" or "sk_live_".' },
        { status: 400 }
      );
    }

    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
      return NextResponse.json(
        { error: 'Invalid Webhook Signing Secret. Stripe webhook secrets must begin with "whsec_".' },
        { status: 400 }
      );
    }

    if (proPriceId && !proPriceId.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Pro Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (advisorySetupPriceId && !advisorySetupPriceId.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Advisory Setup Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    if (advisoryMonthlyPriceId && !advisoryMonthlyPriceId.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Advisory Monthly Price ID. Stripe Price IDs must begin with "price_".' },
        { status: 400 }
      );
    }

    // Prepare dictionary of environment variables to update
    const envUpdates: Record<string, string> = {};
    if (publishableKey !== undefined) envUpdates['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] = publishableKey.trim();
    if (secretKey !== undefined) envUpdates['STRIPE_SECRET_KEY'] = secretKey.trim();
    if (webhookSecret !== undefined) envUpdates['STRIPE_WEBHOOK_SECRET'] = webhookSecret.trim();
    if (proPriceId !== undefined) envUpdates['STRIPE_PRO_PRICE_ID'] = proPriceId.trim();
    if (advisorySetupPriceId !== undefined) envUpdates['STRIPE_ADVISORY_SETUP_PRICE_ID'] = advisorySetupPriceId.trim();
    if (advisoryMonthlyPriceId !== undefined) envUpdates['STRIPE_ADVISORY_MONTHLY_PRICE_ID'] = advisoryMonthlyPriceId.trim();

    // 1. Update runtime process.env
    for (const [key, val] of Object.entries(envUpdates)) {
      if (val) {
        process.env[key] = val;
      } else {
        delete process.env[key];
      }
    }

    // Refresh active stripe server instance
    refreshStripeConfig();

    // 2. Persist to .env.local on disk
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

    // 3. Test Stripe connectivity if secret key provided
    let connectionStatus = 'unconfigured';
    let connectionMessage = 'No secret key configured.';
    const client = getStripeClient();

    if (client) {
      try {
        await client.balance.retrieve();
        connectionStatus = 'connected';
        connectionMessage = 'Successfully connected to Stripe API!';
      } catch (err: any) {
        connectionStatus = 'error';
        connectionMessage = err.message || 'Failed to authenticate with Stripe API.';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe configuration successfully saved and applied.',
      connectionStatus,
      connectionMessage,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error saving Stripe configuration:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving Stripe configuration.' },
      { status: 500 }
    );
  }
}
