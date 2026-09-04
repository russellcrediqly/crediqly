import { supabase, isSupabaseConfigured } from './client';
import type {
  FundingApplication,
  FundingApplicationInput,
  FundingApplicationStatus,
} from '../../types/fundingApplication';
import { getFundingProducts } from './fundingProductService';

const STORAGE_KEY = 'crediqly_funding_applications';

function getLocalApplications(): FundingApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local applications:', e);
  }
  return [];
}

function saveLocalApplications(apps: FundingApplication[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.warn('Failed to save local applications:', e);
  }
}

function fromDbRow(row: any): FundingApplication {
  return {
    id: row.id,
    userId: row.user_id,
    fundingProductId: row.funding_product_id,
    providerName: row.provider_name,
    productName: row.product_name,
    category: row.category || '',
    requestedAmount: typeof row.requested_amount === 'number' ? row.requested_amount : Number(row.requested_amount) || 0,
    status: (row.status as FundingApplicationStatus) || 'Interested',
    applicationDate: row.application_date || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRow(app: Partial<FundingApplication>): Record<string, any> {
  const row: Record<string, any> = {};
  if (app.userId !== undefined) row.user_id = app.userId;
  if (app.fundingProductId !== undefined) row.funding_product_id = app.fundingProductId;
  if (app.providerName !== undefined) row.provider_name = app.providerName;
  if (app.productName !== undefined) row.product_name = app.productName;
  if (app.category !== undefined) row.category = app.category;
  if (app.requestedAmount !== undefined) row.requested_amount = app.requestedAmount;
  if (app.status !== undefined) row.status = app.status;
  if (app.applicationDate !== undefined) row.application_date = app.applicationDate ? app.applicationDate : null;
  if (app.notes !== undefined) row.notes = app.notes;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Fetch all funding opportunities / applications tracked by a customer.
 * Enriches each record with latest admin-controlled product URLs.
 */
export async function getUserFundingApplications(userId: string): Promise<FundingApplication[]> {
  if (!userId) return [];
  let apps: FundingApplication[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_applications')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        apps = data.map(fromDbRow);
      }
    } catch (err) {
      console.warn('Supabase funding_applications query failed, using local fallback:', err);
      apps = getLocalApplications().filter((a) => a.userId === userId);
    }
  } else {
    apps = getLocalApplications().filter((a) => a.userId === userId);
  }

  // Enrich with latest live funding products catalog so URLs are dynamically up-to-date
  try {
    const products = await getFundingProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));

    return apps.map((app) => {
      const prod = productMap.get(app.fundingProductId);
      if (prod) {
        return {
          ...app,
          websiteUrl: prod.websiteUrl,
          affiliateUrl: prod.affiliateUrl,
          affiliateEnabled: prod.affiliateEnabled,
        };
      }
      return app;
    });
  } catch (err) {
    return apps;
  }
}

/**
 * Add a funding opportunity to the customer's tracker.
 * Prevents duplicates for the same customer + product.
 */
export async function createFundingApplication(
  input: FundingApplicationInput,
  userId: string
): Promise<FundingApplication> {
  if (!userId) throw new Error('User authentication required to track funding');

  // Check existing
  const existingList = await getUserFundingApplications(userId);
  const found = existingList.find((a) => a.fundingProductId === input.fundingProductId);
  if (found) {
    // If already exists, return existing
    return found;
  }

  const newApp: FundingApplication = {
    id: `fapp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    fundingProductId: input.fundingProductId,
    providerName: input.providerName,
    productName: input.productName,
    category: input.category || '',
    requestedAmount: input.requestedAmount || 0,
    status: input.status || 'Interested',
    applicationDate: input.applicationDate || '',
    notes: input.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_applications')
        .insert([toDbRow(newApp)])
        .select()
        .single();

      if (!error && data) {
        const created = fromDbRow(data);
        const current = getLocalApplications();
        saveLocalApplications([created, ...current]);
        return created;
      }
    } catch (err) {
      console.warn('Supabase create funding_applications failed, persisting locally:', err);
    }
  }

  const current = getLocalApplications();
  saveLocalApplications([newApp, ...current]);
  return newApp;
}

/**
 * Update a tracked application (status, requested amount, notes, application date).
 */
export async function updateFundingApplication(
  id: string,
  updates: Partial<FundingApplication>
): Promise<FundingApplication | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_applications')
        .update(toDbRow(updates))
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated = fromDbRow(data);
        const current = getLocalApplications();
        saveLocalApplications(current.map((a) => (a.id === id ? updated : a)));
        return updated;
      }
    } catch (err) {
      console.warn('Supabase update funding_applications failed, updating locally:', err);
    }
  }

  const current = getLocalApplications();
  const idx = current.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const merged: FundingApplication = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[idx] = merged;
  saveLocalApplications([...current]);
  return merged;
}

/**
 * Delete a tracked application.
 * Note: Only deletes the customer's tracker record, never deletes the funding product itself.
 */
export async function deleteFundingApplication(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('funding_applications').delete().eq('id', id);
      if (!error) {
        const current = getLocalApplications();
        saveLocalApplications(current.filter((a) => a.id !== id));
        return true;
      }
    } catch (err) {
      console.warn('Supabase delete funding_applications failed, deleting locally:', err);
    }
  }

  const current = getLocalApplications();
  saveLocalApplications(current.filter((a) => a.id !== id));
  return true;
}

/**
 * Admin view: Fetch all tracked applications across customers.
 */
export async function getAllFundingApplicationsAdmin(): Promise<
  (FundingApplication & { userEmail?: string })[]
> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_applications')
        .select('*, profiles:user_id(email)')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          ...fromDbRow(row),
          userEmail: row.profiles?.email || 'Registered Customer',
        }));
      }
    } catch (err) {
      console.warn('Supabase admin funding_applications query failed, using local fallback:', err);
    }
  }

  return getLocalApplications().map((app) => ({
    ...app,
    userEmail: 'Local Customer',
  }));
}
