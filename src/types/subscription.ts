export type SubscriptionPlan = 'free' | 'pro' | 'premium_advisory';

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'expired'
  | 'trialing';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  // Done-For-You Premium Advisory setup tracking ($499 one-time fee)
  advisorySetupPaymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  advisorySetupPaidAt?: string;
  advisorySetupCheckoutSessionId?: string;
  advisorySetupPaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentType =
  | 'subscription'
  | 'consultation'
  | 'advisory_setup'
  | 'advisory_subscription';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PaymentRecord {
  id: string;
  userId: string;
  consultationId?: string;
  stripeCustomerId?: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string;
  amount: number; // in cents, e.g. 3900 for $39, 9900 for $99, 49900 for $499, 14900 for $149
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authoritative client/server access helper:
 * Returns true only if the customer has an active Done-For-You Premium Advisory tier.
 */
export function hasPremiumAdvisory(subscription?: Partial<Subscription> | null): boolean {
  if (!subscription) return false;
  return (
    subscription.plan === 'premium_advisory' &&
    (subscription.status === 'active' || subscription.status === 'trialing')
  );
}

/**
 * Authoritative client/server access helper:
 * Returns true if the user has active Pro software access.
 * Premium Advisory customers strictly inherit all Pro software capabilities (Premium Advisory > Pro > Free).
 */
export function hasActiveProSubscription(subscription?: Partial<Subscription> | null): boolean {
  if (!subscription) return false;
  // Premium Advisory automatically grants all Pro software features
  if (hasPremiumAdvisory(subscription)) return true;
  return subscription.plan === 'pro' && (subscription.status === 'active' || subscription.status === 'trialing');
}
