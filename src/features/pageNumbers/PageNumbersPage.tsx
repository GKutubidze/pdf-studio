import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';

type Position =
  | 'bottom-center' | 'bottom-left' | 'bottom-right'
  | 'top-center' | 'top-left' | 'top-right';

const POSITIONS: Position[] = [
  'bottom-center', 'bottom-left', 'bottom-right',
  'top-center', 'top-left', 'top-right',
];

export default function PageNumbersPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [startFrom, setStartFrom] = useState(1);
  const [skipFirst, setSkipFirst] = useState(0);
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#000000');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(doc.getPageCount());
    setResult(null);
  };

  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  });

  const handleApply = async () => {
    if (!buffer) return;
    start(t('progress.addingNumbers'));
    try {
      const doc = await PDFDocument.load(buffer);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const { r, g, b } = hexToRgb(color);
      const margin = 30;

      for (let i = skipFirst; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNum = i - skipFirst + startFrom;
        const text = `${prefix}${pageNum}${suffix}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x: number;
        let y: number;

        const isBottom = position.startsWith('bottom');
        y = isBottom ? margin : height - margin - fontSize;

        if (position.endsWith('center')) x = (width - textWidth) / 2;
        else if (position.endsWith('right')) x = width - margin - textWidth;
        else x = margin;

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(r, g, b) });
        update(Math.round(((i + 1) / pages.length) * 90));
      }

      const bytes = await doc.save();
      finish();
      setResult(bytes.buffer as ArrayBuffer);
      showToast(t('success.pageNumbers'), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  return (
  <>
    <Helmet>
      <title>Add Page Numbers to PDF Free — Online | PDF Studio</title>
      <meta name="description" content="Add page numbers to PDF documents. Choose position, font size, and starting number. Free, no upload, instant download." />
    </Helmet>
    <ToolPageShell
      icon="🔢"
      title={t('tools.pageNumbers.title')}
      description={t('pageNumbers.description')}
    >
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong className="text-gray-800 dark:text-gray-200">{fileName}.pdf</strong> — {pageCount} pages
          </p>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('pageNumbers.position')}</p>
            <div className="grid grid-cols-3 gap-2 max-w-xs">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition ${
                    position === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {p.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t('pageNumbers.startAt')}</label>
              <input type="number" min={1} value={startFrom} onChange={(e) => setStartFrom(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t('pageNumbers.skipFirst')}</label>
              <input type="number" min={0} max={pageCount - 1} value={skipFirst} onChange={(e) => setSkipFirst(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t('pageNumbers.fontSize')}</label>
              <input type="number" min={6} max={36} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t('pageNumbers.color')}</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-gray-300" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t('pageNumbers.prefix')}</label>
              <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder='Page '
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{t('pageNumbers.suffix')}</label>
              <input type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder={` of ${pageCount}`}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
            {t('pageNumbers.preview')}: <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
              {prefix}{startFrom}{suffix}
            </span> → <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
              {prefix}{startFrom + (pageCount - skipFirst - 1)}{suffix}
            </span>
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleApply} disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('pageNumbers.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_numbered.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
