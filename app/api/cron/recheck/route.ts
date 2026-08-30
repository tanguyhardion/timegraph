import { NextRequest, NextResponse } from 'next/server';
import { getWatches, updateWatch } from '@/lib/db';
import { fetchHtmlWithScrapingAnt } from '@/lib/scraper/scrapingant';
import { parseWatchHtml } from '@/lib/scraper/parser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(request.url);
      const queryKey = url.searchParams.get('key');
      if (queryKey !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
      }
    }

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const ttlHours = parseInt(url.searchParams.get('ttl') || '3', 10);
    const ttlMs = ttlHours * 60 * 60 * 1000;

    const activeWatches = await getWatches({ status: 'wishlist' });
    const now = Date.now();
    const results: any[] = [];

    for (const watch of activeWatches) {
      if (!watch.url) continue;

      const lastScraped = watch.lastScrapedAt ? new Date(watch.lastScrapedAt).getTime() : 0;
      const isFresh = now - lastScraped < ttlMs;

      if (!force && isFresh) {
        results.push({
          id: watch.id,
          title: watch.title,
          status: 'skipped_cached',
          lastScrapedAt: watch.lastScrapedAt,
        });
        continue;
      }

      try {
        const { html, statusCode, source } = await fetchHtmlWithScrapingAnt(watch.url);
        const parsed = parseWatchHtml(html, watch.url);

        const updates: any = {
          lastScrapedAt: new Date().toISOString(),
          scrapeStatus: statusCode === 200 ? 'success' : 'stale',
        };

        const oldPrice = watch.currentPrice;
        const oldAvailability = watch.availability;

        if (parsed.price && parsed.price > 0) {
          updates.currentPrice = parsed.price;
        }
        if (parsed.availability && parsed.availability !== 'unknown') {
          updates.availability = parsed.availability;
        }

        const updated = await updateWatch(watch.id, updates);

        const priceChanged = parsed.price && parsed.price !== oldPrice;
        const availChanged = parsed.availability && parsed.availability !== oldAvailability;

        results.push({
          id: watch.id,
          title: watch.title,
          status: 'updated',
          source,
          oldPrice,
          newPrice: updated?.currentPrice,
          priceChanged,
          oldAvailability,
          newAvailability: updated?.availability,
          availChanged,
          priceDrop: priceChanged && parsed.price! < oldPrice,
        });
      } catch (scrapeErr: any) {
        await updateWatch(watch.id, {
          scrapeStatus: 'stale',
          scrapeErrorMessage: scrapeErr.message || 'Scrape failed',
        });
        results.push({
          id: watch.id,
          title: watch.title,
          status: 'error_stale_retained',
          error: scrapeErr.message,
        });
      }
    }

    const priceDrops = results.filter((r) => r.priceDrop);
    const restocks = results.filter((r) => r.availChanged && r.newAvailability === 'in_stock');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalChecked: activeWatches.length,
        processed: results.filter((r) => r.status === 'updated').length,
        skippedCached: results.filter((r) => r.status === 'skipped_cached').length,
        priceDropsCount: priceDrops.length,
        restocksCount: restocks.length,
      },
      results,
    });
  } catch (error: any) {
    console.error('Cron job execution failure:', error);
    return NextResponse.json({ success: false, error: error.message || 'Cron failed' }, { status: 500 });
  }
}
