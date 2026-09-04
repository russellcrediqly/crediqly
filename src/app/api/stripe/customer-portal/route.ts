import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, getAppBaseUrl } from '@/lib/stripe/stripeServer';
import { getUserSubscription } from '@/lib/supabase/subscriptionService';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required to open billing portal.' },
        { status: 400 }
      );
    }

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        { error: 'Stripe customer portal is not configured.', notConfigured: true },
        { status: 503 }
      );
    }

    const subscription = await getUserSubscription(userId);
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active Stripe billing profile found for this account. Please subscribe to Pro first.' },
        { status: 404 }
      );
    }

    const baseUrl = getAppBaseUrl(req);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({
      portalUrl: portalSession.url,
    });
  } catch (err: any) {
    console.error('Error creating Stripe customer portal session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to open billing portal.' },
      { status: 500 }
    );
  }
}
