import type { BusinessProfile, FullReadinessResult } from '../../types/business';
import { calculateBusinessReadiness, calculateCreditReadiness } from './engine';
import { getNextBestAction } from './nextBestAction';

export * from './engine';
export * from './nextBestAction';

/**
 * Calculates complete readiness metrics (Business, Credit, and Next Best Action)
 */
export function calculateReadiness(profile: Partial<BusinessProfile> | null): FullReadinessResult {
  const businessReadiness = calculateBusinessReadiness(profile);
  const creditReadiness = calculateCreditReadiness(profile);
  const nextBestAction = getNextBestAction(profile);

  return {
    businessReadiness,
    creditReadiness,
    nextBestAction,
  };
}
