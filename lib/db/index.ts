import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { Watch, PriceHistoryPoint, FilterOptions, WatchAvailability } from '../types';
import fs from 'fs';
import path from 'path';

// Local storage path for fallback when no PostgreSQL URL is configured
const DATA_FILE = path.join(process.cwd(), '.timegraph_data.json');

// Initialize Drizzle client if connection string is provided
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let drizzleDb: any = null;

if (connectionString) {
  try {
    const sql = neon(connectionString);
    drizzleDb = drizzle(sql, { schema });
  } catch (err) {
    console.warn('Could not initialize Drizzle Neon connection, falling back to local store:', err);
  }
}

export const db = drizzleDb;
export { schema };

interface DatabaseSchema {
  watches: Watch[];
  priceHistory: PriceHistoryPoint[];
  lastInitialized: string;
}

let memoryCache: DatabaseSchema | null = null;

function loadLocalData(): DatabaseSchema {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.watches)) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read .timegraph_data.json, initializing fresh state', err);
  }

  const freshDb: DatabaseSchema = {
    watches: [],
    priceHistory: [],
    lastInitialized: new Date().toISOString(),
  };

  saveLocalData(freshDb);
  memoryCache = freshDb;
  return freshDb;
}

function saveLocalData(data: DatabaseSchema): void {
  memoryCache = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist .timegraph_data.json to disk:', err);
  }
}

/**
 * Fetch all watches with optional filters and joined price history
 */
export async function getWatches(filters?: Partial<FilterOptions>): Promise<Watch[]> {
  const localDb = loadLocalData();
  let list = [...localDb.watches];

  // Attach price history to each watch
  list = list.map((w) => {
    const history = localDb.priceHistory
      .filter((ph) => ph.watchId === w.id)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    return {
      ...w,
      priceHistory: history,
    };
  });

  if (filters) {
    if (filters.status) {
      list = list.filter((w) => w.status === filters.status);
    }
    if (filters.occasion && filters.occasion !== 'All') {
      list = list.filter((w) => w.occasion === filters.occasion);
    }
    if (filters.brand && filters.brand !== 'All') {
      list = list.filter((w) => w.brand.toLowerCase() === filters.brand?.toLowerCase());
    }
    if (filters.availability && filters.availability !== 'All') {
      list = list.filter((w) => w.availability === filters.availability);
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.brand.toLowerCase().includes(q) ||
          w.model.toLowerCase().includes(q) ||
          (w.referenceNumber && w.referenceNumber.toLowerCase().includes(q)) ||
          (w.specs?.movementCaliber && w.specs.movementCaliber.toLowerCase().includes(q))
      );
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          list.sort((a, b) => a.currentPrice - b.currentPrice);
          break;
        case 'price-desc':
          list.sort((a, b) => b.currentPrice - a.currentPrice);
          break;
        case 'price-drop':
          list.sort((a, b) => (b.priceDropPercentage || 0) - (a.priceDropPercentage || 0));
          break;
        case 'date-newest':
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'date-oldest':
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'order':
        default:
          list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          break;
      }
    }
  }

  return list;
}

/**
 * Fetch a single watch with full price history
 */
export async function getWatchById(id: string): Promise<Watch | null> {
  const localDb = loadLocalData();
  const found = localDb.watches.find((w) => w.id === id);
  if (!found) return null;

  const history = localDb.priceHistory
    .filter((ph) => ph.watchId === id)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  return {
    ...found,
    priceHistory: history,
  };
}

/**
 * Create a new watch
 */
export async function createWatch(input: Partial<Watch>): Promise<Watch> {
  const localDb = loadLocalData();
  const id = input.id || `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const currentPrice = Number(input.currentPrice) || 0;
  const originalPrice = Number(input.originalPrice) || currentPrice;

  const newWatch: Watch = {
    id,
    url: input.url || '',
    title: input.title || 'Untitled Timepiece',
    brand: input.brand || 'Independent',
    model: input.model || 'Reference Model',
    referenceNumber: input.referenceNumber || '',
    currentPrice,
    originalPrice,
    currency: input.currency || 'EUR',
    lowestRecordedPrice: currentPrice,
    highestRecordedPrice: Math.max(currentPrice, originalPrice),
    priceDropPercentage:
      originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 1000) / 10 : 0,
    availability: input.availability || 'unknown',
    occasion: input.occasion || 'Just Because',
    status: input.status || 'wishlist',
    acquiredDate: input.status === 'acquired' ? input.acquiredDate || now : undefined,
    imageUrl:
      input.imageUrl ||
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    additionalImages: input.additionalImages || [],
    specs: input.specs || {},
    notes: input.notes || '',
    retailerName: input.retailerName || '',
    lastScrapedAt: input.lastScrapedAt || now,
    scrapeStatus: input.scrapeStatus || 'success',
    scrapeErrorMessage: input.scrapeErrorMessage,
    displayOrder: localDb.watches.length + 1,
    createdAt: now,
    updatedAt: now,
  };

  localDb.watches.push(newWatch);

  // Initial price history log
  const firstHistory: PriceHistoryPoint = {
    id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    watchId: id,
    price: currentPrice,
    currency: newWatch.currency,
    availability: newWatch.availability,
    recordedAt: now,
    note: 'Initial entry created',
  };

  localDb.priceHistory.push(firstHistory);
  saveLocalData(localDb);

  return {
    ...newWatch,
    priceHistory: [firstHistory],
  };
}

/**
 * Update an existing watch
 */
export async function updateWatch(id: string, updates: Partial<Watch>): Promise<Watch | null> {
  const localDb = loadLocalData();
  const index = localDb.watches.findIndex((w) => w.id === id);
  if (index === -1) return null;

  const current = localDb.watches[index];
  const now = new Date().toISOString();

  let currentPrice = updates.currentPrice !== undefined ? Number(updates.currentPrice) : current.currentPrice;
  let originalPrice = updates.originalPrice !== undefined ? Number(updates.originalPrice) : (current.originalPrice || currentPrice);
  let lowestRecordedPrice = current.lowestRecordedPrice !== undefined ? Math.min(current.lowestRecordedPrice, currentPrice) : currentPrice;
  let highestRecordedPrice = current.highestRecordedPrice !== undefined ? Math.max(current.highestRecordedPrice, currentPrice, originalPrice) : Math.max(currentPrice, originalPrice);

  let priceDropPercentage = 0;
  if (originalPrice > currentPrice && originalPrice > 0) {
    priceDropPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 1000) / 10;
  }

  const priceChanged = updates.currentPrice !== undefined && updates.currentPrice !== current.currentPrice;
  const availabilityChanged = updates.availability !== undefined && updates.availability !== current.availability;

  if (priceChanged || availabilityChanged) {
    const diff = currentPrice - current.currentPrice;
    let note = '';
    if (priceChanged && diff < 0) {
      note = `Price dropped by ${Math.abs(diff)} ${current.currency} (${priceDropPercentage}%)`;
    } else if (priceChanged && diff > 0) {
      note = `Price increased by ${diff} ${current.currency}`;
    }
    if (availabilityChanged) {
      note = note ? `${note} · Status: ${updates.availability}` : `Status changed to ${updates.availability}`;
    }

    localDb.priceHistory.push({
      id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      watchId: id,
      price: currentPrice,
      currency: updates.currency || current.currency,
      availability: updates.availability || current.availability,
      recordedAt: now,
      note: note || undefined,
    });
  }

  const updated: Watch = {
    ...current,
    ...updates,
    currentPrice,
    originalPrice,
    lowestRecordedPrice,
    highestRecordedPrice,
    priceDropPercentage,
    specs: {
      ...current.specs,
      ...(updates.specs || {}),
    },
    updatedAt: now,
  };

  if (updates.status === 'acquired' && !updated.acquiredDate) {
    updated.acquiredDate = now.split('T')[0];
  }

  localDb.watches[index] = updated;
  saveLocalData(localDb);

  return getWatchById(id);
}

/**
 * Record a price history snapshot explicitly
 */
export async function recordPriceHistory(
  watchId: string,
  price: number,
  currency: string,
  availability: WatchAvailability,
  note?: string
): Promise<void> {
  const localDb = loadLocalData();
  localDb.priceHistory.push({
    id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    watchId,
    price,
    currency,
    availability,
    recordedAt: new Date().toISOString(),
    note,
  });
  saveLocalData(localDb);
}

/**
 * Delete a watch and its history
 */
export async function deleteWatch(id: string): Promise<boolean> {
  const localDb = loadLocalData();
  const initialLength = localDb.watches.length;
  localDb.watches = localDb.watches.filter((w) => w.id !== id);
  localDb.priceHistory = localDb.priceHistory.filter((ph) => ph.watchId !== id);

  if (localDb.watches.length !== initialLength) {
    saveLocalData(localDb);
    return true;
  }
  return false;
}

/**
 * Reorder watches
 */
export async function reorderWatches(orderedIds: string[]): Promise<void> {
  const localDb = loadLocalData();
  orderedIds.forEach((id, index) => {
    const watch = localDb.watches.find((w) => w.id === id);
    if (watch) {
      watch.displayOrder = index + 1;
    }
  });
  saveLocalData(localDb);
}
