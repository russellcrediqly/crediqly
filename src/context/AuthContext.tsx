'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

import { UserRole, AccountStatus } from '@/types/user';
import { updateCustomerProfile } from '@/lib/supabase/profileService';

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
          if (localStorage.getItem('crediqly_dev_admin') === 'true') {
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

    // Dedicated Administrator Account (Step 8 / Section 21)
    if (email.toLowerCase() === 'crediqly@gmail.com') {
      role = 'admin';
    }

    // Local dev admin override helper
    if (typeof window !== 'undefined' && localStorage.getItem('crediqly_dev_admin') === 'true') {
      role = 'admin';
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
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
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
        return { error: error.message };
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
              .select('profile_completed')
              .eq('user_id', data.user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (bizData && bizData.profile_completed) {
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
                if (parsed.profileCompleted) {
                  isProfileComplete = true;
                }
              }
            } catch (e) {}
          }
        }

        const destination = fullUser.role === 'admin'
          ? '/admin'
          : '/dashboard';

        return {
          user: fullUser,
          profileCompleted: isProfileComplete,
          destination,
        };
      }
      return {};
    } else {
      // Local fallback mode
      const role: UserRole = email.toLowerCase() === 'crediqly@gmail.com'
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
            if (parsed.profileCompleted) isCompleted = true;
          }
        } catch (e) {}
      }

      const destination = mockUser.role === 'admin'
        ? '/admin'
        : '/dashboard';

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
    } catch (e) {}
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return { error: error.message };
      }
      return { message: 'Password reset instructions have been sent to your email.' };
    } else {
      return { message: 'Password reset simulated. Check your email inbox.' };
    }
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
