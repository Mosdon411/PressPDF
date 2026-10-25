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

  // Render using PDF.js v4+ standard syntax
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };
  // @ts-expect-error - PDF.js typed render signature
  await page.render(renderContext).promise;

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Compresses a PDF file with batch progress reporting and granular image preservation controls
 */
export async function compressPdf(
  file: File,
  settings: CompressionSettings,
  onProgress?: CompressionProgressCallback
): Promise<{ compressedBlob: Blob; pageCount: number; firstPagePreviewUrl: string }> {
  const fileArrayBuffer = await file.arrayBuffer();

  // Load via PDF.js to extract and rasterize pages with high-fidelity filtering
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileArrayBuffer),
  });
  const sourcePdf = await loadingTask.promise;
  const totalPages = sourcePdf.numPages;

  // Create target compressed PDF document
  const targetPdfDoc = await PDFDocument.create();

  if (!settings.stripMetadata) {
    targetPdfDoc.setTitle(file.name.replace(/\.[^/.]+$/, ''));
    targetPdfDoc.setCreator('PressPDF Optimizer');
    targetPdfDoc.setProducer('PressPDF High-Fidelity Engine');
  }

  // Calculate resolution scale from base 72 DPI
  // e.g. 150 DPI = 150 / 72 ≈ 2.0833
  // 200 DPI = 200 / 72 ≈ 2.777
  const baseDpi = 72;
  const scale = Math.max(1, settings.maxDpi / baseDpi);

  let firstPagePreviewUrl = '';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(pageNum, totalPages, 'rendering');

    const page = await sourcePdf.getPage(pageNum);
    const originalViewport = page.getViewport({ scale: 1.0 }); // 72 DPI points
    const scaledViewport = page.getViewport({ scale });

    // Render page to canvas at target DPI with bicubic image smoothing
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(scaledViewport.width);
    canvas.height = Math.round(scaledViewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    // Fill white background for print pages
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // @ts-expect-error - PDF.js typed render signature
    const renderTask = page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    });
    await renderTask.promise;

    // Apply grayscale conversion if requested
    if (settings.colorMode === 'grayscale') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Luminance weights (Rec. 601)
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    onProgress?.(pageNum, totalPages, 'encoding');

    // Encode to high quality JPEG with requested quality
    const imageQuality = Math.min(1.0, Math.max(0.4, settings.quality));
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
        imageQuality
      );
    });

    onProgress?.(pageNum, totalPages, 'assembling');

    // Embed the re-encoded high-DPI image into the target PDF document
    const embeddedImage = await targetPdfDoc.embedJpg(pageImageBytes);

    // Add page matching original point dimensions (width & height in pt)
    const newPage = targetPdfDoc.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });

    // Clean up memory
    canvas.width = 0;
    canvas.height = 0;
  }

  // Save the compressed PDF with object streams enabled for maximum compression
  const compressedPdfBytes = await targetPdfDoc.save({
    useObjectStreams: true,
  });

  const compressedBlob = new Blob([compressedPdfBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });

  return {
    compressedBlob,
    pageCount: totalPages,
    firstPagePreviewUrl,
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
