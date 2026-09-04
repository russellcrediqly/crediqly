export type FundingApplicationStatus =
  | 'Interested'
  | 'Planning to Apply'
  | 'Applied'
  | 'Documents Requested'
  | 'Submitted'
  | 'Approved'
  | 'Declined'
  | 'Funded';

export interface FundingApplication {
  id: string;
  userId: string;
  fundingProductId: string;
  providerName: string;
  productName: string;
  category?: string;
  requestedAmount?: number;
  status: FundingApplicationStatus;
  applicationDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Enriched fields for display
  websiteUrl?: string;
  affiliateUrl?: string;
  affiliateEnabled?: boolean;
}

export interface FundingApplicationInput {
  fundingProductId: string;
  providerName: string;
  productName: string;
  category?: string;
  requestedAmount?: number;
  status?: FundingApplicationStatus;
  applicationDate?: string;
  notes?: string;
}

export interface StatusGuidance {
  label: string;
  color: 'neutral' | 'brand' | 'warning' | 'info' | 'success' | 'danger';
  nextAction: string;
}

export function getStatusGuidance(status: FundingApplicationStatus): StatusGuidance {
  switch (status) {
    case 'Interested':
      return {
        label: 'Interested',
        color: 'neutral',
        nextAction: 'Review the funding requirements.',
      };
    case 'Planning to Apply':
      return {
        label: 'Planning to Apply',
        color: 'brand',
        nextAction: 'Make sure your business meets the listed requirements.',
      };
    case 'Applied':
      return {
        label: 'Applied',
        color: 'info',
        nextAction: 'Check your provider account/email for updates.',
      };
    case 'Documents Requested':
      return {
        label: 'Documents Requested',
        color: 'warning',
        nextAction: 'Provide the requested documents directly to the provider.',
      };
    case 'Submitted':
      return {
        label: 'Submitted',
        color: 'info',
        nextAction: 'Provider is reviewing your submission. Check email/portal for communication.',
      };
    case 'Approved':
      return {
        label: 'Approved',
        color: 'success',
        nextAction: 'Review the provider\'s final terms before accepting.',
      };
    case 'Declined':
      return {
        label: 'Declined',
        color: 'danger',
        nextAction: 'Review your Crediqly roadmap and improve your funding readiness before trying again.',
      };
    case 'Funded':
      return {
        label: 'Funded',
        color: 'success',
        nextAction: 'Keep your business credit and financial profile healthy.',
      };
    default:
      return {
        label: status,
        color: 'neutral',
        nextAction: 'Check provider instructions.',
      };
  }
}
