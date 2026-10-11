/**
 * Authoritative Server-Side Entitlement Resolver for Crediqly
 * 
 * Centralizes the determination of a customer's effective plan access across all valid sources:
 * - Active Stripe Recurring Subscriptions (Foundation $47.99/mo, Guided $147.99/mo)
 * - Successful Qualifying One-Time Purchases (Guided 12-Month Program $997)
 * - Administrator Grants & Complimentary Access (with explicit expiration or indefinite)
 * - Canceled Subscriptions within active billing cycles (cancel_at_period_end grace)
 * - Payment Failures & 7-Day Grace Period (past_due)
 * - Refunds and Chargebacks (immediate revocation of refunded products)
 * - Free Tier Default ($0)
 * 
 * Strict Principle: Billing status is maintained separately from entitlement access.
 * Revoking an admin grant never revokes an independent active Stripe subscription.
 * Canceling a subscription never deletes or alters historical payment audit records.
 */

import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  AccessSource,
  PaymentRecord,
  EffectiveEntitlement,
} from '@/types/subscription';

export const PAST_DUE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days grace period

/**
 * Pure, deterministic entitlement calculator.
 * Evaluates verified database records and returns the authoritative EffectiveEntitlement.
 */
export function resolveEffectiveEntitlement(
  subscription?: Partial<Subscription> | null,
  payments?: PaymentRecord[] | null
): EffectiveEntitlement {
  const now = Date.now();

  // Identify refunded payments for one-time purchases
  const validPaidPayments = (payments || []).filter(
    (p) => p.status === 'paid' || (p.status as any) === 'succeeded'
  );
  const refundedPaymentIds = new Set(
    (payments || [])
      .filter((p) => p.status === 'refunded')
      .map((p) => p.stripePaymentIntentId || p.stripeCheckoutSessionId)
  );

  const hasRefundedOneTime = (payments || []).some(
    (p) =>
      p.status === 'refunded' &&
      (p.paymentType === 'guided_onetime' ||
        p.paymentType === 'intensive' ||
        (p as any).purchaseType === 'one_time_program' ||
        (p as any).plan === 'guided')
  );

  // Check for standalone qualifying one-time purchase from payments
  const qualifyingOneTimePayment = validPaidPayments.find(
    (p) =>
      (p.paymentType === 'guided_onetime' ||
        p.paymentType === 'intensive' ||
        (p as any).purchaseType === 'one_time_program' ||
        (p as any).plan === 'guided') &&
      !refundedPaymentIds.has(p.stripePaymentIntentId || p.stripeCheckoutSessionId)
  );

  const oneTimeExpiryMs = (qualifyingOneTimePayment as any)?.programAccessExpiresAt
    ? new Date((qualifyingOneTimePayment as any).programAccessExpiresAt).getTime()
    : undefined;
  const isOneTimePaymentActive =
    Boolean(qualifyingOneTimePayment) &&
    !hasRefundedOneTime &&
    (!oneTimeExpiryMs || oneTimeExpiryMs > now);

  // Baseline empty subscription fallback (while checking payments)
  if (!subscription) {
    if (isOneTimePaymentActive) {
      return {
        effectivePlan: 'guided',
        accessSource: 'stripe_onetime',
        billingStatus: 'paid_onetime',
        expiresAt: (qualifyingOneTimePayment as any)?.programAccessExpiresAt,
        isExpired: false,
        isComplimentary: false,
        isAdminGrant: false,
        hasGuidedAccess: true,
        hasFoundationAccess: true,
        isInGracePeriod: false,
        resolutionReason: 'Active Guided 12-Month Program ($997 one-time purchase from payment history).',
      };
    }

    return {
      effectivePlan: 'free',
      accessSource: 'free',
      billingStatus: hasRefundedOneTime ? 'refunded' : 'free',
      isExpired: false,
      isComplimentary: false,
      isAdminGrant: false,
      hasGuidedAccess: false,
      hasFoundationAccess: false,
      isInGracePeriod: false,
      resolutionReason: hasRefundedOneTime
        ? 'One-time program payment was refunded. Reverted to Free tier.'
        : 'No subscription record found. Assigned default Free tier.',
    };
  }

  const anySub = subscription as any;
  const rawPlan = (subscription.plan || anySub.plan_id || 'free').toLowerCase();
  const status = (subscription.status || 'free').toLowerCase() as SubscriptionStatus;
  const provider = subscription.provider || (subscription.stripeSubscriptionId ? 'stripe' : 'stripe');
  const accessSource = subscription.accessSource;
  const grantType = subscription.grantType;
  const billingStatus = subscription.billingStatus || status;

  // Admin grant explicit fields
  const adminGrantActive = Boolean(subscription.adminGrantActive ?? anySub.admin_grant_active);
  const adminGrantedPlan = ((subscription.adminGrantedPlan || anySub.admin_granted_plan || '') as string).toLowerCase();

  // Extract date boundaries
  const currentPeriodEndMs = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).getTime()
    : undefined;
  const expiresAtMs = subscription.expiresAt
    ? new Date(subscription.expiresAt).getTime()
    : undefined;
  const updatedAtMs = subscription.updatedAt
    ? new Date(subscription.updatedAt).getTime()
    : now;

  // -------------------------------------------------------------------------
  // 1. TIER 1 EVALUATION: GUIDED PLATFORM ACCESS ($147.99/mo or $997 12-Month)
  // -------------------------------------------------------------------------

  // 1A. Active Admin Grant for Guided Plan (Highest Precedence)
  const isGuidedAdminGrant =
    (adminGrantActive && (adminGrantedPlan === 'guided' || adminGrantedPlan === 'premium_advisory')) ||
    ((provider === 'admin' ||
      accessSource === 'admin_grant' ||
      accessSource === 'complimentary' ||
      grantType === 'admin_grant' ||
      grantType === 'complimentary' ||
      grantType === 'promotional') &&
      (rawPlan === 'guided' || rawPlan === 'premium_advisory'));

  if (isGuidedAdminGrant) {
    const isGrantUnexpired = !expiresAtMs || expiresAtMs > now;
    if (isGrantUnexpired) {
      const isComp = grantType === 'complimentary' || accessSource === 'complimentary';
      return {
        effectivePlan: 'guided',
        accessSource: isComp ? 'complimentary' : 'admin_grant',
        billingStatus: isComp ? 'complimentary' : 'admin_grant',
        expiresAt: subscription.expiresAt,
        isExpired: false,
        isComplimentary: isComp,
        isAdminGrant: !isComp,
        hasGuidedAccess: true,
        hasFoundationAccess: true,
        isInGracePeriod: false,
        resolutionReason: isComp
          ? 'Complimentary Guided access granted by platform administration.'
          : `Active administrator grant for Guided plan until ${subscription.expiresAt || 'indefinite'}.`,
      };
    }
  }

  // 1B. Active Recurring Stripe Guided Subscription
  const isStripeGuidedActive =
    provider !== 'admin' &&
    accessSource !== 'admin_grant' &&
    accessSource !== 'complimentary' &&
    grantType !== 'admin_grant' &&
    grantType !== 'complimentary' &&
    !adminGrantActive &&
    (rawPlan === 'guided' || rawPlan === 'premium_advisory' || rawPlan === 'advisory') &&
    accessSource !== 'stripe_onetime' &&
    (status === 'active' || status === 'trialing');

  if (isStripeGuidedActive) {
    // If canceled at period end, verify current period has not lapsed
    if (subscription.cancelAtPeriodEnd && currentPeriodEndMs && currentPeriodEndMs <= now) {
      // Period has concluded
    } else {
      return {
        effectivePlan: 'guided',
        accessSource: 'stripe_subscription',
        billingStatus: status,
        expiresAt: subscription.currentPeriodEnd,
        isExpired: false,
        isComplimentary: false,
        isAdminGrant: false,
        hasGuidedAccess: true,
        hasFoundationAccess: true,
        isInGracePeriod: false,
        resolutionReason: subscription.cancelAtPeriodEnd
          ? 'Active Stripe Guided subscription pending cancellation at period end.'
          : 'Active recurring Stripe Guided subscription in good standing ($147.99/mo).',
      };
    }
  }

  // 1C. Paid 12-Month Guided Program ($997 One-Time Purchase)
  const isOneTimeGuidedPurchased =
    (accessSource === 'stripe_onetime' || isOneTimePaymentActive) &&
    !hasRefundedOneTime;

  if (isOneTimeGuidedPurchased) {
    const expiry = subscription.currentPeriodEnd || (qualifyingOneTimePayment as any)?.programAccessExpiresAt;
    const isProgramActive = !currentPeriodEndMs || currentPeriodEndMs > now || !expiry || new Date(expiry).getTime() > now;
    if (isProgramActive) {
      return {
        effectivePlan: 'guided',
        accessSource: 'stripe_onetime',
        billingStatus: 'paid_onetime',
        expiresAt: expiry,
        isExpired: false,
        isComplimentary: false,
        isAdminGrant: false,
        hasGuidedAccess: true,
        hasFoundationAccess: true,
        isInGracePeriod: false,
        resolutionReason: 'Active Guided 12-Month Program ($997 one-time, no auto-renewal).',
      };
    }
  }

  // 1D. Guided Past Due Grace Period (7-day window)
  const isGuidedPastDue =
    (rawPlan === 'guided' || rawPlan === 'premium_advisory') &&
    (status === 'past_due' || billingStatus === 'past_due');

  if (isGuidedPastDue) {
    const referenceTime = currentPeriodEndMs || updatedAtMs;
    const gracePeriodEnd = referenceTime + PAST_DUE_GRACE_PERIOD_MS;
    if (now < gracePeriodEnd) {
      return {
        effectivePlan: 'guided',
        accessSource: 'stripe_subscription',
        billingStatus: 'past_due',
        expiresAt: new Date(gracePeriodEnd).toISOString(),
        isExpired: false,
        isComplimentary: false,
        isAdminGrant: false,
        hasGuidedAccess: true,
        hasFoundationAccess: true,
        isInGracePeriod: true,
        gracePeriodExpiresAt: new Date(gracePeriodEnd).toISOString(),
        resolutionReason: 'Guided subscription past due; within 7-day payment recovery grace period.',
      };
    }
  }

  // -------------------------------------------------------------------------
  // 2. TIER 2 EVALUATION: FOUNDATION PLATFORM ACCESS ($47.99/mo)
  // -------------------------------------------------------------------------

  const isFoundationPlan =
    rawPlan === 'foundation' ||
    rawPlan === 'pro' ||
    rawPlan === 'pro_monthly' ||
    rawPlan === 'pro_tier' ||
    rawPlan.includes('pro');

  // 2A. Active Admin Grant for Foundation Plan
  const isFoundationAdminGrant =
    (adminGrantActive && (adminGrantedPlan === 'foundation' || adminGrantedPlan === 'pro')) ||
    ((provider === 'admin' ||
      accessSource === 'admin_grant' ||
      accessSource === 'complimentary' ||
      grantType === 'admin_grant' ||
      grantType === 'complimentary' ||
      grantType === 'promotional') &&
      isFoundationPlan);

  if (isFoundationAdminGrant) {
    const isGrantUnexpired = !expiresAtMs || expiresAtMs > now;
    if (isGrantUnexpired) {
      const isComp = grantType === 'complimentary' || accessSource === 'complimentary';
      return {
        effectivePlan: 'foundation',
        accessSource: isComp ? 'complimentary' : 'admin_grant',
        billingStatus: isComp ? 'complimentary' : 'admin_grant',
        expiresAt: subscription.expiresAt,
        isExpired: false,
        isComplimentary: isComp,
        isAdminGrant: !isComp,
        hasGuidedAccess: false,
        hasFoundationAccess: true,
        isInGracePeriod: false,
        resolutionReason: isComp
          ? 'Complimentary Foundation access granted by administration.'
          : `Active administrator grant for Foundation plan until ${subscription.expiresAt || 'indefinite'}.`,
      };
    }
  }

  // 2B. Active Recurring Stripe Foundation Subscription
  const isStripeFoundationActive =
    provider !== 'admin' &&
    accessSource !== 'admin_grant' &&
    accessSource !== 'complimentary' &&
    grantType !== 'admin_grant' &&
    grantType !== 'complimentary' &&
    !adminGrantActive &&
    isFoundationPlan &&
    (status === 'active' || status === 'trialing');

  if (isStripeFoundationActive) {
    if (subscription.cancelAtPeriodEnd && currentPeriodEndMs && currentPeriodEndMs <= now) {
      // Period has lapsed
    } else {
      return {
        effectivePlan: 'foundation',
        accessSource: 'stripe_subscription',
        billingStatus: status,
        expiresAt: subscription.currentPeriodEnd,
        isExpired: false,
        isComplimentary: false,
        isAdminGrant: false,
        hasGuidedAccess: false,
        hasFoundationAccess: true,
        isInGracePeriod: false,
        resolutionReason: subscription.cancelAtPeriodEnd
          ? 'Active Foundation subscription pending cancellation at period end.'
          : 'Active recurring Stripe Foundation subscription ($47.99/mo).',
      };
    }
  }

  // 2C. Foundation Past Due Grace Period (7-day window)
  const isFoundationPastDue =
    isFoundationPlan && (status === 'past_due' || billingStatus === 'past_due');

  if (isFoundationPastDue) {
    const referenceTime = currentPeriodEndMs || updatedAtMs;
    const gracePeriodEnd = referenceTime + PAST_DUE_GRACE_PERIOD_MS;
    if (now < gracePeriodEnd) {
      return {
        effectivePlan: 'foundation',
        accessSource: 'stripe_subscription',
        billingStatus: 'past_due',
        expiresAt: new Date(gracePeriodEnd).toISOString(),
        isExpired: false,
        isComplimentary: false,
        isAdminGrant: false,
        hasGuidedAccess: false,
        hasFoundationAccess: true,
        isInGracePeriod: true,
        gracePeriodExpiresAt: new Date(gracePeriodEnd).toISOString(),
        resolutionReason: 'Foundation subscription past due; within 7-day payment recovery grace period.',
      };
    }
  }

  // 2D. Canceled Foundation Subscription with remaining paid time
  if (isFoundationPlan && subscription.cancelAtPeriodEnd && currentPeriodEndMs && currentPeriodEndMs > now) {
    return {
      effectivePlan: 'foundation',
      accessSource: 'stripe_subscription',
      billingStatus: 'cancelled',
      expiresAt: subscription.currentPeriodEnd,
      isExpired: false,
      isComplimentary: false,
      isAdminGrant: false,
      hasGuidedAccess: false,
      hasFoundationAccess: true,
      isInGracePeriod: false,
      resolutionReason: 'Canceled Foundation subscription; retaining access until active period end.',
    };
  }

  // -------------------------------------------------------------------------
  // 3. TIER 3: DEFAULT FREE TIER ($0)
  // -------------------------------------------------------------------------
  const isExplicitlyExpired = Boolean(
    (expiresAtMs && expiresAtMs <= now) ||
    (currentPeriodEndMs && currentPeriodEndMs <= now && (status === 'cancelled' || status === 'expired'))
  );

  let finalBillingStatus = billingStatus || 'free';
  if (hasRefundedOneTime) {
    finalBillingStatus = 'refunded';
  } else if (isExplicitlyExpired && finalBillingStatus === 'active') {
    finalBillingStatus = 'expired';
  }

  return {
    effectivePlan: 'free',
    accessSource: 'free',
    billingStatus: finalBillingStatus,
    isExpired: isExplicitlyExpired,
    isComplimentary: false,
    isAdminGrant: false,
    hasGuidedAccess: false,
    hasFoundationAccess: false,
    isInGracePeriod: false,
    resolutionReason: hasRefundedOneTime
      ? 'One-time program payment was refunded. Reverted to Free tier.'
      : isExplicitlyExpired
      ? 'Previous paid subscription or grant has expired. Reverted to Free tier.'
      : 'Default baseline Free plan ($0/mo).',
  };
}
