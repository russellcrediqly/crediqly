export type SubscriptionPlan =
  | 'free'
  | 'foundation'
  | 'guided'
  // Legacy aliases maintained for backward compatibility with existing DB records
  | 'pro'
  | 'premium_advisory';

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
  // Legacy setup tracking
  advisorySetupPaymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  advisorySetupPaidAt?: string;
  advisorySetupCheckoutSessionId?: string;
  advisorySetupPaymentIntentId?: string;
  // Funding Readiness Intensive tracking ($999 one-time)
  intensivePaymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  intensivePaidAt?: string;
  intensiveCheckoutSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentType =
  | 'subscription'
  | 'foundation_subscription'
  | 'guided_subscription'
  | 'guided_onetime'
  | 'intensive'
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
  amount: number; // in cents, e.g. 4799 for $47.99, 14799 for $147.99, 99700 for $997.00
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authoritative client/server access helper:
 * Returns true if the customer has an active Guided plan (or legacy Premium Advisory tier).
 * Strictly honors active period expiration (e.g. 12-month Guided program expiration).
 */
export function hasGuidedAccess(subscription?: Partial<Subscription> | null): boolean {
  if (!subscription) return false;
  const plan = (subscription.plan || (subscription as any).plan_id || '').toLowerCase();
  const status = (subscription.status || '').toLowerCase();
  const isGuidedPlan =
    plan === 'guided' ||
    plan === 'premium_advisory' ||
    plan === 'advisory';

  if (!isGuidedPlan) return false;

  // Enforce period expiration (e.g. 12-month Guided program period has concluded)
  if (subscription.currentPeriodEnd) {
    const end = new Date(subscription.currentPeriodEnd).getTime();
    if (!isNaN(end) && end <= Date.now()) {
      return false;
    }
  }

  return (
    status === 'active' || status === 'trialing' || status === 'paid'
  );
}

/**
 * Backwards-compatible alias for hasGuidedAccess
 */
export const hasPremiumAdvisory = hasGuidedAccess;

/**
 * Authoritative client/server access helper:
 * Returns true if the user has active Foundation software access (or legacy Pro access).
 * Guided customers strictly inherit all Foundation software capabilities (Guided > Foundation > Free).
 * Also correctly honors active period for subscriptions set to cancel at period end.
 */
export function hasFoundationAccess(subscription?: Partial<Subscription> | null): boolean {
  if (!subscription) return false;
  // Guided automatically grants all Foundation features
  if (hasGuidedAccess(subscription)) return true;

  const plan = (subscription.plan || (subscription as any).plan_id || '').toLowerCase();
  const status = (subscription.status || '').toLowerCase();

  const isFoundationPlan =
    plan === 'foundation' ||
    plan === 'pro' ||
    plan === 'pro_monthly' ||
    plan === 'pro_tier' ||
    plan.includes('pro');

  if (!isFoundationPlan) return false;

  // Active, trialing, or paid status
  if (status === 'active' || status === 'trialing' || status === 'paid') {
    return true;
  }

  // Canceled but still within active paid period (cancel_at_period_end)
  if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
    const end = new Date(subscription.currentPeriodEnd).getTime();
    if (end > Date.now()) {
      return true;
    }
  }

  return false;
}

/**
 * Backwards-compatible alias for hasFoundationAccess
 */
export const hasActiveProSubscription = hasFoundationAccess;
