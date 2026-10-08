import type { BusinessProfile, ReadinessScoreResult } from '../../types/business';
import type { FundingReadinessResult } from '../../types/funding';
import { calculateProfileCompletion } from '../scoring/engine.ts';

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
  // STAGE 1: 01 ESTABLISH (Entity, EIN, Bank, Digital Presence)
  // --------------------------------------------------------------------------
  const hasEntity = Boolean(business?.entityType && business.entityType.trim() !== '' && business.entityType !== 'Not sure');
  const hasEIN = business?.hasEIN === 'yes';
  const hasBank = business?.hasBusinessBankAccount === 'yes';
  const stage1Complete = isProfileComplete && hasEntity && hasEIN && hasBank;
  const stage1Progress = stage1Complete
    ? 100
    : Math.round(((hasEntity ? 30 : 0) + (hasEIN ? 35 : 0) + (hasBank ? 35 : 0)));

  // --------------------------------------------------------------------------
  // STAGE 2: 02 BUILD (Bureau Files, Net-30 Vendor Tradelines, Early Payments)
  // --------------------------------------------------------------------------
  const hasDuns = business?.hasDuns === 'yes';
  const hasCreditProfile = business?.hasBusinessCreditProfile === 'yes' || hasDuns;
  const hasReporting = business?.hasReportingAccounts === 'yes';
  const stage2Complete = stage1Complete && (hasCreditProfile || hasReporting || creditReadiness.score >= 40);
  const stage2Progress = stage2Complete
    ? 100
    : stage1Complete
    ? Math.min(90, Math.max(30, Math.round(creditReadiness.score * 0.9 + (hasReporting ? 25 : 0))))
    : 15;

  // --------------------------------------------------------------------------
  // STAGE 3: 03 STRENGTHEN (Revolving Cards, Depth, Low Utilization)
  // --------------------------------------------------------------------------
  const hasCard = business?.hasBusinessCreditCard === 'yes';
  const highAccountCount =
    business?.businessCreditAccountCount === '4-5' ||
    business?.businessCreditAccountCount === '6-10' ||
    business?.businessCreditAccountCount === '10+';
  const stage3Complete = stage2Complete && hasReporting && (hasCard || highAccountCount || creditReadiness.score >= 60);
  const stage3Progress = stage3Complete
    ? 100
    : stage2Complete
    ? Math.min(90, Math.max(25, Math.round(fundingReadiness.score * 0.85 + (hasCard ? 15 : 0))))
    : 10;

  // --------------------------------------------------------------------------
  // STAGE 4: 04 FUNDING READY (Capital Target, Revenue Seasoning, 70+ Score)
  // --------------------------------------------------------------------------
  const isFundingScoreReady = fundingReadiness.score >= 70 || ['Strong Readiness', 'Funding Ready'].includes(fundingReadiness.level);
  const stage4Complete = stage3Complete && isFundingScoreReady;
  const stage4Progress = stage4Complete ? 100 : stage3Complete ? Math.min(95, fundingReadiness.score) : 10;

  // --------------------------------------------------------------------------
  // STAGE 5: 05 SCALE (Matched Capital, Comparison, Multi-Facility Growth)
  // --------------------------------------------------------------------------
  const hasFinancingOrApps =
    trackedAppsCount > 0 ||
    business?.hasFundingHistory === 'yes' ||
    Boolean((business as any)?.fundingHistory === 'yes');
  const stage5Complete = stage4Complete && hasFinancingOrApps;
  const stage5Progress = stage5Complete ? 100 : stage4Complete ? 50 : 10;

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
      title: 'Establish',
      stageName: 'ESTABLISH',
      fullTitle: '01 — ESTABLISH',
      shortExplanation: 'Establish your formal business entity, federal EIN, and dedicated commercial bank account.',
      status: stage1Status,
      progress: stage1Progress,
      recommendedAction: stage1Complete
        ? 'Business foundation and commercial banking verified.'
        : !hasEntity
        ? 'Register or verify your formal business entity structure.'
        : !hasEIN
        ? 'Obtain your Federal EIN from the IRS.'
        : 'Open a dedicated commercial checking account.',
      actionLabel: stage1Complete ? 'View Profile' : 'Complete Setup',
      actionHref: stage1Complete ? '/business' : '/onboarding',
      whyItMatters: 'Accurate legal entity and structure details are required by commercial bureaus and underwriters to establish your business identity.',
      iconName: 'establish',
    },
    {
      id: 2,
      numberPrefix: '02',
      title: 'Build',
      stageName: 'BUILD',
      fullTitle: '02 — BUILD',
      shortExplanation: 'Register with major business credit bureaus and open initial Tier-1 Net-30 vendor tradelines.',
      status: stage2Status,
      progress: stage2Progress,
      recommendedAction: !hasCreditProfile
        ? 'Confirm your commercial credit file with Dun & Bradstreet (D-U-N-S).'
        : 'Open 2–3 Tier-1 Net-30 vendor accounts that report monthly.',
      actionLabel: !hasCreditProfile ? 'Confirm D-U-N-S / File' : 'Browse Net-30 Vendors',
      actionHref: !hasCreditProfile ? '/business' : '/products?category=net_30',
      whyItMatters: 'Net-30 vendor accounts report prompt payment experiences to D&B and Experian, building your commercial credit score.',
      iconName: 'build',
    },
    {
      id: 3,
      numberPrefix: '03',
      title: 'Strengthen',
      stageName: 'STRENGTHEN',
      fullTitle: '03 — STRENGTHEN',
      shortExplanation: 'Continue building a stronger business-credit profile and improve your funding readiness.',
      status: stage3Status,
      progress: stage3Progress,
      recommendedAction: !hasCard
        ? 'Apply for a revolving business credit card or store credit account.'
        : 'Maintain low revolving utilization (<30%) and monitor reports.',
      actionLabel: 'View Next Steps',
      actionHref: '/products?category=business_credit_cards',
      whyItMatters: 'Revolving commercial credit cards and consistent monthly cash flow demonstrate ongoing financial discipline to lenders.',
      iconName: 'strengthen',
    },
    {
      id: 4,
      numberPrefix: '04',
      title: 'Funding Ready',
      stageName: 'FUNDING READY',
      fullTitle: '04 — FUNDING READY',
      shortExplanation: 'Satisfy automated lender underwriting thresholds across cash flow, longevity, and credit depth.',
      status: stage4Status,
      progress: stage4Progress,
      recommendedAction: isFundingScoreReady
        ? 'Funding readiness threshold reached. Compare loan and credit line criteria.'
        : 'Review lender readiness factors and debt-service requirements.',
      actionLabel: isFundingScoreReady ? 'Explore Funding Matches' : 'Check Funding Criteria',
      actionHref: isFundingScoreReady ? '/funding' : '/readiness',
      whyItMatters: 'Meeting underwriting criteria beforehand ensures you apply for financing products you have strong eligibility for.',
      iconName: 'funding_ready',
    },
    {
      id: 5,
      numberPrefix: '05',
      title: 'Scale',
      stageName: 'SCALE',
      fullTitle: '05 — SCALE',
      shortExplanation: 'Compare matched financing offers, apply for pre-screened capital, and manage multiple credit lines.',
      status: stage5Status,
      progress: stage5Progress,
      recommendedAction: stage5Complete
        ? 'Financing facilities active. Review ongoing credit health and rate optimizations.'
        : 'Compare pre-screened commercial loan and credit line options.',
      actionLabel: 'Compare Capital Options',
      actionHref: '/funding',
      whyItMatters: 'Acquiring non-dilutive commercial capital fuels business expansion while preserving equity.',
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

  const currentStageLabel = activeStep.fullTitle;
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
    currentFocus = 'Establish business entity, EIN, and commercial banking';
  } else if (activeStep.id === 2) {
    currentFocus = 'Build initial bureau presence and reporting Net-30 vendor accounts';
  } else if (activeStep.id === 3) {
    currentFocus = 'Strengthen revolving credit lines and maintain low utilization';
  } else if (activeStep.id === 4) {
    currentFocus = 'Satisfy lender underwriting criteria and reach 70+ funding readiness';
  } else {
    currentFocus = 'Compare matched funding options and scale credit lines';
  }

  // Next Milestone ("After This")
  let nextStepTitle = 'Explore Funding Opportunities';
  let potentialReadiness = 'Reassess readiness after completion';
  if (activeStep.id === 1) {
    nextStepTitle = '02 — BUILD';
    potentialReadiness = 'Unlocks Tier-1 Net-30 vendor tradelines and D-U-N-S registration';
  } else if (activeStep.id === 2) {
    nextStepTitle = '03 — STRENGTHEN';
    potentialReadiness = 'Establishes initial Paydex scoring and commercial trade depth';
  } else if (activeStep.id === 3) {
    nextStepTitle = '04 — FUNDING READY';
    potentialReadiness = 'Expands revolving credit capacity towards lender underwriting thresholds';
  } else if (activeStep.id === 4) {
    nextStepTitle = '05 — SCALE';
    potentialReadiness = 'Prepares your profile for commercial term loans and credit lines';
  } else {
    nextStepTitle = 'Maintain Prime Tier Standing';
    potentialReadiness = 'Continuous credit monitoring and facility expansion';
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
