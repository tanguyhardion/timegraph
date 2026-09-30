/**
 * ScrapingAnt Client Integration
 * Tries a cheap direct fetch first, then ScrapingAnt proxies (datacenter → residential).
 *
 * Notes from production (Swatch Group sites like Longines / Hamilton sit behind Akamai):
 * - Product data (JSON-LD, og: tags) is in the static HTML, so a headless browser is not
 *   needed by default. Rendering is ~10x the credits and far slower against Akamai.
 * - The free ScrapingAnt plan allows ONE concurrent request. Aborting a request client-side
 *   does not stop the job server-side, so we pass ScrapingAnt's own `timeout` below our abort
 *   and back off on 409 instead of immediately burning the next tier.
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

const DIRECT_TIMEOUT_MS = 8000;
const SCRAPINGANT_SERVER_TIMEOUT_S = 25;
const CONCURRENCY_RETRY_DELAY_MS = 6000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function describeError(err: any): string {
  return err?.name === 'AbortError' || err?.name === 'TimeoutError' ? 'timeout' : err?.message || String(err);
}

async function fetchDirect(targetUrl: string): Promise<ScrapingAntResult> {
  const res = await fetch(targetUrl, {
    headers: {
      // Deliberately not spoofing Chrome: a Chrome UA with a non-Chrome TLS fingerprint is a
      // classic bot signal for Akamai/Cloudflare and gets tarpitted rather than rejected.
      'User-Agent': 'Mozilla/5.0 (compatible; TimegraphBot/1.0; personal price tracker)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    signal: AbortSignal.timeout(DIRECT_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), statusCode: res.status, source: 'direct' };
}

async function fetchViaScrapingAnt(
  targetUrl: string,
  apiKey: string,
  proxyType: 'datacenter' | 'residential',
  options: ScrapingAntOptions
): Promise<ScrapingAntResult> {
  const endpoint = new URL('https://api.scrapingant.com/v2/general');
  endpoint.searchParams.set('url', targetUrl);
  endpoint.searchParams.set('x-api-key', apiKey);
  endpoint.searchParams.set('browser', options.browser ? 'true' : 'false');
  endpoint.searchParams.set('proxy_country', options.proxyCountry || 'FR');
  endpoint.searchParams.set('proxy_type', proxyType);
  // Make ScrapingAnt give up before we do, so an abandoned job never holds the concurrency slot.
  endpoint.searchParams.set('timeout', String(SCRAPINGANT_SERVER_TIMEOUT_S));

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(endpoint.toString(), {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(options.timeoutMs || (SCRAPINGANT_SERVER_TIMEOUT_S + 5) * 1000),
    });

    if (response.ok) {
      return { html: await response.text(), statusCode: response.status, source: 'scrapingant' };
    }

    const body = (await response.text().catch(() => '')).slice(0, 160);
    if (response.status === 409 && attempt === 0) {
      // Concurrency limit (free plan = 1). Another job is still finishing; wait for the slot.
      await sleep(CONCURRENCY_RETRY_DELAY_MS);
      continue;
    }
    throw new Error(`${response.status}${body ? `: ${body}` : ''}`);
  }
  throw new Error('409: concurrency limit');
}

export async function fetchHtmlWithScrapingAnt(
  targetUrl: string,
  options: ScrapingAntOptions = {}
): Promise<ScrapingAntResult> {
  const failures: string[] = [];

  // 1. Direct fetch: free and fast, and works for many retailers even from Vercel.
  try {
    return await fetchDirect(targetUrl);
  } catch (err) {
    failures.push(`Direct: ${describeError(err)}`);
  }

  // 2. ScrapingAnt proxies: datacenter first (1 credit), then residential (gets past Akamai/DataDome).
  const apiKey = (options.apiKey || process.env.SCRAPINGANT_API_KEY || '').trim();
  if (apiKey.length > 5) {
    const proxyTypes = options.proxyType ? [options.proxyType] : (['datacenter', 'residential'] as const);
    for (const proxyType of proxyTypes) {
      try {
        return await fetchViaScrapingAnt(targetUrl, apiKey, proxyType, options);
      } catch (err) {
        failures.push(`ScrapingAnt ${proxyType}: ${describeError(err)}`);
      }
    }
  } else {
    failures.push('ScrapingAnt: no API key');
  }

  const message = `Failed to fetch ${targetUrl} — ${failures.join(' | ')}`;
  console.warn(message);
  throw new Error(message);
}
