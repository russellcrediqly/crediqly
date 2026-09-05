import { supabase, isSupabaseConfigured } from './client';

export type AffiliateCategory =
  | 'tradeline'
  | 'banking'
  | 'credit_repair'
  | 'funding'
  | 'monitoring'
  | 'legal'
  | 'general';

export type AffiliateDisplayLocation =
  | 'dashboard_banner'
  | 'products_directory'
  | 'funding_matches'
  | 'roadmap_tool'
  | 'sidebar';

export interface AffiliatePartner {
  id: string;
  name: string;
  description: string;
  affiliateUrl: string;
  trackingUrl?: string;
  logoUrl?: string;
  category: AffiliateCategory;
  displayLocation: AffiliateDisplayLocation;
  priority: number; // 1 = highest, 5 = lowest
  status: 'active' | 'inactive';
  featured: boolean;
  ctaText: string;
  notes?: string;
  clicksCount: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'crediqly_admin_affiliates';
const CLICKS_STORAGE_KEY = 'crediqly_affiliate_partner_clicks';

export const DEFAULT_AFFILIATES: AffiliatePartner[] = [
  {
    id: 'aff_nav_prime',
    name: 'Nav Prime Business Financial Health',
    description: 'Build business credit with D&B, Experian, and Equifax while monitoring personal & business scores in one unified portal.',
    affiliateUrl: 'https://nav.com/business-credit-builder?ref=crediqly',
    trackingUrl: 'https://crediqly.com/out/nav-prime',
    logoUrl: '/logos/nav.png',
    category: 'monitoring',
    displayLocation: 'dashboard_banner',
    priority: 1,
    status: 'active',
    featured: true,
    ctaText: 'Start Building Tradelines with Nav',
    notes: 'Reports monthly tradeline activity to all 3 commercial credit bureaus. Tier 1 partner.',
    clicksCount: 142,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'aff_grainger_net30',
    name: 'Grainger Industrial Supply Net-30',
    description: 'Foundational Tier 1 vendor tradeline offering 30-day invoice payment terms for commercial maintenance and tools.',
    affiliateUrl: 'https://grainger.com/credit?ref=crediqly',
    trackingUrl: 'https://crediqly.com/out/grainger-net30',
    logoUrl: '/logos/grainger.png',
    category: 'tradeline',
    displayLocation: 'products_directory',
    priority: 1,
    status: 'active',
    featured: true,
    ctaText: 'Apply for Net-30 Terms',
    notes: 'Requires EIN, verified business address, and initial invoice payment. Reports to D&B.',
    clicksCount: 98,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'aff_mercury_bank',
    name: 'Mercury Commercial Banking & Treasury',
    description: 'Modern business banking engineered for startups and growing enterprises with FDIC-insured deposits up to $5M.',
    affiliateUrl: 'https://mercury.com/partner/crediqly',
    trackingUrl: 'https://crediqly.com/out/mercury-bank',
    logoUrl: '/logos/mercury.png',
    category: 'banking',
    displayLocation: 'funding_matches',
    priority: 2,
    status: 'active',
    featured: false,
    ctaText: 'Open Commercial Checking',
    notes: 'No monthly fee, seamless wire transfers, high API compatibility with accounting platforms.',
    clicksCount: 64,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'aff_relay_financial',
    name: 'Relay Financial Multi-Account Banking',
    description: 'Organize cash-flow and Profit First allocations across up to 20 business checking accounts without minimum deposit fees.',
    affiliateUrl: 'https://relayfi.com/?utm_source=crediqly',
    trackingUrl: 'https://crediqly.com/out/relay-financial',
    logoUrl: '/logos/relay.png',
    category: 'banking',
    displayLocation: 'roadmap_tool',
    priority: 2,
    status: 'active',
    featured: false,
    ctaText: 'Explore Relay Accounts',
    notes: 'Strong support for multiple debit cards and automated expense allocation.',
    clicksCount: 39,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'aff_lendio_marketplace',
    name: 'Lendio Commercial Capital Marketplace',
    description: 'Connect with a nationwide network of 75+ commercial lenders for SBA 7(a), working capital lines, and equipment loans.',
    affiliateUrl: 'https://lendio.com/?partner=crediqly',
    trackingUrl: 'https://crediqly.com/out/lendio-marketplace',
    logoUrl: '/logos/lendio.png',
    category: 'funding',
    displayLocation: 'funding_matches',
    priority: 1,
    status: 'active',
    featured: true,
    ctaText: 'Check Capital Options',
    notes: 'Soft credit inquiry pre-qualification. Excellent for businesses with $10K+/mo revenue.',
    clicksCount: 118,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getLocalAffiliates(): AffiliatePartner[] {
  if (typeof window === 'undefined') return DEFAULT_AFFILIATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local affiliates:', e);
  }
  return DEFAULT_AFFILIATES;
}

function saveLocalAffiliates(affiliates: AffiliatePartner[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(affiliates));
  } catch (e) {
    console.warn('Failed to save local affiliates:', e);
  }
}

/**
 * Fetch all affiliates for Admin management
 */
export async function getAffiliatesAdmin(): Promise<AffiliatePartner[]> {
  const local = getLocalAffiliates();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('affiliate_partners')
        .select('*')
        .order('priority', { ascending: true });

      if (!error && data && data.length > 0) {
        const dbPartners: AffiliatePartner[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          affiliateUrl: row.affiliate_url,
          trackingUrl: row.tracking_url,
          logoUrl: row.logo_url,
          category: row.category as AffiliateCategory,
          displayLocation: row.display_location as AffiliateDisplayLocation,
          priority: row.priority,
          status: row.status as 'active' | 'inactive',
          featured: Boolean(row.featured),
          ctaText: row.cta_text,
          notes: row.notes,
          clicksCount: row.clicks_count || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        saveLocalAffiliates(dbPartners);
        return dbPartners;
      }
    } catch (err) {
      // Supabase query failed: use local cache
    }
  }

  return local;
}

/**
 * Fetch active affiliates for specific display locations in client UI
 */
export async function getActiveAffiliatesByLocation(
  location: AffiliateDisplayLocation
): Promise<AffiliatePartner[]> {
  const all = await getAffiliatesAdmin();
  return all.filter((a) => a.status === 'active' && a.displayLocation === location);
}

/**
 * Create a new affiliate partner
 */
export async function createAffiliateAdmin(
  affiliate: Omit<AffiliatePartner, 'id' | 'clicksCount' | 'createdAt' | 'updatedAt'>
): Promise<AffiliatePartner> {
  const id = `aff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newPartner: AffiliatePartner = {
    ...affiliate,
    id,
    clicksCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const current = getLocalAffiliates();
  const updated = [newPartner, ...current];
  saveLocalAffiliates(updated);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('affiliate_partners').insert([
        {
          id: newPartner.id,
          name: newPartner.name,
          description: newPartner.description,
          affiliate_url: newPartner.affiliateUrl,
          tracking_url: newPartner.trackingUrl,
          logo_url: newPartner.logoUrl,
          category: newPartner.category,
          display_location: newPartner.displayLocation,
          priority: newPartner.priority,
          status: newPartner.status,
          featured: newPartner.featured,
          cta_text: newPartner.ctaText,
          notes: newPartner.notes,
          clicks_count: 0,
          created_at: now,
          updated_at: now,
        },
      ]);
    } catch (err) {
      // Local fallback preserves continuity
    }
  }

  return newPartner;
}

/**
 * Update an existing affiliate partner
 */
export async function updateAffiliateAdmin(
  id: string,
  updates: Partial<AffiliatePartner>
): Promise<AffiliatePartner | null> {
  const current = getLocalAffiliates();
  const idx = current.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const updatedPartner: AffiliatePartner = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[idx] = updatedPartner;
  saveLocalAffiliates(current);

  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates: Record<string, any> = { updated_at: updatedPartner.updatedAt };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.affiliateUrl !== undefined) dbUpdates.affiliate_url = updates.affiliateUrl;
      if (updates.trackingUrl !== undefined) dbUpdates.tracking_url = updates.trackingUrl;
      if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.displayLocation !== undefined) dbUpdates.display_location = updates.displayLocation;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
      if (updates.ctaText !== undefined) dbUpdates.cta_text = updates.ctaText;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      await supabase.from('affiliate_partners').update(dbUpdates).eq('id', id);
    } catch (err) {
      // Local fallback
    }
  }

  return updatedPartner;
}

/**
 * Delete or deactivate an affiliate partner
 */
export async function deleteAffiliateAdmin(id: string): Promise<boolean> {
  const current = getLocalAffiliates();
  const filtered = current.filter((a) => a.id !== id);
  saveLocalAffiliates(filtered);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('affiliate_partners').delete().eq('id', id);
    } catch (err) {
      // Local fallback
    }
  }

  return true;
}

/**
 * Record a click on an affiliate partner link
 */
export async function recordAffiliatePartnerClick(partnerId: string): Promise<void> {
  const current = getLocalAffiliates();
  const partner = current.find((a) => a.id === partnerId);
  if (partner) {
    partner.clicksCount = (partner.clicksCount || 0) + 1;
    saveLocalAffiliates(current);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.rpc('increment_affiliate_partner_clicks', { p_id: partnerId });
    } catch (e) {
      // Fallback update
      try {
        if (partner) {
          await supabase
            .from('affiliate_partners')
            .update({ clicks_count: partner.clicksCount })
            .eq('id', partnerId);
        }
      } catch (err) {}
    }
  }
}
