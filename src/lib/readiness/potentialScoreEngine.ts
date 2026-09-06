import type { BusinessProfile } from '@/types/business';
import type { RecommendedAction } from '@/lib/recommendations/nextActionsEngine';
import { calculateFundingReadiness } from './fundingEngine';

export interface ActionImpactEstimate {
  isPredictable: boolean;
  currentScore: number;
  estimatedScore?: number;
  estimatedDelta?: number;
  impactLevel: 'High' | 'Moderate' | 'Baseline';
  message: string;
  disclaimer: string;
}

/**
 * Deterministically simulates the potential score effect of completing an action
 * strictly using the existing calculateFundingReadiness engine.
 *
 * NEVER hard-codes arbitrary points.
 * Returns safe qualitative guidance if an action's effect is non-deterministic.
 */
export function estimateActionImpact(
  profile: Partial<BusinessProfile> | null,
  action?: RecommendedAction | null
): ActionImpactEstimate {
  const p = profile || {};
  const currentResult = calculateFundingReadiness(p);
  const currentScore = currentResult.score;

  if (!action) {
    return {
      isPredictable: false,
      currentScore,
      impactLevel: 'Moderate',
      message: 'Reassess your readiness after completing your next recommended step.',
      disclaimer: 'Based on your current profile.',
    };
  }

  // Determine simulated profile attributes based on action ID or roadmapTaskKey
  let simulated: Partial<BusinessProfile> | null = null;
  const key = action.roadmapTaskKey || action.id;

  if (action.id === 'rec_bank_account' || key === 'task_bank_account') {
    simulated = { ...p, hasBusinessBankAccount: 'yes' };
  } else if (action.id === 'rec_ein' || key === 'task_ein') {
    simulated = { ...p, hasEIN: 'yes' };
  } else if (action.id === 'rec_credit_profile' || key === 'task_profile_bureau') {
    simulated = { ...p, hasBusinessCreditProfile: 'yes' };
  } else if (action.id === 'rec_credit_depth' || key === 'task_reporting_accounts') {
    simulated = {
      ...p,
      hasReportingAccounts: 'yes',
      businessCreditAccountCount:
        p.businessCreditAccountCount === 'none' || !p.businessCreditAccountCount ? '2-3' : '4-5',
    };
  } else if (action.id === 'rec_credit_card' || key === 'task_build_business_card') {
    simulated = { ...p, hasBusinessCreditCard: 'yes' };
  } else if (action.id === 'rec_commercial_presence' || key === 'task_website') {
    simulated = {
      ...p,
      hasWebsite: 'yes',
      hasBusinessPhone: 'yes',
      hasBusinessAddress: 'yes',
    };
  } else if (action.id === 'rec_complete_profile' || key === 'task_entity') {
    simulated = {
      ...p,
      profileCompleted: true,
      entityType: p.entityType && p.entityType !== 'Not sure' ? p.entityType : 'Limited Liability Company (LLC)',
    };
  }

  // If we have a predictable profile attribute update, simulate with existing engine
  if (simulated) {
    const simulatedResult = calculateFundingReadiness(simulated);
    const estimatedScore = simulatedResult.score;
    const delta = estimatedScore - currentScore;

    if (delta > 0) {
      return {
        isPredictable: true,
        currentScore,
        estimatedScore,
        estimatedDelta: delta,
        impactLevel: delta >= 5 ? 'High' : 'Moderate',
        message: `Estimated readiness after verified completion: ${estimatedScore} / 100 (+${delta} pts)`,
        disclaimer: 'Potential estimate based on your current profile. Not a guarantee.',
      };
    }
  }

  // If no direct score delta or action is procedural/qualitative
  const impactLevel = action.priority === 'High' ? 'High' : 'Moderate';
  return {
    isPredictable: false,
    currentScore,
    impactLevel,
    message: 'Your readiness will be reassessed after your profile information is updated.',
    disclaimer: 'Potential impact based on your current profile.',
  };
}
