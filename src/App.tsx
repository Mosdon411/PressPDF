import { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { MetricStrip } from './components/MetricStrip';
import { PresetSelector } from './components/PresetSelector';
import { FileDropzone } from './components/FileDropzone';
import { BatchQueueTable } from './components/BatchQueueTable';
import { QualityInspectorModal } from './components/QualityInspectorModal';
import { PreservationEngineGuide } from './components/PreservationEngineGuide';
import { BatchFileItem, CompressionSettings } from './types';
import { inspectPdfFile, compressPdf } from './services/pdfCompressor';
import { downloadBatchAsZip, downloadSingleFile } from './services/zipExporter';
import {
  createMarketingBrochurePdf,
  createScannedLegalContractPdf,
  createPhotoLookbookPdf,
} from './services/samplePdfGenerator';

export default function App() {
  const [items, setItems] = useState<BatchFileItem[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    preset: 'target250kb',
    quality: 0.78,
    maxDpi: 130,
    colorMode: 'color',
    stripMetadata: true,
    cleanAnnotations: false,
    enforceTargetSize: true,
    targetMaxKb: 250,
  });

  const [activeTab, setActiveTab] = useState<'queue' | 'inspector' | 'presets'>('queue');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<BatchFileItem | null>(null);

  const cancelProcessingRef = useRef(false);

  // Add files to batch queue
  const addFilesToQueue = useCallback(async (files: File[]) => {
    const newItems: BatchFileItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      originalSize: file.size,
      originalFile: file,
      pageCount: 1,
      status: 'analyzing',
      progress: 0,
      currentPage: 1,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Inspect each file in background to determine exact page counts
    for (const item of newItems) {
      try {
        const metadata = await inspectPdfFile(item.originalFile);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, pageCount: metadata.pageCount, status: 'idle' }
              : i
          )
        );
      } catch (err) {
        console.error('Error reading PDF metadata:', err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'idle',
                  pageCount: 1,
                }
              : i
          )
        );
      }
    }
  }, []);

  // Generate realistic high-res sample batch
  const handleLoadSamples = async () => {
    try {
      setIsGeneratingSamples(true);
      const [brochure, legalContract, lookbook] = await Promise.all([
        createMarketingBrochurePdf(),
        createScannedLegalContractPdf(),
        createPhotoLookbookPdf(),
      ]);

      await addFilesToQueue([brochure, legalContract, lookbook]);
    } catch (err) {
      console.error('Failed to generate sample batch:', err);
    } finally {
      setIsGeneratingSamples(false);
    }
  };

  // Compress a single item
  const compressSingleItem = async (itemId: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem || isProcessing) return;

    setIsProcessing(true);
    cancelProcessingRef.current = false;
    const startTime = performance.now();

    try {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: 'compressing', progress: 5, currentPage: 1 } : i
        )
      );

      const result = await compressPdf(
        targetItem.originalFile,
        settings,
        (currPage, totalPages) => {
          const pct = Math.min(95, Math.round((currPage / totalPages) * 100));
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    currentPage: currPage,
                    progress: pct,
                  }
                : i
            )
          );
        }
      );

      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                compressedBlob: result.compressedBlob,
                compressedSize: result.compressedBlob.size,
                originalPagePreviewUrl: result.firstPagePreviewUrl,
                durationMs,
              }
            : i
        )
      );
    } catch (err) {
      console.error('Compression failed for item:', targetItem.name, err);
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: 'error',
                errorMessage: err instanceof Error ? err.message : 'Unknown error',
              }
            : i
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Compress entire batch sequentially
  const handleCompressAll = async () => {
    if (isProcessing || items.length === 0) return;

    setIsProcessing(true);
    cancelProcessingRef.current = false;

    const pendingItems = items.filter((item) => item.status !== 'completed');

    for (const item of pendingItems) {
      if (cancelProcessingRef.current) break;

      const startTime = performance.now();
      try {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'compressing', progress: 5, currentPage: 1 } : i
          )
        );

        const result = await compressPdf(
          item.originalFile,
          settings,
          (currPage, totalPages) => {
            const pct = Math.min(95, Math.round((currPage / totalPages) * 100));
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      currentPage: currPage,
                      progress: pct,
                    }
                  : i
              )
            );
          }
        );

        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'completed',
                  progress: 100,
                  compressedBlob: result.compressedBlob,
                  compressedSize: result.compressedBlob.size,
                  originalPagePreviewUrl: result.firstPagePreviewUrl,
                  durationMs,
                }
              : i
          )
        );
      } catch (err) {
        console.error('Batch item error:', item.name, err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  errorMessage: err instanceof Error ? err.message : 'Processing failed',
                }
              : i
          )
        );
      }
    }

    setIsProcessing(false);
  };

  // Download all completed as ZIP
  const handleDownloadZip = async () => {
    try {
      await downloadBatchAsZip(items);
    } catch (err) {
      console.error('Download ZIP error:', err);
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (inspectingItem?.id === id) {
      setInspectingItem(null);
    }
  };

  // Reset queue
  const handleReset = () => {
    setItems([]);
    setInspectingItem(null);
  };

  const completedCount = items.filter(
    (i) => i.status === 'completed' && i.compressedBlob
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-indigo-200">
      {/* Top Bar Contract (1-line Brand, 4 nav links, 1 primary CTA) */}
      <Header
        queueCount={items.length}
        completedCount={completedCount}
        isProcessing={isProcessing}
        onCompressAll={handleCompressAll}
        onDownloadZip={handleDownloadZip}
        onReset={handleReset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Ribbon */}
        <MetricStrip items={items} />

        {/* Section based on activeTab */}
        {activeTab === 'presets' ? (
          <div className="space-y-6">
            <PresetSelector
              settings={settings}
              onChangeSettings={setSettings}
              disabled={isProcessing}
            />
            <PreservationEngineGuide />
          </div>
        ) : activeTab === 'inspector' ? (
          <div className="space-y-6">
            {completedCount > 0 ? (
              <div className="p-6 bg-slate-900/60 rounded-xl border border-slate-800">
                <h2 className="text-base font-semibold text-white mb-2">
                  Select a document to inspect image fidelity
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Compare the uncompressed source side-by-side with the optimized output.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items
                    .filter((item) => item.status === 'completed')
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setInspectingItem(item)}
                        className="text-left p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/60 transition-colors"
                      >
                        <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                        <p className="mt-1 text-xs text-emerald-400 font-mono tabular-nums">
                          {item.originalSize > 0 && item.compressedSize
                            ? `Saved ${(((item.originalSize - item.compressedSize) / item.originalSize) * 100).toFixed(1)}%`
                            : 'Compressed'}
                        </p>
                        <span className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                          Launch Split Curtain Inspector →
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                <p className="text-sm font-semibold text-slate-300">
                  No compressed documents available to inspect yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Compress a PDF in the batch queue first to launch the interactive split-curtain quality inspector.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  Return to Batch Queue
                </button>
              </div>
            )}
            <PreservationEngineGuide />
          </div>
        ) : (
          /* Default: Batch Queue view */
          <div className="space-y-8">
            {/* Compression Presets Bar */}
            <PresetSelector
              settings={settings}
              onChangeSettings={setSettings}
              disabled={isProcessing}
            />

            {/* Dropzone */}
            <FileDropzone
              onFilesSelected={addFilesToQueue}
              onLoadSamples={handleLoadSamples}
              isGeneratingSamples={isGeneratingSamples}
              disabled={isProcessing}
            />

            {/* Batch Table */}
            <BatchQueueTable
              items={items}
              onRemoveItem={handleRemoveItem}
              onDownloadItem={downloadSingleFile}
              onInspectItem={(item) => setInspectingItem(item)}
              onCompressSingle={compressSingleItem}
              isProcessing={isProcessing}
            />

            {/* Quality preservation engineering architecture overview */}
            <PreservationEngineGuide />
          </div>
        )}
      </main>

      {/* Interactive Quality Inspector Modal */}
      {inspectingItem && (
        <QualityInspectorModal
          item={inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            PressPDF Batch Compressor · Preserving pixel-level image quality locally in your browser.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>High-DPI Bicubic Resampling</span>
            <span aria-hidden="true">·</span>
            <span>Zero Data Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>100% Client-Side</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
