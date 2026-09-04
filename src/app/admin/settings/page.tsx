'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  KeyRound,
  Lock,
  Sliders,
  Globe,
  Mail,
  Save,
  Check,
  Megaphone,
  Milestone,
  Sparkles,
  Layers,
  ChevronRight,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { DashboardSectionControls } from '@/components/admin/DashboardSectionControls';
import {
  getPlatformSettings,
  updatePlatformSettings,
  updatePlatformMessaging,
  updateRoadmapSettings,
} from '@/lib/supabase/settingsService';
import type { PlatformSettings, PlatformMessaging, RoadmapAdminSettings } from '@/types/settings';
import { STAGE_DEFINITIONS, TASK_DEFINITIONS } from '@/lib/roadmap/definitions';
import type { RoadmapStageId } from '@/lib/roadmap/types';

const STAGE_KEYS: RoadmapStageId[] = [
  'foundation',
  'credit_foundation',
  'building',
  'optimization',
  'funding',
];

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // General Settings State
  const [platformName, setPlatformName] = useState('Crediqly');
  const [supportEmail, setSupportEmail] = useState('support@crediqly.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewSignups, setAllowNewSignups] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneralSuccess, setSavedGeneralSuccess] = useState(false);

  // Messaging State
  const [messaging, setMessaging] = useState<PlatformMessaging>({
    dashboardAnnouncement: '',
    announcementEnabled: false,
    welcomeMessage: '',
    consultationMessage: '',
    fundingGuidanceMessage: '',
  });
  const [savingMessaging, setSavingMessaging] = useState(false);
  const [savedMessagingSuccess, setSavedMessagingSuccess] = useState(false);

  // Roadmap Settings State
  const [roadmapSettings, setRoadmapSettings] = useState<RoadmapAdminSettings>({
    disabledStages: [],
    disabledTasks: [],
    taskOverrides: {},
  });
  const [selectedRoadmapStage, setSelectedRoadmapStage] = useState<RoadmapStageId>('foundation');
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [savedRoadmapSuccess, setSavedRoadmapSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlatformSettings();
        setPlatformSettings(data);
        setPlatformName(data.platformName);
        setSupportEmail(data.supportEmail);
        setMaintenanceMode(data.maintenanceMode);
        setAllowNewSignups(data.allowNewSignups);
        if (data.messaging) {
          setMessaging(data.messaging);
        }
        if (data.roadmapSettings) {
          setRoadmapSettings(data.roadmapSettings);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setSavedGeneralSuccess(false);

    try {
      const updated = await updatePlatformSettings(
        {
          platformName,
          supportEmail,
          maintenanceMode,
          allowNewSignups,
        },
        user?.id
      );
      setPlatformSettings(updated);
      setSavedGeneralSuccess(true);
      setTimeout(() => setSavedGeneralSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveMessaging = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMessaging(true);
    setSavedMessagingSuccess(false);

    try {
      const updated = await updatePlatformMessaging(messaging, user?.id);
      setPlatformSettings(updated);
      if (updated.messaging) {
        setMessaging(updated.messaging);
      }
      setSavedMessagingSuccess(true);
      setTimeout(() => setSavedMessagingSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update messaging:', err);
    } finally {
      setSavingMessaging(false);
    }
  };

  const handleToggleStage = (stageId: string) => {
    setRoadmapSettings((prev) => {
      const current = prev.disabledStages || [];
      const exists = current.includes(stageId);
      const disabledStages = exists
        ? current.filter((s) => s !== stageId)
        : [...current, stageId];
      return { ...prev, disabledStages };
    });
  };

  const handleToggleTask = (taskKey: string) => {
    setRoadmapSettings((prev) => {
      const current = prev.disabledTasks || [];
      const exists = current.includes(taskKey);
      const disabledTasks = exists
        ? current.filter((k) => k !== taskKey)
        : [...current, taskKey];
      return { ...prev, disabledTasks };
    });
  };

  const handleTaskOverrideTitle = (taskKey: string, title: string) => {
    setRoadmapSettings((prev) => ({
      ...prev,
      taskOverrides: {
        ...prev.taskOverrides,
        [taskKey]: {
          ...prev.taskOverrides?.[taskKey],
          title,
        },
      },
    }));
  };

  const handleSaveRoadmapSettings = async () => {
    setSavingRoadmap(true);
    setSavedRoadmapSuccess(false);

    try {
      const updated = await updateRoadmapSettings(roadmapSettings, user?.id);
      setPlatformSettings(updated);
      if (updated.roadmapSettings) {
        setRoadmapSettings(updated.roadmapSettings);
      }
      setSavedRoadmapSuccess(true);
      setTimeout(() => setSavedRoadmapSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update roadmap settings:', err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  const tasksForSelectedStage = TASK_DEFINITIONS.filter(
    (t) => t.stage === selectedRoadmapStage
  );

  return (
    <div className="space-y-8 max-w-5xl font-sans">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            System Configuration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Admin Settings & Platform Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure live customer dashboard sections, platform branding, database security, and administrator privileges.
        </p>
      </div>

      {/* STRIPE INFRASTRUCTURE SETUP BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black shadow-inner flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Stripe Infrastructure & Payments Setup</h3>
              <Badge variant="info" className="text-[10px]">Major Priority</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify API connectivity, Price IDs ($39 Pro, $499 Setup, $149 Advisory), and Webhook status.
            </p>
          </div>
        </div>
        <Link href="/admin/settings/stripe">
          <Button size="sm" className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5 whitespace-nowrap shadow-sm">
            <span>Stripe Control Center</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* DASHBOARD SECTION CONTROLS */}
      <DashboardSectionControls />

      {/* 2. CUSTOMER ANNOUNCEMENTS & MESSAGING */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4 text-brand-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Customer-Facing Announcements & Messaging</h3>
                <p className="text-[11px] text-slate-400">
                  Broadcast notices and customize advisory text across customer dashboard, consultation, and funding pages.
                </p>
              </div>
            </div>
            {savedMessagingSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Messages saved successfully</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveMessaging} className="space-y-5">
            {/* Live Dashboard Announcement Banner */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Global Dashboard Announcement Banner</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={messaging.announcementEnabled}
                    onChange={(e) =>
                      setMessaging((prev) => ({ ...prev, announcementEnabled: e.target.checked }))
                    }
                    className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    {messaging.announcementEnabled ? 'Active (Visible to Users)' : 'Disabled (Hidden)'}
                  </span>
                </label>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={messaging.dashboardAnnouncement}
                  onChange={(e) =>
                    setMessaging((prev) => ({ ...prev, dashboardAnnouncement: e.target.value }))
                  }
                  placeholder="e.g., Welcome to Crediqly! New Tier 1 vendor credit reporting options have been added."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              {/* Announcement Preview */}
              {messaging.announcementEnabled && messaging.dashboardAnnouncement && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-brand-950/80 to-slate-900 border border-brand-500/30 text-xs flex items-center gap-2 text-brand-200">
                  <Megaphone className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span className="truncate">
                    <strong className="text-brand-300">Live Preview:</strong> {messaging.dashboardAnnouncement}
                  </span>
                </div>
              )}
            </div>

            {/* Custom Welcome Message */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Customer Dashboard Welcome Note (Optional)
              </label>
              <input
                type="text"
                value={messaging.welcomeMessage || ''}
                onChange={(e) =>
                  setMessaging((prev) => ({ ...prev, welcomeMessage: e.target.value }))
                }
                placeholder="e.g., Track your commercial credit profile, complete roadmap milestones, and unlock funding."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Replaces or augments the default greeting message displayed in the customer dashboard hero card.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Consultation Advisory Note */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Consultation Page Advisory Note
                </label>
                <input
                  type="text"
                  value={messaging.consultationMessage || ''}
                  onChange={(e) =>
                    setMessaging((prev) => ({ ...prev, consultationMessage: e.target.value }))
                  }
                  placeholder="e.g., Request a consultation with our commercial advisory team for personalized guidance."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Displayed beneath the main headline at /consultation.
                </span>
              </div>

              {/* Funding Guidance Message */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Funding Recommendations Guidance Note
                </label>
                <input
                  type="text"
                  value={messaging.fundingGuidanceMessage || ''}
                  onChange={(e) =>
                    setMessaging((prev) => ({ ...prev, fundingGuidanceMessage: e.target.value }))
                  }
                  placeholder="e.g., Explore tailored funding options that match your verified business profile."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Displayed in the top header banner at /funding.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={savingMessaging || loading}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingMessaging ? 'Saving Messages...' : 'Save Customer Messaging'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. ROADMAP CONTENT & STAGE CONTROLS */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Milestone className="w-4 h-4 text-brand-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Roadmap Stages & Tasks Controls</h3>
                <p className="text-[11px] text-slate-400">
                  Enable or disable entire stages, deactivate specific tasks, or customize customer-facing task titles.
                </p>
              </div>
            </div>
            {savedRoadmapSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Roadmap updated successfully</span>
              </div>
            )}
          </div>

          {/* Stage Activation Toggles Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">5 Predefined Roadmap Stages</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STAGE_KEYS.map((sKey) => {
                const stageDef = STAGE_DEFINITIONS[sKey];
                const isDisabled = roadmapSettings.disabledStages?.includes(sKey);
                const taskCount = TASK_DEFINITIONS.filter((t) => t.stage === sKey).length;

                return (
                  <div
                    key={sKey}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                      isDisabled
                        ? 'bg-slate-900/50 border-slate-800/80 opacity-60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{stageDef.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {stageDef.subtitle} • {taskCount} base tasks
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStage(sKey)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 transition-colors ${
                        !isDisabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {!isDisabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Task Management for Selected Stage */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-300 block">
                Manage Individual Tasks by Stage:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {STAGE_KEYS.map((sKey) => (
                  <button
                    key={sKey}
                    type="button"
                    onClick={() => setSelectedRoadmapStage(sKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedRoadmapStage === sKey
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {STAGE_DEFINITIONS[sKey].title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Task list for selected stage */}
            <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 max-h-96 overflow-y-auto">
              {tasksForSelectedStage.map((task) => {
                const isTaskDisabled =
                  roadmapSettings.disabledTasks?.includes(task.key) ||
                  roadmapSettings.taskOverrides?.[task.key]?.enabled === false;
                const customTitle = roadmapSettings.taskOverrides?.[task.key]?.title ?? '';

                return (
                  <div
                    key={task.key}
                    className={`p-3 rounded-lg border transition-all ${
                      isTaskDisabled
                        ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500">{task.key}</span>
                          <span className="text-xs font-semibold text-white">
                            {task.defaultTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{task.whyItMatters}</p>

                        <div className="pt-2 flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 shrink-0">
                            Custom Title:
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => handleTaskOverrideTitle(task.key, e.target.value)}
                            placeholder={task.defaultTitle}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-750 text-white text-xs placeholder:text-slate-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.key)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors shrink-0 ${
                          !isTaskDisabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {!isTaskDisabled ? 'Enabled' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveRoadmapSettings}
                disabled={savingRoadmap || loading}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingRoadmap ? 'Saving Roadmap...' : 'Save Roadmap Configuration'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Branding & Global Configuration */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">General Platform Settings</h3>
            </div>
            {savedGeneralSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Settings saved successfully</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Support & Notification Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNewSignups}
                  onChange={(e) => setAllowNewSignups(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Allow New Signups</span>
                  <span className="text-[10px] text-slate-400 block">
                    Permit new founders to register through /signup
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Maintenance Mode</span>
                  <span className="text-[10px] text-slate-400 block">
                    Display notice banner for customer sessions
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={savingGeneral || loading}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingGeneral ? 'Saving...' : 'Save Configuration'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Admin Session Profile Card */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">Administrator Identity</h3>
            </div>
            <Badge variant="success" className="text-[10px] uppercase font-bold">
              Verified Admin
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Primary Admin Email</span>
              <span className="font-mono text-white font-semibold">
                {user?.email || 'crediqly@gmail.com'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Assigned Role</span>
              <div className="flex items-center gap-1.5 text-brand-400 font-semibold uppercase">
                <span>{user?.role || 'admin'}</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">(full read & write permissions)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database & Environment Info */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-900">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Database & Backend Platform</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Supabase Project ID</span>
              <span className="font-mono text-white font-semibold">dfdvmegzwgogonefjihs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Security Mode</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Row Level Security (RLS) Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Role Management Guidance */}
      <Card className="bg-slate-950 border-slate-800 text-white shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-900">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Administrator Role Assignment</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              To maintain strict enterprise security, admin privileges cannot be assigned from public sign-up or customer screens. All administrative rights are cryptographically verified through Supabase database roles.
            </p>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-200 block text-[11px]">
                Assigning Admin Rights to a Team Member:
              </span>
              <p className="text-[11px] text-slate-400">
                In your Supabase project SQL Editor, execute:
              </p>
              <code className="block p-3 rounded bg-slate-950 border border-slate-800 text-brand-300 font-mono text-[11px] select-all">
                UPDATE public.profiles SET role = &apos;admin&apos; WHERE email = &apos;user@domain.com&apos;;
              </code>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Normal users cannot modify their own role. RLS blocks unauthorized privilege escalation.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
