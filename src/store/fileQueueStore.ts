import { create } from 'zustand';
import type { QueueFile } from '../types/pdf.types';

interface FileQueueState {
  files: QueueFile[];
  addFiles: (files: QueueFile[]) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, patch: Partial<QueueFile>) => void;
  clearFiles: () => void;
  reorderFiles: (newOrder: QueueFile[]) => void;
}

export const useFileQueueStore = create<FileQueueState>((set) => ({
  files: [],

  addFiles: (files) =>
    set((state) => ({ files: [...state.files, ...files] })),

  removeFile: (id) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== id) })),

  updateFile: (id, patch) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),

  clearFiles: () => set({ files: [] }),

  reorderFiles: (newOrder) => set({ files: newOrder }),
}));
