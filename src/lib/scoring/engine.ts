import type { BusinessProfile, ReadinessScoreResult, ScoreLevel, ScoreCategoryBreakdown } from '../../types/business';

/**
 * Score Level categorization
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'Strong Foundation';
  if (score >= 60) return 'On Track';
  if (score >= 40) return 'Building';
  return 'Getting Started';
}

export function getBusinessReadinessDescription(level: ScoreLevel): string {
  switch (level) {
    case 'Strong Foundation':
      return 'Your business has established a solid operational foundation with prime readiness markers.';
    case 'On Track':
      return 'Your business foundation is developing well with most core commercial elements in place.';
    case 'Building':
      return 'Your business foundation is establishing momentum, with essential milestones underway.';
    case 'Getting Started':
    default:
      return 'You have a clear starting point for your business foundation. Completing the foundational steps is your best next move.';
  }
}

export function getCreditReadinessDescription(level: ScoreLevel): string {
  switch (level) {
    case 'Strong Foundation':
      return 'Your business has established active reporting accounts and positive trade history.';
    case 'On Track':
      return 'Your commercial credit profile is progressing well with active trade relationships.';
    case 'Building':
      return 'Your business credit profile is gaining momentum. Adding reporting vendor tradelines is your best next step.';
    case 'Getting Started':
    default:
      return 'You are at the starting point of your business credit profile. Building your first Tier 1 vendor trade lines is your best next step.';
  }
}

/**
 * Business Age Scoring Schedule
 */
export function calculateAgePoints(age?: string): number {
  switch (age) {
    case '5+ years':
      return 10;
    case '2–5 years':
      return 9;
    case '1–2 years':
      return 8;
    case '6–12 months':
      return 6;
    case '3–6 months':
      return 4;
    case 'Less than 3 months':
      return 2;
    default:
      return 0;
  }
}

/**
 * Account Count Scoring Schedule
 */
export function calculateAccountCountPoints(count?: string): number {
  switch (count) {
    case '10+':
      return 20;
    case '6-10':
      return 18;
    case '4-5':
      return 16;
    case '2-3':
      return 12;
    case '1':
      return 5;
    case 'none':
    case 'not_sure':
    default:
      return 0;
  }
}

/**
 * Calculate Business Readiness Score (0 to 100)
 */
export function calculateBusinessReadiness(profile: Partial<BusinessProfile> | null): ReadinessScoreResult {
  if (!profile) {
    return {
      score: 0,
      level: 'Getting Started',
      description: getBusinessReadinessDescription('Getting Started'),
      breakdown: [
        { label: 'Business Foundation', completed: 0, total: 8, percentage: 0 },
        { label: 'Credit Profile', completed: 0, total: 1, percentage: 0 },
        { label: 'Business History', completed: 0, total: 10, percentage: 0 },
      ],
    };
  }

  let totalScore = 0;

  // 1. Business entity / structure established: 10 points
  const hasEntity = Boolean(profile.entityType && profile.entityType !== 'Not sure');
  if (hasEntity) totalScore += 10;

  // 2. EIN: 15 points
  const hasEIN = profile.hasEIN === 'yes';
  if (hasEIN) totalScore += 15;

  // 3. Business bank account: 15 points
  const hasBankAccount = profile.hasBusinessBankAccount === 'yes';
  if (hasBankAccount) totalScore += 15;

  // 4. Business website: 5 points
  const hasWebsite = profile.hasWebsite === 'yes';
  if (hasWebsite) totalScore += 5;

  // 5. Dedicated business phone: 5 points
  const hasPhone = profile.hasBusinessPhone === 'yes';
  if (hasPhone) totalScore += 5;

  // 6. Professional business email: 5 points
  const hasEmail = profile.hasBusinessEmail === 'yes';
  if (hasEmail) totalScore += 5;

  // 7. Business address: 5 points
  const hasAddress = profile.hasBusinessAddress === 'yes';
  if (hasAddress) totalScore += 5;

  // 8. Business license: 5 points (yes or not applicable)
  const hasLicense = profile.hasBusinessLicense === 'yes' || profile.hasBusinessLicense === 'not_applicable';
  if (hasLicense) totalScore += 5;

  // 9. D-U-N-S: 5 points
  const hasDuns = profile.hasDuns === 'yes';
  if (hasDuns) totalScore += 5;

  // 10. Business credit profile: 20 points (allocated so total reaches 100 points)
  const hasCreditProfile = profile.hasBusinessCreditProfile === 'yes';
  if (hasCreditProfile) totalScore += 20;

  // 11. Business age: 10 points
  const agePoints = calculateAgePoints(profile.businessAge);
  totalScore += agePoints;

  const score = Math.min(100, Math.max(0, totalScore));
  const level = getScoreLevel(score);

  // Category breakdowns
  const foundationItems = [
    hasEntity,
    hasEIN,
    hasBankAccount,
    hasWebsite,
    hasPhone,
    hasEmail,
    hasAddress,
    hasLicense,
  ];
  const foundationCompleted = foundationItems.filter(Boolean).length;

  const breakdown: ScoreCategoryBreakdown[] = [
    {
      label: 'Business Foundation',
      completed: foundationCompleted,
      total: 8,
      percentage: Math.round((foundationCompleted / 8) * 100),
    },
    {
      label: 'Credit Profile',
      completed: hasCreditProfile ? 1 : 0,
      total: 1,
      percentage: hasCreditProfile ? 100 : 0,
    },
    {
      label: 'Business History',
      completed: agePoints,
      total: 10,
      percentage: Math.round((agePoints / 10) * 100),
    },
  ];

  return {
    score,
    level,
    description: getBusinessReadinessDescription(level),
    breakdown,
  };
}

/**
 * Calculate Credit Readiness Score (0 to 100)
 */
export function calculateCreditReadiness(profile: Partial<BusinessProfile> | null): ReadinessScoreResult {
  if (!profile) {
    return {
      score: 0,
      level: 'Getting Started',
      description: getCreditReadinessDescription('Getting Started'),
      breakdown: [
        { label: 'Credit Profile', completed: 0, total: 25, percentage: 0 },
        { label: 'Reporting Accounts', completed: 0, total: 25, percentage: 0 },
        { label: 'Credit Accounts', completed: 0, total: 20, percentage: 0 },
        { label: 'Credit Foundation', completed: 0, total: 10, percentage: 0 },
      ],
    };
  }

  let totalScore = 0;

  // 1. Business credit profile: 25 points
  const hasProfile = profile.hasBusinessCreditProfile === 'yes';
  const profilePoints = hasProfile ? 25 : 0;
  totalScore += profilePoints;

  // 2. Reporting business credit accounts: 25 points
  const hasReporting = profile.hasReportingAccounts === 'yes';
  const reportingPoints = hasReporting ? 25 : 0;
  totalScore += reportingPoints;

  // 3. Business credit account count: 20 points
  const accountCountPoints = calculateAccountCountPoints(profile.businessCreditAccountCount);
  totalScore += accountCountPoints;

  // 4. Business credit card: 10 points
  const hasCard = profile.hasBusinessCreditCard === 'yes';
  if (hasCard) totalScore += 10;

  // 5. Known business credit score: 5 points
  const knowsScore = profile.knowsBusinessCreditScore === 'yes';
  if (knowsScore) totalScore += 5;

  // 6. Funding history: 5 points
  const hasFunding = profile.hasFundingHistory === 'yes';
  if (hasFunding) totalScore += 5;

  // 7. Foundation component: 10 points
  let foundationScore = 0;
  if (profile.hasEIN === 'yes') foundationScore += 2;
  if (profile.hasBusinessBankAccount === 'yes') foundationScore += 2;
  if (profile.hasBusinessAddress === 'yes') foundationScore += 2;
  if (profile.hasWebsite === 'yes') foundationScore += 1;
  if (profile.hasBusinessPhone === 'yes') foundationScore += 1;
  if (profile.hasBusinessEmail === 'yes') foundationScore += 1;
  if (profile.hasBusinessLicense === 'yes' || profile.hasBusinessLicense === 'not_applicable') foundationScore += 1;

  totalScore += foundationScore;

  const score = Math.min(100, Math.max(0, totalScore));
  const level = getScoreLevel(score);

  const breakdown: ScoreCategoryBreakdown[] = [
    {
      label: 'Credit Profile',
      completed: profilePoints,
      total: 25,
      percentage: Math.round((profilePoints / 25) * 100),
    },
    {
      label: 'Reporting Accounts',
      completed: reportingPoints,
      total: 25,
      percentage: Math.round((reportingPoints / 25) * 100),
    },
    {
      label: 'Credit Accounts',
      completed: accountCountPoints,
      total: 20,
      percentage: Math.round((accountCountPoints / 20) * 100),
    },
    {
      label: 'Credit Foundation',
      completed: foundationScore,
      total: 10,
      percentage: Math.round((foundationScore / 10) * 100),
    },
  ];

  return {
    score,
    level,
    description: getCreditReadinessDescription(level),
    breakdown,
  };
}

/**
 * Calculates Profile Completion Percentage (0 - 100%)
 * Distinct from Business Readiness Score or Credit Readiness Score.
 * Evaluates how many of the 23 profile questions the customer has answered.
 */
export function calculateProfileCompletion(profile: Partial<BusinessProfile> | null): number {
  if (!profile) return 0;
  if (profile.profileCompleted) return 100;

  const fieldsToCheck: (keyof BusinessProfile)[] = [
    // Step 1: Business Information (5 fields)
    'businessName',
    'entityType',
    'state',
    'industry',
    'businessAge',

    // Step 2: Foundation (8 fields)
    'hasEIN',
    'hasBusinessBankAccount',
    'hasWebsite',
    'hasBusinessPhone',
    'hasBusinessEmail',
    'hasBusinessAddress',
    'hasBusinessLicense',
    'hasDuns',

    // Step 3: Credit Profile (6 fields)
    'hasBusinessCreditProfile',
    'knowsBusinessCreditScore',
    'businessCreditAccountCount',
    'hasReportingAccounts',
    'hasBusinessCreditCard',
    'hasFundingHistory',

    // Step 4: Funding (4 fields)
    'annualRevenueRange',
    'personalCreditRange',
    'fundingAmount',
    'fundingPurpose',
  ];

  let answeredCount = 0;
  for (const key of fieldsToCheck) {
    const val = profile[key];
    if (val === undefined || val === null) continue;
    if (typeof val === 'string' && val.trim() === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    answeredCount++;
  }

  return Math.min(100, Math.round((answeredCount / fieldsToCheck.length) * 100));
}
