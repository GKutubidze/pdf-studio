import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let _counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons: Record<ToastType, string> = { success: '✓', error: '✕', info: 'ℹ' };
  const borders: Record<ToastType, string> = {
    success: 'border-emerald-700/50 bg-emerald-950/90',
    error:   'border-red-700/50 bg-red-950/90',
    info:    'border-gray-700/50 bg-gray-900/90',
  };
  const textColors: Record<ToastType, string> = {
    success: 'text-emerald-300',
    error:   'text-red-300',
    info:    'text-gray-200',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md animate-fade-in ${borders[t.type]}`}
            style={{ minWidth: 260, maxWidth: 400 }}
          >
            <span className={`mt-0.5 shrink-0 font-bold ${textColors[t.type]}`}>{icons[t.type]}</span>
            <span className="text-gray-200 leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
