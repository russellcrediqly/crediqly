export type BankStatus = 'active' | 'inactive';

export interface Bank {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  logoUrl?: string;
  websiteUrl: string;
  affiliateUrl?: string;
  affiliateEnabled: boolean;
  featured: boolean;
  status: BankStatus;
  priority: number; // 1 = High, 2 = Standard, 3 = Low
  displayOrder: number;
  recommendedStage: string;
  minDeposit: string;
  monthlyFee: string;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RecommendedBank extends Bank {
  matchLabel: 'Strong Match' | 'Potential Match' | 'Explore';
  matchScore: number;
  recommendationReason: string;
}
