import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';

interface CropBox { x: number; y: number; width: number; height: number }

export default function CropPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [pageWidth, setPageWidth] = useState(595);
  const [pageHeight, setPageHeight] = useState(842);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 595, height: 842 });
  const [applyToAll, setApplyToAll] = useState(true);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const renderPreview = useCallback(async () => {
    if (!buffer || !canvasRef.current) return;
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(500 / viewport.width, 400 / viewport.height);
    const sv = page.getViewport({ scale });
    const canvas = canvasRef.current;
    canvas.width = sv.width;
    canvas.height = sv.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport: sv }).promise;

    const ctx = canvas.getContext('2d')!;
    const scaleX = sv.width / viewport.width;
    const scaleY = sv.height / viewport.height;
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(
      cropBox.x * scaleX,
      (viewport.height - cropBox.y - cropBox.height) * scaleY,
      cropBox.width * scaleX,
      cropBox.height * scaleY,
    );
    ctx.fillStyle = 'rgba(99,102,241,0.08)';
    ctx.fillRect(
      cropBox.x * scaleX,
      (viewport.height - cropBox.y - cropBox.height) * scaleY,
      cropBox.width * scaleX,
      cropBox.height * scaleY,
    );

    await pdf.destroy();
  }, [buffer, cropBox]);

  useEffect(() => { renderPreview(); }, [renderPreview]);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    const page = doc.getPages()[0];
    const { width, height } = page.getSize();
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(doc.getPageCount());
    setPageWidth(width);
    setPageHeight(height);
    setCropBox({ x: 0, y: 0, width, height });
    setRangeEnd(doc.getPageCount());
    setResult(null);
  };

  const handleCrop = async () => {
    if (!buffer) return;
    start(t('progress.applyingCrop'));
    try {
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPages();
      const startIdx = applyToAll ? 0 : rangeStart - 1;
      const endIdx = applyToAll ? pages.length : rangeEnd;

      for (let i = startIdx; i < endIdx; i++) {
        const page = pages[i];
        page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
        update(Math.round(((i - startIdx + 1) / (endIdx - startIdx)) * 90));
      }

      const bytes = await doc.save();
      finish();
      setResult(bytes.buffer as ArrayBuffer);
      showToast(t('success.cropped'), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const fields = [
    { labelKey: 'crop.xLeft',       val: cropBox.x,      setter: (v: number) => setCropBox((b) => ({ ...b, x: v })),      max: pageWidth },
    { labelKey: 'crop.yBottom',      val: cropBox.y,      setter: (v: number) => setCropBox((b) => ({ ...b, y: v })),      max: pageHeight },
    { labelKey: 'crop.widthLabel',   val: cropBox.width,  setter: (v: number) => setCropBox((b) => ({ ...b, width: v })),  max: pageWidth },
    { labelKey: 'crop.heightLabel',  val: cropBox.height, setter: (v: number) => setCropBox((b) => ({ ...b, height: v })), max: pageHeight },
  ];

  return (
    <ToolPageShell icon="✂️" title={t('tools.crop.title')} description={t('crop.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fields.map(({ labelKey, val, setter, max }) => (
              <div key={labelKey}>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t(labelKey)}</label>
                <input type="number" min={0} max={max} value={Math.round(val)}
                  onChange={(e) => setter(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            {t('crop.pageSizeNote', { w: Math.round(pageWidth), h: Math.round(pageHeight) })}
          </p>

          <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <canvas ref={canvasRef} className="block" style={{ maxWidth: '100%' }} />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)}
                className="accent-indigo-600" />
              {t('crop.applyAll', { count: pageCount })}
            </label>
            {!applyToAll && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span>{t('crop.pagesFrom')}</span>
                <input type="number" min={1} max={pageCount} value={rangeStart} onChange={(e) => setRangeStart(Number(e.target.value))}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800" />
                <span>{t('crop.to')}</span>
                <input type="number" min={1} max={pageCount} value={rangeEnd} onChange={(e) => setRangeEnd(Number(e.target.value))}
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800" />
              </div>
            )}
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleCrop} disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('crop.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_cropped.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
