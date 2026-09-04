import { supabase, isSupabaseConfigured } from './client';
import { ContentPage, ContentCategory, ContentStatus } from '@/types/content';
import { INITIAL_CONTENT_PAGES } from '@/lib/content/initialContent';

const CONTENT_STORAGE_KEY = 'crediqly_admin_content';

function getLocalContent(): ContentPage[] {
  if (typeof window === 'undefined') return INITIAL_CONTENT_PAGES;
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local content:', e);
  }
  return INITIAL_CONTENT_PAGES;
}

function saveLocalContent(content: ContentPage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
  } catch (e) {
    console.warn('Failed to save local content:', e);
  }
}

function fromDbRow(row: any): ContentPage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    content: row.content,
    category: row.category as ContentCategory,
    status: row.status as ContentStatus,
    featured: Boolean(row.featured),
    readingTime: row.reading_time || '5 min read',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRow(p: Partial<ContentPage>): Record<string, any> {
  const row: Record<string, any> = {};
  if (p.slug !== undefined) row.slug = p.slug;
  if (p.title !== undefined) row.title = p.title;
  if (p.shortDescription !== undefined) row.short_description = p.shortDescription;
  if (p.content !== undefined) row.content = p.content;
  if (p.category !== undefined) row.category = p.category;
  if (p.status !== undefined) row.status = p.status;
  if (p.featured !== undefined) row.featured = p.featured;
  if (p.readingTime !== undefined) row.reading_time = p.readingTime;
  row.updated_at = new Date().toISOString();
  return row;
}

/**
 * Customer Facing: Fetch published content pages.
 * Filterable by category.
 */
export async function getContentPages(category?: string): Promise<ContentPage[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('content_pages')
        .select('*')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(fromDbRow);
      }
    } catch (e) {
      console.warn('Supabase content query failed, using local seed content:', e);
    }
  }

  // Local fallback
  const local = getLocalContent();
  let published = local.filter((p) => p.status === 'published');
  if (category && category !== 'all') {
    published = published.filter((p) => p.category === category);
  }
  return published.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

/**
 * Customer Facing: Fetch a single published guide by slug.
 */
export async function getContentPageBySlug(slug: string): Promise<ContentPage | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('content_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return fromDbRow(data);
      }
    } catch (e) {
      console.warn('Supabase content by slug failed, checking local content:', e);
    }
  }

  const local = getLocalContent();
  const found = local.find((p) => p.slug === slug);
  return found || null;
}

/**
 * Admin Facing: Fetch all content (draft, published, archived).
 */
export async function getAllContentAdmin(): Promise<ContentPage[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('content_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map(fromDbRow);
        saveLocalContent(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase admin content query failed, checking local content:', e);
    }
  }

  return getLocalContent();
}

/**
 * Admin Facing: Create a new educational guide.
 */
export async function createContentAdmin(
  guideData: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; contentPage?: ContentPage; error?: string }> {
  const newGuide: ContentPage = {
    ...guideData,
    id: `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const row = toDbRow(newGuide);
      row.created_at = newGuide.createdAt;
      const { data, error } = await supabase
        .from('content_pages')
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        const created = fromDbRow(data);
        const local = getLocalContent();
        saveLocalContent([created, ...local.filter((p) => p.id !== created.id)]);
        return { success: true, contentPage: created };
      }
    } catch (e: any) {
      console.warn('Supabase content insert failed, saving locally:', e);
    }
  }

  const local = getLocalContent();
  saveLocalContent([newGuide, ...local]);
  return { success: true, contentPage: newGuide };
}

/**
 * Admin Facing: Update an existing guide.
 */
export async function updateContentAdmin(
  id: string,
  updates: Partial<ContentPage>
): Promise<{ success: boolean; contentPage?: ContentPage; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const row = toDbRow(updates);
      const { data, error } = await supabase
        .from('content_pages')
        .update(row)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const updated = fromDbRow(data);
        const local = getLocalContent();
        saveLocalContent(local.map((p) => (p.id === id ? updated : p)));
        return { success: true, contentPage: updated };
      }
    } catch (e: any) {
      console.warn('Supabase content update failed, updating locally:', e);
    }
  }

  const local = getLocalContent();
  let updatedPage: ContentPage | undefined;
  const updatedList = local.map((p) => {
    if (p.id === id) {
      updatedPage = {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedPage;
    }
    return p;
  });

  saveLocalContent(updatedList);
  return { success: true, contentPage: updatedPage };
}

/**
 * Admin Facing: Delete an article.
 */
export async function deleteContentAdmin(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('content_pages').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase content delete exception:', e);
    }
  }

  const local = getLocalContent();
  saveLocalContent(local.filter((p) => p.id !== id));
  return { success: true };
}

/**
 * Admin Facing: Quick helper to toggle publish / draft / archive status.
 */
export async function togglePublishStatus(
  id: string,
  newStatus: ContentStatus
): Promise<{ success: boolean; error?: string }> {
  return updateContentAdmin(id, { status: newStatus });
}
