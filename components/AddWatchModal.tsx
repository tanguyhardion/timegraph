'use client';

import React, { useState } from 'react';
import { Watch, WatchOccasion, WatchAvailability, ScrapedWatchData } from '@/lib/types';
import { formatCurrency, horologyAudio } from '@/lib/utils';
import { X, Link2, Sparkles, Wand2, Check, AlertCircle, RefreshCw, Compass } from 'lucide-react';

interface AddWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWatch: (newWatch: Partial<Watch>) => Promise<void>;
}

const OCCASIONS: WatchOccasion[] = [
  'Grail Goal',
  'Birthday',
  'Anniversary',
  'Milestone',
  'Promotion',
  'Graduation',
  'Wedding',
  'New Child',
  'Retirement',
  'Just Because',
];

const SAMPLE_WATCH_URLS = [
  { label: 'Rolex Submariner 41mm', url: 'https://www.rolex.com/watches/submariner/m126610ln-0001' },
  { label: 'Omega Speedmaster Professional', url: 'https://www.omegawatches.com/en-us/watch-omega-speedmaster-moonwatch-professional-co-axial-master-chronometer-chronograph-42-mm-31030425001002' },
  { label: 'Patek Philippe Aquanaut', url: 'https://www.patek.com/en/collection/aquanaut/5167A-001' },
  { label: 'Grand Seiko Snowflake SBGA211', url: 'https://grand-seiko.com/us-en/collections/sbga211g' },
];

export function AddWatchModal({ isOpen, onClose, onAddWatch }: AddWatchModalProps) {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedWatchData | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Editable watch state
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [occasion, setOccasion] = useState<WatchOccasion>('Grail Goal');
  const [availability, setAvailability] = useState<WatchAvailability>('in_stock');
  const [imageUrl, setImageUrl] = useState('');
  const [caseDiameter, setCaseDiameter] = useState('');
  const [movementCaliber, setMovementCaliber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleScrape = async (targetUrl: string = url) => {
    if (!targetUrl.trim()) return;
    setIsScraping(true);
    setScrapeError(null);
    horologyAudio.playCrownWinding();

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data: ScrapedWatchData = json.data;
        setScrapedData(data);
        setTitle(data.title || `${data.brand || ''} ${data.model || ''}`);
        setBrand(data.brand || 'Luxury Watchmaker');
        setModel(data.model || data.title || 'Reference Model');
        setReferenceNumber(data.referenceNumber || '');
        setPrice(data.price || 0);
        setCurrency(data.currency || 'USD');
        setAvailability(data.availability || 'in_stock');
        setImageUrl(
          data.imageUrl ||
            'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
        );
        if (data.specs?.caseDiameter) setCaseDiameter(data.specs.caseDiameter);
        if (data.specs?.movementCaliber) setMovementCaliber(data.specs.movementCaliber);
      } else {
        setScrapeError(json.error || 'Failed to extract metadata. You can fill details manually.');
      }
    } catch (err: any) {
      setScrapeError(err.message || 'Scraping error');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model && !title) return;

    setIsSaving(true);
    horologyAudio.playCrownWinding();

    try {
      await onAddWatch({
        url: url.trim(),
        title: title || `${brand} ${model}`,
        brand: brand || 'Independent',
        model: model || title || 'Model',
        referenceNumber,
        currentPrice: Number(price) || 0,
        originalPrice: Number(price) || 0,
        currency,
        occasion,
        availability,
        status: 'wishlist',
        imageUrl:
          imageUrl ||
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
        specs: {
          caseDiameter: caseDiameter || '40mm',
          movementCaliber: movementCaliber || 'Automatic',
          movementType: 'Automatic',
          waterResistance: '100m',
          powerReserve: '70 hours',
        },
        notes,
        scrapeStatus: scrapedData ? 'success' : 'manual',
      });
      onClose();
      // Reset form
      setUrl('');
      setScrapedData(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-dial-950 border-2 border-gold-500/50 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(207,159,45,0.2)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fluted Gold Header */}
        <div className="fluted-bezel p-1 shrink-0">
          <div className="bg-dial-900/95 px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-400 flex items-center justify-center text-gold-300 shadow-gold">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-gold-400 uppercase font-semibold">
                  AUTONOMOUS SCRAPING & WISHLIST INTAKE
                </span>
                <h2 className="font-display text-lg font-bold text-white tracking-wide">
                  Add Timepiece by Link
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-dial-800 text-steel-400 hover:text-white hover:bg-dial-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* URL Input & Auto-Scrape Trigger */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-gold-400 block tracking-wider uppercase">
              1. Paste Product URL (ScrapingAnt Engine)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-steel-500">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="https://www.hodinkee.com/..., https://www.rolex.com/..., https://www.chrono24.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dial-900 border border-white/10 text-white placeholder:text-steel-600 focus:border-gold-400 focus:outline-none text-xs font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => handleScrape()}
                disabled={isScraping || !url.trim()}
                className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-xs font-mono flex items-center gap-2 transition-all shadow-gold disabled:opacity-50 shrink-0"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Winding / Scraping...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Auto-Extract
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Links */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-steel-500">Quick Try:</span>
              {SAMPLE_WATCH_URLS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    handleScrape(sample.url);
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-dial-800 hover:bg-dial-700 text-steel-300 hover:text-gold-300 border border-white/5 transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {scrapeError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scrapeError}</span>
              </div>
            )}
          </div>

          {/* Scraped Preview Card */}
          {scrapedData && (
            <div className="p-4 rounded-2xl bg-dial-900/80 border border-gold-500/30 flex items-center gap-4 animate-in fade-in">
              <div className="w-20 h-20 rounded-full fluted-bezel p-1 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-dial-950">
                  <img
                    src={scrapedData.imageUrl || imageUrl}
                    alt="Scraped Watch"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gold-400 uppercase font-semibold">
                    ✓ Scraped from {scrapedData.retailerName || 'Retailer'}
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold text-white truncate">
                  {scrapedData.title || `${brand} ${model}`}
                </h4>
                <div className="flex items-center gap-3 text-xs font-mono mt-1 text-steel-400">
                  <span className="text-gold-300 font-bold">
                    {formatCurrency(scrapedData.price || price, currency)}
                  </span>
                  <span>·</span>
                  <span className="capitalize">{scrapedData.availability || 'In Stock'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Watch Specifications & Manual Fields */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <label className="text-xs font-mono text-gold-400 block tracking-wider uppercase">
              2. Horological Details & Occasion
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-steel-400 block mb-1">BRAND</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rolex, Omega, Patek Philippe"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-steel-400 block mb-1">MODEL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cosmograph Daytona, Speedmaster"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-steel-400 block mb-1">REFERENCE NUMBER</label>
                <input
                  type="text"
                  placeholder="e.g. 126500LN, 310.30.42.50.01.002"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-steel-400 block mb-1">OCCASION FOR PURCHASE</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as WatchOccasion)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-steel-400 block mb-1">PRICE (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 15100"
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-steel-400 block mb-1">CASE DIAMETER</label>
                <input
                  type="text"
                  placeholder="e.g. 40mm"
                  value={caseDiameter}
                  onChange={(e) => setCaseDiameter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-steel-400 block mb-1">IMAGE URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-steel-400 block mb-1">COLLECTOR'S NOTES / OCCASION MEANING</label>
                <textarea
                  rows={2}
                  placeholder="Why this watch? What milestone or personal accomplishment does it celebrate?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-dial-800 text-steel-400 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || (!model && !title)}
              className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-xs font-mono flex items-center gap-2 shadow-gold disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Winding & Saving...' : 'Add to Wishlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
