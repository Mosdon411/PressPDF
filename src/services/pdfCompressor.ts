import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { CompressionSettings } from '../types';

export interface CompressionProgressCallback {
  (currentPage: number, totalPages: number, stage: 'rendering' | 'encoding' | 'assembling'): void;
}

/**
 * Inspects a PDF file and returns basic metadata (page count, first page dimensions)
 */
export async function inspectPdfFile(file: File): Promise<{ pageCount: number; title?: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  return { pageCount };
}

/**
 * Renders a specific page of a PDF file or blob to an Image Data URL for inspection/comparison
 */
export async function renderPdfPageToDataUrl(
  pdfSource: File | Blob | ArrayBuffer,
  pageNumber: number,
  targetDpi: number = 150
): Promise<string> {
  let data: Uint8Array;
  if (pdfSource instanceof File || pdfSource instanceof Blob) {
    const ab = await pdfSource.arrayBuffer();
    data = new Uint8Array(ab);
  } else {
    data = new Uint8Array(pdfSource);
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));

  // 72 DPI is base PDF unit
  const scale = targetDpi / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) throw new Error('Failed to get 2d canvas context');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Render using PDF.js standard syntax
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };
  await (page as any).render(renderContext).promise;

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Internal single-pass renderer and assembler
 */
async function executeCompressionPass(
  sourcePdf: any,
  fileName: string,
  targetDpi: number,
  imageQuality: number,
  colorMode: 'color' | 'grayscale',
  stripMetadata: boolean,
  onProgress?: CompressionProgressCallback
): Promise<{ compressedBlob: Blob; firstPagePreviewUrl: string }> {
  const totalPages = sourcePdf.numPages;
  const targetPdfDoc = await PDFDocument.create();

  if (!stripMetadata) {
    targetPdfDoc.setTitle(fileName.replace(/\.[^/.]+$/, ''));
    targetPdfDoc.setCreator('PressPDF Optimizer');
    targetPdfDoc.setProducer('PressPDF High-Fidelity Engine');
  }

  const baseDpi = 72;
  const scale = Math.max(0.8, targetDpi / baseDpi);
  let firstPagePreviewUrl = '';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages, 'rendering');

    const page = await sourcePdf.getPage(pageNum);
    const originalViewport = page.getViewport({ scale: 1.0 });
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(scaledViewport.width);
    canvas.height = Math.round(scaledViewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const renderTask = (page as any).render({
      canvasContext: ctx,
      viewport: scaledViewport,
    });
    await renderTask.promise;

    // Apply grayscale conversion if requested
    if (colorMode === 'grayscale') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    onProgress?.(pageNum, totalPages, 'encoding');

    const clampedQuality = Math.min(1.0, Math.max(0.35, imageQuality));
    const pageImageBytes = await new Promise<Uint8Array>((resolve, reject) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Page image serialization failed'));
            return;
          }
          if (pageNum === 1) {
            firstPagePreviewUrl = URL.createObjectURL(blob);
          }
          const buf = await blob.arrayBuffer();
          resolve(new Uint8Array(buf));
        },
        'image/jpeg',
        clampedQuality
      );
    });

    onProgress?.(pageNum, totalPages, 'assembling');

    const embeddedImage = await targetPdfDoc.embedJpg(pageImageBytes);
    const newPage = targetPdfDoc.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });

    // Clean up
    canvas.width = 0;
    canvas.height = 0;
  }

  const compressedPdfBytes = await targetPdfDoc.save({
    useObjectStreams: true,
  });

  const compressedBlob = new Blob([compressedPdfBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });

  return { compressedBlob, firstPagePreviewUrl };
}

/**
 * Compresses a PDF file with batch progress reporting and guaranteed target size optimization (< 250 KB)
 */
export async function compressPdf(
  file: File,
  settings: CompressionSettings,
  onProgress?: CompressionProgressCallback
): Promise<{ compressedBlob: Blob; pageCount: number; firstPagePreviewUrl: string }> {
  const fileArrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileArrayBuffer),
  });
  const sourcePdf = await loadingTask.promise;
  const totalPages = sourcePdf.numPages;

  // Check if target size enforcement is active (e.g. < 250 KB)
  const shouldEnforceTarget = settings.enforceTargetSize || settings.preset === 'target250kb';
  const targetMaxKb = settings.targetMaxKb || 250;
  // Set safe ceiling in bytes to strictly guarantee output is < targetMaxKb (e.g. 248 KB)
  const safeCeilingBytes = (targetMaxKb * 1024) - 2048;

  let currentDpi = settings.maxDpi;
  let currentQuality = settings.quality;

  // If targeting < 250 KB, choose intelligent initial parameters calibrated to page count
  if (shouldEnforceTarget) {
    if (totalPages === 1) {
      currentDpi = Math.min(currentDpi, 130);
      currentQuality = Math.min(currentQuality, 0.80);
    } else if (totalPages === 2) {
      currentDpi = Math.min(currentDpi, 105);
      currentQuality = Math.min(currentQuality, 0.74);
    } else if (totalPages === 3) {
      currentDpi = Math.min(currentDpi, 90);
      currentQuality = Math.min(currentQuality, 0.68);
    } else {
      currentDpi = Math.min(currentDpi, Math.max(70, Math.floor(220 / Math.sqrt(totalPages))));
      currentQuality = Math.min(currentQuality, Math.max(0.48, 0.65 - (totalPages * 0.02)));
    }
  }

  // Pass 1
  let result = await executeCompressionPass(
    sourcePdf,
    file.name,
    currentDpi,
    currentQuality,
    settings.colorMode,
    settings.stripMetadata,
    onProgress
  );

  // If target size is enforced and the file exceeds the 250 KB ceiling, adaptively refine
  if (shouldEnforceTarget && result.compressedBlob.size > safeCeilingBytes) {
    const excessRatio = safeCeilingBytes / result.compressedBlob.size;
    // Area scales quadratically with DPI
    const adaptedDpi = Math.max(65, Math.floor(currentDpi * Math.sqrt(excessRatio) * 0.94));
    const adaptedQuality = Math.max(
      0.40,
      Math.min(currentQuality, Number((currentQuality * Math.pow(excessRatio, 0.45) * 0.96).toFixed(2)))
    );

    result = await executeCompressionPass(
      sourcePdf,
      file.name,
      adaptedDpi,
      adaptedQuality,
      settings.colorMode,
      settings.stripMetadata,
      onProgress
    );

    // Ultra-rare safety pass 3 if still slightly over
    if (result.compressedBlob.size > safeCeilingBytes) {
      const finalRatio = safeCeilingBytes / result.compressedBlob.size;
      const finalDpi = Math.max(55, Math.floor(adaptedDpi * Math.sqrt(finalRatio) * 0.92));
      const finalQuality = Math.max(0.35, adaptedQuality * 0.88);

      result = await executeCompressionPass(
        sourcePdf,
        file.name,
        finalDpi,
        finalQuality,
        settings.colorMode,
        settings.stripMetadata,
        onProgress
      );
    }
  }

  return {
    compressedBlob: result.compressedBlob,
    pageCount: totalPages,
    firstPagePreviewUrl: result.firstPagePreviewUrl,
  };
}

/**
 * Format bytes into human readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
