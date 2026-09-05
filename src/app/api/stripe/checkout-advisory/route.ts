import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, STRIPE_CONFIG, getAppBaseUrl, syncStripeConfigFromStorage } from '@/lib/stripe/stripeServer';
import { getUserSubscription } from '@/lib/supabase/subscriptionService';

export async function POST(req: Request) {
  try {
    await syncStripeConfigFromStorage();
    const body = await req.json().catch(() => ({}));
    const { userId, customerEmail } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required to initiate Premium Advisory checkout.' },
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

    // Check if customer already has a subscription record (e.g. existing Pro subscriber)
    const existingSub = await getUserSubscription(userId);
    const existingCustomerId = existingSub?.stripeCustomerId;
    const existingProSubId = existingSub?.plan === 'pro' && existingSub.stripeSubscriptionId ? existingSub.stripeSubscriptionId : '';

    const baseUrl = getAppBaseUrl(req);

    // Build line items: $499 one-time setup fee + $149/month recurring advisory
    const setupLineItem: any = STRIPE_CONFIG.advisorySetupPriceId
      ? { price: STRIPE_CONFIG.advisorySetupPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Crediqly Premium Advisory — Strategy & Onboarding Setup',
              description: 'One-time onboarding, comprehensive business profile & funding audit, and strategic blueprint.',
            },
            unit_amount: STRIPE_CONFIG.advisorySetupPriceCents,
          },
          quantity: 1,
        };

    // Resolve monthly recurring price ID (guarding against legacy one-time price ID)
    let monthlyPriceId = STRIPE_CONFIG.advisoryMonthlyPriceId;
    if (monthlyPriceId === 'price_1UCGFADzJxX7FxJayDvw7XVZ') {
      monthlyPriceId = 'price_1UCIXzDzJxX7FxJaQ2BIUoLs';
    }

    const monthlyLineItem: any = monthlyPriceId
      ? { price: monthlyPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Crediqly Premium Advisory — Monthly Retainer',
              description: 'Ongoing dedicated commercial advisory, 1 included 1-on-1 strategy meeting per month, and priority support.',
            },
            unit_amount: STRIPE_CONFIG.advisoryMonthlyPriceCents,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        };

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: existingCustomerId || undefined,
      customer_email: !existingCustomerId ? (customerEmail || undefined) : undefined,
      line_items: [setupLineItem, monthlyLineItem],
      success_url: `${baseUrl}/advisory?onboarding=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/advisory?canceled=true`,
      metadata: {
        userId,
        crediqly_user_id: userId,
        plan: 'premium_advisory',
        crediqly_plan: 'advisory',
        paymentType: 'advisory',
        supersededProSubscriptionId: existingProSubId,
      },
      subscription_data: {
        metadata: {
          userId,
          crediqly_user_id: userId,
          plan: 'premium_advisory',
          crediqly_plan: 'advisory',
          paymentType: 'advisory',
          supersededProSubscriptionId: existingProSubId,
        },
      },
      billing_address_collection: 'auto',
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('Error creating Stripe Premium Advisory checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize Premium Advisory checkout session.' },
      { status: 500 }
    );
  }
}
