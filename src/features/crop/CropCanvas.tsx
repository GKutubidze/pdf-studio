import { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

interface PdfBox { x: number; y: number; width: number; height: number }
interface CanvasRect { left: number; top: number; right: number; bottom: number }
interface Dims { w: number; h: number; sx: number; sy: number }

interface Props {
  pdfArrayBuffer: ArrayBuffer;
  pageWidth: number;
  pageHeight: number;
  cropBox: PdfBox;
  onCropChange: (box: PdfBox) => void;
}

// PDF bottom-left origin → canvas top-left origin
function toCanvasRect(box: PdfBox, pageHeight: number, d: Dims): CanvasRect {
  return {
    left:   box.x * d.sx,
    top:    (pageHeight - box.y - box.height) * d.sy,
    right:  (box.x + box.width) * d.sx,
    bottom: (pageHeight - box.y) * d.sy,
  };
}

function toPdfBox(r: CanvasRect, pageHeight: number, d: Dims): PdfBox {
  return {
    x:      r.left / d.sx,
    y:      pageHeight - r.bottom / d.sy,
    width:  (r.right - r.left) / d.sx,
    height: (r.bottom - r.top) / d.sy,
  };
}

const H = 9; // handle size px
const MIN_PX = 12; // min crop dimension px
const PT_TO_MM = 0.352778;

const CURSORS: Record<HandleId, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize', move: 'move',
};

export function CropCanvas({ pdfArrayBuffer, pageWidth: _pageWidth, pageHeight, cropBox, onCropChange }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<Dims>({ w: 0, h: 0, sx: 1, sy: 1 });

  // Keep live refs so event handlers never go stale
  const live = useRef({ cropBox, onCropChange, dims, pageHeight });
  live.current = { cropBox, onCropChange, dims, pageHeight };

  const drag = useRef<{ handle: HandleId; sx: number; sy: number; startRect: CanvasRect } | null>(null);

  // Render PDF page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!canvasRef.current || !wrapperRef.current) return;
      const containerW = (wrapperRef.current.parentElement?.clientWidth ?? 680) - 4;
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer.slice(0)) }).promise;
      const page = await pdf.getPage(1);
      const vp0 = page.getViewport({ scale: 1 });
      const sc = Math.min(containerW / vp0.width, 540 / vp0.height);
      const vp = page.getViewport({ scale: sc });
      if (cancelled) return;
      const canvas = canvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      // Set explicit CSS size = canvas resolution → no CSS scaling, positions are 1:1
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      const d: Dims = { w: vp.width, h: vp.height, sx: vp.width / vp0.width, sy: vp.height / vp0.height };
      setDims(d);
      live.current.dims = d;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
      await pdf.destroy();
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [pdfArrayBuffer]);

  // Global mouse/touch move + up — reads from live.current so deps are stable
  useEffect(() => {
    const getXY = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current!;
      const r = canvas.getBoundingClientRect();
      const src = 'touches' in e ? e.touches[0] : e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    };

    const apply = (mouseX: number, mouseY: number) => {
      if (!drag.current) return;
      const { handle, sx, sy, startRect: sr } = drag.current;
      const { dims: d, onCropChange: cb, pageHeight: pH } = live.current;
      const dx = mouseX - sx;
      const dy = mouseY - sy;
      let { left, top, right, bottom } = sr;
      const { w: W, h: CH } = d;

      if (handle === 'move') {
        const bw = right - left, bh = bottom - top;
        left   = Math.max(0, Math.min(W - bw, left + dx));
        top    = Math.max(0, Math.min(CH - bh, top + dy));
        right  = left + bw;
        bottom = top + bh;
      } else {
        if (handle.includes('w')) left   = Math.max(0,  Math.min(right - MIN_PX,  left + dx));
        if (handle.includes('e')) right  = Math.min(W,  Math.max(left + MIN_PX,   right + dx));
        if (handle.includes('n')) top    = Math.max(0,  Math.min(bottom - MIN_PX, top + dy));
        if (handle.includes('s')) bottom = Math.min(CH, Math.max(top + MIN_PX,    bottom + dy));
      }

      cb(toPdfBox({ left, top, right, bottom }, pH, d));
    };

    const onMove  = (e: MouseEvent)      => { if (drag.current) apply(e.clientX - canvasRef.current!.getBoundingClientRect().left, e.clientY - canvasRef.current!.getBoundingClientRect().top); };
    const onTouch = (e: TouchEvent)      => { if (drag.current) { e.preventDefault(); const p = getXY(e); apply(p.x, p.y); } };
    const onUp    = ()                   => { drag.current = null; };

    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseup',    onUp);
    window.addEventListener('touchmove',  onTouch, { passive: false });
    window.addEventListener('touchend',   onUp);
    return () => {
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseup',    onUp);
      window.removeEventListener('touchmove',  onTouch);
      window.removeEventListener('touchend',   onUp);
    };
  }, []);

  const startDrag = (handle: HandleId, clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    drag.current = {
      handle,
      sx: x,
      sy: y,
      startRect: toCanvasRect(live.current.cropBox, live.current.pageHeight, live.current.dims),
    };
  };

  const rect = dims.w > 0 ? toCanvasRect(cropBox, pageHeight, dims) : null;
  const bw = rect ? rect.right - rect.left : 0;
  const bh = rect ? rect.bottom - rect.top : 0;

  const handles: { id: HandleId; x: number; y: number }[] = rect ? [
    { id: 'nw', x: rect.left,          y: rect.top },
    { id: 'n',  x: rect.left + bw / 2, y: rect.top },
    { id: 'ne', x: rect.right,         y: rect.top },
    { id: 'e',  x: rect.right,         y: rect.top + bh / 2 },
    { id: 'se', x: rect.right,         y: rect.bottom },
    { id: 's',  x: rect.left + bw / 2, y: rect.bottom },
    { id: 'sw', x: rect.left,          y: rect.bottom },
    { id: 'w',  x: rect.left,          y: rect.top + bh / 2 },
  ] : [];

  return (
    <div
      ref={wrapperRef}
      className="relative select-none overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700"
      style={{ display: 'inline-block', maxWidth: '100%' }}
    >
      <canvas ref={canvasRef} className="block" />

      {rect && (
        <>
          {/* Dim mask outside crop area */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute bg-black/45" style={{ top: 0, left: 0, right: 0, height: rect.top }} />
            <div className="absolute bg-black/45" style={{ top: rect.bottom, left: 0, right: 0, bottom: 0 }} />
            <div className="absolute bg-black/45" style={{ top: rect.top, left: 0, width: rect.left, height: bh }} />
            <div className="absolute bg-black/45" style={{ top: rect.top, left: rect.right, right: 0, height: bh }} />
          </div>

          {/* Crop rectangle — drag to move */}
          <div
            className="absolute border-2 border-indigo-500"
            style={{ left: rect.left, top: rect.top, width: bw, height: bh, cursor: 'move', touchAction: 'none' }}
            onMouseDown={(e) => { e.preventDefault(); startDrag('move', e.clientX, e.clientY); }}
            onTouchStart={(e) => { e.preventDefault(); startDrag('move', e.touches[0].clientX, e.touches[0].clientY); }}
          >
            {/* Live dimensions label */}
            <div
              className="pointer-events-none absolute whitespace-nowrap rounded bg-indigo-600/90 px-2 py-0.5 text-xs text-white"
              style={{ top: -28, left: 0 }}
            >
              {Math.round(cropBox.width)} × {Math.round(cropBox.height)} pt
              &nbsp;·&nbsp;
              {(cropBox.width * PT_TO_MM).toFixed(1)} × {(cropBox.height * PT_TO_MM).toFixed(1)} mm
            </div>
            {/* Grid lines */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute border-indigo-400/40" style={{ left: '33.3%', top: 0, bottom: 0, borderLeftWidth: 1 }} />
              <div className="absolute border-indigo-400/40" style={{ left: '66.6%', top: 0, bottom: 0, borderLeftWidth: 1 }} />
              <div className="absolute border-indigo-400/40" style={{ top: '33.3%', left: 0, right: 0, borderTopWidth: 1 }} />
              <div className="absolute border-indigo-400/40" style={{ top: '66.6%', left: 0, right: 0, borderTopWidth: 1 }} />
            </div>
          </div>

          {/* 8 resize handles */}
          {handles.map(({ id, x, y }) => (
            <div
              key={id}
              className="absolute rounded-sm border-2 border-indigo-500 bg-white dark:bg-gray-900"
              style={{
                left: x - H / 2,
                top:  y - H / 2,
                width: H,
                height: H,
                cursor: CURSORS[id],
                touchAction: 'none',
              }}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag(id, e.clientX, e.clientY); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); startDrag(id, e.touches[0].clientX, e.touches[0].clientY); }}
            />
          ))}
        </>
      )}
    </div>
  );
}
