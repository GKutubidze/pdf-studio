type ErrorCode = 'CORRUPTED' | 'MEMORY' | 'ENCRYPTED' | 'INVALID_RANGE' | 'UNKNOWN';

const messages: Record<ErrorCode, string> = {
  CORRUPTED: 'This PDF appears to be corrupted or damaged. Try using the Repair tool.',
  MEMORY: 'Not enough memory to process this file. Try closing other browser tabs or splitting the file first.',
  ENCRYPTED: 'This PDF is password-protected. Use the Unlock tool to remove the password first.',
  INVALID_RANGE: 'The specified page range is invalid. Please check your input.',
  UNKNOWN: 'An unexpected error occurred. Please try again or use the Repair tool if the file may be damaged.',
};

export function getErrorMessage(code: ErrorCode): string {
  return messages[code] ?? messages.UNKNOWN;
}

export function classifyError(err: unknown): ErrorCode {
  if (!(err instanceof Error)) return 'UNKNOWN';
  const msg = err.message.toLowerCase();
  if (msg.includes('encrypt') || msg.includes('password') || msg.includes('decrypt')) return 'ENCRYPTED';
  if (msg.includes('memory') || msg.includes('out of memory') || msg.includes('oom')) return 'MEMORY';
  if (msg.includes('corrupt') || msg.includes('invalid pdf') || msg.includes('xref')) return 'CORRUPTED';
  if (msg.includes('range') || msg.includes('page')) return 'INVALID_RANGE';
  return 'UNKNOWN';
}
