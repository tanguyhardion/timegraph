'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, ShieldAlert, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function MasterPasswordModal({ isOpen, onSuccess }: MasterPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPassword('');
        onSuccess();
      } else {
        setError(data.error || 'Invalid master password');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dial-950/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-2xl border border-gold-500/20 bg-dial-900/90 p-8 shadow-2xl shadow-gold-950/40 backdrop-blur-2xl"
        >
          {/* Subtle horology background crest */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex h-20 w-20 items-center justify-center rounded-full border border-gold-500/40 bg-dial-950 shadow-xl shadow-gold-500/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-700/10 border border-gold-500/30">
              <Lock className="h-6 w-6 text-gold-400 animate-pulse" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-300 text-xs tracking-wider uppercase font-mono font-medium mb-2">
              <Clock className="w-3 h-3" /> Timegraph Vault
            </div>
            <h2 className="text-2xl font-serif tracking-wide text-slate-100">
              Master Authentication
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              This horology collection is restricted. Enter your master passkey to unlock the vault and manage timepieces.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Master Passkey..."
                  autoFocus
                  required
                  className="w-full rounded-xl border border-white/10 bg-dial-950/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-gold-500/50 focus:bg-dial-950 focus:outline-none focus:ring-1 focus:ring-gold-500/50 font-mono tracking-widest"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-300"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 py-3 px-4 text-sm font-medium text-dial-950 shadow-lg shadow-gold-500/20 transition-all hover:from-gold-500 hover:to-gold-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Vault Access...</span>
                </>
              ) : (
                <>
                  <span>Unlock Vault</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[11px] text-slate-500 font-mono">
            Protected by cryptographically signed HTTP-only session cookies
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
