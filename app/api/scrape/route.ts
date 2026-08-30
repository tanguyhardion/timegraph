import { NextRequest, NextResponse } from 'next/server';
import { fetchHtmlWithScrapingAnt } from '@/lib/scraper/scrapingant';
import { parseWatchHtml } from '@/lib/scraper/parser';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, apiKey } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL format. Please include https://' }, { status: 400 });
    }

    const { html, statusCode, source } = await fetchHtmlWithScrapingAnt(url, { apiKey });
    const parsedData = parseWatchHtml(html, url);

    return NextResponse.json({
      success: true,
      data: parsedData,
      meta: {
        source,
        statusCode,
        scrapedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract timepiece data from link',
      },
      { status: 500 }
    );
  }
}
