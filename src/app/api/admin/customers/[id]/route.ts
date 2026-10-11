import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import { getAdminUserDetail } from '@/lib/supabase/adminService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/customers/[id]
 * Secured Administrator API endpoint providing comprehensive dossier for a single customer.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const verification = verifyAdminRequest(req);
  if (!verification.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Administrator credentials required.', code: 'ADMIN_UNAUTHORIZED' },
      { status: 403 }
    );
  }

  try {
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'Customer ID is required.' }, { status: 400 });
    }

    const detail = await getAdminUserDetail(userId);
    if (!detail) {
      return NextResponse.json({ error: 'Customer not found.', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer: detail });
  } catch (err: any) {
    console.error('Error in /api/admin/customers/[id] GET:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching customer dossier.' },
      { status: 500 }
    );
  }
}
