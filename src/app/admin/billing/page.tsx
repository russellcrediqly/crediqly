'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Headphones,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getAdminBillingMetrics,
  AdminBillingMetrics,
} from '@/lib/supabase/subscriptionService';
import { Subscription, PaymentRecord } from '@/types/subscription';

interface StripeStatus {
  configured: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  hasProPriceId: boolean;
  hasConsultationPriceId: boolean;
  hasAdvisorySetupPriceId?: boolean;
  hasAdvisoryMonthlyPriceId?: boolean;
  proPriceCents: number;
  consultationPriceCents: number;
  advisorySetupPriceCents?: number;
  advisoryMonthlyPriceCents?: number;
  webhookEndpoint: string;
}

export default function AdminBillingPage() {
  const [metrics, setMetrics] = useState<AdminBillingMetrics | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments'>('subscriptions');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [m, sRes] = await Promise.all([
        getAdminBillingMetrics(),
        fetch('/api/stripe/status').then((r) => r.json()).catch(() => null),
      ]);
      setMetrics(m);
      if (sRes) setStripeStatus(sRes);
    } catch (err) {
      console.error('Failed to load billing metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingState message="Loading monetization & billing telemetry..." />
      </div>
    );
  }

  const proMrr = (metrics?.activeProCustomers || 0) * 39;
  const advisoryMrr = (metrics?.activeAdvisoryCustomers || 0) * 149;
  const totalMrrVal = proMrr + advisoryMrr;

  const mrr = totalMrrVal.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const advisorySetupRevenue = (((metrics?.advisorySetupRevenueCents || 0)) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const consultationRevenue = ((metrics?.totalPaidConsultations || 0) * 99).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const filteredSubs = (metrics?.recentSubscriptions || []).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.userId.toLowerCase().includes(q) ||
      s.plan.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      (s.stripeCustomerId && s.stripeCustomerId.toLowerCase().includes(q))
    );
  });

  const filteredPayments = (metrics?.recentPayments || []).filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.userId.toLowerCase().includes(q) ||
      p.paymentType.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      p.stripeCheckoutSessionId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-800">
              Platform Monetization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Billing & Revenue Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track customer subscriptions ($39/mo Pro), Done-For-You Premium Advisory ($499 + $149/mo), and monetization telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              variant="primary"
              size="sm"
              className="text-xs bg-brand-600 hover:bg-brand-500 font-bold gap-1.5"
            >
              <span>Stripe Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Estimated MRR */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total MRR</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-900/60">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white">{mrr}</span>
              <span className="text-xs text-slate-400 block mt-0.5">
                ${proMrr} Pro + ${advisoryMrr} Advisory
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Premium Advisory Retainer */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Advisory ($149/mo)</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 text-indigo-400 flex items-center justify-center border border-indigo-900/60">
                <Headphones className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-400">
                {metrics?.activeAdvisoryCustomers || 0}
              </span>
              <Badge variant="info" className="text-[10px] bg-indigo-950 text-indigo-300 border-indigo-800">Active</Badge>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              {advisorySetupRevenue} setup volume
            </span>
          </CardContent>
        </Card>

        {/* Active Pro Subscribers */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Pro ($39/mo)</span>
              <div className="w-8 h-8 rounded-lg bg-brand-950/60 text-brand-400 flex items-center justify-center border border-brand-900/60">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-brand-400">
                {metrics?.activeProCustomers || 0}
              </span>
              <Badge variant="info" className="text-[10px]">Active</Badge>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              {metrics?.cancelledProCustomers || 0} cancelled / churned
            </span>
          </CardContent>
        </Card>

        {/* Past Consultations */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Past Consultations</span>
              <div className="w-8 h-8 rounded-lg bg-sky-950/60 text-sky-400 flex items-center justify-center border border-sky-900/60">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-sky-300">
                {metrics?.totalPaidConsultations || 0}
              </span>
              <span className="text-xs text-slate-400">Historical</span>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              {consultationRevenue} lifetime revenue
            </span>
          </CardContent>
        </Card>

        {/* Total Customers & Free Base */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Customer Base</span>
              <div className="w-8 h-8 rounded-lg bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-900/60">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-purple-300">
                {metrics?.totalCustomers || 0}
              </span>
              <span className="text-xs text-slate-400">Registered</span>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              {metrics?.freeCustomers || 0} on Free plan ($0/mo)
            </span>
          </CardContent>
        </Card>
      </div>

      {/* STRIPE INTEGRATION STATUS CARD */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="bg-slate-950/70 p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              stripeStatus?.configured ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stripe Infrastructure Status</h2>
              <p className="text-xs text-slate-400">
                Authoritative payment gateway and webhook verification environment
              </p>
            </div>
          </div>

          <Badge variant={stripeStatus?.configured ? 'success' : 'warning'}>
            {stripeStatus?.configured ? 'Live / Configured' : 'Setup Required'}
          </Badge>
        </div>

        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Secret API Key</span>
              <div className="flex items-center gap-1.5 font-mono text-white">
                {stripeStatus?.hasSecretKey ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>{stripeStatus?.hasSecretKey ? 'STRIPE_SECRET_KEY Set' : 'Missing sk_...'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Webhook Signing Secret</span>
              <div className="flex items-center gap-1.5 font-mono text-white">
                {stripeStatus?.hasWebhookSecret ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>{stripeStatus?.hasWebhookSecret ? 'whsec_... Set' : 'Pending Secret'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Pro Subscription Pricing</span>
              <div className="flex items-center gap-1.5 font-mono text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>$39.00 / month (USD)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">1-on-1 Consultation Fee</span>
              <div className="flex items-center gap-1.5 font-mono text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>$99.00 / session (USD)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Advisory Setup Fee</span>
              <div className="flex items-center gap-1.5 font-mono text-white">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>$499.00 one-time (USD)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Advisory Monthly Retainer</span>
              <div className="flex items-center gap-1.5 font-mono text-white">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>$149.00 / month (USD)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Webhook Endpoint Destination:</span>
              <code className="text-xs bg-slate-900 px-2 py-0.5 rounded text-brand-300 font-mono">
                {stripeStatus?.webhookEndpoint || '/api/stripe/webhook'}
              </code>
            </div>
            <p className="leading-relaxed">
              Listen to events: <code className="text-slate-300">checkout.session.completed</code>,{' '}
              <code className="text-slate-300">customer.subscription.created</code>,{' '}
              <code className="text-slate-300">customer.subscription.updated</code>,{' '}
              <code className="text-slate-300">customer.subscription.deleted</code>,{' '}
              <code className="text-slate-300">invoice.paid</code>, and{' '}
              <code className="text-slate-300">invoice.payment_failed</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TABLE SECTION: SUBSCRIPTIONS & TRANSACTIONS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Pro Subscriptions ({metrics?.recentSubscriptions.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'payments'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Payment Audit Records ({metrics?.recentPayments.length || 0})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user ID, customer, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Tab 1: Subscriptions Table */}
        {activeTab === 'subscriptions' && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Current Period</th>
                    <th className="py-3 px-4">Auto-Renew</th>
                    <th className="py-3 px-4">Stripe Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No subscription records found. Subscriptions created via Pro checkout will appear here.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {sub.userId.substring(0, 16)}...
                        </td>
                        <td className="py-3.5 px-4 font-bold uppercase">
                          {sub.plan === 'premium_advisory' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-700">
                              Advisory Retainer
                            </span>
                          ) : sub.plan === 'pro' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-brand-950 text-brand-300 border border-brand-800">
                              Pro ($39/mo)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-slate-300">
                              {sub.plan}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              sub.status === 'active' || sub.status === 'trialing'
                                ? 'success'
                                : sub.status === 'cancelled'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {sub.currentPeriodEnd
                            ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {sub.cancelAtPeriodEnd ? (
                            <span className="text-amber-400 font-semibold">Cancelling</span>
                          ) : (
                            <span className="text-emerald-400">Active Renewal</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {sub.stripeCustomerId || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Payments Table */}
        {activeTab === 'payments' && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Payment Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Stripe Session ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No payment audit logs found. Completed checkouts via webhook will be logged here.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 text-slate-300">
                          {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {pay.userId.substring(0, 16)}...
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            pay.paymentType === 'advisory_setup'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : pay.paymentType === 'advisory_subscription'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : pay.paymentType === 'consultation'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : 'bg-brand-950 text-brand-300 border border-brand-800'
                          }`}>
                            {pay.paymentType === 'advisory_setup'
                              ? 'Advisory Setup ($499)'
                              : pay.paymentType === 'advisory_subscription'
                              ? 'Advisory Retainer ($149)'
                              : pay.paymentType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {(pay.amount / 100).toLocaleString('en-US', {
                            style: 'currency',
                            currency: pay.currency.toUpperCase(),
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              pay.status === 'paid'
                                ? 'success'
                                : pay.status === 'pending'
                                ? 'warning'
                                : pay.status === 'failed'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {pay.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] max-w-[200px] truncate">
                          {pay.stripeCheckoutSessionId}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
