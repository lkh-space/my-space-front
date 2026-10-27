import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import {
  createDocument,
  exportDocumentPdf,
  fetchDocument,
  fetchFolders,
  FolderTreeNode,
  updateDocument,
} from '../../../entities/markdown';
import { MarkdownCodeEditor } from '../../../features/markdown/editor/MarkdownCodeEditor';
import { MarkdownPreview } from '../../../features/markdown/renderer/MarkdownPreview';
import { captureRenderedAssets } from '../../../features/markdown/renderer/pdfAssetCapture';
import { RevisionHistoryModal } from '../../../features/markdown/revision/RevisionHistoryModal';

const DEFAULT_SAMPLE_MD = `---
tags: [architecture, notes]
author: dev@my-space.local
---

# 새 문서

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

/**
 * 마크다운 본문에서 Frontmatter title 또는 첫 번째 헤딩(#) 텍스트를 추출합니다.
 */
export function extractTitleFromContent(md: string): string {
  if (!md) return '';
  // 1. Frontmatter의 title 속성 우선 추출 (줄바꿈 제외)
  const fmMatch = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const titleMatch = fmMatch[1].match(/^title:[ \t]*([^\r\n]+)$/m);
    if (titleMatch) {
      const parsed = titleMatch[1].trim().replace(/^['"]|['"]$/g, '');
      if (parsed) return parsed;
    }
  }
  // 2. Frontmatter 외부 본문 첫 번째 # 헤딩 추출
  const bodyWithoutFm = fmMatch ? md.slice(fmMatch[0].length) : md;
  const headingMatch = bodyWithoutFm.match(/^#\s+([^\r\n]+)$/m);
  if (headingMatch) {
    const parsed = headingMatch[1].trim();
    if (parsed) return parsed;
  }
  return '';
}

/**
 * 마크다운 본문에서 Frontmatter tags 목록을 추출합니다.
 */
export function extractTagsFromContent(md: string): string[] {
  if (!md) return [];
  const fmMatch = md.trimStart().match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return [];

  // 1. tags: [tag1, tag2] 형태 매칭
  const inlineMatch = fmMatch[1].match(/^[ \t]*tags:[ \t]*\[(.*?)\]/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, '').replace(/^#/, ''))
      .filter(Boolean);
  }

  // 2. tags:\n  - tag1\n  - tag2 리스트 형태 매칭
  const listMatch = fmMatch[1].match(/^[ \t]*tags:[ \t]*\r?\n((?:[ \t]*-[ \t]*[^\r\n]+\r?\n?)+)/m);
  if (listMatch) {
    return listMatch[1]
      .split(/\r?\n/)
      .map((line) => line.replace(/^[ \t]*-[ \t]*/, '').trim().replace(/^['"]|['"]$/g, '').replace(/^#/, ''))
      .filter(Boolean);
  }

  // 3. tags: tag1, tag2 단일 줄 매칭
  const simpleMatch = fmMatch[1].match(/^[ \t]*tags:[ \t]*([^\r\n[]+)$/m);
  if (simpleMatch) {
    return simpleMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^['"]|['"]$/g, '').replace(/^#/, ''))
      .filter(Boolean);
  }

  return [];
}

/**
 * 마크다운 본문의 Frontmatter 내 tags 항목을 안전하게 업데이트하거나 생성합니다.
 */
export function updateFrontmatterTagsInContent(content: string, newTags: string[]): string {
  const tagsStr = `tags: [${newTags.join(', ')}]`;
  const trimmedStart = content.trimStart();
  const leadingWhitespace = content.slice(0, content.length - trimmedStart.length);
  const fmMatch = trimmedStart.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (fmMatch) {
    const fullFm = fmMatch[0];
    const innerFm = fmMatch[1];

    let newInnerFm: string;
    // 1. 기존 inline tags: [ ... ] 또는 single-line tags: ... 치환
    if (/^[ \t]*tags:[ \t]*(\[.*?\]|[^\r\n]+)/m.test(innerFm)) {
      newInnerFm = innerFm.replace(/^[ \t]*tags:[ \t]*(\[.*?\]|[^\r\n]+)/m, tagsStr);
    }
    // 2. 기존 multi-line tags:\n  - ... 치환
    else if (/^[ \t]*tags:[ \t]*\r?\n((?:[ \t]*-[ \t]*[^\r\n]+\r?\n?)+)/m.test(innerFm)) {
      newInnerFm = innerFm.replace(/^[ \t]*tags:[ \t]*\r?\n((?:[ \t]*-[ \t]*[^\r\n]+\r?\n?)+)/m, `${tagsStr}\n`);
    }
    // 3. 기존 Frontmatter에 tags 항목이 없는 경우: Frontmatter 맨 위에 추가
    else {
      newInnerFm = `${tagsStr}\n${innerFm}`;
    }

    const newline = content.includes('\r\n') ? '\r\n' : '\n';
    const newFullFm = `---${newline}${newInnerFm.trim()}${newline}---`;
    return `${leadingWhitespace}${trimmedStart.replace(fullFm, newFullFm)}`;
  }

  // Frontmatter가 아예 없는 경우: 상단에 Frontmatter 블록 생성
  if (newTags.length === 0) return content;
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  return `---${newline}${tagsStr}${newline}---${newline}${newline}${content.trimStart()}`;
}

export const MarkdownEditorView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const folderIdFromQuery = searchParams.get('folderId');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditMode = Boolean(id);

  // Document Fields
  const [title, setTitle] = useState('');
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [content, setContent] = useState(DEFAULT_SAMPLE_MD);
  const [debouncedPreviewContent, setDebouncedPreviewContent] = useState(DEFAULT_SAMPLE_MD);
  const [folderId, setFolderId] = useState<string | null>(() => folderIdFromQuery || null);
  const [tags, setTags] = useState<string[]>(() =>
    isEditMode ? [] : extractTagsFromContent(DEFAULT_SAMPLE_MD),
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(1);

  // 실시간 에디터 입력 시 무거운 KaTeX/Mermaid 렌더링 부하를 줄이면서도 빠른 반응성을 제공하는 100ms 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPreviewContent(content);
    }, 100);
    return () => clearTimeout(timer);
  }, [content]);

  // 새 문서 작성 시 사용자가 상단 제목을 직접 입력하지 않은 경우 본문 내용(헤딩 또는 Frontmatter)과 자동 연동
  useEffect(() => {
    if (isEditMode || isTitleManuallyEdited) return;
    const extracted = extractTitleFromContent(content);
    if (extracted && extracted !== title) {
      setTitle(extracted);
    }
  }, [content, isEditMode, isTitleManuallyEdited, title]);

  // 이전 추출된 Frontmatter tags 추적용 ref (일반 텍스트 타이핑 시 태그 리셋 방지)
  const lastExtractedTagsRef = useRef<string>(
    JSON.stringify(isEditMode ? [] : extractTagsFromContent(DEFAULT_SAMPLE_MD)),
  );

  // 본문 Frontmatter tags를 사용자가 에디터에서 직접 편집했을 때만 상단 태그 칩 상태와 동기화
  useEffect(() => {
    const extractedTags = extractTagsFromContent(content);
    const serialized = JSON.stringify(extractedTags);
    if (serialized !== lastExtractedTagsRef.current) {
      lastExtractedTagsRef.current = serialized;
      setTags(extractedTags);
    }
  }, [content]);

  // Auxiliary States
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);

  // 계층형 폴더 트리를 들여쓰기 레벨을 포함하는 평탄한 목록으로 변환 (셀렉터용)
  const flatFolders = useMemo(() => {
    const list: Array<{ id: string; name: string; level: number }> = [];
    const traverse = (nodes: FolderTreeNode[], level: number) => {
      for (const n of nodes) {
        list.push({ id: n.id, name: n.name, level });
        if (n.children && n.children.length > 0) {
          traverse(n.children, level + 1);
        }
      }
    };
    traverse(folders, 0);
    return list;
  }, [folders]);

  // 현재 선택된 폴더 이름
  const currentFolderName = useMemo(() => {
    if (!folderId) return null;
    const found = flatFolders.find((f) => f.id === folderId);
    return found ? found.name : null;
  }, [folderId, flatFolders]);

  // URL 쿼리 파라미터(?folderId=...)로 진입 시 폴더 자동 지정
  useEffect(() => {
    if (!isEditMode && folderIdFromQuery && !folderId) {
      setFolderId(folderIdFromQuery);
    }
  }, [folderIdFromQuery, isEditMode, folderId]);

  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle');

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Split Pane Width (Percentage for Left Pane)
  const [leftWidthPercent, setLeftWidthPercent] = useState(50);
  const isDraggingRef = useRef(false);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExportPdf = async () => {
    if (!id) return;
    try {
      setIsExportingPdf(true);
      const assets = await captureRenderedAssets(previewContainerRef.current, content);
      console.log('[PDF Export] 캡처 완료된 그래픽 자산:', assets);
      await exportDocumentPdf(id, assets, `${title || 'document'}.pdf`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDF 내보내기에 실패했습니다.';
      alert(message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  // 기존 문서 불러오기
  useEffect(() => {
    if (!id) return;

    fetchDocument(id)
      .then((doc) => {
        setTitle(doc.title || 'Untitled');
        setIsTitleManuallyEdited(true);
        setContent(doc.content);
        setDebouncedPreviewContent(doc.content);
        setFolderId(doc.folderId);
        const docTags = doc.tags || [];
        setTags(docTags);
        lastExtractedTagsRef.current = JSON.stringify(extractTagsFromContent(doc.content));
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

  // 태그 추가 (상단 칩 및 본문 Frontmatter 동시 갱신)
  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      const nextTags = [...tags, trimmed];
      setTags(nextTags);
      lastExtractedTagsRef.current = JSON.stringify(nextTags);
      setContent((prev) => updateFrontmatterTagsInContent(prev, nextTags));
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  // 태그 삭제 (상단 칩 및 본문 Frontmatter 동시 갱신)
  const handleRemoveTag = (targetTag: string) => {
    const nextTags = tags.filter((t) => t !== targetTag);
    setTags(nextTags);
    lastExtractedTagsRef.current = JSON.stringify(nextTags);
    setContent((prev) => updateFrontmatterTagsInContent(prev, nextTags));
  };

  // 문서 저장
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    const effectiveTitle =
      title.trim() || extractTitleFromContent(content) || 'Untitled';

    // 입력 중이던 태그와 본문 Frontmatter 태그를 모두 통합
    const pendingTag = newTagInput.trim().replace(/^#/, '');
    const contentTags = extractTagsFromContent(content);
    const combinedTags = Array.from(
      new Set([...tags, ...(pendingTag ? [pendingTag] : []), ...contentTags]),
    ).filter(Boolean);

    if (pendingTag) {
      setNewTagInput('');
      setIsAddingTag(false);
    }

    // 본문 Frontmatter에도 최종 combinedTags 반영
    const effectiveContent = updateFrontmatterTagsInContent(content, combinedTags);
    setTags(combinedTags);
    lastExtractedTagsRef.current = JSON.stringify(combinedTags);
    setContent(effectiveContent);

    try {
      if (isEditMode && id) {
        const updated = await updateDocument(id, {
          title: effectiveTitle,
          content: effectiveContent,
          folderId,
          tags: combinedTags,
        });
        setCurrentVersion(updated.currentVersion);
        setTags(updated.tags || combinedTags);
      } else {
        const created = await createDocument({
          title: effectiveTitle,
          content: effectiveContent,
          folderId,
          tags: combinedTags,
        });
        navigate(`/docs/${created.id}`);
        return;
      }
      setSaveStatus('saved');
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
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
      <div className="editor-header-bar h-14 px-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-4 shrink-0">
        {/* Left Subheader: Back Button & Document Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => navigate('/docs')}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
            title="문서 목록으로 이동"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>

          {/* Editable Document Title */}
          <div className="flex items-center gap-1.5 group flex-1 min-w-0">
            <span className="material-symbols-outlined text-outline group-hover:text-primary cursor-pointer text-base shrink-0">
              edit
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsTitleManuallyEdited(true);
              }}
              placeholder="문서 제목 입력..."
              className="bg-transparent border-0 font-headline-sm text-headline-sm font-medium text-on-surface focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5 w-full min-w-0"
            />
          </div>
        </div>

        {/* Right Subheader: Folder, Tags, History, PDF Export, Save */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Folder Selector Badge */}
          <div className="flex items-center gap-1 bg-surface-container border border-outline-variant rounded px-2 py-1 text-label-sm font-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary text-sm">
              folder
            </span>
            <select
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="bg-transparent border-0 text-on-surface-variant font-mono text-label-sm focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="">(최상위 / 미분류)</option>
              {flatFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.level > 0 ? `${'\u00A0\u00A0'.repeat(f.level)}└ ${f.name}` : f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Chips */}
          <div className="hidden md:flex items-center gap-1.5 flex-wrap">
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

            {tags.length === 0 && !isAddingTag && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant text-outline text-label-sm font-label-sm">
                <span className="material-symbols-outlined text-[11px] text-outline">label_off</span>
                <span>{t('markdownDocs.common.untagged')}</span>
              </span>
            )}

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

          {id && (
            <>
              <div className="h-4 w-px bg-outline-variant mx-1" />

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
                disabled={isExportingPdf}
                onClick={handleExportPdf}
                className="px-2.5 py-1 text-label-sm font-label-sm text-on-surface bg-surface-container-highest hover:bg-surface-bright rounded border border-outline-variant transition-colors flex items-center gap-1 disabled:opacity-50"
                title="KaTeX 수식 및 Mermaid 다이어그램이 렌더링된 고품질 PDF 다운로드"
              >
                <span className="material-symbols-outlined text-xs text-error">
                  {isExportingPdf ? 'progress_activity' : 'picture_as_pdf'}
                </span>
                <span>{isExportingPdf ? 'PDF 생성 중...' : 'PDF 내보내기'}</span>
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
          <div className="editor-preview-subtoolbar h-8 px-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between text-label-sm font-label-sm text-outline shrink-0">
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
          <div ref={previewContainerRef} className="p-6 max-w-4xl w-full mx-auto">
            {/* Bento Manifest Card (Stitch Exact Match) */}
            <div className="p-4 rounded border border-outline-variant bg-surface-container mb-6 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-label-sm font-label-sm text-primary">
                  <span className="material-symbols-outlined text-[13px]">folder</span>
                  <span>{currentFolderName ? `Folder: ${currentFolderName}` : 'Root / Uncategorized'}</span>
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-outline text-label-sm font-label-sm">
                    <span className="material-symbols-outlined text-[11px] text-outline">label_off</span>
                    <span>{t('markdownDocs.common.untagged')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Rendered Markdown Output */}
            <MarkdownPreview content={debouncedPreviewContent} />
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
              setDebouncedPreviewContent(doc.content);
              setCurrentVersion(doc.currentVersion);
            });
          }}
        />
      )}
    </div>
  );
};

export default MarkdownEditorView;
