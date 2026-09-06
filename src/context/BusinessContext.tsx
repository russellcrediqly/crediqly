'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { BusinessProfile } from '@/types/business';
import { useAuth } from './AuthContext';
import { calculateReadiness } from '@/lib/scoring';
import { logActivity } from '@/lib/supabase/activityService';
import { recordProgressSnapshot } from '@/lib/supabase/progressService';

interface BusinessContextType {
  business: BusinessProfile | null;
  loading: boolean;
  error: string | null;
  saveBusinessProfile: (data: Partial<BusinessProfile>) => Promise<{ success: boolean; error?: string }>;
  saveDraft: (data: Partial<BusinessProfile>) => void;
  getDraft: () => Partial<BusinessProfile> | null;
  clearDraft: () => void;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const LOCAL_STORAGE_BUSINESS_KEY_PREFIX = 'crediqly_business_';
const LOCAL_STORAGE_DRAFT_KEY_PREFIX = 'crediqly_draft_';

// Helper to map camelCase to Supabase snake_case
function toDbPayload(userId: string, data: Partial<BusinessProfile>) {
  const payload: Record<string, any> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  payload.business_name =
    data.businessName && data.businessName.trim() !== ''
      ? data.businessName.trim()
      : 'My Business';
  if (data.entityType !== undefined) payload.entity_type = data.entityType;
  if (data.state !== undefined) payload.state = data.state;
  if (data.industry !== undefined) payload.industry = data.industry;
  if (data.businessAge !== undefined) payload.business_age = data.businessAge;

  if (data.hasEIN !== undefined) payload.has_ein = data.hasEIN;
  if (data.hasBusinessBankAccount !== undefined) payload.has_business_bank_account = data.hasBusinessBankAccount;
  if (data.hasWebsite !== undefined) payload.has_website = data.hasWebsite;
  if (data.hasBusinessPhone !== undefined) payload.has_business_phone = data.hasBusinessPhone;
  if (data.hasBusinessEmail !== undefined) payload.has_business_email = data.hasBusinessEmail;
  if (data.hasBusinessAddress !== undefined) payload.has_business_address = data.hasBusinessAddress;
  if (data.hasBusinessLicense !== undefined) payload.has_business_license = data.hasBusinessLicense;
  if (data.hasDuns !== undefined) payload.has_duns = data.hasDuns;

  if (data.hasBusinessCreditProfile !== undefined) payload.has_business_credit_profile = data.hasBusinessCreditProfile;
  if (data.knowsBusinessCreditScore !== undefined) payload.knows_business_credit_score = data.knowsBusinessCreditScore;
  if (data.businessCreditScore !== undefined) {
    const num = Number(data.businessCreditScore);
    payload.business_credit_score = isNaN(num) ? null : num;
  }
  if (data.businessCreditAccountCount !== undefined) payload.business_credit_account_count = data.businessCreditAccountCount;
  if (data.hasReportingAccounts !== undefined) payload.has_reporting_accounts = data.hasReportingAccounts;
  if (data.hasBusinessCreditCard !== undefined) payload.has_business_credit_card = data.hasBusinessCreditCard;
  if (data.hasFundingHistory !== undefined) payload.has_funding_history = data.hasFundingHistory;

  if (data.annualRevenueRange !== undefined) payload.annual_revenue_range = data.annualRevenueRange;
  if (data.personalCreditRange !== undefined) payload.personal_credit_range = data.personalCreditRange;
  if (data.fundingAmount !== undefined) payload.funding_amount = data.fundingAmount;
  if (data.fundingPurpose !== undefined || data.completedDbTasks !== undefined) {
    const userPurposes = (data.fundingPurpose || []).filter((p: string) => !p.startsWith('__task:'));
    const taskTags = (data.completedDbTasks || []).map((t: string) => `__task:${t}`);
    payload.funding_purpose = Array.from(new Set([...userPurposes, ...taskTags]));
  }

  if (data.profileCompleted !== undefined) payload.profile_completed = data.profileCompleted;
  if (data.profileCompletedAt !== undefined) payload.profile_completed_at = data.profileCompletedAt;

  if (data.businessReadinessScore !== undefined) payload.business_readiness_score = data.businessReadinessScore;
  if (data.creditReadinessScore !== undefined) payload.credit_readiness_score = data.creditReadinessScore;
  if (data.readinessUpdatedAt !== undefined) payload.readiness_updated_at = data.readinessUpdatedAt;

  return payload;
}

// Helper to map Supabase snake_case to camelCase
function fromDbRow(row: Record<string, any>): BusinessProfile {
  const rawPurposes: string[] = Array.isArray(row.funding_purpose) ? row.funding_purpose : [];
  const cleanPurposes = rawPurposes.filter((p: string) => !p.startsWith('__task:'));
  const dbTasks = rawPurposes
    .filter((p: string) => p.startsWith('__task:'))
    .map((p: string) => p.replace('__task:', ''));

  return {
    businessId: row.id,
    userId: row.user_id,
    businessName: row.business_name || '',
    entityType: row.entity_type || '',
    state: row.state || '',
    industry: row.industry || '',
    businessAge: row.business_age || '',

    hasEIN: row.has_ein,
    hasBusinessBankAccount: row.has_business_bank_account,
    hasWebsite: row.has_website,
    hasBusinessPhone: row.has_business_phone,
    hasBusinessEmail: row.has_business_email,
    hasBusinessAddress: row.has_business_address,
    hasBusinessLicense: row.has_business_license,
    hasDuns: row.has_duns,

    hasBusinessCreditProfile: row.has_business_credit_profile,
    knowsBusinessCreditScore: row.knows_business_credit_score,
    businessCreditScore: row.business_credit_score ?? '',
    businessCreditAccountCount: row.business_credit_account_count,
    hasReportingAccounts: row.has_reporting_accounts,
    hasBusinessCreditCard: row.has_business_credit_card,
    hasFundingHistory: row.has_funding_history,

    annualRevenueRange: row.annual_revenue_range,
    personalCreditRange: row.personal_credit_range,
    fundingAmount: row.funding_amount,
    fundingPurpose: cleanPurposes,
    completedDbTasks: dbTasks,

    profileCompleted: Boolean(row.profile_completed),
    profileCompletedAt: row.profile_completed_at,
    businessReadinessScore: row.business_readiness_score !== null && row.business_readiness_score !== undefined ? Number(row.business_readiness_score) : undefined,
    creditReadinessScore: row.credit_readiness_score !== null && row.credit_readiness_score !== undefined ? Number(row.credit_readiness_score) : undefined,
    readinessUpdatedAt: row.readiness_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const isUUID = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const localKey = `${LOCAL_STORAGE_BUSINESS_KEY_PREFIX}${user.id}`;
    let loadedFromLocal: BusinessProfile | null = null;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        loadedFromLocal = JSON.parse(stored);
        // Pre-populate immediately to eliminate delay and layout shift
        setBusiness(loadedFromLocal);
      }
    } catch (e) {
      console.warn('Error reading local business storage:', e);
    }

    if (isSupabaseConfigured && supabase && isUUID(user.id)) {
      try {
        const fetchPromise = supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: null }), 2500)
        );

        const { data, error: dbError } = await Promise.race([fetchPromise, timeoutPromise]);

        if (!dbError && data) {
          const parsed = fromDbRow(data);
          setBusiness(parsed);
          try {
            localStorage.setItem(localKey, JSON.stringify(parsed));
          } catch (e) {}
        } else {
          // If Supabase returned error, empty, or timed out, maintain local cache
          if (loadedFromLocal) {
            setBusiness(loadedFromLocal);
          } else if (!data && dbError) {
            setBusiness(null);
          }
        }
      } catch (err) {
        console.warn('Database fetch fallback to local storage:', err);
        if (loadedFromLocal) setBusiness(loadedFromLocal);
      }
    } else {
      if (loadedFromLocal) setBusiness(loadedFromLocal);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const saveBusinessProfile = async (
    data: Partial<BusinessProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User is not authenticated' };
    }

    setError(null);

    const mergedData: BusinessProfile = {
      ...(business || {
        userId: user.id,
        businessName: '',
        entityType: '',
        state: '',
        industry: '',
        businessAge: '',
        profileCompleted: false,
      }),
      ...data,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };

    // Calculate internal readiness scores automatically
    const readiness = calculateReadiness(mergedData);
    mergedData.businessReadinessScore = readiness.businessReadiness.score;
    mergedData.creditReadinessScore = readiness.creditReadiness.score;
    mergedData.readinessUpdatedAt = new Date().toISOString();

    const localKey = `${LOCAL_STORAGE_BUSINESS_KEY_PREFIX}${user.id}`;
    if (!mergedData.businessId) {
      mergedData.businessId = `biz_${Date.now()}`;
    }

    // Always persist to local cache first so data is never lost
    try {
      localStorage.setItem(localKey, JSON.stringify(mergedData));
    } catch (localErr) {
      console.warn('Error saving to local storage:', localErr);
    }

    // If Supabase is connected and user has a valid UUID, sync to remote database
    if (isSupabaseConfigured && supabase && isUUID(user.id)) {
      try {
        const dbPayload = toDbPayload(user.id, mergedData);

        // Use upsert on user_id to prevent duplicate key or missing ID errors
        const { data: upsertData, error: upsertError } = await supabase
          .from('businesses')
          .upsert(dbPayload, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (!upsertError && upsertData) {
          mergedData.businessId = upsertData.id;
          try {
            localStorage.setItem(localKey, JSON.stringify(mergedData));
          } catch (e) {}

          // Sync audit record in readiness_scores table
          if (isUUID(upsertData.id)) {
            try {
              await supabase.from('readiness_scores').upsert({
                business_id: upsertData.id,
                user_id: user.id,
                business_readiness_score: readiness.businessReadiness.score,
                credit_readiness_score: readiness.creditReadiness.score,
                business_readiness_level: readiness.businessReadiness.level,
                credit_readiness_level: readiness.creditReadiness.level,
                calculated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'business_id' });
            } catch (scoreErr) {
              console.warn('Readiness score audit table sync:', scoreErr);
            }
          }
        } else if (upsertError) {
          console.warn('Supabase businesses save fallback to local storage:', upsertError.message);
        }
      } catch (err: any) {
        console.warn('Database save exception, relying on local storage:', err);
      }
    }

    const prevBusinessScore = business?.businessReadinessScore;
    const prevCreditScore = business?.creditReadinessScore;

    setBusiness(mergedData);
    clearDraft();

    // Log meaningful activity (Prompt 10)
    logActivity(user.id, {
      activityType: 'profile_updated',
      title: 'Business profile updated',
      description: mergedData.businessName || 'Business details saved',
      businessId: mergedData.businessId,
    }).catch((e) => console.warn('Activity logging error:', e));

    // Log readiness update if scores changed (Prompt 11)
    if (
      prevBusinessScore !== undefined &&
      prevCreditScore !== undefined &&
      (prevBusinessScore !== readiness.businessReadiness.score ||
        prevCreditScore !== readiness.creditReadiness.score)
    ) {
      logActivity(user.id, {
        activityType: 'readiness_updated',
        title: 'Your Crediqly readiness profile was updated',
        description: `Business Readiness: ${readiness.businessReadiness.score}%, Credit Readiness: ${readiness.creditReadiness.score}%`,
        businessId: mergedData.businessId,
      }).catch((e) => console.warn('Readiness activity logging error:', e));
    }

    // Record progress snapshot (Prompt 20)
    recordProgressSnapshot(user.id, {
      businessId: mergedData.businessId,
      businessReadinessScore: readiness.businessReadiness.score,
      creditReadinessScore: readiness.creditReadiness.score,
      roadmapProgress: 0,
    }).catch((e) => console.warn('Progress history snapshot error:', e));

    return { success: true };
  };


  const saveDraft = (data: Partial<BusinessProfile>) => {
    if (!user) return;
    try {
      const draftKey = `${LOCAL_STORAGE_DRAFT_KEY_PREFIX}${user.id}`;
      const currentDraft = getDraft() || {};
      const updated = { ...currentDraft, ...data };
      localStorage.setItem(draftKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Unable to persist draft', e);
    }
  };

  const getDraft = (): Partial<BusinessProfile> | null => {
    if (!user) return null;
    try {
      const draftKey = `${LOCAL_STORAGE_DRAFT_KEY_PREFIX}${user.id}`;
      const saved = localStorage.getItem(draftKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const clearDraft = () => {
    if (!user) return;
    try {
      const draftKey = `${LOCAL_STORAGE_DRAFT_KEY_PREFIX}${user.id}`;
      localStorage.removeItem(draftKey);
    } catch (e) {
      // Ignore
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        business,
        loading,
        error,
        saveBusinessProfile,
        saveDraft,
        getDraft,
        clearDraft,
        refreshBusiness: fetchBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
