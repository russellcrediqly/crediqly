'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import {
  getUserRoadmapTaskCompletions,
  setUserRoadmapTaskCompletion,
} from '@/lib/supabase/roadmapService';
import { logActivity } from '@/lib/supabase/activityService';
import { recordProgressSnapshot } from '@/lib/supabase/progressService';
import { generateRoadmap, RoadmapResult } from '@/lib/roadmap';

import { usePlatformSections } from '@/lib/usePlatformSections';

interface RoadmapContextType {
  roadmap: RoadmapResult;
  loading: boolean;
  toggleTaskCompletion: (taskKey: string) => Promise<void>;
  refreshRoadmap: () => Promise<void>;
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined);

export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { business } = useBusiness();
  const { settings } = usePlatformSections();
  const [completions, setCompletions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadCompletions = useCallback(async () => {
    if (!userId) {
      setCompletions({});
      setLoading(false);
      return;
    }

    try {
      const data = await getUserRoadmapTaskCompletions(userId);
      setCompletions(data);
    } catch (err) {
      console.warn('Failed to load roadmap task completions:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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

    try {
      await setUserRoadmapTaskCompletion(userId, taskKey, nextCompleted);

      // Log meaningful activity
      if (nextCompleted) {
        await logActivity(userId, {
          activityType: 'task_completed',
          title: 'Completed roadmap task',
          description: taskTitle,
          businessId: business?.businessId,
        });
      } else {
        await logActivity(userId, {
          activityType: 'task_reopened',
          title: 'Reopened roadmap task',
          description: taskTitle,
          businessId: business?.businessId,
        });
      }

      // Calculate upcoming progress snapshot
      const updatedCompletions = { ...completions };
      if (nextCompleted) updatedCompletions[taskKey] = now;
      else delete updatedCompletions[taskKey];
      const updatedRoadmap = generateRoadmap(business, updatedCompletions);

      await recordProgressSnapshot(userId, {
        businessId: business?.businessId,
        businessReadinessScore: business?.businessReadinessScore || 0,
        creditReadinessScore: business?.creditReadinessScore || 0,
        roadmapProgress: updatedRoadmap.percentage,
      });
    } catch (err) {
      console.warn('Failed to toggle roadmap task completion:', err);
      // Revert if error
      await loadCompletions();
    }
  };

  const refreshRoadmap = async () => {
    await loadCompletions();
  };

  return (
    <RoadmapContext.Provider
      value={{
        roadmap,
        loading,
        toggleTaskCompletion,
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
