import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { wrap } from 'comlink';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';
import { attachWorkerProgress } from '../../utils/workerProgress';
import type { WatermarkPosition } from '../../types/feature.types';

export default function WatermarkPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#808080');
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();

  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const handleFile = async (files: File[]) => {
    setBuffer(await files[0].arrayBuffer());
    setFileName(files[0].name.replace(/\.pdf$/i, ''));
    setResult(null);
  };

  const handleWatermark = async () => {
    if (!buffer || !text) { showToast(t('errors.enterText'), 'error'); return; }
    start(t('progress.addingWatermark'));
    try {
      const WatermarkWorker = (await import('../../workers/watermark.worker?worker')).default;
      const worker = new WatermarkWorker();
      attachWorkerProgress(worker, (pct) => update(pct, t('progress.addingWatermark')));
      const api = wrap<{ watermark: (opts: object) => Promise<ArrayBuffer> }>(worker);

      const buf = await api.watermark(
        { file: buffer.slice(0), text, fontSize, color: hexToRgb(color), opacity, rotation, position },
      );
      finish();
      setResult(buf);
      showToast(t('success.watermarked'), 'success');
      worker.terminate();
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const positions: WatermarkPosition[] = ['center', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

  return (
  <>
    <Helmet>
      <title>Watermark PDF Free — Add Text Watermark Online | PDF Studio</title>
      <meta name="description" content="Add a custom text watermark to every page of your PDF. Control font, size, opacity, rotation, and position. Free, no upload." />
    </Helmet>
    <ToolPageShell icon="💧" title={t('tools.watermark.title')} description={t('watermark.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('watermark.text')}</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('watermark.position')}</label>
              <select value={position} onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                {positions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('watermark.fontSize')}: {fontSize}px</label>
              <input type="range" min={12} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-indigo-600" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('watermark.opacity')}: {Math.round(opacity * 100)}%</label>
              <input type="range" min={1} max={100} value={Math.round(opacity * 100)} onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full accent-indigo-600" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('watermark.rotation')}: {rotation}°</label>
              <input type="range" min={-180} max={180} value={rotation} onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-indigo-600" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('watermark.color')}</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-gray-300" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800" style={{ height: 120 }}>
            <span className="text-gray-400 text-xs">{t('watermark.preview')}:</span>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span style={{ fontSize: Math.min(fontSize, 40), opacity, color, transform: `rotate(${rotation}deg)`, fontWeight: 'bold' }}>
                {text || 'Watermark'}
              </span>
            </div>
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleWatermark} disabled={progress.active}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('watermark.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_watermarked.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
