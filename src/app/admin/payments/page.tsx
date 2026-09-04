'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Building2,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAllPaymentsAdmin,
  AdminPaymentListItem,
} from '@/lib/supabase/subscriptionService';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const list = await getAllPaymentsAdmin();
      setPayments(list);
    } catch (err) {
      console.error('Failed to load admin payments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Filtered Payments
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      // 1. Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (p.userName || '').toLowerCase().includes(q);
        const matchesEmail = (p.userEmail || '').toLowerCase().includes(q);
        const matchesBiz = (p.businessName || '').toLowerCase().includes(q);
        const matchesStripe =
          (p.stripeCheckoutSessionId || '').toLowerCase().includes(q) ||
          (p.stripePaymentIntentId || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesBiz && !matchesStripe) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      // 3. Type filter
      if (typeFilter !== 'all' && p.paymentType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [payments, search, statusFilter, typeFilter]);

  // Financial KPIs
  const totalRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const advisorySetupRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'paid' && p.paymentType === 'advisory_setup')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const proRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'paid' && p.paymentType === 'subscription')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const advisoryMonthlyRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'paid' && p.paymentType === 'advisory_subscription')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Loading payment transactions..." className="text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Monetization & Ledger
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{payments.length} Recorded Transactions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Payments & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit real-time customer subscription billings, setup retainers, and historical payments with Stripe references.
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
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <Link href="/admin/settings/stripe">
            <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 shadow-sm">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Stripe Settings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-950 border-slate-800 text-white p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Revenue Collected</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ${(totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">All successful charges</p>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Pro Subscriptions ($39)</span>
          <div className="text-2xl font-black text-brand-300 mt-1">
            ${(proRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Recurring Pro revenue</p>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Advisory Setups ($499)</span>
          <div className="text-2xl font-black text-purple-300 mt-1">
            ${(advisorySetupRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">One-time file audits</p>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white p-4">
          <span className="text-xs text-slate-400 uppercase font-semibold">Advisory Retainers ($149)</span>
          <div className="text-2xl font-black text-purple-400 mt-1">
            ${(advisoryMonthlyRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Monthly advisory tiers</p>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <Card className="bg-slate-950 border-slate-800 text-white p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, email, business, or Stripe ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Products</option>
              <option value="subscription">Crediqly Pro ($39/mo)</option>
              <option value="advisory_setup">Advisory Setup ($499)</option>
              <option value="advisory_subscription">Advisory Monthly ($149/mo)</option>
              <option value="consultation">Historical Consult ($99)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer & Business</th>
                <th className="py-3 px-4">Product / Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Stripe Reference</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map((p) => {
                  const isAdvisorySetup = p.paymentType === 'advisory_setup';
                  const isAdvisorySub = p.paymentType === 'advisory_subscription';
                  const isPro = p.paymentType === 'subscription';

                  const planLabel = isAdvisorySetup
                    ? 'Premium Advisory Setup'
                    : isAdvisorySub
                    ? 'Premium Advisory Monthly'
                    : isPro
                    ? 'Crediqly Pro Monthly'
                    : 'Consultation Session (Historical)';

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Customer & Business */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {p.userName || p.userEmail || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{p.userEmail}</span>
                          {p.businessName && (
                            <>
                              <span>•</span>
                              <span className="text-teal-400">{p.businessName}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {(isAdvisorySetup || isAdvisorySub) && (
                            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          )}
                          <span>{planLabel}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">{p.paymentType.replace('_', ' ')}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        ${((p.amount || 0) / 100).toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-500 uppercase font-sans">{p.currency || 'USD'}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            p.status === 'paid'
                              ? 'success'
                              : p.status === 'pending'
                              ? 'warning'
                              : p.status === 'refunded'
                              ? 'neutral'
                              : 'danger'
                          }
                          className="text-[10px] capitalize"
                        >
                          {p.status}
                        </Badge>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {new Date(p.createdAt).toLocaleDateString()}
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(p.createdAt).toLocaleTimeString()}
                        </span>
                      </td>

                      {/* Stripe Reference */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-[180px] truncate" title={p.stripePaymentIntentId || p.stripeCheckoutSessionId || '—'}>
                        {p.stripePaymentIntentId || p.stripeCheckoutSessionId || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/customers/${p.userId}`}>
                          <Button size="sm" variant="ghost" className="text-xs text-brand-400 hover:text-white h-7 px-2">
                            <span>Dossier</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No payment records matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
