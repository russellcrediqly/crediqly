import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, STRIPE_CONFIG, getAppBaseUrl } from '@/lib/stripe/stripeServer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, customerEmail } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required to initiate Pro subscription checkout.' },
        { status: 400 }
      );
    }

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        {
          error: 'Stripe payments are not yet configured on this server. Please provide STRIPE_SECRET_KEY in your environment configuration.',
          notConfigured: true,
        },
        { status: 503 }
      );
    }

    const baseUrl = getAppBaseUrl(req);

    // Build line items (Price ID if configured, or dynamic product item)
    const lineItems: any[] = STRIPE_CONFIG.proPriceId
      ? [{ price: STRIPE_CONFIG.proPriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Crediqly Pro',
                description: 'Full commercial credit building roadmap, trade lines catalog, and funding readiness insights.',
              },
              unit_amount: STRIPE_CONFIG.proPriceCents,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: `${baseUrl}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId,
        paymentType: 'subscription',
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('Error creating Stripe Pro checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize subscription checkout session.' },
      { status: 500 }
    );
  }
}
