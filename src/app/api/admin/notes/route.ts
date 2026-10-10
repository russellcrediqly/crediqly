import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import {
  getAdminCustomerNotes,
  addAdminCustomerNote,
  deleteAdminCustomerNote,
} from '@/lib/supabase/adminNoteService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const verification = verifyAdminRequest(req);
  if (!verification.authorized) {
    return NextResponse.json(
      { error: 'Forbidden: Administrator credentials required.', code: 'ADMIN_UNAUTHORIZED' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Customer userId is required.' },
      { status: 400 }
    );
  }

  try {
    const notes = await getAdminCustomerNotes(userId);
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch customer notes.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const { userId, content } = body;

    if (!userId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'userId and non-empty note content are required.' },
        { status: 400 }
      );
    }

    const note = await addAdminCustomerNote({
      userId,
      adminEmail,
      content: content.trim(),
    });

    return NextResponse.json({ success: true, note });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to save customer note.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const { noteId, userId } = body;

    if (!noteId || !userId) {
      return NextResponse.json(
        { error: 'noteId and userId are required.' },
        { status: 400 }
      );
    }

    await deleteAdminCustomerNote({
      noteId,
      userId,
      adminEmail,
    });

    return NextResponse.json({ success: true, deleted: noteId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete customer note.' },
      { status: 500 }
    );
  }
}
