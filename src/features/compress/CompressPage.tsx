import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { wrap } from 'comlink';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';
import { formatFileSize } from '../../utils/blobUtils';
import { attachWorkerProgress } from '../../utils/workerProgress';
import type { CompressionQuality } from '../../types/feature.types';

export default function CompressPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [result, setResult] = useState<{ buffer: ArrayBuffer; compressedSize: number } | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    setBuffer(await f.arrayBuffer());
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setOriginalSize(f.size);
    setResult(null);
  };

  const handleCompress = async () => {
    if (!buffer) return;
    start(t('progress.compressing'));
    setResult(null);

    try {
      const CompressWorker = (await import('../../workers/compress.worker?worker')).default;
      const worker = new CompressWorker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.compressing')));
      const api = wrap<{ compress: (opts: { file: ArrayBuffer; quality: CompressionQuality }) => Promise<{ buffer: ArrayBuffer; originalSize: number; compressedSize: number }> }>(worker);

      const res = await api.compress({ file: buffer.slice(0), quality });

      finish();
      setResult({ buffer: res.buffer, compressedSize: res.compressedSize });
      showToast(t('success.compressed'), 'success');
      worker.terminate();
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Compression failed', 'error');
    }
  };

  const reductionPct = result
    ? Math.round((1 - result.compressedSize / originalSize) * 100)
    : 0;

  const qualityLabels: Record<CompressionQuality, string> = {
    high: t('compress.high'),
    medium: t('compress.medium'),
    low: t('compress.low'),
  };

  return (
  <>
    <Helmet>
      <title>Compress PDF Free — Reduce File Size Online | PDF Studio</title>
      <meta name="description" content="Compress PDF files without uploading. Choose quality level and see file size reduction. Free, unlimited, and 100% private." />
    </Helmet>
    <ToolPageShell icon="🗜️" title={t('tools.compress.title')} description={t('compress.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">
            File: <strong className="text-gray-800 dark:text-gray-200">{fileName}.pdf</strong> ({formatFileSize(originalSize)})
          </p>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('compress.quality')}</p>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as CompressionQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                    quality === q
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {qualityLabels[q]}
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <p className="font-medium text-green-700 dark:text-green-400">
                {t('compress.reduced', { pct: reductionPct })}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                {formatFileSize(originalSize)} → {formatFileSize(result.compressedSize)}
              </p>
            </div>
          )}

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button
              onClick={handleCompress}
              disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('compress.button')}
            </button>
            <DownloadButton buffer={result?.buffer ?? null} fileName={`${fileName}_compressed.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
