import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Lazy-loaded feature pages ──────────────────────────────────────────
const Home         = lazy(() => import('./features/Home/index'));
const MergePage    = lazy(() => import('./features/merge/MergePage'));
const SplitPage    = lazy(() => import('./features/split/SplitPage'));
const CompressPage = lazy(() => import('./features/compress/CompressPage'));
const ProtectPage  = lazy(() => import('./features/protect/ProtectPage'));
const UnlockPage   = lazy(() => import('./features/unlock/UnlockPage'));
const WatermarkPage   = lazy(() => import('./features/watermark/WatermarkPage'));
const RotatePage      = lazy(() => import('./features/rotate/RotatePage'));
const OrganizePage    = lazy(() => import('./features/organize/OrganizePage'));
const ImageToPdfPage  = lazy(() => import('./features/imageToPdf/ImageToPdfPage'));
const PdfToImagePage  = lazy(() => import('./features/pdfToImage/PdfToImagePage'));
const AnnotatePage    = lazy(() => import('./features/annotate/AnnotatePage'));
const SignPage         = lazy(() => import('./features/sign/SignPage'));
const OcrPage         = lazy(() => import('./features/ocr/OcrPage'));
const PageNumbersPage = lazy(() => import('./features/pageNumbers/PageNumbersPage'));
const CropPage        = lazy(() => import('./features/crop/CropPage'));
const RepairPage      = lazy(() => import('./features/repair/RepairPage'));

// ── Skeleton loader ────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 animate-pulse">
      <div className="mb-8 flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-48 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-72 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </div>
      <div className="h-48 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '2px dashed var(--bg-border)' }} />
    </div>
  );
}

// ── Route wrapper ──────────────────────────────────────────────────────
function Route({ children }: { children: ReactNode }) {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<SkeletonLoader />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

// ── Router ─────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  { path: '/',             element: <Route><Home /></Route> },
  { path: '/merge',        element: <Route><MergePage /></Route> },
  { path: '/split',        element: <Route><SplitPage /></Route> },
  { path: '/compress',     element: <Route><CompressPage /></Route> },
  { path: '/protect',      element: <Route><ProtectPage /></Route> },
  { path: '/unlock',       element: <Route><UnlockPage /></Route> },
  { path: '/watermark',    element: <Route><WatermarkPage /></Route> },
  { path: '/rotate',       element: <Route><RotatePage /></Route> },
  { path: '/organize',     element: <Route><OrganizePage /></Route> },
  { path: '/image-to-pdf', element: <Route><ImageToPdfPage /></Route> },
  { path: '/pdf-to-image', element: <Route><PdfToImagePage /></Route> },
  { path: '/annotate',     element: <Route><AnnotatePage /></Route> },
  { path: '/sign',         element: <Route><SignPage /></Route> },
  { path: '/ocr',          element: <Route><OcrPage /></Route> },
  { path: '/page-numbers', element: <Route><PageNumbersPage /></Route> },
  { path: '/crop',         element: <Route><CropPage /></Route> },
  { path: '/repair',       element: <Route><RepairPage /></Route> },
  // Legacy routes — redirect old paths
  { path: '/tools/merge',        element: <Route><MergePage /></Route> },
  { path: '/tools/split',        element: <Route><SplitPage /></Route> },
  { path: '/tools/watermark',    element: <Route><WatermarkPage /></Route> },
  { path: '/tools/protect',      element: <Route><ProtectPage /></Route> },
  { path: '/tools/image-to-pdf', element: <Route><ImageToPdfPage /></Route> },
  { path: '/tools/rotate',       element: <Route><RotatePage /></Route> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
