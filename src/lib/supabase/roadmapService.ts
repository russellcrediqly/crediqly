import { supabase, isSupabaseConfigured } from './client';

const LOCAL_STORAGE_KEY_PREFIX = 'crediqly_roadmap_';

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
 * Persist or toggle a user's roadmap task completion.
 */
export async function setUserRoadmapTaskCompletion(
  userId: string,
  taskKey: string,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  // Always update local storage first for snappy UI feedback
  const localMap = getLocalCompletions(userId);
  const now = new Date().toISOString();

  if (completed) {
    localMap[taskKey] = now;
  } else {
    delete localMap[taskKey];
  }
  saveLocalCompletions(userId, localMap);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      if (completed) {
        const { error } = await supabase
          .from('user_roadmap_tasks')
          .upsert(
            {
              user_id: userId,
              task_key: taskKey,
              completed: true,
              completed_at: now,
              updated_at: now,
            },
            { onConflict: 'user_id,task_key' }
          );

        if (error) {
          console.warn('Supabase task completion upsert error:', error.message);
          // Return success true because local is updated and user shouldn't be blocked
        }
      } else {
        const { error } = await supabase
          .from('user_roadmap_tasks')
          .delete()
          .eq('user_id', userId)
          .eq('task_key', taskKey);

        if (error) {
          console.warn('Supabase task deletion error:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('Error syncing task completion with Supabase:', err);
    }
  }

  return { success: true };
}
