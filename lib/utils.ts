import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WatchAvailability, WatchOccasion } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `€${amount.toLocaleString()}`;
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function getRelativeTime(isoString?: string): string {
  if (!isoString) return 'Never';
  try {
    const now = Date.now();
    const past = new Date(isoString).getTime();
    const diffSeconds = Math.floor((now - past) / 1000);

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(isoString);
  } catch {
    return 'Unknown';
  }
}

export const OCCASION_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Birthday: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    glow: 'rgba(245, 158, 11, 0.2)',
  },
  Anniversary: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    glow: 'rgba(244, 63, 94, 0.2)',
  },
  Milestone: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    glow: 'rgba(168, 85, 247, 0.2)',
  },
  Promotion: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    glow: 'rgba(16, 185, 129, 0.2)',
  },
  Graduation: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    glow: 'rgba(14, 165, 233, 0.2)',
  },
  Wedding: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-300',
    border: 'border-pink-500/30',
    glow: 'rgba(236, 72, 153, 0.2)',
  },
  'New Child': {
    bg: 'bg-teal-500/10',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
    glow: 'rgba(20, 184, 166, 0.2)',
  },
  Retirement: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-300',
    border: 'border-yellow-500/30',
    glow: 'rgba(234, 179, 8, 0.2)',
  },
  'Grail Goal': {
    bg: 'bg-yellow-400/20',
    text: 'text-yellow-200 font-semibold',
    border: 'border-yellow-400/50',
    glow: 'rgba(250, 204, 21, 0.35)',
  },
  'Just Because': {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-300',
    border: 'border-zinc-500/30',
    glow: 'rgba(161, 161, 170, 0.2)',
  },
};

export function getOccasionStyle(occasion?: string) {
  if (!occasion) return OCCASION_COLORS['Just Because'];
  if (OCCASION_COLORS[occasion]) return OCCASION_COLORS[occasion];
  return {
    bg: 'bg-gold-500/10',
    text: 'text-gold-300',
    border: 'border-gold-500/30',
    glow: 'rgba(207, 159, 45, 0.2)',
  };
}

export const AVAILABILITY_CONFIG: Record<
  WatchAvailability,
  { label: string; bg: string; text: string; dot: string }
> = {
  in_stock: {
    label: 'In Stock',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
  },
  waitlist: {
    label: 'Waitlist / Inquire',
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  },
  pre_order: {
    label: 'Pre-Order',
    bg: 'bg-sky-950/60',
    text: 'text-sky-300',
    dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
  },
  out_of_stock: {
    label: 'Out of Stock',
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
  },
  unknown: {
    label: 'Status Pending',
    bg: 'bg-zinc-900/60',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
  },
};
