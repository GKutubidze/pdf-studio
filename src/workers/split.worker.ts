import { expose } from 'comlink';
import { PDFDocument } from 'pdf-lib';
import type { SplitWorkerAPI } from '../types/worker.types';
import { everyNSegments } from '../utils/rangeParser';

const api: SplitWorkerAPI = {
  async split({ file, ranges, everyN }) {
    const src = await PDFDocument.load(file);
    const totalPages = src.getPageCount();

    const segments =
      everyN && everyN > 0 ? everyNSegments(everyN, totalPages) : ranges;

    const buffers: ArrayBuffer[] = [];

    for (let i = 0; i < segments.length; i++) {
      const { start, end } = segments[i];
      const doc = await PDFDocument.create();
      const indices: number[] = [];
      for (let p = start - 1; p < end; p++) indices.push(p);
      const pages = await doc.copyPages(src, indices);
      pages.forEach((page) => doc.addPage(page));
      const bytes = await doc.save();
      buffers.push(bytes.buffer as ArrayBuffer);
      postMessage({ type: 'progress', percent: Math.round(((i + 1) / segments.length) * 100) });
    }

    return buffers;
  },
};

expose(api);
