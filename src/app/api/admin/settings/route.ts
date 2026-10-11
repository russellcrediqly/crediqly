import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/adminServer';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { PlatformSettings, DEFAULT_SECTION_VISIBILITY } from '@/types/settings';

export const dynamic = 'force-dynamic';

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
  readinessMilestoneSettings: {
    milestoneOverrides: {},
    customMilestones: [],
  },
  updatedAt: new Date().toISOString(),
};

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

  const readinessMilestoneSettings = {
    milestoneOverrides: row.readiness_milestone_settings?.milestoneOverrides || row.readinessMilestoneSettings?.milestoneOverrides || {},
    customMilestones: row.readiness_milestone_settings?.customMilestones || row.readinessMilestoneSettings?.customMilestones || [],
  };

  return {
    sections,
    platformName: row.platform_name || DEFAULT_SETTINGS.platformName,
    supportEmail: row.support_email || DEFAULT_SETTINGS.supportEmail,
    maintenanceMode: Boolean(row.maintenance_mode),
    allowNewSignups: row.allow_new_signups !== false,
    messaging,
    roadmapSettings,
    readinessMilestoneSettings,
    updatedAt: row.updated_at || new Date().toISOString(),
    updatedBy: row.updated_by || undefined,
  };
}

/**
 * GET /api/admin/settings
 * Read current platform settings from database.
 */
export async function GET() {
  const dbClient = getSupabaseAdminClient() || (isSupabaseConfigured ? supabase : null);

  if (dbClient) {
    try {
      const { data, error } = await dbClient
        .from('platform_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ settings: fromDbRow(data) });
      }
    } catch (err) {
      console.warn('GET /api/admin/settings database query failed:', err);
    }
  }

  return NextResponse.json({ settings: DEFAULT_SETTINGS });
}

/**
 * POST /api/admin/settings
 * Securely persist platform settings to Supabase database.
 * Requires administrator verification.
 */
export async function POST(req: NextRequest) {
  const verification = verifyAdminRequest(req);
  if (!verification.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Administrator credentials required.', code: 'ADMIN_UNAUTHORIZED' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updates = body.settings || body;
    const now = new Date().toISOString();

    const dbClient = getSupabaseAdminClient() || (isSupabaseConfigured ? supabase : null);

    if (!dbClient) {
      return NextResponse.json(
        { error: 'Database client not configured.', settings: updates },
        { status: 503 }
      );
    }

    const payload = {
      id: 'default',
      ...(updates.sections ? { sections: updates.sections } : {}),
      ...(updates.platformName ? { platform_name: updates.platformName } : {}),
      ...(updates.supportEmail ? { support_email: updates.supportEmail } : {}),
      ...(updates.maintenanceMode !== undefined ? { maintenance_mode: updates.maintenanceMode } : {}),
      ...(updates.allowNewSignups !== undefined ? { allow_new_signups: updates.allowNewSignups } : {}),
      ...(updates.messaging?.dashboardAnnouncement !== undefined ? { dashboard_announcement: updates.messaging.dashboardAnnouncement } : {}),
      ...(updates.messaging?.announcementEnabled !== undefined ? { announcement_enabled: updates.messaging.announcementEnabled } : {}),
      ...(updates.messaging?.welcomeMessage !== undefined ? { welcome_message: updates.messaging.welcomeMessage } : {}),
      ...(updates.messaging?.consultationMessage !== undefined ? { consultation_message: updates.messaging.consultationMessage } : {}),
      ...(updates.messaging?.fundingGuidanceMessage !== undefined ? { funding_guidance: updates.messaging.fundingGuidanceMessage } : {}),
      ...(updates.roadmapSettings ? { roadmap_settings: updates.roadmapSettings } : {}),
      ...(updates.readinessMilestoneSettings ? { readiness_milestone_settings: updates.readinessMilestoneSettings } : {}),
      updated_at: now,
      updated_by: verification.email || 'system@crediqly.com',
    };

    const { data, error } = await dbClient
      .from('platform_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error upserting platform_settings in database:', error);
      return NextResponse.json(
        { error: `Database write failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: fromDbRow(data),
    });
  } catch (err: any) {
    console.error('POST /api/admin/settings exception:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error saving settings.' },
      { status: 500 }
    );
  }
}
