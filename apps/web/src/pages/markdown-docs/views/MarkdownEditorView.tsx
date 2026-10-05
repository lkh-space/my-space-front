import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createDocument,
  fetchDocument,
  fetchFolders,
  FolderTreeNode,
  getExportMdUrl,
  getExportPdfUrl,
  updateDocument,
} from '../../../entities/markdown';
import { MarkdownCodeEditor } from '../../../features/markdown/editor/MarkdownCodeEditor';
import { MarkdownPreview } from '../../../features/markdown/renderer/MarkdownPreview';
import { RevisionHistoryModal } from '../../../features/markdown/revision/RevisionHistoryModal';

const DEFAULT_SAMPLE_MD = `---
title: 새 마크다운 문서
tags: [architecture, notes]
author: dev@my-space.local
---

# 1. 개요 및 시작하기

마크다운 본문을 작성해 보세요. 실시간 프리뷰가 우측에 즉시 렌더링됩니다.

## 2. 수식 예시 (KaTeX)
블록 수식:
$$\\mathcal{H}_{entropy} = -\\sum p(x) \\log_2 p(x)$$

인라인 수식: $E = mc^2$

## 3. 다이어그램 예시 (Mermaid)
\`\`\`mermaid
graph TD
  Client[Browser Client] --> Parser[WASM AST Engine]
  Parser --> Preview[KaTeX & GFM Live Canvas]
\`\`\`

## 4. 체크리스트
- [x] GFM 지원
- [ ] 이미지 드래그 앤 드롭 업로드 테스트
`;

export const MarkdownEditorView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Document Fields
  const [title, setTitle] = useState('새 문서');
  const [content, setContent] = useState(DEFAULT_SAMPLE_MD);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(1);

  // Auxiliary States
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle');

  // Split Pane Width (Percentage for Left Pane)
  const [leftWidthPercent, setLeftWidthPercent] = useState(50);
  const isDraggingRef = useRef(false);

  // 기존 문서 불러오기
  useEffect(() => {
    if (!id) return;

    fetchDocument(id)
      .then((doc) => {
        setTitle(doc.title || 'Untitled');
        setContent(doc.content);
        setFolderId(doc.folderId);
        setTags(doc.tags || []);
        setCurrentVersion(doc.currentVersion);
      })
      .catch((err) => {
        alert(err.message || '문서를 불러오지 못했습니다.');
        navigate('/docs');
      });
  }, [id, navigate]);

  // 폴더 목록 로드
  useEffect(() => {
    fetchFolders()
      .then((data) => setFolders(data))
      .catch((err) => {
        console.warn('폴더 목록 로드 실패:', err);
      });
  }, []);

  // 태그 추가
  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  // 태그 삭제
  const handleRemoveTag = (targetTag: string) => {
    setTags(tags.filter((t) => t !== targetTag));
  };

  // 문서 저장
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      if (isEditMode && id) {
        const updated = await updateDocument(id, {
          title: title.trim() || undefined,
          content,
          folderId,
          tags,
        });
        setCurrentVersion(updated.currentVersion);
      } else {
        const created = await createDocument({
          title: title.trim() || undefined,
          content,
          folderId,
          tags,
        });
        navigate(`/docs/${created.id}`);
        return;
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: unknown) {
      setSaveStatus('error');
      const msg = err instanceof Error ? err.message : '저장에 실패했습니다.';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // 마우스 드래그 리사이즈 핸들러
  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newPercent = (e.clientX / window.innerWidth) * 100;
    if (newPercent > 20 && newPercent < 80) {
      setLeftWidthPercent(newPercent);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP PAGE HEADER & ACTION BAR (Stitch Exact Match h-14)                     */}
      {/* ========================================================================= */}
      <div className="h-14 px-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between shrink-0">
        {/* Left Subheader: Title, Folder, Tags */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/docs')}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="문서 목록으로 이동"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>

          {/* Editable Document Title */}
          <div className="flex items-center gap-1.5 group">
            <span className="material-symbols-outlined text-outline group-hover:text-primary cursor-pointer text-base">
              edit
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목 입력..."
              className="bg-transparent border-0 font-headline-sm text-headline-sm font-medium text-on-surface focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5 w-64"
            />
          </div>

          <div className="h-4 w-px bg-outline-variant" />

          {/* Folder Selector Badge */}
          <div className="flex items-center gap-1 bg-surface-container border border-outline-variant rounded px-2 py-1 text-label-sm font-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary text-sm">
              folder
            </span>
            <select
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="bg-transparent border-0 text-on-surface-variant font-mono text-label-sm focus:outline-none cursor-pointer"
            >
              <option value="">(최상위 / 미분류)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Chips */}
          <div className="hidden lg:flex items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1"
              >
                <span>#{t}</span>
                <span
                  className="material-symbols-outlined text-[11px] cursor-pointer hover:text-error"
                  onClick={() => handleRemoveTag(t)}
                >
                  close
                </span>
              </span>
            ))}

            {isAddingTag ? (
              <input
                type="text"
                autoFocus
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') setIsAddingTag(false);
                }}
                onBlur={handleAddTag}
                placeholder="태그 후 Enter"
                className="h-6 px-2 rounded bg-surface-container border border-outline-variant text-label-sm text-on-surface w-24 focus:outline-none focus:border-primary"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="px-1.5 py-0.5 rounded hover:bg-surface-container text-label-sm font-label-sm text-outline hover:text-on-surface transition-colors flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>Add tag</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Subheader Action Group */}
        <div className="flex items-center gap-2">
          {id && (
            <>
              <button
                type="button"
                onClick={() => window.open(getExportMdUrl(id), '_blank')}
                className="px-2.5 py-1 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded border border-outline-variant transition-colors flex items-center gap-1"
                title="마크다운 파일 다운로드"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                <span>내보내기 (Export .md)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-2.5 py-1 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded border border-outline-variant transition-colors flex items-center gap-1"
                title="수정 이력 및 비교"
              >
                <span className="material-symbols-outlined text-xs">history</span>
                <span>버전 이력 (History v{currentVersion})</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(getExportPdfUrl(id), '_blank')}
                className="px-2.5 py-1 text-label-sm font-label-sm text-on-surface bg-surface-container-highest hover:bg-surface-bright rounded border border-outline-variant transition-colors flex items-center gap-1"
                title="PDF 파일 다운로드"
              >
                <span className="material-symbols-outlined text-xs text-error">
                  picture_as_pdf
                </span>
                <span>PDF 내보내기</span>
              </button>
            </>
          )}

          {/* Primary Save Action Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-3.5 py-1 text-label-sm font-label-sm bg-on-surface text-surface hover:bg-surface-bright hover:text-on-surface rounded font-medium transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xs">
              {isSaving ? 'progress_activity' : 'save'}
            </span>
            <span>{isSaving ? '저장 중...' : saveStatus === 'saved' ? '저장 완료!' : '저장 (Save)'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WORKSPACE SPLIT VIEW: 50% Editor / 50% Live Preview                        */}
      {/* ========================================================================= */}
      <div className="editor-split-container flex-1 flex min-h-0 relative overflow-hidden">
        {/* LEFT PANE: Markdown Code Editor (VS Code / JetBrains look & feel) */}
        <section
          style={{ width: `${leftWidthPercent}%` }}
          className="editor-pane-left flex flex-col border-r border-outline-variant bg-surface-container-lowest"
        >
          {/* Editor Subtoolbar */}
          <div className="h-8 px-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between text-label-sm font-label-sm text-outline">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-on-surface font-medium">
                <span className="material-symbols-outlined text-xs text-primary">code</span>
                <span>editor.md</span>
              </span>
              <span className="text-outline-variant">|</span>
              <span className="text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                WASM Engine Ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hover:text-on-surface p-0.5 rounded transition-colors"
                title="Format Code"
              >
                <span className="material-symbols-outlined text-xs">data_object</span>
              </button>
              <button
                type="button"
                className="hover:text-on-surface p-0.5 rounded transition-colors"
                title="Wrap Text"
              >
                <span className="material-symbols-outlined text-xs">wrap_text</span>
              </button>
              <button
                type="button"
                className="hover:text-on-surface p-0.5 rounded transition-colors"
                title="Toggle Minimap"
              >
                <span className="material-symbols-outlined text-xs">view_sidebar</span>
              </button>
            </div>
          </div>

          {/* CodeMirror Canvas */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MarkdownCodeEditor value={content} onChange={(val) => setContent(val)} />
          </div>
        </section>

        {/* Resizer Splitter Bar */}
        <div
          onMouseDown={handleMouseDown}
          className="editor-splitter-divider"
          title="좌우 크기 조절"
        />

        {/* RIGHT PANE: Live Render Canvas (GFM + KaTeX + Mermaid) */}
        <section className="editor-pane-right flex-1 flex flex-col bg-surface overflow-y-auto">
          {/* Preview Subtoolbar */}
          <div className="h-8 px-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between text-label-sm font-label-sm text-outline shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-secondary">
                visibility
              </span>
              <span className="font-medium text-on-surface">Live Render Canvas</span>
              <span className="text-outline-variant">|</span>
              <span className="text-outline font-mono text-[10px]">GFM + KaTeX + Mermaid</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-outline font-mono">Zoom: 100%</span>
              <div className="h-3 w-px bg-outline-variant" />
              <button
                type="button"
                className="hover:text-on-surface p-0.5 rounded transition-colors"
                title="동기화 스크롤"
              >
                <span className="material-symbols-outlined text-xs">sync_alt</span>
              </button>
            </div>
          </div>

          {/* Preview Content Area */}
          <div className="p-6 max-w-4xl w-full mx-auto">
            {/* Bento Manifest Card (Stitch Exact Match) */}
            <div className="p-4 rounded border border-outline-variant bg-surface-container mb-6 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-label-sm font-label-sm text-primary">
                  <span className="material-symbols-outlined text-[13px]">folder</span>
                  <span>{folderId ? `Folder: ${folderId}` : 'Root / Uncategorized'}</span>
                </span>
                <span className="text-label-sm font-label-sm text-secondary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Live Syncing
                </span>
              </div>
              <h2 className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight mt-1">
                {title || 'Untitled Document'}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant"
                  >
                    #{t}
                  </span>
                ))}
                {tags.length === 0 && (
                  <span className="text-outline text-label-sm font-label-sm">#draft</span>
                )}
              </div>
            </div>

            {/* Rendered Markdown Output */}
            <MarkdownPreview content={content} />
          </div>
        </section>
      </div>

      {/* Revision History Modal */}
      {id && (
        <RevisionHistoryModal
          documentId={id}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onRestoreSuccess={() => {
            fetchDocument(id).then((doc) => {
              setTitle(doc.title || 'Untitled');
              setContent(doc.content);
              setCurrentVersion(doc.currentVersion);
            });
          }}
        />
      )}
    </div>
  );
};
