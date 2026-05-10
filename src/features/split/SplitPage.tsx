import { useState } from 'react';
import { wrap } from 'comlink';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';
import { useDownload } from '../../hooks/useDownload';
import { attachWorkerProgress } from '../../utils/workerProgress';
import { parseRangesToSegments, everyNSegments, validateRangeInput } from '../../utils/rangeParser';
import { VisualPageSelector } from './VisualPageSelector';

type SplitMode = 'ranges' | 'everyN' | 'individual' | 'visual';

export default function SplitPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();
  const { downloadMultipleAsZip, downloadSingle } = useDownload();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(buf);
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(doc.getPageCount());
    setSelectedPages(new Set());
  };

  const handleSplit = async () => {
    if (!buffer) return;
    start(t('progress.splitting'));

    try {
      const SplitWorker = (await import('../../workers/split.worker?worker')).default;
      const worker = new SplitWorker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.splitting')));
      const api = wrap<{ split: (opts: { file: ArrayBuffer; ranges: { start: number; end: number }[] }) => Promise<ArrayBuffer[]> }>(worker);

      let ranges: { start: number; end: number }[] = [];

      if (mode === 'ranges') {
        const err = validateRangeInput(rangeInput, pageCount);
        if (err) { showToast(err, 'error'); reset(); return; }
        ranges = parseRangesToSegments(rangeInput, pageCount);
      } else if (mode === 'everyN') {
        ranges = everyNSegments(everyN, pageCount);
      } else if (mode === 'visual') {
        if (selectedPages.size === 0) { showToast(t('errors.selectPages'), 'error'); reset(); return; }
        ranges = Array.from(selectedPages).sort((a, b) => a - b).map((p) => ({ start: p, end: p }));
      } else {
        ranges = Array.from({ length: pageCount }, (_, i) => ({ start: i + 1, end: i + 1 }));
      }

      const results = await api.split({ file: buffer.slice(0), ranges });

      finish();
      worker.terminate();

      if (results.length === 1) {
        downloadSingle(results[0], `${fileName}_split.pdf`);
      } else {
        const zipFiles = results.map((buf, i) => ({
          buffer: buf,
          name: `${fileName}_part${i + 1}.pdf`,
        }));
        await downloadMultipleAsZip(zipFiles, `${fileName}_split.zip`);
      }

      showToast(t('success.split', { count: results.length }), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Split failed', 'error');
    }
  };

  const modeLabels: Record<SplitMode, string> = {
    ranges: t('split.modeRanges'),
    everyN: t('split.modeEveryN'),
    individual: t('split.modeIndividual'),
    visual: t('split.modeVisual'),
  };

  return (
    <ToolPageShell icon="✂️" title={t('tools.split.title')} description={t('split.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('split.loaded')}: <strong className="text-gray-800 dark:text-gray-200">{fileName}.pdf</strong> ({pageCount} {t('split.pages')})
          </p>

          <div className="flex flex-wrap gap-2">
            {(['ranges', 'everyN', 'individual', 'visual'] as SplitMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {mode === 'ranges' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('split.rangeLabel')}
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="1-5, 8, 11-15"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          {mode === 'everyN' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('split.everyNLabel')}
              </label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={everyN}
                onChange={(e) => setEveryN(Number(e.target.value))}
                className="w-32 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          {mode === 'individual' && (
            <p className="text-sm text-gray-500">{t('split.individualNote')}</p>
          )}

          {mode === 'visual' && buffer && (
            <VisualPageSelector
              totalPages={pageCount}
              selectedPages={selectedPages}
              onSelectionChange={setSelectedPages}
              pdfArrayBuffer={buffer}
            />
          )}

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <button
            onClick={handleSplit}
            disabled={progress.active}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('split.button')}
          </button>
        </div>
      )}
    </ToolPageShell>
  );
}
