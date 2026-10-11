import { NextResponse } from 'next/server';
import { isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe/stripeServer';

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured,
    hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')),
    hasWebhookSecret: Boolean(STRIPE_CONFIG.webhookSecret && STRIPE_CONFIG.webhookSecret.startsWith('whsec_')),
    // Approved canonical price IDs
    hasFoundationPriceId: Boolean(STRIPE_CONFIG.foundationPriceId),
    hasGuidedPriceId: Boolean(STRIPE_CONFIG.guidedPriceId),
    hasGuidedOneTimePriceId: Boolean(STRIPE_CONFIG.guidedOneTimePriceId),
    foundationPriceCents: STRIPE_CONFIG.foundationPriceCents,
    guidedPriceCents: STRIPE_CONFIG.guidedPriceCents,
    guidedOneTimePriceCents: STRIPE_CONFIG.guidedOneTimePriceCents,
    // Legacy aliases maintained for backward compatibility
    hasProPriceId: Boolean(STRIPE_CONFIG.foundationPriceId),
    hasConsultationPriceId: Boolean(STRIPE_CONFIG.consultationPriceId),
    hasAdvisorySetupPriceId: Boolean(STRIPE_CONFIG.advisorySetupPriceId),
    hasAdvisoryMonthlyPriceId: Boolean(STRIPE_CONFIG.guidedPriceId),
    proPriceCents: STRIPE_CONFIG.foundationPriceCents,
    consultationPriceCents: STRIPE_CONFIG.consultationPriceCents,
    advisorySetupPriceCents: STRIPE_CONFIG.advisorySetupPriceCents,
    advisoryMonthlyPriceCents: STRIPE_CONFIG.guidedPriceCents,
    webhookEndpoint: '/api/stripe/webhook',
  });
}
