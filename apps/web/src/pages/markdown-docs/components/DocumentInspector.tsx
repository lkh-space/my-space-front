import React from 'react';
import { DocumentDetail } from '../../../entities/markdown';

interface DocumentInspectorProps {
  document: DocumentDetail | null;
  onEdit: (id: string) => void;
  onRead: (id: string) => void;
  onExportPdf: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DocumentInspector: React.FC<DocumentInspectorProps> = ({
  document,
  onEdit,
  onRead,
  onExportPdf,
  onDelete,
}) => {
  if (!document) {
    return (
      <aside className="w-72 flex-shrink-0 border-l border-outline-variant bg-surface-container-low flex flex-col items-center justify-center p-6 text-center text-label-sm font-label-sm text-outline">
        <span className="material-symbols-outlined text-3xl text-outline mb-2">
          article
        </span>
        <p>문서를 선택하면 상세 속성과 메타데이터가 표시됩니다.</p>
      </aside>
    );
  }

  // 간단한 통계 계산
  const wordCount = document.content.trim()
    ? document.content.trim().split(/\s+/).length
    : 0;
  const charCount = document.content.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
  const byteSize = new Blob([document.content]).size;
  const sizeKb = (byteSize / 1024).toFixed(1);

  // 미니 TOC 추출 (H1, H2, H3)
  const tocMatches = Array.from(document.content.matchAll(/^(#{1,3})\s+(.+)$/gm)).slice(0, 5);

  return (
    <aside className="w-72 flex-shrink-0 border-l border-outline-variant bg-surface-container-low flex flex-col justify-between overflow-y-auto">
      <div className="p-4 flex flex-col gap-4">
        {/* Quick Details Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[16px]">
              info
            </span>
            <span className="text-label-sm font-label-sm uppercase tracking-wider text-outline font-medium">
              Document Inspector
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-label-sm font-label-sm text-outline border border-outline-variant">
            v{document.currentVersion}
          </span>
        </div>

        {/* Title & Path */}
        <div className="flex flex-col gap-1">
          <span className="text-label-sm font-label-sm text-outline">Title</span>
          <h4 className="text-headline-sm font-headline-sm font-medium text-on-surface leading-snug line-clamp-2">
            {document.title}
          </h4>
          <span className="text-label-sm font-label-sm text-primary truncate mt-0.5">
            {document.folderId ? `folder:${document.folderId}` : 'Root / Uncategorized'}
          </span>
        </div>

        {/* Bento Metrics Tiles */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded bg-surface-container border border-outline-variant flex flex-col">
            <span className="text-label-sm font-label-sm text-outline">Words</span>
            <span className="text-base font-bold font-mono text-on-surface mt-0.5">
              {wordCount.toLocaleString()}
            </span>
            <span className="text-[9px] text-outline font-mono mt-0.5">
              ~{charCount.toLocaleString()} chars
            </span>
          </div>

          <div className="p-2.5 rounded bg-surface-container border border-outline-variant flex flex-col">
            <span className="text-label-sm font-label-sm text-outline">Reading Time</span>
            <span className="text-base font-bold font-mono text-on-surface mt-0.5">
              {readingTimeMin}m
            </span>
            <span className="text-[9px] text-outline font-mono mt-0.5">200 wpm avg</span>
          </div>

          <div className="p-2.5 rounded bg-surface-container border border-outline-variant flex flex-col">
            <span className="text-label-sm font-label-sm text-outline">Version</span>
            <span className="text-base font-bold font-mono text-secondary mt-0.5">
              v{document.currentVersion}
            </span>
            <span className="text-[9px] text-outline font-mono mt-0.5">MinIO synced</span>
          </div>

          <div className="p-2.5 rounded bg-surface-container border border-outline-variant flex flex-col">
            <span className="text-label-sm font-label-sm text-outline">Storage Size</span>
            <span className="text-base font-bold font-mono text-on-surface mt-0.5">
              {sizeKb} KB
            </span>
            <span className="text-[9px] text-outline font-mono mt-0.5">{byteSize} bytes</span>
          </div>
        </div>

        {/* Metadata List */}
        <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant text-label-sm font-label-sm">
          <div className="flex justify-between items-center">
            <span className="text-outline">Created</span>
            <span className="text-on-surface font-mono">
              {new Date(document.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-outline">Last Modified</span>
            <span className="text-on-surface font-mono">
              {new Date(document.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-outline">Format</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface font-mono text-[10px]">
              CommonMark / GFM
            </span>
          </div>
        </div>

        {/* Applied Tags */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant">
          <span className="text-label-sm font-label-sm text-outline">Applied Tags</span>
          <div className="flex flex-wrap gap-1">
            {document.tags.length === 0 ? (
              <span className="text-outline text-xs">지정된 태그 없음</span>
            ) : (
              document.tags.map((t: string) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container border border-outline-variant text-primary"
                >
                  #{t.replace(/^#/, '')}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Mini Document Outline (TOC) */}
        {tocMatches.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant">
            <span className="text-label-sm font-label-sm text-outline">Document Outline</span>
            <div className="flex flex-col space-y-1 text-body-sm font-body-sm text-on-surface-variant">
              {tocMatches.map((match, i) => {
                const depth = match[1].length;
                const headingText = match[2];
                return (
                  <div
                    key={i}
                    className="truncate hover:text-primary transition-colors cursor-pointer"
                    style={{ paddingLeft: `${(depth - 1) * 8}px` }}
                  >
                    • {headingText}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3 border-t border-outline-variant bg-surface-container-lowest/60 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(document.id)}
          className="w-full h-8 flex items-center justify-center gap-1.5 bg-on-background hover:bg-surface-bright text-surface hover:text-on-surface font-medium rounded text-label-md font-label-md transition-colors shadow-none"
        >
          <span className="material-symbols-outlined text-[15px]">edit_note</span>
          <span>수정하기 (Edit Document)</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onRead(document.id)}
            className="h-8 flex items-center justify-center gap-1 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface rounded text-label-sm font-label-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            <span>Read Post</span>
          </button>
          <button
            type="button"
            onClick={() => onExportPdf(document.id)}
            className="h-8 flex items-center justify-center gap-1 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface rounded text-label-sm font-label-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[14px] text-error">
              picture_as_pdf
            </span>
            <span>Export PDF</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onDelete(document.id)}
          className="w-full h-7 flex items-center justify-center gap-1 text-error/80 hover:text-error hover:bg-surface-container-high rounded text-label-sm font-label-sm transition-colors mt-0.5"
        >
          <span className="material-symbols-outlined text-[13px]">delete</span>
          <span>Delete Document</span>
        </button>
      </div>
    </aside>
  );
};
