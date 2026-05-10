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
import { attachWorkerProgress } from '../../utils/workerProgress';

interface PageRotation {
  index: number;
  degrees: number;
}

export default function RotatePage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<Map<number, number>>(new Map());
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(buf);
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(doc.getPageCount());
    setRotations(new Map());
    setResult(null);
  };

  const rotatePage = (idx: number, deg: 90 | 180 | 270) => {
    setRotations((prev) => {
      const next = new Map(prev);
      next.set(idx, ((next.get(idx) ?? 0) + deg) % 360);
      return next;
    });
  };

  const rotateAll = (deg: 90 | 180 | 270) => {
    const next = new Map<number, number>();
    for (let i = 0; i < pageCount; i++) {
      next.set(i, ((rotations.get(i) ?? 0) + deg) % 360);
    }
    setRotations(next);
  };

  const handleRotate = async () => {
    if (!buffer || rotations.size === 0) {
      showToast(t('errors.selectToRotate'), 'error');
      return;
    }
    start(t('progress.rotating'));
    try {
      const RotateWorker = (await import('../../workers/rotate.worker?worker')).default;
      const worker = new RotateWorker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.rotating')));
      const api = wrap<{ rotate: (opts: { file: ArrayBuffer; pages: PageRotation[] }) => Promise<ArrayBuffer> }>(worker);

      const pages: PageRotation[] = Array.from(rotations.entries()).map(([index, degrees]) => ({ index, degrees: degrees as 90 | 180 | 270 }));
      const buf = await api.rotate({ file: buffer.slice(0), pages });
      finish();
      setResult(buf);
      showToast(t('success.rotated'), 'success');
      worker.terminate();
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  return (
  <>
    <Helmet>
      <title>Rotate PDF Free — Rotate Pages Online | PDF Studio</title>
      <meta name="description" content="Rotate individual pages or all pages at once. Choose 90°, 180°, or 270°. Free, unlimited, no file upload." />
    </Helmet>
    <ToolPageShell icon="🔄" title={t('tools.rotate.title')} description={t('rotate.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {([90, 180, 270] as const).map((deg) => (
              <button key={deg} onClick={() => rotateAll(deg)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                {t('rotate.rotateAll', { deg })}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: pageCount }, (_, i) => {
              const rot = rotations.get(i) ?? 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-16 w-12 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 cursor-pointer hover:border-indigo-300"
                    style={{ transform: `rotate(${rot}deg)`, transition: 'transform 0.3s' }}
                    onClick={() => rotatePage(i, 90)}
                    title={t('rotate.clickHint')}
                  >
                    <span className="text-xl">📄</span>
                  </div>
                  <span className="text-xs text-gray-500">p.{i + 1}</span>
                  {rot !== 0 && (
                    <span className="rounded bg-indigo-100 px-1 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {rot}°
                    </span>
                  )}
                  <div className="flex gap-1">
                    {([90, 180, 270] as const).map((d) => (
                      <button key={d} onClick={() => rotatePage(i, d)}
                        className="rounded px-1 py-0.5 text-xs text-gray-400 hover:text-indigo-500">
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleRotate} disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('rotate.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_rotated.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
