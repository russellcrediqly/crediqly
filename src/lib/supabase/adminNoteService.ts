import { supabase, isSupabaseConfigured } from './client';
import { AdminCustomerNote } from '@/types/admin';
import { logAdminAction } from './adminAuditService';

const LOCAL_STORAGE_PREFIX = 'crediqly_admin_notes_';
const inMemoryNotes = new Map<string, AdminCustomerNote[]>();

function getLocalNotes(userId: string): AdminCustomerNote[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse local admin notes:', e);
    }
  }
  return inMemoryNotes.get(userId) || [];
}

function saveLocalNotes(userId: string, notes: AdminCustomerNote[]): void {
  inMemoryNotes.set(userId, notes);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to save local admin notes:', e);
    }
  }
}

/**
 * Fetch all internal admin notes for a customer.
 * Strictly protected: regular customer accounts cannot call or access these notes.
 */
export async function getAdminCustomerNotes(userId: string): Promise<AdminCustomerNote[]> {
  if (!userId) return [];

  const localNotes = getLocalNotes(userId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_customer_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbNotes: AdminCustomerNote[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          adminEmail: row.admin_email,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        // Merge DB with local
        const idSet = new Set(dbNotes.map((n) => n.id));
        const merged = [...dbNotes];
        for (const local of localNotes) {
          if (!idSet.has(local.id)) {
            merged.push(local);
          }
        }
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        saveLocalNotes(userId, merged);
        return merged;
      }
    } catch (err) {
      // Table may not exist yet in SQL Editor; fallback to local
    }
  }

  return localNotes;
}

/**
 * Add a new internal administrative note for a customer.
 */
export async function addAdminCustomerNote(params: {
  userId: string;
  adminEmail: string;
  content: string;
}): Promise<AdminCustomerNote> {
  const { userId, adminEmail, content } = params;
  const now = new Date().toISOString();
  const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newNote: AdminCustomerNote = {
    id: noteId,
    userId,
    adminEmail,
    content: content.trim(),
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save to local storage
  const currentNotes = getLocalNotes(userId);
  const updated = [newNote, ...currentNotes];
  saveLocalNotes(userId, updated);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('admin_customer_notes').insert([
        {
          id: noteId,
          user_id: userId,
          admin_email: adminEmail,
          content: content.trim(),
          created_at: now,
          updated_at: now,
        },
      ]);
    } catch (err) {
      console.warn('Failed to insert note to DB, saved locally:', err);
    }
  }

  // 3. Log audit action
  await logAdminAction({
    adminEmail,
    action: 'ADD_INTERNAL_NOTE',
    entityType: 'customer',
    entityId: userId,
    description: `Added internal administrative note (${content.trim().slice(0, 40)}...)`,
    newValue: { noteId, preview: content.trim().slice(0, 80) },
  });

  return newNote;
}

/**
 * Delete an internal administrative note.
 */
export async function deleteAdminCustomerNote(params: {
  noteId: string;
  userId: string;
  adminEmail: string;
}): Promise<boolean> {
  const { noteId, userId, adminEmail } = params;

  // 1. Remove from local storage
  const current = getLocalNotes(userId);
  const updated = current.filter((n) => n.id !== noteId);
  saveLocalNotes(userId, updated);

  // 2. Remove from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('admin_customer_notes').delete().eq('id', noteId);
    } catch (err) {
      console.warn('Failed to delete note from DB:', err);
    }
  }

  // 3. Log audit action
  await logAdminAction({
    adminEmail,
    action: 'DELETE_INTERNAL_NOTE',
    entityType: 'customer',
    entityId: userId,
    description: `Deleted internal administrative note (${noteId})`,
  });

  return true;
}
