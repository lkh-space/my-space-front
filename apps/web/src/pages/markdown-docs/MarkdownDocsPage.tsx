import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { DocumentLibraryView } from './views/DocumentLibraryView';
import { MarkdownEditorView } from './views/MarkdownEditorView';
import { MarkdownDetailView } from './views/MarkdownDetailView';
import './styles/markdown-docs.css';

export const MarkdownDocsPage: React.FC = () => {
  return (
    <div className="markdown-docs-page-root flex-1 flex flex-col min-h-0 h-full w-full bg-zinc-950 text-zinc-100">
      <Routes>
        <Route index element={<DocumentLibraryView />} />
        <Route path="new" element={<MarkdownEditorView />} />
        <Route path=":id/edit" element={<MarkdownEditorView />} />
        <Route path=":id" element={<MarkdownDetailView />} />
      </Routes>
    </div>
  );
};

export default MarkdownDocsPage;
