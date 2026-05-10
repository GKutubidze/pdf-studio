import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '../src/features');

const pages = [
  {
    file: 'merge/MergePage.tsx',
    title: 'Merge PDF Free — Combine PDF Files Online | PDF Studio',
    desc: 'Merge multiple PDF files into one document. Drag to reorder pages. Runs in your browser — no uploads, no limits, 100% free and private.',
  },
  {
    file: 'split/SplitPage.tsx',
    title: 'Split PDF Free — Extract Pages Online | PDF Studio',
    desc: 'Split PDF by page ranges, every N pages, or visual selection. Free, unlimited, no file upload needed.',
  },
  {
    file: 'compress/CompressPage.tsx',
    title: 'Compress PDF Free — Reduce File Size Online | PDF Studio',
    desc: 'Compress PDF files without uploading. Choose quality level and see file size reduction. Free, unlimited, and 100% private.',
  },
  {
    file: 'protect/ProtectPage.tsx',
    title: 'Protect PDF Free — Add Password Online | PDF Studio',
    desc: 'Add password protection to your PDF in your browser. User and owner passwords supported. Free, no upload, instant.',
  },
  {
    file: 'unlock/UnlockPage.tsx',
    title: 'Unlock PDF Free — Remove Password Online | PDF Studio',
    desc: 'Remove password protection from a PDF file instantly. Free, no upload, runs entirely in your browser.',
  },
  {
    file: 'watermark/WatermarkPage.tsx',
    title: 'Watermark PDF Free — Add Text Watermark Online | PDF Studio',
    desc: 'Add a custom text watermark to every page of your PDF. Control font, size, opacity, rotation, and position. Free, no upload.',
  },
  {
    file: 'rotate/RotatePage.tsx',
    title: 'Rotate PDF Free — Rotate Pages Online | PDF Studio',
    desc: 'Rotate individual pages or all pages at once. Choose 90°, 180°, or 270°. Free, unlimited, no file upload.',
  },
  {
    file: 'organize/OrganizePage.tsx',
    title: 'Organize PDF Free — Reorder & Delete Pages Online | PDF Studio',
    desc: 'Drag-and-drop to reorder, delete, or rearrange PDF pages. Preview thumbnails included. Free, no upload, 100% private.',
  },
  {
    file: 'imageToPdf/ImageToPdfPage.tsx',
    title: 'Image to PDF Free — Convert JPG/PNG to PDF Online | PDF Studio',
    desc: 'Convert JPG, PNG, WebP, and other images to PDF. Drag to reorder. Runs in your browser — no uploads, no limits.',
  },
  {
    file: 'pdfToImage/PdfToImagePage.tsx',
    title: 'PDF to Image Free — Convert PDF Pages to PNG Online | PDF Studio',
    desc: 'Convert PDF pages to PNG images in your browser. Choose quality and resolution. Free, unlimited, no file upload needed.',
  },
  {
    file: 'annotate/AnnotatePage.tsx',
    title: 'Annotate PDF Free — Draw & Highlight Online | PDF Studio',
    desc: 'Draw, highlight, and annotate PDF files in your browser. Add freehand drawings and shapes. Free, no upload, instant.',
  },
  {
    file: 'sign/SignPage.tsx',
    title: 'Sign PDF Free — Add Signature Online | PDF Studio',
    desc: 'Sign PDF documents with a drawn or typed signature. Drag to position. Free, no upload, 100% private — your signature never leaves your device.',
  },
  {
    file: 'ocr/OcrPage.tsx',
    title: 'OCR PDF Free — Extract Text from PDF Online | PDF Studio',
    desc: 'Extract text from scanned PDFs using optical character recognition. Powered by Tesseract.js. Free, no upload, runs offline.',
  },
  {
    file: 'pageNumbers/PageNumbersPage.tsx',
    title: 'Add Page Numbers to PDF Free — Online | PDF Studio',
    desc: 'Add page numbers to PDF documents. Choose position, font size, and starting number. Free, no upload, instant download.',
  },
  {
    file: 'crop/CropPage.tsx',
    title: 'Crop PDF Free — Set Crop Box Online | PDF Studio',
    desc: 'Crop PDF pages with a visual drag-and-drop editor. Set precise crop margins in points and millimetres. Free, no upload.',
  },
  {
    file: 'repair/RepairPage.tsx',
    title: 'Repair PDF Free — Fix Corrupted PDF Online | PDF Studio',
    desc: 'Recover pages from corrupted or damaged PDF files. Relaxed parsing rescues what it can and reports page-level results. Free, no upload.',
  },
];

const HELMET_IMPORT = "import { Helmet } from 'react-helmet-async';";

for (const { file, title, desc } of pages) {
  const filePath = join(src, file);
  let code = readFileSync(filePath, 'utf8');

  // Skip if already has Helmet
  if (code.includes("react-helmet-async")) {
    console.log('Already has Helmet:', file);
    continue;
  }

  // Add import after the first import line
  code = code.replace(/^(import .+\n)/, `$1${HELMET_IMPORT}\n`);

  // Add Helmet before <ToolPageShell, wrapping with fragment
  const helmet = `  <>
    <Helmet>
      <title>${title}</title>
      <meta name="description" content="${desc}" />
    </Helmet>
    `;

  // The return statement pattern: "return (\n    <ToolPageShell"
  code = code.replace(
    /return \(\s*\n(\s*)(<ToolPageShell)/,
    `return (\n${helmet}$2`
  );

  // Close the fragment before the last closing paren of return
  // Find "  </ToolPageShell>\n  );" and wrap
  code = code.replace(
    /(\s*<\/ToolPageShell>\s*\n\s*\);)/,
    (match) => match.replace('</ToolPageShell>', '</ToolPageShell>\n  </>').replace('\n  );', '\n  );')
  );

  writeFileSync(filePath, code, 'utf8');
  console.log('Updated:', file);
}

console.log('Done!');
