import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface Props {
  totalPages: number;
  selectedPages: Set<number>;
  onSelectionChange: (pages: Set<number>) => void;
  pdfArrayBuffer: ArrayBuffer;
}

function ThumbnailTile({
  pageNum,
  pdfDoc,
  selected,
  onClick,
  lazy,
}: {
  pageNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  lazy: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy) return;
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!visible || !pdfDoc) return;
    let cancelled = false;
    async function render() {
      const page = await pdfDoc!.getPage(pageNum);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
    render().catch(() => {});
    return () => { cancelled = true; };
  }, [visible, pdfDoc, pageNum]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`cursor-pointer select-none rounded-lg border-2 overflow-hidden transition-all ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
      }`}
    >
      <div className="relative bg-gray-50 dark:bg-gray-700" style={{ minHeight: 64 }}>
        {visible ? (
          <canvas ref={canvasRef} className="w-full block" />
        ) : (
          <div className="flex h-16 items-center justify-center text-gray-300 dark:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        {selected && (
          <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600">
            <span className="text-[8px] font-bold text-white">✓</span>
          </div>
        )}
      </div>
      <div
        className={`py-1 text-center text-xs font-medium ${
          selected
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {pageNum}
      </div>
    </div>
  );
}

const COMPACT_PAGE_SIZE = 100;

export function VisualPageSelector({ totalPages, selectedPages, onSelectionChange, pdfArrayBuffer }: Props) {
  const { t } = useTranslation();
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const lastClickedRef = useRef<number | null>(null);
  const [compactPage, setCompactPage] = useState(1);

  const mode = totalPages < 50 ? 'full' : totalPages <= 200 ? 'lazy' : 'compact';

  useEffect(() => {
    if (mode === 'compact') return;
    let doc: pdfjsLib.PDFDocumentProxy | null = null;
    pdfjsLib
      .getDocument({ data: new Uint8Array(pdfArrayBuffer.slice(0)) })
      .promise.then((d) => {
        doc = d;
        setPdfDoc(d);
      })
      .catch(() => {});
    return () => { doc?.destroy(); setPdfDoc(null); };
  }, [pdfArrayBuffer, mode]);

  const allPages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  const toggle = useCallback(
    (pageNum: number, e: React.MouseEvent) => {
      const next = new Set(selectedPages);
      if (e.shiftKey && lastClickedRef.current !== null) {
        const lo = Math.min(lastClickedRef.current, pageNum);
        const hi = Math.max(lastClickedRef.current, pageNum);
        const targetState = !selectedPages.has(pageNum);
        for (let p = lo; p <= hi; p++) {
          if (targetState) next.add(p);
          else next.delete(p);
        }
      } else {
        if (next.has(pageNum)) next.delete(pageNum);
        else next.add(pageNum);
      }
      lastClickedRef.current = pageNum;
      onSelectionChange(next);
    },
    [selectedPages, onSelectionChange],
  );

  const setPreset = useCallback(
    (preset: 'all' | 'none' | 'even' | 'odd' | 'firstHalf' | 'lastHalf' | 'every2') => {
      const half = Math.floor(totalPages / 2);
      const map = {
        all:       new Set(allPages),
        none:      new Set<number>(),
        even:      new Set(allPages.filter((p) => p % 2 === 0)),
        odd:       new Set(allPages.filter((p) => p % 2 !== 0)),
        firstHalf: new Set(allPages.slice(0, half)),
        lastHalf:  new Set(allPages.slice(half)),
        every2:    new Set(allPages.filter((_, i) => i % 2 === 0)),
      };
      onSelectionChange(map[preset]);
    },
    [allPages, totalPages, onSelectionChange],
  );

  const compactTotalPages = Math.ceil(totalPages / COMPACT_PAGE_SIZE);
  const pageStart = (compactPage - 1) * COMPACT_PAGE_SIZE;
  const visibleCompact = allPages.slice(pageStart, pageStart + COMPACT_PAGE_SIZE);

  const btnBase = 'rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setPreset('all')} className={btnBase}>{t('split.selectAll')}</button>
        <button onClick={() => setPreset('none')} className={btnBase}>{t('split.deselectAll')}</button>
        {mode === 'compact' && (
          <>
            <button onClick={() => setPreset('even')} className={btnBase}>{t('split.evenPages')}</button>
            <button onClick={() => setPreset('odd')} className={btnBase}>{t('split.oddPages')}</button>
            <button onClick={() => setPreset('firstHalf')} className={btnBase}>{t('split.firstHalf')}</button>
            <button onClick={() => setPreset('lastHalf')} className={btnBase}>{t('split.lastHalf')}</button>
            <button onClick={() => setPreset('every2')} className={btnBase}>{t('split.every2')}</button>
          </>
        )}
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {t('split.selected', { count: selectedPages.size })}
        </span>
      </div>

      {mode === 'compact' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-10 gap-1 sm:grid-cols-12 lg:grid-cols-16">
            {visibleCompact.map((p) => (
              <button
                key={p}
                onClick={(e) => toggle(p, e)}
                className={`select-none rounded py-2 text-xs font-medium transition ${
                  selectedPages.has(p)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {compactTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCompactPage((n) => Math.max(1, n - 1))}
                disabled={compactPage === 1}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-40 dark:bg-gray-700 dark:text-gray-300"
              >
                {t('buttons.prev')}
              </button>
              <span className="text-sm text-gray-500">
                {compactPage} / {compactTotalPages}
              </span>
              <button
                onClick={() => setCompactPage((n) => Math.min(compactTotalPages, n + 1))}
                disabled={compactPage === compactTotalPages}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-40 dark:bg-gray-700 dark:text-gray-300"
              >
                {t('buttons.next')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 pr-1${
            mode === 'lazy' ? ' max-h-96 overflow-y-auto' : ''
          }`}
        >
          {allPages.map((p) => (
            <ThumbnailTile
              key={p}
              pageNum={p}
              pdfDoc={pdfDoc}
              selected={selectedPages.has(p)}
              onClick={(e) => toggle(p, e)}
              lazy={mode === 'lazy'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
