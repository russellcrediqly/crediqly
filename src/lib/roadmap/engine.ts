import type { BusinessProfile } from '@/types/business';
import type {
  RoadmapResult,
  RoadmapStage,
  RoadmapTask,
  RoadmapStageId,
  TaskPriority,
  TaskStatus,
  StageStatus,
} from './types';
import { TASK_DEFINITIONS, STAGE_DEFINITIONS, type BaseTaskDefinition } from './definitions';

/**
 * Deterministic rule-based engine that personalizes the business credit roadmap
 * based on the user's business profile and completion records.
 */
export function generateRoadmap(
  profile: Partial<BusinessProfile> | null,
  userCompletions: Record<string, string> = {},
  adminSettings?: import('@/types/settings').RoadmapAdminSettings
): RoadmapResult {
  const p = profile || {};

  // Map each base task definition into a personalized RoadmapTask
  const tasks: RoadmapTask[] = TASK_DEFINITIONS.map((def) => {
    let title = def.defaultTitle;
    let priority = def.defaultPriority;
    let satisfiedByProfile = false;
    let whyItMatters = def.whyItMatters;
    let isApplicable = true;

    // --- Personalization Rules ---

    // 1. Business Entity
    if (def.key === 'task_entity') {
      if (p.entityType && p.entityType.trim() !== '') {
        satisfiedByProfile = true;
      }
    }

    // 2. EIN
    if (def.key === 'task_ein') {
      if (p.hasEIN === 'yes') {
        satisfiedByProfile = true;
        title = 'EIN established';
      } else if (p.hasEIN === 'not_sure') {
        title = 'Confirm whether your business has an EIN';
        whyItMatters =
          'Your profile indicates you may be unsure about your federal EIN status. Confirming whether an EIN has already been assigned prevents duplicate tax registrations.';
        priority = 'high';
      } else {
        title = 'Obtain an EIN';
        priority = 'high';
      }
    }

    // 3. Business Bank Account
    if (def.key === 'task_bank_account') {
      if (p.hasBusinessBankAccount === 'yes') {
        satisfiedByProfile = true;
        title = 'Dedicated business bank account opened';
      } else if (p.hasBusinessBankAccount === 'not_sure') {
        title = 'Confirm your business bank account separation';
        whyItMatters =
          'Checking that your commercial bank account is fully distinct from your personal accounts ensures compliance with lender cash-flow underwriting requirements.';
        priority = 'high';
      } else {
        title = 'Open a dedicated business bank account';
        priority = 'high';
      }
    }

    // 4. Business Email
    if (def.key === 'task_business_email') {
      if (p.hasBusinessEmail === 'yes') {
        satisfiedByProfile = true;
        title = 'Professional business email established';
      } else if (p.hasBusinessEmail === 'not_sure') {
        title = 'Confirm professional business email address';
      } else {
        title = 'Set up a professional business email';
      }
    }

    // 5. Business Phone
    if (def.key === 'task_business_phone') {
      if (p.hasBusinessPhone === 'yes') {
        satisfiedByProfile = true;
        title = 'Dedicated business phone number established';
      } else if (p.hasBusinessPhone === 'not_sure') {
        title = 'Confirm your dedicated business phone line';
      } else {
        title = 'Set up a dedicated business phone';
      }
    }

    // 6. Business Website
    if (def.key === 'task_website') {
      if (p.hasWebsite === 'yes') {
        satisfiedByProfile = true;
        title = 'Professional business website published';
      } else if (p.hasWebsite === 'not_sure') {
        title = 'Confirm your business website and online presence';
      } else {
        title = 'Create a professional business website';
      }
    }

    // 7. Business Address
    if (def.key === 'task_address') {
      if (p.hasBusinessAddress === 'yes') {
        satisfiedByProfile = true;
        title = 'Consistent business address verified';
      } else if (p.hasBusinessAddress === 'not_sure') {
        title = 'Confirm your registered commercial address';
      } else {
        title = 'Establish a consistent business address';
      }
    }

    // 8. Business Licenses
    if (def.key === 'task_licenses') {
      if (p.hasBusinessLicense === 'not_applicable') {
        isApplicable = false;
        satisfiedByProfile = true;
        title = 'Business licenses not required for your entity';
        whyItMatters = 'Based on your profile, specialized commercial or local licensing is not applicable to your business operations.';
      } else if (p.hasBusinessLicense === 'yes') {
        satisfiedByProfile = true;
        title = 'Required business licenses verified';
      } else if (p.hasBusinessLicense === 'not_sure') {
        title = 'Check whether business licenses apply to your business';
      } else {
        title = 'Obtain required business licenses where applicable';
      }
    }

    // 9. D-U-N-S Number
    if (def.key === 'task_duns') {
      if (p.hasDuns === 'yes') {
        satisfiedByProfile = true;
        title = 'D-U-N-S number established';
      } else if (p.hasDuns === 'not_sure') {
        title = 'Confirm whether your business has a D-U-N-S number';
      } else {
        title = 'Consider establishing a D-U-N-S number';
      }
    }

    // 10. Business Credit Profile
    if (def.key === 'task_credit_profile') {
      if (p.hasBusinessCreditProfile === 'yes') {
        satisfiedByProfile = true;
        title = 'Business credit profile confirmed';
      } else if (p.hasBusinessCreditProfile === 'not_sure') {
        title = 'Confirm whether your business has a credit profile';
        whyItMatters =
          'Checking existing commercial bureau files will reveal whether any historical vendor or supplier lines are already recording data under your company.';
        priority = 'high';
      } else {
        title = 'Determine whether your business has a business credit profile';
        priority = 'high';
      }
    }

    // 11. Reporting Accounts
    if (def.key === 'task_reporting_accounts') {
      if (p.hasReportingAccounts === 'yes') {
        satisfiedByProfile = true;
        title = 'Reporting vendor accounts verified';
      } else if (p.hasReportingAccounts === 'not_sure') {
        title = 'Check whether your existing accounts report to business credit bureaus';
        priority = 'high';
      } else {
        title = 'Check whether your existing accounts report to commercial credit bureaus';
        priority = 'high';
      }
    }

    // 12. Review Accounts / Credit Depth
    if (def.key === 'task_review_accounts') {
      if (p.businessCreditAccountCount && p.businessCreditAccountCount !== 'none' && p.businessCreditAccountCount !== '0') {
        title = 'Review your existing business credit accounts';
      } else {
        title = 'Build initial business credit history responsibly';
      }
    }

    // Check completion status
    const isCompleted = satisfiedByProfile || Boolean(userCompletions[def.key]);
    const completedAt = isCompleted
      ? userCompletions[def.key] || p.profileCompletedAt || new Date().toISOString()
      : undefined;
    const status: TaskStatus = isCompleted ? 'completed' : 'not_started';

    // --- Admin Settings Overrides ---
    if (adminSettings) {
      if (adminSettings.disabledStages?.includes(def.stage)) {
        isApplicable = false;
      }
      if (adminSettings.disabledTasks?.includes(def.key)) {
        isApplicable = false;
      }
      const override = adminSettings.taskOverrides?.[def.key];
      if (override) {
        if (override.enabled === false) isApplicable = false;
        if (override.title && override.title.trim() !== '') title = override.title.trim();
        if (override.whyItMatters && override.whyItMatters.trim() !== '') whyItMatters = override.whyItMatters.trim();
      }
    }

    return {
      key: def.key,
      stage: def.stage,
      title,
      priority,
      whyItMatters,
      whatToDo: def.whatToDo,
      thingsToConsider: def.thingsToConsider,
      status,
      completedAt,
      satisfiedByProfile,
      isApplicable,
      profileField: def.profileField as any,
      actionHref: def.actionHref,
      actionLabel: def.actionLabel,
    };
  });

  // Group into Stages
  const stageIds: RoadmapStageId[] = [
    'foundation',
    'credit_foundation',
    'building',
    'optimization',
    'funding',
  ];

  const stages: RoadmapStage[] = stageIds.map((stageId) => {
    const meta = STAGE_DEFINITIONS[stageId];
    const stageTasks = tasks.filter((t) => t.stage === stageId);
    const applicableStageTasks = stageTasks.filter((t) => t.isApplicable);
    const completedCount = applicableStageTasks.filter((t) => t.status === 'completed').length;
    const applicableCount = applicableStageTasks.length;
    const totalCount = stageTasks.length;
    const progressPercentage =
      applicableCount > 0 ? Math.round((completedCount / applicableCount) * 100) : 0;

    let status: StageStatus = 'not_started';
    if (applicableCount > 0 && completedCount === applicableCount) {
      status = 'completed';
    } else if (completedCount > 0) {
      status = 'in_progress';
    }

    return {
      id: stageId,
      order: meta.order,
      title: meta.title,
      subtitle: meta.subtitle,
      description: meta.description,
      tasks: stageTasks,
      status,
      completedCount,
      totalCount,
      applicableCount,
      progressPercentage,
    };
  });

  // Calculate Overall Progress based on all applicable tasks across all active stages
  const totalCount = stages.reduce((acc, s) => acc + s.totalCount, 0);
  const applicableTotalCount = stages.reduce((acc, s) => acc + s.applicableCount, 0);
  const completedCount = stages.reduce((acc, s) => acc + s.completedCount, 0);
  const percentage =
    applicableTotalCount > 0 ? Math.round((completedCount / applicableTotalCount) * 100) : 0;

  // Determine Single Highest-Priority Incomplete Task as Next Best Action
  const incompleteTasks = tasks.filter((t) => t.status !== 'completed' && t.isApplicable);

  let nextBestAction: RoadmapTask | null = null;
  if (incompleteTasks.length > 0) {
    // Stage order preference: foundation -> credit_foundation -> building -> optimization
    const stageOrder: Record<RoadmapStageId, number> = {
      foundation: 1,
      credit_foundation: 2,
      building: 3,
      optimization: 4,
      funding: 5,
    };

    const priorityOrder: Record<TaskPriority, number> = {
      high: 1,
      medium: 2,
      low: 3,
    };

    const sorted = [...incompleteTasks].sort((a, b) => {
      const stageDiff = stageOrder[a.stage] - stageOrder[b.stage];
      if (stageDiff !== 0) return stageDiff;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    nextBestAction = sorted[0];
  }

  return {
    stages,
    allTasks: tasks,
    nextBestAction,
    completedCount,
    totalCount,
    applicableTotalCount,
    percentage,
  };
}
