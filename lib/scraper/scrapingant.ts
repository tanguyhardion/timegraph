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
  const proxyCountry = options.proxyCountry || 'FR';

  const failures: string[] = [];

  if (apiKey && apiKey.trim().length > 5) {
    // Try datacenter proxies first (cheaper), then residential proxies, which get past
    // most anti-bot protections (Cloudflare, DataDome...) that block datacenter IPs.
    const proxyTypes = options.proxyType ? [options.proxyType] : (['datacenter', 'residential'] as const);
    for (const proxyType of proxyTypes) {
      try {
        const endpoint = new URL('https://api.scrapingant.com/v2/general');
        endpoint.searchParams.set('url', targetUrl);
        endpoint.searchParams.set('x-api-key', apiKey.trim());
        endpoint.searchParams.set('browser', options.browser !== false ? 'true' : 'false');
        endpoint.searchParams.set('proxy_country', proxyCountry);
        endpoint.searchParams.set('proxy_type', proxyType);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 30000);

        const response = await fetch(endpoint.toString(), {
          headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
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
        }
        const body = (await response.text().catch(() => '')).slice(0, 200);
        failures.push(`ScrapingAnt ${proxyType} ${response.status}${body ? `: ${body}` : ''}`);
      } catch (err: any) {
        failures.push(`ScrapingAnt ${proxyType}: ${err?.name === 'AbortError' ? 'timeout' : err?.message || err}`);
      }
    }
  } else {
    failures.push('ScrapingAnt: no API key');
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
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
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
    failures.push(`Direct ${directRes.status}`);
  } catch (directErr: any) {
    failures.push(`Direct: ${directErr?.name === 'AbortError' ? 'timeout' : directErr?.message || directErr}`);
  }

  const message = `Failed to fetch ${targetUrl} — ${failures.join(' | ')}`;
  console.warn(message);
  throw new Error(message);
}
