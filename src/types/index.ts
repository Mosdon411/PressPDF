export type CompressionPreset = 'target250kb' | 'archive' | 'balanced' | 'ultra' | 'compact' | 'custom';

export interface CompressionSettings {
  preset: CompressionPreset;
  quality: number; // 0.5 to 1.0
  maxDpi: number; // e.g. 110, 150, 200
  colorMode: 'color' | 'grayscale';
  stripMetadata: boolean;
  cleanAnnotations: boolean;
  enforceTargetSize: boolean; // whether to strictly enforce target max file size
  targetMaxKb: number; // e.g. 250 KB
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
