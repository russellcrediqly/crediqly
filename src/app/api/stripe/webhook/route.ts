import { NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG, syncStripeConfigFromStorage } from '@/lib/stripe/stripeServer';
import { upsertSubscription, recordPayment } from '@/lib/supabase/subscriptionService';
import { updateConsultationPaymentStatus } from '@/lib/supabase/consultationService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  await syncStripeConfigFromStorage();
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/stripe/webhook',
    configured: Boolean(STRIPE_CONFIG.webhookSecret),
    message: 'Stripe webhook receiver is listening for incoming POST requests.',
  });
}

export async function POST(req: Request) {
  await syncStripeConfigFromStorage();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured on this server.' },
      { status: 503 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature && STRIPE_CONFIG.webhookSecret) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header.' },
      { status: 400 }
    );
  }

  let event: any;
  const rawBody = await req.text();

  // Cryptographic Signature Verification
  if (STRIPE_CONFIG.webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature!,
        STRIPE_CONFIG.webhookSecret
      );
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
  } else {
    // Fallback for development without configured webhook secret
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
  }

  try {
    const eventType = event.type;
    const dataObject = event.data?.object || {};

    // Phase 18: Idempotency Verification — prevent duplicate execution of the same Stripe event
    if (isSupabaseConfigured && supabase && event.id) {
      try {
        const { data: existingEvent } = await supabase
          .from('stripe_webhook_logs')
          .select('id')
          .eq('event_id', event.id)
          .maybeSingle();

        if (existingEvent) {
          console.log(`Webhook event ${event.id} (${event.type}) already processed. Returning idempotent 200.`);
          return NextResponse.json({ received: true, idempotent: true });
        }
      } catch (idempErr) {
        console.warn('Could not query webhook idempotency log:', idempErr);
      }
    }

    switch (eventType) {
      // 1. Checkout Session Completed (Subscriptions, Advisory, or One-Time Consultations)
      case 'checkout.session.completed': {
        const session = dataObject;
        const userId = session.metadata?.crediqly_user_id || session.metadata?.userId || session.client_reference_id;
        const plan = session.metadata?.crediqly_plan || session.metadata?.plan;
        const isAdvisory = plan === 'advisory' || plan === 'premium_advisory';
        const paymentType = session.metadata?.paymentType || (isAdvisory ? 'advisory' : session.mode === 'subscription' ? 'subscription' : 'consultation');
        const consultationId = session.metadata?.consultationId;

        if (userId) {
          // Handle Premium Advisory Checkout ($499 Setup + $149/mo Subscription)
          if (isAdvisory) {
            // 1. Record $499 Setup Payment
            await recordPayment({
              userId,
              stripeCustomerId: session.customer as string,
              stripeCheckoutSessionId: `${session.id}_setup`,
              stripePaymentIntentId: (session.payment_intent as string) || undefined,
              amount: 49900,
              currency: session.currency || 'usd',
              paymentType: 'advisory_setup',
              status: 'paid',
            });

            // 2. Record First Month $149 Advisory Subscription Payment
            await recordPayment({
              userId,
              stripeCustomerId: session.customer as string,
              stripeCheckoutSessionId: `${session.id}_monthly`,
              stripePaymentIntentId: (session.payment_intent as string) || undefined,
              amount: 14900,
              currency: session.currency || 'usd',
              paymentType: 'advisory_subscription',
              status: 'paid',
            });

            // 3. Activate Premium Advisory Subscription
            await upsertSubscription({
              userId,
              plan: 'premium_advisory',
              status: 'active',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              advisorySetupPaymentStatus: 'paid',
              advisorySetupPaidAt: new Date().toISOString(),
              advisorySetupCheckoutSessionId: session.id,
            });

            // 4. If user upgraded from an active Pro subscription, cancel old Pro subscription in Stripe to avoid double billing
            const oldProSubId = session.metadata?.supersededProSubscriptionId;
            if (oldProSubId && stripe) {
              try {
                await stripe.subscriptions.cancel(oldProSubId);
                console.log(`Cancelled superseded Pro subscription ${oldProSubId} for upgraded Advisory user ${userId}`);
              } catch (err: any) {
                console.warn('Could not cancel superseded Pro subscription:', err.message);
              }
            }
          } else {
            // Standard Consultation or Pro Subscription Checkout
            await recordPayment({
              userId,
              consultationId: consultationId || undefined,
              stripeCustomerId: session.customer as string,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: (session.payment_intent as string) || undefined,
              amount: session.amount_total || (paymentType === 'subscription' ? 3900 : 9900),
              currency: session.currency || 'usd',
              paymentType,
              status: 'paid',
            });

            // Handle Consultation Checkout
            if (paymentType === 'consultation' && consultationId) {
              await updateConsultationPaymentStatus(consultationId, 'paid', {
                checkoutSessionId: session.id,
                paymentIntentId: (session.payment_intent as string) || undefined,
                paidAt: new Date().toISOString(),
              });
            }

            // Handle Pro Subscription Checkout
            if (paymentType === 'subscription' || plan === 'pro') {
              await upsertSubscription({
                userId,
                plan: 'pro',
                status: 'active',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
              });
            }
          }
        }
        break;
      }

      // 2. Subscription Created or Updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = dataObject;
        const userId = sub.metadata?.crediqly_user_id || sub.metadata?.userId;
        const customerId = sub.customer as string;
        const planMetadata = sub.metadata?.crediqly_plan || sub.metadata?.plan;

        // Map Stripe subscription status to Crediqly status
        let mappedStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' = 'active';
        let mappedPlan: 'free' | 'pro' | 'premium_advisory' = (planMetadata === 'premium_advisory' || planMetadata === 'advisory') ? 'premium_advisory' : 'pro';

        if (sub.status === 'active') {
          mappedStatus = 'active';
        } else if (sub.status === 'trialing') {
          mappedStatus = 'trialing';
        } else if (sub.status === 'past_due') {
          mappedStatus = 'past_due';
        } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
          mappedStatus = 'cancelled';
          mappedPlan = 'free';
        }

        if (userId) {
          await upsertSubscription({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            plan: mappedPlan,
            status: mappedStatus,
            currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : undefined,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
            cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
          });
        }
        break;
      }

      // 3. Subscription Deleted (Expired / Terminated)
      case 'customer.subscription.deleted': {
        const sub = dataObject;
        const userId = sub.metadata?.crediqly_user_id || sub.metadata?.userId;

        if (userId) {
          await upsertSubscription({
            userId,
            plan: 'free',
            status: 'expired',
            cancelAtPeriodEnd: false,
          });
        }
        break;
      }

      // 4. Invoice Paid (Recurring monthly renewal success)
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = dataObject;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;
        const lineMeta = invoice.lines?.data?.[0]?.metadata;
        const userId = lineMeta?.crediqly_user_id || lineMeta?.userId || invoice.subscription_details?.metadata?.crediqly_user_id || invoice.subscription_details?.metadata?.userId;
        const planMeta = lineMeta?.crediqly_plan || lineMeta?.plan || invoice.subscription_details?.metadata?.crediqly_plan || invoice.subscription_details?.metadata?.plan;

        if (userId) {
          const isAdvisory = planMeta === 'advisory' || planMeta === 'premium_advisory';
          await recordPayment({
            userId,
            stripeCustomerId: customerId,
            stripeCheckoutSessionId: `inv_${invoice.id}`,
            stripePaymentIntentId: (invoice.payment_intent as string) || undefined,
            amount: invoice.amount_paid || (isAdvisory ? 14900 : 3900),
            currency: invoice.currency || 'usd',
            paymentType: isAdvisory ? 'advisory_subscription' : 'subscription',
            status: 'paid',
          });

          await upsertSubscription({
            userId,
            plan: isAdvisory ? 'premium_advisory' : 'pro',
            status: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
        }
        break;
      }

      // 5. Invoice Payment Failed
      case 'invoice.payment_failed': {
        const invoice = dataObject;
        const customerId = invoice.customer as string;
        const lineMeta = invoice.lines?.data?.[0]?.metadata;
        const userId = lineMeta?.crediqly_user_id || lineMeta?.userId || invoice.subscription_details?.metadata?.crediqly_user_id || invoice.subscription_details?.metadata?.userId;

        if (userId) {
          await recordPayment({
            userId,
            stripeCustomerId: customerId,
            stripeCheckoutSessionId: `inv_fail_${invoice.id}`,
            amount: invoice.amount_due || 3900,
            currency: invoice.currency || 'usd',
            paymentType: 'subscription',
            status: 'failed',
          });

          await upsertSubscription({
            userId,
            status: 'past_due',
          });
        }
        break;
      }

      // 6. Payment Intent Succeeded
      case 'payment_intent.succeeded': {
        const paymentIntent = dataObject;
        const userId = paymentIntent.metadata?.crediqly_user_id || paymentIntent.metadata?.userId;
        const plan = paymentIntent.metadata?.crediqly_plan || paymentIntent.metadata?.plan;

        if (userId) {
          const isAdvisory = plan === 'advisory' || plan === 'premium_advisory';
          await recordPayment({
            userId,
            stripeCustomerId: (paymentIntent.customer as string) || undefined,
            stripeCheckoutSessionId: `pi_${paymentIntent.id}`,
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount_received || paymentIntent.amount,
            currency: paymentIntent.currency || 'usd',
            paymentType: isAdvisory ? 'advisory_setup' : 'subscription',
            status: 'paid',
          });
        }
        break;
      }

      default:
        // Other events received and acknowledged cleanly
        break;
    }

    // Record processed event in stripe_webhook_logs for auditability and future idempotency
    if (isSupabaseConfigured && supabase && event.id) {
      try {
        await supabase.from('stripe_webhook_logs').insert([
          {
            event_id: event.id,
            event_type: event.type,
            status: 'success',
            summary: `Successfully processed ${event.type} for ${dataObject?.id || 'event'}`,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (logErr) {
        console.warn('Could not record webhook event log:', logErr);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Error processing Stripe webhook event ${event.type}:`, err);
    return NextResponse.json(
      { error: 'Webhook processing error.' },
      { status: 500 }
    );
  }
}
