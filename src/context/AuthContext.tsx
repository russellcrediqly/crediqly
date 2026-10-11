'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

import { UserRole, AccountStatus, isAuthorizedAdminEmail } from '@/types/user';
import { updateCustomerProfile } from '@/lib/supabase/profileService';
import { isProfileInformationComplete } from '@/types/business';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: AccountStatus;
}

export interface SignInResult {
  error?: string;
  user?: AuthUser;
  profileCompleted?: boolean;
  destination?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, name: string) => Promise<SignInResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile?: (data: { firstName: string; lastName: string }) => Promise<{ success: boolean; error?: string }>;
  refreshUser?: () => Promise<void>;
  toggleDevAdmin?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'crediqly_local_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (process.env.NODE_ENV !== 'production' && localStorage.getItem('crediqly_dev_admin') === 'true') {
            parsed.role = 'admin';
          }
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async (userId: string, email: string, defaultName: string): Promise<AuthUser> => {
    let role: UserRole = 'user';
    let status: AccountStatus = 'active';
    let name = defaultName;
    let firstName = '';
    let lastName = '';

    if (defaultName) {
      const parts = defaultName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const fetchPromise = supabase
          .from('profiles')
          .select('role, status, first_name, last_name')
          .eq('user_id', userId)
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: null }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 2000)
        );

        const { data } = await Promise.race([fetchPromise, timeoutPromise]);

        if (data) {
          if (data.role) role = data.role as UserRole;
          if (data.status) status = data.status as AccountStatus;
          if (data.first_name) {
            firstName = data.first_name;
            lastName = data.last_name || '';
            name = `${firstName} ${lastName}`.trim() || defaultName;
          }
        }
      } catch (err) {
        console.warn('Could not fetch user profile role:', err);
      }
    }

    // Local profile cache fallback
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`crediqly_user_profile_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.firstName) firstName = parsed.firstName;
          if (parsed.lastName) lastName = parsed.lastName;
          if (parsed.name) name = parsed.name;
        }
      } catch (e) {}
    }

    // Dedicated Administrator Accounts (crediqly@gmail.com, raselandahmed@gmail.com, etc.)
    if (isAuthorizedAdminEmail(email)) {
      role = 'admin';
      if (typeof window !== 'undefined') {
        try {
          document.cookie = `crediqly_admin_email=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Lax`;
        } catch (e) {}
      }
    }

    // Local dev admin override helper (strictly development / non-production only)
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && localStorage.getItem('crediqly_dev_admin') === 'true') {
      role = 'admin';
      try {
        document.cookie = 'crediqly_dev_admin=true; path=/; max-age=86400; SameSite=Lax';
      } catch (e) {}
    }

    return { id: userId, email, name, firstName, lastName, role, status };
  };

  useEffect(() => {
    // Safety fallback: Ensure auth loading resolves within 2.5s even if network is slow
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    if (isSupabaseConfigured && supabase) {
      // 1. Live Supabase Auth Session
      supabase.auth
        .getSession()
        .then(async ({ data: { session } }) => {
          if (session?.user) {
            const email = session.user.email || '';
            const defaultName = session.user.user_metadata?.name || email.split('@')[0] || 'User';
            const fullUser = await fetchProfileData(session.user.id, email, defaultName);
            setUser(fullUser);
            try {
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fullUser));
            } catch (e) {}
          } else {
            // Check local cached session
            try {
              const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
              if (cached) {
                const parsed = JSON.parse(cached);
                setUser(parsed);
              }
            } catch (err) {
              console.warn('Failed to load local user session', err);
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to retrieve Supabase session, using local cache:', err);
          try {
            const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
            if (cached) {
              setUser(JSON.parse(cached));
            }
          } catch (e) {}
        })
        .finally(() => {
          clearTimeout(safetyTimer);
          setLoading(false);
        });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const email = session.user.email || '';
          const defaultName = session.user.user_metadata?.name || email.split('@')[0] || 'User';
          const fullUser = await fetchProfileData(session.user.id, email, defaultName);
          setUser(fullUser);
          try {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fullUser));
          } catch (e) {}
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          try {
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          } catch (e) {}
        }
        setLoading(false);
      });

      return () => {
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
      };
    } else {
      // 2. Safe Local Storage Fallback Mode
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (typeof window !== 'undefined' && localStorage.getItem('crediqly_dev_admin') === 'true') {
            parsed.role = 'admin';
          }
          setUser(parsed);
        }
      } catch (err) {
        console.error('Failed to load local user session', err);
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  }, []);

  const toggleDevAdmin = () => {
    if (typeof window === 'undefined') return;
    const current = localStorage.getItem('crediqly_dev_admin') === 'true';
    const nextState = !current;
    localStorage.setItem('crediqly_dev_admin', nextState ? 'true' : 'false');
    try {
      document.cookie = `crediqly_dev_admin=${nextState ? 'true' : 'false'}; path=/; max-age=86400; SameSite=Lax`;
    } catch (e) {}
    if (user) {
      setUser({ ...user, role: nextState ? 'admin' : 'user' });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (isSupabaseConfigured && supabase) {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const emailVal = data.user.email || email;
        const fullUser: AuthUser = {
          id: data.user.id,
          email: emailVal,
          name: name || 'User',
          firstName,
          lastName,
          role: 'user',
          status: 'active',
        };
        setUser(fullUser);
        try {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fullUser));
          const rawReg = localStorage.getItem('crediqly_registered_users');
          const regList = rawReg ? JSON.parse(rawReg) : [];
          if (!regList.some((u: any) => u.id === fullUser.id || u.email === fullUser.email)) {
            regList.unshift(fullUser);
            localStorage.setItem('crediqly_registered_users', JSON.stringify(regList));
          }
        } catch (e) {}

        // Ensure profile row exists in public.profiles table
        try {
          await supabase.from('profiles').upsert({
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email: emailVal,
            role: 'user',
            status: 'active',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        } catch (profileErr) {
          console.warn('Profile sync handled by trigger or permission:', profileErr);
        }

        return {
          user: fullUser,
          profileCompleted: false,
          destination: '/onboarding',
        };
      }
      return { destination: '/onboarding' };
    } else {
      // Local fallback mode
      const nameParts = (name || email.split('@')[0]).trim().split(/\s+/);
      const mockUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        role: 'user',
        status: 'active',
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
        const rawReg = localStorage.getItem('crediqly_registered_users');
        const regList = rawReg ? JSON.parse(rawReg) : [];
        if (!regList.some((u: any) => u.id === mockUser.id || u.email === mockUser.email)) {
          regList.unshift(mockUser);
          localStorage.setItem('crediqly_registered_users', JSON.stringify(regList));
        }
      } catch (e) {}
      setUser(mockUser);
      return {
        user: mockUser,
        profileCompleted: false,
        destination: '/onboarding',
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message || '';
        if (
          msg.includes('fetch') ||
          msg.includes('network') ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError')
        ) {
          return {
            error:
              'Unable to reach authentication server. If your Supabase database project is paused due to inactivity, please visit https://supabase.com/dashboard/project/dfdvmegzwgogonefjihs and click "Resume project".',
          };
        }
        if (msg.toLowerCase().includes('invalid login credentials')) {
          return {
            error:
              'Invalid email or password. Please verify your credentials or use "Forgot password" to reset your password.',
          };
        }
        return { error: msg };
      }

      if (data.user) {
        const emailVal = data.user.email || email;
        const defaultName = data.user.user_metadata?.name || email.split('@')[0];
        const fullUser = await fetchProfileData(data.user.id, emailVal, defaultName);
        setUser(fullUser);
        try {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fullUser));
        } catch (e) {}

        // Check profile completion reliably
        let isProfileComplete = false;
        if (fullUser.role === 'admin') {
          isProfileComplete = true;
        } else {
          try {
            const { data: bizData } = await supabase
              .from('businesses')
              .select('profile_completed, business_name, entity_type, state')
              .eq('user_id', data.user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (bizData && (bizData.profile_completed || isProfileInformationComplete(bizData))) {
              isProfileComplete = true;
            }
          } catch (bizErr) {
            console.warn('Could not check business completion from database:', bizErr);
          }

          // Local storage fallback
          if (!isProfileComplete && typeof window !== 'undefined') {
            try {
              const localBiz = localStorage.getItem('crediqly_business_' + data.user.id);
              if (localBiz) {
                const parsed = JSON.parse(localBiz);
                if (isProfileInformationComplete(parsed)) {
                  isProfileComplete = true;
                }
              }
            } catch (e) {}
          }
        }

        const destination = fullUser.role === 'admin'
          ? '/admin'
          : (isProfileComplete ? '/dashboard' : '/onboarding');

        return {
          user: fullUser,
          profileCompleted: isProfileComplete,
          destination,
        };
      }
      return {};
    } else {
      // Local fallback mode
      const role: UserRole = isAuthorizedAdminEmail(email)
        ? 'admin'
        : (typeof window !== 'undefined' && localStorage.getItem('crediqly_dev_admin') === 'true' ? 'admin' : 'user');

      let displayName = email.split('@')[0];
      let firstName = '';
      let lastName = '';
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`crediqly_saved_profile_${email.toLowerCase()}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.firstName) firstName = parsed.firstName;
            if (parsed.lastName) lastName = parsed.lastName;
            if (parsed.name) displayName = parsed.name;
          }
        } catch (e) {}
      }
      if (!firstName && displayName) {
        const parts = displayName.trim().split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }

      const mockUser: AuthUser = {
        id: 'usr_demo_123',
        email,
        name: displayName,
        firstName,
        lastName,
        role,
        status: 'active',
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);

      let isCompleted = false;
      if (mockUser.role === 'admin') {
        isCompleted = true;
      } else if (typeof window !== 'undefined') {
        try {
          const localBiz = localStorage.getItem('crediqly_business_' + mockUser.id);
          if (localBiz) {
            const parsed = JSON.parse(localBiz);
            if (isProfileInformationComplete(parsed)) isCompleted = true;
          }
        } catch (e) {}
      }

      const destination = mockUser.role === 'admin'
        ? '/admin'
        : (isCompleted ? '/dashboard' : '/onboarding');

      return {
        user: mockUser,
        profileCompleted: isCompleted,
        destination,
      };
    }
  };

  const updateProfile = async (data: { firstName: string; lastName: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    const res = await updateCustomerProfile(user.id, data);
    if (!res.success) {
      return { success: false, error: res.error || 'Unable to save changes. Please try again.' };
    }

    const trimmedFirst = data.firstName.trim();
    const trimmedLast = data.lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    const updatedUser: AuthUser = {
      ...user,
      name: fullName,
      firstName: trimmedFirst,
      lastName: trimmedLast,
    };

    setUser(updatedUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
    } catch (e) {}

    return { success: true };
  };

  const refreshUser = async () => {
    if (!user) return;
    const refreshed = await fetchProfileData(user.id, user.email, user.name);
    setUser(refreshed);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(refreshed));
    } catch (e) {}
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      if (typeof window !== 'undefined') {
        document.cookie = 'crediqly_admin_email=; path=/; max-age=0';
        document.cookie = 'crediqly_dev_admin=; path=/; max-age=0';
      }
    } catch (e) {}
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const canonicalOrigin =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || 'https://crediqly.vercel.app');
      const redirectTo = `${canonicalOrigin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        const msg = error.message || '';
        if (
          msg.includes('fetch') ||
          msg.includes('network') ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError')
        ) {
          return {
            error:
              'Unable to reach authentication server. If your Supabase database project is paused due to inactivity, please unpause it at https://supabase.com/dashboard/project/dfdvmegzwgogonefjihs so recovery emails can be delivered.',
          };
        }
        return { error: msg };
      }
      return { message: 'Password reset instructions have been sent to your email.' };
    } else {
      return {
        error:
          'Password recovery is currently unavailable because the authentication service is not connected. Please verify your Supabase environment variables.',
      };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { success: false, error: 'Password must contain both letters and numbers.' };
    }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        changePassword,
        updateProfile,
        refreshUser,
        toggleDevAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
