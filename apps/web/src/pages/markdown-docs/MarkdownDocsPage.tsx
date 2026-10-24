import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import './styles/markdown-docs.css';

const DocumentLibraryView = lazy(() => import('./views/DocumentLibraryView'));
const MarkdownEditorView = lazy(() => import('./views/MarkdownEditorView'));
const MarkdownDetailView = lazy(() => import('./views/MarkdownDetailView'));

const SubViewFallback: React.FC = () => (
  <div
    className="flex-1 flex items-center justify-center p-12 text-label-sm font-label-sm text-outline"
    role="status"
    aria-label="문서 뷰 로딩 중"
  >
    <span className="material-symbols-outlined text-xl animate-spin mr-2">
      progress_activity
    </span>
    <span>워크스페이스를 불러오는 중입니다...</span>
  </div>
);

export const MarkdownDocsPage: React.FC = () => {
  return (
    <div className="markdown-docs-page-root flex-1 flex flex-col min-h-0 h-full w-full bg-zinc-950 text-zinc-100">
      <Suspense fallback={<SubViewFallback />}>
        <Routes>
          <Route index element={<DocumentLibraryView />} />
          <Route path="new" element={<MarkdownEditorView />} />
          <Route path=":id/edit" element={<MarkdownEditorView />} />
          <Route path=":id" element={<MarkdownDetailView />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default MarkdownDocsPage;
