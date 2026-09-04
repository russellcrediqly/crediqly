export type FundingReadinessLevel =
  | 'Getting Started'
  | 'Building Readiness'
  | 'Developing'
  | 'Funding Ready'
  | 'Strong Readiness';

export interface FundingCategoryScore {
  category: 'foundation' | 'credit' | 'financial' | 'profile';
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface FundingFactor {
  id: string;
  title: string;
  category: 'foundation' | 'credit' | 'financial' | 'profile';
  isVerificationNeeded?: boolean;
  impact: 'high' | 'medium' | 'low';
}

export interface FundingNextAction {
  id: string;
  title: string;
  explanation: string;
  actionLabel: string;
  actionHref: string;
  roadmapTaskKey?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface FundingReadinessResult {
  score: number; // 0 to 100
  level: FundingReadinessLevel;
  description: string;
  categories: {
    foundation: FundingCategoryScore; // Max 25
    businessCredit: FundingCategoryScore; // Max 30
    financialReadiness: FundingCategoryScore; // Max 25
    fundingProfile: FundingCategoryScore; // Max 20
  };
  positiveFactors: FundingFactor[];
  improvementFactors: FundingFactor[];
  nextBestAction: FundingNextAction;
  prioritizedActions: FundingNextAction[];
  calculatedAt: string;
}

export interface FundingReadinessRecord {
  id: string;
  userId: string;
  businessId?: string;
  score: number;
  readinessLevel: FundingReadinessLevel;
  foundationScore: number;
  businessCreditScore: number;
  financialReadinessScore: number;
  profileScore: number;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundingHistoryEntry {
  id: string;
  date: string;
  score: number;
  level: FundingReadinessLevel;
}
