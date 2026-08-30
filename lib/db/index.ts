import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, asc, desc, and, ilike, or, sql } from 'drizzle-orm';
import * as schema from './schema';
import { watches as watchesTable, priceHistory as priceHistoryTable } from './schema';
import { Watch, PriceHistoryPoint, FilterOptions, WatchAvailability } from '../types';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required.');
}

const sqlClient = neon(connectionString);
export const db = drizzle(sqlClient, { schema });
export { schema };

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapDbWatchToWatch(row: schema.DbWatch, history: schema.DbPriceHistory[] = []): Watch {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    brand: row.brand,
    model: row.model,
    referenceNumber: row.referenceNumber ?? undefined,
    currentPrice: row.currentPrice,
    originalPrice: row.originalPrice ?? undefined,
    currency: row.currency,
    lowestRecordedPrice: row.lowestRecordedPrice ?? undefined,
    highestRecordedPrice: row.highestRecordedPrice ?? undefined,
    priceDropPercentage: row.priceDropPercentage ?? undefined,
    availability: row.availability,
    occasion: row.occasion,
    status: row.status,
    acquiredDate: row.acquiredDate ?? undefined,
    imageUrl: row.imageUrl,
    additionalImages: (row.additionalImages as string[]) ?? [],
    specs: (row.specs as Watch['specs']) ?? {},
    notes: row.notes ?? undefined,
    retailerName: row.retailerName ?? undefined,
    lastScrapedAt: row.lastScrapedAt ?? undefined,
    scrapeStatus: row.scrapeStatus as Watch['scrapeStatus'],
    scrapeErrorMessage: row.scrapeErrorMessage ?? undefined,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    priceHistory: history.map((ph) => ({
      id: ph.id,
      watchId: ph.watchId,
      price: ph.price,
      currency: ph.currency,
      availability: ph.availability,
      recordedAt: ph.recordedAt,
      note: ph.note ?? undefined,
    })),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch all watches with optional filters and joined price history.
 */
export async function getWatches(filters?: Partial<FilterOptions>): Promise<Watch[]> {
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(watchesTable.status, filters.status));
  }
  if (filters?.occasion && filters.occasion !== 'All') {
    conditions.push(eq(watchesTable.occasion, filters.occasion));
  }
  if (filters?.brand && filters.brand !== 'All') {
    conditions.push(ilike(watchesTable.brand, filters.brand));
  }
  if (filters?.availability && filters.availability !== 'All') {
    conditions.push(eq(watchesTable.availability, filters.availability as WatchAvailability));
  }
  if (filters?.searchQuery?.trim()) {
    const q = `%${filters.searchQuery.trim()}%`;
    conditions.push(
      or(
        ilike(watchesTable.title, q),
        ilike(watchesTable.brand, q),
        ilike(watchesTable.model, q),
        ilike(watchesTable.referenceNumber, q),
      )
    );
  }

  const rows = await db
    .select()
    .from(watchesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Determine sort order
  const sortBy = filters?.sortBy ?? 'order';
  const sorted = rows.slice().sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':  return a.currentPrice - b.currentPrice;
      case 'price-desc': return b.currentPrice - a.currentPrice;
      case 'price-drop': return (b.priceDropPercentage ?? 0) - (a.priceDropPercentage ?? 0);
      case 'date-newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'order':
      default: return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    }
  });

  if (sorted.length === 0) return [];

  const ids = sorted.map((w) => w.id);
  const historyRows = await db
    .select()
    .from(priceHistoryTable)
    .where(sql`${priceHistoryTable.watchId} = ANY(${sql.raw(`ARRAY[${ids.map((id) => `'${id}'`).join(',')}]`)})`)
    .orderBy(asc(priceHistoryTable.recordedAt));

  const historyByWatch = new Map<string, schema.DbPriceHistory[]>();
  for (const ph of historyRows) {
    if (!historyByWatch.has(ph.watchId)) historyByWatch.set(ph.watchId, []);
    historyByWatch.get(ph.watchId)!.push(ph);
  }

  return sorted.map((row) => mapDbWatchToWatch(row, historyByWatch.get(row.id) ?? []));
}

/**
 * Fetch a single watch with full price history.
 */
export async function getWatchById(id: string): Promise<Watch | null> {
  const [row] = await db.select().from(watchesTable).where(eq(watchesTable.id, id));
  if (!row) return null;

  const history = await db
    .select()
    .from(priceHistoryTable)
    .where(eq(priceHistoryTable.watchId, id))
    .orderBy(asc(priceHistoryTable.recordedAt));

  return mapDbWatchToWatch(row, history);
}

/**
 * Create a new watch.
 */
export async function createWatch(input: Partial<Watch>): Promise<Watch> {
  const id = input.id || `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const currentPrice = Number(input.currentPrice) || 0;
  const originalPrice = Number(input.originalPrice) || currentPrice;
  const priceDropPercentage =
    originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 1000) / 10 : 0;

  // Get current max displayOrder
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${watchesTable.displayOrder}), 0)` })
    .from(watchesTable);

  const newRow: schema.InsertDbWatch = {
    id,
    url: input.url || '',
    title: input.title || 'Untitled Timepiece',
    brand: input.brand || 'Independent',
    model: input.model || 'Reference Model',
    referenceNumber: input.referenceNumber || null,
    currentPrice,
    originalPrice,
    currency: input.currency || 'EUR',
    lowestRecordedPrice: currentPrice,
    highestRecordedPrice: Math.max(currentPrice, originalPrice),
    priceDropPercentage,
    availability: input.availability || 'unknown',
    occasion: input.occasion || 'Just Because',
    status: input.status || 'wishlist',
    acquiredDate: input.status === 'acquired' ? (input.acquiredDate ?? now) : null,
    imageUrl:
      input.imageUrl ||
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    additionalImages: input.additionalImages ?? [],
    specs: input.specs ?? {},
    notes: input.notes ?? null,
    retailerName: input.retailerName ?? null,
    lastScrapedAt: input.lastScrapedAt ?? now,
    scrapeStatus: input.scrapeStatus || 'success',
    scrapeErrorMessage: input.scrapeErrorMessage ?? null,
    displayOrder: (maxOrder ?? 0) + 1,
    createdAt: now,
    updatedAt: now,
  };

  const [inserted] = await db.insert(watchesTable).values(newRow).returning();

  const firstHistoryRow: schema.InsertDbPriceHistory = {
    id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    watchId: id,
    price: currentPrice,
    currency: inserted.currency,
    availability: inserted.availability,
    recordedAt: now,
    note: 'Initial entry created',
  };

  const [insertedHistory] = await db.insert(priceHistoryTable).values(firstHistoryRow).returning();

  return mapDbWatchToWatch(inserted, [insertedHistory]);
}

/**
 * Update an existing watch.
 */
export async function updateWatch(id: string, updates: Partial<Watch>): Promise<Watch | null> {
  const [current] = await db.select().from(watchesTable).where(eq(watchesTable.id, id));
  if (!current) return null;

  const now = new Date().toISOString();

  const currentPrice =
    updates.currentPrice !== undefined ? Number(updates.currentPrice) : current.currentPrice;
  const originalPrice =
    updates.originalPrice !== undefined
      ? Number(updates.originalPrice)
      : (current.originalPrice ?? currentPrice);
  const lowestRecordedPrice =
    current.lowestRecordedPrice != null
      ? Math.min(current.lowestRecordedPrice, currentPrice)
      : currentPrice;
  const highestRecordedPrice =
    current.highestRecordedPrice != null
      ? Math.max(current.highestRecordedPrice, currentPrice, originalPrice)
      : Math.max(currentPrice, originalPrice);

  const priceDropPercentage =
    originalPrice > currentPrice && originalPrice > 0
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 1000) / 10
      : 0;

  const priceChanged =
    updates.currentPrice !== undefined && updates.currentPrice !== current.currentPrice;
  const availabilityChanged =
    updates.availability !== undefined && updates.availability !== current.availability;

  if (priceChanged || availabilityChanged) {
    const diff = currentPrice - current.currentPrice;
    let note = '';
    if (priceChanged && diff < 0) {
      note = `Price dropped by ${Math.abs(diff)} ${current.currency} (${priceDropPercentage}%)`;
    } else if (priceChanged && diff > 0) {
      note = `Price increased by ${diff} ${current.currency}`;
    }
    if (availabilityChanged) {
      note = note
        ? `${note} · Status: ${updates.availability}`
        : `Status changed to ${updates.availability}`;
    }

    await db.insert(priceHistoryTable).values({
      id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      watchId: id,
      price: currentPrice,
      currency: updates.currency ?? current.currency,
      availability: updates.availability ?? current.availability,
      recordedAt: now,
      note: note || null,
    });
  }

  const mergedSpecs = {
    ...(current.specs as Record<string, unknown> ?? {}),
    ...(updates.specs ?? {}),
  };

  const acquiredDate =
    updates.status === 'acquired' && !current.acquiredDate
      ? now.split('T')[0]
      : (updates.acquiredDate ?? current.acquiredDate ?? null);

  const [updated] = await db
    .update(watchesTable)
    .set({
      url: updates.url ?? current.url,
      title: updates.title ?? current.title,
      brand: updates.brand ?? current.brand,
      model: updates.model ?? current.model,
      referenceNumber: updates.referenceNumber ?? current.referenceNumber,
      currentPrice,
      originalPrice,
      currency: updates.currency ?? current.currency,
      lowestRecordedPrice,
      highestRecordedPrice,
      priceDropPercentage,
      availability: updates.availability ?? current.availability,
      occasion: updates.occasion ?? current.occasion,
      status: updates.status ?? current.status,
      acquiredDate,
      imageUrl: updates.imageUrl ?? current.imageUrl,
      additionalImages: updates.additionalImages ?? current.additionalImages,
      specs: mergedSpecs,
      notes: updates.notes ?? current.notes,
      retailerName: updates.retailerName ?? current.retailerName,
      lastScrapedAt: updates.lastScrapedAt ?? current.lastScrapedAt,
      scrapeStatus: updates.scrapeStatus ?? current.scrapeStatus,
      scrapeErrorMessage: updates.scrapeErrorMessage ?? current.scrapeErrorMessage,
      displayOrder: updates.displayOrder ?? current.displayOrder,
      updatedAt: now,
    })
    .where(eq(watchesTable.id, id))
    .returning();

  if (!updated) return null;
  return getWatchById(id);
}

/**
 * Record a price history snapshot explicitly.
 */
export async function recordPriceHistory(
  watchId: string,
  price: number,
  currency: string,
  availability: WatchAvailability,
  note?: string
): Promise<void> {
  await db.insert(priceHistoryTable).values({
    id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    watchId,
    price,
    currency,
    availability,
    recordedAt: new Date().toISOString(),
    note: note ?? null,
  });
}

/**
 * Delete a watch and its price history (cascade handled by DB constraint).
 */
export async function deleteWatch(id: string): Promise<boolean> {
  const result = await db.delete(watchesTable).where(eq(watchesTable.id, id)).returning({ id: watchesTable.id });
  return result.length > 0;
}

/**
 * Reorder watches by updating displayOrder.
 */
export async function reorderWatches(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(watchesTable)
        .set({ displayOrder: index + 1 })
        .where(eq(watchesTable.id, id))
    )
  );
}
