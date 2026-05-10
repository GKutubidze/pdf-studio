import { expose } from 'comlink'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import type {
  MergeOptions,
  SplitOptions,
  WatermarkOptions,
  ProtectOptions,
  RotateOptions,
  ImageToPdfOptions,
} from '../types'

async function mergePdfs(options: MergeOptions): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (const buf of options.files) {
    const doc = await PDFDocument.load(buf)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }
  return merged.save()
}

async function splitPdf(options: SplitOptions): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(options.file)
  const results: Uint8Array[] = []
  for (const range of options.ranges) {
    const out = await PDFDocument.create()
    const indices = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start + i,
    )
    const pages = await out.copyPages(src, indices)
    pages.forEach((p) => out.addPage(p))
    results.push(await out.save())
  }
  return results
}

async function addWatermark(options: WatermarkOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(options.file)
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const [r, g, b] = options.color
  const pages = doc.getPages()
  for (const page of pages) {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize)
    page.drawText(options.text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
      opacity: options.opacity,
      rotate: degrees(options.rotation),
    })
  }
  return doc.save()
}

async function protectPdf(options: ProtectOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(options.file)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return doc.save({
    userPassword: options.userPassword,
    ownerPassword: options.ownerPassword ?? options.userPassword + '_owner',
  } as any)
}

async function rotatePdf(options: RotateOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(options.file)
  const pages = doc.getPages()
  const legacyOpts = options as unknown as { pageIndices: number[]; degrees: number }
  for (const idx of legacyOpts.pageIndices ?? []) {
    const page = pages[idx]
    if (page) {
      const current = page.getRotation().angle
      page.setRotation(degrees((current + legacyOpts.degrees) % 360))
    }
  }
  return doc.save()
}

async function imagesToPdf(options: ImageToPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < options.images.length; i++) {
    const buf = options.images[i]
    const mime = options.mimeTypes[i]
    let img
    if (mime === 'image/png') {
      img = await doc.embedPng(buf)
    } else {
      img = await doc.embedJpg(buf)
    }
    const page = doc.addPage()
    if (options.fitToPage) {
      const { width, height } = page.getSize()
      const scaled = img.scaleToFit(width, height)
      page.drawImage(img, {
        x: (width - scaled.width) / 2,
        y: (height - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      })
    } else {
      page.setSize(img.width, img.height)
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    }
  }
  return doc.save()
}

const worker = {
  mergePdfs,
  splitPdf,
  addWatermark,
  protectPdf,
  rotatePdf,
  imagesToPdf,
}

expose(worker)

export type PdfWorker = typeof worker
