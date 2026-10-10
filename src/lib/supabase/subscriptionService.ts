import { supabase, isSupabaseConfigured } from './client';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentRecord,
  AccessSource,
  GrantType,
} from '@/types/subscription';
import { logAdminAction } from './adminAuditService';

const SUBSCRIPTION_STORAGE_PREFIX = 'crediqly_sub_';
const inMemorySubs = new Map<string, Subscription>();

function getLocalSubscription(userId: string): Subscription | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${SUBSCRIPTION_STORAGE_PREFIX}${userId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return inMemorySubs.get(userId) || null;
}

function saveLocalSubscription(userId: string, sub: Subscription): void {
  inMemorySubs.set(userId, sub);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${SUBSCRIPTION_STORAGE_PREFIX}${userId}`, JSON.stringify(sub));
      window.dispatchEvent(new CustomEvent('crediqly_subscription_updated', { detail: sub }));
    } catch {}
  }
}

function defaultFreeSubscription(userId: string): Subscription {
  const now = new Date().toISOString();
  return {
    id: `sub_free_${userId.substring(0, 8)}`,
    userId,
    plan: 'free',
    status: 'free',
    provider: 'none',
    accessSource: 'free',
    billingStatus: 'free',
    createdAt: now,
    updatedAt: now,
  };
}

function fromDbSubscription(row: any): Subscription {
  const rawPlan = (row.plan || row.plan_id || '').toLowerCase();
  let plan: SubscriptionPlan = 'free';
  if (rawPlan === 'guided' || rawPlan === 'premium_advisory' || rawPlan === 'advisory') {
    plan = 'guided';
  } else if (rawPlan === 'foundation' || rawPlan === 'pro' || rawPlan === 'pro_monthly' || rawPlan === 'pro_tier' || rawPlan.includes('pro')) {
    plan = 'foundation';
  }

  const rawStatus = (row.status || '').toLowerCase();
  let status: SubscriptionStatus = 'free';
  if (rawStatus === 'active' || rawStatus === 'paid') {
    status = 'active';
  } else if (rawStatus === 'trialing') {
    status = 'trialing';
  } else if (rawStatus === 'cancelled' || rawStatus === 'canceled') {
    status = 'cancelled';
  } else if (rawStatus === 'past_due') {
    status = 'past_due';
  } else if (rawStatus === 'expired') {
    status = 'expired';
  } else if (rawStatus) {
    status = rawStatus as SubscriptionStatus;
  }

  // Determine authoritative access source
  const provider = row.provider || (row.stripe_subscription_id ? 'stripe' : 'none');
  let accessSource: AccessSource = (row.access_source as AccessSource) || 'free';
  if (!row.access_source) {
    if (provider === 'stripe') {
      accessSource = row.stripe_subscription_id ? 'stripe_subscription' : 'stripe_onetime';
    } else if (provider === 'admin') {
      accessSource = row.grant_type === 'complimentary' ? 'complimentary' : 'admin_grant';
    } else if (plan === 'free') {
      accessSource = 'free';
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id || row.provider_customer_id || undefined,
    stripeSubscriptionId: row.stripe_subscription_id || row.provider_subscription_id || undefined,
    plan,
    status,
    provider: provider as any,
    accessSource,
    grantType: row.grant_type || undefined,
    grantedBy: row.granted_by || undefined,
    grantReason: row.grant_reason || undefined,
    grantedAt: row.granted_at || undefined,
    expiresAt: row.expires_at || undefined,
    currentPeriodStart: row.current_period_start || undefined,
    currentPeriodEnd: row.current_period_end || undefined,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    billingStatus: row.billing_status || (provider === 'stripe' ? status : provider === 'admin' ? (row.grant_type === 'complimentary' ? 'complimentary' : 'admin_grant') : 'free'),
    advisorySetupPaymentStatus: row.advisory_setup_payment_status || undefined,
    advisorySetupPaidAt: row.advisory_setup_paid_at || undefined,
    advisorySetupCheckoutSessionId: row.advisory_setup_checkout_session_id || undefined,
    advisorySetupPaymentIntentId: row.advisory_setup_payment_intent_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lookup subscription record by Stripe customer ID.
 */
export async function getSubscriptionByCustomerId(customerId: string): Promise<Subscription | null> {
  if (!customerId) return null;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .or(`stripe_customer_id.eq.${customerId},provider_customer_id.eq.${customerId}`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return fromDbSubscription(data);
      }
    } catch (err) {
      console.warn('Lookup subscription by customer ID failed:', err);
    }
  }
  return null;
}

function fromDbPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    consultationId: row.consultation_id || undefined,
    stripeCustomerId: row.stripe_customer_id || undefined,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    amount: row.amount,
    currency: row.currency || 'usd',
    paymentType: row.payment_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch a customer's subscription record.
 * Falls back to default Free plan if not yet created.
 */
export async function getUserSubscription(userId: string): Promise<Subscription> {
  if (!userId) {
    return defaultFreeSubscription('guest');
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const sub = fromDbSubscription(data);
        saveLocalSubscription(userId, sub);
        return sub;
      }
    } catch (err) {
      console.warn('Supabase subscriptions fetch failed, using fallback:', err);
    }
  }

  const local = getLocalSubscription(userId);
  if (local) return local;

  const fallback = defaultFreeSubscription(userId);
  saveLocalSubscription(userId, fallback);
  return fallback;
}

export const getSubscription = getUserSubscription;

/**
 * Upsert or update a customer subscription (Authoritative server sync & admin).
 */
export async function upsertSubscription(
  subscription: Partial<Subscription> & { userId: string }
): Promise<Subscription> {
  const userId = subscription.userId;
  const now = new Date().toISOString();

  const payload: any = {
    user_id: userId,
    plan: subscription.plan || 'free',
    status: subscription.status || 'free',
    updated_at: now,
  };

  if (subscription.provider !== undefined) payload.provider = subscription.provider;
  if (subscription.accessSource !== undefined) payload.access_source = subscription.accessSource;
  if (subscription.grantType !== undefined) payload.grant_type = subscription.grantType;
  if (subscription.grantedBy !== undefined) payload.granted_by = subscription.grantedBy;
  if (subscription.grantReason !== undefined) payload.grant_reason = subscription.grantReason;
  if (subscription.grantedAt !== undefined) payload.granted_at = subscription.grantedAt;
  if (subscription.expiresAt !== undefined) payload.expires_at = subscription.expiresAt;
  if (subscription.billingStatus !== undefined) payload.billing_status = subscription.billingStatus;

  if (subscription.stripeCustomerId !== undefined) {
    payload.stripe_customer_id = subscription.stripeCustomerId;
    payload.provider_customer_id = subscription.stripeCustomerId;
  }
  if (subscription.stripeSubscriptionId !== undefined) {
    payload.stripe_subscription_id = subscription.stripeSubscriptionId;
    payload.provider_subscription_id = subscription.stripeSubscriptionId;
  }
  payload.plan_id = subscription.plan || 'free';
  if (subscription.currentPeriodStart !== undefined) payload.current_period_start = subscription.currentPeriodStart;
  if (subscription.currentPeriodEnd !== undefined) payload.current_period_end = subscription.currentPeriodEnd;
  if (subscription.cancelAtPeriodEnd !== undefined) payload.cancel_at_period_end = subscription.cancelAtPeriodEnd;
  if (subscription.advisorySetupPaymentStatus !== undefined) payload.advisory_setup_payment_status = subscription.advisorySetupPaymentStatus;
  if (subscription.advisorySetupPaidAt !== undefined) payload.advisory_setup_paid_at = subscription.advisorySetupPaidAt;
  if (subscription.advisorySetupCheckoutSessionId !== undefined) payload.advisory_setup_checkout_session_id = subscription.advisorySetupCheckoutSessionId;
  if (subscription.advisorySetupPaymentIntentId !== undefined) payload.advisory_setup_payment_intent_id = subscription.advisorySetupPaymentIntentId;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      // Also update profiles table for admin / user list consistency
      try {
        await supabase
          .from('profiles')
          .update({
            plan: subscription.plan || 'free',
            subscription_status: subscription.status || 'active',
            updated_at: now,
          })
          .eq('user_id', userId);
      } catch (profErr) {}

      if (!error && data) {
        const sub = fromDbSubscription(data);
        saveLocalSubscription(userId, sub);
        return sub;
      }
    } catch (err) {
      console.warn('Supabase subscription upsert failed, saving locally:', err);
    }
  }

  const current = getLocalSubscription(userId) || defaultFreeSubscription(userId);
  const merged: Subscription = {
    ...current,
    ...subscription,
    updatedAt: now,
  };
  saveLocalSubscription(userId, merged);
  return merged;
}

export interface GrantAdminPlanParams {
  userId: string;
  plan: 'foundation' | 'guided';
  grantType: 'admin_grant' | 'complimentary' | 'promotional';
  durationMonths?: number;
  isIndefinite?: boolean;
  reason: string;
  adminEmail: string;
}

/**
 * Manually grant Foundation or Guided access to a customer.
 * Strict rule: NEVER generates a fake Stripe payment or fake Stripe subscription.
 */
export async function grantAdminPlanAccess(params: GrantAdminPlanParams): Promise<Subscription> {
  const { userId, plan, grantType, durationMonths, isIndefinite, reason, adminEmail } = params;
  const now = new Date();
  let expiresAt: string | undefined = undefined;

  if (!isIndefinite && durationMonths && durationMonths > 0) {
    const expDate = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
    expiresAt = expDate.toISOString();
  }

  const accessSource: AccessSource = grantType === 'complimentary' ? 'complimentary' : 'admin_grant';

  // Get current subscription to preserve existing Stripe references if any
  const existing = await getUserSubscription(userId);

  const updated = await upsertSubscription({
    userId,
    plan,
    status: 'active',
    provider: 'admin',
    accessSource,
    grantType,
    grantedBy: adminEmail,
    grantReason: reason,
    grantedAt: now.toISOString(),
    expiresAt,
    billingStatus: grantType === 'complimentary' ? 'complimentary' : 'admin_grant',
    stripeCustomerId: existing.stripeCustomerId,
    stripeSubscriptionId: existing.stripeSubscriptionId,
  });

  // Log admin audit entry
  await logAdminAction({
    adminEmail,
    action: 'GRANT_PLAN_ACCESS',
    entityType: 'customer',
    entityId: userId,
    description: `Granted ${grantType === 'complimentary' ? 'Complimentary' : 'Administrative'} ${plan.toUpperCase()} access (${isIndefinite ? 'Indefinite' : `${durationMonths} months`}). Reason: ${reason}`,
    previousValue: { plan: existing.plan, provider: existing.provider, status: existing.status },
    newValue: { plan, provider: 'admin', grantType, expiresAt, reason },
  });

  return updated;
}

/**
 * Revoke administrative access. Recalculates effective entitlements with precedence:
 * If the user has an active Stripe subscription, falls back to that paid subscription!
 * Otherwise, cleanly reverts to Free tier ($0).
 */
export async function revokeAdminPlanAccess(params: {
  userId: string;
  reason: string;
  adminEmail: string;
}): Promise<Subscription> {
  const { userId, reason, adminEmail } = params;
  const existing = await getUserSubscription(userId);

  // Precedence fallback calculation
  let fallbackPlan: SubscriptionPlan = 'free';
  let fallbackStatus: SubscriptionStatus = 'free';
  let fallbackProvider: 'stripe' | 'internal' = 'internal';
  let fallbackAccessSource: AccessSource = 'free';
  let fallbackBillingStatus = 'free';

  // Check if valid Stripe subscription exists
  if (existing.stripeSubscriptionId && existing.stripeCustomerId) {
    const isPeriodValid = existing.currentPeriodEnd
      ? new Date(existing.currentPeriodEnd).getTime() > Date.now()
      : false;
    if (isPeriodValid) {
      fallbackPlan = (existing.plan === 'guided' ? 'guided' : 'foundation');
      fallbackStatus = 'active';
      fallbackProvider = 'stripe';
      fallbackAccessSource = 'stripe_subscription';
      fallbackBillingStatus = 'active';
    }
  }

  const updated = await upsertSubscription({
    userId,
    plan: fallbackPlan,
    status: fallbackStatus,
    provider: fallbackProvider,
    accessSource: fallbackAccessSource,
    grantType: undefined,
    grantedBy: undefined,
    grantReason: undefined,
    grantedAt: undefined,
    expiresAt: undefined,
    billingStatus: fallbackBillingStatus,
    stripeCustomerId: existing.stripeCustomerId,
    stripeSubscriptionId: existing.stripeSubscriptionId,
  });

  await logAdminAction({
    adminEmail,
    action: 'REVOKE_PLAN_ACCESS',
    entityType: 'customer',
    entityId: userId,
    description: `Revoked administrative access. Recalculated effective entitlement: ${fallbackPlan.toUpperCase()} (${fallbackAccessSource}). Reason: ${reason}`,
    previousValue: { plan: existing.plan, provider: existing.provider },
    newValue: { plan: fallbackPlan, provider: fallbackProvider },
  });

  return updated;
}

/**
 * Extend an active administrative plan entitlement.
 */
export async function extendAdminPlanAccess(params: {
  userId: string;
  additionalMonths: number;
  reason: string;
  adminEmail: string;
}): Promise<Subscription> {
  const { userId, additionalMonths, reason, adminEmail } = params;
  const existing = await getUserSubscription(userId);

  const baseTime = existing.expiresAt ? Math.max(Date.now(), new Date(existing.expiresAt).getTime()) : Date.now();
  const newExpiresAt = new Date(baseTime + additionalMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

  const updated = await upsertSubscription({
    ...existing,
    userId,
    expiresAt: newExpiresAt,
  });

  await logAdminAction({
    adminEmail,
    action: 'EXTEND_PLAN_ACCESS',
    entityType: 'customer',
    entityId: userId,
    description: `Extended administrative plan access by ${additionalMonths} months to ${new Date(newExpiresAt).toLocaleDateString()}. Reason: ${reason}`,
    previousValue: { expiresAt: existing.expiresAt },
    newValue: { expiresAt: newExpiresAt },
  });

  return updated;
}

/**
 * Record a payment event in the payments audit table.
 */
export async function recordPayment(
  payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PaymentRecord> {
  const now = new Date().toISOString();
  const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const payload: any = {
    user_id: payment.userId,
    consultation_id: payment.consultationId || null,
    stripe_customer_id: payment.stripeCustomerId || null,
    stripe_checkout_session_id: payment.stripeCheckoutSessionId,
    stripe_payment_intent_id: payment.stripePaymentIntentId || null,
    amount: payment.amount,
    currency: payment.currency || 'usd',
    payment_type: payment.paymentType,
    status: payment.status,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .upsert(payload, { onConflict: 'stripe_checkout_session_id' })
        .select()
        .single();

      if (!error && data) {
        return fromDbPayment(data);
      }
    } catch (err) {
      console.warn('Supabase payment record failed, storing locally:', err);
    }
  }

  return {
    ...payment,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

export interface AdminBillingMetrics {
  totalCustomers: number;
  freeCustomers: number;
  foundationCustomers: number;
  guidedMonthlyCustomers: number;
  guidedOneTimeCustomers: number;
  adminGrantedCustomers: number;
  complimentaryCustomers: number;
  activeProCustomers: number; // legacy alias for foundationCustomers
  activeAdvisoryCustomers: number; // legacy alias for guidedMonthlyCustomers + guidedOneTimeCustomers
  cancelledProCustomers: number;
  cancelledAdvisoryCustomers: number;
  totalPaidConsultations: number;
  recurringMrrCents: number;
  oneTimeRevenueCents: number;
  advisorySetupRevenueCents?: number;
  intensiveRevenueCents?: number;
  totalRevenueCents: number;
  recentSubscriptions: Subscription[];
  recentPayments: PaymentRecord[];
}

/**
 * Aggregates platform monetization statistics for the Owner Admin Console.
 * Strictly separates recurring revenue, one-time purchases, and admin/complimentary grants ($0).
 */
export async function getAdminBillingMetrics(): Promise<AdminBillingMetrics> {
  let totalCustomers = 0;
  let freeCustomers = 0;
  let foundationCustomers = 0;
  let guidedMonthlyCustomers = 0;
  let guidedOneTimeCustomers = 0;
  let adminGrantedCustomers = 0;
  let complimentaryCustomers = 0;
  let activeProCustomers = 0;
  let cancelledProCustomers = 0;
  let activeAdvisoryCustomers = 0;
  let cancelledAdvisoryCustomers = 0;
  let totalPaidConsultations = 0;
  let recurringMrrCents = 0;
  let oneTimeRevenueCents = 0;
  let totalRevenueCents = 0;
  let recentSubscriptions: Subscription[] = [];
  let recentPayments: PaymentRecord[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const [profilesRes, subsRes, paymentsRes, consultsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('*').order('updated_at', { ascending: false }).limit(100),
        supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('consultations').select('id, payment_status, payment_amount'),
      ]);

      totalCustomers = profilesRes.count || 0;

      if (subsRes.data) {
        recentSubscriptions = subsRes.data.map(fromDbSubscription);

        foundationCustomers = recentSubscriptions.filter(
          (s) =>
            (s.plan === 'foundation' || s.plan === 'pro') &&
            (s.status === 'active' || s.status === 'trialing') &&
            s.provider === 'stripe'
        ).length;

        guidedMonthlyCustomers = recentSubscriptions.filter(
          (s) =>
            (s.plan === 'guided' || s.plan === 'premium_advisory') &&
            (s.status === 'active' || s.status === 'trialing') &&
            s.provider === 'stripe' &&
            s.accessSource !== 'stripe_onetime'
        ).length;

        guidedOneTimeCustomers = recentSubscriptions.filter(
          (s) =>
            (s.plan === 'guided' || s.plan === 'premium_advisory') &&
            (s.accessSource === 'stripe_onetime' || s.billingStatus === 'paid_onetime')
        ).length;

        adminGrantedCustomers = recentSubscriptions.filter(
          (s) =>
            s.provider === 'admin' &&
            s.accessSource !== 'complimentary' &&
            s.grantType !== 'complimentary' &&
            (!s.expiresAt || new Date(s.expiresAt).getTime() > Date.now())
        ).length;

        complimentaryCustomers = recentSubscriptions.filter(
          (s) =>
            (s.accessSource === 'complimentary' || s.grantType === 'complimentary') &&
            (!s.expiresAt || new Date(s.expiresAt).getTime() > Date.now())
        ).length;

        cancelledProCustomers = recentSubscriptions.filter(
          (s) => (s.plan === 'foundation' || s.plan === 'pro') && (s.status === 'cancelled' || s.status === 'expired')
        ).length;

        cancelledAdvisoryCustomers = recentSubscriptions.filter(
          (s) => (s.plan === 'guided' || s.plan === 'premium_advisory') && (s.status === 'cancelled' || s.status === 'expired')
        ).length;

        activeProCustomers = foundationCustomers;
        activeAdvisoryCustomers = guidedMonthlyCustomers + guidedOneTimeCustomers;
      }

      freeCustomers = Math.max(
        0,
        totalCustomers - foundationCustomers - guidedMonthlyCustomers - guidedOneTimeCustomers - adminGrantedCustomers - complimentaryCustomers
      );

      if (paymentsRes.data) {
        recentPayments = paymentsRes.data.map(fromDbPayment);
        const paidPayments = recentPayments.filter((p) => p.status === 'paid');

        totalRevenueCents = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        oneTimeRevenueCents = paidPayments
          .filter((p) => p.paymentType === 'guided_onetime' || p.paymentType === 'intensive' || p.paymentType === 'consultation')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      }

      // Calculate MRR strictly from recurring subscriptions
      recurringMrrCents = Math.round(foundationCustomers * 4799 + guidedMonthlyCustomers * 14799);

      if (consultsRes.data) {
        totalPaidConsultations = consultsRes.data.filter(
          (c: any) => c.payment_status === 'paid'
        ).length;
      }

      return {
        totalCustomers,
        freeCustomers,
        foundationCustomers,
        guidedMonthlyCustomers,
        guidedOneTimeCustomers,
        adminGrantedCustomers,
        complimentaryCustomers,
        activeProCustomers,
        cancelledProCustomers,
        activeAdvisoryCustomers,
        cancelledAdvisoryCustomers,
        totalPaidConsultations,
        recurringMrrCents,
        oneTimeRevenueCents,
        advisorySetupRevenueCents: oneTimeRevenueCents,
        intensiveRevenueCents: oneTimeRevenueCents,
        totalRevenueCents,
        recentSubscriptions,
        recentPayments,
      };
    } catch (err) {
      console.warn('Failed to load DB billing metrics, using fallback:', err);
    }
  }

  return {
    totalCustomers,
    freeCustomers,
    foundationCustomers,
    guidedMonthlyCustomers,
    guidedOneTimeCustomers,
    adminGrantedCustomers,
    complimentaryCustomers,
    activeProCustomers,
    cancelledProCustomers,
    activeAdvisoryCustomers,
    cancelledAdvisoryCustomers,
    totalPaidConsultations,
    recurringMrrCents,
    oneTimeRevenueCents,
    advisorySetupRevenueCents: oneTimeRevenueCents,
    intensiveRevenueCents: oneTimeRevenueCents,
    totalRevenueCents,
    recentSubscriptions,
    recentPayments,
  };
}

export interface AdminPaymentListItem extends PaymentRecord {
  userEmail?: string;
  userName?: string;
  businessName?: string;
}

/**
 * Fetch all payments with joined customer information for the Admin Payments ledger.
 */
export async function getAllPaymentsAdmin(): Promise<AdminPaymentListItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: payments },
        { data: profiles },
        { data: businesses },
      ] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, email, first_name, last_name'),
        supabase.from('businesses').select('user_id, business_name'),
      ]);

      const profMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const bizMap = new Map((businesses || []).map((b) => [b.user_id, b]));

      return (payments || []).map((p) => {
        const prof = profMap.get(p.user_id);
        const biz = bizMap.get(p.user_id);
        return {
          ...fromDbPayment(p),
          userEmail: prof?.email || 'customer@crediqly.com',
          userName: prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || prof.email : undefined,
          businessName: biz?.business_name,
        };
      });
    } catch (err) {
      console.warn('Failed to load admin payments:', err);
    }
  }

  // Return empty list if database is empty or unconfigured (no fake/placeholder demo data)
  return [];
}


