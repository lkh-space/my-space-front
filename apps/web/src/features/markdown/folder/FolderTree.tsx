import React, { useState } from 'react';
import { FolderTreeNode } from '../../../entities/markdown';

interface FolderTreeProps {
  folders: FolderTreeNode[];
  selectedFolderId: string | null | undefined;
  onSelectFolder: (folderId: string | null) => void;
  onOpenCreateModal: (parentId?: string | null) => void;
  onOpenEditModal: (folder: FolderTreeNode) => void;
  onDeleteFolder: (folderId: string) => void;
}

interface TreeNodeItemProps {
  node: FolderTreeNode;
  level: number;
  selectedFolderId: string | null | undefined;
  onSelectFolder: (folderId: string | null) => void;
  onOpenCreateModal: (parentId?: string | null) => void;
  onOpenEditModal: (folder: FolderTreeNode) => void;
  onDeleteFolder: (folderId: string) => void;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  selectedFolderId,
  onSelectFolder,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteFolder,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedFolderId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="folder-tree-node flex flex-col">
      <div
        className={`group flex items-center justify-between px-1.5 py-1 rounded text-body-sm font-body-sm cursor-pointer transition-colors ${
          isSelected
            ? 'bg-surface-container-high text-on-surface font-medium'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
        }`}
        style={{ paddingLeft: `${Math.max(6, level * 14 + 6)}px` }}
        onClick={() => onSelectFolder(node.id)}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              className="p-0.5 rounded text-outline hover:text-on-surface"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </span>
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          <span
            className="material-symbols-outlined text-[15px]"
            style={{ color: isSelected ? 'var(--primary, #adc6ff)' : level === 0 ? 'var(--tertiary, #ffb95f)' : 'var(--primary, #adc6ff)' }}
          >
            {isExpanded && hasChildren ? 'folder_open' : 'folder'}
          </span>
          <span className="truncate">{node.name}</span>
        </div>

        {/* Hover Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button
            type="button"
            className="p-0.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high"
            title="하위 폴더 추가"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreateModal(node.id);
            }}
          >
            <span className="material-symbols-outlined text-[13px]">add</span>
          </button>
          <button
            type="button"
            className="p-0.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high"
            title="폴더 수정"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEditModal(node);
            }}
          >
            <span className="material-symbols-outlined text-[13px]">edit</span>
          </button>
          <button
            type="button"
            className="p-0.5 rounded text-outline hover:text-error hover:bg-surface-container-high"
            title="폴더 삭제"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(node.id);
            }}
          >
            <span className="material-symbols-outlined text-[13px]">delete</span>
          </button>
        </div>
      </div>

      {/* Children Nodes */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col space-y-0.5 border-l border-outline-variant/50 ml-3.5 pl-1 mt-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onOpenCreateModal={onOpenCreateModal}
              onOpenEditModal={onOpenEditModal}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteFolder,
}) => {
  return (
    <div className="folder-tree-container flex flex-col space-y-0.5">
      {/* 1. All Documents Shortcut */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-body-sm font-body-sm cursor-pointer transition-colors ${
          selectedFolderId === undefined || selectedFolderId === null
            ? 'bg-surface-container-high text-on-surface font-medium'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
        }`}
        onClick={() => onSelectFolder(null)}
      >
        <span className="material-symbols-outlined text-[15px] text-tertiary">
          source
        </span>
        <span className="font-medium">전체 문서 (All)</span>
      </div>

      {/* 2. Hierarchical Folders */}
      {folders.map((folder) => (
        <TreeNodeItem
          key={folder.id}
          node={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onOpenCreateModal={onOpenCreateModal}
          onOpenEditModal={onOpenEditModal}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
};
