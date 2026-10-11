import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import {
  getAdminUsers,
  getAdminOverviewStats,
  updateAdminUserStatus,
  updateAdminUserProfile,
  updateAdminBusinessProfile,
  triggerAdminPasswordReset,
} from '@/lib/supabase/adminService';
import { AdminUserFilters } from '@/types/admin';
import { UserRole, AccountStatus } from '@/types/user';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/customers
 * Secured Administrator API endpoint providing database-backed, reconciled customer directory data.
 * Reconciles records across profiles, businesses, subscriptions, and payments with zero silent omissions.
 */
export async function GET(req: NextRequest) {
  // 1. Server-side Administrator Authorization Check
  const verification = verifyAdminRequest(req);
  if (!verification.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Administrator credentials required.', code: 'ADMIN_UNAUTHORIZED' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = (searchParams.get('role') || 'all') as AdminUserFilters['role'];
    const status = (searchParams.get('status') || 'all') as AdminUserFilters['status'];
    const plan = (searchParams.get('plan') || 'all') as AdminUserFilters['plan'];
    const accessSource = (searchParams.get('accessSource') || 'all') as AdminUserFilters['accessSource'];
    const billingStatus = searchParams.get('billingStatus') || 'all';
    const onboarding = (searchParams.get('onboarding') || 'all') as AdminUserFilters['onboarding'];
    const sortBy = searchParams.get('sortBy') || 'newest';
    const isFetchAll =
      searchParams.get('all') === 'true' ||
      searchParams.get('fetchAll') === 'true' ||
      (!searchParams.has('page') && !searchParams.has('pageSize'));

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const rawPageSize = searchParams.get('pageSize');
    const pageSize = rawPageSize ? Math.max(1, parseInt(rawPageSize, 10)) : (isFetchAll ? 10000 : 10);

    // 2. Fetch all database-reconciled customers
    const allCustomers = await getAdminUsers({
      search,
      role,
      status,
      plan,
      accessSource,
      billingStatus,
      onboarding,
    });

    // 3. Apply sorting
    const sorted = [...allCustomers];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortBy === 'score') {
      sorted.sort((a, b) => (b.businessReadinessScore || 0) - (a.businessReadinessScore || 0));
    }

    // 4. Calculate pagination
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginated = isFetchAll ? sorted : sorted.slice(start, start + pageSize);

    // 5. Fetch overview stats
    const stats = await getAdminOverviewStats(allCustomers).catch(() => null);

    // 6. Check environment service role status
    let serviceRoleConfigured = false;
    try {
      const { isServiceRoleConfigured } = await import('@/lib/supabase/adminServer');
      serviceRoleConfigured = isServiceRoleConfigured();
    } catch (e) {}

    return NextResponse.json({
      success: true,
      customers: paginated,
      total,
      grandTotal: allCustomers.length,
      page: isFetchAll ? 1 : page,
      pageSize: isFetchAll ? total : pageSize,
      totalPages: isFetchAll ? 1 : totalPages,
      stats,
      diagnostics: {
        serviceRoleConfigured,
        authUsersReconciled: allCustomers.length,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/customers GET:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching admin customers.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/customers
 * Performs administrative actions on a customer record (status update, profile edit, password reset).
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
    const body = await req.json().catch(() => ({}));
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Target userId is required.' }, { status: 400 });
    }

    if (action === 'update_status') {
      const { role = 'user', status = 'active' } = body;
      const res = await updateAdminUserStatus(userId, role as UserRole, status as AccountStatus);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to update user status.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: `Account status updated to ${status}.` });
    }

    if (action === 'update_profile') {
      const { firstName, lastName } = body;
      const res = await updateAdminUserProfile(userId, { firstName, lastName });
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to update profile.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Customer profile updated successfully.' });
    }

    if (action === 'update_business') {
      const { businessData } = body;
      const res = await updateAdminBusinessProfile(userId, businessData || {});
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to update business profile.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Business profile updated successfully.' });
    }

    if (action === 'password_reset') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: 'Customer email is required for password reset.' }, { status: 400 });
      }
      const res = await triggerAdminPasswordReset(email);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to trigger reset.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message || `Password reset link sent to ${email}.` });
    }

    return NextResponse.json({ error: `Unknown customer action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/admin/customers POST:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing customer action.' },
      { status: 500 }
    );
  }
}
