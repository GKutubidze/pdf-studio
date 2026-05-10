import { useState } from 'react';
import { wrap } from 'comlink';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';
import { attachWorkerProgress } from '../../utils/workerProgress';

export default function ProtectPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const handleFile = async (files: File[]) => {
    setBuffer(await files[0].arrayBuffer());
    setFileName(files[0].name.replace(/\.pdf$/i, ''));
    setResult(null);
  };

  const handleProtect = async () => {
    if (!buffer || !userPassword) {
      showToast(t('errors.enterPassword'), 'error');
      return;
    }
    start(t('progress.encrypting'));
    try {
      const ProtectWorker = (await import('../../workers/protect.worker?worker')).default;
      const worker = new ProtectWorker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.encrypting')));
      const api = wrap<{ protect: (opts: { file: ArrayBuffer; userPassword: string; ownerPassword?: string }) => Promise<ArrayBuffer> }>(worker);

      const buf = await api.protect({ file: buffer.slice(0), userPassword, ownerPassword: ownerPassword || undefined });
      finish();
      setResult(buf);
      showToast(t('success.protected'), 'success');
      worker.terminate();
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Encryption failed', 'error');
    }
  };

  return (
    <ToolPageShell icon="🔒" title={t('tools.protect.title')} description={t('protect.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('protect.openPassword')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder={t('protect.openPasswordHint')}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('protect.ownerPassword')}
            </label>
            <input
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder={t('protect.ownerPasswordHint')}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button
              onClick={handleProtect}
              disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('protect.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_protected.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
