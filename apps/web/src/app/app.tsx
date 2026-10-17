import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider, CurrentUser } from '../entities/auth';
import { ShellLayout } from '../widgets/layout';

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const PdfToolsPage = lazy(() => import('../pages/pdf-tools/PdfToolsPage'));
const DbmlToolsPage = lazy(() => import('../pages/dbml-tools/DbmlToolsPage'));
const MarkdownDocsPage = lazy(() => import('../pages/markdown-docs/MarkdownDocsPage'));
const AiWorkspacePage = lazy(() => import('../pages/ai/AiWorkspacePage'));
const NotFoundPage = lazy(() => import('../pages/not-found/NotFoundPage'));

export interface AppProps {
  initialUser?: CurrentUser | null;
}

const PageLoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '240px',
      height: '100%',
      color: 'var(--on-surface-variant, #c2c6d6)',
      gap: '8px',
      fontSize: '14px',
    }}
    role="status"
    aria-label="페이지 로딩 중"
  >
    <span
      className="material-symbols-outlined"
      style={{
        animation: 'spin 1s linear infinite',
        fontSize: '20px',
      }}
    >
      progress_activity
    </span>
    <span>페이지를 불러오는 중입니다...</span>
  </div>
);

export function App({ initialUser }: AppProps = {}) {
  return (
    <AuthProvider initialUser={initialUser}>
      <Routes>
        <Route path="/" element={<ShellLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="pdf-tools"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <PdfToolsPage />
              </Suspense>
            }
          />
          <Route
            path="dbml-tools"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <DbmlToolsPage />
              </Suspense>
            }
          />
          <Route
            path="docs/*"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <MarkdownDocsPage />
              </Suspense>
            }
          />
          <Route
            path="ai"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AiWorkspacePage />
              </Suspense>
            }
          />
          <Route
            path="ai/*"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AiWorkspacePage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
