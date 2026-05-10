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

export default function UnlockPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const handleFile = async (files: File[]) => {
    setBuffer(await files[0].arrayBuffer());
    setFileName(files[0].name.replace(/\.pdf$/i, ''));
    setResult(null);
  };

  const handleUnlock = async () => {
    if (!buffer) return;
    start(t('progress.removingPassword'));
    try {
      const ProtectWorker = (await import('../../workers/protect.worker?worker')).default;
      const worker = new ProtectWorker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.removingPassword')));
      const api = wrap<{ unlock: (opts: { file: ArrayBuffer; password: string }) => Promise<ArrayBuffer> }>(worker);

      const buf = await api.unlock({ file: buffer.slice(0), password });
      finish();
      setResult(buf);
      showToast(t('success.unlocked'), 'success');
      worker.terminate();
    } catch (err) {
      reset();
      showToast(t('errors.wrongPassword'), 'error');
    }
  };

  return (
  <>
    <Helmet>
      <title>Unlock PDF Free — Remove Password Online | PDF Studio</title>
      <meta name="description" content="Remove password protection from a PDF file instantly. Free, no upload, runs entirely in your browser." />
    </Helmet>
    <ToolPageShell icon="🔓" title={t('tools.unlock.title')} description={t('unlock.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('unlock.passwordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('unlock.passwordHint')}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button
              onClick={handleUnlock}
              disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('unlock.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_unlocked.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
