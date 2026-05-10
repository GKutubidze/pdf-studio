import { useCallback } from 'react';
import { downloadBuffer } from '../utils/blobUtils';
import JSZip from 'jszip';

export function useDownload() {
  const downloadSingle = useCallback(
    (buffer: ArrayBuffer, fileName: string, mimeType = 'application/pdf') => {
      downloadBuffer(buffer, fileName, mimeType);
    },
    [],
  );

  const downloadMultipleAsZip = useCallback(
    async (files: Array<{ buffer: ArrayBuffer; name: string }>, zipName: string) => {
      const zip = new JSZip();
      for (const { buffer, name } of files) {
        zip.file(name, buffer);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
    [],
  );

  return { downloadSingle, downloadMultipleAsZip };
}
