import { NextResponse } from 'next/server';
import { isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe/stripeServer';

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured,
    hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')),
    hasWebhookSecret: Boolean(STRIPE_CONFIG.webhookSecret && STRIPE_CONFIG.webhookSecret.startsWith('whsec_')),
    hasProPriceId: Boolean(STRIPE_CONFIG.proPriceId),
    hasConsultationPriceId: Boolean(STRIPE_CONFIG.consultationPriceId),
    hasAdvisorySetupPriceId: Boolean(STRIPE_CONFIG.advisorySetupPriceId),
    hasAdvisoryMonthlyPriceId: Boolean(STRIPE_CONFIG.advisoryMonthlyPriceId),
    proPriceCents: STRIPE_CONFIG.proPriceCents,
    consultationPriceCents: STRIPE_CONFIG.consultationPriceCents,
    advisorySetupPriceCents: STRIPE_CONFIG.advisorySetupPriceCents,
    advisoryMonthlyPriceCents: STRIPE_CONFIG.advisoryMonthlyPriceCents,
    webhookEndpoint: '/api/stripe/webhook',
  });
}
