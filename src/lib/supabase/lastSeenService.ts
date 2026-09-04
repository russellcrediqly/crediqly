import { supabase, isSupabaseConfigured } from './client';
import { getRecentActivities } from './activityService';
import { SinceLastVisitSummary } from '@/types/progress';

const LOCAL_STORAGE_LAST_SEEN_PREFIX = 'crediqly_last_seen_';

export async function getLastSeenAt(userId: string): Promise<string | null> {
  if (typeof window === 'undefined' || !userId) return null;

  // Check local storage first
  const localVal = localStorage.getItem(`${LOCAL_STORAGE_LAST_SEEN_PREFIX}${userId}`);

  // If Supabase is available, we can also check profiles.last_seen_at
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('last_seen_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.last_seen_at) {
        return data.last_seen_at;
      }
    } catch (err) {
      console.warn('Failed to fetch last_seen_at from Supabase:', err);
    }
  }

  return localVal;
}

export async function updateLastSeenAt(userId: string): Promise<void> {
  if (!userId) return;
  const now = new Date().toISOString();

  // Save to local storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_LAST_SEEN_PREFIX}${userId}`, now);
    } catch (e) {
      console.warn('Failed to save last_seen_at locally:', e);
    }
  }

  // Update Supabase profiles.last_seen_at
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ last_seen_at: now, updated_at: now })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Failed to update last_seen_at in Supabase:', err);
    }
  }
}

/**
 * Compare recent activities against the user's previous session timestamp (lastSeenAt).
 */
export async function getSinceLastVisitSummary(
  userId: string,
  lastSeenAt: string | null
): Promise<SinceLastVisitSummary> {
  const activities = await getRecentActivities(userId, 20);

  if (!lastSeenAt) {
    // First session or no previous record: show recent activities from this session
    const completedTasks = activities.filter((a) => a.activityType === 'task_completed');
    const profileUpdated = activities.some((a) => a.activityType === 'profile_updated');
    const readinessUpdated = activities.some((a) => a.activityType === 'readiness_updated');

    const items: string[] = [];
    if (completedTasks.length > 0) {
      items.push(
        `${completedTasks.length} roadmap task${completedTasks.length > 1 ? 's' : ''} completed`
      );
    }
    if (profileUpdated) items.push('Business profile updated');
    if (readinessUpdated) items.push('Crediqly readiness profile recalculated');

    return {
      hasChanges: items.length > 0,
      completedTasksCount: completedTasks.length,
      profileUpdated,
      readinessRecalculated: readinessUpdated,
      items,
    };
  }

  const lastSeenMs = new Date(lastSeenAt).getTime();
  const newActivities = activities.filter(
    (a) => new Date(a.createdAt).getTime() > lastSeenMs
  );

  const completedTasks = newActivities.filter((a) => a.activityType === 'task_completed');
  const profileUpdated = newActivities.some((a) => a.activityType === 'profile_updated');
  const readinessUpdated = newActivities.some((a) => a.activityType === 'readiness_updated');

  const items: string[] = [];
  if (completedTasks.length > 0) {
    items.push(
      `${completedTasks.length} roadmap task${completedTasks.length > 1 ? 's' : ''} completed`
    );
  }
  if (profileUpdated) items.push('Business profile updated');
  if (readinessUpdated) items.push('Crediqly readiness profile recalculated');

  return {
    hasChanges: items.length > 0,
    completedTasksCount: completedTasks.length,
    profileUpdated,
    readinessRecalculated: readinessUpdated,
    items,
  };
}
