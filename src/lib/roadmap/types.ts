import { BusinessProfile } from '@/types/business';

export type RoadmapStageId =
  | 'foundation'
  | 'credit_foundation'
  | 'building'
  | 'optimization'
  | 'funding';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type StageStatus = 'completed' | 'in_progress' | 'not_started' | 'coming_next';

export interface RoadmapTask {
  key: string;
  stage: RoadmapStageId;
  title: string;
  priority: TaskPriority;
  whyItMatters: string;
  whatToDo: string[];
  thingsToConsider: string[];
  status: TaskStatus;
  completedAt?: string;
  satisfiedByProfile: boolean;
  isApplicable: boolean;
  profileField?: keyof BusinessProfile;
  actionHref?: string;
  actionLabel?: string;
}

export interface RoadmapStage {
  id: RoadmapStageId;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  tasks: RoadmapTask[];
  status: StageStatus;
  completedCount: number;
  totalCount: number;
  applicableCount: number;
  progressPercentage: number;
}

export interface RoadmapResult {
  stages: RoadmapStage[];
  allTasks: RoadmapTask[];
  nextBestAction: RoadmapTask | null;
  completedCount: number;
  totalCount: number;
  applicableTotalCount: number;
  percentage: number;
  userCompletions?: Record<string, string>;
}
