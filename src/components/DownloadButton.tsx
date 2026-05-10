import { useTranslation } from 'react-i18next';
import { useDownload } from '../hooks/useDownload';

interface DownloadButtonProps {
  buffer: ArrayBuffer | null;
  fileName: string;
  mimeType?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function DownloadButton({
  buffer,
  fileName,
  mimeType = 'application/pdf',
  label,
  disabled = false,
  className = '',
}: DownloadButtonProps) {
  const { downloadSingle } = useDownload();
  const { t } = useTranslation();
  const displayLabel = label ?? t('buttons.download');

  return (
    <button
      onClick={() => buffer && downloadSingle(buffer, fileName, mimeType)}
      disabled={disabled || !buffer}
      className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      style={{ background: buffer && !disabled ? 'var(--accent)' : undefined }}
      onMouseEnter={(e) => { if (buffer && !disabled) (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
      onMouseLeave={(e) => { if (buffer && !disabled) (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {displayLabel}
    </button>
  );
}
