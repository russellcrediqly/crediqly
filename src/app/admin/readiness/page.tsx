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
  Sliders,
  Plus,
  Save,
  RotateCcw,
  X,
  UserCheck,
  Info,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { getAdminUsers } from '@/lib/supabase/adminService';
import { AdminUserListItem } from '@/types/admin';
import {
  OFFICIAL_READINESS_MILESTONES,
  ReadinessMilestoneDefinition,
  MilestoneCompletionType,
  MilestoneCategory,
  validateMilestoneWeights,
} from '@/lib/readiness/readinessMilestoneEngine';
import { getPlatformSettings, updatePlatformSettings } from '@/lib/supabase/settingsService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function AdminReadinessPage() {
  const [activeTab, setActiveTab] = useState<'milestones' | 'audit'>('milestones');
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Milestones Engine Admin State
  const [milestones, setMilestones] = useState<ReadinessMilestoneDefinition[]>(OFFICIAL_READINESS_MILESTONES);
  const [savingMilestones, setSavingMilestones] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // User Verification Modal State
  const [verifyUserModal, setVerifyUserModal] = useState<AdminUserListItem | null>(null);
  const [userMilestoneStatus, setUserMilestoneStatus] = useState<Record<string, boolean>>({});
  const [verifyingKey, setVerifyingKey] = useState<string | null>(null);

  // New Milestone Form State
  const [newForm, setNewForm] = useState<{
    title: string;
    description: string;
    whyItMatters: string;
    category: MilestoneCategory;
    weight: number;
    completionType: MilestoneCompletionType;
    actionLabel: string;
    actionHref: string;
  }>({
    title: '',
    description: '',
    whyItMatters: '',
    category: 'foundation',
    weight: 5,
    completionType: 'customer_confirmation',
    actionLabel: 'Complete Milestone',
    actionHref: '/dashboard',
  });

  const fetchData = useCallback(async () => {
    try {
      const [usersData, settingsData] = await Promise.all([
        getAdminUsers().catch(() => []),
        getPlatformSettings().catch(() => null),
      ]);

      setUsers(usersData);

      // Merge milestone settings
      if (settingsData?.readinessMilestoneSettings?.milestoneOverrides) {
        const overrides = settingsData.readinessMilestoneSettings.milestoneOverrides;
        const custom = settingsData.readinessMilestoneSettings.customMilestones || [];

        const mergedOfficial = OFFICIAL_READINESS_MILESTONES.map((def) => {
          if (overrides[def.id]) {
            return { ...def, ...overrides[def.id] };
          }
          return def;
        });

        setMilestones([...mergedOfficial, ...custom]);
      } else {
        setMilestones(OFFICIAL_READINESS_MILESTONES);
      }
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

  // Weight validation calculation
  const totalActiveWeight = useMemo(() => {
    return milestones
      .filter((m) => m.active)
      .reduce((sum, m) => sum + (Number(m.weight) || 0), 0);
  }, [milestones]);

  const isWeightBalanced = totalActiveWeight === 100;

  // Milestone modification handlers
  const handleWeightChange = (id: string, val: number) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, weight: Math.max(0, val) } : m))
    );
  };

  const handleActiveToggle = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleCompletionTypeChange = (id: string, completionType: MilestoneCompletionType) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completionType } : m))
    );
  };

  const handleSaveMilestones = async () => {
    setSavingMilestones(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const milestoneOverrides: Record<string, any> = {};
      const customMilestones: ReadinessMilestoneDefinition[] = [];

      milestones.forEach((m) => {
        const isCustom = !OFFICIAL_READINESS_MILESTONES.some((o) => o.id === m.id);
        if (isCustom) {
          customMilestones.push(m);
        } else {
          milestoneOverrides[m.id] = {
            weight: Number(m.weight),
            active: m.active,
            completionType: m.completionType,
            title: m.title,
            description: m.description,
            whyItMatters: m.whyItMatters,
            actionLabel: m.actionLabel,
            actionHref: m.actionHref,
          };
        }
      });

      await updatePlatformSettings({
        readinessMilestoneSettings: {
          milestoneOverrides,
          customMilestones,
        },
      });

      setSaveMessage('Milestone weights and configuration successfully saved and applied to all customer journeys.');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save milestone settings.');
    } finally {
      setSavingMilestones(false);
    }
  };

  const handleResetDefaults = () => {
    setMilestones(OFFICIAL_READINESS_MILESTONES);
    setSaveMessage('Reset to official Crediqly 14 milestones (100 points total). Click "Save Changes" to apply.');
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title.trim()) return;

    const newDef: ReadinessMilestoneDefinition = {
      id: `m_custom_${Date.now()}`,
      title: newForm.title.trim(),
      description: newForm.description.trim() || 'Custom administrative readiness milestone.',
      whyItMatters: newForm.whyItMatters.trim() || 'Demonstrates additional commercial compliance criteria.',
      category: newForm.category,
      categoryLabel:
        newForm.category === 'foundation'
          ? 'Foundation & Entity'
          : newForm.category === 'bureau_tradelines'
          ? 'Credit Profile & Tradelines'
          : newForm.category === 'revolving_seasoning'
          ? 'Revolving Credit & Seasoning'
          : 'Funding Preparation & Profile',
      stepOrder: milestones.length + 1,
      weight: Number(newForm.weight) || 5,
      active: true,
      completionType: newForm.completionType,
      actionLabel: newForm.actionLabel.trim() || 'View Step',
      actionHref: newForm.actionHref.trim() || '/dashboard',
      verifier: (_p, tags) => tags.has(`m_custom_${Date.now()}`),
    };

    setMilestones((prev) => [...prev, newDef]);
    setIsAddModalOpen(false);
    setNewForm({
      title: '',
      description: '',
      whyItMatters: '',
      category: 'foundation',
      weight: 5,
      completionType: 'customer_confirmation',
      actionLabel: 'Complete Milestone',
      actionHref: '/dashboard',
    });
    setSaveMessage('New milestone added. Please ensure active weights total exactly 100 points, then click "Save Changes".');
  };

  // Open user milestone verification modal
  const openUserVerification = (u: AdminUserListItem) => {
    setVerifyUserModal(u);
    // Initialize completed status
    const initialMap: Record<string, boolean> = {};
    milestones.forEach((m) => {
      // If user has high score or completed profile, foundation milestones are completed
      const isComplete =
        (m.category === 'foundation' && (u.businessReadinessScore || 0) >= 60) ||
        (m.category === 'bureau_tradelines' && (u.creditReadinessScore || 0) >= 60) ||
        (u.businessReadinessScore || 0) >= 80;
      initialMap[m.id] = isComplete;
    });
    setUserMilestoneStatus(initialMap);
  };

  const handleToggleUserMilestone = async (milestoneId: string) => {
    if (!verifyUserModal) return;
    setVerifyingKey(milestoneId);

    const nextState = !userMilestoneStatus[milestoneId];
    setUserMilestoneStatus((prev) => ({ ...prev, [milestoneId]: nextState }));

    try {
      if (isSupabaseConfigured && supabase && verifyUserModal.businessId) {
        // Tag in funding_purpose
        const tag = `__task:${milestoneId}`;
        const { data: bData } = await supabase
          .from('businesses')
          .select('funding_purpose')
          .eq('id', verifyUserModal.businessId)
          .single();

        let currentTags: string[] = bData?.funding_purpose || [];
        if (nextState) {
          if (!currentTags.includes(tag)) currentTags = [...currentTags, tag];
        } else {
          currentTags = currentTags.filter((t) => t !== tag);
        }

        await supabase
          .from('businesses')
          .update({ funding_purpose: currentTags })
          .eq('id', verifyUserModal.businessId);
      }
    } catch (err) {
      console.warn('Failed to update user milestone via Supabase:', err);
    } finally {
      setVerifyingKey(null);
    }
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
              Scoring Engine &amp; Milestone Controls
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              0–100 Readiness Journey Configuration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Readiness &amp; Funding Journey Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure step weights, enable/disable milestones, validate mathematical 100-point balance, and audit client scores.
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
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Milestone Engine &amp; Weights (100 pts)</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Scoring Engine Audit &amp; Users</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: READINESS MILESTONES & WEIGHT CONFIGURATION                     */}
      {/* ===================================================================== */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {/* Top Weight Status & Action Header */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">
                    Active Milestones &amp; Mathematical Weight Balance
                  </h3>
                  <Badge
                    variant={isWeightBalanced ? 'success' : 'danger'}
                    className="text-xs font-mono font-bold"
                  >
                    {isWeightBalanced ? '✓ 100 / 100 pts (Balanced)' : `⚠️ ${totalActiveWeight} / 100 pts (Unbalanced)`}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every Crediqly customer score is derived strictly as the sum of completed active milestone weights.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDefaults}
                  className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs border-brand-500/40 bg-brand-950/40 text-brand-300 hover:bg-brand-900/60 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Step</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveMilestones}
                  disabled={savingMilestones}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingMilestones ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </div>

            {/* Validation Warning Alert */}
            {!isWeightBalanced && (
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Weight Validation Warning:</span>
                  <span>
                    Total active weights equal <strong>{totalActiveWeight} points</strong>. To ensure integrity of the 0–100 score, the sum of all active milestone weights must equal exactly <strong>100 points</strong>. Adjust the points below so the total equals 100.
                  </span>
                </div>
              </div>
            )}

            {/* Save Notice */}
            {saveMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </div>

          {/* Milestones Management Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Milestone Title &amp; Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Completion Verification Type</th>
                    <th className="py-3 px-4 w-28 text-center">Weight (pts)</th>
                    <th className="py-3 px-4 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {milestones.map((m, idx) => (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        !m.active ? 'opacity-50 bg-slate-950/40' : ''
                      }`}
                    >
                      {/* Step Number */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">{m.title}</span>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {m.description}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {m.categoryLabel}
                        </span>
                      </td>

                      {/* Completion Type Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={m.completionType}
                          onChange={(e) =>
                            handleCompletionTypeChange(m.id, e.target.value as MilestoneCompletionType)
                          }
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-brand-500 focus:outline-none"
                        >
                          <option value="system_verified">System Verified (Profile Data)</option>
                          <option value="customer_confirmation">Customer Confirmation (Modal)</option>
                          <option value="admin_verified">Admin Verified Only</option>
                        </select>
                      </td>

                      {/* Weight Input */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={m.weight}
                            onChange={(e) => handleWeightChange(m.id, parseInt(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-xs rounded-lg px-2 py-1.5 focus:border-brand-500 focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-500 font-mono">pts</span>
                        </div>
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleActiveToggle(m.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                            m.active
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {m.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SCORING ENGINE AUDIT & USERS                                   */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
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

          {/* Business Readiness Audit Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Client Scoring Audit</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live audit view of business readiness metrics, client milestones, and manual verification controls.
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
                    <th className="py-3 px-4 text-right">Milestone Actions</th>
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
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUserVerification(u)}
                              className="text-xs text-brand-300 border-brand-500/30 hover:bg-brand-950/60 gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Verify Milestones</span>
                            </Button>
                            <Link href={`/admin/users/${u.userId}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: ADD NEW MILESTONE MODAL                                      */}
      {/* ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                <span>Add New Readiness Milestone</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomMilestone} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Trade Reference Verification"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Category</label>
                  <select
                    value={newForm.category}
                    onChange={(e) =>
                      setNewForm({ ...newForm, category: e.target.value as MilestoneCategory })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="foundation">Foundation &amp; Entity</option>
                    <option value="bureau_tradelines">Credit Profile &amp; Tradelines</option>
                    <option value="revolving_seasoning">Revolving Credit &amp; Seasoning</option>
                    <option value="funding_readiness">Funding Preparation &amp; Profile</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Weight (pts)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newForm.weight}
                    onChange={(e) => setNewForm({ ...newForm, weight: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Verification Type</label>
                <select
                  value={newForm.completionType}
                  onChange={(e) =>
                    setNewForm({
                      ...newForm,
                      completionType: e.target.value as MilestoneCompletionType,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value="customer_confirmation">Customer Confirmation (Modal)</option>
                  <option value="system_verified">System Verified (Profile Data)</option>
                  <option value="admin_verified">Admin Verified Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Description</label>
                <textarea
                  rows={2}
                  placeholder="What does the customer do to achieve this milestone?"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Why It Matters For Funding</label>
                <textarea
                  rows={2}
                  placeholder="Why underwriters require this milestone"
                  value={newForm.whyItMatters}
                  onChange={(e) => setNewForm({ ...newForm, whyItMatters: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
                >
                  Add Milestone
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: USER MILESTONE VERIFICATION MODAL                            */}
      {/* ===================================================================== */}
      {verifyUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block">
                  Client Readiness Audit
                </span>
                <h3 className="text-base font-bold text-white">
                  Verify Milestones for {verifyUserModal.businessName || verifyUserModal.fullName}
                </h3>
              </div>
              <button
                onClick={() => setVerifyUserModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {milestones
                .filter((m) => m.active)
                .map((m) => {
                  const isDone = Boolean(userMilestoneStatus[m.id]);
                  const isPending = verifyingKey === m.id;

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{m.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-brand-300">
                            +{m.weight} pts
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">{m.categoryLabel}</span>
                      </div>

                      <Button
                        variant={isDone ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleUserMilestone(m.id)}
                        disabled={isPending}
                        className={`text-xs font-bold gap-1 ${
                          isDone
                            ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <span>Mark Verified</span>
                        )}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setVerifyUserModal(null)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
