/**
 * Attach a progress listener to a raw Worker before wrapping it with Comlink.
 * Workers post `{ type: 'progress', percent: number }` messages natively.
 * Comlink ignores these messages (they don't match its protocol format),
 * so both listeners coexist safely on the same worker.
 */
export function attachWorkerProgress(
  worker: Worker,
  onPercent: (percent: number) => void,
): void {
  worker.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'progress' && typeof e.data.percent === 'number') {
      onPercent(e.data.percent);
    }
  });
}
