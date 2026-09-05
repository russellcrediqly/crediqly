import { BusinessProfile, ReadinessScoreResult } from '@/types/business';
import { FundingReadinessResult } from '@/types/funding';
import { calculateProfileCompletion } from '@/lib/scoring/engine';

export type JourneyStageStatus = 'completed' | 'in_progress' | 'upcoming';

export interface JourneyStage {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  status: JourneyStageStatus;
  progress: number; // 0 to 100
  detail: string;
  actionLabel: string;
  actionHref: string;
  whyItMatters: string;
  iconName: 'profile' | 'foundation' | 'credit' | 'readiness' | 'funding_readiness' | 'funding_options';
}

export interface CustomerJourneyResult {
  stages: JourneyStage[];
  activeStep: JourneyStage;
  activeStepNumber: number; // 1 to 6
  totalSteps: number; // 6
  completedStepsCount: number;
  overallProgress: number; // 0 to 100%
  profileCompletionPercentage: number;
}

/**
 * Calculates deterministic 6-stage Customer Journey progression.
 * Provides clear guidance on:
 * 1. Current step
 * 2. Accomplished milestones
 * 3. Next action
 * 4. Why it matters
 * 5. Direct 1-click CTA
 *
 * NOTE: Features are NEVER locked out based on this journey.
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

  // 1. Stage 1: Build Your Business Profile
  const stage1Complete = isProfileComplete;
  const stage1Progress = profileCompletion;

  // 2. Stage 2: Business Credit Foundation
  const foundationChecks = [
    business?.hasEIN === 'yes',
    business?.hasBusinessBankAccount === 'yes',
    business?.hasWebsite === 'yes',
    business?.hasBusinessPhone === 'yes',
    business?.hasBusinessEmail === 'yes',
    business?.hasBusinessAddress === 'yes',
    business?.hasBusinessLicense === 'yes' || business?.hasBusinessLicense === 'not_applicable',
    business?.hasDuns === 'yes',
  ];
  const foundationMetCount = foundationChecks.filter(Boolean).length;
  // Completed if at least 6 core foundation markers are in place and profile is complete
  const stage2Complete = stage1Complete && (foundationMetCount >= 6 || businessReadiness.score >= 80);
  const stage2Progress = Math.round((foundationMetCount / 8) * 100);

  // 3. Stage 3: Build Business Credit
  const hasAccounts = Boolean(
    business?.hasReportingAccounts === 'yes' ||
    (business?.businessCreditAccountCount && ['3-5', '6-10', '10+'].includes(business.businessCreditAccountCount)) ||
    business?.hasBusinessCreditCard === 'yes' ||
    creditReadiness.score >= 50
  );
  const stage3Complete = stage2Complete && hasAccounts;
  const stage3Progress = stage3Complete ? 100 : hasAccounts ? 60 : (business?.hasBusinessCreditProfile === 'yes' ? 35 : 15);

  // 4. Stage 4: Improve Business Readiness
  const readinessPassed = businessReadiness.score >= 65 && creditReadiness.score >= 40;
  const stage4Complete = stage3Complete && readinessPassed;
  const stage4Progress = Math.min(100, Math.round((businessReadiness.score + creditReadiness.score) / 2));

  // 5. Stage 5: Funding Readiness
  const fundingReady = fundingReadiness.score >= 65 || ['Strong Readiness', 'Funding Ready'].includes(fundingReadiness.level);
  const stage5Complete = stage4Complete && fundingReady;
  const stage5Progress = fundingReadiness.score;

  // 6. Stage 6: Explore Funding Options
  const hasApplications = trackedAppsCount > 0;
  const stage6Complete = stage5Complete && hasApplications;
  const stage6Progress = hasApplications ? 100 : (stage5Complete ? 50 : 20);

  // Determine stage statuses sequentially
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
  const stage6Status: JourneyStageStatus = stage6Complete
    ? 'completed'
    : stage5Complete
    ? 'in_progress'
    : 'upcoming';

  const stages: JourneyStage[] = [
    {
      id: 1,
      title: 'Build Your Business Profile',
      shortTitle: 'Business Profile',
      description: 'Complete basic entity details, industry classification, and contact information.',
      status: stage1Status,
      progress: stage1Progress,
      detail: `${stage1Progress}% completed`,
      actionLabel: stage1Complete ? 'View Profile' : 'Continue Setup',
      actionHref: stage1Complete ? '/business' : '/onboarding',
      whyItMatters: 'A completed profile generates your personalized credit roadmap and activates accurate readiness scoring.',
      iconName: 'profile',
    },
    {
      id: 2,
      title: 'Business Credit Foundation',
      shortTitle: 'Foundation',
      description: 'Establish commercial checking, federal EIN, official commercial address, phone, and D-U-N-S.',
      status: stage2Status,
      progress: stage2Progress,
      detail: `${foundationMetCount} of 8 core foundation items in place`,
      actionLabel: stage2Complete ? 'View Foundation' : 'Complete Foundation',
      actionHref: '/business',
      whyItMatters: 'Commercial lenders and credit bureaus verify commercial legitimacy before granting business credit.',
      iconName: 'foundation',
    },
    {
      id: 3,
      title: 'Build Business Credit',
      shortTitle: 'Build Credit',
      description: 'Open Tier 1 vendor tradelines, net-30 accounts, and commercial credit lines that report.',
      status: stage3Status,
      progress: stage3Progress,
      detail: hasAccounts ? 'Reporting tradelines active' : 'Add 3+ reporting Net-30 vendor accounts',
      actionLabel: 'Browse Net-30 Vendors',
      actionHref: '/products',
      whyItMatters: 'Vendor tradelines report on-time payments to D&B and Experian Business, establishing your bureau scores.',
      iconName: 'credit',
    },
    {
      id: 4,
      title: 'Improve Business Readiness',
      shortTitle: 'Business Readiness',
      description: 'Strengthen operational compliance, licenses, credibility markers, and financial health.',
      status: stage4Status,
      progress: stage4Progress,
      detail: `Readiness Score: ${businessReadiness.score}/100 (${businessReadiness.level})`,
      actionLabel: 'View Readiness Report',
      actionHref: '/readiness',
      whyItMatters: 'Higher readiness scores reduce automated lender declinations and qualify you for prime borrowing rates.',
      iconName: 'readiness',
    },
    {
      id: 5,
      title: 'Funding Readiness',
      shortTitle: 'Funding Readiness',
      description: 'Evaluate time-in-business, annual revenue, and commercial criteria against lender benchmarks.',
      status: stage5Status,
      progress: stage5Progress,
      detail: `Funding Readiness: ${fundingReadiness.score}/100 (${fundingReadiness.level})`,
      actionLabel: 'Check Funding Criteria',
      actionHref: '/funding',
      whyItMatters: 'Understanding strict lender criteria beforehand ensures you apply only to financing programs you qualify for.',
      iconName: 'funding_readiness',
    },
    {
      id: 6,
      title: 'Explore Funding Options',
      shortTitle: 'Funding Options',
      description: 'Compare matched commercial lines of credit, term loans, SBA funding, and credit cards.',
      status: stage6Status,
      progress: stage6Progress,
      detail: hasApplications ? `${trackedAppsCount} funding application(s) tracked` : 'Explore pre-matched lenders',
      actionLabel: 'Explore Funding Options',
      actionHref: '/funding',
      whyItMatters: 'Access non-dilutive commercial capital to scale operations, purchase inventory, and maintain cash flow.',
      iconName: 'funding_options',
    },
  ];

  // Active step is the first in_progress stage, or stage 1 if none, or stage 6 if all complete
  const activeStep = stages.find((s) => s.status === 'in_progress') || (stage6Complete ? stages[5] : stages[0]);
  const activeStepNumber = activeStep.id;

  const completedStepsCount = stages.filter((s) => s.status === 'completed').length;
  // Weighted overall progress: completed stages contribute 100/6 each, active stage contributes partially
  const overallProgress = Math.min(
    100,
    Math.round((completedStepsCount / 6) * 100 + (activeStep.status === 'in_progress' ? (activeStep.progress / 6) : 0))
  );

  return {
    stages,
    activeStep,
    activeStepNumber,
    totalSteps: 6,
    completedStepsCount,
    overallProgress,
    profileCompletionPercentage: profileCompletion,
  };
}
