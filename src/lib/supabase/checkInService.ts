import { supabase, isSupabaseConfigured } from './client';
import { MonthlyCheckInRecord, MonthlyCheckInResponses } from '@/types/checkIn';

const LOCAL_STORAGE_CHECKIN_PREFIX = 'crediqly_checkins_';

function getLocalCheckIns(userId: string): MonthlyCheckInRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_CHECKIN_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local check-in history cache:', e);
  }
  return [];
}

function saveLocalCheckIns(userId: string, records: MonthlyCheckInRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_CHECKIN_PREFIX}${userId}`, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to persist local check-in history cache:', e);
  }
}

/**
 * Fetch all monthly check-ins for a user
 */
export async function getMonthlyCheckIns(userId: string): Promise<MonthlyCheckInRecord[]> {
  const localList = getLocalCheckIns(userId);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('monthly_check_ins')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbItems: MonthlyCheckInRecord[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          businessId: row.business_id,
          submittedAt: row.submitted_at,
          monthYear: row.month_year || new Date(row.submitted_at).toLocaleString('default', { month: 'long', year: 'numeric' }),
          responses: row.responses || {},
          previousScore: row.previous_score != null ? Number(row.previous_score) : undefined,
          newScore: row.new_score != null ? Number(row.new_score) : undefined,
          nextBestActionTitle: row.next_best_action_title,
        }));

        const existingIds = new Set(dbItems.map((item) => item.id));
        const merged = [...dbItems];
        for (const local of localList) {
          if (!existingIds.has(local.id)) {
            merged.push(local);
          }
        }
        merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        saveLocalCheckIns(userId, merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase monthly_check_ins fetch error, using local fallback:', err);
    }
  }

  return localList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

/**
 * Get the latest monthly check-in for a user
 */
export async function getLatestCheckIn(userId: string): Promise<MonthlyCheckInRecord | null> {
  const list = await getMonthlyCheckIns(userId);
  return list.length > 0 ? list[0] : null;
}

/**
 * Check whether a check-in is due this month (checks if already submitted this calendar month)
 */
export async function isCheckInDue(userId: string): Promise<boolean> {
  const latest = await getLatestCheckIn(userId);
  if (!latest) return true;

  const latestDate = new Date(latest.submittedAt);
  const now = new Date();

  // If submitted in the current year and current month, not due yet
  const isCurrentMonth =
    latestDate.getFullYear() === now.getFullYear() &&
    latestDate.getMonth() === now.getMonth();

  return !isCurrentMonth;
}

/**
 * Submit a new monthly check-in
 */
export async function submitMonthlyCheckIn(params: {
  userId: string;
  businessId?: string;
  responses: MonthlyCheckInResponses;
  previousScore?: number;
  newScore?: number;
  nextBestActionTitle?: string;
}): Promise<MonthlyCheckInRecord> {
  const now = new Date();
  const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const id = `checkin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newRecord: MonthlyCheckInRecord = {
    id,
    userId: params.userId,
    businessId: params.businessId,
    submittedAt: now.toISOString(),
    monthYear,
    responses: params.responses,
    previousScore: params.previousScore,
    newScore: params.newScore,
    nextBestActionTitle: params.nextBestActionTitle,
  };

  // 1. Update local storage cache immediately
  const currentList = getLocalCheckIns(params.userId);
  const updatedList = [newRecord, ...currentList.filter((item) => item.id !== id)];
  saveLocalCheckIns(params.userId, updatedList);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('monthly_check_ins').insert({
        id: newRecord.id,
        user_id: newRecord.userId,
        business_id: newRecord.businessId,
        submitted_at: newRecord.submittedAt,
        month_year: newRecord.monthYear,
        responses: newRecord.responses,
        previous_score: newRecord.previousScore,
        new_score: newRecord.newScore,
        next_best_action_title: newRecord.nextBestActionTitle,
      });

      if (error) {
        console.warn('Failed to insert check-in into Supabase (will rely on local cache):', error.message);
      }
    } catch (err) {
      console.warn('Error connecting to Supabase for monthly check-in:', err);
    }
  }

  return newRecord;
}
