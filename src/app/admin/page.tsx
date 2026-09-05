'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Package,
  FileText,
  MousePointerClick,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Landmark,
  DollarSign,
  FileCheck,
  Calendar,
  CreditCard,
  Sliders,
  Settings,
  Zap,
  Receipt,
  Layers,
  Target,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { DashboardSectionControls } from '@/components/admin/DashboardSectionControls';
import { getAdminOverviewStats } from '@/lib/supabase/adminService';
import { getAllProductsAdmin, getAffiliateClicksStats } from '@/lib/supabase/productService';
import { getAllBanksAdmin } from '@/lib/supabase/bankService';
import { getAllContentAdmin } from '@/lib/supabase/contentService';
import { getAllFundingProductsAdmin } from '@/lib/supabase/fundingProductService';
import { getAllFundingApplicationsAdmin } from '@/lib/supabase/fundingApplicationService';
import { getAllConsultationsAdmin } from '@/lib/supabase/consultationService';
import { AdminOverviewStats } from '@/types/admin';
import { Product } from '@/types/product';
import { Bank } from '@/types/bank';
import { ContentPage } from '@/types/content';
import { FundingProduct } from '@/types/fundingProduct';
import { FundingApplication } from '@/types/fundingApplication';
import { Consultation } from '@/types/consultation';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [fundingOptions, setFundingOptions] = useState<FundingProduct[]>([]);
  const [applications, setApplications] = useState<FundingApplication[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [recentContent, setRecentContent] = useState<ContentPage[]>([]);
  const [clickStats, setClickStats] = useState<{
    totalClicks: number;
    byProduct: { productId: string; productName: string; clicks: number; lastClicked?: string }[];
  }>({ totalClicks: 0, byProduct: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    try {
      const [
        statsData,
        prods,
        bankList,
        fundingList,
        content,
        clicks,
        appList,
        consultList,
      ] = await Promise.all([
        getAdminOverviewStats(),
        getAllProductsAdmin().catch(() => []),
        getAllBanksAdmin().catch(() => []),
        getAllFundingProductsAdmin().catch(() => []),
        getAllContentAdmin().catch(() => []),
        getAffiliateClicksStats().catch(() => ({ totalClicks: 0, byProduct: [] })),
        getAllFundingApplicationsAdmin().catch(() => []),
        getAllConsultationsAdmin().catch(() => []),
      ]);

      setStats(statsData);
      setRecentProducts(prods.slice(0, 6));
      setBanks(bankList);
      setFundingOptions(fundingList);
      setRecentContent(content.slice(0, 4));
      setClickStats(clicks);
      setApplications(appList);
      setConsultations(consultList);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
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

  const activeBanksCount = banks.filter((b) => b.status === 'active').length;
  const activeFundingCount = fundingOptions.filter((f) => f.status === 'active').length;
  const pendingConsultationsCount = consultations.filter((c) =>
    ['Requested', 'Rescheduled'].includes(c.status)
  ).length;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingState message="Aggregating platform metrics & controls..." className="text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Owner Control Panel
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Crediqly Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Complete operational control over products, affiliate routing, commercial banking partners, funding options, consultation requests, and customer-facing dashboard sections — without writing code.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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

          <Link href="/admin/banks">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>Banks ({activeBanksCount})</span>
            </Button>
          </Link>

          <Link href="/admin/funding">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Funding ({activeFundingCount})</span>
            </Button>
          </Link>

          <Link href="/admin/consultations">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Consultations ({pendingConsultationsCount})</span>
            </Button>
          </Link>

          <Link href="/admin/products">
            <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 8-Stat KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Customers */}
        <Link href="/admin/customers">
          <Card className="bg-slate-950 border-slate-800 hover:border-brand-500/50 transition-all text-white shadow-xs cursor-pointer h-full">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Customers</span>
                <div className="w-6 h-6 rounded-md bg-brand-500/10 text-brand-400 flex items-center justify-center">
                  <Users className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-white tracking-tight">
                  {stats?.totalUsers || 0}
                </span>
              </div>
              <p className="text-[10px] text-brand-400 mt-0.5 font-medium">Customer Database →</p>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Businesses */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Businesses</span>
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Building2 className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {stats?.totalBusinesses || 0}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Profiles</p>
          </CardContent>
        </Card>

        {/* 3. Active Products */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Products</span>
              <div className="w-6 h-6 rounded-md bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Package className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-teal-400 tracking-tight">
                {stats?.activeProducts || 0}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Live catalog</p>
          </CardContent>
        </Card>

        {/* 4. Commercial Banks */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Banks</span>
              <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Landmark className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-cyan-400 tracking-tight">
                {activeBanksCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Partners</p>
          </CardContent>
        </Card>

        {/* 5. Funding Options */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Funding</span>
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-emerald-400 tracking-tight">
                {activeFundingCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Programs</p>
          </CardContent>
        </Card>

        {/* 6. Tracker Applications */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Tracker Apps</span>
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileCheck className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-indigo-400 tracking-tight">
                {applications.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Tracked</p>
          </CardContent>
        </Card>

        {/* 7. Consultations */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Consults</span>
              <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Calendar className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-amber-400 tracking-tight">
                {consultations.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{pendingConsultationsCount} pending</p>
          </CardContent>
        </Card>

        {/* 8. Affiliate Clicks */}
        <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">Outbound</span>
              <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <MousePointerClick className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-rose-400 tracking-tight">
                {clickStats.totalClicks}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Clicks</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Tier & MRR Telemetry Banner */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Customer Tier Breakdown & Recurring Revenue</span>
              <Badge variant="success" className="text-[10px]">Live Telemetry</Badge>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Customer subscription distributions across Free, Pro ($39/mo), and Done-For-You Advisory ($499 + $149/mo).
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Free Tier</span>
            <span className="text-sm font-extrabold text-white">{stats?.freeUsers ?? 0}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-brand-950/40 border border-brand-800/60 text-center">
            <span className="text-[10px] text-brand-300 block uppercase font-medium">Pro ($39/mo)</span>
            <span className="text-sm font-extrabold text-brand-300">{stats?.proUsers ?? 0}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-center">
            <span className="text-[10px] text-purple-300 block uppercase font-medium">Advisory ($149/mo)</span>
            <span className="text-sm font-extrabold text-purple-300">{stats?.advisoryUsers ?? 0}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center">
            <span className="text-[10px] text-emerald-300 block uppercase font-medium">Live MRR</span>
            <span className="text-sm font-extrabold text-emerald-400">${(stats?.mrr ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD SECTION CONTROLS (OWNER ON/OFF SWITCHES) */}
      <DashboardSectionControls />

      {/* Owner Management Directory (Action Hub) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">
            Owner Management Hub
          </h3>
          <span className="text-xs text-slate-400">
            Direct access to all platform controls
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Monetization & Billing */}
          <Link href="/admin/billing">
            <Card className="bg-slate-950 border-slate-800 hover:border-emerald-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Billing & Revenue
                    </h4>
                    <p className="text-[11px] text-slate-400">Pro ($39/mo) & Advisory ($499+$149)</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Products */}
          <Link href="/admin/products">
            <Card className="bg-slate-950 border-slate-800 hover:border-brand-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                      Credit Products
                    </h4>
                    <p className="text-[11px] text-slate-400">Catalog, pricing & links</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Commercial Banks */}
          <Link href="/admin/banks">
            <Card className="bg-slate-950 border-slate-800 hover:border-cyan-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Commercial Banks
                    </h4>
                    <p className="text-[11px] text-slate-400">Checking accounts & links</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Funding Providers */}
          <Link href="/admin/funding">
            <Card className="bg-slate-950 border-slate-800 hover:border-emerald-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Funding Options
                    </h4>
                    <p className="text-[11px] text-slate-400">Loans, lines & criteria</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Funding Applications */}
          <Link href="/admin/funding-applications">
            <Card className="bg-slate-950 border-slate-800 hover:border-indigo-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Application Tracker
                    </h4>
                    <p className="text-[11px] text-slate-400">Customer pipeline & status</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Advisory & Consultations */}
          <Link href="/admin/consultations">
            <Card className="bg-slate-950 border-slate-800 hover:border-amber-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Advisory & Consultations
                    </h4>
                    <p className="text-[11px] text-slate-400">1-on-1 advisor strategy sessions</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Content CMS */}
          <Link href="/admin/content">
            <Card className="bg-slate-950 border-slate-800 hover:border-teal-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      Content CMS
                    </h4>
                    <p className="text-[11px] text-slate-400">Guides & documentation</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Customer Database */}
          <Link href="/admin/customers">
            <Card className="bg-slate-950 border-slate-800 hover:border-indigo-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Customer Database
                    </h4>
                    <p className="text-[11px] text-slate-400">Dossiers, readiness & billing</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Platform Settings */}
          <Link href="/admin/settings">
            <Card className="bg-slate-950 border-slate-800 hover:border-slate-600 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-slate-200 transition-colors">
                      Platform Settings
                    </h4>
                    <p className="text-[11px] text-slate-400">Security & configuration</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Payments Ledger */}
          <Link href="/admin/payments">
            <Card className="bg-slate-950 border-slate-800 hover:border-emerald-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Payments Ledger
                    </h4>
                    <p className="text-[11px] text-slate-400">Transactions & revenue</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Stripe Infrastructure Setup */}
          <Link href="/admin/settings/stripe">
            <Card className="bg-slate-950 border-slate-800 hover:border-violet-500/50 transition-all p-4 cursor-pointer group shadow-xs border-violet-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                      Stripe Infrastructure
                    </h4>
                    <p className="text-[11px] text-slate-400">Keys, webhooks & pricing</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Affiliates & Partner Placements */}
          <Link href="/admin/affiliates">
            <Card className="bg-slate-950 border-slate-800 hover:border-amber-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Affiliates & Partners
                    </h4>
                    <p className="text-[11px] text-slate-400">Links, placements & CTR</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Roadmap Milestones & Stages */}
          <Link href="/admin/roadmap">
            <Card className="bg-slate-950 border-slate-800 hover:border-indigo-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Roadmap Milestones
                    </h4>
                    <p className="text-[11px] text-slate-400">5 stages & task overrides</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Action Guidance & Recommendations */}
          <Link href="/admin/recommendations">
            <Card className="bg-slate-950 border-slate-800 hover:border-emerald-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Action Guidance
                    </h4>
                    <p className="text-[11px] text-slate-400">What Should I Do Next?</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Card>
          </Link>

          {/* Activity Stream & Admin Audit Trail */}
          <Link href="/admin/activity">
            <Card className="bg-slate-950 border-slate-800 hover:border-blue-500/50 transition-all p-4 cursor-pointer group shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      Audit Trail & Activity
                    </h4>
                    <p className="text-[11px] text-slate-400">Admin logs & platform feeds</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Main Grid: Products & Commercial Banks Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Products and Banks Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Credit Products in Catalog
                </h3>
                <p className="text-xs text-slate-400">
                  Active products appear live in the customer marketplace
                </p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <span>View All Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Affiliate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-sans">
                    {recentProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.featured && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                ★ Featured
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{p.productType || p.slug}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <span className="capitalize">{p.category.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-3 px-4">
                          {p.affiliateEnabled ? (
                            <Badge variant="success" className="text-[10px]">
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="neutral" className="text-[10px]">
                              Direct Web
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {p.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/admin/products?edit=${p.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-brand-400 hover:text-brand-300 hover:bg-slate-900 h-7 px-2"
                            >
                              Edit
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

          {/* Commercial Banks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Commercial Bank Accounts
                </h3>
                <p className="text-xs text-slate-400">
                  Approved checking providers and partner referral destinations
                </p>
              </div>
              <Link
                href="/admin/banks"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Manage Banks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Bank Name</th>
                      <th className="py-3 px-4">Pricing</th>
                      <th className="py-3 px-4">Affiliate Route</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-sans">
                    {banks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{b.name}</span>
                            {b.featured && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                ★ Featured
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{b.shortDescription || b.websiteUrl}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <span>{b.minDeposit} dep • {b.monthlyFee}</span>
                        </td>
                        <td className="py-3 px-4">
                          {b.affiliateEnabled && b.affiliateUrl ? (
                            <Badge variant="warning" className="text-[10px]">
                              Affiliate Partner
                            </Badge>
                          ) : (
                            <Badge variant="neutral" className="text-[10px]">
                              Direct URL
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold text-slate-300">
                            P{b.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant={b.status === 'active' ? 'success' : 'neutral'}
                            className="text-[10px] uppercase"
                          >
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Affiliate Clicks & Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Outbound Referrals
              </h3>
              <p className="text-xs text-slate-400">Direct partner visits</p>
            </div>
          </div>

          <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <span className="text-xs text-slate-400 font-medium">Total Outbound Clicks</span>
                <span className="text-xl font-bold text-rose-400">{clickStats.totalClicks}</span>
              </div>

              {clickStats.byProduct.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <MousePointerClick className="w-6 h-6 mx-auto text-slate-600" />
                  <p>No outbound clicks recorded yet.</p>
                  <p className="text-[11px] text-slate-600">Clicks will log when customers visit providers.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clickStats.byProduct.slice(0, 5).map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-200 truncate">{item.productName}</p>
                        {item.lastClicked && (
                          <p className="text-[10px] text-slate-500">
                            Last {new Date(item.lastClicked).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                        {item.clicks} clicks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational Content Published */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Published Educational Content
              </h4>
              <Link
                href="/admin/content"
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300"
              >
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {recentContent.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-200 truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {c.category.replace(/_/g, ' ')} • {c.readingTime || '5 min read'}
                    </p>
                  </div>
                  <Badge
                    variant={c.status === 'published' ? 'success' : 'neutral'}
                    className="text-[9px] uppercase tracking-wider shrink-0"
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
