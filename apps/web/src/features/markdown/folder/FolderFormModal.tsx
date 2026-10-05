import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTreeNode,
  createFolder,
  updateFolder,
} from '../../../entities/markdown';

interface FolderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders: FolderTreeNode[];
  targetFolder?: FolderTreeNode | null;
  initialParentId?: string | null;
}

// 모든 하위 자식 ID를 재귀적으로 수집
function collectDescendantIds(node: FolderTreeNode): Set<string> {
  const ids = new Set<string>([node.id]);
  if (node.children) {
    node.children.forEach((child) => {
      collectDescendantIds(child).forEach((id) => ids.add(id));
    });
  }
  return ids;
}

// 트리를 플랫 배열(들여쓰기 레벨 포함)로 변환
function flattenTree(
  nodes: FolderTreeNode[],
  level = 0,
): Array<{ id: string; name: string; level: number }> {
  const result: Array<{ id: string; name: string; level: number }> = [];
  nodes.forEach((n) => {
    result.push({ id: n.id, name: n.name, level });
    if (n.children && n.children.length > 0) {
      result.push(...flattenTree(n.children, level + 1));
    }
  });
  return result;
}

export const FolderFormModal: React.FC<FolderFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  folders,
  targetFolder,
  initialParentId,
}) => {
  const isEdit = Boolean(targetFolder);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (targetFolder) {
      setName(targetFolder.name);
      setParentId(targetFolder.parentId ?? null);
    } else {
      setName('');
      setParentId(initialParentId ?? null);
    }
    setError(null);
  }, [isOpen, targetFolder, initialParentId]);

  // 수정 시 선택 불가능한 폴더 ID 목록 (자기 자신 + 모든 자손)
  const disabledFolderIds = useMemo(() => {
    if (!targetFolder) return new Set<string>();
    return collectDescendantIds(targetFolder);
  }, [targetFolder]);

  const flatFolders = useMemo(() => flattenTree(folders), [folders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('폴더 이름을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && targetFolder) {
        await updateFolder(targetFolder.id, {
          name: name.trim(),
          parentId: parentId || null,
        });
      } else {
        await createFolder({
          name: name.trim(),
          parentId: parentId || null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '저장에 실패했습니다.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? '폴더 수정' : '새 폴더 생성'}
    >
      <div className="w-full max-w-md rounded bg-surface-container-low border border-outline-variant shadow-2xl overflow-hidden">
        <div className="h-12 px-5 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">
              {isEdit ? 'edit' : 'create_new_folder'}
            </span>
            <h3 className="text-sm font-semibold text-on-surface">
              {isEdit ? '폴더 수정' : '새 폴더 생성'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-body-sm font-body-sm">
          {error && (
            <div className="p-3 rounded bg-error/10 border border-error/30 text-error">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-on-surface-variant font-medium text-label-sm font-label-sm">
              폴더 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Architecture"
              autoFocus
              className="h-8 px-3 rounded bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-on-surface-variant font-medium text-label-sm font-label-sm">
              상위(부모) 폴더
            </label>
            <select
              value={parentId ?? ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="h-8 px-3 rounded bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:border-primary font-mono text-label-sm"
            >
              <option value="">(최상위 루트 폴더)</option>
              {flatFolders.map((f) => {
                const isDisabled = disabledFolderIds.has(f.id);
                return (
                  <option key={f.id} value={f.id} disabled={isDisabled}>
                    {'\u00A0'.repeat(f.level * 3)}
                    {f.level > 0 ? '└ ' : ''}
                    {f.name} {isDisabled ? '(선택 불가 - 순환 방지)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-md font-label-md border border-outline-variant transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded bg-on-background text-surface hover:bg-surface-bright hover:text-on-surface font-medium text-label-md font-label-md transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? '저장 중...' : isEdit ? '수정 완료' : '폴더 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
