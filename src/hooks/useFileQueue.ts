import { useCallback } from 'react'
import { useFileQueueContext } from '../context/FileQueueContext'
import type { QueuedFile } from '../types'

function fileToQueued(file: File): QueuedFile {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
    file,
    name: file.name,
    size: file.size,
    status: 'idle',
  }
}

export function useFileQueue() {
  const ctx = useFileQueueContext()

  const enqueue = useCallback(
    (files: File[]) => {
      ctx.addFiles(files.map(fileToQueued))
    },
    [ctx],
  )

  return { ...ctx, enqueue }
}
