import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { wrap } from 'comlink';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';
import { attachWorkerProgress } from '../../utils/workerProgress';
import { formatFileSize } from '../../utils/blobUtils';
import type { ImagePageSize } from '../../types/feature.types';

interface ImageItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  buffer: ArrayBuffer;
  previewUrl: string;
}

export default function ImageToPdfPage() {
  const { t } = useTranslation();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<ImagePageSize>('a4');
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const addImages = useCallback(async (files: File[]) => {
    const items = await Promise.all(
      files.map(async (f) => ({
        id: nanoid(),
        name: f.name,
        size: f.size,
        mimeType: f.type,
        buffer: await f.arrayBuffer(),
        previewUrl: URL.createObjectURL(f),
      })),
    );
    setImages((prev) => [...prev, ...items]);
    setResult(null);
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setResult(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) { showToast(t('errors.addImages'), 'error'); return; }
    start(t('progress.converting'));
    try {
      const Worker = (await import('../../workers/imagetopdf.worker?worker')).default;
      const worker = new Worker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.converting')));
      const api = wrap<{ convert: (opts: { images: ArrayBuffer[]; mimeTypes: string[]; pageSize: ImagePageSize; quality: number }) => Promise<ArrayBuffer> }>(worker);

      const buf = await api.convert({
        images: images.map((i) => i.buffer.slice(0)),
        mimeTypes: images.map((i) => i.mimeType),
        pageSize,
        quality: 0.85,
      });
      finish();
      setResult(buf);
      showToast(t('success.convertedToPdf'), 'success');
      worker.terminate();
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Conversion failed', 'error');
    }
  };

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const pageSizeLabels: Record<ImagePageSize, string> = {
    a4: t('imageToPdf.a4'),
    letter: t('imageToPdf.letter'),
    fit: t('imageToPdf.fitImage'),
  };

  return (
  <>
    <Helmet>
      <title>Image to PDF Free — Convert JPG/PNG to PDF Online | PDF Studio</title>
      <meta name="description" content="Convert JPG, PNG, WebP, and other images to PDF. Drag to reorder. Runs in your browser — no uploads, no limits." />
    </Helmet>
    <ToolPageShell icon="🖼️" title={t('tools.imageToPdf.title')} description={t('imageToPdf.description')}>
      <FileUploader
        onFiles={addImages}
        accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] }}
        labelKey="uploader.dropImages"
      />

      {images.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            {(['a4', 'letter', 'fit'] as ImagePageSize[]).map((s) => (
              <button key={s} onClick={() => setPageSize(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  pageSize === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                {pageSizeLabels[s]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {images.map((img, i) => (
              <div key={img.id} className="relative rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-800">
                <img src={img.previewUrl} alt={img.name} className="h-24 w-full object-cover" />
                <div className="p-1.5">
                  <p className="truncate text-xs text-gray-600 dark:text-gray-400">{img.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(img.size)}</p>
                </div>
                <div className="absolute right-1 top-1 flex gap-1">
                  <button onClick={() => moveImage(i, Math.max(0, i - 1))}
                    className="rounded bg-white/80 px-1 text-xs text-gray-500 hover:text-gray-800 dark:bg-gray-700/80">◀</button>
                  <button onClick={() => moveImage(i, Math.min(images.length - 1, i + 1))}
                    className="rounded bg-white/80 px-1 text-xs text-gray-500 hover:text-gray-800 dark:bg-gray-700/80">▶</button>
                  <button onClick={() => removeImage(img.id)}
                    className="rounded bg-white/80 px-1 text-xs text-red-500 hover:text-red-700 dark:bg-gray-700/80">✕</button>
                </div>
              </div>
            ))}
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleConvert} disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('imageToPdf.button')}
            </button>
            <DownloadButton buffer={result} fileName="images.pdf" />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
