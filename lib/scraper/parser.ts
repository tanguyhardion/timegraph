import * as cheerio from 'cheerio';
import { ScrapedWatchData, WatchAvailability, WatchSpecs } from '../types';

const KNOWN_BRANDS = [
  'Breitling',
  'Hamilton',
  'Longines',
  'Omega',
  'Tissot',
  'Tudor',
];

/**
 * Parses raw HTML and extracts rich horological metadata
 */
export function parseWatchHtml(html: string, sourceUrl: string): ScrapedWatchData {
  const $ = cheerio.load(html);
  const data: ScrapedWatchData = {
    url: sourceUrl,
    specs: {},
  };

  // 1. Determine retailer from hostname
  try {
    const urlObj = new URL(sourceUrl);
    const host = urlObj.hostname.toLowerCase();
    if (host.includes('hodinkee')) data.retailerName = 'Hodinkee';
    else if (host.includes('chrono24')) data.retailerName = 'Chrono24';
    else if (host.includes('jomashop')) data.retailerName = 'Jomashop';
    else if (host.includes('watchbox') || host.includes('the1916company')) data.retailerName = 'The 1916 Company';
    else if (host.includes('omega')) data.retailerName = 'Omega Official';
    else if (host.includes('longines')) data.retailerName = 'Longines Official';
    else if (host.includes('hamilton')) data.retailerName = 'Hamilton Official';
    else if (host.includes('breitling')) data.retailerName = 'Breitling Official';
    else if (host.includes('tissot')) data.retailerName = 'Tissot Official';
    else if (host.includes('tudor')) data.retailerName = 'Tudor Official';
    else data.retailerName = host.replace(/^www\./, '');
  } catch {
    data.retailerName = 'Online Retailer';
  }

  // 2. Parse JSON-LD scripts
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (!content) return;
      const parsed = JSON.parse(content);
      extractFromJsonLd(parsed, data);
    } catch {
      // Ignore invalid JSON in ld+json tags
    }
  });

  // 3. Parse OpenGraph and Meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
  const ogPrice = $('meta[property="og:price:amount"]').attr('content') || $('meta[property="product:price:amount"]').attr('content');
  const ogCurrency = $('meta[property="og:price:currency"]').attr('content') || $('meta[property="product:price:currency"]').attr('content');
  const ogAvailability = $('meta[property="product:availability"]').attr('content');

  if (!data.title && ogTitle) data.title = sanitizeText(ogTitle);
  if (!data.imageUrl && ogImage) data.imageUrl = resolveUrl(ogImage, sourceUrl);
  if (!data.rawDescription && ogDesc) data.rawDescription = sanitizeText(ogDesc);
  if (!data.price && ogPrice) data.price = parsePriceNumber(ogPrice);
  if (!data.currency && ogCurrency) data.currency = ogCurrency.toUpperCase();
  if (!data.availability && ogAvailability) data.availability = parseAvailability(ogAvailability);

  // 4. Fallback: Parse HTML Head Title & H1
  if (!data.title) {
    const pageTitle = $('h1').first().text() || $('title').text();
    data.title = sanitizeText(pageTitle);
  }

  // 5. Detect Brand from Title or Page Content
  if (!data.brand) {
    const combinedText = `${data.title || ''} ${data.rawDescription || ''}`;
    for (const brand of KNOWN_BRANDS) {
      const regex = new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i');
      if (regex.test(combinedText)) {
        data.brand = brand;
        break;
      }
    }
    if (!data.brand) {
      // Try first word of title
      const firstWord = (data.title || '').split(' ')[0];
      if (firstWord && firstWord.length > 2) {
        data.brand = firstWord;
      }
    }
  }

  // 6. Extract Model & Reference Number
  if (data.title) {
    let cleanModel = data.title;
    if (data.brand && cleanModel.toLowerCase().startsWith(data.brand.toLowerCase())) {
      cleanModel = cleanModel.slice(data.brand.length).trim();
    }
    // Remove retailer suffixes e.g. "| Hodinkee", "- Chrono24"
    cleanModel = cleanModel.replace(/[|\-–—•].*$/, '').trim();
    data.model = cleanModel;

    // Search for Reference number (e.g. "Ref. 126500LN", "Reference: 5227G", "SBGA211")
    const refMatch = data.title.match(/(?:ref\.?|reference|model\s*#?)\s*([A-Za-z0-9\-\.\/]+)/i);
    if (refMatch && refMatch[1]) {
      data.referenceNumber = refMatch[1].trim();
    }
  }

  // 7. Parse Price from HTML if not yet found
  if (!data.price) {
    // Look specifically for elements with price in class/id/itemprop or containing currency symbols
    const candidates = [
      $('[itemprop="price"]').first().attr('content') || $('[itemprop="price"]').first().text(),
      $('[class*="price"]:not(body):not(html), [id*="price"]:not(body):not(html)').filter((_, el) => {
        const t = $(el).text();
        return /[\$€£¥]|(?:USD|EUR|GBP|CHF)\b/i.test(t) || /^\s*[0-9]+(?:[,.][0-9]{2})?\s*$/.test(t.trim());
      }).first().text(),
      $('span:contains("$"), span:contains("€"), span:contains("£"), span:contains("CHF")').first().text(),
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const parsedPrice = parsePriceNumber(candidate);
      if (parsedPrice > 0) {
        data.price = parsedPrice;
        data.currency = data.currency || detectCurrency(candidate);
        break;
      }
    }
  }

  // 8. Extract Specifications from description or spec tables
  extractSpecs($, data);

  // 9. Clean up image URLs and fallbacks
  if (!data.imageUrl) {
    const firstImg = $('img[src*="watch"], img[src*="product"], img[src*="cdn"]').first().attr('src');
    if (firstImg) {
      data.imageUrl = resolveUrl(firstImg, sourceUrl);
    } else {
      data.imageUrl = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80';
    }
  }

  if (!data.currency) data.currency = 'EUR';
  if (!data.availability) data.availability = 'in_stock';
  if (!data.price) data.price = 0;

  return data;
}

function extractFromJsonLd(obj: any, data: ScrapedWatchData) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item) => extractFromJsonLd(item, data));
    return;
  }

  const type = obj['@type'];
  if (type === 'Product' || type === 'IndividualProduct' || type === 'Watch') {
    if (obj.name && !data.title) data.title = sanitizeText(obj.name);
    if (obj.brand) {
      data.brand = typeof obj.brand === 'string' ? obj.brand : obj.brand.name;
    }
    if (obj.image) {
      if (typeof obj.image === 'string') data.imageUrl = obj.image;
      else if (Array.isArray(obj.image) && obj.image.length > 0) data.imageUrl = obj.image[0];
      else if (obj.image.url) data.imageUrl = obj.image.url;
    }
    if (obj.description && !data.rawDescription) {
      data.rawDescription = sanitizeText(obj.description);
    }
    if (obj.model && !data.model) data.model = String(obj.model);
    if (obj.mpn || obj.sku) data.referenceNumber = String(obj.mpn || obj.sku);

    // Offers
    if (obj.offers) {
      const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
      if (offer) {
        if (offer.price !== undefined) data.price = parsePriceNumber(String(offer.price));
        if (offer.priceCurrency) data.currency = String(offer.priceCurrency).toUpperCase();
        if (offer.availability) data.availability = parseAvailability(String(offer.availability));
      }
    }
  }

  // Nested structures like @graph
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    obj['@graph'].forEach((item: any) => extractFromJsonLd(item, data));
  }
}

function extractSpecs($: cheerio.CheerioAPI, data: ScrapedWatchData) {
  const text = `${$('body').text()} ${data.rawDescription || ''}`;
  const specs: WatchSpecs = data.specs || {};

  // Case Diameter: e.g. 40mm, 41.5 mm, 39 mm
  const diaMatch = text.match(/\b([345]\d(?:\.\d+)?)\s*(?:mm|millimeter|millimetre)\b/i);
  if (diaMatch && !specs.caseDiameter) {
    specs.caseDiameter = `${diaMatch[1]}mm`;
  }

  // Case Thickness: e.g. 12.4mm, 9.2 mm
  const thickMatch = text.match(/(?:thickness|height)[:\s]*([89]|\d{2}(?:\.\d+)?)\s*mm\b/i);
  if (thickMatch && !specs.caseThickness) {
    specs.caseThickness = `${thickMatch[1]}mm`;
  }

  // Lug to Lug: e.g. 47.5mm
  const l2lMatch = text.match(/(?:lug[- ]to[- ]lug)[:\s]*(\d{2}(?:\.\d+)?)\s*mm\b/i);
  if (l2lMatch && !specs.lugToLug) {
    specs.lugToLug = `${l2lMatch[1]}mm`;
  }

  // Water Resistance: e.g. 100m, 300m, 50m, 3 bar, 10 bar, 300 ft
  const wrMatch = text.match(/(?:water[- ]resistance|water resistant)[:\s]*([0-9]+\s*(?:m|meter|meters|bar|atm|ft))\b/i);
  if (wrMatch && !specs.waterResistance) {
    specs.waterResistance = wrMatch[1].trim();
  }

  // Movement Calibre
  const calMatch = text.match(/(?:calibre|caliber|movement)[:\s]*([A-Za-z0-9\.\-\s]{3,20})/i);
  if (calMatch && !specs.movementCaliber) {
    specs.movementCaliber = calMatch[1].trim().replace(/\s+with.*$/, '');
  }

  // Movement Type
  if (/\bspring\s*drive\b/i.test(text)) specs.movementType = 'Spring Drive';
  else if (/\bco-axial\b/i.test(text)) specs.movementType = 'Co-Axial';
  else if (/\bmanual[- ](?:wind|winding)\b/i.test(text) || /\bhand[- ]wound\b/i.test(text)) specs.movementType = 'Manual-Wind';
  else if (/\bautomatic\b/i.test(text) || /\bself[- ]winding\b/i.test(text)) specs.movementType = 'Automatic';
  else if (/\bquartz\b/i.test(text)) specs.movementType = 'Quartz';

  // Power Reserve: e.g. 70 hours, 72 hours, 3 days
  const prMatch = text.match(/([0-9]+\s*(?:hours|hrs|days|d))\s*(?:power\s*reserve)/i);
  if (prMatch && !specs.powerReserve) {
    specs.powerReserve = prMatch[1].trim();
  }

  // Case Material
  if (/platinum/i.test(text)) specs.caseMaterial = '950 Platinum';
  else if (/rose\s*gold|pink\s*gold|everose|sedna/i.test(text)) specs.caseMaterial = '18k Rose Gold';
  else if (/white\s*gold/i.test(text)) specs.caseMaterial = '18k White Gold';
  else if (/yellow\s*gold/i.test(text)) specs.caseMaterial = '18k Yellow Gold';
  else if (/titanium/i.test(text)) specs.caseMaterial = 'Titanium';
  else if (/ceramic/i.test(text)) specs.caseMaterial = 'Ceramic';
  else if (/steel|oystersteel|stainless/i.test(text)) specs.caseMaterial = 'Stainless Steel';

  data.specs = specs;
}

function parsePriceNumber(val: string | number): number {
  if (typeof val === 'number') {
    return isFinite(val) && val >= 0 && val < 50_000_000 ? val : 0;
  }
  if (!val || typeof val !== 'string') return 0;

  // Replace non-breaking spaces and narrow NBSP with standard space
  let clean = val.replace(/[\u00A0\u202F\u2000-\u200B]/g, ' ').trim();
  if (!clean) return 0;

  // Match monetary patterns with possible thousands separators (spaces, commas, dots, apostrophes)
  // Example matches: "2 150,00 €", "2 150 €", "3 750 €", "2,150.00", "2.150,00", "625 €", "2150", "2150,00€"
  const match = clean.match(/(?:[\$€£¥]|USD|EUR|GBP|CHF)?\s*([0-9]{1,3}(?:[,\s.\u00A0\u202F']\d{3})+(?:[.,]\d{1,2})?|[0-9]+(?:[.,]\d{1,2})?)/i);
  if (!match || !match[1]) return 0;

  let rawNum = match[1].trim();

  // If there are spaces or apostrophes between digits, they are definitely thousands separators
  // e.g. "2 150,00" -> "2150,00", "2 150" -> "2150", "3'750.00" -> "3750.00"
  rawNum = rawNum.replace(/[\s']/g, '');

  if (rawNum.includes(',') && rawNum.includes('.')) {
    if (rawNum.lastIndexOf(',') > rawNum.lastIndexOf('.')) {
      // European format: 1.234,56 -> 1234.56
      rawNum = rawNum.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56 -> 1234.56
      rawNum = rawNum.replace(/,/g, '');
    }
  } else if (rawNum.includes(',')) {
    const parts = rawNum.split(',');
    if (parts.length === 2) {
      // If the part after comma is exactly 3 digits (e.g. "2,150"), it's a thousands separator
      if (parts[1].length === 3) {
        rawNum = parts[0] + parts[1];
      } else {
        // Decimal separator (e.g. "2150,00" or "29,50" or "625,0")
        rawNum = parts[0] + '.' + parts[1];
      }
    } else {
      // Multiple commas: thousands separators e.g. "1,000,000"
      rawNum = rawNum.replace(/,/g, '');
    }
  } else if (rawNum.includes('.')) {
    const parts = rawNum.split('.');
    if (parts.length === 2) {
      // If the part after dot is exactly 3 digits and not followed by another dot/comma (e.g. "2.150"),
      // in European watch sites (like Longines / Swatch Group) dot is often used as thousands separator
      if (parts[1].length === 3) {
        rawNum = parts[0] + parts[1];
      } else {
        // Standard decimal dot e.g. "2150.00"
      }
    } else {
      // Multiple dots e.g. "1.000.000"
      rawNum = rawNum.replace(/\./g, '');
    }
  }

  const num = parseFloat(rawNum);
  if (isNaN(num) || !isFinite(num) || num < 0 || num > 50_000_000) {
    return 0;
  }
  return num;
}

function detectCurrency(text: string): string {
  if (text.includes('€') || /eur/i.test(text)) return 'EUR';
  if (text.includes('£') || /gbp/i.test(text)) return 'GBP';
  if (text.includes('¥') || /jpy/i.test(text)) return 'JPY';
  if (text.includes('CHF') || /chf/i.test(text)) return 'CHF';
  return 'USD';
}

function parseAvailability(avail: string): WatchAvailability {
  const lower = avail.toLowerCase();
  if (lower.includes('instock') || lower.includes('in_stock') || lower.includes('available')) return 'in_stock';
  if (lower.includes('outofstock') || lower.includes('out_of_stock') || lower.includes('sold')) return 'out_of_stock';
  if (lower.includes('preorder') || lower.includes('pre_order')) return 'pre_order';
  if (lower.includes('waitlist') || lower.includes('inquire') || lower.includes('backorder')) return 'waitlist';
  return 'unknown';
}

function sanitizeText(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
