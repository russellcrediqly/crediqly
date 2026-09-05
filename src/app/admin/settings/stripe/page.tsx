'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  Shield,
  Lock,
  Sparkles,
  Layers,
  HelpCircle,
  FileCheck,
  Check,
  X,
  AlertTriangle,
  Key,
  Save,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

interface VerificationData {
  connected: boolean;
  mode: 'test' | 'live' | 'inconsistent' | 'unconfigured';
  apiStatus: 'working' | 'error' | 'unconfigured';
  apiMessage: string;
  webhookStatus: 'healthy' | 'needs_attention' | 'not_configured';
  lastEventAt: string | null;
  lastEventType: string | null;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  prices: {
    pro: { id: string; configured: boolean; valid: boolean; expected: string; actual?: string; error?: string };
    advisorySetup: { id: string; configured: boolean; valid: boolean; expected: string; actual?: string; error?: string };
    advisoryMonthly: { id: string; configured: boolean; valid: boolean; expected: string; actual?: string; error?: string };
  };
  checklist: {
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'warning';
    detail: string;
  }[];
  overallReady: boolean;
  checkedAt: string;
}

export default function AdminStripeSettingsPage() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://crediqly.vercel.app/api/stripe/webhook');
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const [form, setForm] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    proPriceId: '',
    advisorySetupPriceId: '',
    advisoryMonthlyPriceId: '',
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/verify-config');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setFeedback({
          type: 'error',
          message: 'Failed to retrieve Stripe configuration diagnostics from server.',
        });
      }
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e.message || 'Error communicating with Stripe diagnostic API.',
      });
    } finally {
      setLoading(false);
      setTesting(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Sync existing price IDs from server into form fields
  useEffect(() => {
    if (data?.prices) {
      setForm((prev) => ({
        ...prev,
        proPriceId: prev.proPriceId || data.prices.pro?.id || '',
        advisorySetupPriceId: prev.advisorySetupPriceId || data.prices.advisorySetup?.id || '',
        advisoryMonthlyPriceId: prev.advisoryMonthlyPriceId || data.prices.advisoryMonthly?.id || '',
      }));
    }
  }, [data]);

  const handleTestConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      await fetchStatus();
      setFeedback({
        type: 'success',
        message: 'Stripe infrastructure diagnostic test completed successfully.',
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Connection test failed. Please verify server environment keys.',
      });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/stripe/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save Stripe configuration.');
      }
      setFeedback({
        type: 'success',
        message: `${json.message} Connection: ${json.connectionMessage}`,
      });
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save Stripe configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Testing Stripe API connection & verifying price IDs..." className="text-white" />
      </div>
    );
  }

  const isLive = data?.mode === 'live';
  const isTest = data?.mode === 'test';
  const isConnected = data?.connected;

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Platform Settings</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-500">
          Diagnostic Endpoint: /api/stripe/verify-config
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 flex items-center justify-center text-white text-xl font-black shadow-inner flex-shrink-0">
            <CreditCard className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Stripe Infrastructure & Payments Setup
              </h1>

              {/* Connection Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isConnected ? 'Connected' : 'Connection Failed'}
              </span>

              {/* Mode Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  isLive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : isTest
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {data?.mode ? `${data.mode} Mode` : 'Unconfigured'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verify Stripe API connectivity, price configurations, webhook integrity, and environment variable completeness without exposing sensitive secret keys.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing API...' : 'Test Stripe Connection'}</span>
          </Button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
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

      {/* 4 Telemetry Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Stripe Connection */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Stripe Connection</span>
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          </div>
          <div className="text-xl font-black text-white">
            {isConnected ? 'Connected' : 'Not Connected'}
          </div>
          <p className="text-[11px] text-slate-400">
            {isConnected ? 'API keys communicating with Stripe' : 'Check server STRIPE_SECRET_KEY'}
          </p>
        </Card>

        {/* 2. Mode */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Operational Mode</span>
            <Badge variant={isLive ? 'success' : isTest ? 'warning' : 'neutral'} className="text-[10px]">
              {data?.mode?.toUpperCase()}
            </Badge>
          </div>
          <div className="text-xl font-black text-white capitalize">
            {data?.mode || 'Unknown'}
          </div>
          <p className="text-[11px] text-slate-400">
            {isLive ? 'Real customer charges active' : 'Simulated test payments safe for testing'}
          </p>
        </Card>

        {/* 3. API Status */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">API Status</span>
            <Badge variant={data?.apiStatus === 'working' ? 'success' : 'danger'} className="text-[10px]">
              {data?.apiStatus === 'working' ? 'Operational' : 'Error'}
            </Badge>
          </div>
          <div className="text-xl font-black text-white capitalize">
            {data?.apiStatus === 'working' ? 'Working' : 'Check Logs'}
          </div>
          <p className="text-[11px] text-slate-400 truncate" title={data?.apiMessage}>
            {data?.apiMessage}
          </p>
        </Card>

        {/* 4. Webhook Status */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Webhook Status</span>
            <Badge
              variant={
                data?.webhookStatus === 'healthy'
                  ? 'success'
                  : data?.webhookStatus === 'needs_attention'
                  ? 'warning'
                  : 'neutral'
              }
              className="text-[10px]"
            >
              {data?.webhookStatus === 'healthy'
                ? 'Healthy'
                : data?.webhookStatus === 'needs_attention'
                ? 'Listening'
                : 'Not Configured'}
            </Badge>
          </div>
          <div className="text-xl font-black text-white capitalize">
            {data?.webhookStatus === 'healthy' ? 'Healthy' : 'Needs Attention'}
          </div>
          <p className="text-[11px] text-slate-400">
            {data?.lastEventAt
              ? `Last: ${new Date(data.lastEventAt).toLocaleTimeString()}`
              : 'No webhook events logged yet'}
          </p>
        </Card>
      </div>

      {/* DIRECT IN-BROWSER STRIPE CONFIGURATION & EDIT FORM */}
      <Card className="bg-slate-950 border-brand-500/40 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        <CardHeader className="pb-4 border-b border-slate-800/80 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-400" />
                <span>Configure & Connect Stripe Credentials</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Enter your Stripe API keys and Price IDs below to connect Stripe directly from this control panel. Changes are saved to your environment and verified in real-time.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] border-brand-500/40 text-brand-300 self-start sm:self-center">
              Direct In-Browser Setup
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* Section 1: API Keys & Webhook Secret */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                <span>1. Stripe API Keys & Webhook Secret</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Publishable Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Publishable Key <span className="text-slate-500 font-normal">(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        data?.hasPublishableKey || form.publishableKey
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {data?.hasPublishableKey || form.publishableKey ? 'Configured ✓' : 'Not Configured ⚠'}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="pk_test_... or pk_live_..."
                    value={form.publishableKey}
                    onChange={(e) => setForm({ ...form, publishableKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">From Stripe Dashboard &gt; Developers &gt; API keys</p>
                </div>

                {/* Secret Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Secret Key <span className="text-slate-500 font-normal">(STRIPE_SECRET_KEY)</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        data?.hasSecretKey || form.secretKey
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {data?.hasSecretKey || form.secretKey ? 'Configured ✓' : 'Not Configured ⚠'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      placeholder="sk_test_... or sk_live_..."
                      value={form.secretKey}
                      onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                      className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Kept server-side only, never sent to browsers</p>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Webhook Signing Secret <span className="text-slate-500 font-normal">(STRIPE_WEBHOOK_SECRET)</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        data?.hasWebhookSecret || form.webhookSecret
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {data?.hasWebhookSecret || form.webhookSecret ? 'Configured ✓' : 'Not Configured ⚠'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showWebhookSecret ? 'text' : 'password'}
                      placeholder="whsec_..."
                      value={form.webhookSecret}
                      onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                      className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    From Stripe Dashboard &gt; Developers &gt; Webhooks &gt; Select Endpoint &gt; Signing secret
                  </p>
                </div>
              </div>

              {/* Webhook Endpoint & Events Direct Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold text-white">Production Webhook Endpoint & Events</span>
                  </div>
                  <Badge variant={data?.webhookStatus === 'healthy' ? 'success' : 'neutral'} className="text-[10px] self-start sm:self-auto">
                    {data?.webhookStatus === 'healthy' ? 'Registered & Receiving Events ✓' : 'Listening Endpoint'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://crediqly.vercel.app/api/stripe/webhook"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-teal-300 font-mono select-all focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyWebhook}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs gap-1.5 px-3 py-1.5 flex-shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied!' : 'Copy URL'}</span>
                  </Button>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Required Webhook Events (Enabled in Stripe):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-300">
                    {[
                      'checkout.session.completed',
                      'customer.subscription.created',
                      'customer.subscription.updated',
                      'customer.subscription.deleted',
                      'invoice.payment_succeeded',
                      'invoice.payment_failed',
                      'payment_intent.succeeded',
                    ].map((ev) => (
                      <div key={ev} className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Product Price IDs */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>2. Product Price IDs (Canonical 3-Tier Model)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Pro Price ID */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-brand-300">Crediqly Pro</label>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        data?.prices.pro.valid
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {data?.prices.pro.valid ? 'Active ✓' : 'Missing ✗'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 block">$39.00/mo recurring</span>
                  <input
                    type="text"
                    placeholder="price_..."
                    value={form.proPriceId}
                    onChange={(e) => setForm({ ...form, proPriceId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Monthly recurring subscription</p>
                </div>

                {/* Advisory Setup Price ID */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-300">Advisory Setup</label>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        data?.prices.advisorySetup.valid
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {data?.prices.advisorySetup.valid ? 'Active ✓' : 'Missing ✗'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 block">$499.00 one-time</span>
                  <input
                    type="text"
                    placeholder="price_..."
                    value={form.advisorySetupPriceId}
                    onChange={(e) => setForm({ ...form, advisorySetupPriceId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">One-time file audit & onboarding</p>
                </div>

                {/* Advisory Monthly Retainer Price ID */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-300">Advisory Retainer</label>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        data?.prices.advisoryMonthly.valid
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {data?.prices.advisoryMonthly.valid ? 'Active ✓' : 'Missing ✗'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 block">$149.00/mo recurring</span>
                  <input
                    type="text"
                    placeholder="price_..."
                    value={form.advisoryMonthlyPriceId}
                    onChange={(e) => setForm({ ...form, advisoryMonthlyPriceId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Monthly advisor support</p>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                <span>Values are securely saved to your local <code className="text-brand-300">.env.local</code> and applied immediately.</span>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white text-xs gap-2 px-5 py-2.5 shadow-md font-semibold"
                >
                  <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Saving & Verifying...' : 'Save & Verify Connection'}</span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PRICE CONFIGURATION VALIDATION TABLE */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Product & Price ID Validation Audit</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Crediqly requires exactly three verified Price IDs in Stripe matching the canonical 3-tier offer model.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Plan / Deliverable</th>
                  <th className="py-3 px-4">Expected Price</th>
                  <th className="py-3 px-4">Configured Price ID</th>
                  <th className="py-3 px-4">Stripe Verified Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* 1. Pro */}
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    Crediqly Pro Subscription
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    $39.00 / month
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {data?.prices.pro.id || <span className="text-rose-400">Missing (STRIPE_PRO_PRICE_ID)</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {data?.prices.pro.actual || (data?.prices.pro.configured ? 'Validating...' : '—')}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={data?.prices.pro.valid ? 'success' : 'warning'} className="text-[10px]">
                      {data?.prices.pro.valid ? 'Verified' : 'Configuration Required'}
                    </Badge>
                  </td>
                </tr>

                {/* 2. Advisory Setup */}
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    Premium Advisory Setup Fee
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                    $499.00 one-time
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {data?.prices.advisorySetup.id || (
                      <span className="text-rose-400">Missing (STRIPE_ADVISORY_SETUP_PRICE_ID)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {data?.prices.advisorySetup.actual ||
                      (data?.prices.advisorySetup.configured ? 'Validating...' : '—')}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={data?.prices.advisorySetup.valid ? 'success' : 'warning'} className="text-[10px]">
                      {data?.prices.advisorySetup.valid ? 'Verified' : 'Configuration Required'}
                    </Badge>
                  </td>
                </tr>

                {/* 3. Advisory Monthly */}
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    Premium Advisory Monthly Maintenance
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                    $149.00 / month
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {data?.prices.advisoryMonthly.id || (
                      <span className="text-rose-400">Missing (STRIPE_ADVISORY_MONTHLY_PRICE_ID)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {data?.prices.advisoryMonthly.actual ||
                      (data?.prices.advisoryMonthly.configured ? 'Validating...' : '—')}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={data?.prices.advisoryMonthly.valid ? 'success' : 'warning'} className="text-[10px]">
                      {data?.prices.advisoryMonthly.valid ? 'Verified' : 'Configuration Required'}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 9-ITEM READINESS CHECKLIST */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Payments Readiness Checklist</span>
            </span>
            <Badge variant={data?.overallReady ? 'success' : 'warning'} className="text-xs">
              {data?.overallReady ? '100% Production Ready' : 'Setup Steps Remaining'}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Systematic verification of all infrastructure, security, and webhook prerequisites.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {data?.checklist.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : item.status === 'fail' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.label}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.detail}</p>
                  </div>
                </div>
                <Badge
                  variant={item.status === 'pass' ? 'success' : item.status === 'fail' ? 'danger' : 'warning'}
                  className="text-[10px] uppercase font-bold"
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ENVIRONMENT SECRETS SECURITY POLICY & STATUS */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-400" />
            <span>Environment Variable Status & Security Policy</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Secrets are loaded securely via server environment variables. In strict compliance with security standards, secret tokens are NEVER stored in ordinary database tables or returned to the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { key: 'STRIPE_SECRET_KEY', configured: data?.hasSecretKey, desc: 'Server Secret Key (sk_...)' },
              { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', configured: data?.hasPublishableKey, desc: 'Client Key (pk_...)' },
              { key: 'STRIPE_WEBHOOK_SECRET', configured: data?.hasWebhookSecret, desc: 'Signing Secret (whsec_...)' },
              { key: 'STRIPE_PRO_PRICE_ID', configured: data?.prices.pro.configured, desc: 'Pro $39/mo Price ID' },
              { key: 'STRIPE_ADVISORY_SETUP_PRICE_ID', configured: data?.prices.advisorySetup.configured, desc: 'Advisory $499 Setup ID' },
              { key: 'STRIPE_ADVISORY_MONTHLY_PRICE_ID', configured: data?.prices.advisoryMonthly.configured, desc: 'Advisory $149/mo Price ID' },
            ].map((env) => (
              <div key={env.key} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-white font-bold">{env.key}</span>
                  <Badge variant={env.configured ? 'success' : 'neutral'} className="text-[10px]">
                    {env.configured ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">{env.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-800/40 text-xs text-brand-300 flex items-start gap-3">
            <Shield className="w-5 h-5 flex-shrink-0 text-brand-400 mt-0.5" />
            <p className="leading-relaxed">
              To update these variables in local development, edit your project&apos;s <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-white">.env.local</code> file. In production (Vercel, AWS, or Docker), add them to your hosting provider&apos;s Environment Variables settings and redeploy.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* STEP-BY-STEP OWNER SETUP GUIDE (STEPS 1 TO 9) */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand-400" />
            <span>Owner Setup Guide: Step-by-Step Instructions</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Follow these 9 exact steps to activate and verify production payments in Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <div>
                <strong className="text-white block">Log in to your Stripe Dashboard</strong>
                Navigate to{' '}
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-400 hover:underline inline-flex items-center gap-1"
                >
                  dashboard.stripe.com <ExternalLink className="w-3 h-3" />
                </a>
                . Ensure your payout commercial bank account is connected and verified.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <div>
                <strong className="text-white block">Create Product 1: Crediqly Pro Subscription</strong>
                Under <em>Product catalog</em>, create a product named &quot;Crediqly Pro&quot;. Add a recurring price of{' '}
                <strong className="text-white">$39.00 USD billed monthly</strong>. Copy the generated Price ID (e.g. <code className="font-mono text-emerald-300">price_1...</code>).
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <div>
                <strong className="text-white block">Create Product 2: Premium Advisory Setup Fee</strong>
                Create a product named &quot;Crediqly Premium Advisory — Initial File Audit &amp; Onboarding&quot;. Add a one-time price of{' '}
                <strong className="text-white">$499.00 USD</strong>. Copy the Price ID.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                4
              </span>
              <div>
                <strong className="text-white block">Create Product 3: Premium Advisory Monthly Retainer</strong>
                Under the same product or as a separate price, add a recurring price of{' '}
                <strong className="text-white">$149.00 USD billed monthly</strong>. Copy the Price ID.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                5
              </span>
              <div>
                <strong className="text-white block">Configure API Keys</strong>
                In <em>Developers → API keys</em>, copy your <strong>Publishable key</strong> and <strong>Secret key</strong> (use Test keys for testing, or Live keys when launching).
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                6
              </span>
              <div>
                <strong className="text-white block">Configure Production Webhook</strong>
                In <em>Developers → Webhooks</em>, add an endpoint pointing to:{' '}
                <code className="bg-slate-900 px-2 py-1 rounded font-mono text-teal-300">
                  https://crediqly.vercel.app/api/stripe/webhook
                </code>
                . Select the following 7 events:
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400 font-mono text-[11px]">
                  <li>checkout.session.completed</li>
                  <li>customer.subscription.created</li>
                  <li>customer.subscription.updated</li>
                  <li>customer.subscription.deleted</li>
                  <li>invoice.payment_succeeded</li>
                  <li>invoice.payment_failed</li>
                  <li>payment_intent.succeeded</li>
                </ul>
                Reveal and copy the <strong>Signing secret</strong> (<code className="font-mono text-amber-300">whsec_...</code>).
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                7
              </span>
              <div>
                <strong className="text-white block">Set Environment Variables in Deployment</strong>
                Assign the copied values to the 6 required environment variables in your hosting environment.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                8
              </span>
              <div>
                <strong className="text-white block">Click &quot;Test Stripe Connection&quot;</strong>
                Click the blue test button at the top of this page to run the automated diagnostic validation.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                9
              </span>
              <div>
                <strong className="text-white block">Confirm All 9 Checklist Badges are Green</strong>
                Once all items show <Badge variant="success" className="text-[10px]">PASS</Badge>, real customers can purchase Pro and Premium Advisory safely.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
