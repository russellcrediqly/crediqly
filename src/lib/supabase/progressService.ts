import { supabase, isSupabaseConfigured } from './client';
import { ProgressHistoryItem } from '@/types/progress';

const LOCAL_STORAGE_PROGRESS_PREFIX = 'crediqly_progress_history_';

function getLocalHistory(userId: string): ProgressHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PROGRESS_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local progress history cache:', e);
  }
  return [];
}

function saveLocalHistory(userId: string, history: ProgressHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = history.slice(0, 30);
    localStorage.setItem(`${LOCAL_STORAGE_PROGRESS_PREFIX}${userId}`, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to persist local progress history cache:', e);
  }
}

/**
 * Fetch the chronological progress history for a user.
 */
export async function getProgressHistory(
  userId: string,
  limit: number = 10
): Promise<ProgressHistoryItem[]> {
  const localHistory = getLocalHistory(userId);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('progress_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        const dbItems: ProgressHistoryItem[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          businessId: row.business_id,
          businessReadinessScore: Number(row.business_readiness_score || 0),
          creditReadinessScore: Number(row.credit_readiness_score || 0),
          fundingReadinessScore: row.funding_readiness_score != null ? Number(row.funding_readiness_score) : undefined,
          roadmapProgress: Number(row.roadmap_progress || 0),
          recordedAt: row.recorded_at,
        }));

        const existingIds = new Set(dbItems.map((item) => item.id));
        const merged = [...dbItems];

        for (const localItem of localHistory) {
          if (!existingIds.has(localItem.id)) {
            const duplicate = dbItems.some(
              (dbi) =>
                dbi.roadmapProgress === localItem.roadmapProgress &&
                dbi.businessReadinessScore === localItem.businessReadinessScore &&
                dbi.creditReadinessScore === localItem.creditReadinessScore &&
                Math.abs(new Date(dbi.recordedAt).getTime() - new Date(localItem.recordedAt).getTime()) < 60000
            );
            if (!duplicate) {
              merged.push(localItem);
            }
          }
        }

        merged.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
        const result = merged.slice(0, limit);
        saveLocalHistory(userId, result);
        return result;
      }
    } catch (err) {
      console.warn('Supabase progress_history query failed, using local cache:', err);
    }
  }

  return localHistory.slice(0, limit);
}

/**
 * Record a progress snapshot when a meaningful change occurs.
 * Prevents redundant snapshots if scores haven't changed.
 */
export async function recordProgressSnapshot(
  userId: string,
  snapshot: {
    businessId?: string;
    businessReadinessScore: number;
    creditReadinessScore: number;
    fundingReadinessScore?: number;
    roadmapProgress: number;
  }
): Promise<{ success: boolean; data?: ProgressHistoryItem; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  const localList = getLocalHistory(userId);
  const latest = localList[0];

  // Only record if scores changed or if no previous record exists
  if (
    latest &&
    latest.businessReadinessScore === snapshot.businessReadinessScore &&
    latest.creditReadinessScore === snapshot.creditReadinessScore &&
    latest.fundingReadinessScore === snapshot.fundingReadinessScore &&
    latest.roadmapProgress === snapshot.roadmapProgress
  ) {
    // No change in metrics, skip duplicate snapshot
    return { success: true, data: latest };
  }

  const recordedAt = new Date().toISOString();
  const newItem: ProgressHistoryItem = {
    id: `prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    businessId: snapshot.businessId,
    businessReadinessScore: snapshot.businessReadinessScore,
    creditReadinessScore: snapshot.creditReadinessScore,
    fundingReadinessScore: snapshot.fundingReadinessScore,
    roadmapProgress: snapshot.roadmapProgress,
    recordedAt,
  };

  // 1. Update local cache
  localList.unshift(newItem);
  saveLocalHistory(userId, localList);

  // 2. Persist to Supabase if available
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('progress_history')
        .insert({
          user_id: userId,
          business_id: snapshot.businessId || null,
          business_readiness_score: snapshot.businessReadinessScore,
          credit_readiness_score: snapshot.creditReadinessScore,
          funding_readiness_score: snapshot.fundingReadinessScore ?? null,
          roadmap_progress: snapshot.roadmapProgress,
          recorded_at: recordedAt,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        newItem.id = data.id;
        localList[0] = newItem;
        saveLocalHistory(userId, localList);
      } else if (error) {
        console.warn('Supabase progress_history insert error:', error.message);
      }
    } catch (err) {
      console.warn('Error inserting into progress_history:', err);
    }
  }

  return { success: true, data: newItem };
}
