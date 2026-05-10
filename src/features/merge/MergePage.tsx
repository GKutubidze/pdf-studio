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
import { formatFileSize } from '../../utils/blobUtils';
import { classifyError, getErrorMessage } from '../../utils/errorMessages';
import { attachWorkerProgress } from '../../utils/workerProgress';

interface FileItem {
  id: string;
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

export default function MergePage() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const addFiles = useCallback(async (accepted: File[]) => {
    const items = await Promise.all(
      accepted.map(async (f) => ({
        id: nanoid(),
        name: f.name,
        size: f.size,
        buffer: await f.arrayBuffer(),
      })),
    );
    setFiles((prev) => [...prev, ...items]);
    setResult(null);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResult(null);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setFiles((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      showToast(t('errors.addAtLeast2'), 'error');
      return;
    }

    start(t('progress.merging'));
    setResult(null);

    try {
      const MergeWorker = (await import('../../workers/merge.worker?worker')).default;
      const worker = new MergeWorker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.merging')));
      const api = wrap<{ merge: (opts: { files: ArrayBuffer[]; fileNames: string[] }) => Promise<ArrayBuffer> }>(worker);

      const buffer = await api.merge({
        files: files.map((f) => f.buffer.slice(0)),
        fileNames: files.map((f) => f.name),
      });

      finish();
      setResult(buffer);
      showToast(t('success.merged'), 'success');
      worker.terminate();
    } catch (err) {
      reset();
      const code = classifyError(err);
      showToast(getErrorMessage(code), 'error');
    }
  };

  return (
  <>
    <Helmet>
      <title>Merge PDF Free — Combine PDF Files Online | PDF Studio</title>
      <meta name="description" content="Merge multiple PDF files into one document. Drag to reorder pages. Runs in your browser — no uploads, no limits, 100% free and private." />
    </Helmet>
    <ToolPageShell
      icon="🔀"
      title={t('tools.merge.title')}
      description={t('merge.description')}
    >
      <FileUploader onFiles={addFiles} multiple />

      {files.length > 0 && (
        <div className="mt-6">
          <div className="space-y-2">
            {files.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-800 dark:text-gray-200">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200">▲</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === files.length - 1}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 dark:hover:text-gray-200">▼</button>
                  <button onClick={() => removeFile(f.id)}
                    className="ml-1 rounded p-1 text-red-400 hover:text-red-600">✕</button>
                </div>
              </div>
            ))}
          </div>

          {progress.active && (
            <ProgressBar className="mt-4" percent={progress.percent} message={progress.message} />
          )}

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleMerge}
              disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('merge.button', { count: files.length })}
            </button>
            <DownloadButton
              buffer={result}
              fileName="merged.pdf"
              label={t('merge.downloadLabel')}
            />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
