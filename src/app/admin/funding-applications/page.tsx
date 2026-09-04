'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAllFundingApplicationsAdmin } from '@/lib/supabase/fundingApplicationService';
import { FundingApplication, FundingApplicationStatus } from '@/types/fundingApplication';

const ALL_STATUSES: FundingApplicationStatus[] = [
  'Interested',
  'Planning to Apply',
  'Applied',
  'Documents Requested',
  'Submitted',
  'Approved',
  'Declined',
  'Funded',
];

function getStatusBadge(status: FundingApplicationStatus) {
  switch (status) {
    case 'Interested':
      return <Badge variant="neutral" className="bg-slate-800 text-slate-300 border-slate-700">Interested</Badge>;
    case 'Planning to Apply':
      return <Badge variant="info" className="bg-sky-950 text-sky-300 border-sky-800">Planning</Badge>;
    case 'Applied':
      return <Badge variant="info" className="bg-blue-950 text-blue-300 border-blue-800">Applied</Badge>;
    case 'Documents Requested':
      return <Badge variant="warning" className="bg-amber-950 text-amber-300 border-amber-800">Docs Requested</Badge>;
    case 'Submitted':
      return <Badge variant="info" className="bg-indigo-950 text-indigo-300 border-indigo-800">Submitted</Badge>;
    case 'Approved':
      return <Badge variant="success" className="bg-emerald-950 text-emerald-300 border-emerald-800">Approved</Badge>;
    case 'Declined':
      return <Badge variant="danger" className="bg-red-950 text-red-300 border-red-800">Declined</Badge>;
    case 'Funded':
      return <Badge variant="success" className="bg-emerald-900 text-emerald-200 border-emerald-700 font-bold">Funded</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export default function AdminFundingApplicationsPage() {
  const [applications, setApplications] = useState<(FundingApplication & { userEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FundingApplicationStatus>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const fetchApplications = useCallback(async () => {
    try {
      const data = await getAllFundingApplicationsAdmin();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load funding applications for admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  // Distinct providers for filter
  const distinctProviders = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((app) => {
      if (app.providerName) set.add(app.providerName);
    });
    return Array.from(set).sort();
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (providerFilter !== 'all' && app.providerName !== providerFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesEmail = app.userEmail?.toLowerCase().includes(q);
        const matchesProvider = app.providerName?.toLowerCase().includes(q);
        const matchesProduct = app.productName?.toLowerCase().includes(q);
        const matchesNotes = app.notes?.toLowerCase().includes(q);
        if (!matchesEmail && !matchesProvider && !matchesProduct && !matchesNotes) return false;
      }
      return true;
    });
  }, [applications, statusFilter, providerFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter((a) =>
      ['Planning to Apply', 'Applied', 'Documents Requested', 'Submitted'].includes(a.status)
    ).length;
    const successful = applications.filter((a) =>
      ['Approved', 'Funded'].includes(a.status)
    ).length;
    const totalCapital = applications.reduce((sum, a) => sum + (a.requestedAmount || 0), 0);
    return { total, inProgress, successful, totalCapital };
  }, [applications]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingState message="Loading funding applications..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Activity & Interest Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Funding Applications & Tracked Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect customer-tracked commercial funding interests, requested amounts, and self-reported progress across all registered businesses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-800 text-slate-300 hover:bg-slate-850 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Compliance / Activity Scope Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-white">
            Activity & Interest Tracking Scope
          </p>
          <p className="text-slate-400 leading-relaxed">
            This administrative dashboard reflects customer-tracked funding interests and self-reported milestones. Crediqly does not originate, underwrite, or process commercial loans directly. All external application workflows and underwriting decisions remain between the customer and third-party capital providers.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Total Tracked</p>
                <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Opportunities tracked across users</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Active Pipeline</p>
                <p className="text-2xl font-black text-blue-400 mt-1">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-900 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Applied, docs, or submitted</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Approved & Funded</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{stats.successful}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-900 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Successful capital outcomes</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Tracked Capital Demand</p>
                <p className="text-2xl font-black text-brand-400 mt-1">
                  ${stats.totalCapital > 0 ? (stats.totalCapital >= 1000000 ? `${(stats.totalCapital / 1000000).toFixed(1)}M` : stats.totalCapital.toLocaleString()) : '0'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-950/60 border border-brand-900 flex items-center justify-center text-brand-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Self-reported requested amounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email, provider, product, notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses ({applications.length})</option>
                {ALL_STATUSES.map((st) => {
                  const count = applications.filter((a) => a.status === st).length;
                  return (
                    <option key={st} value={st}>
                      {st} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Provider Filter */}
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Providers</option>
                {distinctProviders.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter counter */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
            <span>
              Showing <strong>{filteredApps.length}</strong> of <strong>{applications.length}</strong> applications
            </span>
            {(search || statusFilter !== 'all' || providerFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setProviderFilter('all');
                }}
                className="text-xs text-brand-400 hover:text-brand-300 underline font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Customer Email</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Funding Product</th>
                <th className="py-3 px-4">Requested</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Application Date</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileCheck className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No applications found</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {applications.length === 0
                          ? 'No customer has tracked a funding opportunity yet. Tracked items from /funding or /funding-tracker will appear here.'
                          : 'No tracked applications match the selected status or provider filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-200">
                      <div className="font-semibold text-white">{app.userEmail || 'Customer'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{app.userId}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-white">
                      {app.providerName || 'Direct / Bank'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-medium text-white">{app.productName}</div>
                      {app.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5 italic">
                          &ldquo;{app.notes}&rdquo;
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">
                      {app.requestedAmount ? `$${app.requestedAmount.toLocaleString()}` : <span className="text-slate-600 font-normal">—</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(app.status)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {app.applicationDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(app.applicationDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
