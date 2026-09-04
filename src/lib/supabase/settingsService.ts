import { supabase, isSupabaseConfigured } from './client';
import {
  PlatformSettings,
  DashboardSectionKey,
  DEFAULT_SECTION_VISIBILITY,
} from '@/types/settings';

const LOCAL_SETTINGS_KEY = 'crediqly_platform_settings';

const DEFAULT_SETTINGS: PlatformSettings = {
  sections: { ...DEFAULT_SECTION_VISIBILITY },
  platformName: 'Crediqly',
  supportEmail: 'support@crediqly.com',
  maintenanceMode: false,
  allowNewSignups: true,
  messaging: {
    dashboardAnnouncement: '',
    announcementEnabled: false,
    welcomeMessage: '',
    consultationMessage: '',
    fundingGuidanceMessage: '',
  },
  roadmapSettings: {
    disabledStages: [],
    disabledTasks: [],
    taskOverrides: {},
  },
  updatedAt: new Date().toISOString(),
};

function getLocalSettings(): PlatformSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      sections: {
        ...DEFAULT_SECTION_VISIBILITY,
        ...(parsed.sections || {}),
      },
      messaging: {
        ...DEFAULT_SETTINGS.messaging,
        ...(parsed.messaging || {}),
      },
      roadmapSettings: {
        disabledStages: [],
        disabledTasks: [],
        taskOverrides: {},
        ...(parsed.roadmapSettings || {}),
      },
    };
  } catch (err) {
    console.error('Failed to read local platform settings:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveLocalSettings(settings: PlatformSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    // Emit events so other components on page react immediately
    window.dispatchEvent(new CustomEvent('crediqly_sections_updated', { detail: settings.sections }));
    window.dispatchEvent(new CustomEvent('crediqly_settings_updated', { detail: settings }));
  } catch (err) {
    console.error('Failed to write local platform settings:', err);
  }
}

function fromDbRow(row: any): PlatformSettings {
  const sections = {
    ...DEFAULT_SECTION_VISIBILITY,
    ...(typeof row.sections === 'object' && row.sections !== null ? row.sections : {}),
  };

  const messaging = {
    dashboardAnnouncement: row.dashboard_announcement || row.messaging?.dashboardAnnouncement || '',
    announcementEnabled: Boolean(row.announcement_enabled ?? row.messaging?.announcementEnabled),
    welcomeMessage: row.welcome_message || row.messaging?.welcomeMessage || '',
    consultationMessage: row.consultation_message || row.messaging?.consultationMessage || '',
    fundingGuidanceMessage: row.funding_guidance || row.messaging?.fundingGuidanceMessage || '',
  };

  const roadmapSettings = {
    disabledStages: row.roadmap_settings?.disabledStages || row.roadmapSettings?.disabledStages || [],
    disabledTasks: row.roadmap_settings?.disabledTasks || row.roadmapSettings?.disabledTasks || [],
    taskOverrides: row.roadmap_settings?.taskOverrides || row.roadmapSettings?.taskOverrides || {},
  };

  return {
    sections,
    platformName: row.platform_name || DEFAULT_SETTINGS.platformName,
    supportEmail: row.support_email || DEFAULT_SETTINGS.supportEmail,
    maintenanceMode: Boolean(row.maintenance_mode),
    allowNewSignups: row.allow_new_signups !== false,
    messaging,
    roadmapSettings,
    updatedAt: row.updated_at || new Date().toISOString(),
    updatedBy: row.updated_by || undefined,
  };
}

/**
 * Fetch current platform settings and dashboard section visibility.
 * Accessible to both admins and customers (read-only for customers).
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        const settings = fromDbRow(data);
        saveLocalSettings(settings);
        return settings;
      }
    } catch (err) {
      console.warn('Supabase platform_settings query failed, using local fallback:', err);
    }
  }

  return getLocalSettings();
}

/**
 * Owner/Admin toggle: Enable or disable a specific dashboard section.
 */
export async function updateSectionVisibility(
  key: DashboardSectionKey,
  enabled: boolean,
  adminUserId?: string
): Promise<PlatformSettings> {
  const current = await getPlatformSettings();
  const updatedSections = {
    ...current.sections,
    [key]: enabled,
  };

  const newSettings: PlatformSettings = {
    ...current,
    sections: updatedSections,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUserId || current.updatedBy,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 'default',
          sections: updatedSections,
          updated_at: newSettings.updatedAt,
          updated_by: newSettings.updatedBy,
        })
        .select()
        .single();

      if (!error && data) {
        const result = fromDbRow(data);
        saveLocalSettings(result);
        return result;
      }
    } catch (err) {
      console.warn('Supabase updateSectionVisibility failed, persisting locally:', err);
    }
  }

  saveLocalSettings(newSettings);
  return newSettings;
}

/**
 * Update global platform settings (branding, support email, maintenance mode, messaging, roadmap).
 */
export async function updatePlatformSettings(
  updates: Partial<PlatformSettings>,
  adminUserId?: string
): Promise<PlatformSettings> {
  const current = await getPlatformSettings();

  const newSettings: PlatformSettings = {
    ...current,
    ...updates,
    sections: {
      ...current.sections,
      ...(updates.sections || {}),
    },
    messaging: {
      ...(current.messaging || {}),
      ...(updates.messaging || {}),
    },
    roadmapSettings: {
      ...(current.roadmapSettings || {}),
      ...(updates.roadmapSettings || {}),
    },
    updatedAt: new Date().toISOString(),
    updatedBy: adminUserId || current.updatedBy,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 'default',
          sections: newSettings.sections,
          platform_name: newSettings.platformName,
          support_email: newSettings.supportEmail,
          maintenance_mode: newSettings.maintenanceMode,
          allow_new_signups: newSettings.allowNewSignups,
          dashboard_announcement: newSettings.messaging?.dashboardAnnouncement || '',
          announcement_enabled: Boolean(newSettings.messaging?.announcementEnabled),
          welcome_message: newSettings.messaging?.welcomeMessage || '',
          consultation_message: newSettings.messaging?.consultationMessage || '',
          funding_guidance: newSettings.messaging?.fundingGuidanceMessage || '',
          roadmap_settings: newSettings.roadmapSettings || {},
          updated_at: newSettings.updatedAt,
          updated_by: newSettings.updatedBy,
        })
        .select()
        .single();

      if (!error && data) {
        const result = fromDbRow(data);
        saveLocalSettings(result);
        return result;
      }
    } catch (err) {
      console.warn('Supabase updatePlatformSettings failed, persisting locally:', err);
    }
  }

  saveLocalSettings(newSettings);
  return newSettings;
}

/**
 * Owner/Admin: Update customer-facing announcements and guidance messages.
 */
export async function updatePlatformMessaging(
  messagingUpdates: Partial<import('@/types/settings').PlatformMessaging>,
  adminUserId?: string
): Promise<PlatformSettings> {
  const current = await getPlatformSettings();
  return updatePlatformSettings(
    {
      messaging: {
        ...(current.messaging || {}),
        ...messagingUpdates,
      },
    },
    adminUserId
  );
}

/**
 * Owner/Admin: Update roadmap stage toggles, task enablement, and title/description overrides.
 */
export async function updateRoadmapSettings(
  roadmapUpdates: Partial<import('@/types/settings').RoadmapAdminSettings>,
  adminUserId?: string
): Promise<PlatformSettings> {
  const current = await getPlatformSettings();
  return updatePlatformSettings(
    {
      roadmapSettings: {
        ...(current.roadmapSettings || {}),
        ...roadmapUpdates,
      },
    },
    adminUserId
  );
}

/**
 * Reset all 9 dashboard sections to enabled (ON).
 */
export async function resetSectionVisibilityDefaults(
  adminUserId?: string
): Promise<PlatformSettings> {
  return updatePlatformSettings(
    {
      sections: { ...DEFAULT_SECTION_VISIBILITY },
    },
    adminUserId
  );
}

