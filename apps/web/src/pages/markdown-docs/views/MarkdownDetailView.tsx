import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import {
  DocumentDetail,
  FolderDto,
  deleteDocument,
  exportDocumentPdf,
  markdownApi,
} from '../../../entities/markdown';
import { MarkdownPreview, TocItem } from '../../../features/markdown/renderer/MarkdownPreview';
import { captureRenderedAssets } from '../../../features/markdown/renderer/pdfAssetCapture';
import { RevisionHistoryModal } from '../../../features/markdown/revision/RevisionHistoryModal';
import { StickyToc } from '../components/StickyToc';

interface MarkdownDetailViewProps {
  documentId?: string;
  onNavigateBack?: () => void;
  onNavigateEdit?: (id: string) => void;
}

export const MarkdownDetailView: React.FC<MarkdownDetailViewProps> = ({
  documentId: propDocumentId,
  onNavigateBack: propOnNavigateBack,
  onNavigateEdit: propOnNavigateEdit,
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const documentId = propDocumentId || paramId || '';
  const onNavigateBack = useCallback(() => {
    if (propOnNavigateBack) {
      propOnNavigateBack();
    } else {
      navigate('/docs');
    }
  }, [propOnNavigateBack, navigate]);

  const onNavigateEdit = useCallback(
    (id: string) => {
      if (propOnNavigateEdit) {
        propOnNavigateEdit(id);
      } else {
        navigate(`/docs/${id}/edit`);
      }
    },
    [propOnNavigateEdit, navigate]
  );

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [folders, setFolders] = useState<FolderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // 토스트 메시지 헬퍼
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // 문서 및 폴더 데이터 로드
  const loadDocumentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [docRes, foldersRes] = await Promise.all([
        markdownApi.getDocument(documentId),
        markdownApi.getFolders(),
      ]);
      setDoc(docRes);
      setFolders(foldersRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocumentData();
  }, [loadDocumentData]);

  // 폴더 이름 찾기
  const currentFolderName = useMemo(() => {
    if (!doc?.folderId) return 'Documents / Root';
    const folder = folders.find((f) => f.id === doc.folderId);
    return folder ? `Documents / ${folder.name}` : 'Documents / Root';
  }, [doc, folders]);

  // 단어 수, 글자 수 및 읽기 시간 계산
  const { wordCount, charCount, readTimeDisplay } = useMemo(() => {
    if (!doc?.content) {
      return { wordCount: 0, charCount: 0, readTimeDisplay: '0 min read' };
    }
    const trimmed = doc.content.trim();
    const chars = trimmed.replace(/\s+/g, '').length;
    const words = trimmed.split(/\s+/).filter(Boolean).length;

    // 읽기 시간: 영문 200 wpm, 한글 450 cpm 기준 복합 계산
    const estimatedMinutes = Math.max(words / 200, chars / 450);

    let display = '';
    if (words === 0 || chars === 0) {
      display = '0 min read';
    } else if (words < 50 || estimatedMinutes < 0.8) {
      display = '< 1 min read (1분 미만)';
    } else {
      const minutes = Math.ceil(estimatedMinutes);
      display = `${minutes} min read (약 ${minutes}분)`;
    }

    return { wordCount: words, charCount: chars, readTimeDisplay: display };
  }, [doc?.content]);

  // 헤딩 변경 시 Intersection Observer 설정
  useEffect(() => {
    if (headings.length === 0) return;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // 마크다운 원본 클립보드 복사
  const handleCopyMarkdown = async () => {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(doc.content);
      showToast('마크다운 원본이 클립보드에 복사되었습니다.');
    } catch {
      showToast('클립보드 복사에 실패했습니다.');
    }
  };

  // PDF 파일 직접 다운로드 (window.print 배제, 렌더링된 다이어그램 및 수식 그래픽 포함)
  const handleExportPdf = async () => {
    if (!doc) return;
    try {
      setIsExportingPdf(true);
      const assets = await captureRenderedAssets(previewRef.current, doc.content);
      console.log('[PDF Export] 캡처 완료된 그래픽 자산:', assets);
      await exportDocumentPdf(doc.id, assets, `${doc.title || 'document'}.pdf`);
      showToast('PDF 파일이 성공적으로 다운로드되었습니다.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PDF 다운로드에 실패했습니다.';
      alert(msg);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 문서 삭제
  const handleDeleteDoc = async () => {
    if (!doc) return;
    if (!window.confirm('정말 이 문서를 삭제하시겠습니까?')) return;
    try {
      await deleteDocument(doc.id);
      onNavigateBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '문서 삭제 실패';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-label-sm font-label-sm text-outline">
        <span className="material-symbols-outlined text-xl animate-spin mr-2">
          progress_activity
        </span>
        <p>문서를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-outline">
        <div className="w-12 h-12 rounded-full bg-error/10 border border-error/30 flex items-center justify-center text-error mb-4">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <h3 className="text-headline-md font-headline-md font-semibold text-on-surface mb-2">
          문서를 찾을 수 없습니다
        </h3>
        <p className="text-body-sm font-body-sm text-outline mb-6">
          {error || '삭제되었거나 접근할 수 없는 문서입니다.'}
        </p>
        <button
          type="button"
          onClick={onNavigateBack}
          className="h-8 px-4 bg-surface-container-highest hover:bg-surface-bright text-on-surface text-label-md font-label-md rounded border border-outline-variant transition-colors"
        >
          문서 라이브러리로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="detail-view-container flex-1 flex flex-col min-h-screen bg-background text-on-surface">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-surface-container-highest border border-outline-variant rounded shadow-2xl text-label-sm font-label-sm text-primary flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL SUB-NAVBAR: Breadcrumb & Meta (Stitch Exact Match h-12)             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 w-full z-40 border-b border-outline-variant flex items-center justify-between h-12 px-6 bg-surface shrink-0">
        {/* Left: Breadcrumbs & Document Meta */}
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            type="button"
            onClick={onNavigateBack}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="라이브러리로 돌아가기"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>

          <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
            <span>my-space</span>
            <span className="text-outline-variant">/</span>
            <span>마크다운 문서</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium truncate max-w-xs">{doc.title}</span>
          </div>

          <span className="px-2 py-0.5 rounded bg-surface-container-high text-label-sm font-label-sm text-secondary flex items-center gap-1 border border-outline-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            v{doc.currentVersion} (Draft Auto-saved)
          </span>
        </div>

        {/* Right: Trailing Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateBack}
            className="text-label-sm font-label-sm px-2.5 py-1 rounded border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            Docs
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* DOCUMENT MAIN CONTENT WITH STICKY TOC (Stitch Exact Match)                */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
          {/* Primary Article Container */}
          <article ref={previewRef} className="flex-1 max-w-4xl mx-auto space-y-8">
            {/* Post Header Section */}
            <div className="space-y-4 border-b border-outline-variant pb-6">
              {/* Folder Path Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant text-primary font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[13px]">folder</span>
                <span>{currentFolderName}</span>
              </div>

              {/* Headline */}
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                {doc.title}
              </h1>

              {/* Metadata Multi-line Section */}
              <div className="rounded-xl bg-surface-container-low/60 border border-outline-variant/60 p-4 space-y-3">
                {/* 1행: 작성자, 작성일, 최종 수정일, 버전 뱃지 */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-label-sm font-label-sm">
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-outline">
                    <div className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">account_circle</span>
                      <span>dev@my-space.local</span>
                    </div>
                    <span className="text-outline-variant/60">|</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      <span>Created {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-outline-variant/60">•</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">update</span>
                      <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      v{doc.currentVersion} (Verified)
                    </span>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="h-px bg-outline-variant/40" />

                {/* 2행: 분량 통계 (읽기 소요 시간, 단어 수, 글자 수) 및 태그 목록 */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-label-sm font-label-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-outline">
                    <div className="flex items-center gap-1.5 font-medium text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                      <span>{readTimeDisplay}</span>
                    </div>
                    <span className="text-outline-variant/60">•</span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">article</span>
                      <span>{wordCount.toLocaleString()} words ({charCount.toLocaleString()} chars)</span>
                    </div>
                  </div>

                  {/* Tag Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {doc.tags.map((t) => (
                      <span
                        key={t}
                        className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors"
                      >
                        #{t.replace(/^#/, '')}
                      </span>
                    ))}
                    {doc.tags.length === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high/60 border border-outline-variant/50 text-outline text-label-sm font-label-sm">
                        <span className="material-symbols-outlined text-[11px] text-outline">label_off</span>
                        <span>{t('markdownDocs.common.untagged')}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Reading Control Toolbar (Stitch Exact Match) */}
              <div className="sticky top-0 z-30 pt-2 backdrop-blur-md bg-background/85 flex items-center justify-between gap-2 border-t border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateEdit(doc.id)}
                    className="h-8 px-3 rounded bg-on-background text-surface font-headline-sm text-headline-sm font-medium hover:bg-surface-bright hover:text-on-surface transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    <span>수정하기</span>
                  </button>

                  <button
                    type="button"
                    disabled={isExportingPdf}
                    onClick={handleExportPdf}
                    className="h-8 px-2.5 rounded bg-transparent border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    title="KaTeX 수식 및 Mermaid 다이어그램이 온전히 렌더링된 고품질 PDF 다운로드"
                  >
                    <span className="material-symbols-outlined text-[16px] text-error">
                      {isExportingPdf ? 'progress_activity' : 'picture_as_pdf'}
                    </span>
                    <span>{isExportingPdf ? 'PDF 생성 중...' : 'PDF 내보내기'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRevisionModalOpen(true)}
                    className="h-8 px-2.5 rounded bg-transparent border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span>v{doc.currentVersion} 이력</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="h-8 px-2.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-label-sm font-label-sm flex items-center gap-1"
                    title="Copy Raw Markdown"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    <span>복사 (Copy Raw)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteDoc}
                    className="h-8 px-2 rounded text-error/80 hover:text-error hover:bg-surface-container text-label-sm font-label-sm flex items-center gap-1"
                    title="문서 삭제"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rendered Markdown Body */}
            <div ref={previewRef} className="markdown-body-wrapper pb-16">
              <MarkdownPreview
                content={doc.content}
                onHeadingsExtracted={setHeadings}
              />
            </div>
          </article>

          {/* Floating Sticky TOC */}
          <aside className="w-64 flex-shrink-0 hidden xl:block sticky top-24 self-start">
            <StickyToc
              headings={headings}
              activeId={activeHeadingId}
              onHeadingClick={(id: string) => {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </aside>
        </div>
      </main>

      {/* Revision History Modal */}
      <RevisionHistoryModal
        documentId={doc.id}
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        onRestoreSuccess={() => {
          loadDocumentData();
        }}
      />
    </div>
  );
};

export default MarkdownDetailView;
