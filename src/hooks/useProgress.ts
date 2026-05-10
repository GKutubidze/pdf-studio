import { useState, useCallback } from 'react';

export interface ProgressState {
  percent: number;
  message: string;
  active: boolean;
}

export function useProgress() {
  const [progress, setProgressState] = useState<ProgressState>({
    percent: 0,
    message: '',
    active: false,
  });

  const start = useCallback((message = 'Processing…') => {
    setProgressState({ percent: 0, message, active: true });
  }, []);

  const update = useCallback((percent: number, message?: string) => {
    setProgressState((prev) => ({
      percent,
      message: message ?? prev.message,
      active: true,
    }));
  }, []);

  const finish = useCallback(() => {
    setProgressState({ percent: 100, message: 'Done!', active: false });
  }, []);

  const reset = useCallback(() => {
    setProgressState({ percent: 0, message: '', active: false });
  }, []);

  return { progress, start, update, finish, reset };
}
