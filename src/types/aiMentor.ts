export interface SafeCustomerAIContext {
  businessName?: string;
  fundingReadinessScore: number;
  readinessLevel: string;
  businessReadinessScore: number;
  creditReadinessScore: number;
  profileCompleted: boolean;
  profileCompletionPercentage: number;
  businessAge?: string;
  annualRevenue?: string;
  personalCreditTier?: string;
  hasBusinessCreditProfile?: string;
  entityType?: string;
  fundingGoal?: string;
  currentJourneyStage: string;
  readinessFactors: {
    area: string;
    status: 'strong' | 'good' | 'needs_improvement';
    score: number;
  }[];
  topNextActions: {
    title: string;
    priority: 'High' | 'Medium' | 'Low';
    category: string;
  }[];
  fundingMatches: {
    tier: string;
    category: string;
    range: string;
  }[];
}

export interface AIMentorNextStep {
  label: string;
  href: string;
  reason?: string;
}

export interface AIMentorResponse {
  answer: string;
  nextStep?: AIMentorNextStep;
  source: 'ai_model' | 'deterministic_fallback';
  disclaimer: string;
}

export interface AIMentorQuickQuestion {
  id: string;
  label: string;
  prompt: string;
}
