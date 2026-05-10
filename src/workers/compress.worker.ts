import { expose } from 'comlink';
import { PDFDocument } from 'pdf-lib';
import type { CompressWorkerAPI } from '../types/worker.types';

const api: CompressWorkerAPI = {
  async compress({ file }) {
    const originalSize = file.byteLength;
    postMessage({ type: 'progress', percent: 10 });

    const src = await PDFDocument.load(file, { ignoreEncryption: true });
    postMessage({ type: 'progress', percent: 30 });

    try {
      const form = src.getForm();
      form.flatten();
    } catch {
      // no form fields — that's fine
    }

    postMessage({ type: 'progress', percent: 60 });

    const compressedBytes = await src.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    postMessage({ type: 'progress', percent: 90 });

    const compressedSize = compressedBytes.byteLength;
    postMessage({ type: 'progress', percent: 100 });

    return {
      buffer: compressedBytes.buffer as ArrayBuffer,
      originalSize,
      compressedSize,
    };
  },
};

expose(api);
