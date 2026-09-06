'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import {
  getUserRoadmapTaskCompletions,
  setUserRoadmapTaskCompletion,
  getUserActionRecords,
  setUserActionRecord,
  undoUserActionCompletion,
  CustomerActionRecord,
} from '@/lib/supabase/roadmapService';
import { logActivity } from '@/lib/supabase/activityService';
import { recordProgressSnapshot } from '@/lib/supabase/progressService';
import { generateRoadmap, RoadmapResult } from '@/lib/roadmap';

import { usePlatformSections } from '@/lib/usePlatformSections';

interface RoadmapContextType {
  roadmap: RoadmapResult;
  completedTasks: string[];
  loading: boolean;
  actionRecords: Record<string, CustomerActionRecord>;
  toggleTaskCompletion: (taskKey: string) => Promise<void>;
  markActionCompleted: (actionId: string, metadata?: Record<string, any>) => Promise<void>;
  undoActionCompletion: (actionId: string) => Promise<void>;
  setTaskStatus: (
    taskKey: string,
    status: 'not_started' | 'in_progress' | 'completed',
    metadata?: Record<string, any>
  ) => Promise<void>;
  refreshRoadmap: () => Promise<void>;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

interface TaskProfileMapping {
  completedUpdates: Partial<import('@/types/business').BusinessProfile>;
  undoUpdates: Partial<import('@/types/business').BusinessProfile>;
}

const TASK_PROFILE_MAP: Record<string, TaskProfileMapping> = {
  // Tradelines / Net-30 Vendor Accounts
  task_reporting_accounts: {
    completedUpdates: { hasReportingAccounts: 'yes', businessCreditAccountCount: '1-3' },
    undoUpdates: { hasReportingAccounts: 'no', businessCreditAccountCount: '0' },
  },
  rec_credit_depth: {
    completedUpdates: { hasReportingAccounts: 'yes', businessCreditAccountCount: '1-3' },
    undoUpdates: { hasReportingAccounts: 'no', businessCreditAccountCount: '0' },
  },
  // Revolving Business Credit Card
  task_build_business_card: {
    completedUpdates: { hasBusinessCreditCard: 'yes' },
    undoUpdates: { hasBusinessCreditCard: 'no' },
  },
  rec_credit_card: {
    completedUpdates: { hasBusinessCreditCard: 'yes' },
    undoUpdates: { hasBusinessCreditCard: 'no' },
  },
  task_revolving_tier2: {
    completedUpdates: { hasBusinessCreditCard: 'yes' },
    undoUpdates: { hasBusinessCreditCard: 'no' },
  },
  // Commercial Bank Account
  task_bank_account: {
    completedUpdates: { hasBusinessBankAccount: 'yes' },
    undoUpdates: { hasBusinessBankAccount: 'no' },
  },
  rec_bank_account: {
    completedUpdates: { hasBusinessBankAccount: 'yes' },
    undoUpdates: { hasBusinessBankAccount: 'no' },
  },
  // Federal EIN
  task_ein: {
    completedUpdates: { hasEIN: 'yes' },
    undoUpdates: { hasEIN: 'no' },
  },
  rec_ein: {
    completedUpdates: { hasEIN: 'yes' },
    undoUpdates: { hasEIN: 'no' },
  },
  // Commercial Credit Profile with Bureaus
  task_profile_bureau: {
    completedUpdates: { hasBusinessCreditProfile: 'yes' },
    undoUpdates: { hasBusinessCreditProfile: 'no' },
  },
  rec_credit_profile: {
    completedUpdates: { hasBusinessCreditProfile: 'yes' },
    undoUpdates: { hasBusinessCreditProfile: 'no' },
  },
  // Business Website
  task_website: {
    completedUpdates: { hasWebsite: 'yes' },
    undoUpdates: { hasWebsite: 'no' },
  },
  // Dedicated Business Phone
  task_business_phone: {
    completedUpdates: { hasBusinessPhone: 'yes' },
    undoUpdates: { hasBusinessPhone: 'no' },
  },
  // Professional Business Email
  task_business_email: {
    completedUpdates: { hasBusinessEmail: 'yes' },
    undoUpdates: { hasBusinessEmail: 'no' },
  },
  // Commercial Physical Address
  task_business_address: {
    completedUpdates: { hasBusinessAddress: 'yes' },
    undoUpdates: { hasBusinessAddress: 'no' },
  },
  // Commercial Presence Multi-item
  rec_commercial_presence: {
    completedUpdates: { hasWebsite: 'yes', hasBusinessPhone: 'yes', hasBusinessAddress: 'yes' },
    undoUpdates: { hasWebsite: 'no' },
  },
  // Business License
  task_business_license: {
    completedUpdates: { hasBusinessLicense: 'yes' },
    undoUpdates: { hasBusinessLicense: 'no' },
  },
  // D-U-N-S Number
  task_duns: {
    completedUpdates: { hasDuns: 'yes' },
    undoUpdates: { hasDuns: 'no' },
  },
  // Business Entity
  task_entity: {
    completedUpdates: { entityType: 'LLC' },
    undoUpdates: { entityType: '' },
  },
  rec_complete_profile: {
    completedUpdates: { entityType: 'LLC', profileCompleted: true },
    undoUpdates: { profileCompleted: false },
  },
  // Funding Target
  task_funding_target: {
    completedUpdates: { fundingAmount: '$50,000' },
    undoUpdates: { fundingAmount: '' },
  },
  rec_funding_target: {
    completedUpdates: { fundingAmount: '$50,000' },
    undoUpdates: { fundingAmount: '' },
  },
  // Credit Score Checking
  task_check_scores: {
    completedUpdates: { knowsBusinessCreditScore: 'yes' },
    undoUpdates: { knowsBusinessCreditScore: 'no' },
  },
  // Official Readiness Milestones
  m_profile_entity: {
    completedUpdates: { entityType: 'LLC' },
    undoUpdates: { entityType: '' },
  },
  m_ein: {
    completedUpdates: { hasEIN: 'yes' },
    undoUpdates: { hasEIN: 'no' },
  },
  m_business_bank: {
    completedUpdates: { hasBusinessBankAccount: 'yes' },
    undoUpdates: { hasBusinessBankAccount: 'no' },
  },
  m_commercial_presence: {
    completedUpdates: { hasWebsite: 'yes', hasBusinessPhone: 'yes', hasBusinessEmail: 'yes' },
    undoUpdates: { hasWebsite: 'no' },
  },
  m_commercial_address: {
    completedUpdates: { hasBusinessAddress: 'yes', hasBusinessLicense: 'yes' },
    undoUpdates: { hasBusinessAddress: 'no' },
  },
  m_duns_bureau: {
    completedUpdates: { hasBusinessCreditProfile: 'yes', hasDuns: 'yes' },
    undoUpdates: { hasBusinessCreditProfile: 'no' },
  },
  m_tier1_tradelines: {
    completedUpdates: { hasReportingAccounts: 'yes', businessCreditAccountCount: '1-3' },
    undoUpdates: { hasReportingAccounts: 'no', businessCreditAccountCount: '0' },
  },
  m_credit_depth: {
    completedUpdates: { businessCreditAccountCount: '4+' },
    undoUpdates: { businessCreditAccountCount: '1-3' },
  },
  m_revolving_card: {
    completedUpdates: { hasBusinessCreditCard: 'yes' },
    undoUpdates: { hasBusinessCreditCard: 'no' },
  },
  m_funding_profile: {
    completedUpdates: { fundingAmount: '$50,000' },
    undoUpdates: { fundingAmount: '' },
  },
  m_revenue_operating: {
    completedUpdates: { annualRevenueRange: '$100,000–$249,999', businessAge: '1–2 years' },
    undoUpdates: { annualRevenueRange: 'Pre-revenue' },
  },
  m_credit_monitoring: {
    completedUpdates: { knowsBusinessCreditScore: 'yes' },
    undoUpdates: { knowsBusinessCreditScore: 'no' },
  },
};

export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { business, saveBusinessProfile } = useBusiness();
  const { settings } = usePlatformSections();
  const [completions, setCompletions] = useState<Record<string, string>>({});
  const [actionRecords, setActionRecords] = useState<Record<string, CustomerActionRecord>>({});
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadCompletions = useCallback(async () => {
    if (!userId) {
      setCompletions({});
      setActionRecords({});
      setLoading(false);
      return;
    }

    try {
      const [taskData, actionData] = await Promise.all([
        getUserRoadmapTaskCompletions(userId),
        getUserActionRecords(userId),
      ]);

      // Merge DB task tags persisted directly in businesses table
      const mergedTaskData = { ...taskData };
      if (business?.completedDbTasks) {
        business.completedDbTasks.forEach((t) => {
          if (!mergedTaskData[t]) {
            mergedTaskData[t] = business.updatedAt || new Date().toISOString();
          }
        });
      }

      setCompletions(mergedTaskData);
      setActionRecords(actionData);
    } catch (err) {
      console.warn('Failed to load roadmap task completions:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, business?.completedDbTasks, business?.updatedAt]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  // Dynamically generate roadmap whenever business profile, completions, or admin overrides change
  const roadmap = useMemo(() => {
    return generateRoadmap(business, completions, settings?.roadmapSettings);
  }, [business, completions, settings?.roadmapSettings]);

  const toggleTaskCompletion = async (taskKey: string) => {
    if (!userId) return;

    const currentlyCompleted = Boolean(completions[taskKey]);
    const nextCompleted = !currentlyCompleted;
    const now = new Date().toISOString();

    const targetTask = roadmap.allTasks.find((t) => t.key === taskKey);
    const taskTitle = targetTask ? targetTask.title : 'Roadmap task';

    // Optimistically update local state
    setCompletions((prev) => {
      const next = { ...prev };
      if (nextCompleted) {
        next[taskKey] = now;
      } else {
        delete next[taskKey];
      }
      return next;
    });

    setActionRecords((prev) => {
      const next = { ...prev };
      next[taskKey] = {
        actionId: taskKey,
        userId,
        status: nextCompleted ? 'completed' : 'not_started',
        completed: nextCompleted,
        completedAt: nextCompleted ? now : undefined,
      };
      return next;
    });

    try {
      // 1. Persist real database-backed state in Supabase businesses table
      const mapping = TASK_PROFILE_MAP[taskKey];
      if (mapping) {
        await saveBusinessProfile(nextCompleted ? mapping.completedUpdates : mapping.undoUpdates);
      } else {
        const currentDbTasks = business?.completedDbTasks || [];
        const updatedDbTasks = nextCompleted
          ? Array.from(new Set([...currentDbTasks, taskKey]))
          : currentDbTasks.filter((t) => t !== taskKey);
        await saveBusinessProfile({ completedDbTasks: updatedDbTasks });
      }

      // 2. Sync action record & local cache
      await setUserRoadmapTaskCompletion(userId, taskKey, nextCompleted);

      // 3. Log meaningful user activity
      await logActivity(userId, {
        activityType: nextCompleted ? 'task_completed' : 'task_reopened',
        title: nextCompleted ? 'Completed roadmap task' : 'Reopened roadmap task',
        description: taskTitle,
        businessId: business?.businessId,
      });

      // 4. Record progress snapshot
      const updatedCompletions = { ...completions };
      if (nextCompleted) updatedCompletions[taskKey] = now;
      else delete updatedCompletions[taskKey];
      const updatedRoadmap = generateRoadmap(business, updatedCompletions, settings?.roadmapSettings);

      await recordProgressSnapshot(userId, {
        businessId: business?.businessId,
        businessReadinessScore: business?.businessReadinessScore || 0,
        creditReadinessScore: business?.creditReadinessScore || 0,
        roadmapProgress: updatedRoadmap.percentage,
      });
    } catch (err) {
      console.warn('Failed to toggle roadmap task completion:', err);
      await loadCompletions();
    }
  };

  const markActionCompleted = async (actionId: string, metadata?: Record<string, any>) => {
    if (!userId) return;
    const now = new Date().toISOString();

    // Optimistically update
    setCompletions((prev) => ({ ...prev, [actionId]: now }));
    setActionRecords((prev) => ({
      ...prev,
      [actionId]: {
        actionId,
        userId,
        status: 'completed',
        completed: true,
        completedAt: now,
        metadata,
      },
    }));

    try {
      // 1. Real database-backed persistence in Supabase businesses table
      const mapping = TASK_PROFILE_MAP[actionId];
      if (mapping) {
        await saveBusinessProfile(mapping.completedUpdates);
      } else {
        const currentDbTasks = business?.completedDbTasks || [];
        const updatedDbTasks = Array.from(new Set([...currentDbTasks, actionId]));
        await saveBusinessProfile({ completedDbTasks: updatedDbTasks });
      }

      // 2. Sync action record
      await setUserActionRecord(userId, actionId, 'completed', metadata);

      // 3. Log activity
      await logActivity(userId, {
        activityType: 'task_completed',
        title: 'Completed recommended action',
        description: metadata?.title || actionId,
        businessId: business?.businessId,
      });

      // 4. Record snapshot
      const updatedCompletions = { ...completions, [actionId]: now };
      const updatedRoadmap = generateRoadmap(business, updatedCompletions, settings?.roadmapSettings);

      await recordProgressSnapshot(userId, {
        businessId: business?.businessId,
        businessReadinessScore: business?.businessReadinessScore || 0,
        creditReadinessScore: business?.creditReadinessScore || 0,
        roadmapProgress: updatedRoadmap.percentage,
      });
    } catch (err) {
      console.warn('Failed to mark action completed:', err);
      await loadCompletions();
    }
  };

  const undoActionCompletion = async (actionId: string) => {
    if (!userId) return;

    setCompletions((prev) => {
      const next = { ...prev };
      delete next[actionId];
      return next;
    });

    setActionRecords((prev) => {
      const next = { ...prev };
      if (next[actionId]) {
        next[actionId] = {
          ...next[actionId],
          status: 'not_started',
          completed: false,
          completedAt: undefined,
        };
      }
      return next;
    });

    try {
      // 1. Revert database-backed state in Supabase businesses table
      const mapping = TASK_PROFILE_MAP[actionId];
      if (mapping) {
        await saveBusinessProfile(mapping.undoUpdates);
      } else {
        const currentDbTasks = business?.completedDbTasks || [];
        const updatedDbTasks = currentDbTasks.filter((t) => t !== actionId);
        await saveBusinessProfile({ completedDbTasks: updatedDbTasks });
      }

      // 2. Sync action record
      await undoUserActionCompletion(userId, actionId);

      // 3. Log activity
      await logActivity(userId, {
        activityType: 'task_reopened',
        title: 'Reopened action',
        description: actionId,
        businessId: business?.businessId,
      });

      // 4. Record snapshot
      const updatedCompletions = { ...completions };
      delete updatedCompletions[actionId];
      const updatedRoadmap = generateRoadmap(business, updatedCompletions, settings?.roadmapSettings);

      await recordProgressSnapshot(userId, {
        businessId: business?.businessId,
        businessReadinessScore: business?.businessReadinessScore || 0,
        creditReadinessScore: business?.creditReadinessScore || 0,
        roadmapProgress: updatedRoadmap.percentage,
      });
    } catch (err) {
      console.warn('Failed to undo action completion:', err);
      await loadCompletions();
    }
  };

  const setTaskStatus = async (
    taskKey: string,
    status: 'not_started' | 'in_progress' | 'completed',
    metadata?: Record<string, any>
  ) => {
    if (!userId) return;
    const now = new Date().toISOString();

    if (status === 'completed') {
      await markActionCompleted(taskKey, metadata);
    } else if (status === 'in_progress') {
      // 1. Optimistically update local action records
      setActionRecords((prev) => ({
        ...prev,
        [taskKey]: {
          actionId: taskKey,
          userId,
          status: 'in_progress',
          completed: false,
          startedAt: prev[taskKey]?.startedAt || now,
          metadata,
        },
      }));

      // 2. Persist in local storage + Supabase user_roadmap_tasks
      await setUserActionRecord(userId, taskKey, 'in_progress', metadata);

      // 3. If previously marked completed in completions, revert completion
      if (completions[taskKey]) {
        setCompletions((prev) => {
          const next = { ...prev };
          delete next[taskKey];
          return next;
        });
        const mapping = TASK_PROFILE_MAP[taskKey];
        if (mapping) {
          await saveBusinessProfile(mapping.undoUpdates);
        } else {
          const currentDbTasks = business?.completedDbTasks || [];
          await saveBusinessProfile({
            completedDbTasks: currentDbTasks.filter((t) => t !== taskKey),
          });
        }
      }

      // 4. Log activity
      await logActivity(userId, {
        activityType: 'task_started',
        title: 'Marked task in progress',
        description: metadata?.title || taskKey,
        businessId: business?.businessId,
      });
    } else {
      // not_started
      await undoActionCompletion(taskKey);
    }
  };

  const refreshRoadmap = async () => {
    await loadCompletions();
  };

  const completedTasks = useMemo(() => {
    return (roadmap.allTasks || []).filter((t) => t.status === 'completed').map((t) => t.key);
  }, [roadmap.allTasks]);

  return (
    <RoadmapContext.Provider
      value={{
        roadmap,
        completedTasks,
        loading,
        actionRecords,
        toggleTaskCompletion,
        markActionCompleted,
        undoActionCompletion,
        setTaskStatus,
        refreshRoadmap,
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
};

export const useRoadmap = (): RoadmapContextType => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
