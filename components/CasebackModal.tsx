'use client';

import React, { useState, useEffect } from 'react';
import { Watch, WatchOccasion, WatchAvailability, WatchStatus } from '@/lib/types';
import { formatCurrency, formatDate, getRelativeTime, getOccasionStyle, AVAILABILITY_CONFIG } from '@/lib/utils';
import { SparklineChart } from './SparklineChart';
import {
  X,
  ExternalLink,
  CheckCircle,
  Archive,
  Trash2,
  Edit3,
  Save,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingDown,
  Info,
} from 'lucide-react';

interface CasebackModalProps {
  watch: Watch | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedWatch: Partial<Watch> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AVAILABILITIES: { value: WatchAvailability; label: string }[] = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'waitlist', label: 'Waitlist / Inquire' },
  { value: 'pre_order', label: 'Pre-Order' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'unknown', label: 'Status Pending' },
];

export function CasebackModal({
  watch,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: CasebackModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'history' | 'edit'>('specs');

  // Form state for edits
  const [formData, setFormData] = useState<Partial<Watch>>({});

  useEffect(() => {
    if (watch) {
      setFormData({
        title: watch.title,
        brand: watch.brand,
        model: watch.model,
        referenceNumber: watch.referenceNumber,
        currentPrice: watch.currentPrice,
        originalPrice: watch.originalPrice,
        currency: watch.currency || 'EUR',
        occasion: watch.occasion,
        availability: watch.availability,
        status: watch.status,
        acquiredDate: watch.acquiredDate,
        notes: watch.notes,
        imageUrl: watch.imageUrl,
        specs: { ...watch.specs },
      });
      setIsEditing(false);
      setActiveTab('specs');
    }
  }, [watch]);

  if (!isOpen || !watch) return null;

  const handleSave = async () => {
    if (!watch) return;
    setIsSaving(true);
    try {
      await onUpdate({
        id: watch.id,
        ...formData,
      });
      setIsEditing(false);
      setActiveTab('specs');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAcquired = async () => {
    if (!watch) return;
    const newStatus: WatchStatus = watch.status === 'acquired' ? 'wishlist' : 'acquired';
    const newDate = newStatus === 'acquired' ? new Date().toISOString().split('T')[0] : undefined;
    await onUpdate({
      id: watch.id,
      status: newStatus,
      acquiredDate: newDate,
    });
  };

  const isAcquired = watch.status === 'acquired';
  const occasionStyle = getOccasionStyle(watch.occasion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container: Styled as Sapphire Exhibition Caseback */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-dial-950 border-2 border-gold-500/40 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(207,159,45,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Caseback Bezel Header */}
        <div className="fluted-bezel p-1 shrink-0">
          <div className="bg-dial-900/95 px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-dial-950 border border-gold-400/50 flex items-center justify-center text-gold-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-semibold">
                  EXHIBITION CASEBACK & ARCHIVE
                </span>
                <h2 className="font-display text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  {watch.brand} {watch.model}
                  {watch.referenceNumber && (
                    <span className="text-xs font-mono text-steel-400 font-normal">
                      · Ref. {watch.referenceNumber}
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-dial-800 text-steel-400 hover:text-white hover:bg-dial-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2 bg-dial-900 border-b border-white/10 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('specs');
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'specs' && !isEditing
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-medium'
                  : 'text-steel-400 hover:text-white'
              }`}
            >
              Movement & Specs
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-medium'
                  : 'text-steel-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Price History Log ({watch.priceHistory?.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab('edit');
                setIsEditing(true);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isEditing
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-medium'
                  : 'text-steel-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>

          {/* Quick Status / Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAcquired}
              className={`px-3 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                isAcquired
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-dial-800 border-white/10 text-steel-300 hover:text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {isAcquired ? 'Acquired in Collection' : 'Mark as Acquired'}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Movement & Specs Exhibition */}
          {activeTab === 'specs' && !isEditing && (
            <div className="space-y-6">
              {/* Primary Showcase Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-2xl bg-dial-900/60 border border-white/10 cotes-de-geneve">
                {/* Watch Photo Dial Motif */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-48 h-48 rounded-full fluted-bezel p-2 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-dial-950 border border-white/20">
                      <img
                        src={watch.imageUrl}
                        alt={watch.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Main Information & Occasion */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-gold-400 tracking-wider uppercase">
                        {watch.brand}
                      </span>
                      <h3 className="font-display text-2xl font-bold text-white">
                        {watch.model}
                      </h3>
                    </div>

                    <span
                      className={`text-xs font-mono px-3 py-1 rounded-full border ${occasionStyle.bg} ${occasionStyle.text} ${occasionStyle.border}`}
                    >
                      Occasion: {watch.occasion}
                    </span>
                  </div>

                  {/* Price & Scrape Badge */}
                  <div className="flex items-center gap-4 py-3 border-y border-white/10">
                    <div>
                      <span className="text-[10px] font-mono text-steel-400 uppercase block">CURRENT MARKET PRICE</span>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-2xl font-bold text-gold-300">
                          {formatCurrency(watch.currentPrice, watch.currency)}
                        </span>
                        {watch.originalPrice && watch.originalPrice > watch.currentPrice && (
                          <span className="text-xs font-mono line-through text-steel-500">
                            {formatCurrency(watch.originalPrice, watch.currency)}
                          </span>
                        )}
                        {(watch.priceDropPercentage || 0) > 0 && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ↓ {watch.priceDropPercentage}% drop
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <span className="text-[10px] font-mono text-steel-400 uppercase block">STOCK AVAILABILITY</span>
                      <span className="font-mono text-sm font-medium text-white">
                        {AVAILABILITIES.find((a) => a.value === watch.availability)?.label || watch.availability.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {watch.notes && (
                    <div className="p-3 rounded-lg bg-dial-950/80 border border-white/5 text-xs text-steel-300 leading-relaxed">
                      <span className="font-mono text-gold-400 block mb-1">Collector's Notes:</span>
                      {watch.notes}
                    </div>
                  )}

                  {/* External Retailer Link */}
                  {watch.url && (
                    <div className="flex items-center justify-end text-xs font-mono text-steel-400 pt-2">
                      <a
                        href={watch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 flex items-center gap-1.5 border border-gold-500/40"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Listing
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Horological Specifications Matrix */}
              <div>
                <h4 className="font-mono text-xs text-gold-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Technical Specifications
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">CASE DIAMETER</span>
                    <span className="text-white font-medium">{watch.specs.caseDiameter || '40mm'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">THICKNESS</span>
                    <span className="text-white font-medium">{watch.specs.caseThickness || '12mm'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">LUG-TO-LUG</span>
                    <span className="text-white font-medium">{watch.specs.lugToLug || '47mm'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">WATER RESISTANCE</span>
                    <span className="text-white font-medium">{watch.specs.waterResistance || '100m / 330ft'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">CALIBRE MOVEMENT</span>
                    <span className="text-gold-300 font-medium">{watch.specs.movementCaliber || 'Mechanical In-House'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">WINDING TYPE</span>
                    <span className="text-white font-medium">{watch.specs.movementType || 'Automatic'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">POWER RESERVE</span>
                    <span className="text-white font-medium">{watch.specs.powerReserve || '70 hours'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-dial-900/50 border border-white/5">
                    <span className="text-steel-500 block text-[10px]">CASE MATERIAL</span>
                    <span className="text-white font-medium">{watch.specs.caseMaterial || 'Stainless Steel'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Price History Log */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-dial-900/60 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-display text-lg font-bold text-white">Price Trajectory Curve</h4>
                    <p className="text-xs font-mono text-steel-400">
                      Tracking recorded dips, dealer promotions, and MSRP revisions.
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-steel-400 block">Lowest Recorded</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(watch.lowestRecordedPrice || watch.currentPrice, watch.currency)}
                    </span>
                  </div>
                </div>

                <div className="py-4">
                  <SparklineChart
                    history={watch.priceHistory || []}
                    currentPrice={watch.currentPrice}
                    currency={watch.currency}
                    width={650}
                    height={100}
                    showLabels
                  />
                </div>
              </div>

              {/* Price History Table Log */}
              <div className="rounded-2xl bg-dial-900/40 border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 font-mono text-xs text-gold-400 uppercase tracking-wider">
                  Append-Only Price & Availability Log
                </div>
                <div className="divide-y divide-white/5 font-mono text-xs">
                  {watch.priceHistory && watch.priceHistory.length > 0 ? (
                    watch.priceHistory.map((entry, index) => (
                      <div key={entry.id || index} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <span className="text-steel-500">#{index + 1}</span>
                          <span className="text-white font-semibold">
                            {formatCurrency(entry.price, entry.currency)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-dial-800 text-steel-300">
                            {AVAILABILITY_CONFIG[entry.availability]?.label || entry.availability.replace(/_/g, ' ')}
                          </span>
                          {entry.note && (
                            <span className="text-gold-300 text-[11px]">· {entry.note}</span>
                          )}
                        </div>
                        <span className="text-steel-500 text-[11px]">
                          {formatDate(entry.recordedAt)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-steel-500">No price history points recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Manual Override / Edit */}
          {(activeTab === 'edit' || isEditing) && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/20 text-xs text-gold-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Scraping isn't always 100% perfect depending on retailer paywalls and layout shifts. You have full manual override control over all parameters below.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-steel-400 block mb-1">BRAND</label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-steel-400 block mb-1">MODEL NAME</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-steel-400 block mb-1">REFERENCE NUMBER</label>
                  <input
                    type="text"
                    value={formData.referenceNumber || ''}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-steel-400 block mb-1">PURCHASE OCCASION</label>
                  <input
                    type="text"
                    placeholder="e.g. Grail Goal, Birthday, Milestone"
                    value={formData.occasion || ''}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-steel-400 block mb-1">PRICE (€)</label>
                  <input
                    type="number"
                    value={formData.currentPrice || 0}
                    onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-steel-400 block mb-1">AVAILABILITY</label>
                  <select
                    value={formData.availability || 'in_stock'}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value as WatchAvailability })}
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  >
                    {AVAILABILITIES.map((av) => (
                      <option key={av.value} value={av.value}>
                        {av.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-steel-400 block mb-1">CASE DIAMETER</label>
                  <input
                    type="text"
                    value={formData.specs?.caseDiameter || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specs: { ...formData.specs, caseDiameter: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-steel-400 block mb-1">MOVEMENT CALIBER</label>
                  <input
                    type="text"
                    value={formData.specs?.movementCaliber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specs: { ...formData.specs, movementCaliber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-steel-400 block mb-1">IMAGE URL</label>
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-steel-400 block mb-1">COLLECTOR'S NOTES / REASONING</label>
                  <textarea
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Why this watch? What milestone does it commemorate?"
                    className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Save & Delete Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this timepiece from your wishlist?')) {
                      onDelete(watch.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Watch
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setActiveTab('specs');
                    }}
                    className="px-4 py-2 rounded-lg bg-dial-800 text-steel-400 hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-xs font-mono flex items-center gap-1.5 shadow-gold disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
