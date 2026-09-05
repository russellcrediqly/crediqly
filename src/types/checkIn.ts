export interface MonthlyCheckInResponses {
  openedNewCreditAccounts: 'yes' | 'no';
  vendorAccountsReporting: 'yes' | 'no' | 'unsure';
  appliedForFunding: 'yes' | 'no';
  revenueChange: 'increased' | 'decreased' | 'steady';
  newBusinessCreditCards: 'yes' | 'no';
  completedPreviousAction: 'yes' | 'partially' | 'not_yet';
  entityOrContactChanges: 'yes' | 'no';
  notes?: string;
}

export interface MonthlyCheckInRecord {
  id: string;
  userId: string;
  businessId?: string;
  submittedAt: string;
  monthYear: string; // e.g., "September 2026" or "2026-09"
  responses: MonthlyCheckInResponses;
  previousScore?: number;
  newScore?: number;
  nextBestActionTitle?: string;
}
