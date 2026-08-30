'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Watch, WatchStatus, FilterOptions } from '@/lib/types';
import { HeaderClock } from '@/components/HeaderClock';
import { MechanicalBackground } from '@/components/MechanicalBackground';
import { StatsRibbon } from '@/components/StatsRibbon';
import { FilterBar } from '@/components/FilterBar';
import { WatchCard } from '@/components/WatchCard';
import { CasebackModal } from '@/components/CasebackModal';
import { AddWatchModal } from '@/components/AddWatchModal';
import {
  Plus,
  Compass,
  Sparkles,
  Watch as WatchIcon,
  ShieldAlert,
  Archive,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<WatchStatus>('wishlist');
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'wishlist',
    occasion: 'All',
    brand: 'All',
    availability: 'All',
    searchQuery: '',
    sortBy: 'order',
  });

  const fetchWatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/watches');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWatches(json.data);
      }
    } catch (err) {
      console.error('Failed to load watches:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and automatic background sync
  useEffect(() => {
    fetchWatches().then(() => {
      // Trigger background auto-sync without blocking initial render
      fetch('/api/cron/recheck', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.summary && data.summary.processed > 0) {
            fetchWatches();
          }
        })
        .catch((err) => console.warn('Automatic background sync skipped:', err));
    });
  }, [fetchWatches]);

  // Keep selected watch in sync with main array
  useEffect(() => {
    if (selectedWatch) {
      const refreshed = watches.find((w) => w.id === selectedWatch.id);
      if (refreshed) {
        setSelectedWatch(refreshed);
      }
    }
  }, [watches, selectedWatch]);

  const handleAddWatch = async (newWatch: Partial<Watch>) => {
    const res = await fetch('/api/watches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWatch),
    });
    const json = await res.json();
    if (json.success) {
      await fetchWatches();
    }
  };

  const handleUpdateWatch = async (updated: Partial<Watch> & { id: string }) => {
    const res = await fetch(`/api/watches/${updated.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const json = await res.json();
    if (json.success) {
      await fetchWatches();
    }
  };

  const handleDeleteWatch = async (id: string) => {
    const res = await fetch(`/api/watches/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (json.success) {
      await fetchWatches();
      setSelectedWatch(null);
    }
  };

  // Distinct Brands and Occasions
  const availableBrands = Array.from(new Set(watches.map((w) => w.brand).filter(Boolean))).sort();
  const availableOccasions = Array.from(
    new Set(
      [
        'Grail Goal',
        'Birthday',
        'Anniversary',
        'Milestone',
        'Promotion',
        'Graduation',
        'Wedding',
        'Just Because',
        ...watches.map((w) => w.occasion).filter(Boolean),
      ]
    )
  ).sort();

  // Filtered & Sorted Display List
  const displayedWatches = watches
    .filter((w) => w.status === currentTab)
    .filter((w) => {
      if (filters.occasion && filters.occasion !== 'All' && w.occasion !== filters.occasion) {
        return false;
      }
      if (filters.brand && filters.brand !== 'All' && w.brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }
      if (filters.availability && filters.availability !== 'All' && w.availability !== filters.availability) {
        return false;
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = w.title.toLowerCase().includes(q);
        const matchBrand = w.brand.toLowerCase().includes(q);
        const matchModel = w.model.toLowerCase().includes(q);
        const matchRef = w.referenceNumber?.toLowerCase().includes(q);
        const matchCaliber = w.specs?.movementCaliber?.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchModel && !matchRef && !matchCaliber) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          return a.currentPrice - b.currentPrice;
        case 'price-desc':
          return b.currentPrice - a.currentPrice;
        case 'price-drop':
          return (b.priceDropPercentage || 0) - (a.priceDropPercentage || 0);
        case 'date-newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'order':
        default:
          return (a.displayOrder || 0) - (b.displayOrder || 0);
      }
    });

  const wishlistCount = watches.filter((w) => w.status === 'wishlist').length;
  const acquiredCount = watches.filter((w) => w.status === 'acquired').length;

  return (
    <main className="relative min-h-screen pb-20 overflow-hidden">
      {/* Ambient Horological Movement Background */}
      <MechanicalBackground />

      {/* Primary Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Bar */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
          {/* Logo & Horology Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl fluted-bezel p-[2px] shadow-gold">
              <div className="w-full h-full rounded-2xl bg-dial-950 flex items-center justify-center border border-gold-500/30">
                <Compass className="w-6 h-6 text-gold-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-black tracking-widest text-white">
                  TIMEGRAPH
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-500/40 font-semibold tracking-wider">
                  CAL. 2026
                </span>
              </div>
              <p className="text-[11px] font-mono text-steel-400">
                Precision Watchmaking Wishlist & Autonomous Retailer Tracker
              </p>
            </div>
          </div>

          {/* Right Header: Live Clock & Crown Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Working Analog Mechanical Clock */}
            <HeaderClock />

            {/* Add Watch Button (Crown-Winding CTA) */}
            <button
              onClick={() => {
                setIsAddOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-gold-500 hover:bg-gold-400 text-black font-semibold font-mono text-xs flex items-center gap-2 shadow-gold transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Watch by Link</span>
            </button>
          </div>
        </header>

        {/* Portfolio Stats Ribbon */}
        <StatsRibbon watches={watches} />

        {/* Filters & Tabs */}
        <FilterBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          filters={filters}
          onFiltersChange={setFilters}
          availableBrands={availableBrands}
          availableOccasions={availableOccasions}
          wishlistCount={wishlistCount}
          acquiredCount={acquiredCount}
        />

        {/* Watch Dial Grid */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full fluted-bezel p-1 animate-spin">
              <div className="w-full h-full rounded-full bg-dial-950 border border-gold-400/40" />
            </div>
            <p className="font-mono text-xs text-gold-400 tracking-wider uppercase">
              Escapement synchronizing watch records...
            </p>
          </div>
        ) : displayedWatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedWatches.map((watch) => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onOpenDetail={setSelectedWatch}
                onMarkAcquired={(w) =>
                  handleUpdateWatch({
                    id: w.id,
                    status: w.status === 'acquired' ? 'wishlist' : 'acquired',
                    acquiredDate:
                      w.status === 'wishlist' ? new Date().toISOString().split('T')[0] : undefined,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-3xl bg-dial-900/40 border border-white/10 p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dial-800 flex items-center justify-center text-steel-400">
              {currentTab === 'acquired' ? <Archive className="w-8 h-8" /> : <WatchIcon className="w-8 h-8" />}
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-1">
              {currentTab === 'acquired'
                ? 'No Acquired Timepieces in Archive'
                : 'No Watches Match Your Dial Filters'}
            </h3>
            <p className="font-mono text-xs text-steel-400 max-w-md mx-auto mb-6">
              {currentTab === 'acquired'
                ? 'Mark watches as acquired from your active wishlist to curate your permanent horological collection showcase.'
                : 'Try adjusting your occasion, brand, or availability filters, or paste a new watch URL to begin tracking.'}
            </p>
            {currentTab === 'wishlist' && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-6 py-2.5 rounded-full bg-gold-500 hover:bg-gold-400 text-black font-semibold font-mono text-xs inline-flex items-center gap-2 shadow-gold"
              >
                <Plus className="w-4 h-4" />
                Add First Timepiece
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail / Caseback Exhibition Modal */}
      <CasebackModal
        watch={selectedWatch}
        isOpen={!!selectedWatch}
        onClose={() => setSelectedWatch(null)}
        onUpdate={handleUpdateWatch}
        onDelete={handleDeleteWatch}
      />

      {/* Add Watch Modal */}
      <AddWatchModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddWatch={handleAddWatch}
      />
    </main>
  );
}
