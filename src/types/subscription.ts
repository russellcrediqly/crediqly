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

export type AccessSource =
  | 'stripe_subscription'
  | 'stripe_onetime'
  | 'admin_grant'
  | 'complimentary'
  | 'free';

export type GrantType =
  | 'paid'
  | 'complimentary'
  | 'admin_grant'
  | 'promotional';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider?: 'stripe' | 'admin' | 'internal' | 'none';
  accessSource?: AccessSource;
  grantType?: GrantType;
  grantedBy?: string;
  grantReason?: string;
  grantedAt?: string;
  expiresAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  billingStatus?: string;
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

export interface EffectiveEntitlement {
  effectivePlan: 'free' | 'foundation' | 'guided';
  accessSource: AccessSource;
  billingStatus: string;
  expiresAt?: string;
  isExpired: boolean;
  isComplimentary: boolean;
  isAdminGrant: boolean;
}

/**
 * Authoritative client/server access helper:
 * Returns true if the customer has an active Guided plan (or legacy Premium Advisory tier).
 * Strictly honors active period expiration (e.g. 12-month Guided program expiration or admin grant expiration).
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

  // Enforce admin grant expiration if explicit expiresAt is provided
  if (subscription.expiresAt) {
    const expires = new Date(subscription.expiresAt).getTime();
    if (!isNaN(expires) && expires <= Date.now()) {
      return false;
    }
  }

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
 * Also correctly honors active period for subscriptions set to cancel at period end or admin grants.
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

  // Enforce admin grant expiration if explicit expiresAt is provided
  if (subscription.expiresAt) {
    const expires = new Date(subscription.expiresAt).getTime();
    if (!isNaN(expires) && expires <= Date.now()) {
      return false;
    }
  }

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

/**
 * Calculate the authoritative effective entitlement with precedence:
 * 1. Active Stripe Subscription
 * 2. Active One-Time 12-Month Guided Purchase
 * 3. Active Admin Grant (Unexpired or Indefinite)
 * 4. Free Tier Default
 */
export function calculateEffectiveEntitlement(
  subscription?: Partial<Subscription> | null,
  payments?: PaymentRecord[]
): EffectiveEntitlement {
  if (!subscription) {
    return {
      effectivePlan: 'free',
      accessSource: 'free',
      billingStatus: 'none',
      isExpired: false,
      isComplimentary: false,
      isAdminGrant: false,
    };
  }

  const rawPlan = (subscription.plan || (subscription as any).plan_id || 'free').toLowerCase();
  const status = (subscription.status || 'free').toLowerCase();
  const provider = subscription.provider || 'none';
  const accessSource = subscription.accessSource;
  const grantType = subscription.grantType;

  // 1. Check if user has active Stripe recurring subscription
  const isStripeActive =
    provider === 'stripe' &&
    (status === 'active' || status === 'trialing') &&
    (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd).getTime() > Date.now());

  if (isStripeActive) {
    const plan = (rawPlan === 'guided' || rawPlan === 'premium_advisory') ? 'guided' : 'foundation';
    return {
      effectivePlan: plan,
      accessSource: 'stripe_subscription',
      billingStatus: status,
      expiresAt: subscription.currentPeriodEnd,
      isExpired: false,
      isComplimentary: false,
      isAdminGrant: false,
    };
  }

  // 2. Check if user has active One-Time 12-Month Guided purchase
  const hasOneTimeGuided =
    (accessSource === 'stripe_onetime' || rawPlan === 'guided') &&
    payments?.some((p) => (p.paymentType === 'guided_onetime' || p.paymentType === 'intensive') && p.status === 'paid');

  if (hasOneTimeGuided) {
    const isPeriodValid =
      !subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd).getTime() > Date.now();
    if (isPeriodValid) {
      return {
        effectivePlan: 'guided',
        accessSource: 'stripe_onetime',
        billingStatus: 'paid_onetime',
        expiresAt: subscription.currentPeriodEnd,
        isExpired: false,
        isComplimentary: false,
        isAdminGrant: false,
      };
    }
  }

  // 3. Check if user has active Admin Grant or Complimentary access
  const isAdminOrComplimentary =
    provider === 'admin' ||
    accessSource === 'admin_grant' ||
    accessSource === 'complimentary' ||
    grantType === 'admin_grant' ||
    grantType === 'complimentary' ||
    grantType === 'promotional';

  if (isAdminOrComplimentary) {
    const isExpired = subscription.expiresAt
      ? new Date(subscription.expiresAt).getTime() <= Date.now()
      : false;

    if (!isExpired && (status === 'active' || status === 'free')) {
      const plan = (rawPlan === 'guided' || rawPlan === 'premium_advisory') ? 'guided' : 'foundation';
      const isComp = grantType === 'complimentary' || accessSource === 'complimentary';
      return {
        effectivePlan: plan,
        accessSource: isComp ? 'complimentary' : 'admin_grant',
        billingStatus: isComp ? 'complimentary' : 'admin_grant',
        expiresAt: subscription.expiresAt,
        isExpired: false,
        isComplimentary: isComp,
        isAdminGrant: !isComp,
      };
    }
  }

  // 4. Default Free Tier
  return {
    effectivePlan: 'free',
    accessSource: 'free',
    billingStatus: subscription.billingStatus || 'free',
    isExpired: Boolean(subscription.expiresAt && new Date(subscription.expiresAt).getTime() <= Date.now()),
    isComplimentary: false,
    isAdminGrant: false,
  };
}
