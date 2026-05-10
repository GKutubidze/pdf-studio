export interface QueuedFile {
  id: string
  file: File
  name: string
  size: number
  pageCount?: number
  previewUrl?: string
  status: 'idle' | 'processing' | 'done' | 'error'
  error?: string
  outputUrl?: string
}

export interface ProgressEvent {
  fileId: string
  progress: number
  message?: string
}

export interface MergeOptions {
  files: ArrayBuffer[]
  outputName?: string
}

export interface SplitOptions {
  file: ArrayBuffer
  ranges: Array<{ start: number; end: number }>
}

export interface WatermarkOptions {
  file: ArrayBuffer
  text: string
  opacity: number
  fontSize: number
  rotation: number
  color: [number, number, number]
}

export interface ProtectOptions {
  file: ArrayBuffer
  userPassword: string
  ownerPassword?: string
}

export interface RotateOptions {
  file: ArrayBuffer
  pageIndices: number[]
  degrees: 90 | 180 | 270
}

export interface ImageToPdfOptions {
  images: ArrayBuffer[]
  mimeTypes: string[]
  fitToPage: boolean
}

export type ToolId =
  | 'merge'
  | 'split'
  | 'watermark'
  | 'protect'
  | 'image-to-pdf'
  | 'rotate'

export interface Tool {
  id: ToolId
  label: string
  description: string
  icon: string
  acceptedTypes: string[]
  maxFiles: number
}
