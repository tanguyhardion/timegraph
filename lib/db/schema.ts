import { pgTable, text, timestamp, integer, real, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { WatchSpecs, WatchAvailability, WatchOccasion, WatchStatus } from '../types';

export const watches = pgTable('watches', {
  id: text('id').primaryKey(),
  url: text('url').notNull().default(''),
  title: text('title').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  referenceNumber: text('reference_number'),
  currentPrice: real('current_price').notNull().default(0),
  originalPrice: real('original_price'),
  currency: text('currency').notNull().default('USD'),
  lowestRecordedPrice: real('lowest_recorded_price'),
  highestRecordedPrice: real('highest_recorded_price'),
  priceDropPercentage: real('price_drop_percentage').default(0),
  availability: text('availability').$type<WatchAvailability>().notNull().default('unknown'),
  occasion: text('occasion').$type<WatchOccasion>().notNull().default('Just Because'),
  status: text('status').$type<WatchStatus>().notNull().default('wishlist'),
  acquiredDate: text('acquired_date'),
  imageUrl: text('image_url').notNull(),
  additionalImages: jsonb('additional_images').$type<string[]>().default([]),
  specs: jsonb('specs').$type<WatchSpecs>().default({}),
  notes: text('notes'),
  retailerName: text('retailer_name'),
  lastScrapedAt: text('last_scraped_at'),
  scrapeStatus: text('scrape_status').notNull().default('success'),
  scrapeErrorMessage: text('scrape_error_message'),
  displayOrder: integer('display_order').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const priceHistory = pgTable('price_history', {
  id: text('id').primaryKey(),
  watchId: text('watch_id')
    .notNull()
    .references(() => watches.id, { onDelete: 'cascade' }),
  price: real('price').notNull(),
  currency: text('currency').notNull().default('USD'),
  availability: text('availability').$type<WatchAvailability>().notNull().default('in_stock'),
  recordedAt: text('recorded_at').notNull(),
  note: text('note'),
});

export const watchesRelations = relations(watches, ({ many }) => ({
  priceHistory: many(priceHistory),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  watch: one(watches, {
    fields: [priceHistory.watchId],
    references: [watches.id],
  }),
}));

export type DbWatch = typeof watches.$inferSelect;
export type InsertDbWatch = typeof watches.$inferInsert;
export type DbPriceHistory = typeof priceHistory.$inferSelect;
export type InsertDbPriceHistory = typeof priceHistory.$inferInsert;
