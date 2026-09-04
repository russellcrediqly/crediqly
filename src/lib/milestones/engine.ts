import { BusinessProfile } from '@/types/business';
import { RoadmapResult } from '@/lib/roadmap/types';
import { Milestone, MilestoneStatus } from '@/types/progress';

/**
 * Calculates the user's progress milestones strictly from their actual
 * profile and roadmap completion state.
 *
 * Guaranteed zero arbitrary awarding and zero gamification.
 */
export function calculateMilestones(
  business: Partial<BusinessProfile> | null,
  roadmap: RoadmapResult
): Milestone[] {
  const p = business || {};
  const stage1 = roadmap.stages.find((s) => s.id === 'foundation');
  const stage2 = roadmap.stages.find((s) => s.id === 'credit_foundation');
  const stage3 = roadmap.stages.find((s) => s.id === 'building');
  const stage4 = roadmap.stages.find((s) => s.id === 'optimization');

  const stage1Completed = Boolean(stage1 && stage1.applicableCount > 0 && stage1.completedCount === stage1.applicableCount);
  const stage1Started = Boolean(stage1 && stage1.completedCount > 0) || Boolean(p.businessName || p.profileCompleted);

  const stage2Completed = Boolean(stage2 && stage2.applicableCount > 0 && stage2.completedCount === stage2.applicableCount);
  const stage2Started = Boolean(stage2 && stage2.completedCount > 0);

  const stage3Completed = Boolean(stage3 && stage3.applicableCount > 0 && stage3.completedCount === stage3.applicableCount);
  const stage3Started = Boolean(stage3 && stage3.completedCount > 0);

  // --- Milestone 1: Business Foundation Started ---
  let m1Status: MilestoneStatus = 'not_started';
  if (stage1Started) {
    m1Status = 'completed';
  }

  // --- Milestone 2: Business Foundation Complete ---
  let m2Status: MilestoneStatus = 'not_started';
  if (stage1Completed) {
    m2Status = 'completed';
  } else if (stage1Started) {
    m2Status = 'in_progress';
  }

  // --- Milestone 3: Business Credit Foundation Established ---
  let m3Status: MilestoneStatus = 'not_started';
  const hasCreditProfileOrAccounts =
    p.hasBusinessCreditProfile === 'yes' ||
    p.hasReportingAccounts === 'yes' ||
    stage2Started;

  if (stage1Completed && hasCreditProfileOrAccounts) {
    m3Status = 'completed';
  } else if (stage1Completed || stage2Started) {
    m3Status = 'in_progress';
  }

  // --- Milestone 4: First Credit-Building Stage Complete ---
  let m4Status: MilestoneStatus = 'not_started';
  if (stage2Completed) {
    m4Status = 'completed';
  } else if (m3Status === 'completed' || stage2Started) {
    m4Status = 'in_progress';
  }

  // --- Milestone 5: Credit-Building Progress Established ---
  let m5Status: MilestoneStatus = 'not_started';
  if (stage3Started || stage3Completed) {
    m5Status = stage3Completed ? 'completed' : 'in_progress';
  } else if (stage2Completed) {
    m5Status = 'not_started';
  }

  // --- Milestone 6: Funding Preparation Ready (Locked / Coming Soon) ---
  const m6Status: MilestoneStatus = 'coming_next';

  return [
    {
      id: 'm1_foundation_started',
      order: 1,
      title: 'Business Foundation Started',
      subtitle: 'Entity & Banking',
      description: 'Initiated core legal structure, EIN, and business banking separation.',
      status: m1Status,
    },
    {
      id: 'm2_foundation_complete',
      order: 2,
      title: 'Business Foundation Complete',
      subtitle: 'Operational Readiness',
      description: 'All foundational entity, commercial presence, and compliance items verified.',
      status: m2Status,
    },
    {
      id: 'm3_credit_foundation_established',
      order: 3,
      title: 'Business Credit Foundation Established',
      subtitle: 'Bureau Awareness',
      description: 'Commercial credit profile recognized and expense separation verified.',
      status: m3Status,
    },
    {
      id: 'm4_first_credit_building_complete',
      order: 4,
      title: 'First Credit-Building Stage Complete',
      subtitle: 'Trade Line Setup',
      description: 'Credit-building accounts identified with bureau reporting standards established.',
      status: m4Status,
    },
    {
      id: 'm5_credit_building_progress_established',
      order: 5,
      title: 'Credit-Building Progress Established',
      subtitle: 'Payment Consistency',
      description: 'Active commercial trade lines reporting positive on-time payment history.',
      status: m5Status,
    },
    {
      id: 'm6_funding_preparation_ready',
      order: 6,
      title: 'Funding Preparation Ready',
      subtitle: 'Capital Underwriting',
      description: 'Comprehensive financial documentation and loan readiness metrics prepared.',
      status: m6Status,
    },
  ];
}
