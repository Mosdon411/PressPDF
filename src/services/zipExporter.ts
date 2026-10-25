import JSZip from 'jszip';
import { BatchFileItem } from '../types';

/**
 * Packs all completed PDFs from the batch queue into a single ZIP archive and triggers download
 */
export async function downloadBatchAsZip(
  items: BatchFileItem[],
  zipFilename: string = 'PressPDF_Compressed_Batch.zip'
): Promise<void> {
  const completedItems = items.filter(
    (item) => item.status === 'completed' && item.compressedBlob
  );

  if (completedItems.length === 0) {
    throw new Error('No completed compressed files available for download');
  }

  const zip = new JSZip();

  completedItems.forEach((item) => {
    if (item.compressedBlob) {
      // Clean target name: e.g. document_compressed.pdf
      const baseName = item.name.replace(/\.pdf$/i, '');
      const safeName = `${baseName}_compressed.pdf`;
      zip.file(safeName, item.compressedBlob);
    }
  });

  const zipContent = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(zipContent);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Downloads a single compressed PDF file
 */
export function downloadSingleFile(item: BatchFileItem): void {
  if (!item.compressedBlob) return;
  const baseName = item.name.replace(/\.pdf$/i, '');
  const downloadUrl = URL.createObjectURL(item.compressedBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `${baseName}_compressed.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
