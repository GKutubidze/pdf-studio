import { expose } from 'comlink';
import { PDFDocument } from 'pdf-lib';
import type { MergeWorkerAPI } from '../types/worker.types';

const api: MergeWorkerAPI = {
  async merge({ files }) {
    const merged = await PDFDocument.create();
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const src = await PDFDocument.load(files[i]);
      const indices = src.getPageIndices();
      const pages = await merged.copyPages(src, indices);
      pages.forEach((p) => merged.addPage(p));
      postMessage({ type: 'progress', percent: Math.round(((i + 1) / total) * 90) });
    }

    const bytes = await merged.save();
    postMessage({ type: 'progress', percent: 100 });
    return bytes.buffer as ArrayBuffer;
  },
};

expose(api);
