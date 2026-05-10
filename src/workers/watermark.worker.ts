import { expose } from 'comlink';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import type { WatermarkWorkerAPI } from '../types/worker.types';

const api: WatermarkWorkerAPI = {
  async watermark({ file, text, fontSize, color, opacity, rotation, position, pageRange }) {
    const doc = await PDFDocument.load(file);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pdfPages = doc.getPages();
    const total = pdfPages.length;

    const startIdx = pageRange ? pageRange.start - 1 : 0;
    const endIdx = pageRange ? pageRange.end : total;

    for (let i = startIdx; i < endIdx; i++) {
      const page = pdfPages[i];
      const { width, height } = page.getSize();

      let x = width / 2;
      let y = height / 2;

      if (position === 'top-left') { x = 50; y = height - 50; }
      else if (position === 'top-center') { x = width / 2; y = height - 50; }
      else if (position === 'top-right') { x = width - 50; y = height - 50; }
      else if (position === 'bottom-left') { x = 50; y = 50; }
      else if (position === 'bottom-center') { x = width / 2; y = 50; }
      else if (position === 'bottom-right') { x = width - 50; y = 50; }

      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: x - textWidth / 2,
        y,
        size: fontSize,
        font,
        color: rgb(color[0] / 255, color[1] / 255, color[2] / 255),
        opacity,
        rotate: degrees(rotation),
      });

      postMessage({ type: 'progress', percent: Math.round(((i - startIdx + 1) / (endIdx - startIdx)) * 90) });
    }

    const bytes = await doc.save();
    postMessage({ type: 'progress', percent: 100 });
    return bytes.buffer as ArrayBuffer;
  },
};

expose(api);
