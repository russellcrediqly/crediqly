import { BusinessProfile, ReadinessScoreResult } from '@/types/business';
import { FundingReadinessResult } from '@/types/funding';
import { calculateProfileCompletion } from '@/lib/scoring/engine';

export type JourneyStageStatus = 'completed' | 'in_progress' | 'upcoming';

export interface JourneyStage {
  id: number; // 1 to 5
  numberPrefix: string; // '01', '02', '03', '04', '05'
  title: string; // 'Establish', 'Build', 'Strengthen', 'Funding Ready', 'Scale'
  fullTitle: string; // '01 — ESTABLISH', etc.
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
  currentStageLabel: string; // e.g. "03 — STRENGTHEN"
}

/**
 * Calculates deterministic 5-stage Business Credit Journey progression:
 * 01 ESTABLISH → 02 BUILD → 03 STRENGTHEN → 04 FUNDING READY → 05 SCALE
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
  // STAGE 1: 01 ESTABLISH
  // --------------------------------------------------------------------------
  const hasEntity = Boolean(business?.entityType && business.entityType.trim() !== '' && business.entityType !== 'Not sure');
  const hasEIN = business?.hasEIN === 'yes';
  const hasBank = business?.hasBusinessBankAccount === 'yes';
  const foundationChecks = [
    hasEntity,
    hasEIN,
    hasBank,
    business?.hasWebsite === 'yes',
    business?.hasBusinessPhone === 'yes',
    business?.hasBusinessAddress === 'yes',
  ];
  const foundationCount = foundationChecks.filter(Boolean).length;
  const stage1Complete = isProfileComplete && hasEntity && hasEIN && hasBank;
  const stage1Progress = Math.min(100, Math.round(((profileCompletion * 0.4) + ((foundationCount / 6) * 60))));

  // --------------------------------------------------------------------------
  // STAGE 2: 02 BUILD
  // --------------------------------------------------------------------------
  const hasCreditProfile = business?.hasBusinessCreditProfile === 'yes';
  const hasReporting = business?.hasReportingAccounts === 'yes';
  const hasDuns = business?.hasDuns === 'yes';
  const stage2Complete = stage1Complete && (hasCreditProfile || hasReporting || creditReadiness.score >= 40);
  const stage2Progress = stage2Complete
    ? 100
    : stage1Complete
    ? Math.min(90, Math.max(25, Math.round(((hasCreditProfile ? 40 : 10) + (hasReporting ? 40 : 10) + (hasDuns ? 10 : 0)))))
    : 15;

  // --------------------------------------------------------------------------
  // STAGE 3: 03 STRENGTHEN
  // --------------------------------------------------------------------------
  const hasCard = business?.hasBusinessCreditCard === 'yes';
  const highAccountCount = business?.businessCreditAccountCount === '4-5' || business?.businessCreditAccountCount === '6-10' || business?.businessCreditAccountCount === '10+';
  const stage3Complete = stage2Complete && hasReporting && (hasCard || highAccountCount || creditReadiness.score >= 60);
  const stage3Progress = stage3Complete
    ? 100
    : stage2Complete
    ? Math.min(90, Math.max(30, Math.round(creditReadiness.score * 0.9 + (hasCard ? 15 : 0))))
    : 10;

  // --------------------------------------------------------------------------
  // STAGE 4: 04 FUNDING READY
  // --------------------------------------------------------------------------
  const isFundingScoreReady = fundingReadiness.score >= 70 || ['Strong Readiness', 'Funding Ready'].includes(fundingReadiness.level);
  const stage4Complete = stage3Complete && isFundingScoreReady;
  const stage4Progress = stage4Complete
    ? 100
    : stage3Complete
    ? Math.min(95, Math.max(20, fundingReadiness.score))
    : 10;

  // --------------------------------------------------------------------------
  // STAGE 5: 05 SCALE
  // --------------------------------------------------------------------------
  const hasFinancingOrApps = trackedAppsCount > 0 || business?.hasFundingHistory === 'yes';
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
      fullTitle: '01 — ESTABLISH',
      shortExplanation: 'Establish your formal business entity, federal EIN, and dedicated commercial bank account.',
      status: stage1Status,
      progress: stage1Progress,
      recommendedAction: stage1Complete
        ? 'Business foundation and commercial banking verified.'
        : !isProfileComplete
        ? 'Complete your profile questionnaire.'
        : 'Open a dedicated commercial checking account.',
      actionLabel: stage1Complete ? 'View Profile' : 'Complete Setup',
      actionHref: stage1Complete ? '/business' : '/onboarding',
      whyItMatters: 'A formal legal entity and commercial bank account protect personal assets and form your credit foundation.',
      iconName: 'establish',
    },
    {
      id: 2,
      numberPrefix: '02',
      title: 'Build',
      fullTitle: '02 — BUILD',
      shortExplanation: 'Register with major business credit bureaus and open initial Tier-1 Net-30 vendor tradelines.',
      status: stage2Status,
      progress: stage2Progress,
      recommendedAction: hasReporting
        ? 'Vendor tradelines reporting to commercial bureaus.'
        : 'Open 2–3 Tier-1 Net-30 vendor accounts that report monthly.',
      actionLabel: 'Browse Net-30 Vendors',
      actionHref: '/products?category=net_30',
      whyItMatters: 'Vendor tradelines report monthly payment experiences to D&B and Experian Business, generating your first commercial score.',
      iconName: 'build',
    },
    {
      id: 3,
      numberPrefix: '03',
      title: 'Strengthen',
      fullTitle: '03 — STRENGTHEN',
      shortExplanation: 'Continue building a stronger business-credit profile and improve your funding readiness.',
      status: stage3Status,
      progress: stage3Progress,
      recommendedAction: hasCard
        ? 'Revolving credit active. Maintain on-time payment history.'
        : 'Establish revolving commercial credit cards and expand reporting accounts.',
      actionLabel: 'View Next Steps',
      actionHref: '/products?category=business_credit_cards',
      whyItMatters: 'Multiple trade accounts and revolving commercial credit lines deepen your file for higher borrowing limits.',
      iconName: 'strengthen',
    },
    {
      id: 4,
      numberPrefix: '04',
      title: 'Funding Ready',
      fullTitle: '04 — FUNDING READY',
      shortExplanation: 'Satisfy automated lender underwriting thresholds across cash flow, longevity, and credit depth.',
      status: stage4Status,
      progress: stage4Progress,
      recommendedAction: isFundingScoreReady
        ? 'Funding readiness threshold reached. Compare loan criteria.'
        : 'Review lender readiness factors and debt-service requirements.',
      actionLabel: 'Check Funding Criteria',
      actionHref: '/readiness',
      whyItMatters: 'Verifying underwriting requirements beforehand ensures you apply only to loan programs you meet the criteria for.',
      iconName: 'funding_ready',
    },
    {
      id: 5,
      numberPrefix: '05',
      title: 'Scale',
      fullTitle: '05 — SCALE',
      shortExplanation: 'Leverage established commercial credit to secure institutional capital and expand operations.',
      status: stage5Status,
      progress: stage5Progress,
      recommendedAction: hasFinancingOrApps
        ? `${trackedAppsCount} funding application(s) tracked.`
        : 'Explore institutional term loans, lines of credit, and SBA capital.',
      actionLabel: 'Explore Funding Options',
      actionHref: '/funding',
      whyItMatters: 'Access non-dilutive low-interest capital to finance inventory, hire staff, and expand market operations.',
      iconName: 'scale',
    },
  ];

  // Active step is the first in_progress stage, or stage 1, or stage 5 if all complete
  const activeStep = stages.find((s) => s.status === 'in_progress') || (stage5Complete ? stages[4] : stages[0]);
  const activeStepNumber = activeStep.id;

  const completedStepsCount = stages.filter((s) => s.status === 'completed').length;
  // Weighted overall progress
  const overallProgress = Math.min(
    100,
    Math.round((completedStepsCount / 5) * 100 + (activeStep.status === 'in_progress' ? activeStep.progress / 5 : 0))
  );

  const currentStageLabel = `${activeStep.numberPrefix} — ${activeStep.title.toUpperCase()}`;

  return {
    stages,
    activeStep,
    activeStepNumber,
    totalSteps: 5,
    completedStepsCount,
    overallProgress,
    profileCompletionPercentage: profileCompletion,
    currentStageLabel,
  };
}
