import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripeServer';
import { upsertSubscription, recordPayment } from '@/lib/supabase/subscriptionService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, userId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Stripe sessionId is required to verify checkout.' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured on this server.' },
        { status: 503 }
      );
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Stripe checkout session not found.' },
        { status: 404 }
      );
    }

    // Verify session was paid or complete
    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    if (!isPaid) {
      return NextResponse.json(
        { error: 'Payment has not yet completed for this checkout session.', status: session.status, paymentStatus: session.payment_status },
        { status: 400 }
      );
    }

    // Resolve target Crediqly user ID
    const targetUserId =
      session.metadata?.crediqly_user_id ||
      session.metadata?.userId ||
      session.client_reference_id ||
      userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'No Crediqly customer could be identified for this checkout session.' },
        { status: 400 }
      );
    }

    // Determine plan from metadata
    const planMeta = session.metadata?.crediqly_plan || session.metadata?.plan;
    const isAdvisory = planMeta === 'advisory' || planMeta === 'premium_advisory';
    const mappedPlan: 'pro' | 'premium_advisory' = isAdvisory ? 'premium_advisory' : 'pro';

    const subObj = session.subscription as any;
    const customerObj = session.customer as any;
    const customerId = customerObj?.id || (typeof session.customer === 'string' ? session.customer : undefined);
    const subscriptionId = subObj?.id || (typeof session.subscription === 'string' ? session.subscription : undefined);

    // 1. Authoritative subscription activation
    const updatedSub = await upsertSubscription({
      userId: targetUserId,
      plan: mappedPlan,
      status: 'active',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: subObj?.current_period_start ? new Date(subObj.current_period_start * 1000).toISOString() : undefined,
      currentPeriodEnd: subObj?.current_period_end ? new Date(subObj.current_period_end * 1000).toISOString() : undefined,
      cancelAtPeriodEnd: Boolean(subObj?.cancel_at_period_end),
      ...(isAdvisory
        ? {
            advisorySetupPaymentStatus: 'paid',
            advisorySetupPaidAt: new Date().toISOString(),
            advisorySetupCheckoutSessionId: session.id,
          }
        : {}),
    });

    // 2. Record payment audit trail
    await recordPayment({
      userId: targetUserId,
      stripeCustomerId: customerId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: (session.payment_intent as string) || undefined,
      amount: session.amount_total || (isAdvisory ? 49900 : 3900),
      currency: session.currency || 'usd',
      paymentType: isAdvisory ? 'advisory_setup' : 'subscription',
      status: 'paid',
    });

    return NextResponse.json({
      success: true,
      plan: mappedPlan,
      status: 'active',
      subscription: updatedSub,
    });
  } catch (err: any) {
    console.error('Error verifying Stripe checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to verify checkout session with Stripe.' },
      { status: 500 }
    );
  }
}
