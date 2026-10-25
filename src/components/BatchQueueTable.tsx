import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Search,
} from 'lucide-react';
import { BatchFileItem } from '../types';
import { formatBytes } from '../services/pdfCompressor';

interface BatchQueueTableProps {
  items: BatchFileItem[];
  onRemoveItem: (id: string) => void;
  onDownloadItem: (item: BatchFileItem) => void;
  onInspectItem: (item: BatchFileItem) => void;
  onCompressSingle: (id: string) => void;
  isProcessing: boolean;
}

export const BatchQueueTable: React.FC<BatchQueueTableProps> = ({
  items,
  onRemoveItem,
  onDownloadItem,
  onInspectItem,
  onCompressSingle,
  isProcessing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === 'completed') return item.status === 'completed';
    if (filterStatus === 'pending') return item.status !== 'completed';
    return true;
  });

  if (items.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/30 rounded-xl border border-slate-800/80">
        <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Batch queue is empty</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Add one or more PDF files above, or click &quot;Load Sample Batch&quot; to test instant high-fidelity compression.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-white">Queued Files</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            ({items.length} total)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-900 border border-slate-750 text-slate-200 rounded-md focus:outline-none focus:border-indigo-500 w-36 sm:w-48 placeholder:text-slate-400"
            />
          </div>

          {/* Segmented status filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'completed'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'pending'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* Table Data View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold text-slate-400">
              <th className="py-3 px-4">Document</th>
              <th className="py-3 px-3 text-right">Original</th>
              <th className="py-3 px-3 text-right">Compressed</th>
              <th className="py-3 px-3 text-right">Reduction</th>
              <th className="py-3 px-4">Status & Progress</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredItems.map((item) => {
              const hasCompleted = item.status === 'completed' && item.compressedSize;
              const savedBytes = hasCompleted ? item.originalSize - (item.compressedSize || 0) : 0;
              const percentSaved =
                hasCompleted && item.originalSize > 0
                  ? ((savedBytes / item.originalSize) * 100).toFixed(1)
                  : null;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* File Name & Page Count */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-800 text-indigo-400 shrink-0 border border-slate-700/50">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 max-w-[220px] sm:max-w-xs md:max-w-sm">
                        <p className="font-medium text-slate-200 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{item.pageCount > 0 ? `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}` : 'Analyzing...'}</span>
                          {item.durationMs && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {(item.durationMs / 1000).toFixed(1)}s
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Original Size */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-300">
                    {formatBytes(item.originalSize)}
                  </td>

                  {/* Compressed Size */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                    {hasCompleted ? (
                      <div>
                        <span className="text-indigo-300 font-semibold block">
                          {formatBytes(item.compressedSize || 0)}
                        </span>
                        {(item.compressedSize || 0) <= 250 * 1024 ? (
                          <span className="text-[10px] text-emerald-400 font-sans block">
                            &lt; 250 KB verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-sans block">
                            Optimized
                          </span>
                        )}
                      </div>
                    ) : item.status === 'compressing' ? (
                      <span className="text-slate-400 animate-pulse">Encoding...</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Reduction percentage */}
                  <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                    {percentSaved ? (
                      <div>
                        <span className="text-emerald-400 font-semibold">
                          -{percentSaved}%
                        </span>
                        <div className="text-[10px] text-emerald-400/80">
                          {formatBytes(savedBytes)} saved
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Status & Progress Bar */}
                  <td className="py-3.5 px-4 min-w-[180px]">
                    {item.status === 'idle' && (
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Ready to compress
                      </span>
                    )}

                    {item.status === 'analyzing' && (
                      <span className="inline-flex items-center gap-1.5 text-indigo-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Inspecting document...
                      </span>
                    )}

                    {item.status === 'compressing' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-indigo-300 flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Page {item.currentPage} of {item.pageCount}
                          </span>
                          <span className="font-mono tabular-nums text-indigo-400 font-medium">
                            {Math.round(item.progress)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Compressed · Quality Preserved
                      </span>
                    )}

                    {item.status === 'error' && (
                      <span
                        className="inline-flex items-center gap-1.5 text-rose-400"
                        title={item.errorMessage}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Error during processing
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'completed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onInspectItem(item)}
                            title="Inspect Before/After Image Quality"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/80 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDownloadItem(item)}
                            title="Download Compressed PDF"
                            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {item.status === 'idle' && !isProcessing && (
                        <button
                          type="button"
                          onClick={() => onCompressSingle(item.id)}
                          className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        >
                          Compress
                        </button>
                      )}

                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          title="Remove from queue"
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
