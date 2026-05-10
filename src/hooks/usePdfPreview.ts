import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export function usePdfPreview(file: File | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setPageCount(0)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    async function render() {
      setLoading(true)
      const arrayBuffer = await file!.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      if (cancelled) return
      setPageCount(pdf.numPages)
      const page = await pdf.getPage(1)
      if (cancelled) return
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport }).promise
      if (cancelled) return
      canvas.toBlob((blob) => {
        if (!blob || cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
        setLoading(false)
      }, 'image/png')
    }

    render().catch(() => setLoading(false))

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return { previewUrl, pageCount, loading }
}
