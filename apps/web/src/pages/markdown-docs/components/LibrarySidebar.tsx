import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import { FolderTreeNode, TagItem } from '../../../entities/markdown';
import { FolderTree } from '../../../features/markdown/folder/FolderTree';

interface LibrarySidebarProps {
  folders: FolderTreeNode[];
  tags: TagItem[];
  selectedFolderId: string | null | undefined;
  selectedTag: string | null;
  documentCount: number;
  untaggedCount?: number;
  onSelectFolder: (folderId: string | null) => void;
  onSelectTag: (tagName: string | null) => void;
  onOpenCreateFolderModal: (parentId?: string | null) => void;
  onOpenEditFolderModal: (folder: FolderTreeNode) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = React.memo(
  ({
    folders,
    tags,
    selectedFolderId,
    selectedTag,
    documentCount,
    untaggedCount = 0,
    onSelectFolder,
    onSelectTag,
    onOpenCreateFolderModal,
    onOpenEditFolderModal,
    onDeleteFolder,
  }) => {
    const { t } = useTranslation();

    return (
      <aside className="w-64 flex-shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col justify-between overflow-y-auto">
        <div className="p-3 flex flex-col gap-4">
          {/* File System Section */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">
                File System
              </span>
              <button
                type="button"
                className="text-outline hover:text-on-surface p-0.5 rounded hover:bg-surface-container transition-colors"
                title={t('markdownDocs.sidebar.newFolderTitle')}
                onClick={() => onOpenCreateFolderModal(null)}
              >
                <span className="material-symbols-outlined text-[14px]">
                  create_new_folder
                </span>
              </button>
            </div>

            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onOpenCreateModal={onOpenCreateFolderModal}
              onOpenEditModal={onOpenEditFolderModal}
              onDeleteFolder={onDeleteFolder}
            />
          </div>

          {/* Tags Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant">
            <div className="flex items-center justify-between px-1">
              <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">
                Tags
              </span>
              <span className="text-label-sm font-label-sm text-outline">
                {tags.filter((t) => t.documentCount > 0 && t.name !== '__untagged__').length + (untaggedCount > 0 ? 1 : 0)} Filterable
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {/* 미등록(Untagged) 태그 필터 뱃지 버튼 */}
              {(() => {
                const isUntaggedActive = selectedTag === '__untagged__';
                return (
                  <button
                    type="button"
                    onClick={() => onSelectTag(isUntaggedActive ? null : '__untagged__')}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm transition-colors ${
                      isUntaggedActive
                        ? 'bg-primary/10 border border-primary/40 text-primary font-medium'
                        : 'bg-surface-container border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                    title="태그가 등록되지 않은 문서 필터링"
                  >
                    <span className="material-symbols-outlined text-[11px]">label_off</span>
                    <span>{t('markdownDocs.common.untagged')}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                        isUntaggedActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-outline bg-surface-container-high'
                      }`}
                    >
                      {untaggedCount}
                    </span>
                  </button>
                );
              })()}

              {/* 등록된 일반 태그 목록 */}
              {tags
                .filter((t) => t.documentCount > 0 && t.name !== '__untagged__')
                .map((t) => {
                  const isTagActive = selectedTag === t.name;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTag(isTagActive ? null : t.name)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm transition-colors ${
                        isTagActive
                          ? 'bg-primary/10 border border-primary/40 text-primary font-medium'
                          : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span>#{t.name}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                          isTagActive
                            ? 'bg-primary/20 text-primary'
                            : 'text-outline bg-surface-container-high'
                        }`}
                      >
                        {t.documentCount}
                      </span>
                    </button>
                  );
                })}
              {tags.filter((t) => t.documentCount > 0 && t.name !== '__untagged__').length === 0 && untaggedCount === 0 && (
                <span className="text-outline text-xs px-1">
                  {t('markdownDocs.sidebar.noTags')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Cache/Storage Stats */}
        <div className="p-3 border-t border-outline-variant bg-surface-container-lowest/60">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">
                database
              </span>
              <span className="text-label-sm font-label-sm font-medium text-on-surface">
                OPFS Local Cache
              </span>
            </div>
            <span className="text-label-sm font-label-sm text-secondary">Sync OK</span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mb-1.5">
            <div className="bg-primary h-full w-[28%] rounded-full" />
          </div>
          <div className="flex justify-between text-label-sm font-label-sm text-outline font-mono">
            <span>18.4 MB of 64 MB cached</span>
            <span>{documentCount} Docs</span>
          </div>
        </div>
      </aside>
    );
  },
);
