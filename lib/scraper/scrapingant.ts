/**
 * ScrapingAnt Client Integration
 * Handles JS-rendered scraping with proxy rotation via ScrapingAnt API,
 * with fallback to native fetch.
 */

export interface ScrapingAntOptions {
  apiKey?: string;
  browser?: boolean;
  proxyType?: 'datacenter' | 'residential';
  proxyCountry?: string;
  timeoutMs?: number;
}

export interface ScrapingAntResult {
  html: string;
  statusCode: number;
  source: 'scrapingant' | 'direct';
}

export async function fetchHtmlWithScrapingAnt(
  targetUrl: string,
  options: ScrapingAntOptions = {}
): Promise<ScrapingAntResult> {
  const apiKey = options.apiKey || process.env.SCRAPINGANT_API_KEY;

  if (apiKey && apiKey.trim().length > 5) {
    try {
      const endpoint = new URL('https://api.scrapingant.com/v2/general');
      endpoint.searchParams.set('url', targetUrl);
      endpoint.searchParams.set('x-api-key', apiKey.trim());
      endpoint.searchParams.set('browser', options.browser !== false ? 'true' : 'false');
      if (options.proxyType) endpoint.searchParams.set('proxy_type', options.proxyType);
      if (options.proxyCountry) endpoint.searchParams.set('proxy_country', options.proxyCountry);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 30000);

      const response = await fetch(endpoint.toString(), {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        return {
          html,
          statusCode: response.status,
          source: 'scrapingant',
        };
      } else {
        console.warn(`ScrapingAnt API responded with status ${response.status}: ${await response.text().catch(() => '')}`);
      }
    } catch (err) {
      console.warn('ScrapingAnt API call failed, attempting direct fetch fallback:', err);
    }
  }

  // Fallback 1: Direct fetch with browser user agent headers
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const directRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (directRes.ok) {
      const html = await directRes.text();
      return {
        html,
        statusCode: directRes.status,
        source: 'direct',
      };
    }
  } catch (directErr) {
    console.warn(`Direct fetch failed for ${targetUrl}:`, directErr);
  }

  throw new Error(`Failed to fetch HTML for ${targetUrl}: both ScrapingAnt and direct fetch failed.`);
}
