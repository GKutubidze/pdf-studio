import { expose } from 'comlink';
import { PDFDocument, degrees } from 'pdf-lib';
import type { RotateWorkerAPI } from '../types/worker.types';

const api: RotateWorkerAPI = {
  async rotate({ file, pages }) {
    const doc = await PDFDocument.load(file);
    postMessage({ type: 'progress', percent: 20 });

    const pdfPages = doc.getPages();
    const map = new Map(pages.map((p) => [p.pageIndex, p.degrees]));

    pdfPages.forEach((page, idx) => {
      if (map.has(idx)) {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + (map.get(idx) ?? 90)) % 360));
      }
    });

    postMessage({ type: 'progress', percent: 80 });
    const bytes = await doc.save();
    postMessage({ type: 'progress', percent: 100 });
    return bytes.buffer as ArrayBuffer;
  },
};

expose(api);
