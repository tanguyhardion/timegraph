'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Watch } from '@/lib/types';
import { formatCurrency, formatDate, getRelativeTime, getOccasionStyle, AVAILABILITY_CONFIG } from '@/lib/utils';
import { SparklineChart } from './SparklineChart';
import { ExternalLink, CheckCircle2, ShieldAlert, Sparkles, Compass, Eye } from 'lucide-react';

interface WatchCardProps {
  watch: Watch;
  onOpenDetail: (watch: Watch) => void;
  onMarkAcquired: (watch: Watch) => void;
}

export function WatchCard({ watch, onOpenDetail, onMarkAcquired }: WatchCardProps) {
  const [imgError, setImgError] = useState(false);

  const occasionStyle = getOccasionStyle(watch.occasion);
  const availStyle = AVAILABILITY_CONFIG[watch.availability] || AVAILABILITY_CONFIG['unknown'];

  const isAcquired = watch.status === 'acquired';
  const hasPriceDrop = (watch.priceDropPercentage || 0) > 0;
  const isGrail = watch.occasion === 'Grail Goal';

  return (
    <div
      onClick={() => onOpenDetail(watch)}
      className={`group relative rounded-2xl bg-dial-900/80 border transition-all duration-300 cursor-pointer overflow-hidden p-5 flex flex-col justify-between ${
        isGrail
          ? 'border-gold-500/40 shadow-gold hover:border-gold-400'
          : 'border-white/10 hover:border-gold-500/30 hover:shadow-dial-lg'
      }`}
    >
      {/* Top Header: Brand & Occasion Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-gold-400 uppercase font-medium">
            {watch.brand}
          </span>
          <h3 className="font-display text-base font-semibold text-white tracking-wide line-clamp-1 group-hover:text-gold-200 transition-colors">
            {watch.model}
          </h3>
          {watch.referenceNumber && (
            <p className="text-[11px] font-mono text-steel-400">
              Ref. {watch.referenceNumber}
            </p>
          )}
        </div>

        {/* Occasion Badge */}
        <span
          className={`text-[10px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${occasionStyle.bg} ${occasionStyle.text} ${occasionStyle.border}`}
        >
          {isGrail && <Sparkles className="w-2.5 h-2.5 text-gold-400" />}
          {watch.occasion}
        </span>
      </div>

      {/* Centerpiece: Dial Bezel Frame with Circular Watch Photo */}
      <div className="relative my-3 flex items-center justify-center">
        {/* Outer Fluted/Brushed Bezel */}
        <div
          className={`relative w-44 h-44 rounded-full p-2.5 shadow-[0_10px_25px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:scale-105 ${
            isGrail ? 'fluted-bezel-gold' : 'fluted-bezel'
          }`}
        >
          {/* Inner Dial Ring & Sapphire Glare */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-dial-950 border-2 border-dial-800 flex items-center justify-center">
            {/* Sunburst Glare Overlay on hover */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15)_0%,transparent_60%)] z-10 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-300" />

            {/* Dial Hour Markers Ring */}
            <div className="absolute inset-0.5 rounded-full border border-white/5 pointer-events-none z-10" />

            {/* Watch Image */}
            <img
              src={
                imgError || !watch.imageUrl
                  ? 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'
                  : watch.imageUrl
              }
              alt={watch.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </div>

        {/* Acquired Stamp Overlay */}
        {isAcquired && (
          <div className="absolute top-2 right-2 rotate-12 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 px-3 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase shadow-lg backdrop-blur-sm">
            ✓ Acquired {watch.acquiredDate ? formatDate(watch.acquiredDate) : ''}
          </div>
        )}
      </div>

      {/* Specs Glance Strip */}
      <div className="grid grid-cols-3 gap-1 py-2 px-2.5 my-2 rounded-lg bg-dial-950/60 border border-white/5 text-[10px] font-mono text-steel-400">
        <div className="text-center truncate">
          <span className="text-steel-500 block text-[9px]">DIAMETER</span>
          <span className="text-steel-200">{watch.specs.caseDiameter || '40mm'}</span>
        </div>
        <div className="text-center truncate border-x border-white/5 px-1">
          <span className="text-steel-500 block text-[9px]">CALIBER</span>
          <span className="text-steel-200">{watch.specs.movementCaliber || 'Automatic'}</span>
        </div>
        <div className="text-center truncate">
          <span className="text-steel-500 block text-[9px]">WATER RES</span>
          <span className="text-steel-200">{watch.specs.waterResistance || '100m'}</span>
        </div>
      </div>

      {/* Price & Sparkline Section */}
      <div className="mt-2 pt-3 border-t border-white/10 flex items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-white tracking-tight">
              {formatCurrency(watch.currentPrice, watch.currency)}
            </span>
            {hasPriceDrop && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                ↓ {watch.priceDropPercentage}%
              </span>
            )}
          </div>

          {/* Availability Status Dot */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${availStyle.dot}`} />
            <span className={availStyle.text}>{availStyle.label}</span>
          </div>
        </div>

        {/* Price History Sparkline */}
        {watch.priceHistory && watch.priceHistory.length > 0 && (
          <div className="shrink-0 flex flex-col items-end">
            <SparklineChart
              history={watch.priceHistory}
              currentPrice={watch.currentPrice}
              currency={watch.currency}
              width={100}
              height={32}
            />
            <span className="text-[9px] font-mono text-steel-500 mt-0.5">
              Synced {getRelativeTime(watch.lastScrapedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Actions Toolbar */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-steel-400">
        <div>
          {/* Retailer Listing Link */}
          {watch.url && (
            <a
              href={watch.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Open ${watch.retailerName || 'listing'} product page`}
              className="p-1.5 rounded-lg bg-dial-800/80 hover:bg-dial-700 hover:text-white border border-white/5 transition-all inline-flex items-center gap-1.5 text-xs font-mono"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Listing</span>
            </a>
          )}
        </div>

        {/* View Caseback / Inspect Action */}
        <button
          onClick={() => onOpenDetail(watch)}
          className="flex items-center gap-1 text-[11px] font-mono text-gold-400/90 hover:text-gold-300 hover:underline px-2 py-1"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Caseback</span>
        </button>
      </div>
    </div>
  );
}
