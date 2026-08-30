'use client';

import React from 'react';
import { PriceHistoryPoint } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SparklineProps {
  history: PriceHistoryPoint[];
  currentPrice: number;
  currency?: string;
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export function SparklineChart({
  history,
  currentPrice,
  currency = 'USD',
  width = 160,
  height = 42,
  showLabels = false,
}: SparklineProps) {
  // Ensure at least 2 points to draw a clean line
  const points = [...history];
  if (points.length === 0) {
    points.push({
      id: 'p-0',
      watchId: 'mock',
      price: currentPrice,
      currency,
      availability: 'in_stock',
      recordedAt: new Date().toISOString(),
    });
  }
  if (points.length === 1) {
    points.unshift({
      id: 'p-initial',
      watchId: 'mock',
      price: points[0].price,
      currency,
      availability: points[0].availability,
      recordedAt: new Date(new Date(points[0].recordedAt).getTime() - 86400000 * 30).toISOString(),
    });
  }

  const prices = points.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const paddingX = 6;
  const paddingY = 6;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const coordinates = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * graphWidth;
    // Invert Y so highest price is at top
    const normalizedY = (p.price - minPrice) / priceRange;
    const y = height - paddingY - normalizedY * graphHeight;
    return { x, y, price: p.price, date: p.recordedAt, note: p.note };
  });

  const pathString = coordinates.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    // Catmull-Rom or cubic bezier smoothing
    const prev = coordinates[idx - 1];
    const cpX1 = prev.x + (curr.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (curr.x - prev.x) / 2;
    const cpY2 = curr.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }, '');

  const areaPathString = `${pathString} L ${coordinates[coordinates.length - 1].x} ${height} L ${coordinates[0].x} ${height} Z`;

  const isPriceDrop = points[points.length - 1].price < points[0].price;
  const strokeColor = isPriceDrop ? '#34d399' : '#cf9f2d';
  const fillColor = isPriceDrop ? 'rgba(52, 211, 153, 0.15)' : 'rgba(207, 159, 45, 0.15)';

  return (
    <div className="flex flex-col gap-1">
      <div className="relative group" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={`sparkline-grad-${width}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Fill under curve */}
          <path d={areaPathString} fill={`url(#sparkline-grad-${width})`} />

          {/* Main trajectory stroke */}
          <path
            d={pathString}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Coordinate points */}
          {coordinates.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={i === coordinates.length - 1 ? 3 : 2}
              fill={i === coordinates.length - 1 ? strokeColor : '#161a22'}
              stroke={strokeColor}
              strokeWidth="1.5"
              className="transition-transform duration-150 hover:scale-150"
            />
          ))}
        </svg>
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[10px] font-mono text-steel-400">
          <span>Low: {formatCurrency(minPrice, currency)}</span>
          <span>High: {formatCurrency(maxPrice, currency)}</span>
        </div>
      )}
    </div>
  );
}
