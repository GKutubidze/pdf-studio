import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';
import { useDownload } from '../../hooks/useDownload';

interface PageItem {
  index: number;
  label: string;
}

export default function OrganizePage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();
  const { downloadSingle } = useDownload();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    const count = doc.getPageCount();
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPages(Array.from({ length: count }, (_, i) => ({ index: i, label: `Page ${i + 1}` })));
    setSelected(new Set());
    setResult(null);
  };

  const toggleSelect = useCallback((idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const deletePage = useCallback((idx: number) => {
    setPages((prev) => prev.filter((p) => p.index !== idx));
    setSelected((prev) => { const s = new Set(prev); s.delete(idx); return s; });
    setResult(null);
  }, []);

  const deleteSelected = () => {
    setPages((prev) => prev.filter((p) => !selected.has(p.index)));
    setSelected(new Set());
    setResult(null);
  };

  const addBlankPage = () => {
    const newIdx = Date.now();
    setPages((prev) => [...prev, { index: newIdx, label: 'Blank Page' }]);
  };

  const movePage = (from: number, to: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const handleApply = async () => {
    if (!buffer) return;
    start(t('progress.organizing'));
    try {
      const src = await PDFDocument.load(buffer);
      const dst = await PDFDocument.create();
      const srcPageCount = src.getPageCount();

      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (p.index >= srcPageCount || p.label === 'Blank Page') {
          const blankPage = dst.addPage([595, 842]);
          void blankPage;
        } else {
          const [copied] = await dst.copyPages(src, [p.index]);
          dst.addPage(copied);
        }
        update(Math.round(((i + 1) / pages.length) * 90));
      }

      const bytes = await dst.save();
      finish();
      setResult(bytes.buffer as ArrayBuffer);
      showToast(t('success.organized'), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const handleExtract = async () => {
    if (!buffer || selected.size === 0) {
      showToast(t('errors.selectPages'), 'error');
      return;
    }
    const src = await PDFDocument.load(buffer);
    const dst = await PDFDocument.create();
    const indices = Array.from(selected).sort((a, b) => a - b);
    const copied = await dst.copyPages(src, indices);
    copied.forEach((p) => dst.addPage(p));
    const bytes = await dst.save();
    downloadSingle(bytes.buffer as ArrayBuffer, `${fileName}_extracted.pdf`);
    showToast(t('success.pagesExtracted'), 'success');
  };

  return (
    <ToolPageShell icon="📋" title={t('tools.organize.title')} description={t('organize.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && pages.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={deleteSelected} disabled={selected.size === 0}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-200 disabled:opacity-40 dark:bg-red-900/20 dark:text-red-400">
              {t('organize.deleteSelected', { count: selected.size })}
            </button>
            <button onClick={handleExtract} disabled={selected.size === 0}
              className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-200 disabled:opacity-40 dark:bg-blue-900/20 dark:text-blue-400">
              {t('organize.extractSelected')}
            </button>
            <button onClick={addBlankPage}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
              {t('organize.addBlank')}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {pages.map((p, i) => (
              <div
                key={`${p.index}-${i}`}
                onClick={() => toggleSelect(p.index)}
                className={`relative flex flex-col items-center gap-1 cursor-pointer rounded-xl border-2 p-2 transition ${
                  selected.has(p.index)
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex h-16 w-12 items-center justify-center rounded bg-gray-100 text-2xl dark:bg-gray-700">
                  {p.label === 'Blank Page' ? '⬜' : '📄'}
                </div>
                <span className="text-xs text-gray-500">{p.label}</span>
                <div className="absolute right-1 top-1 flex gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); movePage(i, Math.max(0, i - 1)); }}
                    className="rounded bg-white/80 px-0.5 text-xs text-gray-400 hover:text-gray-700 dark:bg-gray-800/80">◀</button>
                  <button onClick={(e) => { e.stopPropagation(); movePage(i, Math.min(pages.length - 1, i + 1)); }}
                    className="rounded bg-white/80 px-0.5 text-xs text-gray-400 hover:text-gray-700 dark:bg-gray-800/80">▶</button>
                  <button onClick={(e) => { e.stopPropagation(); deletePage(p.index); }}
                    className="rounded bg-white/80 px-0.5 text-xs text-red-400 hover:text-red-600 dark:bg-gray-800/80">✕</button>
                </div>
              </div>
            ))}
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleApply} disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('organize.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_organized.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
