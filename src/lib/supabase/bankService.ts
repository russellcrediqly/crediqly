import { supabase, isSupabaseConfigured } from './client';
import { Bank, BankStatus } from '@/types/bank';
import { INITIAL_BANKS } from '@/lib/banks/initialBanks';

const STORAGE_KEY = 'crediqly_admin_banks';
const BANK_CLICKS_STORAGE_KEY = 'crediqly_bank_clicks';

function getLocalBanks(): Bank[] {
  if (typeof window === 'undefined') return INITIAL_BANKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local banks:', e);
  }
  return INITIAL_BANKS;
}

function saveLocalBanks(banks: Bank[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banks));
  } catch (e) {
    console.warn('Failed to save local banks:', e);
  }
}

function fromDbRow(row: any): Bank {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description || '',
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    affiliateUrl: row.affiliate_url,
    affiliateEnabled: Boolean(row.affiliate_enabled),
    featured: Boolean(row.featured),
    status: (row.status as BankStatus) || 'active',
    priority: typeof row.priority === 'number' ? row.priority : 2,
    displayOrder: typeof row.display_order === 'number' ? row.display_order : 0,
    recommendedStage: row.recommended_stage || 'foundation',
    minDeposit: row.min_deposit || '$0',
    monthlyFee: row.monthly_fee || '$0',
    features: Array.isArray(row.features) ? row.features : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRow(b: Partial<Bank>): Record<string, any> {
  const row: Record<string, any> = {};
  if (b.name !== undefined) row.name = b.name;
  if (b.slug !== undefined) row.slug = b.slug;
  if (b.description !== undefined) row.description = b.description;
  if (b.shortDescription !== undefined) row.short_description = b.shortDescription;
  if (b.logoUrl !== undefined) row.logo_url = b.logoUrl;
  if (b.websiteUrl !== undefined) row.website_url = b.websiteUrl;
  if (b.affiliateUrl !== undefined) row.affiliate_url = b.affiliateUrl;
  if (b.affiliateEnabled !== undefined) row.affiliate_enabled = b.affiliateEnabled;
  if (b.featured !== undefined) row.featured = b.featured;
  if (b.status !== undefined) row.status = b.status;
  if (b.priority !== undefined) row.priority = b.priority;
  if (b.displayOrder !== undefined) row.display_order = b.displayOrder;
  if (b.recommendedStage !== undefined) row.recommended_stage = b.recommendedStage;
  if (b.minDeposit !== undefined) row.min_deposit = b.minDeposit;
  if (b.monthlyFee !== undefined) row.monthly_fee = b.monthlyFee;
  if (b.features !== undefined) row.features = b.features;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Fetch all active banks for customer-facing views.
 * Strictly excludes inactive banks.
 */
export async function getBanks(): Promise<Bank[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: true })
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(fromDbRow);
      }
    } catch (err) {
      console.warn('Supabase banks query failed, using local catalog:', err);
    }
  }

  // Local fallback (strictly active)
  const local = getLocalBanks();
  return local
    .filter((b) => b.status === 'active')
    .sort((a, b) => a.priority - b.priority || a.displayOrder - b.displayOrder);
}

/**
 * Fetch all banks for Admin management (includes active + inactive).
 */
export async function getAllBanksAdmin(): Promise<Bank[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(fromDbRow);
        saveLocalBanks(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase admin banks query failed, falling back locally:', err);
    }
  }

  return getLocalBanks();
}

/**
 * Fetch a single bank by slug.
 */
export async function getBankBySlug(slug: string): Promise<Bank | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return fromDbRow(data);
      }
    } catch (err) {
      console.warn('Supabase bank by slug failed, checking local catalog:', err);
    }
  }

  const local = getLocalBanks();
  return local.find((b) => b.slug === slug) || null;
}

/**
 * Admin: Create a new bank.
 */
export async function createBankAdmin(
  bankData: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; bank?: Bank; error?: string }> {
  const newBank: Bank = {
    ...bankData,
    id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const row = toDbRow(newBank);
      row.created_at = newBank.createdAt;
      const { data, error } = await supabase
        .from('banks')
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        const created = fromDbRow(data);
        const local = getLocalBanks();
        saveLocalBanks([created, ...local.filter((b) => b.id !== created.id)]);
        return { success: true, bank: created };
      }
    } catch (e: any) {
      console.warn('Supabase bank create failed, falling back locally:', e);
    }
  }

  // Local fallback
  const local = getLocalBanks();
  const updated = [newBank, ...local];
  saveLocalBanks(updated);
  return { success: true, bank: newBank };
}

/**
 * Admin: Update an existing bank.
 */
export async function updateBankAdmin(
  bankId: string,
  updates: Partial<Bank>
): Promise<{ success: boolean; bank?: Bank; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const row = toDbRow(updates);
      const { data, error } = await supabase
        .from('banks')
        .update(row)
        .eq('id', bankId)
        .select()
        .single();

      if (!error && data) {
        const updated = fromDbRow(data);
        const local = getLocalBanks();
        saveLocalBanks(local.map((b) => (b.id === bankId ? updated : b)));
        return { success: true, bank: updated };
      }
    } catch (e: any) {
      console.warn('Supabase bank update failed, falling back locally:', e);
    }
  }

  // Local fallback
  const local = getLocalBanks();
  let updatedBank: Bank | undefined;
  const nextList = local.map((b) => {
    if (b.id === bankId) {
      updatedBank = { ...b, ...updates, updatedAt: new Date().toISOString() };
      return updatedBank;
    }
    return b;
  });

  if (!updatedBank) {
    return { success: false, error: 'Bank not found' };
  }

  saveLocalBanks(nextList);
  return { success: true, bank: updatedBank };
}

/**
 * Admin: Quick helper to update affiliate link and enabled flag.
 */
export async function updateBankAffiliate(
  bankId: string,
  affiliateUrl: string,
  enabled: boolean
): Promise<{ success: boolean; bank?: Bank; error?: string }> {
  return updateBankAdmin(bankId, {
    affiliateUrl,
    affiliateEnabled: enabled,
  });
}

/**
 * Admin: Delete a bank.
 */
export async function deleteBankAdmin(
  bankId: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('banks').delete().eq('id', bankId);
      if (!error) {
        const local = getLocalBanks();
        saveLocalBanks(local.filter((b) => b.id !== bankId));
        return { success: true };
      }
    } catch (e: any) {
      console.warn('Supabase bank delete failed, falling back locally:', e);
    }
  }

  const local = getLocalBanks();
  saveLocalBanks(local.filter((b) => b.id !== bankId));
  return { success: true };
}

/**
 * Outbound Link Resolution
 * If affiliate is enabled and URL is present -> use affiliateUrl.
 * Otherwise -> fallback to websiteUrl.
 */
export function resolveBankOutboundUrl(bank: Bank): { url: string; isAffiliate: boolean } {
  if (bank.affiliateEnabled && bank.affiliateUrl && bank.affiliateUrl.trim().length > 0) {
    return { url: bank.affiliateUrl.trim(), isAffiliate: true };
  }
  return { url: bank.websiteUrl.trim(), isAffiliate: false };
}

/**
 * Track Bank Outbound Clicks
 */
export async function recordBankClick(bankId: string, bankName: string, destinationUrl: string, isAffiliate: boolean): Promise<void> {
  const click = {
    id: `bank_click_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    bankId,
    bankName,
    destinationUrl,
    isAffiliate,
    clickedAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem(BANK_CLICKS_STORAGE_KEY) || '[]');
      existing.unshift(click);
      localStorage.setItem(BANK_CLICKS_STORAGE_KEY, JSON.stringify(existing.slice(0, 500)));
    }
  } catch (e) {
    console.warn('Failed to record bank click locally:', e);
  }
}
