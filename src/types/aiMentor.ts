export type AIDataClassification =
  | 'Known'
  | 'Customer-reported'
  | 'Estimated'
  | 'Recommended'
  | 'Needs verification';

export interface StructuredRecommendedAction {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  priority?: 'High' | 'Medium' | 'Low';
  effort?: string;
  impact?: string;
  category?: string;
}

export interface StructuredAIAdvice {
  summary: string;
  current_status: string;
  why_it_matters: string;
  recommended_action: StructuredRecommendedAction;
  reasoning: string;
  risks: string[]; // What to avoid / risks
  next_actions: string[]; // Sequential roadmap steps
  questions: string[]; // Context-aware suggested follow-up prompts
  disclaimer: string;
}

export interface AdvisoryMeetingPrep {
  situationSummary: string;
  discussionTopics: string[];
  profileStrengths: string[];
  profileWeaknesses: string[];
  suggestedAdvisorQuestions: string[];
}

export interface SafeCustomerAIContext {
  // 1. BUSINESS PROFILE & DEMOGRAPHICS
  businessName?: string;
  entityType?: string;
  businessAge?: string;
  state?: string;
  industry?: string;
  businessFoundationStatus?: {
    hasEIN?: string;
    hasBusinessBankAccount?: string;
    hasWebsite?: string;
    hasBusinessPhone?: string;
    hasBusinessEmail?: string;
    hasBusinessAddress?: string;
    hasBusinessLicense?: string;
    hasDuns?: string;
    foundationScore?: number;
  };

  // 2. FINANCIAL & CREDIT DIMENSIONS
  annualRevenue?: string;
  revenueRange?: string;
  personalCreditTier?: string;
  personalCreditRange?: string;
  hasBusinessCreditProfile?: string;
  businessCreditProfileStatus?: string;
  knowsBusinessCreditScore?: string;
  reportedCreditScore?: string | number;
  businessCreditStatus?: string;
  numberKnownTradelines?: string | number;
  hasReportingAccounts?: string;
  hasBusinessCreditCard?: string;
  existingTradelines?: { name: string; type: string; status: string }[];
  relevantCreditMilestones?: string[];
  completedActions?: string[];

  // 3. READINESS & SCORING (Deterministic, Never Fabricated)
  fundingReadinessScore: number;
  readinessLevel: string;
  businessReadinessScore: number;
  creditReadinessScore: number;
  readinessScore?: number; // Alias for fundingReadinessScore
  profileCompleted: boolean;
  profileCompletionPercentage: number;
  currentJourneyStage: string;

  // 4. MILESTONES & ACTIONS
  completedMilestones?: string[];
  incompleteMilestones?: string[];
  nextMilestone?: {
    id?: string;
    title: string;
    category?: string;
    whyItMatters?: string;
    dependencies?: string[];
  };
  dependencies?: string[];
  previousActions?: string[];
  customerConfirmedActivities?: string[];
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

  // 5. CAPITAL & FUNDING DEMANDS
  fundingGoal?: string;
  desiredFundingAmount?: string;
  requestedFundingAmount?: string;
  fundingPurpose?: string[];
  fundingProfileSummary?: string;
  recommendedProducts?: {
    name: string;
    category: string;
    matchTier: string;
    reason?: string;
    requirements?: string;
  }[];
  matchedFundingCategories?: string[];
  fundingMatches: {
    tier: string;
    category: string;
    range: string;
  }[];

  // 6. ACTIVITY & HISTORY
  previousCustomerActions?: string[];

  // 7. SUBSCRIPTION TIER
  subscriptionTier?: 'Free' | 'Pro' | 'Premium Advisory';

  // 8. ADVISORY CONTEXT (For Premium Advisory Members)
  advisoryContext?: {
    isAdvisoryMember: boolean;
    meetingPrepTopics?: string[];
    profileStrengths?: string[];
    profileWeaknesses?: string[];
    suggestedAdvisorQuestions?: string[];
  };

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
  structured?: StructuredAIAdvice;
  advisoryPrep?: AdvisoryMeetingPrep;
}

export interface AIMentorQuickQuestion {
  id: string;
  label: string;
  prompt: string;
  category: 'next_steps' | 'tradelines_banking' | 'funding_timing' | 'credit_education' | 'context_explain';
}

export const CORE_AI_MENTOR_QUESTIONS: AIMentorQuickQuestion[] = [
  // 1. Next Steps & Focus
  {
    id: 'what_should_i_do_next',
    label: 'What should I do next?',
    prompt: 'What should I do next?',
    category: 'next_steps',
  },
  {
    id: 'why_should_i_do_this',
    label: 'Why should I do it?',
    prompt: 'Why should I do this?',
    category: 'next_steps',
  },
  {
    id: 'what_should_i_avoid',
    label: 'What should I avoid right now?',
    prompt: 'What should I avoid right now?',
    category: 'next_steps',
  },
  {
    id: 'biggest_opportunity',
    label: 'What opportunity should I pursue?',
    prompt: 'What opportunity should I pursue?',
    category: 'next_steps',
  },
  {
    id: 'monthly_focus',
    label: 'What should I focus on this month?',
    prompt: 'What should I focus on this month?',
    category: 'next_steps',
  },

  // 2. Tradelines & Banking
  {
    id: 'how_to_build_business_credit',
    label: 'How do I build business credit?',
    prompt: 'How do I build business credit?',
    category: 'tradelines_banking',
  },
  {
    id: 'which_tradelines_fit',
    label: 'Which tradelines should I consider?',
    prompt: 'Which tradelines should I consider?',
    category: 'tradelines_banking',
  },
  {
    id: 'bank_account_fit',
    label: 'Which business banking options make sense?',
    prompt: 'Which business banking options may make sense?',
    category: 'tradelines_banking',
  },

  // 3. Funding Timing & Readiness
  {
    id: 'when_funding_ready',
    label: 'When will my business be funding ready?',
    prompt: 'When will my business be funding ready?',
    category: 'funding_timing',
  },
  {
    id: 'what_funding_relevant',
    label: 'What funding options appear relevant?',
    prompt: 'What funding options appear relevant?',
    category: 'funding_timing',
  },
  {
    id: 'preventing_readiness',
    label: 'What is preventing me from being more funding-ready?',
    prompt: 'What is preventing me from being more funding-ready?',
    category: 'funding_timing',
  },
  {
    id: 'why_readiness_score',
    label: 'Why was my readiness score updated?',
    prompt: 'Why was my readiness score updated?',
    category: 'funding_timing',
  },

  // 4. Education & Smart Explanations
  {
    id: 'explain_business_credit',
    label: 'Explain this business-credit concept',
    prompt: 'Explain business credit to me.',
    category: 'credit_education',
  },
  {
    id: 'explain_recommendation',
    label: 'Explain this recommendation',
    prompt: 'Explain this recommendation.',
    category: 'context_explain',
  },
];
