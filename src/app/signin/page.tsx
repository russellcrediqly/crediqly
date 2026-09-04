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
      if (!businessLoading) {
        if (business && business.profileCompleted) {
          router.replace('/dashboard');
        } else {
          router.replace('/onboarding');
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

      // Direct navigation using verified synchronously-resolved destination
      const targetDestination =
        res.destination ||
        (res.user?.role === 'admin'
          ? '/admin'
          : res.profileCompleted
          ? '/dashboard'
          : '/onboarding');

      router.replace(targetDestination);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white font-black text-xl shadow-sm">
            C
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">Crediqly</span>
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
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
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
