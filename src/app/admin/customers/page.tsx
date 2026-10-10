'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Mail,
  UserX,
  UserCheck,
  Building2,
  Sparkles,
  CreditCard,
  FileCheck,
  Calendar,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAdminUsers,
  updateAdminUserStatus,
  triggerAdminPasswordReset,
} from '@/lib/supabase/adminService';
import { AdminUserListItem } from '@/types/admin';
import { UserRole, AccountStatus } from '@/types/user';
import { AccessSource } from '@/types/subscription';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'foundation' | 'guided'>('all');
  const [accessSourceFilter, setAccessSourceFilter] = useState<'all' | AccessSource>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [billingFilter, setBillingFilter] = useState<'all' | string>('all');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'score'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Actions & Modals
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewUser, setPreviewUser] = useState<AdminUserListItem | null>(null);
  const [resetModalUser, setResetModalUser] = useState<AdminUserListItem | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<{ user: AdminUserListItem; newStatus: AccountStatus } | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await getAdminUsers();
      setCustomers(data);
    } catch (e) {
      console.error('Error fetching admin customers:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
  };

  // Filter and Search Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.fullName.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchBiz = c.businessName ? c.businessName.toLowerCase().includes(q) : false;
        const matchId = c.userId.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchBiz && !matchId) return false;
      }

      if (planFilter !== 'all') {
        const p = c.plan || 'free';
        if (p !== planFilter) return false;
      }

      if (accessSourceFilter !== 'all') {
        const src = c.accessSource || 'free';
        if (src !== accessSourceFilter) return false;
      }

      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      if (billingFilter !== 'all') {
        const b = (c.billingStatus || '').toLowerCase();
        if (b !== billingFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [customers, search, planFilter, accessSourceFilter, statusFilter, billingFilter]);

  // Sort Logic
  const sortedCustomers = useMemo(() => {
    const list = [...filteredCustomers];
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortBy === 'score') {
      list.sort((a, b) => (b.businessReadinessScore || 0) - (a.businessReadinessScore || 0));
    }
    return list;
  }, [filteredCustomers, sortBy]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter, accessSourceFilter, statusFilter, billingFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const free = customers.filter((c) => !c.plan || c.plan === 'free').length;
    const foundation = customers.filter((c) => c.plan === 'foundation' || c.plan === 'pro').length;
    const guided = customers.filter((c) => c.plan === 'guided' || c.plan === 'premium_advisory' || c.isAdvisory).length;
    const adminGranted = customers.filter((c) => c.accessSource === 'admin_grant' || c.accessSource === 'complimentary').length;
    return { total, free, foundation, guided, adminGranted };
  }, [customers]);

  const clearFilters = () => {
    setSearch('');
    setPlanFilter('all');
    setAccessSourceFilter('all');
    setStatusFilter('all');
    setBillingFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    search ||
    planFilter !== 'all' ||
    accessSourceFilter !== 'all' ||
    statusFilter !== 'all' ||
    billingFilter !== 'all' ||
    sortBy !== 'newest';

  // Execute Password Reset
  const handleConfirmReset = async () => {
    if (!resetModalUser) return;
    setActionLoading(resetModalUser.userId);
    try {
      const res = await triggerAdminPasswordReset(resetModalUser.email);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Password reset instructions sent to ${resetModalUser.email}.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to trigger password reset.',
        });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Unexpected error' });
    } finally {
      setActionLoading(null);
      setResetModalUser(null);
    }
  };

  // Execute Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusModalUser) return;
    setActionLoading(statusModalUser.user.userId);
    try {
      const res = await updateAdminUserStatus(
        statusModalUser.user.userId,
        statusModalUser.user.role,
        statusModalUser.newStatus
      );
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.userId === statusModalUser.user.userId ? { ...c, status: statusModalUser.newStatus } : c
          )
        );
        setFeedback({
          type: 'success',
          message: `${statusModalUser.user.fullName}'s account status set to ${statusModalUser.newStatus}.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update account status.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Unexpected error' });
    } finally {
      setActionLoading(null);
      setStatusModalUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Loading database-backed customer directory..." className="text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Owner Customer Management
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              {customers.length} Registered {customers.length === 1 ? 'Customer' : 'Customers'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Directory &amp; Entitlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real database customer records, active Stripe subscriptions, one-time programs, manual plan grants, and account administration controls.
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

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Customers</span>
              <Users className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <p className="text-xl font-black text-white mt-1">{stats.total}</p>
            <span className="text-[10px] text-slate-500">Database users</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Free Plan ($0)</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xl font-black text-slate-200 mt-1">{stats.free}</p>
            <span className="text-[10px] text-slate-500">Standard tier</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Foundation</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-emerald-400 mt-1">{stats.foundation}</p>
            <span className="text-[10px] text-slate-500">$47.99/mo access</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Guided</span>
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-xl font-black text-purple-400 mt-1">{stats.guided}</p>
            <span className="text-[10px] text-slate-500">$147.99/mo or $997</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white col-span-2 sm:col-span-1">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Admin Grants</span>
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl font-black text-amber-400 mt-1">{stats.adminGranted}</p>
            <span className="text-[10px] text-slate-500">Complimentary / manual</span>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, business, or ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Plan Filter */}
            <div className="sm:col-span-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Plans</option>
                <option value="free">Free ($0)</option>
                <option value="foundation">Foundation ($47.99/mo)</option>
                <option value="guided">Guided ($147.99/mo or $997)</option>
              </select>
            </div>

            {/* Access Source Filter */}
            <div className="sm:col-span-2">
              <select
                value={accessSourceFilter}
                onChange={(e) => setAccessSourceFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Access Sources</option>
                <option value="stripe_subscription">Stripe Subscription</option>
                <option value="stripe_onetime">Stripe One-Time (12-Mo)</option>
                <option value="admin_grant">Admin Grant</option>
                <option value="complimentary">Complimentary</option>
                <option value="free">Free Default</option>
              </select>
            </div>

            {/* Account Status Filter */}
            <div className="sm:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-2 flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name">Sort: Name (A-Z)</option>
                <option value="score">Sort: Highest Score</option>
              </select>
            </div>
          </div>

          {/* Active Filter Row & Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Found <strong className="text-white">{sortedCustomers.length}</strong> matching customer records
              </span>
              <button
                onClick={clearFilters}
                className="text-brand-400 hover:text-brand-300 font-semibold underline text-xs"
              >
                Reset all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customers Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Customer &amp; Account</th>
                <th className="py-3.5 px-4">Business Profile</th>
                <th className="py-3.5 px-4">Plan &amp; Entitlement</th>
                <th className="py-3.5 px-4">Access Source</th>
                <th className="py-3.5 px-4">Expiration / Renewal</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Readiness</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Users className="w-9 h-9 mx-auto text-slate-600 mb-2.5" />
                    <p className="font-semibold text-slate-300 text-sm">No customer records match your filter</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Adjust your search criteria, plan filters, or access sources above.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearFilters}
                        className="mt-3.5 border-slate-700 text-xs text-slate-300"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const isGuided = c.plan === 'guided' || c.plan === 'premium_advisory' || c.isAdvisory;
                  const isFoundation = c.plan === 'foundation' || c.plan === 'pro';

                  // Plan Badge
                  const planBadge = isGuided ? (
                    <Badge variant="info" className="bg-purple-950/70 text-purple-300 border-purple-800 font-bold gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>Guided</span>
                    </Badge>
                  ) : isFoundation ? (
                    <Badge variant="success" className="bg-emerald-950/70 text-emerald-300 border-emerald-800 font-bold gap-1">
                      <CreditCard className="w-3 h-3 text-emerald-400" />
                      <span>Foundation</span>
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="bg-slate-800 text-slate-400 border-slate-700">
                      Free ($0)
                    </Badge>
                  );

                  // Access Source Badge
                  const accessSource = c.accessSource || 'free';
                  let sourceBadge = (
                    <Badge variant="neutral" className="bg-slate-900 text-slate-400 border-slate-800 text-[10px]">
                      Free Default
                    </Badge>
                  );
                  if (accessSource === 'stripe_subscription') {
                    sourceBadge = (
                      <Badge variant="success" className="bg-emerald-950/80 text-emerald-300 border-emerald-800 text-[10px] gap-1">
                        <CreditCard className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Stripe Sub</span>
                      </Badge>
                    );
                  } else if (accessSource === 'stripe_onetime') {
                    sourceBadge = (
                      <Badge variant="info" className="bg-purple-950/80 text-purple-300 border-purple-800 text-[10px] gap-1">
                        <Calendar className="w-2.5 h-2.5 text-purple-400" />
                        <span>12-Mo Paid</span>
                      </Badge>
                    );
                  } else if (accessSource === 'admin_grant') {
                    sourceBadge = (
                      <Badge variant="info" className="bg-blue-950/80 text-blue-300 border-blue-800 text-[10px] gap-1">
                        <Shield className="w-2.5 h-2.5 text-blue-400" />
                        <span>Admin Grant</span>
                      </Badge>
                    );
                  } else if (accessSource === 'complimentary') {
                    sourceBadge = (
                      <Badge variant="warning" className="bg-amber-950/80 text-amber-300 border-amber-800 text-[10px] gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>Complimentary</span>
                      </Badge>
                    );
                  }

                  // Account Status Badge
                  const statusBadge =
                    c.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Active
                      </span>
                    ) : c.status === 'suspended' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        Disabled
                      </span>
                    );

                  return (
                    <tr key={c.userId} className="hover:bg-slate-900/40 transition-colors">
                      {/* Customer Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{c.fullName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{c.email}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Registered {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Business & Industry */}
                      <td className="py-3 px-4">
                        {c.businessName ? (
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{c.businessName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {c.entityType || 'Entity'} • {c.state || 'US'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                              {c.industry || 'General Industry'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No business profile</span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-4">
                        <div>{planBadge}</div>
                        <div className="text-[10px] text-slate-500 mt-1 capitalize">
                          Billing: {c.billingStatus || 'free'}
                        </div>
                      </td>

                      {/* Access Source */}
                      <td className="py-3 px-4">
                        <div>{sourceBadge}</div>
                        {c.grantType && c.grantType !== 'paid' && (
                          <div className="text-[10px] text-slate-400 mt-1 italic capitalize">
                            {c.grantType.replace('_', ' ')}
                          </div>
                        )}
                      </td>

                      {/* Expiration or Renewal */}
                      <td className="py-3 px-4">
                        {c.expiresAt ? (
                          <div>
                            <div className="text-[11px] text-slate-300 font-mono">
                              {new Date(c.expiresAt).toLocaleDateString()}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(c.expiresAt).getTime() < Date.now() ? (
                                <span className="text-rose-400 font-semibold">Expired</span>
                              ) : (
                                'Explicit End Date'
                              )}
                            </span>
                          </div>
                        ) : accessSource === 'stripe_subscription' ? (
                          <div>
                            <span className="text-[11px] text-slate-300 font-medium">Auto-renews monthly</span>
                            <div className="text-[10px] text-slate-500">Stripe managed</div>
                          </div>
                        ) : accessSource === 'admin_grant' ? (
                          <div>
                            <span className="text-[11px] text-emerald-400 font-medium">Indefinite</span>
                            <div className="text-[10px] text-slate-500">Admin granted</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3 px-4">
                        {statusBadge}
                        <div className="mt-1">
                          {c.status === 'active' ? (
                            <button
                              onClick={() => setStatusModalUser({ user: c, newStatus: 'suspended' })}
                              className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatusModalUser({ user: c, newStatus: 'active' })}
                              className="text-[10px] text-slate-500 hover:text-emerald-400 transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Readiness */}
                      <td className="py-3 px-4">
                        {c.profileCompleted ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-400">Biz:</span>
                              <span className="font-bold text-brand-400">
                                {c.businessReadinessScore != null ? `${c.businessReadinessScore}%` : '--'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-slate-400">Credit:</span>
                              <span className="font-bold text-emerald-400">
                                {c.creditReadinessScore != null ? `${c.creditReadinessScore}%` : '--'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-400/90 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900">
                            Incomplete
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewUser(c)}
                            title="Quick preview drawer"
                            className="text-xs px-2 h-7 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Link href={`/admin/customers/${c.userId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 border-slate-700 bg-slate-900 text-slate-200 hover:bg-brand-600 hover:text-white hover:border-brand-500 transition-colors gap-1"
                            >
                              <span>Dossier</span>
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-slate-900/40 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, sortedCustomers.length)} of {sortedCustomers.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              <span>Previous</span>
            </Button>
            <span className="px-2 text-slate-300 font-mono text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Customer Preview Drawer / Modal */}
      {previewUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">
                  Customer Summary
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{previewUser.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono">{previewUser.email}</p>
              </div>
              <button
                onClick={() => setPreviewUser(null)}
                className="text-slate-500 hover:text-white text-xs px-2 py-1 bg-slate-900 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-850">
                <div>
                  <span className="text-slate-400 text-[11px] block">Current Plan</span>
                  <strong className="text-white text-sm capitalize">{previewUser.plan || 'Free'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Access Source</span>
                  <span className="text-brand-300 font-medium capitalize">
                    {(previewUser.accessSource || 'free').replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Billing Status</span>
                  <span className="text-slate-200 capitalize">{previewUser.billingStatus || 'free'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Expiration / Term</span>
                  <span className="text-slate-200 font-mono">
                    {previewUser.expiresAt ? new Date(previewUser.expiresAt).toLocaleDateString() : 'Active/Indefinite'}
                  </span>
                </div>
              </div>

              {previewUser.businessName && (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Commercial Entity</span>
                  <div className="font-semibold text-white">{previewUser.businessName}</div>
                  <div className="text-slate-400 text-[11px]">
                    {previewUser.entityType || 'Entity'} • {previewUser.state || 'US'} • {previewUser.industry || 'Industry unspecified'}
                  </div>
                </div>
              )}

              {previewUser.grantReason && (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-850">
                  <span className="text-amber-400 text-[11px] font-semibold block">Admin Grant Reason:</span>
                  <p className="text-slate-300 text-xs mt-0.5">{previewUser.grantReason}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResetModalUser(previewUser);
                  setPreviewUser(null);
                }}
                className="text-xs border-slate-800 text-amber-400 hover:bg-amber-950/20"
              >
                <KeyRound className="w-3 h-3 mr-1" />
                <span>Password Reset</span>
              </Button>

              <Link href={`/admin/customers/${previewUser.userId}`}>
                <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold gap-1">
                  <span>Open Full Customer Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Confirmation Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <KeyRound className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Send Password Reset?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will trigger an official Supabase password reset email to{' '}
              <strong className="text-white">{resetModalUser.email}</strong>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetModalUser(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReset}
                disabled={actionLoading === resetModalUser.userId}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                {actionLoading === resetModalUser.userId ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-brand-400">
              <UserCheck className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Update Account Status?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Set <strong className="text-white">{statusModalUser.user.fullName}</strong>&apos;s account status to{' '}
              <strong className="text-brand-300 uppercase">{statusModalUser.newStatus}</strong>.
              {statusModalUser.newStatus === 'suspended' && (
                <span className="block mt-1.5 text-amber-300">
                  Note: Suspended accounts are temporarily restricted from logging into the customer dashboard.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModalUser(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmStatusChange}
                disabled={actionLoading === statusModalUser.user.userId}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
              >
                {actionLoading === statusModalUser.user.userId ? 'Updating...' : 'Confirm Status'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
