'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, ShieldCheck, Mail, Key } from 'lucide-react';
import Link from 'next/link';

export default function UserProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Account Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal login credentials and account preferences.
            </p>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>{user?.name || 'Account Holder'}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <Mail className="w-3.5 h-3.5" />
                    Account Email
                  </div>
                  <span className="font-semibold text-slate-900">{user?.email}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Security Status
                  </div>
                  <span className="font-semibold text-emerald-700">Active & Protected</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link href="/business">
                  <Button variant="outline" size="sm">
                    View Business Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
