export type ConsultationStatus =
  | 'Requested'
  | 'Confirmed'
  | 'Rescheduled'
  | 'Completed'
  | 'Cancelled';

export type ConsultationType =
  | 'Business Credit'
  | 'Funding Readiness'
  | 'Funding Strategy'
  | 'General Consultation'
  | 'Premium Advisory Monthly Meeting';

export type ConsultationPaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface Consultation {
  id: string;
  userId: string;
  consultationType: ConsultationType;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // e.g. "10:00 AM", "2:00 PM"
  confirmedDate?: string; // YYYY-MM-DD
  confirmedTime?: string; // e.g. "10:30 AM"
  status: ConsultationStatus;
  paymentStatus?: ConsultationPaymentStatus;
  paymentAmount?: number;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  customerMessage?: string;
  adminMessage?: string;
  createdAt: string;
  updatedAt: string;
  // Joined or enriched for admin view:
  userEmail?: string;
  userName?: string;
}

export interface ConsultationInput {
  consultationType: ConsultationType;
  preferredDate: string;
  preferredTime: string;
  customerMessage?: string;
  paymentStatus?: ConsultationPaymentStatus;
  paymentAmount?: number;
}

export interface ConsultationAdminUpdateInput {
  status?: ConsultationStatus;
  confirmedDate?: string;
  confirmedTime?: string;
  adminMessage?: string;
}

export interface ConsultationStatusDetails {
  label: string;
  color: 'info' | 'success' | 'warning' | 'neutral' | 'danger';
  description: string;
}

export function getConsultationStatusDetails(status: ConsultationStatus): ConsultationStatusDetails {
  switch (status) {
    case 'Requested':
      return {
        label: 'Requested',
        color: 'info',
        description: 'Your consultation request is awaiting review and confirmation by the Crediqly team.',
      };
    case 'Confirmed':
      return {
        label: 'Confirmed',
        color: 'success',
        description: 'Your appointment is confirmed. Please check your confirmed date, time, and instructions below.',
      };
    case 'Rescheduled':
      return {
        label: 'Rescheduled',
        color: 'warning',
        description: 'Your consultation has been rescheduled by our team. Please review the updated date and time.',
      };
    case 'Completed':
      return {
        label: 'Completed',
        color: 'neutral',
        description: 'This strategic consultation session has been concluded.',
      };
    case 'Cancelled':
      return {
        label: 'Cancelled',
        color: 'danger',
        description: 'This consultation request has been cancelled.',
      };
    default:
      return {
        label: status,
        color: 'neutral',
        description: '',
      };
  }
}
