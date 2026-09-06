import { supabase, isSupabaseConfigured } from './client';

const LOCAL_STORAGE_KEY_PREFIX = 'crediqly_roadmap_';
const LOCAL_ACTIONS_KEY_PREFIX = 'crediqly_actions_';

export interface CustomerActionRecord {
  actionId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

function getLocalCompletions(userId: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local roadmap completions:', e);
  }
  return {};
}

function saveLocalCompletions(userId: string, completions: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(completions));
  } catch (e) {
    console.warn('Failed to persist local roadmap completions:', e);
  }
}

function getLocalActionRecords(userId: string): Record<string, CustomerActionRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_ACTIONS_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local action records:', e);
  }
  return {};
}

function saveLocalActionRecords(userId: string, records: Record<string, CustomerActionRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_ACTIONS_KEY_PREFIX}${userId}`, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to persist local action records:', e);
  }
}

/**
 * Fetch all task completions for a user.
 * Returns a dictionary mapping taskKey -> completedAt timestamp.
 */
export async function getUserRoadmapTaskCompletions(userId: string): Promise<Record<string, string>> {
  const localMap = getLocalCompletions(userId);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('user_roadmap_tasks')
        .select('task_key, completed, completed_at')
        .eq('user_id', userId)
        .eq('completed', true);

      if (!error && data) {
        const dbMap: Record<string, string> = {};
        data.forEach((row) => {
          if (row.task_key && row.completed) {
            dbMap[row.task_key] = row.completed_at || new Date().toISOString();
          }
        });

        // Merge DB with local
        const merged = { ...localMap, ...dbMap };
        saveLocalCompletions(userId, merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase user_roadmap_tasks query failed, using local cache:', err);
    }
  }

  return localMap;
}

/**
 * Fetch all structured customer action records for a user.
 * Merges local storage action cache with Supabase user_roadmap_tasks.
 */
export async function getUserActionRecords(userId: string): Promise<Record<string, CustomerActionRecord>> {
  const localRecords = getLocalActionRecords(userId);
  const completions = getLocalCompletions(userId);

  // Ensure any completions in roadmap store are reflected in action records
  Object.keys(completions).forEach((taskKey) => {
    if (!localRecords[taskKey]) {
      localRecords[taskKey] = {
        actionId: taskKey,
        userId,
        status: 'completed',
        completed: true,
        completedAt: completions[taskKey],
      };
    }
  });

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('user_roadmap_tasks')
        .select('task_key, completed, completed_at, created_at, updated_at')
        .eq('user_id', userId);

      if (!error && data) {
        data.forEach((row) => {
          if (row.task_key) {
            const isCompleted = Boolean(row.completed);
            localRecords[row.task_key] = {
              ...(localRecords[row.task_key] || {}),
              actionId: row.task_key,
              userId,
              status: isCompleted ? 'completed' : 'not_started',
              completed: isCompleted,
              startedAt: row.created_at || undefined,
              completedAt: row.completed_at || undefined,
            };
          }
        });
        saveLocalActionRecords(userId, localRecords);
      }
    } catch (err) {
      console.warn('Supabase action records query failed, using local cache:', err);
    }
  }

  return localRecords;
}

/**
 * Persist a customer action record (e.g. mark as completed, in_progress, or not_started).
 */
export async function setUserActionRecord(
  userId: string,
  actionId: string,
  status: 'not_started' | 'in_progress' | 'completed',
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const isCompleted = status === 'completed';

  // 1. Update local action records
  const actionRecords = getLocalActionRecords(userId);
  const existing = actionRecords[actionId] || {
    actionId,
    userId,
    status: 'not_started',
    completed: false,
  };

  actionRecords[actionId] = {
    ...existing,
    status,
    completed: isCompleted,
    completedAt: isCompleted ? now : undefined,
    startedAt: existing.startedAt || now,
    metadata: { ...(existing.metadata || {}), ...(metadata || {}) },
  };
  saveLocalActionRecords(userId, actionRecords);

  // 2. Keep roadmap completions map in sync
  const roadmapCompletions = getLocalCompletions(userId);
  if (isCompleted) {
    roadmapCompletions[actionId] = now;
  } else {
    delete roadmapCompletions[actionId];
  }
  saveLocalCompletions(userId, roadmapCompletions);

  // 3. Persist to Supabase if configured
  if (isSupabaseConfigured && supabase && userId) {
    try {
      if (isCompleted) {
        const { error } = await supabase
          .from('user_roadmap_tasks')
          .upsert(
            {
              user_id: userId,
              task_key: actionId,
              completed: true,
              completed_at: now,
              updated_at: now,
            },
            { onConflict: 'user_id,task_key' }
          );

        if (error) {
          console.warn('Supabase action upsert error:', error.message);
        }
      } else {
        const { error } = await supabase
          .from('user_roadmap_tasks')
          .delete()
          .eq('user_id', userId)
          .eq('task_key', actionId);

        if (error) {
          console.warn('Supabase action deletion error:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('Error syncing action record with Supabase:', err);
    }
  }

  return { success: true };
}

/**
 * Undo an action completion (e.g. "Marked by mistake? [Undo]")
 */
export async function undoUserActionCompletion(
  userId: string,
  actionId: string
): Promise<{ success: boolean; error?: string }> {
  return setUserActionRecord(userId, actionId, 'not_started');
}

/**
 * Persist or toggle a user's roadmap task completion.
 * Backward compatible wrapper around setUserActionRecord.
 */
export async function setUserRoadmapTaskCompletion(
  userId: string,
  taskKey: string,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  return setUserActionRecord(userId, taskKey, completed ? 'completed' : 'not_started');
}
