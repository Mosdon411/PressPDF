export type CompressionPreset = 'archive' | 'balanced' | 'ultra' | 'compact' | 'custom';

export interface CompressionSettings {
  preset: CompressionPreset;
  quality: number; // 0.5 to 1.0 (e.g. 0.88 for archive)
  maxDpi: number; // e.g. 150, 200, 250
  colorMode: 'color' | 'grayscale';
  stripMetadata: boolean;
  cleanAnnotations: boolean;
}

export type QueueItemStatus = 'idle' | 'analyzing' | 'compressing' | 'completed' | 'error';

export interface BatchFileItem {
  id: string;
  name: string;
  originalSize: number;
  originalFile: File;
  pageCount: number;
  status: QueueItemStatus;
  progress: number; // 0 to 100
  currentPage: number;
  compressedBlob?: Blob;
  compressedSize?: number;
  errorMessage?: string;
  durationMs?: number;
  // Preview thumbnails for page 1 or comparison
  originalPagePreviewUrl?: string;
  compressedPagePreviewUrl?: string;
}

export interface InspectionData {
  fileId: string;
  fileName: string;
  pageNumber: number;
  totalPages: number;
  originalCanvasUrl: string;
  compressedCanvasUrl: string;
  originalSize: number;
  compressedSize: number;
}
