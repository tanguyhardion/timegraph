import { NextRequest, NextResponse } from 'next/server';
import { getWatchById, updateWatch } from '@/lib/db';
import { fetchHtmlWithScrapingAnt } from '@/lib/scraper/scrapingant';
import { parseWatchHtml } from '@/lib/scraper/parser';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getWatchById(id);

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Watch not found' }, { status: 404 });
    }

    if (!existing.url) {
      return NextResponse.json({ success: false, error: 'Watch does not have a valid link to sync' }, { status: 400 });
    }

    const { html, statusCode, source } = await fetchHtmlWithScrapingAnt(existing.url);
    const parsed = parseWatchHtml(html, existing.url);

    const now = new Date().toISOString();
    const updates: any = {
      lastScrapedAt: now,
      scrapeStatus: statusCode === 200 ? 'success' : 'stale',
    };

    if (parsed.price && parsed.price > 0) {
      updates.currentPrice = parsed.price;
      if (parsed.currency) updates.currency = parsed.currency;
    }

    if (parsed.availability && parsed.availability !== 'unknown') {
      updates.availability = parsed.availability;
    }

    if (parsed.specs) {
      updates.specs = {
        ...existing.specs,
        ...parsed.specs,
      };
    }

    if (parsed.imageUrl && (!existing.imageUrl || existing.imageUrl.includes('placeholder'))) {
      updates.imageUrl = parsed.imageUrl;
    }

    const updated = await updateWatch(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Watch synchronized with latest retailer data',
      data: updated,
      meta: { source, statusCode, syncedAt: now },
    });
  } catch (error: any) {
    console.error('Error syncing watch:', error);
    return NextResponse.json({ success: false, error: error.message || 'Sync failed' }, { status: 500 });
  }
}
