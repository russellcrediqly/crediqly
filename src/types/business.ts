export type TriStateAnswer = 'yes' | 'no' | 'not_sure';
export type LicenseAnswer = 'yes' | 'no' | 'not_sure' | 'not_applicable';

export type ScoreLevel = 'Getting Started' | 'Building' | 'On Track' | 'Strong Foundation';

export interface ScoreCategoryBreakdown {
  label: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface ReadinessScoreResult {
  score: number; // 0 to 100
  level: ScoreLevel;
  description: string;
  breakdown: ScoreCategoryBreakdown[];
}

export interface NextBestActionItem {
  id: string;
  title: string;
  explanation: string;
  actionLabel: string;
  actionHref: string;
}

export interface FullReadinessResult {
  businessReadiness: ReadinessScoreResult;
  creditReadiness: ReadinessScoreResult;
  nextBestAction: NextBestActionItem;
}

export interface BusinessProfile {
  businessId?: string;
  userId: string;
  
  // Step 1: Business Information
  businessName: string;
  entityType: string;
  state: string;
  industry: string;
  businessAge: string;
  
  // Step 2: Business Foundation
  hasEIN?: TriStateAnswer;
  hasBusinessBankAccount?: TriStateAnswer;
  hasWebsite?: TriStateAnswer;
  hasBusinessPhone?: TriStateAnswer;
  hasBusinessEmail?: TriStateAnswer;
  hasBusinessAddress?: TriStateAnswer;
  hasBusinessLicense?: LicenseAnswer;
  hasDuns?: TriStateAnswer;
  
  // Step 3: Business Credit
  hasBusinessCreditProfile?: TriStateAnswer;
  knowsBusinessCreditScore?: TriStateAnswer;
  businessCreditScore?: string | number;
  businessCreditAccountCount?: string;
  hasReportingAccounts?: TriStateAnswer;
  hasBusinessCreditCard?: TriStateAnswer;
  hasFundingHistory?: TriStateAnswer;
  
  // Step 4: Funding Information
  annualRevenueRange?: string;
  personalCreditRange?: string;
  fundingAmount?: string;
  fundingPurpose?: string[];
  
  // Status & Timestamps
  profileCompleted: boolean;
  profileCompletedAt?: string;
  
  // Step 3: Readiness Scores (Optional persistence)
  businessReadinessScore?: number;
  creditReadinessScore?: number;
  readinessUpdatedAt?: string;

  completedDbTasks?: string[];

  createdAt?: string;
  updatedAt?: string;
}

export type BusinessInfoSection = Pick<
  BusinessProfile,
  'businessName' | 'entityType' | 'state' | 'industry' | 'businessAge'
>;

export type BusinessFoundationSection = Pick<
  BusinessProfile,
  | 'hasEIN'
  | 'hasBusinessBankAccount'
  | 'hasWebsite'
  | 'hasBusinessPhone'
  | 'hasBusinessEmail'
  | 'hasBusinessAddress'
  | 'hasBusinessLicense'
  | 'hasDuns'
>;

export type BusinessCreditSection = Pick<
  BusinessProfile,
  | 'hasBusinessCreditProfile'
  | 'knowsBusinessCreditScore'
  | 'businessCreditScore'
  | 'businessCreditAccountCount'
  | 'hasReportingAccounts'
  | 'hasBusinessCreditCard'
  | 'hasFundingHistory'
>;

export type FundingGoalsSection = Pick<
  BusinessProfile,
  'annualRevenueRange' | 'personalCreditRange' | 'fundingAmount' | 'fundingPurpose'
>;

/**
 * Determines whether a business profile has completed onboarding or possesses
 * sufficient verified core business data to skip initial onboarding.
 * Handles both camelCase and snake_case models safely.
 */
export function isProfileInformationComplete(
  profile?: Partial<BusinessProfile> | Record<string, any> | null
): boolean {
  if (!profile) return false;
  if (profile.profileCompleted === true || (profile as any).profile_completed === true) {
    return true;
  }
  const name = profile.businessName || (profile as any).business_name;
  const entity = profile.entityType || (profile as any).entity_type;
  const state = profile.state;

  const hasName = Boolean(
    typeof name === 'string' &&
    name.trim().length > 0 &&
    name.trim().toLowerCase() !== 'my business'
  );
  const hasEntity = Boolean(
    typeof entity === 'string' &&
    entity.trim().length > 0
  );
  const hasState = Boolean(
    typeof state === 'string' &&
    state.trim().length > 0
  );

  return Boolean(hasName && hasEntity && hasState);
}
