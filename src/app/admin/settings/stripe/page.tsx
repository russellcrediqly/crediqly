'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Shield,
  Lock,
  Sparkles,
  FileCheck,
  Check,
  AlertTriangle,
  Key,
  Save,
  Eye,
  EyeOff,
  Copy,
  Terminal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

interface PriceCheck {
  id: string;
  configured: boolean;
  valid: boolean;
  expected: string;
  actual?: string;
  error?: string;
}

interface VerificationData {
  connected: boolean;
  mode: 'test' | 'live' | 'inconsistent' | 'unconfigured';
  apiStatus: 'working' | 'error' | 'unconfigured';
  apiMessage: string;
  webhookStatus: 'active' | 'waiting_for_first_event' | 'not_configured';
  lastEventAt: string | null;
  lastEventType: string | null;
  publishableKey?: string;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  maskedSecretKey?: string;
  hasWebhookSecret: boolean;
  maskedWebhookSecret?: string;
  prices: {
    pro: PriceCheck;
    advisorySetup: PriceCheck;
    advisoryMonthly: PriceCheck;
  };
  checklist: {
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'warning';
    detail: string;
  }[];
  overallReady: boolean;
  vercelEnvSnippet?: string;
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
  const [copiedEnv, setCopiedEnv] = useState(false);

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
        const json: VerificationData = await res.json();
        setData(json);
        // Pre-fill price IDs and publishable key from server
        setForm((prev) => ({
          ...prev,
          publishableKey: prev.publishableKey || json.publishableKey || '',
          proPriceId: prev.proPriceId || json.prices.pro?.id || '',
          advisorySetupPriceId: prev.advisorySetupPriceId || json.prices.advisorySetup?.id || '',
          advisoryMonthlyPriceId: prev.advisoryMonthlyPriceId || json.prices.advisoryMonthly?.id || '',
        }));
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

  const handleTestConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      await fetchStatus();
      setFeedback({
        type: 'success',
        message: 'Stripe live diagnostic test completed.',
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
      const payload: Record<string, string> = {};
      if (form.publishableKey.trim()) payload.publishableKey = form.publishableKey.trim();
      if (form.secretKey.trim()) payload.secretKey = form.secretKey.trim();
      if (form.webhookSecret.trim()) payload.webhookSecret = form.webhookSecret.trim();
      if (form.proPriceId.trim()) payload.proPriceId = form.proPriceId.trim();
      if (form.advisorySetupPriceId.trim()) payload.advisorySetupPriceId = form.advisorySetupPriceId.trim();
      if (form.advisoryMonthlyPriceId.trim()) payload.advisoryMonthlyPriceId = form.advisoryMonthlyPriceId.trim();

      const res = await fetch('/api/stripe/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save Stripe configuration.');
      }

      setFeedback({
        type: 'success',
        message: `${json.message} Status: ${json.connectionMessage}`,
      });

      // Clear the secret fields from input form so they remain masked
      setForm((prev) => ({
        ...prev,
        secretKey: '',
        webhookSecret: '',
      }));

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

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://crediqly.vercel.app/api/stripe/webhook');
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleCopyEnvSnippet = () => {
    const textToCopy =
      data?.vercelEnvSnippet ||
      [
        `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${form.publishableKey || ''}`,
        `STRIPE_SECRET_KEY=${form.secretKey || ''}`,
        `STRIPE_WEBHOOK_SECRET=${form.webhookSecret || ''}`,
        `STRIPE_PRO_PRICE_ID=${form.proPriceId || ''}`,
        `STRIPE_ADVISORY_SETUP_PRICE_ID=${form.advisorySetupPriceId || ''}`,
        `STRIPE_ADVISORY_MONTHLY_PRICE_ID=${form.advisoryMonthlyPriceId || ''}`,
      ].join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Testing Stripe API connection & verifying price IDs..." className="text-white" />
      </div>
    );
  }

  const isConnected = data?.connected ?? false;
  const isReady = data?.overallReady ?? false;
  const mode = data?.mode || 'unconfigured';
  const isLive = mode === 'live';
  const isTest = mode === 'test';

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
          Stripe Diagnostic API: /api/stripe/verify-config
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
                Stripe Payments & Checkout Setup
              </h1>

              {/* Overall Ready Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isReady
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isReady ? 'STRIPE READY ✓' : 'SETUP REQUIRED'}
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
                {mode === 'test' ? 'TEST MODE' : mode === 'live' ? 'LIVE MODE' : 'NOT CONFIGURED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Configure your Stripe credentials, canonical product prices, and verify end-to-end checkout connectivity.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            size="sm"
            onClick={handleCopyEnvSnippet}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs gap-1.5 shadow-sm border border-slate-700"
          >
            {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEnv ? 'Copied to Clipboard!' : 'Copy for Vercel'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 shadow-sm font-semibold"
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

      {/* Real Server Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Stripe API Connection */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Stripe API</span>
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          </div>
          <div className="text-xl font-black text-white">
            {isConnected ? 'CONNECTED ✓' : 'NOT CONFIGURED'}
          </div>
          <p className="text-[11px] text-slate-400 truncate" title={data?.apiMessage}>
            {data?.apiMessage || 'No secret key verified yet.'}
          </p>
        </Card>

        {/* 2. Mode */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Environment Mode</span>
            <Badge variant={isLive ? 'success' : isTest ? 'warning' : 'neutral'} className="text-[10px]">
              {mode.toUpperCase()}
            </Badge>
          </div>
          <div className="text-xl font-black text-white">
            {isLive ? 'LIVE MODE' : isTest ? 'TEST MODE' : 'UNCONFIGURED'}
          </div>
          <p className="text-[11px] text-slate-400">
            {isLive ? 'Real card transactions enabled' : 'Safe simulated test payments'}
          </p>
        </Card>

        {/* 3. Pricing Validation */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Price IDs (3 Tiers)</span>
            <Badge
              variant={
                data?.prices.pro.valid && data?.prices.advisorySetup.valid && data?.prices.advisoryMonthly.valid
                  ? 'success'
                  : 'warning'
              }
              className="text-[10px]"
            >
              {[data?.prices.pro.valid, data?.prices.advisorySetup.valid, data?.prices.advisoryMonthly.valid].filter(Boolean).length}/3 Verified
            </Badge>
          </div>
          <div className="text-xl font-black text-white">
            {data?.prices.pro.valid && data?.prices.advisorySetup.valid && data?.prices.advisoryMonthly.valid
              ? 'VERIFIED ✓'
              : 'INCOMPLETE'}
          </div>
          <p className="text-[11px] text-slate-400">
            Pro ($39) • Advisory Setup ($499) • Retainer ($149)
          </p>
        </Card>

        {/* 4. Webhook Status */}
        <Card className="bg-slate-950 border-slate-800 text-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Webhook Status</span>
            <Badge
              variant={
                data?.webhookStatus === 'active'
                  ? 'success'
                  : data?.webhookStatus === 'waiting_for_first_event'
                  ? 'warning'
                  : 'neutral'
              }
              className="text-[10px]"
            >
              {data?.webhookStatus === 'active'
                ? 'ACTIVE ✓'
                : data?.webhookStatus === 'waiting_for_first_event'
                ? 'WAITING'
                : 'NOT CONFIGURED'}
            </Badge>
          </div>
          <div className="text-xl font-black text-white">
            {data?.webhookStatus === 'active'
              ? 'ACTIVE ✓'
              : data?.webhookStatus === 'waiting_for_first_event'
              ? 'WAITING FOR FIRST EVENT'
              : 'NOT CONFIGURED'}
          </div>
          <p className="text-[11px] text-slate-400">
            {data?.lastEventAt
              ? `Last received: ${new Date(data.lastEventAt).toLocaleTimeString()}`
              : 'Endpoint listening at /api/stripe/webhook'}
          </p>
        </Card>
      </div>

      {/* STRIPE CREDENTIALS & PRICE IDS CONFIGURATION FORM */}
      <Card className="bg-slate-950 border-brand-500/40 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        <CardHeader className="pb-4 border-b border-slate-800/80 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-400" />
                <span>Configure Stripe Credentials & Product IDs</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Enter your credentials below and click <strong>&quot;Save &amp; Verify Stripe&quot;</strong>. Keys are tested with live Stripe API calls immediately.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] border-brand-500/40 text-brand-300 self-start sm:self-center">
              Direct Server Configuration
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
                      {data?.hasSecretKey ? 'Configured ✓' : form.secretKey ? 'Unsaved' : 'Not Configured ⚠'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      placeholder={data?.maskedSecretKey ? `${data.maskedSecretKey} (Leave blank to keep)` : 'sk_test_... or sk_live_...'}
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
                  <p className="text-[10px] text-slate-500">Stored strictly server-side. Never exposed to browsers or logged.</p>
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
                      {data?.hasWebhookSecret ? 'Configured ✓' : form.webhookSecret ? 'Unsaved' : 'Not Configured ⚠'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showWebhookSecret ? 'text' : 'password'}
                      placeholder={data?.maskedWebhookSecret ? `${data.maskedWebhookSecret} (Leave blank to keep)` : 'whsec_...'}
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
                    From Stripe Dashboard &gt; Developers &gt; Webhooks &gt; Select Endpoint &gt; Reveal Signing secret
                  </p>
                </div>
              </div>

              {/* Webhook Endpoint & Events Info Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold text-white">Production Webhook Endpoint & Events</span>
                  </div>
                  <Badge variant={data?.webhookStatus === 'active' ? 'success' : 'neutral'} className="text-[10px] self-start sm:self-auto">
                    {data?.webhookStatus === 'active' ? 'Active & Receiving Events ✓' : 'Listening Endpoint'}
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
                    Required Webhook Events (Enabled in Stripe Dashboard):
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

            {/* Section 2: Canonical Pricing & Product Price IDs */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>2. Canonical Product Price IDs (3 Plans)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Pro Price ID */}
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
                  <p className="text-[10px] text-slate-500">STRIPE_PRO_PRICE_ID</p>
                </div>

                {/* 2. Advisory Setup Price ID */}
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
                  <p className="text-[10px] text-slate-500">STRIPE_ADVISORY_SETUP_PRICE_ID</p>
                </div>

                {/* 3. Advisory Monthly Retainer Price ID */}
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
                  <p className="text-[10px] text-slate-500">STRIPE_ADVISORY_MONTHLY_PRICE_ID</p>
                </div>
              </div>
            </div>

            {/* Submit & Vercel Copy Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                <span>Variables are saved to server runtime and tested immediately.</span>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={handleCopyEnvSnippet}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs gap-1.5 px-4 py-2 border border-slate-700"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Copied to Clipboard!' : 'Copy for Vercel'}</span>
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white text-xs gap-2 px-6 py-2.5 shadow-md font-semibold"
                >
                  <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Verifying...' : 'Save & Verify Stripe'}</span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PRICE VALIDATION AUDIT TABLE */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Product & Price ID Live Verification Audit</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Real Stripe API retrieval validating exact amounts, intervals, and active status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Plan / Offer</th>
                  <th className="py-3 px-4">Expected Price</th>
                  <th className="py-3 px-4">Configured Price ID</th>
                  <th className="py-3 px-4">Stripe Verified Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* Pro */}
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
                      {data?.prices.pro.valid ? 'VERIFIED ✓' : 'REQUIRED ✗'}
                    </Badge>
                  </td>
                </tr>

                {/* Advisory Setup */}
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    Advisory Setup Fee
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
                      {data?.prices.advisorySetup.valid ? 'VERIFIED ✓' : 'REQUIRED ✗'}
                    </Badge>
                  </td>
                </tr>

                {/* Advisory Monthly */}
                <tr className="hover:bg-slate-900/30">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    Advisory Retainer
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
                      {data?.prices.advisoryMonthly.valid ? 'VERIFIED ✓' : 'REQUIRED ✗'}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 7-POINT PRODUCTION READINESS CHECKLIST */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Production Payments Readiness Checklist</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Systematic verification of all infrastructure, security, and webhook prerequisites.
              </CardDescription>
            </div>
            <Badge variant={data?.overallReady ? 'success' : 'warning'} className="text-xs self-start sm:self-auto">
              {data?.overallReady ? 'STRIPE READY ✓' : 'SETUP REQUIRED'}
            </Badge>
          </div>
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

      {/* VERCEL PRODUCTION ENVIRONMENT VARIABLES GUIDE */}
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-brand-400" />
            <span>Vercel Production Deployment Instructions</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            How to ensure your Stripe integration is active on your deployed domain (<code className="text-teal-300">crediqly.vercel.app</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-800/40 text-xs text-brand-300 flex items-start gap-3">
            <Shield className="w-5 h-5 flex-shrink-0 text-brand-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Why Vercel Environment Variables Are Required:</p>
              <p className="text-slate-300 leading-relaxed">
                Vercel runs production apps on serverless execution environments with read-only filesystems. When you click <strong>Save &amp; Verify Stripe</strong>, your keys are saved and verified in the live server runtime immediately. To ensure your keys persist permanently across all future Vercel deployments, copy them to Vercel Project Settings using the button below.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Environment Variables Block</span>
              <Button
                size="sm"
                onClick={handleCopyEnvSnippet}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 px-3 py-1"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'Copied!' : 'Copy All 6 Variables'}</span>
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto select-all">
              {data?.vercelEnvSnippet || 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\nSTRIPE_SECRET_KEY=\nSTRIPE_WEBHOOK_SECRET=\nSTRIPE_PRO_PRICE_ID=\nSTRIPE_ADVISORY_SETUP_PRICE_ID=\nSTRIPE_ADVISORY_MONTHLY_PRICE_ID='}
            </pre>
            <p className="text-[11px] text-slate-400">
              Go to: <strong>Vercel Dashboard &gt; Crediqly Project &gt; Settings &gt; Environment Variables</strong> and paste these keys.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
