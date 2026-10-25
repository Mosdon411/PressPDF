import React from 'react';
import { formatBytes } from '../services/pdfCompressor';
import { BatchFileItem } from '../types';

interface MetricStripProps {
  items: BatchFileItem[];
}

export const MetricStrip: React.FC<MetricStripProps> = ({ items }) => {
  const totalOriginal = items.reduce((sum, item) => sum + item.originalSize, 0);
  const completedItems = items.filter((item) => item.status === 'completed' && item.compressedSize);
  const completedOriginal = completedItems.reduce((sum, item) => sum + item.originalSize, 0);
  const totalCompressed = completedItems.reduce((sum, item) => sum + (item.compressedSize || 0), 0);
  const totalSaved = Math.max(0, completedOriginal - totalCompressed);
  const percentSaved = completedOriginal > 0 ? (totalSaved / completedOriginal) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
      <div>
        <p className="text-xs font-medium text-slate-400">Total In Queue</p>
        <p className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
          {items.length} <span className="text-xs font-normal text-slate-400 font-sans">files</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {completedItems.length} completed · {items.length - completedItems.length} pending
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">Original Volume</p>
        <p className="mt-1 text-xl font-bold text-slate-200 font-mono tabular-nums">
          {formatBytes(totalOriginal)}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          Source uncompressed payloads
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">Compressed Output</p>
        <p className="mt-1 text-xl font-bold text-indigo-300 font-mono tabular-nums">
          {completedItems.length > 0 ? formatBytes(totalCompressed) : '—'}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {completedItems.length > 0 ? `${completedItems.length} files optimized` : 'Awaiting batch run'}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">Space Saved</p>
        <p className="mt-1 text-xl font-bold text-emerald-400 font-mono tabular-nums">
          {completedItems.length > 0 ? `-${percentSaved.toFixed(1)}%` : '0.0%'}
        </p>
        <p className="mt-0.5 text-xs text-emerald-400/90 font-mono tabular-nums">
          {completedItems.length > 0 ? `${formatBytes(totalSaved)} reclaimed` : 'Target: 50% - 80% reduction'}
        </p>
      </div>
    </div>
  );
};
