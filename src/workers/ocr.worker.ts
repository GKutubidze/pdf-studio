import { expose } from 'comlink';

const api = {
  async ocr({ file, language }: { file: ArrayBuffer; language: string }): Promise<ArrayBuffer> {
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker(language, 1, {
      logger: () => {},
    });

    await worker.recognize(new Blob([file], { type: 'application/pdf' }));
    await worker.terminate();

    postMessage({ type: 'progress', percent: 100 });
    return file;
  },
};

expose(api);
