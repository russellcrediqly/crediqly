import { BusinessProfile, ReadinessScoreResult } from '@/types/business';
import { FundingReadinessResult } from '@/types/funding';
import { calculateProfileCompletion } from '@/lib/scoring/engine';

export type JourneyStageStatus = 'completed' | 'in_progress' | 'upcoming';

export interface JourneyStage {
  id: number; // 1 to 5
  numberPrefix: string; // '01', '02', '03', '04', '05'
  title: string; // 'Complete Profile', 'Establish Credit', 'Build Business Credit', 'Strengthen Profile', 'Funding Ready'
  stageName: string; // 'PROFILE', 'ESTABLISH', 'BUILD', 'STRENGTHEN', 'FUNDING READY'
  fullTitle: string; // 'Step 1 — Complete Business Profile', etc.
  shortExplanation: string;
  status: JourneyStageStatus;
  progress: number; // 0 to 100%
  recommendedAction: string;
  actionLabel: string;
  actionHref: string;
  whyItMatters: string;
  iconName: 'establish' | 'build' | 'strengthen' | 'funding_ready' | 'scale';
}

export interface CustomerJourneyResult {
  stages: JourneyStage[];
  activeStep: JourneyStage;
  activeStepNumber: number; // 1 to 5
  totalSteps: number; // 5
  completedStepsCount: number;
  overallProgress: number; // 0 to 100%
  profileCompletionPercentage: number;
  currentStageLabel: string; // e.g. "BUILD" or "BUILD BUSINESS CREDIT"
  currentStageShortName: string; // e.g. "BUILD"
  completedMilestonesSummary: string[];
  currentFocus: string;
  afterThis: {
    nextStepTitle: string;
    potentialReadiness: string;
  };
  isFundingReady: boolean;
}

/**
 * Calculates deterministic 5-stage Business Credit & Funding Journey:
 * Step 1 — Complete Business Profile
 * Step 2 — Establish Business Credit
 * Step 3 — Build Business Credit
 * Step 4 — Strengthen Funding Profile
 * Step 5 — Funding Ready
 *
 * NOTE: Features are NEVER locked out based on this journey. It is guidance only.
 */
export function calculateCustomerJourney(
  business: Partial<BusinessProfile> | null,
  businessReadiness: ReadinessScoreResult,
  creditReadiness: ReadinessScoreResult,
  fundingReadiness: FundingReadinessResult,
  trackedAppsCount: number = 0
): CustomerJourneyResult {
  const profileCompletion = calculateProfileCompletion(business);
  const isProfileComplete = Boolean(business?.profileCompleted || profileCompletion >= 100);

  // --------------------------------------------------------------------------
  // STAGE 1: STEP 1 — COMPLETE BUSINESS PROFILE
  // --------------------------------------------------------------------------
  const hasEntity = Boolean(business?.entityType && business.entityType.trim() !== '' && business.entityType !== 'Not sure');
  const stage1Complete = isProfileComplete && hasEntity;
  const stage1Progress = Math.min(100, Math.round(profileCompletion));

  // --------------------------------------------------------------------------
  // STAGE 2: STEP 2 — ESTABLISH BUSINESS CREDIT
  // --------------------------------------------------------------------------
  const hasEIN = business?.hasEIN === 'yes';
  const hasBank = business?.hasBusinessBankAccount === 'yes';
  const hasCreditProfile = business?.hasBusinessCreditProfile === 'yes';
  const hasDuns = business?.hasDuns === 'yes';
  const foundationChecks = [
    hasEIN,
    hasBank,
    business?.hasWebsite === 'yes',
    business?.hasBusinessPhone === 'yes',
    business?.hasBusinessAddress === 'yes',
  ];
  const foundationCount = foundationChecks.filter(Boolean).length;
  const stage2Complete = stage1Complete && hasEIN && hasBank && (hasCreditProfile || hasDuns || foundationCount >= 3);
  const stage2Progress = stage2Complete
    ? 100
    : stage1Complete
    ? Math.min(90, Math.max(25, Math.round((foundationCount / 5) * 80 + (hasCreditProfile ? 20 : 0))))
    : 10;

  // --------------------------------------------------------------------------
  // STAGE 3: STEP 3 — BUILD BUSINESS CREDIT
  // --------------------------------------------------------------------------
  const hasReporting = business?.hasReportingAccounts === 'yes';
  const highAccountCount =
    business?.businessCreditAccountCount === '4-5' ||
    business?.businessCreditAccountCount === '6-10' ||
    business?.businessCreditAccountCount === '10+';
  const stage3Complete = stage2Complete && (hasReporting || highAccountCount || creditReadiness.score >= 50);
  const stage3Progress = stage3Complete
    ? 100
    : stage2Complete
    ? Math.min(90, Math.max(30, Math.round(creditReadiness.score * 0.9 + (hasReporting ? 25 : 0))))
    : 10;

  // --------------------------------------------------------------------------
  // STAGE 4: STEP 4 — STRENGTHEN FUNDING PROFILE
  // --------------------------------------------------------------------------
  const hasCard = business?.hasBusinessCreditCard === 'yes';
  const isRevenueValid = Boolean(
    business?.annualRevenueRange &&
    business.annualRevenueRange !== 'Pre-revenue' &&
    business.annualRevenueRange !== 'Under $10,000'
  );
  const stage4Complete = stage3Complete && (hasCard || isRevenueValid || fundingReadiness.score >= 65);
  const stage4Progress = stage4Complete
    ? 100
    : stage3Complete
    ? Math.min(90, Math.max(25, Math.round(fundingReadiness.score * 0.85 + (hasCard ? 15 : 0))))
    : 10;

  // --------------------------------------------------------------------------
  // STAGE 5: STEP 5 — FUNDING READY
  // --------------------------------------------------------------------------
  const isFundingScoreReady = fundingReadiness.score >= 70 || ['Strong Readiness', 'Funding Ready'].includes(fundingReadiness.level);
  const stage5Complete = stage4Complete && isFundingScoreReady;
  const stage5Progress = stage5Complete ? 100 : stage4Complete ? Math.min(95, fundingReadiness.score) : 10;

  // --------------------------------------------------------------------------
  // SEQUENTIAL STATUS ASSIGNMENT
  // --------------------------------------------------------------------------
  const stage1Status: JourneyStageStatus = stage1Complete ? 'completed' : 'in_progress';
  const stage2Status: JourneyStageStatus = stage2Complete
    ? 'completed'
    : stage1Complete
    ? 'in_progress'
    : 'upcoming';
  const stage3Status: JourneyStageStatus = stage3Complete
    ? 'completed'
    : stage2Complete
    ? 'in_progress'
    : 'upcoming';
  const stage4Status: JourneyStageStatus = stage4Complete
    ? 'completed'
    : stage3Complete
    ? 'in_progress'
    : 'upcoming';
  const stage5Status: JourneyStageStatus = stage5Complete
    ? 'completed'
    : stage4Complete
    ? 'in_progress'
    : 'upcoming';

  const stages: JourneyStage[] = [
    {
      id: 1,
      numberPrefix: '01',
      title: 'Complete Profile',
      stageName: 'PROFILE',
      fullTitle: 'Step 1 — Complete Business Profile',
      shortExplanation: 'Complete your business profile questionnaire, legal entity details, and contact information.',
      status: stage1Status,
      progress: stage1Progress,
      recommendedAction: stage1Complete
        ? 'Business profile and foundational entity verified.'
        : 'Complete your profile questionnaire to unlock customized readiness metrics.',
      actionLabel: stage1Complete ? 'View Profile' : 'Complete Profile',
      actionHref: stage1Complete ? '/business' : '/onboarding',
      whyItMatters: 'Accurate legal entity and structure details are required by commercial bureaus and underwriters to establish your business identity.',
      iconName: 'establish',
    },
    {
      id: 2,
      numberPrefix: '02',
      title: 'Establish Credit',
      stageName: 'ESTABLISH',
      fullTitle: 'Step 2 — Establish Business Credit',
      shortExplanation: 'Establish your Federal EIN, open a dedicated commercial checking account, and register bureau identifiers.',
      status: stage2Status,
      progress: stage2Progress,
      recommendedAction: !hasEIN
        ? 'Obtain or verify your Federal EIN from the IRS.'
        : !hasBank
        ? 'Open a dedicated commercial checking account in your business name.'
        : 'Register your business credit file with Dun & Bradstreet and Experian Business.',
      actionLabel: !hasBank ? 'Review Business Banking' : 'Establish Business Credit',
      actionHref: !hasBank ? '/roadmap?filter=foundation' : '/roadmap?filter=credit_foundation',
      whyItMatters: 'Separating business finances with an EIN and dedicated commercial account protects personal liability and creates your credit profile.',
      iconName: 'build',
    },
    {
      id: 3,
      numberPrefix: '03',
      title: 'Build Business Credit',
      stageName: 'BUILD',
      fullTitle: 'Step 3 — Build Business Credit',
      shortExplanation: 'Establish initial Net-30 vendor tradelines that report monthly to commercial credit bureaus.',
      status: stage3Status,
      progress: stage3Progress,
      recommendedAction: hasReporting
        ? 'Active tradelines reporting. Add 2–3 additional reporting vendors.'
        : 'Open Tier-1 Net-30 vendor accounts to establish initial bureau trade depth.',
      actionLabel: 'Explore Net-30 Vendors',
      actionHref: '/products?category=net_30',
      whyItMatters: 'Net-30 vendor accounts report prompt payment experiences to D&B and Experian, building your commercial credit score.',
      iconName: 'strengthen',
    },
    {
      id: 4,
      numberPrefix: '04',
      title: 'Strengthen Profile',
      stageName: 'STRENGTHEN',
      fullTitle: 'Step 4 — Strengthen Funding Profile',
      shortExplanation: 'Expand to revolving commercial credit cards, optimize utilization, and maintain steady revenue deposits.',
      status: stage4Status,
      progress: stage4Progress,
      recommendedAction: !hasCard
        ? 'Apply for a revolving business credit card to expand credit lines.'
        : 'Maintain low revolving utilization and steady monthly bank deposits.',
      actionLabel: 'Review Business Credit Cards',
      actionHref: '/products?category=business_credit_cards',
      whyItMatters: 'Revolving commercial credit cards and consistent monthly cash flow demonstrate ongoing financial discipline to lenders.',
      iconName: 'funding_ready',
    },
    {
      id: 5,
      numberPrefix: '05',
      title: 'Funding Ready',
      stageName: 'FUNDING READY',
      fullTitle: 'Step 5 — Funding Ready',
      shortExplanation: 'Meet lender underwriting thresholds across credit depth, operating age, and revenue to explore matched funding opportunities.',
      status: stage5Status,
      progress: stage5Progress,
      recommendedAction: isFundingScoreReady
        ? 'Funding readiness threshold reached. Compare loan and credit line criteria.'
        : 'Review lender readiness factors and improve specific gap areas.',
      actionLabel: isFundingScoreReady ? 'Explore Funding Matches' : 'Improve Funding Readiness',
      actionHref: isFundingScoreReady ? '/funding' : '/readiness',
      whyItMatters: 'Meeting underwriting criteria beforehand ensures you apply for financing products you have strong eligibility for.',
      iconName: 'scale',
    },
  ];

  // Active step is the first in_progress stage, or stage 1, or stage 5 if all complete
  const activeStep = stages.find((s) => s.status === 'in_progress') || (stage5Complete ? stages[4] : stages[0]);
  const activeStepNumber = activeStep.id;

  const completedStepsCount = stages.filter((s) => s.status === 'completed').length;
  const overallProgress = Math.min(
    100,
    Math.round((completedStepsCount / 5) * 100 + (activeStep.status === 'in_progress' ? activeStep.progress / 5 : 0))
  );

  const currentStageLabel = activeStep.title.toUpperCase();
  const currentStageShortName = activeStep.stageName;

  // Completed Milestones Summary
  const completedMilestonesSummary: string[] = [];
  if (isProfileComplete) completedMilestonesSummary.push('Business profile complete');
  if (hasEntity) completedMilestonesSummary.push('Business entity verified');
  if (hasEIN) completedMilestonesSummary.push('Federal EIN established');
  if (hasBank) completedMilestonesSummary.push('Commercial banking active');
  if (hasCreditProfile || hasDuns) completedMilestonesSummary.push('Bureau credit profile active');
  if (hasReporting) completedMilestonesSummary.push('Reporting tradelines established');
  if (hasCard) completedMilestonesSummary.push('Revolving commercial credit active');
  if (fundingReadiness.score >= 50) completedMilestonesSummary.push('Readiness assessment baseline reached');

  // If new user with few completed items, show foundational completions
  if (completedMilestonesSummary.length === 0) {
    completedMilestonesSummary.push('Initial account created');
  }

  // Current focus text
  let currentFocus = activeStep.recommendedAction;
  if (activeStep.id === 1) {
    currentFocus = 'Complete business profile questionnaire';
  } else if (activeStep.id === 2) {
    currentFocus = !hasBank ? 'Establish dedicated commercial banking' : 'Establish formal business credit baseline';
  } else if (activeStep.id === 3) {
    currentFocus = 'Build stronger business credit depth with reporting vendors';
  } else if (activeStep.id === 4) {
    currentFocus = 'Strengthen funding profile with revolving lines and deposit consistency';
  } else {
    currentFocus = isFundingScoreReady ? 'Review matched funding opportunities' : 'Satisfy final lender readiness criteria';
  }

  // Next Milestone ("After This")
  let nextStepTitle = 'Explore Funding Opportunities';
  let potentialReadiness = 'Reassess readiness after completion';
  if (activeStep.id === 1) {
    nextStepTitle = 'Step 2 — Establish Business Credit';
    potentialReadiness = 'Unlocks live Funding Readiness calculation';
  } else if (activeStep.id === 2) {
    nextStepTitle = 'Step 3 — Build Business Credit';
    potentialReadiness = 'Establishing commercial accounts strengthens your foundation';
  } else if (activeStep.id === 3) {
    nextStepTitle = 'Step 4 — Strengthen Funding Profile';
    potentialReadiness = 'Adding reporting tradelines builds commercial credit depth';
  } else if (activeStep.id === 4) {
    nextStepTitle = 'Step 5 — Funding Ready';
    potentialReadiness = 'Expanding revolving credit moves you closer to funding thresholds';
  } else {
    nextStepTitle = 'Explore Matched Capital Options';
    potentialReadiness = 'Funding Ready (70+ score achieved)';
  }

  return {
    stages,
    activeStep,
    activeStepNumber,
    totalSteps: 5,
    completedStepsCount,
    overallProgress,
    profileCompletionPercentage: profileCompletion,
    currentStageLabel,
    currentStageShortName,
    completedMilestonesSummary,
    currentFocus,
    afterThis: {
      nextStepTitle,
      potentialReadiness,
    },
    isFundingReady: isFundingScoreReady,
  };
}
