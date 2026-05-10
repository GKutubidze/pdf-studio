import { expose } from 'comlink';
import { PDFDocument } from 'pdf-lib';
import type { ProtectWorkerAPI } from '../types/worker.types';

const api: ProtectWorkerAPI = {
  async protect({ file, userPassword, ownerPassword }) {
    postMessage({ type: 'progress', percent: 20 });
    const src = await PDFDocument.load(file);
    postMessage({ type: 'progress', percent: 60 });
    // pdf-lib SaveOptions includes userPassword/ownerPassword at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bytes = await src.save({ userPassword, ownerPassword: ownerPassword || userPassword } as any);
    postMessage({ type: 'progress', percent: 100 });
    return bytes.buffer as ArrayBuffer;
  },

  async unlock({ file, password }) {
    postMessage({ type: 'progress', percent: 20 });
    let src: PDFDocument;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      src = await PDFDocument.load(file, { password } as any);
    } catch {
      throw new Error('Wrong password or file is not encrypted.');
    }
    postMessage({ type: 'progress', percent: 60 });
    const bytes = await src.save();
    postMessage({ type: 'progress', percent: 100 });
    return bytes.buffer as ArrayBuffer;
  },
};

expose(api);
