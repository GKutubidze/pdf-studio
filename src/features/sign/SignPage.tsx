import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument } from 'pdf-lib';
import { useTranslation } from 'react-i18next';
import { ToolPageShell } from '../../components/ToolPageShell';
import { FileUploader } from '../../components/FileUploader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton } from '../../components/DownloadButton';
import { useToast } from '../../components/Toast';
import { useProgress } from '../../hooks/useProgress';

type SignMode = 'draw' | 'type' | 'upload';

export default function SignPage() {
  const { t } = useTranslation();
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<SignMode>('draw');
  const [typedText, setTypedText] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const [sigX, setSigX] = useState(50);
  const [sigY, setSigY] = useState(50);
  const [sigWidth, setSigWidth] = useState(200);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { progress, start, update, finish, reset } = useProgress();
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const padRef = useRef<any>(null);

  useEffect(() => {
    if (mode !== 'draw' || !canvasRef.current) return;
    import('signature_pad').then(({ default: SignaturePad }) => {
      padRef.current = new SignaturePad(canvasRef.current!, {
        backgroundColor: 'rgba(255,255,255,0)',
        penColor: '#000000',
      });
    });
    return () => { padRef.current?.off(); };
  }, [mode]);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    setBuffer(buf);
    setFileName(f.name.replace(/\.pdf$/i, ''));
    setPageCount(doc.getPageCount());
    setResult(null);
  };

  const captureSignature = () => {
    if (mode === 'draw') {
      if (!padRef.current || padRef.current.isEmpty()) {
        showToast(t('errors.signFirst'), 'error');
        return;
      }
      setSignatureDataUrl(padRef.current.toDataURL('image/png'));
    } else if (mode === 'type') {
      if (!typedText.trim()) { showToast(t('errors.signFirst'), 'error'); return; }
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'transparent';
      ctx.font = `italic 48px Georgia, serif`;
      ctx.fillStyle = '#1a1a8c';
      ctx.fillText(typedText, 10, 70);
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
    showToast(t('success.signatureReady'), 'success');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setSignatureDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSign = async () => {
    if (!buffer || !signatureDataUrl) {
      showToast(t('errors.signFirst'), 'error');
      return;
    }
    start(t('progress.embedding'));
    try {
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPages();
      const page = pages[pageIndex];
      const { height } = page.getSize();

      const resp = await fetch(signatureDataUrl);
      const imgBuf = await resp.arrayBuffer();
      const img = await doc.embedPng(imgBuf);
      const aspect = img.height / img.width;

      page.drawImage(img, {
        x: sigX,
        y: height - sigY - sigWidth * aspect,
        width: sigWidth,
        height: sigWidth * aspect,
      });

      update(80);
      const bytes = await doc.save();
      finish();
      setResult(bytes.buffer as ArrayBuffer);
      showToast(t('success.signed'), 'success');
    } catch (err) {
      reset();
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const modeLabels: Record<SignMode, string> = {
    draw: t('sign.modeDraw'),
    type: t('sign.modeType'),
    upload: t('sign.modeUpload'),
  };

  return (
  <>
    <Helmet>
      <title>Sign PDF Free — Add Signature Online | PDF Studio</title>
      <meta name="description" content="Sign PDF documents with a drawn or typed signature. Drag to position. Free, no upload, 100% private — your signature never leaves your device." />
    </Helmet>
    <ToolPageShell icon="✍️" title={t('tools.sign.title')} description={t('sign.description')}>
      <FileUploader onFiles={handleFile} multiple={false} />

      {buffer && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            {(['draw', 'type', 'upload'] as SignMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {mode === 'draw' && (
            <div>
              <p className="mb-1 text-sm text-gray-500">{t('sign.drawHint')}</p>
              <canvas ref={canvasRef} width={400} height={150}
                className="rounded-xl border-2 border-dashed border-gray-300 bg-white cursor-crosshair dark:border-gray-600 dark:bg-gray-800" />
              <div className="mt-2 flex gap-2">
                <button onClick={() => padRef.current?.clear()}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-700">
                  {t('buttons.clear')}
                </button>
                <button onClick={captureSignature}
                  className="rounded-lg bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600">
                  {t('buttons.useSignature')}
                </button>
              </div>
            </div>
          )}

          {mode === 'type' && (
            <div>
              <input type="text" value={typedText} onChange={(e) => setTypedText(e.target.value)}
                placeholder={t('sign.typePlaceholder')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-xl italic text-blue-900 focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-blue-300"
                style={{ fontFamily: 'Georgia, serif' }} />
              <button onClick={captureSignature}
                className="mt-2 rounded-lg bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600">
                {t('buttons.useSignature')}
              </button>
            </div>
          )}

          {mode === 'upload' && (
            <div>
              <input type="file" accept="image/*" onChange={handleImageUpload}
                className="block text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100" />
            </div>
          )}

          {signatureDataUrl && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-400">{t('sign.signatureReady')}</p>
              <img src={signatureDataUrl} alt="Signature" className="max-h-16 rounded" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs text-gray-500">{t('sign.page')}</label>
              <input type="number" min={1} max={pageCount} value={pageIndex + 1}
                onChange={(e) => setPageIndex(Number(e.target.value) - 1)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('sign.xPos')}</label>
              <input type="number" value={sigX} onChange={(e) => setSigX(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('sign.yPos')}</label>
              <input type="number" value={sigY} onChange={(e) => setSigY(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800" />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t('sign.width')}</label>
              <input type="number" min={50} max={400} value={sigWidth} onChange={(e) => setSigWidth(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800" />
            </div>
          </div>

          {progress.active && <ProgressBar percent={progress.percent} message={progress.message} />}

          <div className="flex items-center gap-4">
            <button onClick={handleSign} disabled={progress.active || !signatureDataUrl}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('sign.button')}
            </button>
            <DownloadButton buffer={result} fileName={`${fileName}_signed.pdf`} />
          </div>
        </div>
      )}
    </ToolPageShell>
  </>
  );
}
