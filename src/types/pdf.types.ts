export interface QueueFile {
  id: string;
  name: string;
  size: number;
  type: 'application/pdf' | string;
  arrayBuffer: ArrayBuffer;
  pageCount?: number;
  thumbnail?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  outputBuffer?: ArrayBuffer;
}

export interface PdfPage {
  index: number;
  width: number;
  height: number;
  rotation: number;
  thumbnail?: string;
}

export interface WorkerResult<T = ArrayBuffer> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface WorkerError {
  success: false;
  code: 'CORRUPTED' | 'MEMORY' | 'ENCRYPTED' | 'INVALID_RANGE' | 'UNKNOWN';
  message: string;
}

export type WorkerResponse<T = ArrayBuffer> = WorkerResult<T> | WorkerError;

export interface ProgressEvent {
  type: 'progress';
  percent: number;
  message?: string;
}
