export function arrayBufferToBlob(buffer: ArrayBuffer, mimeType = 'application/pdf'): Blob {
  return new Blob([buffer], { type: mimeType });
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

export function arrayBufferToUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

export function uint8ArrayToArrayBuffer(arr: Uint8Array): ArrayBuffer {
  // arr.buffer may be a SharedArrayBuffer; slice always returns a plain ArrayBuffer
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

export function createObjectURL(buffer: ArrayBuffer, mimeType = 'application/pdf'): string {
  return URL.createObjectURL(arrayBufferToBlob(buffer, mimeType));
}

export function downloadBuffer(buffer: ArrayBuffer, fileName: string, mimeType = 'application/pdf'): void {
  const url = URL.createObjectURL(arrayBufferToBlob(buffer, mimeType));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
