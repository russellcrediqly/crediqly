import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, STRIPE_CONFIG, getAppBaseUrl } from '@/lib/stripe/stripeServer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, customerEmail } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required to request the Funding Readiness Intensive.' },
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

    // Build line item: $997 one-time payment for 12-month Guided Program (NOT recurring)
    const lineItems: any[] = STRIPE_CONFIG.guidedOneTimePriceId
      ? [{ price: STRIPE_CONFIG.guidedOneTimePriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Crediqly Guided — 12-Month Program',
                description:
                  '12 months of full Guided platform access, personalized strategy consultations, funding preparation & sequencing guidance, and dedicated priority support. One-time payment, no auto-renewal.',
              },
              unit_amount: STRIPE_CONFIG.guidedOneTimePriceCents, // 99700 cents ($997.00 one-time)
            },
            quantity: 1,
          },
        ];

    // Create Stripe Checkout Session (mode: 'payment' for one-time charge)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: `${baseUrl}/dashboard?intensive_confirmed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId,
        crediqly_user_id: userId,
        plan: 'guided',
        crediqly_plan: 'guided',
        paymentType: 'guided_onetime',
        billing: 'one_time',
        duration_months: '12',
        service: 'Crediqly Guided 12-Month Program',
      },
      billing_address_collection: 'auto',
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('Error creating Funding Readiness Intensive checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize Funding Readiness Intensive checkout session.' },
      { status: 500 }
    );
  }
}
