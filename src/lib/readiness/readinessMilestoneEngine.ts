import type { BusinessProfile } from '../../types/business';

export type MilestoneCompletionType = 'system_verified' | 'customer_confirmation' | 'admin_verified';

export type MilestoneCategory =
  | 'foundation'
  | 'bureau_tradelines'
  | 'revolving_seasoning'
  | 'funding_readiness';

export interface ReadinessMilestoneDefinition {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  category: MilestoneCategory;
  categoryLabel: string;
  stepOrder: number;
  weight: number;
  active: boolean;
  completionType: MilestoneCompletionType;
  actionLabel: string;
  actionHref: string;
  prerequisiteId?: string;
  roadmapTaskKey?: string;
  verifier: (profile: Partial<BusinessProfile>, completedTags: Set<string>) => boolean;
}

export interface MilestoneProgressItem {
  definition: ReadinessMilestoneDefinition;
  isCompleted: boolean;
  completedAt?: string;
  isNextStep: boolean;
  isBlockedByPrereq: boolean;
}

export interface ReadinessMilestoneResult {
  score: number; // 0–100
  totalAvailableWeight: number; // exactly 100 when active
  completedWeight: number;
  totalMilestonesCount: number;
  completedMilestonesCount: number;
  percentage: number;
  currentStage: string;
  currentStageNumber: number;
  totalStages: number;
  nextMilestone: ReadinessMilestoneDefinition | null;
  items: MilestoneProgressItem[];
  isJourneyComplete: boolean;
  scoreExplanation: string;
  legalDisclaimer: string;
}

export const OFFICIAL_READINESS_MILESTONES: ReadinessMilestoneDefinition[] = [
  // --------------------------------------------------------------------------
  // Category 1: Business Foundation & Compliance (25 Points Total)
  // --------------------------------------------------------------------------
  {
    id: 'm_profile_entity',
    title: 'Formal Legal Business Entity',
    description: 'Establish a formal state-registered business entity (LLC or Corporation) to separate personal and commercial liability.',
    whyItMatters: 'Commercial lenders and tier-1 vendor credit providers require a formally organized entity in good standing to issue business credit without personal commingling.',
    category: 'foundation',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 1,
    weight: 5,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Complete Entity Details',
    actionHref: '/business',
    roadmapTaskKey: 'task_entity',
    verifier: (p) => Boolean(p.entityType && p.entityType !== 'Not sure' && p.entityType !== 'Sole Proprietorship'),
  },
  {
    id: 'm_ein',
    title: 'Federal Employer ID (EIN)',
    description: 'Assign and verify a 9-digit Federal Employer Identification Number issued by the IRS.',
    whyItMatters: 'An EIN serves as your company\'s commercial social security number. All tier-1 business bureau trade files and commercial banking accounts are anchored to your EIN.',
    category: 'foundation',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 2,
    weight: 5,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Verify Federal EIN',
    actionHref: '/business',
    prerequisiteId: 'm_profile_entity',
    roadmapTaskKey: 'task_ein',
    verifier: (p) => p.hasEIN === 'yes',
  },
  {
    id: 'm_business_bank',
    title: 'Dedicated Business Checking Account',
    description: 'Establish an independent commercial checking account strictly in the legal business name.',
    whyItMatters: 'Underwriters inspect commercial bank statements to verify operational cash flow and strict legal separation of business and personal finances.',
    category: 'foundation',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 3,
    weight: 5,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Explore Business Banking',
    actionHref: '/products?category=business_banking',
    prerequisiteId: 'm_ein',
    roadmapTaskKey: 'task_business_bank',
    verifier: (p) => p.hasBusinessBankAccount === 'yes',
  },
  {
    id: 'm_commercial_presence',
    title: 'Commercial Digital Presence',
    description: 'Publish an active business website with a matching professional domain email and dedicated business phone line.',
    whyItMatters: 'Automated compliance engines cross-reference directory listings and domain email addresses to verify the business is legitimate and active.',
    category: 'foundation',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 4,
    weight: 5,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Update Presence Details',
    actionHref: '/business',
    roadmapTaskKey: 'rec_commercial_presence',
    verifier: (p) => p.hasWebsite === 'yes' && p.hasBusinessPhone === 'yes' && p.hasBusinessEmail === 'yes',
  },
  {
    id: 'm_commercial_address',
    title: 'Commercial Address & Compliance',
    description: 'Secure a physical commercial or professional office address and obtain necessary municipal or state licenses.',
    whyItMatters: 'Commercial address verification ensures your business avoids residential disqualifiers in automated commercial underwriting algorithms.',
    category: 'foundation',
    categoryLabel: 'Foundation & Entity',
    stepOrder: 5,
    weight: 5,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Verify Address & License',
    actionHref: '/business',
    roadmapTaskKey: 'task_business_address',
    verifier: (p) =>
      p.hasBusinessAddress === 'yes' &&
      (p.hasBusinessLicense === 'yes' || p.hasBusinessLicense === 'not_applicable'),
  },

  // --------------------------------------------------------------------------
  // Category 2: Credit Foundation & Tradelines (25 Points Total)
  // --------------------------------------------------------------------------
  {
    id: 'm_duns_bureau',
    title: 'Commercial Credit Bureau Registration',
    description: 'Establish a commercial credit file with Dun & Bradstreet (D-U-N-S), Experian Commercial, or Equifax Business.',
    whyItMatters: 'Before trade vendors can report payments, a registered commercial credit file must exist to receive and accumulate tradeline history.',
    category: 'bureau_tradelines',
    categoryLabel: 'Credit Profile & Tradelines',
    stepOrder: 6,
    weight: 10,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Confirm D-U-N-S / File',
    actionHref: '/business',
    prerequisiteId: 'm_business_bank',
    roadmapTaskKey: 'task_duns',
    verifier: (p) => p.hasBusinessCreditProfile === 'yes' || p.hasDuns === 'yes',
  },
  {
    id: 'm_tier1_tradelines',
    title: 'Tier-1 Reporting Tradelines',
    description: 'Open and purchase through at least one Net-30 vendor account that reports monthly payments to major business credit bureaus.',
    whyItMatters: 'Reporting tradelines are the building blocks of commercial credit scores (e.g. Paydex). Prompt payments generate your first positive payment track record.',
    category: 'bureau_tradelines',
    categoryLabel: 'Credit Profile & Tradelines',
    stepOrder: 7,
    weight: 10,
    active: true,
    completionType: 'customer_confirmation',
    actionLabel: 'View Recommended Tradelines',
    actionHref: '/products?category=net_30',
    prerequisiteId: 'm_duns_bureau',
    roadmapTaskKey: 'task_reporting_accounts',
    verifier: (p, tags) => p.hasReportingAccounts === 'yes' || tags.has('task_reporting_accounts') || tags.has('m_tier1_tradelines'),
  },
  {
    id: 'm_credit_depth',
    title: 'Commercial Credit Account Depth',
    description: 'Maintain 3 or more reporting trade accounts to establish credit thickness and satisfy institutional criteria.',
    whyItMatters: 'Lenders rarely extend substantial funding based on a single tradeline. 3 to 5 active reporting accounts demonstrate systemic repayment reliability.',
    category: 'bureau_tradelines',
    categoryLabel: 'Credit Profile & Tradelines',
    stepOrder: 8,
    weight: 5,
    active: true,
    completionType: 'customer_confirmation',
    actionLabel: 'Explore Net-30 Vendors',
    actionHref: '/products?category=net_30',
    prerequisiteId: 'm_tier1_tradelines',
    roadmapTaskKey: 'rec_credit_depth',
    verifier: (p, tags) =>
      p.businessCreditAccountCount === '1-3' ||
      p.businessCreditAccountCount === '4+' ||
      p.businessCreditAccountCount === '3+' ||
      tags.has('rec_credit_depth') ||
      tags.has('m_credit_depth'),
  },

  // --------------------------------------------------------------------------
  // Category 3: Revolving Credit & Seasoning (25 Points Total)
  // --------------------------------------------------------------------------
  {
    id: 'm_revolving_card',
    title: 'Dedicated Business Credit Card',
    description: 'Establish and utilize a commercial revolving credit line or corporate card for business expenses.',
    whyItMatters: 'Revolving credit demonstrates capability to manage ongoing balances and payments, which significantly expands commercial borrowing capacity.',
    category: 'revolving_seasoning',
    categoryLabel: 'Revolving Credit & Seasoning',
    stepOrder: 9,
    weight: 10,
    active: true,
    completionType: 'customer_confirmation',
    actionLabel: 'View Business Cards',
    actionHref: '/products?category=business_credit_cards',
    prerequisiteId: 'm_tier1_tradelines',
    roadmapTaskKey: 'task_build_business_card',
    verifier: (p, tags) => p.hasBusinessCreditCard === 'yes' || tags.has('task_build_business_card') || tags.has('m_revolving_card'),
  },
  {
    id: 'm_utilization_payment',
    title: 'Responsible Payment & Low Utilization',
    description: 'Maintain on-time commercial payments and keep revolving credit utilization consistently below 30%.',
    whyItMatters: 'Credit utilization is a primary scoring factor in commercial algorithms. High balances relative to limits suppress funding approval amounts.',
    category: 'revolving_seasoning',
    categoryLabel: 'Revolving Credit & Seasoning',
    stepOrder: 10,
    weight: 10,
    active: true,
    completionType: 'customer_confirmation',
    actionLabel: 'Review Best Practices',
    actionHref: '/learn',
    prerequisiteId: 'm_revolving_card',
    roadmapTaskKey: 'task_credit_utilization',
    verifier: (_p, tags) => tags.has('task_credit_utilization') || tags.has('m_utilization_payment'),
  },
  {
    id: 'm_credit_monitoring',
    title: 'Commercial Credit Monitoring',
    description: 'Actively monitor business credit scores across Dun & Bradstreet, Experian Business, and Equifax Commercial.',
    whyItMatters: 'Regular monitoring lets you verify trade line reporting accuracy, catch errors before applying for capital, and monitor your score evolution.',
    category: 'revolving_seasoning',
    categoryLabel: 'Revolving Credit & Seasoning',
    stepOrder: 11,
    weight: 5,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Check Credit Tracking',
    actionHref: '/business',
    roadmapTaskKey: 'task_check_scores',
    verifier: (p, tags) => p.knowsBusinessCreditScore === 'yes' || tags.has('task_check_scores') || tags.has('m_credit_monitoring'),
  },

  // --------------------------------------------------------------------------
  // Category 4: Funding Preparation & Profile (25 Points Total)
  // --------------------------------------------------------------------------
  {
    id: 'm_funding_profile',
    title: 'Capital Target & Funding Purpose',
    description: 'Specify your target funding amount and strategic commercial use of capital in your business profile.',
    whyItMatters: 'Matching algorithms and loan officers require clear project scope to match you with appropriate SBA, term, or credit line facilities.',
    category: 'funding_readiness',
    categoryLabel: 'Funding Preparation & Profile',
    stepOrder: 12,
    weight: 10,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Set Funding Target',
    actionHref: '/business',
    roadmapTaskKey: 'task_funding_target',
    verifier: (p) => Boolean(p.fundingAmount && p.fundingAmount.trim() !== ''),
  },
  {
    id: 'm_revenue_operating',
    title: 'Revenue Verification & Seasoning',
    description: 'Document annual operating revenue and establish verified business operating age.',
    whyItMatters: 'Operational cash flow and time in business are standard underwriting criteria that expand available capital tiers from micro-loans to full commercial lines.',
    category: 'funding_readiness',
    categoryLabel: 'Funding Preparation & Profile',
    stepOrder: 13,
    weight: 10,
    active: true,
    completionType: 'system_verified',
    actionLabel: 'Update Financials',
    actionHref: '/business',
    verifier: (p, tags) => {
      const anyP = p as any;
      const hasRevenue = Boolean(
        (p.annualRevenueRange && p.annualRevenueRange !== 'Pre-revenue') ||
        (anyP.annualRevenue && String(anyP.annualRevenue).trim() !== '' && anyP.annualRevenue !== '$0') ||
        (anyP.monthlyRevenue && String(anyP.monthlyRevenue).trim() !== '')
      );
      const hasAge = Boolean(p.businessAge || anyP.timeInBusiness || anyP.yearsInBusiness);
      return (
        (hasRevenue && hasAge) ||
        tags.has('task_track_cash_flow') ||
        tags.has('m_revenue_operating')
      );
    },
  },
  {
    id: 'm_documentation_pack',
    title: 'Funding Application Document Readiness Pack',
    description: 'Assemble required corporate documentation (bank statements, Articles of Organization, EIN letter, and identification).',
    whyItMatters: 'Complete documentation allows swift underwriting turnaround and prevents application expiration or declines due to missing files.',
    category: 'funding_readiness',
    categoryLabel: 'Funding Preparation & Profile',
    stepOrder: 14,
    weight: 5,
    active: true,
    completionType: 'customer_confirmation',
    actionLabel: 'Check Document Checklist',
    actionHref: '/funding',
    prerequisiteId: 'm_funding_profile',
    roadmapTaskKey: 'task_document_pack',
    verifier: (_p, tags) => tags.has('task_document_pack') || tags.has('m_documentation_pack'),
  },
];

/**
 * Validates that all active milestones sum to exactly 100 points.
 */
export function validateMilestoneWeights(milestones: ReadinessMilestoneDefinition[] = OFFICIAL_READINESS_MILESTONES): {
  isValid: boolean;
  totalWeight: number;
} {
  const total = milestones
    .filter((m) => m.active)
    .reduce((sum, m) => sum + m.weight, 0);
  return {
    isValid: total === 100,
    totalWeight: total,
  };
}

/**
 * Calculates the real, deterministic 0–100 Business Credit & Funding Readiness Score.
 * Mathematically derived strictly as: sum(completed milestone weights).
 */
export function calculateMilestoneReadiness(
  profile: Partial<BusinessProfile> | null,
  completedTaskKeys: string[] = [],
  milestoneOverrides?: Record<string, Partial<ReadinessMilestoneDefinition>>
): ReadinessMilestoneResult {
  const p = profile || {};
  const rawFundingPurpose = (p as any).funding_purpose || (p as any).fundingPurpose || [];
  const fundingPurposeTags = Array.isArray(rawFundingPurpose)
    ? rawFundingPurpose
        .filter((t: string) => typeof t === 'string' && (t.startsWith('__task:') || t.startsWith('__milestone:')))
        .map((t: string) => t.replace(/^__(task|milestone):/, ''))
    : [];

  const completedTagSet = new Set<string>([
    ...(p.completedDbTasks || []),
    ...fundingPurposeTags,
    ...completedTaskKeys,
  ]);

  // Merge overrides if configured by admin
  const activeMilestones = OFFICIAL_READINESS_MILESTONES.map((def) => {
    if (milestoneOverrides && milestoneOverrides[def.id]) {
      return { ...def, ...milestoneOverrides[def.id] };
    }
    return def;
  }).filter((m) => m.active);

  const totalAvailableWeight = activeMilestones.reduce((sum, m) => sum + m.weight, 0);

  // First pass: evaluate raw completion states from verifiers
  const rawCompletionMap = new Map<string, boolean>();
  activeMilestones.forEach((m) => {
    const isCompleted = m.verifier(p, completedTagSet);
    rawCompletionMap.set(m.id, isCompleted);
  });

  // Helper to check if a milestone and all its ancestor prerequisites are met
  const isPrerequisiteMet = (prereqId?: string): boolean => {
    if (!prereqId) return true;
    if (!rawCompletionMap.get(prereqId)) return false;
    const prereqDef = activeMilestones.find((m) => m.id === prereqId);
    return prereqDef ? isPrerequisiteMet(prereqDef.prerequisiteId) : true;
  };

  // Second pass: determine effective completion (verifies prerequisites) & find next step
  let completedWeight = 0;
  let nextMilestone: ReadinessMilestoneDefinition | null = null;

  const items: MilestoneProgressItem[] = activeMilestones.map((def) => {
    const prereqMet = isPrerequisiteMet(def.prerequisiteId);
    const rawCompleted = Boolean(rawCompletionMap.get(def.id));
    const isCompleted = rawCompleted && prereqMet;
    const isBlockedByPrereq = !prereqMet;

    if (isCompleted) {
      completedWeight += def.weight;
    }

    const isNext = !isCompleted && !nextMilestone && !isBlockedByPrereq;
    if (isNext) {
      nextMilestone = def;
    }

    return {
      definition: def,
      isCompleted,
      isNextStep: isNext,
      isBlockedByPrereq,
    };
  });

  // If all unblocked are completed, find any remaining incomplete milestone
  if (!nextMilestone) {
    const remaining = items.find((i) => !i.isCompleted);
    if (remaining) {
      nextMilestone = remaining.definition;
    }
  }

  // Mathematically derived score (clamped between 0 and 100)
  const score = Math.min(100, Math.max(0, completedWeight));
  const completedMilestonesCount = items.filter((i) => i.isCompleted).length;
  const totalMilestonesCount = items.length;
  const percentage = Math.round((completedMilestonesCount / (totalMilestonesCount || 1)) * 100);
  const isJourneyComplete = score === 100 || completedMilestonesCount === totalMilestonesCount;

  // Determine stage description
  let currentStage = 'Business Foundation';
  let currentStageNumber = 1;
  if (score >= 100) {
    currentStage = 'Funding Ready';
    currentStageNumber = 4;
  } else if (score >= 75) {
    currentStage = 'Funding Preparation';
    currentStageNumber = 4;
  } else if (score >= 50) {
    currentStage = 'Revolving Credit & Seasoning';
    currentStageNumber = 3;
  } else if (score >= 25) {
    currentStage = 'Credit Profile & Tradelines';
    currentStageNumber = 2;
  }

  return {
    score,
    totalAvailableWeight,
    completedWeight,
    totalMilestonesCount,
    completedMilestonesCount,
    percentage,
    currentStage,
    currentStageNumber,
    totalStages: 4,
    nextMilestone,
    items,
    isJourneyComplete,
    scoreExplanation:
      'This score represents how many of the recommended Crediqly business-credit and funding-readiness milestones you have completed.',
    legalDisclaimer:
      'The Crediqly Funding Readiness score is an internal educational progress measure based on completed milestones. It is not an official credit bureau score (such as Dun & Bradstreet Paydex or Experian Intelliscore) and does not guarantee funding approval or specific lender terms.',
  };
}
