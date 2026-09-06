export type FundingCategory =
  | 'Business Line of Credit'
  | 'Term Loan'
  | 'Equipment Financing'
  | 'Working Capital'
  | 'SBA-related Financing'
  | 'Business Credit Card'
  | 'Vehicle Financing'
  | 'Revenue-based Financing'
  | 'Invoice Financing'
  | 'Grant'
  | 'Other';

export type FundingProductStatus = 'active' | 'inactive';

export type BusinessCreditRequiredOption = 'yes' | 'no' | 'not_specified';

export type RepaymentTypeOption = 'Revolving' | 'Short Term' | 'Medium Term' | 'Long Term' | 'Grant';

export interface FundingProduct {
  id: string;
  name: string;
  provider: string;
  category: FundingCategory;
  description: string;
  websiteUrl: string;
  affiliateUrl?: string;
  affiliateEnabled: boolean;
  status: FundingProductStatus;
  featured: boolean;
  priority: number; // 1 = highest, 2 = standard, 3 = secondary
  
  // Basic recommendation requirements / matching rules
  minBusinessAgeMonths: number; // 0, 3, 6, 12, 24, etc.
  minAnnualRevenue: string; // e.g. '$0', '$25,000', '$50,000', '$100,000', '$250,000+'
  minPersonalCredit: string; // e.g. 'None', '600+', '650+', '680+', '700+'
  businessCreditRequired: BusinessCreditRequiredOption;
  minFundingAmount?: number; // e.g. 5000
  maxFundingAmount?: number; // e.g. 250000
  fundingPurposes: string[]; // e.g. ['Working Capital', 'Equipment', 'Expansion', 'Inventory', 'Payroll', 'Marketing', 'Vehicle', 'Debt Refinancing', 'Business Acquisition', 'Other']
  
  // Marketplace & transparency attributes
  repaymentType?: RepaymentTypeOption; // Revolving, Short Term, Medium Term, Long Term, Grant
  rateTermsInfo?: string; // e.g. "From 8.99% APR", "Factor rate 1.15–1.28", or "Rate/terms determined by provider"
  typicalTermRange?: string; // e.g. "12–36 months", "Revolving", "6–18 months"
  lastReviewedDate?: string; // e.g. "2026-09-01"
  
  // Grant specific fields
  grantDeadline?: string; // e.g. "Rolling / Monthly", "October 31, 2026"
  grantAmount?: string; // e.g. "$10,000", "$25,000"
  eligibilityNotes?: string; // e.g. "Women-owned businesses, min 3 months in operation"
  locationRestrictions?: string; // e.g. "US nationwide", "Select states"

  createdAt?: string;
  updatedAt?: string;
}

export type FundingMatchLevel =
  | 'Strong Match'
  | 'Possible Match'
  | 'Potential Match'
  | 'Not Ready Yet'
  | 'Explore';

export interface FundingMatchResult {
  product: FundingProduct;
  matchLevel: FundingMatchLevel;
  score: number;
  whyThisFits: string;
  verificationNotes: string[];
  requirementSummary: {
    minAge: string;
    minRevenue: string;
    minCredit: string;
    fundingRange: string;
    repayment: string;
    rates: string;
  };
  checklistMet: string[];
  checklistPending: string[];
  nextStepsToImprove: string[];
  isGrant?: boolean;
}
