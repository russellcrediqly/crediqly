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
  adminGrantActive?: boolean;
  adminGrantedPlan?: SubscriptionPlan;
  adminGrantReason?: string;
  adminRevokedAt?: string;
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
  hasGuidedAccess: boolean;
  hasFoundationAccess: boolean;
  isInGracePeriod?: boolean;
  gracePeriodExpiresAt?: string;
  resolutionReason?: string;
}

import { resolveEffectiveEntitlement } from '@/lib/services/entitlementResolver';

/**
 * Authoritative client/server access helper:
 * Returns true if the customer has an active Guided plan (or legacy Premium Advisory tier).
 * Strictly honors active period expiration, 12-month Guided programs, and 7-day past-due grace period.
 */
export function hasGuidedAccess(subscription?: Partial<Subscription> | null): boolean {
  return resolveEffectiveEntitlement(subscription).hasGuidedAccess;
}

/**
 * Backwards-compatible alias for hasGuidedAccess
 */
export const hasPremiumAdvisory = hasGuidedAccess;

/**
 * Authoritative client/server access helper:
 * Returns true if the user has active Foundation software access (or legacy Pro access).
 * Guided customers strictly inherit all Foundation software capabilities (Guided > Foundation > Free).
 * Also correctly honors active period for subscriptions set to cancel at period end, admin grants, and grace periods.
 */
export function hasFoundationAccess(subscription?: Partial<Subscription> | null): boolean {
  return resolveEffectiveEntitlement(subscription).hasFoundationAccess;
}

/**
 * Backwards-compatible alias for hasFoundationAccess
 */
export const hasActiveProSubscription = hasFoundationAccess;

/**
 * Calculate the authoritative effective entitlement with precedence and full source reconciliation.
 */
export function calculateEffectiveEntitlement(
  subscription?: Partial<Subscription> | null,
  payments?: PaymentRecord[]
): EffectiveEntitlement {
  return resolveEffectiveEntitlement(subscription, payments);
}

