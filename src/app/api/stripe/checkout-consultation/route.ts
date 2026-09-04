import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured, STRIPE_CONFIG, getAppBaseUrl } from '@/lib/stripe/stripeServer';
import { createConsultationRequest, updateConsultationPaymentStatus } from '@/lib/supabase/consultationService';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      userId,
      customerEmail,
      consultationType = 'Business Credit',
      preferredDate,
      preferredTime = '10:00 AM',
      customerMessage = '',
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required to request a consultation.' },
        { status: 400 }
      );
    }

    if (!preferredDate) {
      return NextResponse.json(
        { error: 'Preferred consultation date is required.' },
        { status: 400 }
      );
    }

    // 1. Create a pending consultation record
    const pendingConsultation = await createConsultationRequest(
      {
        consultationType,
        preferredDate,
        preferredTime,
        customerMessage,
      },
      userId
    );

    // Initial status is pending payment
    await updateConsultationPaymentStatus(pendingConsultation.id, 'pending');

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json(
        {
          error: 'Stripe payments are not yet configured on this server. Please provide STRIPE_SECRET_KEY.',
          notConfigured: true,
          consultationId: pendingConsultation.id,
        },
        { status: 503 }
      );
    }

    const baseUrl = getAppBaseUrl(req);

    // Build line items ($99 one-time payment)
    const lineItems: any[] = STRIPE_CONFIG.consultationPriceId
      ? [{ price: STRIPE_CONFIG.consultationPriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Crediqly Advisory Consultation (${consultationType})`,
                description: `1-on-1 dedicated commercial credit strategy session on ${preferredDate} at ${preferredTime}.`,
              },
              unit_amount: STRIPE_CONFIG.consultationPriceCents,
            },
            quantity: 1,
          },
        ];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: `${baseUrl}/consultation?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/consultation?canceled=true`,
      metadata: {
        userId,
        consultationId: pendingConsultation.id,
        paymentType: 'consultation',
      },
      billing_address_collection: 'auto',
    });

    // Attach checkout session ID to consultation record
    await updateConsultationPaymentStatus(pendingConsultation.id, 'pending', {
      checkoutSessionId: session.id,
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      consultationId: pendingConsultation.id,
    });
  } catch (err: any) {
    console.error('Error creating Stripe Consultation checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize consultation payment checkout.' },
      { status: 500 }
    );
  }
}
