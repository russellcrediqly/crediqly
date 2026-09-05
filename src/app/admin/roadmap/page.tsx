'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitFork,
  CheckCircle2,
  AlertCircle,
  Edit2,
  RefreshCw,
  Save,
  X,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Layers,
  ChevronRight,
  Target,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  getPlatformSettings,
  updateRoadmapSettings,
} from '@/lib/supabase/settingsService';
import { STAGE_DEFINITIONS, TASK_DEFINITIONS, BaseTaskDefinition } from '@/lib/roadmap/definitions';
import type { RoadmapStageId, TaskPriority } from '@/lib/roadmap/types';
import type { RoadmapAdminSettings } from '@/types/settings';
import { logAdminAction } from '@/lib/supabase/adminAuditService';

const STAGE_KEYS: RoadmapStageId[] = [
  'foundation',
  'credit_foundation',
  'building',
  'optimization',
  'funding',
];

export default function AdminRoadmapManagementPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roadmapSettings, setRoadmapSettings] = useState<RoadmapAdminSettings>({
    disabledStages: [],
    disabledTasks: [],
    taskOverrides: {},
  });

  const [activeStage, setActiveStage] = useState<RoadmapStageId>('foundation');
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null);

  // Edit modal form state
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editWhyItMatters, setEditWhyItMatters] = useState('');
  const [editWhatToDo, setEditWhatToDo] = useState('');
  const [editThingsToConsider, setEditThingsToConsider] = useState('');
  const [editActionLabel, setEditActionLabel] = useState('');
  const [editActionHref, setEditActionHref] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSettings = useCallback(async () => {
    try {
      const data = await getPlatformSettings();
      if (data.roadmapSettings) {
        setRoadmapSettings({
          disabledStages: data.roadmapSettings.disabledStages || [],
          disabledTasks: data.roadmapSettings.disabledTasks || [],
          taskOverrides: data.roadmapSettings.taskOverrides || {},
        });
      }
    } catch (err) {
      console.error('Failed to load roadmap settings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
  };

  const disabledStages = roadmapSettings.disabledStages || [];
  const disabledTasks = roadmapSettings.disabledTasks || [];

  const tasksInActiveStage = TASK_DEFINITIONS.filter((t) => t.stage === activeStage);
  const isStageDisabled = disabledStages.includes(activeStage);

  // Toggle Stage Enabled/Disabled
  const handleToggleStage = async (stageId: RoadmapStageId) => {
    const isCurrentlyDisabled = disabledStages.includes(stageId);
    const updatedStages = isCurrentlyDisabled
      ? disabledStages.filter((s) => s !== stageId)
      : [...disabledStages, stageId];

    const updated = { ...roadmapSettings, disabledStages: updatedStages, disabledTasks };
    setRoadmapSettings(updated);

    try {
      await updateRoadmapSettings(updated);
      await logAdminAction({
        adminEmail: 'crediqly@gmail.com',
        action: 'TOGGLE_ROADMAP_STAGE',
        entityType: 'roadmap',
        entityId: stageId,
        entityName: STAGE_DEFINITIONS[stageId]?.title || stageId,
        description: `Toggled roadmap stage "${stageId}" to ${isCurrentlyDisabled ? 'Active' : 'Disabled'}`,
      });
      showToast(`Stage "${STAGE_DEFINITIONS[stageId]?.title}" ${isCurrentlyDisabled ? 'activated' : 'disabled'}.`);
    } catch (e) {
      showToast('Error updating stage.');
    }
  };

  // Toggle Single Task Enabled/Disabled
  const handleToggleTask = async (taskKey: string) => {
    const isCurrentlyDisabled = disabledTasks.includes(taskKey);
    const updatedTasks = isCurrentlyDisabled
      ? disabledTasks.filter((k) => k !== taskKey)
      : [...disabledTasks, taskKey];

    const updated = { ...roadmapSettings, disabledStages, disabledTasks: updatedTasks };
    setRoadmapSettings(updated);

    try {
      await updateRoadmapSettings(updated);
      await logAdminAction({
        adminEmail: 'crediqly@gmail.com',
        action: 'UPDATE_ROADMAP_MILESTONE',
        entityType: 'roadmap',
        entityId: taskKey,
        entityName: taskKey,
        description: `Toggled milestone task "${taskKey}" to ${isCurrentlyDisabled ? 'Active' : 'Disabled'}`,
      });
      showToast(`Milestone "${taskKey}" ${isCurrentlyDisabled ? 'activated' : 'disabled'}.`);
    } catch (e) {
      showToast('Error updating milestone.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (task: BaseTaskDefinition) => {
    const override = roadmapSettings.taskOverrides?.[task.key] || {};
    setEditingTaskKey(task.key);
    setEditTitle(override.customTitle || task.defaultTitle);
    setEditPriority(override.priority || task.defaultPriority);
    setEditWhyItMatters(override.whyItMatters || task.whyItMatters);
    setEditWhatToDo(override.whatToDo ? override.whatToDo.join('\n') : task.whatToDo.join('\n'));
    setEditThingsToConsider(
      override.thingsToConsider
        ? override.thingsToConsider.join('\n')
        : task.thingsToConsider.join('\n')
    );
    setEditActionLabel(override.actionLabel || task.actionLabel || '');
    setEditActionHref(override.actionHref || task.actionHref || '');
  };

  // Save Task Overrides
  const handleSaveTaskOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskKey) return;

    setSaving(true);
    try {
      const whatToDoArr = editWhatToDo
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const thingsToConsiderArr = editThingsToConsider
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const taskOverride = {
        customTitle: editTitle.trim(),
        priority: editPriority,
        whyItMatters: editWhyItMatters.trim(),
        whatToDo: whatToDoArr.length > 0 ? whatToDoArr : undefined,
        thingsToConsider: thingsToConsiderArr.length > 0 ? thingsToConsiderArr : undefined,
        actionLabel: editActionLabel.trim() || undefined,
        actionHref: editActionHref.trim() || undefined,
      };

      const updatedOverrides = {
        ...roadmapSettings.taskOverrides,
        [editingTaskKey]: taskOverride,
      };

      const updated = { ...roadmapSettings, taskOverrides: updatedOverrides };
      setRoadmapSettings(updated);

      await updateRoadmapSettings(updated);
      await logAdminAction({
        adminEmail: 'crediqly@gmail.com',
        action: 'UPDATE_ROADMAP_MILESTONE',
        entityType: 'roadmap',
        entityId: editingTaskKey,
        entityName: editTitle.trim(),
        description: `Updated milestone content overrides for "${editingTaskKey}"`,
        newValue: taskOverride,
      });

      showToast(`Milestone "${editTitle}" overrides saved successfully.`);
      setEditingTaskKey(null);
    } catch (err) {
      showToast('Error saving milestone changes.');
    } finally {
      setSaving(false);
    }
  };

  // Reset Task to Default
  const handleResetTask = async (taskKey: string) => {
    const updatedOverrides = { ...roadmapSettings.taskOverrides };
    delete updatedOverrides[taskKey];

    const updated = { ...roadmapSettings, taskOverrides: updatedOverrides };
    setRoadmapSettings(updated);

    try {
      await updateRoadmapSettings(updated);
      await logAdminAction({
        adminEmail: 'crediqly@gmail.com',
        action: 'UPDATE_ROADMAP_MILESTONE',
        entityType: 'roadmap',
        entityId: taskKey,
        description: `Reset milestone overrides to factory default for "${taskKey}"`,
      });
      showToast(`Milestone "${taskKey}" reset to factory default.`);
      if (editingTaskKey === taskKey) setEditingTaskKey(null);
    } catch (e) {
      showToast('Error resetting milestone.');
    }
  };

  if (loading) {
    return <LoadingState message="Loading Roadmap Control Center..." className="text-white min-h-[400px]" />;
  }

  const activeStageDef = STAGE_DEFINITIONS[activeStage];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950 border border-brand-500/50 text-white shadow-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Roadmap &amp; Milestone Control Center
            </h1>
            <Badge variant="info" className="text-[11px] font-bold">
              5 Stages Active
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manage commercial milestones, custom instructions, why-it-matters explanations, action destinations, and stage visibility without changing calculation engines.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs font-bold text-slate-300 border-slate-700 hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 5-Stage Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {STAGE_KEYS.map((key) => {
          const def = STAGE_DEFINITIONS[key];
          const isSelected = activeStage === key;
          const isDisabled = disabledStages.includes(key);
          const tasksCount = TASK_DEFINITIONS.filter((t) => t.stage === key).length;

          return (
            <button
              key={key}
              onClick={() => setActiveStage(key)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-brand-600/20 border-brand-500 shadow-md ring-2 ring-brand-500/30'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase text-brand-400">
                  Stage 0{def.order}
                </span>
                {isDisabled ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    Disabled
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Active
                  </span>
                )}
              </div>
              <div className="font-bold text-white text-xs mt-1 truncate">{def.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{tasksCount} Milestones</div>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Banner */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{activeStageDef?.title}</h2>
              <span className="text-xs font-bold text-slate-400">&bull; {activeStageDef?.subtitle}</span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {activeStageDef?.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleToggleStage(activeStage)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isStageDisabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
              }`}
            >
              {isStageDisabled ? 'Enable Entire Stage' : 'Disable Entire Stage'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span>Milestones in this Stage ({tasksInActiveStage.length})</span>
          <span>Click &ldquo;Edit Milestone&rdquo; to customize instructions, title, or links</span>
        </div>

        {tasksInActiveStage.map((task, idx) => {
          const override = roadmapSettings.taskOverrides?.[task.key];
          const hasOverride = Boolean(override);
          const isTaskDisabled = disabledTasks.includes(task.key);
          const effectiveTitle = override?.customTitle || task.defaultTitle;
          const effectivePriority = override?.priority || task.defaultPriority;

          return (
            <Card
              key={task.key}
              className={`bg-slate-900 border transition-all ${
                isTaskDisabled
                  ? 'border-slate-800/50 opacity-60'
                  : hasOverride
                  ? 'border-brand-500/40 shadow-sm'
                  : 'border-slate-800'
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                      #{idx + 1} &bull; {task.key}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        effectivePriority === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : effectivePriority === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {effectivePriority} priority
                    </span>

                    {hasOverride && (
                      <span className="text-[10px] font-bold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/30">
                        ⚡ Custom Overridden
                      </span>
                    )}

                    {isTaskDisabled && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Hidden from Users
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-white tracking-tight">
                    {effectiveTitle}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {override?.whyItMatters || task.whyItMatters}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>
                      {(override?.whatToDo || task.whatToDo).length} Action Steps
                    </span>
                    {(override?.actionHref || task.actionHref) && (
                      <span className="text-brand-400">
                        CTA: {override?.actionLabel || task.actionLabel || 'Take Action'} &rarr; {override?.actionHref || task.actionHref}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleTask(task.key)}
                    className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
                  >
                    {isTaskDisabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Enable
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Disable
                      </>
                    )}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenEdit(task)}
                    className="text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit Milestone
                  </Button>

                  {hasOverride && (
                    <button
                      onClick={() => handleResetTask(task.key)}
                      title="Reset to factory default"
                      className="p-2 text-slate-400 hover:text-rose-400 text-xs font-bold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EDIT MILESTONE MODAL */}
      {editingTaskKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-brand-400 font-bold block">
                  Milestone Editor &bull; {editingTaskKey}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Customize Milestone Guidance &amp; Content
                </h3>
              </div>
              <button
                onClick={() => setEditingTaskKey(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaskOverride} className="space-y-4 text-xs">
              {/* Title & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-300">Milestone Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Priority Level</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Why It Matters */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  Why It Matters (Lender &amp; Bureau Rationale)
                </label>
                <textarea
                  rows={2}
                  value={editWhyItMatters}
                  onChange={(e) => setEditWhyItMatters(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>

              {/* What To Do (Action Steps) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  What To Do (One actionable instruction per line)
                </label>
                <textarea
                  rows={4}
                  value={editWhatToDo}
                  onChange={(e) => setEditWhatToDo(e.target.value)}
                  placeholder="Step 1...&#10;Step 2...&#10;Step 3..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 font-mono text-[11px] leading-relaxed"
                />
              </div>

              {/* Things to Consider */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  Things to Consider (Tips / Pitfalls, one per line)
                </label>
                <textarea
                  rows={3}
                  value={editThingsToConsider}
                  onChange={(e) => setEditThingsToConsider(e.target.value)}
                  placeholder="Keep EIN registration matching SOS exactly...&#10;Avoid personal cell phone on bank file..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 font-mono text-[11px] leading-relaxed"
                />
              </div>

              {/* CTA Label & Destination Href */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Action Button Label (Optional)</label>
                  <input
                    type="text"
                    value={editActionLabel}
                    onChange={(e) => setEditActionLabel(e.target.value)}
                    placeholder="e.g. View Net-30 Vendors"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Action Destination URL (Optional)</label>
                  <input
                    type="text"
                    value={editActionHref}
                    onChange={(e) => setEditActionHref(e.target.value)}
                    placeholder="/products or https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleResetTask(editingTaskKey)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                >
                  Reset to Original Default
                </button>

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTaskKey(null)}
                    className="text-xs text-slate-300 border-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={saving}
                    className="text-xs font-black bg-brand-600 hover:bg-brand-500 text-white shadow-sm"
                  >
                    {saving ? 'Saving...' : 'Save Milestone Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
