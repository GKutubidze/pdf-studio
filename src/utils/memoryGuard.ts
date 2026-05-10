export interface MemoryCheckResult {
  ok: boolean;
  reason?: string;
}

const PROCESSING_MULTIPLIER = 3;
const SAFETY_FACTOR = 0.7;

export function checkMemory(totalInputBytes: number): MemoryCheckResult {
  const deviceMemoryGB =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const availableBytes = deviceMemoryGB * 1024 * 1024 * 1024 * SAFETY_FACTOR;
  const estimatedNeeded = totalInputBytes * PROCESSING_MULTIPLIER;

  if (estimatedNeeded > availableBytes) {
    const neededMB = Math.round(estimatedNeeded / (1024 * 1024));
    const availMB = Math.round(availableBytes / (1024 * 1024));
    return {
      ok: false,
      reason: `This operation requires ~${neededMB} MB of memory but only ~${availMB} MB is available. Try splitting the task into smaller pieces.`,
    };
  }

  return { ok: true };
}
