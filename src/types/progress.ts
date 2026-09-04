export type ActivityType =
  | 'task_completed'
  | 'task_reopened'
  | 'profile_updated'
  | 'readiness_updated'
  | 'milestone_completed';

export interface ActivityLogItem {
  id: string;
  userId: string;
  businessId?: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  createdAt: string;
}

export interface ProgressHistoryItem {
  id: string;
  userId: string;
  businessId?: string;
  businessReadinessScore: number;
  creditReadinessScore: number;
  fundingReadinessScore?: number;
  roadmapProgress: number;
  recordedAt: string;
}

export type MilestoneId =
  | 'm1_foundation_started'
  | 'm2_foundation_complete'
  | 'm3_credit_foundation_established'
  | 'm4_first_credit_building_complete'
  | 'm5_credit_building_progress_established'
  | 'm6_funding_preparation_ready';

export type MilestoneStatus = 'completed' | 'in_progress' | 'not_started' | 'coming_next';

export interface Milestone {
  id: MilestoneId;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  status: MilestoneStatus;
  completedAt?: string;
}

export interface SinceLastVisitSummary {
  hasChanges: boolean;
  completedTasksCount: number;
  profileUpdated: boolean;
  readinessRecalculated: boolean;
  items: string[];
}
