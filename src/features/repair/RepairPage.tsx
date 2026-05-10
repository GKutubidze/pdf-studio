import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';

interface RepairReport {
  totalAttempted: number;
  recovered: number;
  failed: number[];
}

export default function RepairPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const [report, setReport] = useState<RepairReport | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [repairedSize, setRepairedSize] = useState(0);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const fmtSize = (bytes: number) => {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleFile = (files: File[]) => {
    const f = files[0];
    setOriginalSize(f.size);
    f.arrayBuffer().then((buf) => {
      setBuffer(buf);
      setFileName(f.name.replace(/\.pdf$/i, ''));
      setResult(null);
      setReport(null);
      setRepairedSize(0);
    });
  };

  const handleRepair = async () => {
    if (!buffer) return;
    start(t('progress.repairing'));

    try {
      update(20, t('progress.loadingStructure'));
      let srcDoc: PDFDocument;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        srcDoc = await PDFDocument.load(buffer, {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
        } as any);
      } catch {
        srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      }

      update(50, t('progress.copyingPages'));
      const totalPages = srcDoc.getPageCount();
      const dst = await PDFDocument.create();
      const failed: number[] = [];
      let recovered = 0;

      for (let i = 0; i < totalPages; i++) {
        try {
          const [copied] = await dst.copyPages(srcDoc, [i]);
          dst.addPage(copied);
          recovered++;
        } catch {
          failed.push(i + 1);
          const blank = dst.addPage([595, 842]);
          blank.drawText(`[Page ${i + 1} could not be recovered]`, { x: 50, y: 400, size: 12 });
        }
        update(50 + Math.round(((i + 1) / totalPages) * 40));
      }

      const bytes = await dst.save();
      finish();
      setResult(bytes.buffer as ArrayBuffer);
      setRepairedSize(bytes.byteLength);
      setReport({ totalAttempted: totalPages, recovered, failed });
      showToast(t('success.repaired', { recovered, total: totalPages }), recovered > 0 ? 'success' : 'error');
    } catch (err) {
      reset();
      showToast(
        err instanceof Error
          ? `Could not parse this PDF: ${err.message}`
          : 'Repair failed — the file may be too severely corrupted.',
        'error',
      );
    }
  };

  return (
    <ToolPageShell
      icon="🔧"
      title={t('tools.repair.title')}
      description={t('repair.description')}
    >
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
        <strong className="block mb-2">{t('repair.howTitle')}</strong>
        <ul className="space-y-1 list-disc list-inside">
          <li>{t('repair.bullet1')}</li>
          <li>{t('repair.bullet2')}</li>
          <li>{t('repair.bullet3')}</li>
          <li>{t('repair.bullet4')}</li>
        </ul>
      </div>

      <FileUploader
        onFiles={handleFile}
        multiple={false}
        labelKey="uploader.dropDamaged"
        sublabelKey="uploader.dropDamagedSub"
      />

      {buffer && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            File loaded: <strong className="text-gray-800 dark:text-gray-200">{fileName}.pdf</strong>
          </p>

          {progress.active && (
            <ProgressBar percent={progress.percent} message={progress.message} />
          )}

          {report && (
            <div className={`rounded-xl border p-4 ${
              report.failed.length === 0
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            }`}>
              <p className={`font-semibold ${report.failed.length === 0 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                ✅ {t('repair.report')}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="text-gray-700 dark:text-gray-300">
                  {t('repair.recovered', { count: report.recovered, total: report.totalAttempted })}
                </li>
                {repairedSize > 0 && (
                  <li className="text-gray-700 dark:text-gray-300">
                    {t('repair.fileSize')}: {fmtSize(originalSize)} → {fmtSize(repairedSize)}
                  </li>
                )}
                {report.failed.length > 0 && (
                  <li className="text-red-600 dark:text-red-400">
                    {t('repair.failed', { pages: report.failed.join(', ') })}
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleRepair}
              disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {progress.active ? t('repair.repairing') : t('repair.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_repaired.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
