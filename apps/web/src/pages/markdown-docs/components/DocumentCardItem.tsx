import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import { DocumentSummary } from '../../../entities/markdown';

interface DocumentCardItemProps {
  doc: DocumentSummary;
  isSelected: boolean;
  snippet: string;
  wordCountLabel: string;
  onSelect: (id: string) => void;
}

export const DocumentCardItem: React.FC<DocumentCardItemProps> = React.memo(
  ({ doc, isSelected, snippet, wordCountLabel, onSelect }) => {
    const { t } = useTranslation();
    return (
      <div
        onClick={() => onSelect(doc.id)}
        className={`group relative rounded border p-3 cursor-pointer transition-colors ${
          isSelected
            ? 'border-primary/50 bg-surface-container ring-1 ring-primary/20'
            : 'border-outline-variant bg-surface-container hover:border-outline'
        }`}
      >
        {/* Card Top: Title, Folder, Timestamp */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
              article
            </span>
            <h3 className="text-headline-sm font-headline-sm text-on-surface font-medium truncate">
              {doc.title || 'Untitled Document'}
            </h3>
            {/* Folder Path Badge */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-label-sm font-label-sm text-outline flex-shrink-0">
              <span className="material-symbols-outlined text-[12px]">folder</span>
              <span>Documents / {doc.folderName || 'Architecture'}</span>
            </span>
          </div>

          {/* Star & Timestamp */}
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-outline flex-shrink-0">
            <span className="material-symbols-outlined text-[14px] text-tertiary">
              star
            </span>
            <span>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* 2-line snippet preview */}
        <p className="text-body-sm font-body-sm text-on-surface-variant line-clamp-2 mb-2.5 font-sans pl-6">
          {snippet}
        </p>

        {/* Card Footer: Tags & Monospace Metadata */}
        <div className="flex items-center justify-between pl-6 text-label-sm font-label-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.2 rounded bg-surface-container-high border border-outline-variant text-primary font-label-sm"
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
            {doc.tags.length === 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant text-outline text-label-sm font-label-sm">
                <span className="material-symbols-outlined text-[11px] text-outline">label_off</span>
                <span>{t('markdownDocs.common.untagged')}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-outline font-mono">
            <span>{wordCountLabel}</span>
            <span>•</span>
            <span className="text-on-surface-variant">v{doc.currentVersion} (HEAD)</span>
            <span>•</span>
            <span className="text-secondary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              ACTIVE WORKSPACE
            </span>
          </div>
        </div>
      </div>
    );
  },
);
