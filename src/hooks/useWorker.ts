import { useEffect, useRef } from 'react'
import { wrap, type Remote } from 'comlink'
import type { PdfWorker } from '../workers/pdf.worker'

export function useWorker(): Remote<PdfWorker> {
  const workerRef = useRef<Worker | null>(null)
  const apiRef = useRef<Remote<PdfWorker> | null>(null)

  if (!workerRef.current) {
    workerRef.current = new Worker(
      new URL('../workers/pdf.worker.ts', import.meta.url),
      { type: 'module' },
    )
    apiRef.current = wrap<PdfWorker>(workerRef.current)
  }

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      apiRef.current = null
    }
  }, [])

  return apiRef.current!
}
