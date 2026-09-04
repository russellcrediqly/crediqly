import { supabase, isSupabaseConfigured } from './client';
import { BusinessProfile } from '@/types/business';
import {
  FundingReadinessResult,
  FundingReadinessRecord,
  FundingHistoryEntry,
} from '@/types/funding';
import { calculateFundingReadiness } from '@/lib/readiness/fundingEngine';
import { recordProgressSnapshot, getProgressHistory } from './progressService';

const LOCAL_STORAGE_FUNDING_PREFIX = 'crediqly_funding_readiness_';
const LOCAL_STORAGE_FUNDING_HIST_PREFIX = 'crediqly_funding_history_';

function getLocalRecord(userId: string): FundingReadinessRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_FUNDING_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local funding readiness record:', e);
  }
  return null;
}

function saveLocalRecord(userId: string, record: FundingReadinessRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_FUNDING_PREFIX}${userId}`, JSON.stringify(record));
  } catch (e) {
    console.warn('Failed to persist local funding readiness record:', e);
  }
}

function getLocalFundingHistory(userId: string): FundingHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_FUNDING_HIST_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local funding history:', e);
  }
  return [];
}

function saveLocalFundingHistory(userId: string, history: FundingHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_FUNDING_HIST_PREFIX}${userId}`,
      JSON.stringify(history.slice(0, 20))
    );
  } catch (e) {
    console.warn('Failed to persist local funding history:', e);
  }
}

/**
 * Get or compute Funding Readiness for a user.
 * Recalculates dynamically from the business profile so data stays fresh.
 */
export async function getFundingReadiness(
  userId: string,
  profile: Partial<BusinessProfile> | null
): Promise<FundingReadinessResult> {
  // Always calculate dynamically from active profile data (ground truth)
  const calculated = calculateFundingReadiness(profile);

  // Background persist if user is authenticated and profile has data
  if (userId && profile) {
    saveFundingReadiness(userId, profile.businessId, calculated).catch((err) => {
      console.warn('Background funding readiness save note:', err?.message || err);
    });
  }

  return calculated;
}

/**
 * Persist Funding Readiness snapshot to Supabase and update local storage.
 */
export async function saveFundingReadiness(
  userId: string,
  businessId: string | undefined,
  result: FundingReadinessResult
): Promise<{ success: boolean; data?: FundingReadinessRecord; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  const now = new Date().toISOString();
  const record: FundingReadinessRecord = {
    id: `fr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    businessId,
    score: result.score,
    readinessLevel: result.level,
    foundationScore: result.categories.foundation.score,
    businessCreditScore: result.categories.businessCredit.score,
    financialReadinessScore: result.categories.financialReadiness.score,
    profileScore: result.categories.fundingProfile.score,
    calculatedAt: result.calculatedAt || now,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Update local cache
  saveLocalRecord(userId, record);

  // Update local history
  const localHist = getLocalFundingHistory(userId);
  const latestHist = localHist[0];
  if (!latestHist || latestHist.score !== result.score) {
    localHist.unshift({
      id: record.id,
      date: now,
      score: result.score,
      level: result.level,
    });
    saveLocalFundingHistory(userId, localHist);
  }

  // 2. Persist to Supabase if available
  if (isSupabaseConfigured && supabase) {
    try {
      // Upsert into funding_readiness table
      const { data, error } = await supabase
        .from('funding_readiness')
        .insert({
          user_id: userId,
          business_id: businessId || null,
          score: result.score,
          readiness_level: result.level,
          foundation_score: result.categories.foundation.score,
          business_credit_score: result.categories.businessCredit.score,
          financial_readiness_score: result.categories.financialReadiness.score,
          profile_score: result.categories.fundingProfile.score,
          calculated_at: result.calculatedAt || now,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        record.id = data.id;
        saveLocalRecord(userId, record);
      }

      // Also update funding_readiness_score on businesses table for quick queries
      if (businessId) {
        await supabase
          .from('businesses')
          .update({
            funding_readiness_score: result.score,
            updated_at: now,
          })
          .eq('id', businessId);
      }
    } catch (err: any) {
      console.warn('Supabase funding_readiness persistence notice:', err?.message || err);
    }
  }

  return { success: true, data: record };
}

/**
 * Fetch historical Funding Readiness score snapshots.
 * Leverages both dedicated snapshots and progress_history entries.
 */
export async function getFundingReadinessHistory(
  userId: string,
  limit: number = 5
): Promise<FundingHistoryEntry[]> {
  if (!userId) return [];

  const localHist = getLocalFundingHistory(userId);

  if (isSupabaseConfigured && supabase) {
    try {
      // Query funding_readiness snapshots
      const { data, error } = await supabase
        .from('funding_readiness')
        .select('id, score, readiness_level, calculated_at')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        const dbEntries: FundingHistoryEntry[] = data.map((d: any) => ({
          id: d.id,
          date: d.calculated_at,
          score: Number(d.score),
          level: d.readiness_level as any,
        }));
        saveLocalFundingHistory(userId, dbEntries);
        return dbEntries;
      }
    } catch (err) {
      console.warn('Failed querying funding_readiness history from Supabase:', err);
    }
  }

  return localHist.slice(0, limit);
}
