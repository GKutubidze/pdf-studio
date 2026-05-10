export function parsePageRanges(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
        for (let i = start; i <= end; i++) pages.add(i);
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= totalPages) pages.add(n);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export function parseRangesToSegments(
  input: string,
  totalPages: number,
): Array<{ start: number; end: number }> {
  const segments: Array<{ start: number; end: number }> = [];
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
        segments.push({ start, end });
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= totalPages) {
        segments.push({ start: n, end: n });
      }
    }
  }

  return segments;
}

export function everyNSegments(
  everyN: number,
  totalPages: number,
): Array<{ start: number; end: number }> {
  const segments: Array<{ start: number; end: number }> = [];
  for (let i = 1; i <= totalPages; i += everyN) {
    segments.push({ start: i, end: Math.min(i + everyN - 1, totalPages) });
  }
  return segments;
}

export function validateRangeInput(input: string, totalPages: number): string | null {
  if (!input.trim()) return 'Please enter a page range.';
  const pages = parsePageRanges(input, totalPages);
  if (pages.length === 0) return `No valid pages found. Enter a range like "1-3, 5, 7-9" (max page: ${totalPages}).`;
  return null;
}
