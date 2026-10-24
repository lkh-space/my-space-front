import React from 'react';
import { FolderTreeNode, TagItem } from '../../../entities/markdown';
import { FolderTree } from '../../../features/markdown/folder/FolderTree';

interface LibrarySidebarProps {
  folders: FolderTreeNode[];
  tags: TagItem[];
  selectedFolderId: string | null | undefined;
  selectedTag: string | null;
  documentCount: number;
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
    onSelectFolder,
    onSelectTag,
    onOpenCreateFolderModal,
    onOpenEditFolderModal,
    onDeleteFolder,
  }) => {
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
                title="새 폴더 생성"
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
                {tags.length} Filterable
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
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
                      className={`text-[9px] px-1 py-0.2 rounded ${
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
              {tags.length === 0 && (
                <span className="text-outline text-xs px-1">등록된 태그 없음</span>
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
