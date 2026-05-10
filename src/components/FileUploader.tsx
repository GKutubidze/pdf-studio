import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

interface FileUploaderProps {
  onFiles: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number;
  labelKey?: string;
  sublabelKey?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function FileUploader({
  onFiles,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  maxSize = 500 * 1024 * 1024,
  labelKey,
  sublabelKey,
  label,
  sublabel,
  className = '',
}: FileUploaderProps) {
  const { t } = useTranslation();
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted.length > 0) onFiles(accepted); },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
  });

  const displayLabel = label ?? (labelKey ? t(labelKey) : t('uploader.drop'));
  const displaySublabel = sublabel ?? (sublabelKey ? t(sublabelKey) : t('uploader.sublabel'));

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className="dropzone"
        style={isDragActive ? { borderColor: 'var(--accent)', background: 'rgba(99,102,241,0.07)' } : {}}
      >
        <input {...getInputProps()} />

        <div className="pointer-events-none">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
            </svg>
          </div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isDragActive ? t('uploader.dragActive') : displayLabel}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{displaySublabel}</p>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-2 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {fileRejections[0]?.errors[0]?.message ?? t('uploader.rejected')}
        </div>
      )}
    </div>
  );
}
