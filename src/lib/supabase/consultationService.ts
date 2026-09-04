import { supabase, isSupabaseConfigured } from './client';
import {
  Consultation,
  ConsultationInput,
  ConsultationAdminUpdateInput,
  ConsultationStatus,
} from '@/types/consultation';

const LOCAL_CONSULTATIONS_KEY = 'crediqly_consultations';

function getLocalConsultations(): Consultation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CONSULTATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read local consultations:', err);
    return [];
  }
}

function saveLocalConsultations(items: Consultation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CONSULTATIONS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to write local consultations:', err);
  }
}

function toDbRow(item: Partial<Consultation>): any {
  const row: any = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.userId !== undefined) row.user_id = item.userId;
  if (item.consultationType !== undefined) row.consultation_type = item.consultationType;
  if (item.preferredDate !== undefined) row.preferred_date = item.preferredDate;
  if (item.preferredTime !== undefined) row.preferred_time = item.preferredTime;
  if (item.confirmedDate !== undefined) row.confirmed_date = item.confirmedDate;
  if (item.confirmedTime !== undefined) row.confirmed_time = item.confirmedTime;
  if (item.status !== undefined) row.status = item.status;
  if (item.paymentStatus !== undefined) row.payment_status = item.paymentStatus;
  if (item.paymentAmount !== undefined) row.payment_amount = item.paymentAmount;
  if (item.stripeCheckoutSessionId !== undefined) row.stripe_checkout_session_id = item.stripeCheckoutSessionId;
  if (item.stripePaymentIntentId !== undefined) row.stripe_payment_intent_id = item.stripePaymentIntentId;
  if (item.paidAt !== undefined) row.paid_at = item.paidAt;
  if (item.customerMessage !== undefined) row.customer_message = item.customerMessage;
  if (item.adminMessage !== undefined) row.admin_message = item.adminMessage;
  if (item.createdAt !== undefined) row.created_at = item.createdAt;
  if (item.updatedAt !== undefined) row.updated_at = item.updatedAt;
  return row;
}

function fromDbRow(row: any): Consultation {
  return {
    id: row.id,
    userId: row.user_id,
    consultationType: row.consultation_type,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    confirmedDate: row.confirmed_date || undefined,
    confirmedTime: row.confirmed_time || undefined,
    status: row.status as ConsultationStatus,
    paymentStatus: row.payment_status || 'unpaid',
    paymentAmount: typeof row.payment_amount === 'number' ? row.payment_amount : Number(row.payment_amount) || 99,
    stripeCheckoutSessionId: row.stripe_checkout_session_id || undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    paidAt: row.paid_at || undefined,
    customerMessage: row.customer_message || '',
    adminMessage: row.admin_message || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all consultation requests for a specific customer.
 */
export async function getUserConsultations(userId: string): Promise<Consultation[]> {
  if (!userId) return [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(fromDbRow);
      }
    } catch (err) {
      console.warn('Supabase consultations query failed, using local fallback:', err);
    }
  }

  return getLocalConsultations().filter((c) => c.userId === userId);
}

/**
 * Customer submits a new consultation request.
 * Initial status is strictly "Requested".
 */
export async function createConsultationRequest(
  input: ConsultationInput,
  userId: string
): Promise<Consultation> {
  if (!userId) throw new Error('User authentication required to request a consultation');
  if (!input.consultationType) throw new Error('Consultation type is required');
  if (!input.preferredDate) throw new Error('Preferred date is required');
  if (!input.preferredTime) throw new Error('Preferred time is required');

  const newConsultation: Consultation = {
    id: `consult_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    consultationType: input.consultationType,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    status: 'Requested',
    paymentStatus: input.paymentStatus || 'unpaid',
    paymentAmount: input.paymentAmount !== undefined ? input.paymentAmount : 99.00,
    customerMessage: input.customerMessage?.trim() || '',
    adminMessage: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert([toDbRow(newConsultation)])
        .select()
        .single();

      if (!error && data) {
        const created = fromDbRow(data);
        const current = getLocalConsultations();
        saveLocalConsultations([created, ...current]);
        return created;
      }
    } catch (err) {
      console.warn('Supabase create consultation failed, persisting locally:', err);
    }
  }

  const current = getLocalConsultations();
  saveLocalConsultations([newConsultation, ...current]);
  return newConsultation;
}

/**
 * Customer cancels their own eligible consultation request.
 * Permitted only when current status is "Requested" or "Rescheduled".
 * Does NOT delete the record, sets status to "Cancelled".
 */
export async function cancelConsultationCustomer(
  id: string,
  userId: string
): Promise<Consultation | null> {
  if (!userId) throw new Error('User authentication required');

  const updates = {
    status: 'Cancelled' as ConsultationStatus,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .in('status', ['Requested', 'Rescheduled'])
        .select()
        .single();

      if (!error && data) {
        const updated = fromDbRow(data);
        const current = getLocalConsultations();
        saveLocalConsultations(current.map((c) => (c.id === id ? updated : c)));
        return updated;
      }
    } catch (err) {
      console.warn('Supabase cancel consultation failed, falling back locally:', err);
    }
  }

  const current = getLocalConsultations();
  const idx = current.findIndex((c) => c.id === id && c.userId === userId);
  if (idx === -1) return null;

  const item = current[idx];
  if (item.status !== 'Requested' && item.status !== 'Rescheduled') {
    throw new Error('This consultation cannot be cancelled in its current status');
  }

  const updated: Consultation = {
    ...item,
    status: 'Cancelled',
    updatedAt: new Date().toISOString(),
  };
  current[idx] = updated;
  saveLocalConsultations([...current]);
  return updated;
}

/**
 * Admin view: Fetch all consultation requests across all customers.
 * Joins with customer profile details (email, name).
 */
export async function getAllConsultationsAdmin(): Promise<Consultation[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*, profiles:user_id(email, full_name)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          ...fromDbRow(row),
          userEmail: row.profiles?.email || 'Registered Customer',
          userName: row.profiles?.full_name || undefined,
        }));
      }
    } catch (err) {
      console.warn('Supabase admin consultations query failed, using local fallback:', err);
    }
  }

  return getLocalConsultations().map((c) => ({
    ...c,
    userEmail: 'Customer',
  }));
}

/**
 * Admin action: Confirm, reschedule, complete, or cancel a consultation,
 * and update confirmed date, confirmed time, or admin message.
 */
export async function adminUpdateConsultation(
  id: string,
  updates: ConsultationAdminUpdateInput
): Promise<Consultation | null> {
  const patch: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.confirmedDate !== undefined) patch.confirmed_date = updates.confirmedDate;
  if (updates.confirmedTime !== undefined) patch.confirmed_time = updates.confirmedTime;
  if (updates.adminMessage !== undefined) patch.admin_message = updates.adminMessage;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .update(patch)
        .eq('id', id)
        .select('*, profiles:user_id(email, full_name)')
        .single();

      if (!error && data) {
        const updated: Consultation = {
          ...fromDbRow(data),
          userEmail: data.profiles?.email || 'Customer',
          userName: data.profiles?.full_name || undefined,
        };
        const current = getLocalConsultations();
        saveLocalConsultations(current.map((c) => (c.id === id ? updated : c)));
        return updated;
      }
    } catch (err) {
      console.warn('Supabase admin update consultation failed, updating locally:', err);
    }
  }

  const current = getLocalConsultations();
  const idx = current.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const merged: Consultation = {
    ...current[idx],
    status: updates.status || current[idx].status,
    confirmedDate: updates.confirmedDate !== undefined ? updates.confirmedDate : current[idx].confirmedDate,
    confirmedTime: updates.confirmedTime !== undefined ? updates.confirmedTime : current[idx].confirmedTime,
    adminMessage: updates.adminMessage !== undefined ? updates.adminMessage : current[idx].adminMessage,
    updatedAt: new Date().toISOString(),
  };
  current[idx] = merged;
  saveLocalConsultations([...current]);
  return merged;
}

/**
 * Update the payment status of a consultation (Stripe webhook / checkout completion).
 */
export async function updateConsultationPaymentStatus(
  id: string,
  paymentStatus: import('@/types/consultation').ConsultationPaymentStatus,
  details?: {
    checkoutSessionId?: string;
    paymentIntentId?: string;
    paidAt?: string;
  }
): Promise<Consultation | null> {
  const patch: any = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (details?.checkoutSessionId) patch.stripe_checkout_session_id = details.checkoutSessionId;
  if (details?.paymentIntentId) patch.stripe_payment_intent_id = details.paymentIntentId;
  if (details?.paidAt) patch.paid_at = details.paidAt;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated = fromDbRow(data);
        const current = getLocalConsultations();
        saveLocalConsultations(current.map((c) => (c.id === id ? updated : c)));
        return updated;
      }
    } catch (err) {
      console.warn('Supabase update consultation payment failed:', err);
    }
  }

  const current = getLocalConsultations();
  const idx = current.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const merged: Consultation = {
    ...current[idx],
    paymentStatus,
    stripeCheckoutSessionId: details?.checkoutSessionId || current[idx].stripeCheckoutSessionId,
    stripePaymentIntentId: details?.paymentIntentId || current[idx].stripePaymentIntentId,
    paidAt: details?.paidAt || current[idx].paidAt,
    updatedAt: new Date().toISOString(),
  };
  current[idx] = merged;
  saveLocalConsultations([...current]);
  return merged;
}
