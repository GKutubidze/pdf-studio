import { useEffect, useRef } from 'react';

interface PdfPreviewProps {
  arrayBuffer: ArrayBuffer;
  pageNumber?: number;
  width?: number;
  className?: string;
}

export function PdfPreview({ arrayBuffer, pageNumber = 1, width = 200, className = '' }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const canvas = canvasRef.current;
      if (!canvas || !arrayBuffer) return;

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
      const pdf = await loadingTask.promise;
      if (cancelled) { pdf.destroy(); return; }

      const page = await pdf.getPage(pageNumber);
      if (cancelled) { page.cleanup(); pdf.destroy(); return; }

      const viewport = page.getViewport({ scale: 1 });
      const scale = width / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({
        canvasContext: canvas.getContext('2d')!,
        viewport: scaledViewport,
      }).promise;

      page.cleanup();
      pdf.destroy();
    }

    render().catch(console.error);
    return () => { cancelled = true; };
  }, [arrayBuffer, pageNumber, width]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded shadow ${className}`}
      style={{ maxWidth: '100%' }}
    />
  );
}
