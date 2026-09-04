import { supabase, isSupabaseConfigured } from './client';
import type { FundingProduct, FundingProductStatus, FundingCategory } from '../../types/fundingProduct';
import { INITIAL_FUNDING_PRODUCTS } from '../funding/initialFundingProducts';

const STORAGE_KEY = 'crediqly_admin_funding_products';
const CLICKS_STORAGE_KEY = 'crediqly_funding_clicks';

function getLocalFundingProducts(): FundingProduct[] {
  if (typeof window === 'undefined') return INITIAL_FUNDING_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local funding products:', e);
  }
  return INITIAL_FUNDING_PRODUCTS;
}

function saveLocalFundingProducts(products: FundingProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('Failed to save local funding products:', e);
  }
}

function fromDbRow(row: any): FundingProduct {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    category: row.category as FundingCategory,
    description: row.description,
    websiteUrl: row.website_url,
    affiliateUrl: row.affiliate_url || '',
    affiliateEnabled: Boolean(row.affiliate_enabled),
    status: (row.status as FundingProductStatus) || 'active',
    featured: Boolean(row.featured),
    priority: typeof row.priority === 'number' ? row.priority : 2,
    minBusinessAgeMonths: typeof row.min_business_age_months === 'number' ? row.min_business_age_months : 0,
    minAnnualRevenue: row.min_annual_revenue || '$0',
    minPersonalCredit: row.min_personal_credit || 'None',
    businessCreditRequired: row.business_credit_required || 'not_specified',
    minFundingAmount: typeof row.min_funding_amount === 'number' ? row.min_funding_amount : Number(row.min_funding_amount) || 0,
    maxFundingAmount: typeof row.max_funding_amount === 'number' ? row.max_funding_amount : Number(row.max_funding_amount) || 0,
    fundingPurposes: Array.isArray(row.funding_purposes) ? row.funding_purposes : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRow(p: Partial<FundingProduct>): Record<string, any> {
  const row: Record<string, any> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.provider !== undefined) row.provider = p.provider;
  if (p.category !== undefined) row.category = p.category;
  if (p.description !== undefined) row.description = p.description;
  if (p.websiteUrl !== undefined) row.website_url = p.websiteUrl;
  if (p.affiliateUrl !== undefined) row.affiliate_url = p.affiliateUrl;
  if (p.affiliateEnabled !== undefined) row.affiliate_enabled = p.affiliateEnabled;
  if (p.status !== undefined) row.status = p.status;
  if (p.featured !== undefined) row.featured = p.featured;
  if (p.priority !== undefined) row.priority = p.priority;
  if (p.minBusinessAgeMonths !== undefined) row.min_business_age_months = p.minBusinessAgeMonths;
  if (p.minAnnualRevenue !== undefined) row.min_annual_revenue = p.minAnnualRevenue;
  if (p.minPersonalCredit !== undefined) row.min_personal_credit = p.minPersonalCredit;
  if (p.businessCreditRequired !== undefined) row.business_credit_required = p.businessCreditRequired;
  if (p.minFundingAmount !== undefined) row.min_funding_amount = p.minFundingAmount;
  if (p.maxFundingAmount !== undefined) row.max_funding_amount = p.maxFundingAmount;
  if (p.fundingPurposes !== undefined) row.funding_purposes = p.fundingPurposes;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Fetch all active funding products for customer views.
 * Strictly excludes inactive options.
 */
export async function getFundingProducts(): Promise<FundingProduct[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_products')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(fromDbRow);
      }
    } catch (err) {
      console.warn('Supabase funding_products query failed, using local fallback:', err);
    }
  }

  // Local fallback (strictly active)
  const local = getLocalFundingProducts();
  return local
    .filter((p) => p.status === 'active')
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Fetch all funding products for admin console (active and inactive).
 */
export async function getAllFundingProductsAdmin(): Promise<FundingProduct[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_products')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(fromDbRow);
      }
    } catch (err) {
      console.warn('Supabase funding_products query failed for admin, using local fallback:', err);
    }
  }

  return getLocalFundingProducts();
}

/**
 * Create a new funding product (Admin)
 */
export async function createFundingProduct(
  product: Omit<FundingProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FundingProduct> {
  const newProduct: FundingProduct = {
    ...product,
    id: `fund_prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_products')
        .insert([toDbRow(newProduct)])
        .select()
        .single();

      if (!error && data) {
        const created = fromDbRow(data);
        const current = getLocalFundingProducts();
        saveLocalFundingProducts([created, ...current]);
        return created;
      }
    } catch (err) {
      console.warn('Supabase create funding product failed, persisting locally:', err);
    }
  }

  const current = getLocalFundingProducts();
  const updated = [newProduct, ...current];
  saveLocalFundingProducts(updated);
  return newProduct;
}

/**
 * Update an existing funding product (Admin)
 */
export async function updateFundingProduct(
  id: string,
  updates: Partial<FundingProduct>
): Promise<FundingProduct | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('funding_products')
        .update(toDbRow(updates))
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updatedItem = fromDbRow(data);
        const current = getLocalFundingProducts();
        const next = current.map((p) => (p.id === id ? updatedItem : p));
        saveLocalFundingProducts(next);
        return updatedItem;
      }
    } catch (err) {
      console.warn('Supabase update funding product failed, updating locally:', err);
    }
  }

  const current = getLocalFundingProducts();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const merged: FundingProduct = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[index] = merged;
  saveLocalFundingProducts([...current]);
  return merged;
}

/**
 * Delete a funding product (Admin)
 */
export async function deleteFundingProduct(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('funding_products').delete().eq('id', id);
      if (!error) {
        const current = getLocalFundingProducts();
        saveLocalFundingProducts(current.filter((p) => p.id !== id));
        return true;
      }
    } catch (err) {
      console.warn('Supabase delete funding product failed, deleting locally:', err);
    }
  }

  const current = getLocalFundingProducts();
  saveLocalFundingProducts(current.filter((p) => p.id !== id));
  return true;
}

/**
 * Toggle funding product status between active and inactive (Admin)
 */
export async function toggleFundingProductStatus(
  id: string,
  newStatus: FundingProductStatus
): Promise<FundingProduct | null> {
  return updateFundingProduct(id, { status: newStatus });
}

/**
 * Dynamically resolves the outbound destination URL for a funding option.
 * If affiliate is enabled and an affiliate URL is configured, customer routes to affiliateUrl.
 * Otherwise falls back to direct provider websiteUrl.
 */
export function resolveFundingProductOutboundUrl(product: FundingProduct): string {
  if (product.affiliateEnabled && product.affiliateUrl && product.affiliateUrl.trim().length > 0) {
    return product.affiliateUrl.trim();
  }
  return product.websiteUrl.trim();
}

/**
 * Log outbound customer clicks for audit and affiliate attribution.
 */
export async function recordFundingProductClick(
  productId: string,
  userId?: string | null
): Promise<void> {
  const clickRecord = {
    id: `fclick_${Date.now()}`,
    productId,
    userId: userId || null,
    timestamp: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('affiliate_clicks').insert([
        {
          product_id: productId,
          user_id: userId || null,
          metadata: { type: 'funding_product' },
        },
      ]);
    } catch (err) {
      console.warn('Click logging to Supabase failed, saving locally:', err);
    }
  }

  // Local fallback log
  try {
    const raw = localStorage.getItem(CLICKS_STORAGE_KEY);
    const clicks = raw ? JSON.parse(raw) : [];
    clicks.push(clickRecord);
    if (clicks.length > 50) clicks.shift();
    localStorage.setItem(CLICKS_STORAGE_KEY, JSON.stringify(clicks));
  } catch (e) {
    // Non-blocking
  }
}
