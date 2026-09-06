import { supabase, isSupabaseConfigured } from './client';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentRecord,
} from '@/types/subscription';

const SUBSCRIPTION_STORAGE_PREFIX = 'crediqly_sub_';

function getLocalSubscription(userId: string): Subscription | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${SUBSCRIPTION_STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalSubscription(userId: string, sub: Subscription): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${SUBSCRIPTION_STORAGE_PREFIX}${userId}`, JSON.stringify(sub));
    window.dispatchEvent(new CustomEvent('crediqly_subscription_updated', { detail: sub }));
  } catch {}
}

function defaultFreeSubscription(userId: string): Subscription {
  const now = new Date().toISOString();
  return {
    id: `sub_free_${userId.substring(0, 8)}`,
    userId,
    plan: 'free',
    status: 'free',
    createdAt: now,
    updatedAt: now,
  };
}

function fromDbSubscription(row: any): Subscription {
  const rawPlan = (row.plan || row.plan_id || '').toLowerCase();
  let plan: SubscriptionPlan = 'free';
  if (rawPlan === 'premium_advisory' || rawPlan === 'advisory') {
    plan = 'premium_advisory';
  } else if (rawPlan === 'pro' || rawPlan === 'pro_monthly' || rawPlan === 'pro_tier' || rawPlan.includes('pro')) {
    plan = 'pro';
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

  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id || row.provider_customer_id || undefined,
    stripeSubscriptionId: row.stripe_subscription_id || row.provider_subscription_id || undefined,
    plan,
    status,
    currentPeriodStart: row.current_period_start || undefined,
    currentPeriodEnd: row.current_period_end || undefined,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
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
  activeProCustomers: number;
  cancelledProCustomers: number;
  activeAdvisoryCustomers: number;
  cancelledAdvisoryCustomers: number;
  totalPaidConsultations: number;
  advisorySetupRevenueCents: number;
  advisoryMonthlyRevenueCents: number;
  totalRevenueCents: number;
  recentSubscriptions: Subscription[];
  recentPayments: PaymentRecord[];
}

/**
 * Aggregates platform monetization statistics for the Owner Admin Console.
 */
export async function getAdminBillingMetrics(): Promise<AdminBillingMetrics> {
  let totalCustomers = 0;
  let freeCustomers = 0;
  let activeProCustomers = 0;
  let cancelledProCustomers = 0;
  let activeAdvisoryCustomers = 0;
  let cancelledAdvisoryCustomers = 0;
  let totalPaidConsultations = 0;
  let advisorySetupRevenueCents = 0;
  let advisoryMonthlyRevenueCents = 0;
  let totalRevenueCents = 0;
  let recentSubscriptions: Subscription[] = [];
  let recentPayments: PaymentRecord[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const [profilesRes, subsRes, paymentsRes, consultsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('*').order('updated_at', { ascending: false }).limit(50),
        supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('consultations').select('id, payment_status, payment_amount'),
      ]);

      totalCustomers = profilesRes.count || 0;

      if (subsRes.data) {
        recentSubscriptions = subsRes.data.map(fromDbSubscription);
        activeProCustomers = recentSubscriptions.filter(
          (s) => s.plan === 'pro' && (s.status === 'active' || s.status === 'trialing')
        ).length;
        cancelledProCustomers = recentSubscriptions.filter(
          (s) => s.plan === 'pro' && (s.status === 'cancelled' || s.status === 'expired')
        ).length;
        activeAdvisoryCustomers = recentSubscriptions.filter(
          (s) => s.plan === 'premium_advisory' && (s.status === 'active' || s.status === 'trialing')
        ).length;
        cancelledAdvisoryCustomers = recentSubscriptions.filter(
          (s) => s.plan === 'premium_advisory' && (s.status === 'cancelled' || s.status === 'expired')
        ).length;
      }

      freeCustomers = Math.max(0, totalCustomers - activeProCustomers - activeAdvisoryCustomers);

      if (paymentsRes.data) {
        recentPayments = paymentsRes.data.map(fromDbPayment);
        totalRevenueCents = recentPayments
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        advisorySetupRevenueCents = recentPayments
          .filter((p) => p.status === 'paid' && p.paymentType === 'advisory_setup')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        advisoryMonthlyRevenueCents = recentPayments
          .filter((p) => p.status === 'paid' && p.paymentType === 'advisory_subscription')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      }

      if (consultsRes.data) {
        totalPaidConsultations = consultsRes.data.filter(
          (c: any) => c.payment_status === 'paid'
        ).length;
      }

      return {
        totalCustomers,
        freeCustomers,
        activeProCustomers,
        cancelledProCustomers,
        activeAdvisoryCustomers,
        cancelledAdvisoryCustomers,
        totalPaidConsultations,
        advisorySetupRevenueCents,
        advisoryMonthlyRevenueCents,
        totalRevenueCents,
        recentSubscriptions,
        recentPayments,
      };
    } catch (err) {
      console.warn('Failed to load DB billing metrics, using local fallback:', err);
    }
  }

  return {
    totalCustomers,
    freeCustomers,
    activeProCustomers,
    cancelledProCustomers,
    activeAdvisoryCustomers,
    cancelledAdvisoryCustomers,
    totalPaidConsultations,
    advisorySetupRevenueCents,
    advisoryMonthlyRevenueCents,
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


