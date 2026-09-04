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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'premium_advisory'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [onboardingFilter, setOnboardingFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
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

      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      if (onboardingFilter === 'completed' && !c.profileCompleted) return false;
      if (onboardingFilter === 'in_progress' && c.profileCompleted) return false;

      return true;
    });
  }, [customers, search, planFilter, statusFilter, onboardingFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const free = customers.filter((c) => !c.plan || c.plan === 'free').length;
    const pro = customers.filter((c) => c.plan === 'pro').length;
    const advisory = customers.filter((c) => c.plan === 'premium_advisory' || c.isAdvisory).length;
    return { total, free, pro, advisory };
  }, [customers]);

  const clearFilters = () => {
    setSearch('');
    setPlanFilter('all');
    setStatusFilter('all');
    setOnboardingFilter('all');
  };

  const hasActiveFilters = search || planFilter !== 'all' || statusFilter !== 'all' || onboardingFilter !== 'all';

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
    const { user: targetUser, newStatus } = statusModalUser;
    setActionLoading(targetUser.userId);
    try {
      const res = await updateAdminUserStatus(targetUser.userId, targetUser.role, newStatus);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((item) => (item.userId === targetUser.userId ? { ...item, status: newStatus } : item))
        );
        setFeedback({
          type: 'success',
          message: `Customer ${targetUser.fullName} marked as ${newStatus}.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || `Failed to update status to ${newStatus}.`,
        });
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
      <div className="py-20 flex justify-center">
        <LoadingState message="Loading customer database..." className="text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-800">
              Customer Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Customer Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inspect commercial profiles, readiness metrics, subscription plans, advisory meetings, and operational records.
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Customers</span>
              <Users className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
            <span className="text-[11px] text-slate-500">Registered accounts</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Free Plan</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-200 mt-1">{stats.free}</p>
            <span className="text-[11px] text-slate-500">Self-guided ($0)</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Crediqly Pro</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.pro}</p>
            <span className="text-[11px] text-slate-500">$39/mo subscribers</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Premium Advisory</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-indigo-400 mt-1">{stats.advisory}</p>
            <span className="text-[11px] text-slate-500">$499 + $149/mo retainers</span>
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
      <Card className="bg-slate-950 border-slate-800 text-white shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, business, or user ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Plan Filter */}
            <div className="md:col-span-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Plans</option>
                <option value="free">Free ($0)</option>
                <option value="pro">Pro ($39/mo)</option>
                <option value="premium_advisory">Premium Advisory</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Onboarding Filter */}
            <div className="md:col-span-2">
              <select
                value={onboardingFilter}
                onChange={(e) => setOnboardingFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Onboarding</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            {/* Clear Button */}
            <div className="md:col-span-1 flex items-center">
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 px-2 text-center text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
                >
                  Clear
                </button>
              ) : (
                <div className="text-center w-full text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <Filter className="w-3 h-3" />
                  <span>Filter</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Customer & Email</th>
                <th className="py-3.5 px-4">Business Information</th>
                <th className="py-3.5 px-4">Plan & Billing</th>
                <th className="py-3.5 px-4">Readiness Scores</th>
                <th className="py-3.5 px-4">Advisory Meeting</th>
                <th className="py-3.5 px-4">Funding Apps</th>
                <th className="py-3.5 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">No customers match the criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const planBadge =
                    c.plan === 'premium_advisory' || c.isAdvisory ? (
                      <Badge variant="info" className="bg-indigo-950 text-indigo-300 border-indigo-800 font-bold gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Advisory</span>
                      </Badge>
                    ) : c.plan === 'pro' ? (
                      <Badge variant="success" className="bg-emerald-950 text-emerald-300 border-emerald-800 font-bold gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-400" />
                        <span>Pro ($39)</span>
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="bg-slate-800 text-slate-400 border-slate-700">
                        Free ($0)
                      </Badge>
                    );

                  return (
                    <tr key={c.userId} className="hover:bg-slate-900/40 transition-colors">
                      {/* Customer Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200">{c.fullName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Joined {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Business & Industry */}
                      <td className="py-3 px-4">
                        {c.businessName ? (
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                              <span>{c.businessName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {c.entityType || 'Entity'} • {c.state || 'US'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {c.industry || 'Industry unspecified'} {c.businessAge ? `(${c.businessAge})` : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No business created</span>
                        )}
                      </td>

                      {/* Plan & Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div>{planBadge}</div>
                          <span className="inline-block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            Status: {c.subscriptionStatus || 'Active'}
                          </span>
                        </div>
                      </td>

                      {/* Readiness Scores */}
                      <td className="py-3 px-4">
                        {c.profileCompleted ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-400">Biz:</span>
                              <span className="font-bold text-brand-400">
                                {c.businessReadinessScore != null ? `${c.businessReadinessScore}%` : '--'}
                              </span>
                              <span className="text-slate-400">• Credit:</span>
                              <span className="font-bold text-emerald-400">
                                {c.creditReadinessScore != null ? `${c.creditReadinessScore}%` : '--'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Funding: {c.fundingReadinessScore != null ? `${c.fundingReadinessScore}%` : '--'}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="warning" className="bg-amber-950/60 text-amber-400 border-amber-800 text-[10px]">
                            Incomplete Profile
                          </Badge>
                        )}
                      </td>

                      {/* Advisory Meeting */}
                      <td className="py-3 px-4">
                        {c.advisoryStatus && c.advisoryStatus !== 'None' ? (
                          <Badge
                            variant={
                              c.advisoryStatus === 'Confirmed'
                                ? 'success'
                                : c.advisoryStatus === 'Requested'
                                ? 'info'
                                : 'neutral'
                            }
                            className="text-[10px]"
                          >
                            {c.advisoryStatus}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-500">—</span>
                        )}
                      </td>

                      {/* Funding Apps */}
                      <td className="py-3 px-4">
                        {c.fundingApplicationsCount ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-300 text-xs">
                            <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{c.fundingApplicationsCount} tracked</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">0</span>
                        )}
                      </td>

                      {/* Actions / Open Dossier */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/customers/${c.userId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-slate-700 bg-slate-900 text-slate-200 hover:bg-brand-600 hover:text-white hover:border-brand-500 transition-colors gap-1.5"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
