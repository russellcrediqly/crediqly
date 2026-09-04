'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardSectionKey, DEFAULT_SECTION_VISIBILITY, PlatformSettings } from '@/types/settings';
import {
  getPlatformSettings,
  updateSectionVisibility,
  resetSectionVisibilityDefaults,
  updatePlatformSettings,
} from '@/lib/supabase/settingsService';

export function usePlatformSections() {
  const [sections, setSections] = useState<Record<DashboardSectionKey, boolean>>({
    ...DEFAULT_SECTION_VISIBILITY,
  });
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const s = await getPlatformSettings();
      setSections(s.sections);
      setSettings(s);
    } catch (err) {
      console.warn('Failed to load platform sections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const handleSectionsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<DashboardSectionKey, boolean>>;
      if (customEvent.detail) {
        setSections(customEvent.detail);
      } else {
        refresh();
      }
    };

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PlatformSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        if (customEvent.detail.sections) {
          setSections(customEvent.detail.sections);
        }
      } else {
        refresh();
      }
    };

    window.addEventListener('crediqly_sections_updated', handleSectionsUpdate);
    window.addEventListener('crediqly_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('crediqly_sections_updated', handleSectionsUpdate);
      window.removeEventListener('crediqly_settings_updated', handleSettingsUpdate);
    };
  }, [refresh]);

  const toggleSection = async (key: DashboardSectionKey, enabled: boolean) => {
    // Optimistic update
    setSections((prev) => ({ ...prev, [key]: enabled }));
    try {
      const updated = await updateSectionVisibility(key, enabled);
      setSections(updated.sections);
      return updated;
    } catch (err) {
      refresh();
      throw err;
    }
  };

  const resetDefaults = async () => {
    setSections({ ...DEFAULT_SECTION_VISIBILITY });
    try {
      const updated = await resetSectionVisibilityDefaults();
      setSections(updated.sections);
      return updated;
    } catch (err) {
      refresh();
      throw err;
    }
  };

  const setAllSections = async (enabled: boolean) => {
    const next: Record<DashboardSectionKey, boolean> = {
      business_profile: enabled,
      business_readiness: enabled,
      credit_readiness: enabled,
      funding_readiness: enabled,
      roadmap: enabled,
      products: enabled,
      funding: enabled,
      funding_tracker: enabled,
      consultation: enabled,
    };
    setSections(next);
    try {
      const updated = await updatePlatformSettings({ sections: next });
      setSections(updated.sections);
      return updated;
    } catch (err) {
      refresh();
      throw err;
    }
  };

  return {
    sections,
    settings,
    loading,
    refresh,
    toggleSection,
    resetDefaults,
    setAllSections,
  };
}
