# PDF Studio

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pdf--studio--eta.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://pdf-studio-eta.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/GKutubidze/pdf-studio?style=for-the-badge&logo=github)](https://github.com/GKutubidze/pdf-studio/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2018-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)

A free, unlimited, privacy-first PDF toolkit that runs entirely in your browser. No uploads. No server. No sign-up.

## 🌐 Live Demo

**[https://pdf-studio-eta.vercel.app](https://pdf-studio-eta.vercel.app)**

## ✨ Features

16 fully client-side PDF tools — all processing happens locally in a Web Worker:

| Tool | Description |
|------|-------------|
| 🔀 Merge PDF | Combine multiple PDFs into one. Drag to reorder. |
| ✂️ Split PDF | Split by page ranges, every N pages, or visual page picker. |
| 🗜️ Compress PDF | Reduce file size with High / Medium / Low quality modes. |
| 🔐 Protect PDF | Add open & owner passwords with AES encryption. |
| 🔓 Unlock PDF | Remove password protection from a PDF. |
| 💧 Watermark PDF | Stamp text watermarks with custom font, opacity, and angle. |
| 🔄 Rotate PDF | Rotate individual or all pages 90°, 180°, or 270°. |
| 📑 Organize Pages | Reorder, delete, or extract pages from a PDF. |
| 🖼️ Image → PDF | Convert JPG, PNG, WebP images into a single PDF. |
| 📷 PDF → Image | Export each page as PNG or JPG at 72, 150, or 300 DPI. |
| ✏️ Annotate PDF | Add text boxes, shapes, and highlights. Undo/redo stack. |
| ✍️ Sign PDF | Draw, type, or upload a signature and place it on any page. |
| 🔍 OCR PDF | AI-powered text recognition from scanned pages. 10+ languages. |
| 🔢 Add Page Numbers | Stamp page numbers with full control over position and style. |
| ✂️ Crop PDF | Set crop margins to trim visible area on any page range. |
| 🔧 Repair PDF | Recover pages from corrupted or damaged PDF files. |

## 🔒 Privacy First

Every PDF operation runs in a **Web Worker** inside your browser using WebAssembly.

- ✅ No file uploads — your files never leave your device
- ✅ No tracking or analytics
- ✅ No sign-up or account required
- ✅ Works offline after first load

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | Frontend framework |
| Vite | Build tool & dev server |
| pdf-lib | PDF manipulation (merge, split, annotate, …) |
| pdfjs-dist | PDF rendering & thumbnail generation |
| Comlink + Web Workers | Off-thread processing — UI stays responsive |
| Tailwind CSS | Styling |
| Tesseract.js | OCR engine |
| i18next | Internationalisation (EN / KA / RU) |
| Vercel | Deployment |

## 🚀 Getting Started

```bash
git clone https://github.com/GKutubidze/pdf-studio.git
cd pdf-studio
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Build

```bash
npm run build
```

Output is placed in `./dist`. Preview the production build with:

```bash
npm run preview
```

## 🌍 Languages

| Language | Code |
|---|---|
| English | `en` |
| ქართული (Georgian) | `ka` |
| Русский (Russian) | `ru` |

Language is auto-detected from the browser and persisted in `localStorage`.

## 📄 License

[MIT License](LICENSE) — free to use, modify, and distribute.
