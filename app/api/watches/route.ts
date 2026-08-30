import { NextRequest, NextResponse } from 'next/server';
import { getWatches, createWatch, reorderWatches } from '@/lib/db';
import { FilterOptions } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as FilterOptions['status'] | null;
    const occasion = searchParams.get('occasion') as FilterOptions['occasion'] | null;
    const brand = searchParams.get('brand') || undefined;
    const availability = searchParams.get('availability') as FilterOptions['availability'] | null;
    const searchQuery = searchParams.get('q') || undefined;
    const sortBy = (searchParams.get('sort') as FilterOptions['sortBy']) || 'order';

    const filters: Partial<FilterOptions> = {
      ...(status ? { status } : {}),
      ...(occasion ? { occasion } : {}),
      ...(brand ? { brand } : {}),
      ...(availability ? { availability } : {}),
      ...(searchQuery ? { searchQuery } : {}),
      sortBy,
    };

    const watches = await getWatches(filters);
    return NextResponse.json({ success: true, count: watches.length, data: watches });
  } catch (error: any) {
    console.error('Error fetching watches:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch watches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'reorder' && Array.isArray(body.orderedIds)) {
      await reorderWatches(body.orderedIds);
      const watches = await getWatches();
      return NextResponse.json({ success: true, message: 'Watches reordered', data: watches });
    }

    if (!body.title && !body.model) {
      return NextResponse.json({ success: false, error: 'Title or model is required' }, { status: 400 });
    }

    const created = await createWatch(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating watch:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create watch' }, { status: 500 });
  }
}
