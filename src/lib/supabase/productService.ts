import { supabase, isSupabaseConfigured } from './client';
import { Product, ProductCategory, ProductStatus } from '@/types/product';
import { DEFAULT_PRODUCTS } from '@/lib/products/catalog';

const STORAGE_KEY = 'crediqly_admin_products';
const CLICKS_STORAGE_KEY = 'crediqly_affiliate_clicks';

function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local products:', e);
  }
  return DEFAULT_PRODUCTS;
}

function saveLocalProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('Failed to save local products:', e);
  }
}

function fromDbRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category as ProductCategory,
    description: row.description,
    shortDescription: row.short_description,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    affiliateUrl: row.affiliate_url,
    affiliateEnabled: Boolean(row.affiliate_enabled),
    reportingBureaus: Array.isArray(row.reporting_bureaus) ? row.reporting_bureaus : [],
    productType: row.product_type,
    minimumPurchase: row.minimum_purchase,
    subscriptionRequired: Boolean(row.subscription_required),
    typicalBusinessAge: row.typical_business_age,
    einRequired: row.ein_required !== false,
    businessBankAccountRequired: Boolean(row.business_bank_account_required),
    businessWebsiteRequired: Boolean(row.business_website_required),
    personalGuaranteeRequired: row.personal_guarantee_required || 'check_provider',
    personalCreditRequirement: row.personal_credit_requirement,
    recommendedStage: row.recommended_stage || 'building',
    priority: typeof row.priority === 'number' ? row.priority : (row.featured ? 1 : 2),
    status: row.status as ProductStatus,
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRow(p: Partial<Product>): Record<string, any> {
  const row: Record<string, any> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.slug !== undefined) row.slug = p.slug;
  if (p.category !== undefined) row.category = p.category;
  if (p.description !== undefined) row.description = p.description;
  if (p.shortDescription !== undefined) row.short_description = p.shortDescription;
  if (p.logoUrl !== undefined) row.logo_url = p.logoUrl;
  if (p.websiteUrl !== undefined) row.website_url = p.websiteUrl;
  if (p.affiliateUrl !== undefined) row.affiliate_url = p.affiliateUrl;
  if (p.affiliateEnabled !== undefined) row.affiliate_enabled = p.affiliateEnabled;
  if (p.reportingBureaus !== undefined) row.reporting_bureaus = p.reportingBureaus;
  if (p.productType !== undefined) row.product_type = p.productType;
  if (p.minimumPurchase !== undefined) row.minimum_purchase = p.minimumPurchase;
  if (p.subscriptionRequired !== undefined) row.subscription_required = p.subscriptionRequired;
  if (p.typicalBusinessAge !== undefined) row.typical_business_age = p.typicalBusinessAge;
  if (p.einRequired !== undefined) row.ein_required = p.einRequired;
  if (p.businessBankAccountRequired !== undefined) row.business_bank_account_required = p.businessBankAccountRequired;
  if (p.businessWebsiteRequired !== undefined) row.business_website_required = p.businessWebsiteRequired;
  if (p.personalGuaranteeRequired !== undefined) row.personal_guarantee_required = p.personalGuaranteeRequired;
  if (p.personalCreditRequirement !== undefined) row.personal_credit_requirement = p.personalCreditRequirement;
  if (p.recommendedStage !== undefined) row.recommended_stage = p.recommendedStage;
  if (p.priority !== undefined) row.priority = p.priority;
  if (p.status !== undefined) row.status = p.status;
  if (p.featured !== undefined) row.featured = p.featured;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Fetch all active products for customer facing pages.
 * Strictly excludes inactive and pending products.
 */
export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(fromDbRow);
      }
    } catch (err) {
      console.warn('Supabase products query failed, using local/built-in catalog:', err);
    }
  }

  // Fallback to local storage (only active products)
  const local = getLocalProducts();
  return local.filter((p) => p.status === 'active');
}

/**
 * Fetch all products for Admin management (includes active, inactive, pending).
 */
export async function getAllProductsAdmin(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map(fromDbRow);
        saveLocalProducts(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase admin products query failed, checking local catalog:', err);
    }
  }

  return getLocalProducts();
}

/**
 * Fetch a single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return fromDbRow(data);
      }
    } catch (err) {
      console.warn('Supabase product by slug failed, checking catalog:', err);
    }
  }

  const local = getLocalProducts();
  const found = local.find((p) => p.slug === slug);
  return found || null;
}

/**
 * Admin: Create a new product.
 */
export async function createProductAdmin(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const row = toDbRow(newProduct);
      row.created_at = newProduct.createdAt;
      const { data, error } = await supabase
        .from('products')
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        const created = fromDbRow(data);
        const local = getLocalProducts();
        saveLocalProducts([created, ...local.filter((p) => p.id !== created.id)]);
        return { success: true, product: created };
      }
    } catch (e: any) {
      console.warn('Supabase product create failed, falling back locally:', e);
    }
  }

  // Local fallback
  const local = getLocalProducts();
  const updated = [newProduct, ...local];
  saveLocalProducts(updated);
  return { success: true, product: newProduct };
}

/**
 * Admin: Update existing product.
 */
export async function updateProductAdmin(
  productId: string,
  updates: Partial<Product>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const row = toDbRow(updates);
      const { data, error } = await supabase
        .from('products')
        .update(row)
        .eq('id', productId)
        .select()
        .single();

      if (!error && data) {
        const updated = fromDbRow(data);
        const local = getLocalProducts();
        saveLocalProducts(local.map((p) => (p.id === productId ? updated : p)));
        return { success: true, product: updated };
      }
    } catch (e: any) {
      console.warn('Supabase product update failed, updating locally:', e);
    }
  }

  // Local fallback
  const local = getLocalProducts();
  let updatedProduct: Product | undefined;
  const updatedList = local.map((p) => {
    if (p.id === productId) {
      updatedProduct = {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedProduct;
    }
    return p;
  });

  saveLocalProducts(updatedList);
  return { success: true, product: updatedProduct };
}

/**
 * Admin: Delete a product.
 */
export async function deleteProductAdmin(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (e) {
      console.warn('Supabase product delete exception:', e);
    }
  }

  const local = getLocalProducts();
  saveLocalProducts(local.filter((p) => p.id !== productId));
  return { success: true };
}

/**
 * High Priority: Quick helper to update affiliate link and status.
 */
export async function updateProductAffiliate(
  productId: string,
  affiliateUrl: string,
  affiliateEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateProductAdmin(productId, {
    affiliateUrl,
    affiliateEnabled,
  });
}

/**
 * Record a lightweight, privacy-safe click on "Visit Provider".
 */
export async function trackProductClick(
  userId: string | undefined,
  productId: string
): Promise<void> {
  const timestamp = new Date().toISOString();

  // 1. Local click tracking
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CLICKS_STORAGE_KEY) || '[]';
      const parsed = JSON.parse(raw);
      parsed.push({ productId, userId: userId || 'anonymous', createdAt: timestamp });
      localStorage.setItem(CLICKS_STORAGE_KEY, JSON.stringify(parsed.slice(-200))); // Keep last 200 clicks
    } catch (e) {
      // ignore
    }
  }

  // 2. Supabase click tracking
  if (userId && isSupabaseConfigured && supabase) {
    try {
      await supabase.from('affiliate_clicks').insert({
        user_id: userId,
        product_id: productId,
        created_at: timestamp,
      });
    } catch (err) {
      console.warn('Affiliate click logging exception:', err);
    }
  }
}

/**
 * Admin: Get affiliate click statistics.
 */
export async function getAffiliateClicksStats(): Promise<{
  totalClicks: number;
  byProduct: { productId: string; productName: string; clicks: number; lastClicked?: string }[];
  recentClicks: { productId: string; productName: string; createdAt: string }[];
}> {
  let rawClicks: { product_id?: string; productId?: string; created_at?: string; createdAt?: string }[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('affiliate_clicks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        rawClicks = data;
      }
    } catch (e) {
      console.warn('Failed to query Supabase affiliate clicks, using local clicks:', e);
    }
  }

  // Merge with local clicks if table is empty
  if (rawClicks.length === 0 && typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(CLICKS_STORAGE_KEY);
      if (local) rawClicks = JSON.parse(local);
    } catch (e) {
      // ignore
    }
  }

  const allProducts = await getAllProductsAdmin();
  const productMap = new Map(allProducts.map((p) => [p.id, p.name]));

  // Calculate aggregation
  const productCounts = new Map<string, { count: number; lastClick?: string }>();
  for (const c of rawClicks) {
    const pId = c.product_id || c.productId;
    if (!pId) continue;
    const clickTime = c.created_at || c.createdAt;
    const current = productCounts.get(pId) || { count: 0 };
    current.count += 1;
    if (!current.lastClick || (clickTime && clickTime > current.lastClick)) {
      current.lastClick = clickTime;
    }
    productCounts.set(pId, current);
  }

  const byProduct = Array.from(productCounts.entries())
    .map(([productId, info]) => ({
      productId,
      productName: productMap.get(productId) || `Product (${productId.slice(0, 8)})`,
      clicks: info.count,
      lastClicked: info.lastClick,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const recentClicks = rawClicks.slice(0, 10).map((c) => {
    const pId = c.product_id || c.productId || '';
    return {
      productId: pId,
      productName: productMap.get(pId) || 'Credit Product',
      createdAt: c.created_at || c.createdAt || new Date().toISOString(),
    };
  });

  return {
    totalClicks: rawClicks.length,
    byProduct,
    recentClicks,
  };
}
