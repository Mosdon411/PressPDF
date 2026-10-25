import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, ShieldCheck } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  isGeneratingSamples: boolean;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  isGeneratingSamples,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          pdfFiles.push(file);
        }
      }
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const pdfFiles: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          pdfFiles.push(file);
        }
      }
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative p-8 rounded-xl border-2 border-dashed transition-all text-center ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-950/20 shadow-inner'
          : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/80 text-indigo-400 mb-3 border border-slate-700/60">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-white">
          Drop PDF files here to batch compress
        </h3>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Supports multi-file batches, multi-page portfolios, and scanned documents.
          All compression runs 100% locally in your browser.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Select PDF Files</span>
          </button>

          <button
            type="button"
            onClick={onLoadSamples}
            disabled={disabled || isGeneratingSamples}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {isGeneratingSamples ? 'Generating Sample Batch...' : 'Load Sample Batch (3 High-Res PDFs)'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4 mt-6 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Client-Side Privacy Guaranteed
          </span>
          <span aria-hidden="true">·</span>
          <span>Preserves High Image Quality</span>
          <span aria-hidden="true">·</span>
          <span>Zero Server Uploads</span>
        </div>
      </div>
    </div>
  );
};
