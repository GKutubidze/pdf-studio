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
import { everyNSegments } from '../../utils/rangeParser';
import { VisualPageSelector } from './VisualPageSelector';

type SplitMode = 'ranges' | 'everyN' | 'individual' | 'visual';

export default function SplitPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [rangeRows, setRangeRows] = useState<{ from: number; to: number }[]>([{ from: 1, to: 1 }]);
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
        if (rangeRows.length === 0) { showToast(t('errors.addRange'), 'error'); reset(); return; }
        for (const row of rangeRows) {
          if (row.from < 1 || row.to > pageCount || row.from > row.to) {
            showToast(t('errors.invalidRange', { from: row.from, to: row.to, total: pageCount }), 'error');
            reset(); return;
          }
        }
        ranges = rangeRows.map((r) => ({ start: r.from, end: r.to }));
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
            <div className="space-y-2">
              {rangeRows.map((row, i) => {
                const overlaps = rangeRows.some((other, j) => j !== i && other.from <= row.to && other.to >= row.from);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-right text-xs text-gray-400">{i + 1}.</span>
                    <label className="text-sm text-gray-600 dark:text-gray-400">{t('split.from')}</label>
                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                      <input
                        type="number" min={1} max={pageCount} value={row.from}
                        onChange={(e) => setRangeRows((rows) => rows.map((r, j) => j === i ? { ...r, from: Math.max(1, Math.min(pageCount, Number(e.target.value))) } : r))}
                        className="w-16 bg-white px-2 py-1.5 text-sm focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                      />
                      <div className="flex flex-col border-l border-gray-300 dark:border-gray-600">
                        <button className="px-1 py-0.5 text-xs leading-none text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setRangeRows((rows) => rows.map((r, j) => j === i ? { ...r, from: Math.min(r.to, r.from + 1) } : r))}>▲</button>
                        <button className="px-1 py-0.5 text-xs leading-none text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setRangeRows((rows) => rows.map((r, j) => j === i ? { ...r, from: Math.max(1, r.from - 1) } : r))}>▼</button>
                      </div>
                    </div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">{t('split.to')}</label>
                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                      <input
                        type="number" min={1} max={pageCount} value={row.to}
                        onChange={(e) => setRangeRows((rows) => rows.map((r, j) => j === i ? { ...r, to: Math.max(r.from, Math.min(pageCount, Number(e.target.value))) } : r))}
                        className="w-16 bg-white px-2 py-1.5 text-sm focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                      />
                      <div className="flex flex-col border-l border-gray-300 dark:border-gray-600">
                        <button className="px-1 py-0.5 text-xs leading-none text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setRangeRows((rows) => rows.map((r, j) => j === i ? { ...r, to: Math.min(pageCount, r.to + 1) } : r))}>▲</button>
                        <button className="px-1 py-0.5 text-xs leading-none text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setRangeRows((rows) => rows.map((r, j) => j === i ? { ...r, to: Math.max(r.from, r.to - 1) } : r))}>▼</button>
                      </div>
                    </div>
                    {overlaps && <span className="text-xs text-amber-600 dark:text-amber-400">{t('split.overlap')}</span>}
                    {rangeRows.length > 1 && (
                      <button onClick={() => setRangeRows((rows) => rows.filter((_, j) => j !== i))}
                        className="ml-1 text-gray-400 hover:text-red-500" title="Remove">✕</button>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => setRangeRows((rows) => [...rows, { from: 1, to: 1 }])}
                className="mt-1 rounded-lg border border-dashed border-indigo-400 px-4 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
              >
                + {t('split.addRange')}
              </button>
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
