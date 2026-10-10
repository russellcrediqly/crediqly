import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import {
  grantAdminPlanAccess,
  revokeAdminPlanAccess,
  extendAdminPlanAccess,
} from '@/lib/supabase/subscriptionService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Server-side Administrator Authorization Check
  const verification = verifyAdminRequest(req);
  if (!verification.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Administrator credentials required.', code: 'ADMIN_UNAUTHORIZED' },
      { status: 403 }
    );
  }

  const adminEmail = verification.email || 'system@crediqly.com';

  try {
    const body = await req.json().catch(() => ({}));
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Target userId is required.' },
        { status: 400 }
      );
    }

    // A. Manually Grant Plan or Complimentary Access
    if (action === 'grant') {
      const { plan, grantType = 'admin_grant', durationMonths, isIndefinite, reason } = body;

      if (!plan || (plan !== 'foundation' && plan !== 'guided')) {
        return NextResponse.json(
          { error: 'Valid plan (foundation or guided) is required.' },
          { status: 400 }
        );
      }

      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: 'A clear reason for the manual entitlement grant is required.' },
          { status: 400 }
        );
      }

      const updated = await grantAdminPlanAccess({
        userId,
        plan,
        grantType,
        durationMonths: durationMonths ? Number(durationMonths) : undefined,
        isIndefinite: Boolean(isIndefinite),
        reason: reason.trim(),
        adminEmail,
      });

      return NextResponse.json({
        success: true,
        action: 'grant',
        subscription: updated,
      });
    }

    // B. Revoke Administrative Access
    if (action === 'revoke') {
      const { reason } = body;
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: 'A revocation reason is required for administrative audit integrity.' },
          { status: 400 }
        );
      }

      const updated = await revokeAdminPlanAccess({
        userId,
        reason: reason.trim(),
        adminEmail,
      });

      return NextResponse.json({
        success: true,
        action: 'revoke',
        subscription: updated,
      });
    }

    // C. Extend Administrative Entitlement
    if (action === 'extend') {
      const { additionalMonths = 1, reason } = body;
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: 'An extension reason is required for administrative audit integrity.' },
          { status: 400 }
        );
      }

      const updated = await extendAdminPlanAccess({
        userId,
        additionalMonths: Number(additionalMonths),
        reason: reason.trim(),
        adminEmail,
      });

      return NextResponse.json({
        success: true,
        action: 'extend',
        subscription: updated,
      });
    }

    return NextResponse.json(
      { error: `Unknown entitlement action: ${action}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Admin entitlements API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing entitlement.' },
      { status: 500 }
    );
  }
}
