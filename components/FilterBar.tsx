'use client';

import React from 'react';
import { WatchStatus, WatchOccasion, WatchAvailability, FilterOptions } from '@/lib/types';
import { OCCASION_COLORS } from '@/lib/utils';
import { Search, SlidersHorizontal, Sparkles, Watch as WatchIcon, Archive } from 'lucide-react';

interface FilterBarProps {
  currentTab: WatchStatus;
  onTabChange: (tab: WatchStatus) => void;
  filters: FilterOptions;
  onFiltersChange: (newFilters: FilterOptions) => void;
  availableBrands: string[];
  availableOccasions: string[];
  wishlistCount: number;
  acquiredCount: number;
}

export function FilterBar({
  currentTab,
  onTabChange,
  filters,
  onFiltersChange,
  availableBrands,
  availableOccasions,
  wishlistCount,
  acquiredCount,
}: FilterBarProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Top Bar: Tabs (Wishlist vs Acquired) + Search & Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Collection / Wishlist Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-dial-900 border border-white/10 shrink-0">
          <button
            onClick={() => onTabChange('wishlist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
              currentTab === 'wishlist'
                ? 'bg-gold-500 text-black font-bold shadow-gold'
                : 'text-steel-400 hover:text-white'
            }`}
          >
            <WatchIcon className="w-3.5 h-3.5" />
            <span>Wishlist ({wishlistCount})</span>
          </button>

          <button
            onClick={() => onTabChange('acquired')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
              currentTab === 'acquired'
                ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                : 'text-steel-400 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Acquired Archive ({acquiredCount})</span>
          </button>
        </div>

        {/* Search Input & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-steel-500" />
            <input
              type="text"
              placeholder="Search reference, brand, caliber..."
              value={filters.searchQuery || ''}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-dial-900 border border-white/10 text-white placeholder:text-steel-600 focus:border-gold-400 focus:outline-none text-xs font-mono"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={filters.brand || 'All'}
            onChange={(e) => onFiltersChange({ ...filters, brand: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none text-xs font-mono"
          >
            <option value="All">All Brands</option>
            {availableBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={filters.availability || 'All'}
            onChange={(e) =>
              onFiltersChange({ ...filters, availability: e.target.value as WatchAvailability | 'All' })
            }
            className="px-3 py-1.5 rounded-xl bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none text-xs font-mono"
          >
            <option value="All">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="waitlist">Waitlist</option>
            <option value="pre_order">Pre-Order</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFiltersChange({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })
            }
            className="px-3 py-1.5 rounded-xl bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none text-xs font-mono"
          >
            <option value="order">Manual Order</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-drop">Largest Price Drops</option>
            <option value="date-newest">Date Added: Newest</option>
            <option value="date-oldest">Date Added: Oldest</option>
          </select>
        </div>
      </div>

      {/* Occasion Filter Pills (Horological Occasion Centric) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
        <span className="text-steel-500 text-[11px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          Occasion:
        </span>
        {['All', ...availableOccasions].map((occ) => {
          const isSelected = (filters.occasion || 'All') === occ;

          return (
            <button
              key={occ}
              onClick={() => onFiltersChange({ ...filters, occasion: occ })}
              className={`px-3 py-1 rounded-full border shrink-0 transition-all ${
                isSelected
                  ? 'bg-gold-500/20 text-gold-300 border-gold-500/50 shadow-gold font-semibold'
                  : 'bg-dial-900/60 border-white/10 text-steel-400 hover:text-white hover:border-white/20'
              }`}
            >
              {occ === 'Grail Goal' && <Sparkles className="w-2.5 h-2.5 inline mr-1 text-gold-400" />}
              {occ}
            </button>
          );
        })}
      </div>
    </div>
  );
}
