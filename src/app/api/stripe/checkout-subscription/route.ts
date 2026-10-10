import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, STRIPE_CONFIG, getAppBaseUrl } from '@/lib/stripe/stripeServer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, customerEmail, plan = 'foundation', billing = 'monthly', billingInterval, oneTime } = body;

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
    const isGuidedOneTime = isGuided && (billing === 'one_time' || billingInterval === 'year' || billingInterval === 'one_time' || oneTime === true);

    const planIdentifier = isGuided ? 'guided' : 'foundation';
    const paymentType = isGuidedOneTime
      ? 'guided_onetime'
      : isGuided
      ? 'guided_subscription'
      : 'foundation_subscription';

    // Build line items (Price ID if configured, or dynamic product item)
    let lineItems: any[];

    if (isGuidedOneTime) {
      lineItems = STRIPE_CONFIG.guidedOneTimePriceId
        ? [{ price: STRIPE_CONFIG.guidedOneTimePriceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Crediqly Guided — 12-Month Program',
                  description:
                    '12 months of full Guided platform access, deeper business fundability analysis, 1 scheduled strategy consultation per month, application-sequencing guidance, and priority support. One-time payment, no auto-renewal.',
                },
                unit_amount: STRIPE_CONFIG.guidedOneTimePriceCents, // 99700 cents ($997.00 one-time)
              },
              quantity: 1,
            },
          ];
    } else if (isGuided) {
      lineItems = STRIPE_CONFIG.guidedPriceId
        ? [{ price: STRIPE_CONFIG.guidedPriceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Crediqly Guided',
                  description:
                    'Full platform access, deeper business fundability analysis, 1 scheduled strategy consultation per month, application-sequencing guidance, and priority support.',
                },
                unit_amount: STRIPE_CONFIG.guidedPriceCents, // 14799 cents ($147.99/mo)
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ];
    } else {
      lineItems = STRIPE_CONFIG.foundationPriceId
        ? [{ price: STRIPE_CONFIG.foundationPriceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Crediqly Foundation',
                  description:
                    'Build funding readiness independently with personalized roadmap, full funding-readiness assessment, tradeline recommendations, and genuine progress tracking.',
                },
                unit_amount: STRIPE_CONFIG.foundationPriceCents, // 4799 cents ($47.99/mo)
                recurring: { interval: 'month' },
              },
              quantity: 1,
            },
          ];
    }

    // Prepare session configuration based on mode
    const sessionConfig: any = {
      mode: isGuidedOneTime ? 'payment' : 'subscription',
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
        paymentType,
        billing: isGuidedOneTime ? 'one_time' : 'monthly',
        duration_months: isGuidedOneTime ? '12' : undefined,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    if (!isGuidedOneTime) {
      sessionConfig.subscription_data = {
        metadata: {
          userId,
          crediqly_user_id: userId,
          plan: planIdentifier,
          crediqly_plan: planIdentifier,
          paymentType,
        },
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      plan: planIdentifier,
      billing: isGuidedOneTime ? 'one_time' : 'monthly',
    });
  } catch (err: any) {
    console.error('Error creating Stripe subscription checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize subscription checkout session.' },
      { status: 500 }
    );
  }
}
