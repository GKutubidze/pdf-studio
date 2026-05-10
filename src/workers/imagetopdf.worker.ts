import { expose } from 'comlink';
import { PDFDocument, PageSizes } from 'pdf-lib';
import type { ImageToPdfWorkerAPI } from '../types/worker.types';

const api: ImageToPdfWorkerAPI = {
  async convert({ images, mimeTypes, pageSize }) {
    const doc = await PDFDocument.create();
    const total = images.length;

    for (let i = 0; i < total; i++) {
      const mime = mimeTypes[i];
      let img;

      if (mime === 'image/png') {
        img = await doc.embedPng(images[i]);
      } else {
        img = await doc.embedJpg(images[i]);
      }

      let pageWidth: number;
      let pageHeight: number;

      if (pageSize === 'a4') {
        [pageWidth, pageHeight] = PageSizes.A4;
      } else if (pageSize === 'letter') {
        [pageWidth, pageHeight] = PageSizes.Letter;
      } else {
        pageWidth = img.width;
        pageHeight = img.height;
      }

      const page = doc.addPage([pageWidth, pageHeight]);
      const scale = Math.min(pageWidth / img.width, pageHeight / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      page.drawImage(img, {
        x: (pageWidth - drawWidth) / 2,
        y: (pageHeight - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });

      postMessage({ type: 'progress', percent: Math.round(((i + 1) / total) * 90) });
    }

    const bytes = await doc.save();
    postMessage({ type: 'progress', percent: 100 });
    return bytes.buffer as ArrayBuffer;
  },
};

expose(api);
