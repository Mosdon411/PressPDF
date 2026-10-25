import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Columns,
  SplitSquareVertical,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { BatchFileItem } from '../types';
import { renderPdfPageToDataUrl, formatBytes } from '../services/pdfCompressor';
import { downloadSingleFile } from '../services/zipExporter';

interface QualityInspectorModalProps {
  item: BatchFileItem | null;
  onClose: () => void;
}

export const QualityInspectorModal: React.FC<QualityInspectorModalProps> = ({ item, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [splitPosition, setSplitPosition] = useState(50); // percentage 0 to 100
  const [viewMode, setViewMode] = useState<'split' | 'sideBySide'>('split');
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 100, 150, 200

  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [compressedImageUrl, setCompressedImageUrl] = useState<string>('');
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Load high-resolution renders of current page for both original and compressed
  useEffect(() => {
    if (!item || !item.compressedBlob) return;

    let isMounted = true;
    setIsLoadingPages(true);

    const loadImages = async () => {
      try {
        const [origUrl, compUrl] = await Promise.all([
          renderPdfPageToDataUrl(item.originalFile, currentPage, 180),
          renderPdfPageToDataUrl(item.compressedBlob!, currentPage, 180),
        ]);
        if (isMounted) {
          setOriginalImageUrl(origUrl);
          setCompressedImageUrl(compUrl);
          setIsLoadingPages(false);
        }
      } catch (err) {
        console.error('Failed to render comparison pages:', err);
        if (isMounted) setIsLoadingPages(false);
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [item, currentPage]);

  if (!item) return null;

  const totalPages = item.pageCount || 1;
  const originalSize = item.originalSize;
  const compressedSize = item.compressedSize || 0;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const percentSaved = originalSize > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : 0;

  // Handle curtain slider dragging
  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPosition(pct);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPosition(pct);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="flex flex-col w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate max-w-md">
                {item.name}
              </h3>
              <span className="text-xs text-emerald-400 font-mono tabular-nums font-semibold">
                -{percentSaved}%
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Original: <span className="font-mono tabular-nums text-slate-300">{formatBytes(originalSize)}</span> · Compressed: <span className="font-mono tabular-nums text-indigo-300">{formatBytes(compressedSize)}</span> · Saved: <span className="font-mono tabular-nums text-emerald-400">{formatBytes(savedBytes)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => downloadSingleFile(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inspection Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-slate-800 bg-slate-900/40 text-xs">
          {/* Mode switch: Split Curtain vs Side-by-Side */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split Curtain</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sideBySide')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'sideBySide' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 25))}
              disabled={zoomLevel <= 75}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums text-slate-300 w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
              disabled={zoomLevel >= 200}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas Area */}
        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/80">
          {isLoadingPages ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Rendering pixel-exact comparison frames...</span>
            </div>
          ) : viewMode === 'split' ? (
            /* Split Curtain Comparison */
            <div
              ref={containerRef}
              onTouchMove={handleTouchMove}
              className="relative select-none border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden max-h-full"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* Underlying Base: Compressed Image (Right Side) */}
              <img
                src={compressedImageUrl}
                alt="Compressed PDF Page"
                className="max-h-[68vh] object-contain block mx-auto pointer-events-none"
              />

              {/* Overlay: Original Image (Clipped by splitPosition on the Left Side) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitPosition}%` }}
              >
                <img
                  src={originalImageUrl}
                  alt="Original PDF Page"
                  className="max-h-[68vh] object-contain block pointer-events-none"
                  style={{
                    width: containerRef.current?.offsetWidth || 'auto',
                    maxWidth: 'none',
                  }}
                />
              </div>

              {/* Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] cursor-ew-resize z-20"
                style={{ left: `${splitPosition}%` }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-[9px] shadow-lg">
                  ⇄
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-slate-950/80 text-white rounded text-[11px] font-medium border border-slate-700">
                Original (Uncompressed)
              </div>
              <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-indigo-950/80 text-indigo-200 rounded text-[11px] font-medium border border-indigo-700">
                Compressed ({percentSaved}% saved)
              </div>
            </div>
          ) : (
            /* Side-by-Side Comparison */
            <div
              className="grid grid-cols-2 gap-4 max-w-full max-h-full items-start"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* Original Card */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-xs font-semibold text-slate-300">
                  Original Document ({formatBytes(originalSize)})
                </div>
                <div className="border border-slate-700 rounded-lg overflow-hidden bg-white shadow-lg">
                  <img
                    src={originalImageUrl}
                    alt="Original PDF Page"
                    className="max-h-[62vh] object-contain block"
                  />
                </div>
              </div>

              {/* Compressed Card */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-xs font-semibold text-indigo-300">
                  Compressed Document ({formatBytes(compressedSize)})
                </div>
                <div className="border border-indigo-700/60 rounded-lg overflow-hidden bg-white shadow-lg">
                  <img
                    src={compressedImageUrl}
                    alt="Compressed PDF Page"
                    className="max-h-[62vh] object-contain block"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Tip */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Drag the center slider left and right to inspect vector glyphs, photos, and micro-text. Notice zero compression halo or blocky artifacts.
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
