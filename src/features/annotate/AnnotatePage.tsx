import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';

type Tool = 'text' | 'rectangle' | 'highlight';

interface Annotation {
  id: string;
  tool: Tool;
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  fontSize: number;
}

export default function AnnotatePage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('text');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [color, setColor] = useState('#ff0000');
  const [fontSize, setFontSize] = useState(14);
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const renderPage = useCallback(async () => {
    if (!buffer || !canvasRef.current) return;
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
    const page = await pdf.getPage(currentPage + 1);
    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = canvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    await pdf.destroy();
  }, [buffer, currentPage]);

  useEffect(() => { renderPage(); }, [renderPage]);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(buf);
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(doc.getPageCount());
    setAnnotations([]);
    setResult(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = canvas.height - ((e.clientY - rect.top) / rect.height) * canvas.height;

    const promptResult = activeTool === 'text' ? prompt(t('annotate.promptText')) : undefined;
    const text: string | undefined = promptResult ?? undefined;
    if (activeTool === 'text' && !text) return;

    const ann: Annotation = {
      id: crypto.randomUUID(),
      tool: activeTool,
      pageIndex: currentPage,
      x, y,
      width: 100,
      height: activeTool === 'text' ? fontSize * 1.2 : 50,
      text,
      color,
      fontSize,
    };
    setAnnotations((prev) => [...prev, ann]);
  };

  const handleApply = async () => {
    if (!buffer) return;
    start(t('progress.processing'));
    try {
      const doc = await PDFDocument.load(buffer);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();

      for (let i = 0; i < annotations.length; i++) {
        const ann = annotations[i];
        const page = pages[ann.pageIndex];
        if (!page) continue;
        const hex = ann.color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        if (ann.tool === 'text' && ann.text) {
          page.drawText(ann.text, { x: ann.x, y: ann.y, size: ann.fontSize, font, color: rgb(r, g, b) });
        } else if (ann.tool === 'rectangle') {
          page.drawRectangle({ x: ann.x, y: ann.y, width: ann.width ?? 100, height: ann.height ?? 50, borderColor: rgb(r, g, b), borderWidth: 2 });
        } else if (ann.tool === 'highlight') {
          page.drawRectangle({ x: ann.x, y: ann.y, width: ann.width ?? 100, height: ann.height ?? 20, color: rgb(r, g, b), opacity: 0.3 });
        }

        update(Math.round(((i + 1) / annotations.length) * 90));
      }

      const bytes = await doc.save();
      finish();
      setResult(bytes.buffer as ArrayBuffer);
      showToast(t('success.annotated'), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const tools: { id: Tool; labelKey: string }[] = [
    { id: 'text',      labelKey: 'annotate.toolText' },
    { id: 'rectangle', labelKey: 'annotate.toolRect' },
    { id: 'highlight', labelKey: 'annotate.toolHighlight' },
  ];

  return (
    <ToolPageShell icon="✏️" title={t('tools.annotate.title')} description={t('annotate.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-xl border border-gray-200 p-1 dark:border-gray-700">
              {tools.map((tool) => (
                <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${activeTool === tool.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                  {t(tool.labelKey)}
                </button>
              ))}
            </div>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-lg border border-gray-300" />
            <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
              min={8} max={72} className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800" />
            <button onClick={() => setAnnotations((prev) => prev.slice(0, -1))}
              disabled={annotations.length === 0}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-500 disabled:opacity-30">
              {t('buttons.undo')}
            </button>
            <span className="ml-auto text-sm text-gray-400">
              {t('annotate.page', { current: currentPage + 1, total: pageCount })}
            </span>
          </div>

          <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <canvas ref={canvasRef} onClick={handleCanvasClick}
              className="cursor-crosshair block" style={{ maxWidth: '100%' }} />
          </div>

          <div className="flex gap-2">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-30 dark:bg-gray-700">
              {t('buttons.prev')}
            </button>
            <button disabled={currentPage >= pageCount - 1} onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-30 dark:bg-gray-700">
              {t('buttons.next')}
            </button>
          </div>

          {annotations.length > 0 && (
            <p className="text-sm text-gray-500">{t('annotate.count', { count: annotations.length })}</p>
          )}

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleApply} disabled={progress.active || annotations.length === 0}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('annotate.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_annotated.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
