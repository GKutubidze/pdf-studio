import type {
  MergeOptions,
  SplitOptions,
  CompressOptions,
  CompressResult,
  ProtectOptions,
  UnlockOptions,
  WatermarkOptions,
  RotateOptions,
  ImageToPdfOptions,
} from './feature.types';

export interface MergeWorkerAPI {
  merge(options: MergeOptions): Promise<ArrayBuffer>;
}

export interface SplitWorkerAPI {
  split(options: SplitOptions): Promise<ArrayBuffer[]>;
}

export interface CompressWorkerAPI {
  compress(options: CompressOptions): Promise<CompressResult>;
}

export interface ProtectWorkerAPI {
  protect(options: ProtectOptions): Promise<ArrayBuffer>;
  unlock(options: UnlockOptions): Promise<ArrayBuffer>;
}

export interface WatermarkWorkerAPI {
  watermark(options: WatermarkOptions): Promise<ArrayBuffer>;
}

export interface RotateWorkerAPI {
  rotate(options: RotateOptions): Promise<ArrayBuffer>;
}

export interface ImageToPdfWorkerAPI {
  convert(options: ImageToPdfOptions): Promise<ArrayBuffer>;
}
