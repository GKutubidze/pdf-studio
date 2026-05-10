export interface MergeOptions {
  files: ArrayBuffer[];
  fileNames?: string[];
}

export interface SplitRange {
  start: number;
  end: number;
}

export interface SplitOptions {
  file: ArrayBuffer;
  ranges: SplitRange[];
  everyN?: number;
}

export type CompressionQuality = 'high' | 'medium' | 'low';

export interface CompressOptions {
  file: ArrayBuffer;
  quality: CompressionQuality;
}

export interface CompressResult {
  buffer: ArrayBuffer;
  originalSize: number;
  compressedSize: number;
}

export interface ProtectOptions {
  file: ArrayBuffer;
  userPassword: string;
  ownerPassword?: string;
}

export interface UnlockOptions {
  file: ArrayBuffer;
  password: string;
}

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface WatermarkOptions {
  file: ArrayBuffer;
  text: string;
  fontSize: number;
  color: [number, number, number];
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  pageRange?: { start: number; end: number };
}

export interface RotatePageOptions {
  pageIndex: number;
  degrees: 90 | 180 | 270;
}

export interface RotateOptions {
  file: ArrayBuffer;
  pages: RotatePageOptions[];
}

export type ImagePageSize = 'a4' | 'letter' | 'fit';

export interface ImageToPdfOptions {
  images: ArrayBuffer[];
  mimeTypes: string[];
  pageSize: ImagePageSize;
  quality: number;
}

export interface PdfToImageOptions {
  file: ArrayBuffer;
  format: 'png' | 'jpeg';
  dpi: 72 | 150 | 300;
  pageIndices?: number[];
}

export interface OrganizeOperation {
  type: 'reorder' | 'delete' | 'blank';
  pageOrder?: number[];
  deleteIndices?: number[];
  insertBlankAfter?: number;
}

export interface OrganizeOptions {
  file: ArrayBuffer;
  operations: OrganizeOperation[];
}

export interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'freehand';
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  opacity: number;
  text?: string;
  fontSize?: number;
  points?: [number, number][];
}

export interface AnnotateOptions {
  file: ArrayBuffer;
  annotations: Annotation[];
}

export interface SignatureData {
  type: 'drawn' | 'typed' | 'image';
  dataUrl: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignOptions {
  file: ArrayBuffer;
  signatures: SignatureData[];
}

export interface OcrOptions {
  file: ArrayBuffer;
  language: string;
  onProgress?: (page: number, total: number, percent: number) => void;
}

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export interface PageNumberOptions {
  file: ArrayBuffer;
  position: PageNumberPosition;
  startFrom: number;
  skipFirst: number;
  fontSize: number;
  color: [number, number, number];
  prefix?: string;
  suffix?: string;
}

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  file: ArrayBuffer;
  cropBox: CropBox;
  pageRange?: { start: number; end: number };
}

export interface RepairResult {
  buffer: ArrayBuffer;
  recoveredPages: number;
  totalPages: number;
  lostPages: number[];
}
