export type FundingCategory =
  | 'Business Line of Credit'
  | 'Term Loan'
  | 'Equipment Financing'
  | 'Working Capital'
  | 'SBA-related Financing'
  | 'Business Credit Card'
  | 'Vehicle Financing'
  | 'Revenue-based Financing'
  | 'Other';

export type FundingProductStatus = 'active' | 'inactive';

export type BusinessCreditRequiredOption = 'yes' | 'no' | 'not_specified';

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
  
  createdAt?: string;
  updatedAt?: string;
}

export type FundingMatchLevel = 'Strong Match' | 'Potential Match' | 'Explore';

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
  };
}
