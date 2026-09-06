import { supabase, isSupabaseConfigured } from './client';
import { UserProfile, UpdateProfileInput } from '@/types/user';

const LOCAL_STORAGE_PROFILE_PREFIX = 'crediqly_user_profile_';
const LOCAL_STORAGE_SAVED_PREFIX = 'crediqly_saved_profile_';

/**
 * Fetch a customer's profile from Supabase with safe offline fallback
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || data.email?.split('@')[0] || 'User';

        return {
          id: data.id,
          userId: data.user_id,
          firstName,
          lastName,
          name: fullName,
          email: data.email || '',
          role: data.role || 'user',
          status: data.status || 'active',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('Failed to load user profile from Supabase:', err);
    }
  }

  // Local storage fallback for offline / mock sessions
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_PREFIX}${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Update the authenticated customer's own owner information (First Name & Last Name)
 * Strictly enforces that the caller can only update their own profile row.
 */
export async function updateCustomerProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  if (!userId) {
    return { success: false, error: 'Authentication required. Please sign in.' };
  }

  const firstName = (input.firstName || '').trim();
  const lastName = (input.lastName || '').trim();

  // 1. Basic validation
  if (!firstName) {
    return { success: false, error: 'First name is required.' };
  }
  if (firstName.length > 50) {
    return { success: false, error: 'First name must be 50 characters or less.' };
  }
  if (!lastName) {
    return { success: false, error: 'Last name is required.' };
  }
  if (lastName.length > 50) {
    return { success: false, error: 'Last name must be 50 characters or less.' };
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const now = new Date().toISOString();

  // 2. Supabase Live Mode
  if (isSupabaseConfigured && supabase) {
    try {
      // Security Check: Verify that the currently authenticated user matches the userId being updated
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return { success: false, error: 'Your session has expired. Please sign in again.' };
      }

      if (authUser.id !== userId) {
        return {
          success: false,
          error: 'Unauthorized: You are only permitted to update your own profile.',
        };
      }

      // Update the public.profiles record
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: now,
        })
        .eq('user_id', userId);

      if (dbError) {
        console.error('Supabase update profiles error:', dbError);
        return {
          success: false,
          error: dbError.message || 'Unable to save changes. Please try again.',
        };
      }

      // Sync user_metadata in Supabase Auth so session tokens reflect updated name
      try {
        await supabase.auth.updateUser({
          data: {
            name: fullName,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
          },
        });
      } catch (metaErr) {
        console.warn('Could not sync user auth metadata:', metaErr);
      }
    } catch (err: any) {
      console.error('Unexpected error updating customer profile:', err);
      return {
        success: false,
        error: err.message || 'Unable to save changes. Please try again.',
      };
    }
  }

  // 3. Persistent Local Cache Update (ensures persistence across refresh, browser restart, and mock auth)
  let updatedProfile: UserProfile = {
    userId,
    firstName,
    lastName,
    name: fullName,
    email: '',
    updatedAt: now,
  };

  if (typeof window !== 'undefined') {
    try {
      const userKey = `${LOCAL_STORAGE_PROFILE_PREFIX}${userId}`;
      const existingRaw = localStorage.getItem(userKey);
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        updatedProfile = {
          ...existing,
          firstName,
          lastName,
          name: fullName,
          updatedAt: now,
        };
      }
      localStorage.setItem(userKey, JSON.stringify(updatedProfile));

      // Also persist to email-based key if email is known
      if (updatedProfile.email) {
        localStorage.setItem(
          `${LOCAL_STORAGE_SAVED_PREFIX}${updatedProfile.email.toLowerCase()}`,
          JSON.stringify({ firstName, lastName, name: fullName })
        );
      }
    } catch (e) {
      console.warn('Could not cache user profile locally:', e);
    }
  }

  return { success: true, profile: updatedProfile };
}
