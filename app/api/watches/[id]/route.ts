import { NextRequest, NextResponse } from 'next/server';
import { getWatchById, updateWatch, deleteWatch } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('timegraph_session')?.value;
    if (!verifySessionToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const watch = await getWatchById(id);
    if (!watch) {
      return NextResponse.json({ success: false, error: 'Watch not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: watch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('timegraph_session')?.value;
    if (!verifySessionToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await updateWatch(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Watch not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('timegraph_session')?.value;
    if (!verifySessionToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteWatch(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Watch not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Watch removed from wishlist' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
