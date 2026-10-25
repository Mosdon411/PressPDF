import React from 'react';
import { Layers, Download, Play, RefreshCw } from 'lucide-react';

interface HeaderProps {
  queueCount: number;
  completedCount: number;
  isProcessing: boolean;
  onCompressAll: () => void;
  onDownloadZip: () => void;
  onReset: () => void;
  activeTab: 'queue' | 'inspector' | 'presets';
  setActiveTab: (tab: 'queue' | 'inspector' | 'presets') => void;
}

export const Header: React.FC<HeaderProps> = ({
  queueCount,
  completedCount,
  isProcessing,
  onCompressAll,
  onDownloadZip,
  onReset,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Brand wordmark (single text element) */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('queue');
        }}
        className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-indigo-400 transition-colors"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
          <Layers className="w-4 h-4" />
        </span>
        <span>PressPDF</span>
      </a>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('queue')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'queue' ? 'text-white' : 'hover:text-slate-200'
          }`}
        >
          Batch Queue
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'presets' ? 'text-white' : 'hover:text-slate-200'
          }`}
        >
          Quality Presets
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'inspector' ? 'text-white' : 'hover:text-slate-200'
          }`}
        >
          Quality Inspector
        </button>
      </nav>

      {/* Zone 3: Primary action button */}
      <div className="flex items-center gap-3 shrink-0">
        {queueCount > 0 && !isProcessing && (
          <button
            onClick={onReset}
            title="Clear all files"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        {completedCount > 0 ? (
          <button
            onClick={onDownloadZip}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All ({completedCount}) as ZIP</span>
          </button>
        ) : (
          <button
            onClick={onCompressAll}
            disabled={queueCount === 0 || isProcessing}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 ${
              queueCount === 0 || isProcessing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-[0.98]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isProcessing ? 'Compressing Batch...' : 'Compress Batch'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
