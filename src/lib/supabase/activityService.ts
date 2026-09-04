import { supabase, isSupabaseConfigured } from './client';
import { ActivityLogItem, ActivityType } from '@/types/progress';

const LOCAL_STORAGE_ACTIVITY_PREFIX = 'crediqly_activity_';

function getLocalActivities(userId: string): ActivityLogItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_ACTIVITY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local activity cache:', e);
  }
  return [];
}

function saveLocalActivities(userId: string, activities: ActivityLogItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep max 50 recent activities locally
    const trimmed = activities.slice(0, 50);
    localStorage.setItem(`${LOCAL_STORAGE_ACTIVITY_PREFIX}${userId}`, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to persist local activity cache:', e);
  }
}

// In-memory deduplication window (5 seconds) to prevent duplicate button clicks
const recentLogsMap = new Map<string, number>();

/**
 * Fetch the user's most recent activity entries (default 10).
 */
export async function getRecentActivities(
  userId: string,
  limit: number = 10
): Promise<ActivityLogItem[]> {
  const localItems = getLocalActivities(userId);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        const dbItems: ActivityLogItem[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          businessId: row.business_id,
          activityType: row.activity_type as ActivityType,
          title: row.title,
          description: row.description,
          createdAt: row.created_at,
        }));

        // Merge DB items with any un-synced local items (by ID or timestamp + title)
        const existingIds = new Set(dbItems.map((item) => item.id));
        const merged = [...dbItems];

        for (const localItem of localItems) {
          if (!existingIds.has(localItem.id)) {
            // Check if there is already an item with matching title and within 2 seconds
            const duplicate = dbItems.some(
              (dbi) =>
                dbi.title === localItem.title &&
                Math.abs(new Date(dbi.createdAt).getTime() - new Date(localItem.createdAt).getTime()) < 3000
            );
            if (!duplicate) {
              merged.push(localItem);
            }
          }
        }

        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const result = merged.slice(0, limit);
        saveLocalActivities(userId, result);
        return result;
      }
    } catch (err) {
      console.warn('Supabase activity_log query failed, using local cache:', err);
    }
  }

  return localItems.slice(0, limit);
}

/**
 * Log a meaningful user activity.
 */
export async function logActivity(
  userId: string,
  entry: {
    activityType: ActivityType;
    title: string;
    description?: string;
    businessId?: string;
  }
): Promise<{ success: boolean; data?: ActivityLogItem; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  // Deduplication check: prevent same activity within 4 seconds
  const dedupKey = `${userId}:${entry.activityType}:${entry.title}:${entry.description || ''}`;
  const nowMs = Date.now();
  const lastLogged = recentLogsMap.get(dedupKey);
  if (lastLogged && nowMs - lastLogged < 4000) {
    return { success: true };
  }
  recentLogsMap.set(dedupKey, nowMs);

  const createdAt = new Date().toISOString();
  const newItem: ActivityLogItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    businessId: entry.businessId,
    activityType: entry.activityType,
    title: entry.title,
    description: entry.description,
    createdAt,
  };

  // 1. Always update local storage first
  const localList = getLocalActivities(userId);
  localList.unshift(newItem);
  saveLocalActivities(userId, localList);

  // 2. Sync to Supabase if connected
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .insert({
          user_id: userId,
          business_id: entry.businessId || null,
          activity_type: entry.activityType,
          title: entry.title,
          description: entry.description || null,
          created_at: createdAt,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        newItem.id = data.id;
        // Update local item with real DB UUID
        localList[0] = newItem;
        saveLocalActivities(userId, localList);
      } else if (error) {
        console.warn('Supabase activity_log insert error:', error.message);
      }
    } catch (err) {
      console.warn('Error inserting into activity_log:', err);
    }
  }

  return { success: true, data: newItem };
}
