interface ProgressBarProps {
  percent: number;
  message?: string;
  className?: string;
}

export function ProgressBar({ percent, message, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={`w-full ${className}`}>
      {message && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>{message}</span>
          <span className="font-mono text-xs font-medium" style={{ color: 'var(--accent)' }}>{clamped}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clamped}%`, background: 'var(--accent)' }}
        />
      </div>
    </div>
  );
}
