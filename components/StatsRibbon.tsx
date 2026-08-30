'use client';

import React from 'react';
import { Watch } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Landmark, CheckCircle2, TrendingDown, Clock, ShieldCheck } from 'lucide-react';

interface StatsRibbonProps {
  watches: Watch[];
}

export function StatsRibbon({ watches }: StatsRibbonProps) {
  const wishlistItems = watches.filter((w) => w.status === 'wishlist');
  const acquiredItems = watches.filter((w) => w.status === 'acquired');

  const totalWishlistValuation = wishlistItems.reduce((acc, w) => acc + (w.currentPrice || 0), 0);
  const totalAcquiredValuation = acquiredItems.reduce((acc, w) => acc + (w.currentPrice || 0), 0);

  const priceDropItems = wishlistItems.filter((w) => (w.priceDropPercentage || 0) > 0);
  const totalDiscountSaved = wishlistItems.reduce((acc, w) => {
    if (w.originalPrice && w.originalPrice > w.currentPrice) {
      return acc + (w.originalPrice - w.currentPrice);
    }
    return acc;
  }, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-6">
      {/* 1. Total Wishlist Valuation */}
      <div className="p-4 rounded-2xl bg-dial-900/80 border border-gold-500/20 backdrop-blur-md shadow-dial">
        <div className="flex items-center justify-between text-steel-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider">Wishlist Valuation</span>
          <Landmark className="w-3.5 h-3.5 text-gold-400" />
        </div>
        <div className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
          {formatCurrency(totalWishlistValuation)}
        </div>
        <span className="text-[10px] font-mono text-steel-500 mt-1 block">
          {wishlistItems.length} active timepieces tracked
        </span>
      </div>

      {/* 2. Acquired Collection Value */}
      <div className="p-4 rounded-2xl bg-dial-900/80 border border-emerald-500/20 backdrop-blur-md shadow-dial">
        <div className="flex items-center justify-between text-steel-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider">Acquired Collection</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="font-display text-xl sm:text-2xl font-bold text-emerald-300 tracking-tight">
          {formatCurrency(totalAcquiredValuation)}
        </div>
        <span className="text-[10px] font-mono text-steel-500 mt-1 block">
          {acquiredItems.length} permanent archive pieces
        </span>
      </div>

      {/* 3. Price Drops & Savings */}
      <div className="p-4 rounded-2xl bg-dial-900/80 border border-rose-500/20 backdrop-blur-md shadow-dial">
        <div className="flex items-center justify-between text-steel-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider">Active Price Drops</span>
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
          <span>{priceDropItems.length} Watches</span>
          {totalDiscountSaved > 0 && (
            <span className="text-xs font-mono text-emerald-400 font-normal">
              (-{formatCurrency(totalDiscountSaved)})
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-steel-500 mt-1 block">
          Scraped across live listings
        </span>
      </div>

      {/* 4. Movement Escapement Beat Status */}
      <div className="p-4 rounded-2xl bg-dial-900/80 border border-white/10 backdrop-blur-md shadow-dial">
        <div className="flex items-center justify-between text-steel-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider">Scraper Health</span>
          <Clock className="w-3.5 h-3.5 text-gold-400" />
        </div>
        <div className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Active / Cron</span>
        </div>
        <span className="text-[10px] font-mono text-steel-500 mt-1 block">
          ScrapingAnt + Vercel Cron daily
        </span>
      </div>
    </div>
  );
}
