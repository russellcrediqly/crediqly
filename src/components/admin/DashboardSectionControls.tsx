'use client';

import React, { useState } from 'react';
import {
  PREDEFINED_DASHBOARD_SECTIONS,
  DashboardSectionKey,
} from '@/types/settings';
import { usePlatformSections } from '@/lib/usePlatformSections';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  DollarSign,
  GitFork,
  Package,
  TrendingUp,
  FileCheck,
  Calendar,
  Check,
  Sliders,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const ICON_MAP: Record<DashboardSectionKey, React.ComponentType<{ className?: string }>> = {
  business_profile: Building2,
  business_readiness: ShieldCheck,
  credit_readiness: CreditCard,
  funding_readiness: DollarSign,
  roadmap: GitFork,
  products: Package,
  funding: TrendingUp,
  funding_tracker: FileCheck,
  consultation: Calendar,
};

export const DashboardSectionControls: React.FC = () => {
  const { sections, loading, toggleSection, resetDefaults, setAllSections } = usePlatformSections();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const activeCount = Object.values(sections).filter(Boolean).length;
  const totalCount = PREDEFINED_DASHBOARD_SECTIONS.length;

  const showToast = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => {
      setSaveMessage(null);
    }, 3500);
  };

  const handleToggle = async (key: DashboardSectionKey, currentVal: boolean) => {
    setSavingKey(key);
    try {
      await toggleSection(key, !currentVal);
      showToast(`Updated "${key.replace(/_/g, ' ')}" visibility to ${!currentVal ? 'Active' : 'Disabled'}.`);
    } catch (err) {
      console.error('Failed to toggle section:', err);
    } finally {
      setSavingKey(null);
    }
  };

  const handleEnableAll = async () => {
    setActionLoading(true);
    try {
      await setAllSections(true);
      showToast('All 9 dashboard sections are now enabled and visible to customers.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableAll = async () => {
    setActionLoading(true);
    try {
      await setAllSections(false);
      showToast('All customer dashboard sections have been hidden.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    setActionLoading(true);
    try {
      await resetDefaults();
      showToast('Reset all dashboard section controls to factory defaults (all enabled).');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card className="bg-slate-950 border-slate-800 text-white shadow-md overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Header and Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Customer Dashboard Section Controls
              </h3>
              <Badge
                variant={activeCount === totalCount ? 'success' : activeCount > 0 ? 'warning' : 'neutral'}
                className="text-[10px] font-bold uppercase tracking-wider ml-1"
              >
                {activeCount} / {totalCount} Active
              </Badge>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Instantly toggle predefined sections on or off. When a section is disabled, it is hidden from the customer dashboard and removed from customer navigation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading || loading}
              onClick={handleEnableAll}
              className="text-xs border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white gap-1.5 h-8"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enable All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading || loading}
              onClick={handleDisableAll}
              className="text-xs border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white gap-1.5 h-8"
            >
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Disable All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading || loading}
              onClick={handleResetDefaults}
              className="text-xs border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white gap-1.5 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
              <span>Reset Defaults</span>
            </Button>
          </div>
        </div>

        {/* Live Notification Feedback */}
        {saveMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span className="font-medium">{saveMessage}</span>
          </div>
        )}

        {/* 9 Predefined Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PREDEFINED_DASHBOARD_SECTIONS.map((section) => {
            const Icon = ICON_MAP[section.key] || Sparkles;
            const isEnabled = sections[section.key] !== false;
            const isSaving = savingKey === section.key;

            return (
              <div
                key={section.key}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isEnabled
                    ? 'bg-slate-900/80 border-slate-700/80 shadow-xs hover:border-slate-600'
                    : 'bg-slate-950/80 border-slate-850 opacity-75'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isEnabled
                            ? 'bg-brand-500/15 text-brand-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-tight">
                          {section.name}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-400 block -mt-0.5">
                          {section.key}
                        </span>
                      </div>
                    </div>

                    {/* Accessible Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${section.name}`}
                      disabled={loading || isSaving}
                      onClick={() => handleToggle(section.key, isEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                        isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed min-h-[34px]">
                    {section.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">
                    Route: <span className="text-slate-300">{section.path || '/dashboard'}</span>
                  </span>
                  {isEnabled ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Visible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      Hidden
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational Security Callout */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Automatic Propagation:</strong> Toggling any dashboard section immediately syncs with your Supabase database. Customer client layouts reflect these permissions instantly without requiring customers to manually clear browser storage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
