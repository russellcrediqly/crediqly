'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Building2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAdminUsers } from '@/lib/supabase/adminService';
import { AdminUserListItem } from '@/types/admin';

export default function AdminReadinessPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (e) {
      console.error('Error fetching readiness audit data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Compute readiness tiers
  const tierDistribution = useMemo(() => {
    const withBiz = users.filter((u) => u.businessName);
    const total = withBiz.length || 1;

    const strong = withBiz.filter((u) => (u.businessReadinessScore || 0) >= 80).length;
    const onTrack = withBiz.filter(
      (u) => (u.businessReadinessScore || 0) >= 60 && (u.businessReadinessScore || 0) < 80
    ).length;
    const building = withBiz.filter(
      (u) => (u.businessReadinessScore || 0) >= 40 && (u.businessReadinessScore || 0) < 60
    ).length;
    const gettingStarted = withBiz.filter((u) => (u.businessReadinessScore || 0) < 40).length;

    return {
      total: withBiz.length,
      strong: { count: strong, pct: Math.round((strong / total) * 100) },
      onTrack: { count: onTrack, pct: Math.round((onTrack / total) * 100) },
      building: { count: building, pct: Math.round((building / total) * 100) },
      gettingStarted: { count: gettingStarted, pct: Math.round((gettingStarted / total) * 100) },
    };
  }, [users]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Auditing readiness scoring engine..." className="text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Scoring Engine Audit
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              Internal Readiness Tier Distribution
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Readiness & Funding Engine Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect scoring algorithms, identify common business credit gaps, and monitor readiness progression.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tier Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Strong Foundation */}
        <Card className="bg-slate-950 border-emerald-900/40 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400">Strong Foundation</span>
              <Badge variant="success" className="text-[10px]">80–100</Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {tierDistribution.strong.count}
              </span>
              <span className="text-xs text-emerald-400">
                ({tierDistribution.strong.pct}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Fully compliant entity, EIN, business bank, verified address, and active bureau profile.
            </p>
          </CardContent>
        </Card>

        {/* On Track */}
        <Card className="bg-slate-950 border-teal-900/40 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-400">On Track</span>
              <Badge variant="success" className="text-[10px]">60–79</Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {tierDistribution.onTrack.count}
              </span>
              <span className="text-xs text-teal-400">
                ({tierDistribution.onTrack.pct}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Legitimate entity and banking established, missing 1–2 vendor lines or D-U-N-S.
            </p>
          </CardContent>
        </Card>

        {/* Building */}
        <Card className="bg-slate-950 border-indigo-900/40 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-400">Building</span>
              <Badge variant="info" className="text-[10px]">40–59</Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {tierDistribution.building.count}
              </span>
              <span className="text-xs text-indigo-400">
                ({tierDistribution.building.pct}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Entity formed, but incomplete foundation separation (e.g. commingled banking, residential address).
            </p>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="bg-slate-950 border-amber-900/40 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-400">Getting Started</span>
              <Badge variant="warning" className="text-[10px]">0–39</Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {tierDistribution.gettingStarted.count}
              </span>
              <span className="text-xs text-amber-400">
                ({tierDistribution.gettingStarted.pct}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Early stage profile or partial draft. Critical foundation steps pending action.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Engine Logic & Methodology */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Algorithm Foundations & Verification Weightings</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Crediqly internal scoring methodology for small business lending readiness.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-teal-400 block text-sm">
                1. Business Readiness (100 pts)
              </span>
              <p className="text-slate-400">
                Lenders assess operational legitimacy prior to underwriting:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>Legal Entity Registration (LLC/Corp): +20 pts</li>
                <li>Federal EIN Validation: +15 pts</li>
                <li>Dedicated Business Checking Account: +20 pts</li>
                <li>Physical Commercial Address: +15 pts</li>
                <li>Commercial Domain & Website: +15 pts</li>
                <li>Dedicated Business Phone & License: +15 pts</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-indigo-400 block text-sm">
                2. Credit Readiness (100 pts)
              </span>
              <p className="text-slate-400">
                Underwriters verify business credit bureau bureau depth:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>Dun & Bradstreet D-U-N-S Number: +25 pts</li>
                <li>Active Business Credit Profile (Experian/Equifax): +25 pts</li>
                <li>Tier-1 Reporting Trade Lines: +25 pts</li>
                <li>Business Credit Card / Revolving Facility: +25 pts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Readiness Audit Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Business Scoring Audit</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit view of business readiness metrics and owner accounts.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-slate-400 font-semibold">
                <th className="py-3 px-4">Business</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Business Readiness</th>
                <th className="py-3 px-4">Credit Readiness</th>
                <th className="py-3 px-4">Readiness Level</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users
                .filter((u) => u.businessName)
                .map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{u.businessName}</span>
                        <span className="text-[11px] text-slate-400">
                          {u.entityType || 'LLC'} • {u.state || 'US'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-slate-200">{u.fullName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-400 text-sm">
                          {u.businessReadinessScore ?? '—'}
                        </span>
                        <span className="text-slate-500">/ 100</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 text-sm">
                          {u.creditReadinessScore ?? '—'}
                        </span>
                        <span className="text-slate-500">/ 100</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          (u.businessReadinessScore || 0) >= 80
                            ? 'success'
                            : (u.businessReadinessScore || 0) >= 60
                            ? 'info'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {u.businessReadinessLevel || 'On Track'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/users/${u.userId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-brand-400 hover:text-white hover:bg-slate-800 gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
