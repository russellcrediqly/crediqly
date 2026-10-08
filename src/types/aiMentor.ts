export type AIDataClassification =
  | 'Known'
  | 'Customer-reported'
  | 'Estimated'
  | 'Recommended'
  | 'Needs verification';

export interface SafeCustomerAIContext {
  // Business Profile & Demographics
  businessName?: string;
  entityType?: string;
  businessAge?: string;
  state?: string;
  industry?: string;

  // Financial & Credit Dimensions
  annualRevenue?: string;
  revenueRange?: string;
  personalCreditTier?: string;
  personalCreditRange?: string;
  hasBusinessCreditProfile?: string;
  businessCreditStatus?: string;
  existingTradelines?: { name: string; type: string; status: string }[];

  // Readiness & Scoring (Deterministic, Never Fabricated)
  fundingReadinessScore: number;
  readinessLevel: string;
  businessReadinessScore: number;
  creditReadinessScore: number;
  profileCompleted: boolean;
  profileCompletionPercentage: number;
  currentJourneyStage: string;

  // Milestones & Actions
  completedMilestones?: string[];
  incompleteMilestones?: string[];
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

  // Capital & Funding Demands
  fundingGoal?: string;
  requestedFundingAmount?: string;
  fundingPurpose?: string[];
  recommendedProducts?: { name: string; category: string; matchTier: string }[];
  fundingMatches: {
    tier: string;
    category: string;
    range: string;
  }[];

  // Activity & History
  previousCustomerActions?: string[];
  customerConfirmedActivities?: string[];

  // Data Provenance Tags
  dataClassification?: Record<string, AIDataClassification>;
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
  dataClassification?: Record<string, AIDataClassification>;
}

export interface AIMentorQuickQuestion {
  id: string;
  label: string;
  prompt: string;
  category: 'next_steps' | 'tradelines_banking' | 'funding_timing' | 'credit_education';
}

export const CORE_AI_MENTOR_QUESTIONS: AIMentorQuickQuestion[] = [
  // 1. Next Steps
  {
    id: 'what_should_i_do_next',
    label: 'What should I do next?',
    prompt: 'What should I do next?',
    category: 'next_steps',
  },
  {
    id: 'why_should_i_do_this',
    label: 'Why should I do this action?',
    prompt: 'Why should I do this?',
    category: 'next_steps',
  },
  {
    id: 'monthly_focus',
    label: 'What should I focus on this month?',
    prompt: 'What should I focus on this month?',
    category: 'next_steps',
  },
  {
    id: 'biggest_opportunity',
    label: 'What is my biggest opportunity?',
    prompt: 'What is my biggest opportunity?',
    category: 'next_steps',
  },

  // 2. Tradelines & Banking
  {
    id: 'what_should_i_open_next',
    label: 'What should I open next?',
    prompt: 'What should I open next?',
    category: 'tradelines_banking',
  },
  {
    id: 'tradelines_fit',
    label: 'Which tradelines fit my business?',
    prompt: 'Which tradelines may fit my business?',
    category: 'tradelines_banking',
  },
  {
    id: 'bank_account_fit',
    label: 'Which bank account makes sense?',
    prompt: 'Which business bank account may make sense?',
    category: 'tradelines_banking',
  },
  {
    id: 'what_to_avoid',
    label: 'What should I avoid right now?',
    prompt: 'What should I avoid right now?',
    category: 'tradelines_banking',
  },

  // 3. Funding Timing
  {
    id: 'improve_readiness',
    label: 'How can I improve my funding readiness?',
    prompt: 'What could improve my funding readiness?',
    category: 'funding_timing',
  },
  {
    id: 'ready_for_funding',
    label: 'Am I ready to look for funding?',
    prompt: 'Am I ready to look for funding?',
    category: 'funding_timing',
  },
  {
    id: 'funding_options_relevant',
    label: 'What funding options appear relevant?',
    prompt: 'What funding options appear relevant?',
    category: 'funding_timing',
  },

  // 4. Credit Education
  {
    id: 'explain_business_credit',
    label: 'Explain business credit to me',
    prompt: 'Explain business credit to me.',
    category: 'credit_education',
  },
];
