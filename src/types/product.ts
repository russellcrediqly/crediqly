export type ProductCategory =
  | 'business_credit_builders'
  | 'net_30'
  | 'net_60'
  | 'business_credit_cards'
  | 'business_banking'
  | 'business_services';

export type ProductStatus = 'active' | 'inactive' | 'pending';

export type MatchLabel = 'Strong Match' | 'Potential Match' | 'Explore';

export type PersonalGuaranteeType = 'no' | 'yes' | 'soft_pull_only' | 'check_provider';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  shortDescription: string;
  logoUrl?: string;
  websiteUrl: string;
  affiliateUrl?: string;
  affiliateEnabled: boolean;
  reportingBureaus: string[];
  productType?: string;
  minimumPurchase?: string;
  subscriptionRequired: boolean;
  typicalBusinessAge?: string;
  einRequired: boolean;
  businessBankAccountRequired: boolean;
  businessWebsiteRequired: boolean;
  personalGuaranteeRequired: PersonalGuaranteeType;
  personalCreditRequirement?: string;
  recommendedStage: string;
  priority?: number; // 1 = High, 2 = Standard, 3 = Low
  status: ProductStatus;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecommendedProduct extends Product {
  matchLabel: MatchLabel;
  matchScore: number;
  recommendationReason: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  business_credit_builders: 'Business Credit Builders',
  net_30: 'Net-30',
  net_60: 'Net-60',
  business_credit_cards: 'Business Credit Cards',
  business_banking: 'Business Banking',
  business_services: 'Business Services',
};
