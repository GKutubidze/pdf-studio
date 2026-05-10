const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePdfFile(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File "${file.name}" exceeds the 500 MB limit.` };
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: `"${file.name}" is not a PDF file.` };
  }
  return { valid: true };
}

export function validateImageFile(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File "${file.name}" exceeds the 500 MB limit.` };
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!allowed.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
    return { valid: false, error: `"${file.name}" is not a supported image format.` };
  }
  return { valid: true };
}

export async function checkPdfHeader(buffer: ArrayBuffer): Promise<ValidationResult> {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  const header = String.fromCharCode(...bytes);
  if (!header.startsWith('%PDF-')) {
    return { valid: false, error: 'File does not appear to be a valid PDF (missing %PDF header).' };
  }
  return { valid: true };
}

export function estimateMemoryNeeded(totalBytes: number): boolean {
  const deviceMemoryGB =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const availableBytes = deviceMemoryGB * 1024 * 1024 * 1024 * 0.7;
  return totalBytes * 3 < availableBytes;
}
