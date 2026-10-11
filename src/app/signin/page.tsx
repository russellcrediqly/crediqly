'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ShieldCheck } from 'lucide-react';
import { CrediqlyLogo } from '@/components/common/CrediqlyLogo';
import { isProfileInformationComplete } from '@/types/business';

export default function SignInPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  const { business, loading: businessLoading } = useBusiness();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle direct access by already-authenticated visitors
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
        return;
      }
      // Direct authenticated visitor appropriately
      if (!businessLoading) {
        if (business && isProfileInformationComplete(business)) {
          router.replace('/dashboard');
        } else if (business && business.profileCompleted === false) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [user, authLoading, business, businessLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await signIn(email, password);

      if (res.error) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      // Existing customer login:
      // If profile is incomplete -> Continue onboarding at incomplete step
      // If completed or admin -> Direct to dashboard or admin
      const targetDestination =
        res.destination ||
        (res.user?.role === 'admin'
          ? '/admin'
          : (res.profileCompleted === false ? '/onboarding' : '/dashboard'));

      router.replace(targetDestination);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 justify-center">
          <CrediqlyLogo size="lg" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Or{' '}
          <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-md">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-1.5">
                  <div>{error}</div>
                  {error.includes('supabase.com') && (
                    <div className="pt-1">
                      <a
                        href="https://supabase.com/dashboard/project/dfdvmegzwgogonefjihs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline text-rose-800 hover:text-rose-900 inline-flex items-center gap-1"
                      >
                        Open Supabase Dashboard to Resume Project &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                autoComplete="email"
              />

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={submitting}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo & Account Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="text-center mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Sign-In Accounts
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setEmail('crediqly@gmail.com');
                    setPassword('CrediqlyPass2026!');
                    setSubmitting(true);
                    setError(null);
                    try {
                      const res = await signIn('crediqly@gmail.com', 'CrediqlyPass2026!');
                      if (res.error) {
                        setError(res.error);
                        setSubmitting(false);
                      } else {
                        router.replace(res.destination || '/admin');
                      }
                    } catch (e: any) {
                      setError(e?.message || 'Login failed');
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-brand-200 bg-brand-50/70 hover:bg-brand-100 text-left transition-colors text-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-brand-900">Admin Console</div>
                    <div className="text-[11px] text-brand-700 font-mono truncate max-w-[130px]">crediqly@gmail.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setEmail('sarah@beaconclean.com');
                    setPassword('CustomerPass2026!');
                    setSubmitting(true);
                    setError(null);
                    try {
                      const res = await signIn('sarah@beaconclean.com', 'CustomerPass2026!');
                      if (res.error) {
                        setError(res.error);
                        setSubmitting(false);
                      } else {
                        router.replace(res.destination || '/dashboard');
                      }
                    } catch (e: any) {
                      setError(e?.message || 'Login failed');
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-colors text-xs"
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0">F</div>
                  <div>
                    <div className="font-semibold text-emerald-900">Customer (Foundation)</div>
                    <div className="text-[11px] text-emerald-700 font-mono truncate max-w-[130px]">sarah@beaconclean.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setEmail('david@titanbuilds.com');
                    setPassword('CustomerPass2026!');
                    setSubmitting(true);
                    setError(null);
                    try {
                      const res = await signIn('david@titanbuilds.com', 'CustomerPass2026!');
                      if (res.error) {
                        setError(res.error);
                        setSubmitting(false);
                      } else {
                        router.replace(res.destination || '/dashboard');
                      }
                    } catch (e: any) {
                      setError(e?.message || 'Login failed');
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-left transition-colors text-xs"
                >
                  <div className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-[9px] shrink-0">G</div>
                  <div>
                    <div className="font-semibold text-purple-900">Customer (Guided)</div>
                    <div className="text-[11px] text-purple-700 font-mono truncate max-w-[130px]">david@titanbuilds.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setEmail('marcus@rapidcouriers.net');
                    setPassword('CustomerPass2026!');
                    setSubmitting(true);
                    setError(null);
                    try {
                      const res = await signIn('marcus@rapidcouriers.net', 'CustomerPass2026!');
                      if (res.error) {
                        setError(res.error);
                        setSubmitting(false);
                      } else {
                        router.replace(res.destination || '/onboarding');
                      }
                    } catch (e: any) {
                      setError(e?.message || 'Login failed');
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition-colors text-xs"
                >
                  <div className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-[9px] shrink-0">O</div>
                  <div>
                    <div className="font-semibold text-amber-900">New Onboarding</div>
                    <div className="text-[11px] text-amber-700 font-mono truncate max-w-[130px]">marcus@rapidcouriers.net</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero sensitive data stored. Safe & encrypted.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
