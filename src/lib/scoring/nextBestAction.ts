import type { BusinessProfile, NextBestActionItem } from '../../types/business';
import { calculateMilestoneReadiness } from '../readiness/readinessMilestoneEngine';

/**
 * Determines the single highest-priority Next Best Action based on the business profile.
 * Strictly aligned with the authoritative 0–100 Readiness Journey milestone engine.
 */
export function getNextBestAction(profile: Partial<BusinessProfile> | null): NextBestActionItem {
  if (!profile) {
    return {
      id: 'complete-profile',
      title: 'Complete your business profile',
      explanation: 'Answer a few simple questions so Crediqly can generate your personalized roadmap.',
      actionLabel: 'Complete Profile',
      actionHref: '/onboarding',
    };
  }

  const milestoneRes = calculateMilestoneReadiness(profile);
  if (milestoneRes.nextMilestone) {
    const m = milestoneRes.nextMilestone;
    return {
      id: m.id,
      title: m.title,
      explanation: m.whyItMatters || m.description,
      actionLabel: m.actionLabel || 'View Next Step',
      actionHref: m.actionHref || '/roadmap',
    };
  }

  // All Core Milestones In Place
  return {
    id: 'review-progress',
    title: 'Review your funding readiness progress',
    explanation:
      'All 14 core business credit and funding readiness milestones are complete. Explore matching funding programs in the marketplace.',
    actionLabel: 'Explore Funding',
    actionHref: '/funding',
  };
}
