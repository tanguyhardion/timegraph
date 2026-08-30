'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, RefreshCw, Database, Check, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { horologyAudio } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSeed: () => Promise<void>;
  onSyncAll: () => Promise<void>;
}

export function SettingsModal({ isOpen, onClose, onResetSeed, onSyncAll }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('timegraph_scrapingant_key') || '';
      setApiKey(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timegraph_scrapingant_key', apiKey.trim());
      setIsSaved(true);
      horologyAudio.playCrownWinding();
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset all watches and price history back to luxury seed collection?')) {
      setIsResetting(true);
      horologyAudio.playCrownWinding();
      try {
        await onResetSeed();
        onClose();
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    horologyAudio.playCrownWinding();
    try {
      await onSyncAll();
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-dial-950 border-2 border-gold-500/40 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="fluted-bezel p-1">
          <div className="bg-dial-900 px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold-400" />
              <h3 className="font-display text-base font-bold text-white">Timegraph Calibration</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-dial-800 text-steel-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs font-mono">
          {/* ScrapingAnt API Key */}
          <div className="space-y-2">
            <label className="text-gold-400 uppercase tracking-wider block flex items-center gap-1.5 font-semibold">
              <Key className="w-3.5 h-3.5" /> ScrapingAnt API Key
            </label>
            <p className="text-steel-400 text-[11px] leading-relaxed">
              ScrapingAnt is used to render Javascript and bypass anti-bot challenges for retailer sites. (If left blank or locally offline, the built-in fallback parser operates seamlessly).
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter your ScrapingAnt API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-dial-900 border border-white/10 text-white focus:border-gold-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold shrink-0 shadow-gold flex items-center gap-1"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          {/* Vercel Cron Info */}
          <div className="p-3.5 rounded-xl bg-dial-900/60 border border-white/10 space-y-1.5">
            <span className="text-white font-semibold flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Vercel Cron Scheduled Scraping
            </span>
            <p className="text-steel-400 text-[11px] leading-relaxed">
              Daily cron scheduled via <code className="text-gold-300">vercel.json</code> to re-scrape active wishlist listings at <code className="text-gold-300">/api/cron/recheck</code>, capturing price drops and restocks.
            </p>
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="mt-2 w-full py-2 rounded-lg bg-dial-800 hover:bg-dial-700 text-white border border-white/10 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-gold-400' : ''}`} />
              {isSyncingAll ? 'Synchronizing All Active Watches...' : 'Trigger Manual Cron Re-Scrape Now'}
            </button>
          </div>

          {/* Demo Reset */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-white block font-semibold">Demo Showcase Data</span>
              <span className="text-steel-500 text-[10px]">Restore sample Lange, Rolex, Patek, Cartier models</span>
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-3 py-1.5 rounded-lg bg-dial-900 border border-white/10 text-steel-400 hover:text-white flex items-center gap-1.5"
            >
              <Database className="w-3 h-3 text-gold-400" />
              {isResetting ? 'Resetting...' : 'Reset Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
