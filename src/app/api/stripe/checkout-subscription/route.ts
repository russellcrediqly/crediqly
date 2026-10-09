import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, STRIPE_CONFIG, getAppBaseUrl } from '@/lib/stripe/stripeServer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, customerEmail, plan = 'foundation' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required to initiate subscription checkout.' },
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
    const isGuided = plan === 'guided' || plan === 'advisory' || plan === 'premium_advisory';

    // Build line items (Price ID if configured, or dynamic product item)
    const lineItems: any[] = isGuided
      ? STRIPE_CONFIG.guidedPriceId
        ? [{ price: STRIPE_CONFIG.guidedPriceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Crediqly Guided',
                  description:
                    'Expert-guided credit strategy, 1 personal strategy meeting per month, priority support, and complete business credit roadmap.',
                },
                unit_amount: STRIPE_CONFIG.guidedPriceCents, // 14999 cents ($149.99/mo)
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ]
      : STRIPE_CONFIG.foundationPriceId
      ? [{ price: STRIPE_CONFIG.foundationPriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Crediqly Foundation',
                description:
                  'Build it yourself with personalized roadmap, full business analysis, tradeline recommendations, and AI guidance.',
              },
              unit_amount: STRIPE_CONFIG.foundationPriceCents, // 3999 cents ($39.99/mo)
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];

    const planIdentifier = isGuided ? 'guided' : 'foundation';

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
        crediqly_user_id: userId,
        plan: planIdentifier,
        crediqly_plan: planIdentifier,
        paymentType: isGuided ? 'guided_subscription' : 'foundation_subscription',
      },
      subscription_data: {
        metadata: {
          userId,
          crediqly_user_id: userId,
          plan: planIdentifier,
          crediqly_plan: planIdentifier,
          paymentType: isGuided ? 'guided_subscription' : 'foundation_subscription',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      plan: planIdentifier,
    });
  } catch (err: any) {
    console.error('Error creating Stripe subscription checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize subscription checkout session.' },
      { status: 500 }
    );
  }
}
