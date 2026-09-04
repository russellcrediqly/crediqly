'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  MapPin,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAdminUsers } from '@/lib/supabase/adminService';
import { AdminUserListItem } from '@/types/admin';

export default function AdminBusinessesPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (e) {
      console.error('Error fetching businesses:', e);
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

  // Extract unique entities and states for filters
  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.entityType) set.add(u.entityType);
    });
    return Array.from(set);
  }, [users]);

  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.state) set.add(u.state);
    });
    return Array.from(set);
  }, [users]);

  // Filter business entries (only users that have a businessName or completed onboarding)
  const businesses = useMemo(() => {
    return users
      .filter((u) => u.businessName)
      .filter((u) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchBiz = u.businessName?.toLowerCase().includes(q);
          const matchInd = u.industry?.toLowerCase().includes(q);
          const matchState = u.state?.toLowerCase().includes(q);
          const matchOwner = u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
          if (!matchBiz && !matchInd && !matchState && !matchOwner) return false;
        }

        if (entityFilter !== 'all' && u.entityType !== entityFilter) return false;
        if (stateFilter !== 'all' && u.state !== stateFilter) return false;

        return true;
      });
  }, [users, search, entityFilter, stateFilter]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Loading registered business entities..." className="text-white" />
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
              Entities Directory
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              {businesses.length} registered business profiles
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Registered Small Businesses
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse small business entities, industry distribution, and credit foundation statuses.
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

      {/* Filter and Search Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by business name, industry, state, or owner..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Entity Type Filter */}
            <div className="md:col-span-3">
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Entity Types</option>
                {uniqueEntities.map((ent) => (
                  <option key={ent} value={ent}>
                    {ent}
                  </option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div className="md:col-span-3">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All States</option>
                {uniqueStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-slate-400 font-semibold">
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Readiness Scores</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">No businesses match filter</p>
                    <p className="text-xs text-slate-500 mt-1">Try selecting different filter options.</p>
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{b.businessName}</span>
                          <span className="text-[10px] text-slate-500">
                            {b.profileCompleted ? 'Onboarding Complete' : 'Draft / Partial'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-750 text-slate-300 font-mono text-[11px]">
                        {b.entityType || 'LLC'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{b.state || 'United States'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-300 truncate max-w-[150px] block">
                        {b.industry || 'General Business'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{b.fullName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{b.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-400">
                          {b.businessReadinessScore ?? '—'}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="font-bold text-indigo-400">
                          {b.creditReadinessScore ?? '—'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/users/${b.userId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-brand-400 hover:text-white hover:bg-slate-800 gap-1"
                        >
                          <span>Manage</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
