import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';
import { useDownload } from '../../hooks/useDownload';

type DPI = 72 | 150 | 300;
type Format = 'png' | 'jpeg';

export default function PdfToImagePage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [dpi, setDpi] = useState<DPI>(150);
  const [format, setFormat] = useState<Format>('png');
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();
  const { downloadMultipleAsZip, downloadSingle } = useDownload();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(pdf.numPages);
    await pdf.destroy();
  };

  const handleConvert = async () => {
    if (!buffer) return;
    start(t('progress.converting'));
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();

      const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
      const scale = dpi / 72;
      const results: { buffer: ArrayBuffer; name: string }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b!), `image/${format}`, 0.92),
        );
        const arrayBuffer = await blob.arrayBuffer();
        results.push({ buffer: arrayBuffer, name: `${fileName}_page${i}.${format}` });
        update(Math.round((i / pdf.numPages) * 90));
        page.cleanup();
      }

      await pdf.destroy();
      finish();

      if (results.length === 1) {
        downloadSingle(results[0].buffer, results[0].name, `image/${format}`);
      } else {
        await downloadMultipleAsZip(results, `${fileName}_images.zip`);
      }

      showToast(t('success.exportedImages', { count: results.length }), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Conversion failed', 'error');
    }
  };

  return (
    <ToolPageShell icon="📸" title={t('tools.pdfToImage.title')} description={t('pdfToImage.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">
            <strong className="text-gray-800 dark:text-gray-200">{fileName}.pdf</strong> — {pageCount} pages
          </p>

          <div className="flex flex-wrap gap-4">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('pdfToImage.format')}</p>
              <div className="flex gap-2">
                {(['png', 'jpeg'] as Format[]).map((f) => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium uppercase transition ${
                      format === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('pdfToImage.dpi')}</p>
              <div className="flex gap-2">
                {([72, 150, 300] as DPI[]).map((d) => (
                  <button key={d} onClick={() => setDpi(d)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      dpi === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {d} DPI
                  </button>
                ))}
              </div>
            </div>
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <button onClick={handleConvert} disabled={progress.active}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {t('pdfToImage.button', { count: pageCount })}
          </button>
        </div>
      )}
    </ToolPageShell>
  );
}
