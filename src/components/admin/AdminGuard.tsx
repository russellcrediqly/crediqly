'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = Boolean(user && user.role === 'admin');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?redirect=/admin');
      } else if (!isAdmin) {
        // Strictly redirect non-admin users to the customer dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingState message="Verifying administrator credentials..." className="text-white" />
      </div>
    );
  }

  return <>{children}</>;
};
