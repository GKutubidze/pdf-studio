import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'kat', label: 'Georgian' },
  { code: 'deu', label: 'German' },
  { code: 'fra', label: 'French' },
  { code: 'spa', label: 'Spanish' },
  { code: 'ita', label: 'Italian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'rus', label: 'Russian' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'jpn', label: 'Japanese' },
];

export default function OcrPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [extractedText, setExtractedText] = useState('');
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(buf);
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(doc.getPageCount());
    setExtractedText('');
  };

  const handleOcr = async () => {
    if (!buffer) return;
    start(t('progress.loadingOcr'));

    try {
      const { createWorker } = await import('tesseract.js');
      update(10, t('progress.initializing'));

      const worker = await createWorker(language, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            update(10 + Math.round(m.progress * 80), t('progress.recognizing'));
          }
        },
      });

      update(20, t('progress.recognizing'));

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();

      const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;

        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
        const { data } = await worker.recognize(blob);
        fullText += `\n--- Page ${i} ---\n${data.text}\n`;
        update(20 + Math.round((i / pdf.numPages) * 70), `${i}/${pdf.numPages}…`);
        page.cleanup();
      }

      await pdf.destroy();
      await worker.terminate();

      setExtractedText(fullText.trim());
      finish();
      showToast(t('success.ocrDone', { count: pageCount }), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'OCR failed', 'error');
    }
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_ocr.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  return (
    <ToolPageShell
      icon="🔍"
      title={t('tools.ocr.title')}
      description={t('ocr.description')}
    >
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong className="text-gray-800 dark:text-gray-200">{fileName}.pdf</strong> — {pageCount} page{pageCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('ocr.language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-64 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            ⚠️ <strong>{t('ocr.warningTitle')}</strong> {t('ocr.warning')}
          </div>

          {progress.active && (
            <ProgressBar percent={progress.percent} message={progress.message} />
          )}

          <button
            onClick={handleOcr}
            disabled={progress.active}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {progress.active ? t('ocr.processing') : t('ocr.button')}
          </button>

          {extractedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('ocr.extractedText')}</p>
                <button
                  onClick={downloadText}
                  className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                >
                  {t('ocr.downloadTxt')}
                </button>
              </div>
              <textarea
                readOnly
                value={extractedText}
                rows={12}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 font-mono text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
