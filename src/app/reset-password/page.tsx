'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';
import { isAuthorizedAdminEmail } from '@/types/user';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  // 1. Detect recovery session from URL hash, PKCE code, or active Supabase session
  useEffect(() => {
    let isMounted = true;

    async function initRecoverySession() {
      if (!isSupabaseConfigured || !supabase) {
        setAuthError(
          'Supabase authentication service is not configured. Please verify your environment configuration.'
        );
        return;
      }

      try {
        // A. Check URL parameters for PKCE code (?code=...)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.warn('PKCE code exchange error:', error.message);
              setAuthError(
                'The password recovery link has expired or has already been used. Please request a new link.'
              );
              return;
            }
            if (data?.session?.user && isMounted) {
              const email = data.session.user.email || '';
              setTargetEmail(email);
              setIsAdminUser(isAuthorizedAdminEmail(email));
              setSessionReady(true);
              return;
            }
          }

          // B. Check URL hash for access_token (#access_token=...&type=recovery)
          const hash = window.location.hash;
          if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });

              if (error) {
                console.warn('Hash session set error:', error.message);
                setAuthError(
                  'The password recovery link is invalid or expired. Please request a new link.'
                );
                return;
              }

              if (data?.session?.user && isMounted) {
                const email = data.session.user.email || '';
                setTargetEmail(email);
                setIsAdminUser(isAuthorizedAdminEmail(email));
                setSessionReady(true);
                return;
              }
            }
          }
        }

        // C. Check existing active session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && isMounted) {
          const email = sessionData.session.user.email || '';
          setTargetEmail(email);
          setIsAdminUser(isAuthorizedAdminEmail(email));
          setSessionReady(true);
          return;
        }

        // D. Listen for PASSWORD_RECOVERY auth state event
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session?.user && isMounted) {
              const email = session.user.email || '';
              setTargetEmail(email);
              setIsAdminUser(isAuthorizedAdminEmail(email));
              setSessionReady(true);
              setAuthError(null);
            }
          }
        );

        // Fallback: If no session found after 3 seconds, inform the user
        setTimeout(() => {
          if (isMounted && !sessionReady && !targetEmail) {
            // Check one more time before showing error
            if (supabase) {
              supabase.auth.getSession().then(({ data }) => {
                if (data?.session?.user) {
                  const email = data.session.user.email || '';
                  setTargetEmail(email);
                  setIsAdminUser(isAuthorizedAdminEmail(email));
                  setSessionReady(true);
                } else {
                  setAuthError(
                    'No active password recovery session detected. Please open the link directly from your recovery email or request a new reset link.'
                  );
                }
              });
            } else {
              setAuthError('Authentication client is not available.');
            }
          }
        }, 3000);

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (err: any) {
        if (isMounted) {
          setAuthError(err?.message || 'Failed to initialize password recovery session.');
        }
      }
    }

    initRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Validation helpers
  const isLengthValid = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = isLengthValid && hasLetter && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!isFormValid) {
      if (!isLengthValid) {
        setAuthError('Password must be at least 8 characters long.');
      } else if (!hasLetter || !hasNumber) {
        setAuthError('Password must contain both letters and numbers.');
      } else if (!passwordsMatch) {
        setAuthError('Passwords do not match. Please re-enter.');
      }
      return;
    }

    if (!supabase) {
      setAuthError('Authentication service unavailable.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Update the password in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setAuthError(error.message);
        setSubmitting(false);
        return;
      }

      const updatedEmail = data?.user?.email || targetEmail;
      const isAdmin = isAuthorizedAdminEmail(updatedEmail);
      setIsAdminUser(isAdmin);

      // 2. If administrator, acquire signed admin session token
      if (isAdmin) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          const tokenRes = await fetch('/api/admin/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-email': updatedEmail,
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({ email: updatedEmail }),
          });

          if (tokenRes.ok) {
            const tokenJson = await tokenRes.json();
            if (tokenJson.token) {
              document.cookie = `crediqly_admin_token=${tokenJson.token}; path=/; max-age=86400; SameSite=Lax`;
            }
          }
        } catch (e) {
          console.warn('Admin token setup after password reset:', e);
        }
      }

      setSuccess(true);
      setSubmitting(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to update password. Please try again.');
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (isAdminUser) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 justify-center">
          <CrediqlyLogo size="lg" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Create New Password
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {targetEmail
            ? `Setting new password for ${targetEmail}`
            : 'Enter and confirm your new secure password'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-md">
          <CardContent className="p-6 sm:p-8">
            {success ? (
              <div className="text-center space-y-5 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Password Updated Successfully</h3>
                  <p className="text-sm text-slate-600 mt-1.5">
                    Your new password has been saved. Your authentication session is active.
                  </p>
                  {isAdminUser && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Administrator Access Confirmed</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleContinue}
                  >
                    <span>{isAdminUser ? 'Open Admin Console' : 'Go to Client Dashboard'}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                  <Link href="/signin">
                    <Button variant="ghost" size="sm" className="w-full text-slate-500 text-xs">
                      Return to Sign In Page
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {authError && (
                  <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-1.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                    {authError.includes('expired') || authError.includes('No active') ? (
                      <div className="pt-1">
                        <Link
                          href="/forgot-password"
                          className="font-bold underline text-rose-800 hover:text-rose-900"
                        >
                          Request a new recovery email &rarr;
                        </Link>
                      </div>
                    ) : null}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div>
                    <Input
                      label="Confirm New Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Password requirements checklist */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-700 mb-1">Password Requirements:</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isLengthValid
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        ✓
                      </span>
                      <span className={isLengthValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          hasLetter && hasNumber
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        ✓
                      </span>
                      <span className={hasLetter && hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        Contains letters and numbers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          passwordsMatch
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        ✓
                      </span>
                      <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        Passwords match
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={submitting}
                    disabled={!isFormValid || submitting}
                  >
                    Save New Password
                  </Button>

                  <div className="pt-2 text-center">
                    <Link
                      href="/signin"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Return to Sign In
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
