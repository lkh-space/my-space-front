import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import {
  DocumentDetail,
  DocumentSummary,
  FolderTreeNode,
  TagItem,
  deleteDocument,
  deleteFolder,
  exportDocumentPdf,
  fetchDocument,
  fetchDocuments,
  fetchFolders,
  fetchTags,
  importDocument,
  searchDocuments,
} from '../../../entities/markdown';
import { FolderFormModal } from '../../../features/markdown/folder/FolderFormModal';
import { DocumentInspector } from '../components/DocumentInspector';
import { LibrarySidebar } from '../components/LibrarySidebar';
import { DocumentCardItem } from '../components/DocumentCardItem';

type SortField = 'updatedAt' | 'createdAt' | 'title';
const VALID_SORT_FIELDS: readonly SortField[] = ['updatedAt', 'createdAt', 'title'];

function isSortField(value: string): value is SortField {
  return (VALID_SORT_FIELDS as readonly string[]).includes(value);
}

export const DocumentLibraryView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 1. Data States
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [untaggedCount, setUntaggedCount] = useState<number>(0);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocDetail, setSelectedDocDetail] = useState<DocumentDetail | null>(null);

  // 2. Filter & Query States
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterTab, setFilterTab] = useState<'all' | 'recent' | 'starred'>('all');

  // 3. UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [targetFolderForEdit, setTargetFolderForEdit] = useState<FolderTreeNode | null>(null);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 검색어 입력 디바운스 (빈 문자열은 즉시 반영, 입력 중에는 250ms 디바운스)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedSearchQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 폴더 & 태그 불러오기
  const reloadFoldersAndTags = useCallback(async () => {
    try {
      const [foldersRes, tagsRes, untaggedDocsRes] = await Promise.all([
        fetchFolders().catch(() => []),
        fetchTags().catch(() => []),
        fetchDocuments({ tag: '__untagged__', limit: 1 }).catch(() => ({ total: 0 })),
      ]);
      setFolders(foldersRes);
      setTags(tagsRes);
      setUntaggedCount(untaggedDocsRes.total);
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    reloadFoldersAndTags();
  }, [reloadFoldersAndTags]);

  // 문서 목록 조회 (selectedDocId 의존성 제거로 중복 API 호출 차단)
  const reloadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      if (debouncedSearchQuery) {
        const searchRes = await searchDocuments(debouncedSearchQuery);
        const mapped: DocumentSummary[] = searchRes.items.map((item) => ({
          id: item.id,
          title: item.title,
          folderId: item.folderId,
          folderName: null,
          currentVersion: 1,
          tags: item.tags,
          createdAt: item.updatedAt,
          updatedAt: item.updatedAt,
        }));
        setDocuments(mapped);
        setSelectedDocId((prevId) =>
          prevId && mapped.some((d) => d.id === prevId)
            ? prevId
            : mapped[0]?.id ?? null,
        );
      } else {
        const docsRes = await fetchDocuments({
          folderId: selectedFolderId,
          tag: selectedTag || undefined,
          sortBy,
          limit: 50,
        });
        setDocuments(docsRes.items);
        setSelectedDocId((prevId) =>
          prevId && docsRes.items.some((d) => d.id === prevId)
            ? prevId
            : docsRes.items[0]?.id ?? null,
        );
      }
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolderId, selectedTag, sortBy, debouncedSearchQuery]);

  useEffect(() => {
    reloadDocuments();
  }, [reloadDocuments]);

  // 선택된 문서의 상세 정보 로드 (Inspector용)
  useEffect(() => {
    if (!selectedDocId) {
      setSelectedDocDetail(null);
      return;
    }
    let isMounted = true;
    fetchDocument(selectedDocId)
      .then((detail) => {
        if (isMounted) setSelectedDocDetail(detail);
      })
      .catch(() => {
        if (isMounted) setSelectedDocDetail(null);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDocId]);

  // 탭(all / recent / starred) 필터 적용 목록
  const displayedDocuments = useMemo(() => {
    if (filterTab === 'recent') {
      return [...documents]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);
    }
    return documents;
  }, [documents, filterTab]);

  // .md 파일 가져오기
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const created = await importDocument(file, selectedFolderId);
      await Promise.all([reloadFoldersAndTags(), reloadDocuments()]);
      setSelectedDocId(created.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t('markdownDocs.library.importFailed');
      alert(msg);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // 문서 삭제
  const handleDeleteDoc = useCallback(
    async (id: string) => {
      if (!window.confirm(t('markdownDocs.library.confirmDeleteDoc'))) return;
      try {
        await deleteDocument(id);
        setSelectedDocId((prev) => (prev === id ? null : prev));
        await Promise.all([reloadFoldersAndTags(), reloadDocuments()]);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : t('markdownDocs.library.deleteDocFailed');
        alert(msg);
      }
    },
    [reloadDocuments, reloadFoldersAndTags, t],
  );

  // 폴더 삭제
  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      if (!window.confirm(t('markdownDocs.library.confirmDeleteFolder')))
        return;
      try {
        await deleteFolder(folderId);
        setSelectedFolderId((prev) => (prev === folderId ? null : prev));
        await reloadFoldersAndTags();
        await reloadDocuments();
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : t('markdownDocs.library.deleteFolderFailed');
        alert(msg);
      }
    },
    [reloadDocuments, reloadFoldersAndTags, t],
  );

  const handleOpenCreateFolderModal = useCallback((parentId?: string | null) => {
    setTargetFolderForEdit(null);
    setCreateFolderParentId(parentId ?? null);
    setIsFolderModalOpen(true);
  }, []);

  const handleOpenEditFolderModal = useCallback((folder: FolderTreeNode) => {
    setTargetFolderForEdit(folder);
    setIsFolderModalOpen(true);
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* PANE 1: Sub-sidebar / Folder & Tag Navigation Panel */}
      <LibrarySidebar
        folders={folders}
        tags={tags}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        documentCount={documents.length}
        untaggedCount={untaggedCount}
        onSelectFolder={(fId) => {
          setSelectedFolderId(fId);
          setSelectedTag(null); // 폴더 탐색 시 태그 필터 해제하여 전체 문서 접근 보장
        }}
        onSelectTag={(tagName) => {
          setSelectedTag(tagName);
          if (tagName) {
            setSelectedFolderId(null); // 태그 필터 활성화 시 폴더 제한을 해제하여 해당 태그의 모든 문서 표출
            setFilterTab('all'); // 특정 탭(starred 등)으로 인한 문서 숨김 방지
          }
        }}
        onOpenCreateFolderModal={handleOpenCreateFolderModal}
        onOpenEditFolderModal={handleOpenEditFolderModal}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* PANE 2: Main Document Library & List Area */}
      <section className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Top Action Bar */}
        <div className="p-3 border-b border-outline-variant bg-surface flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, markdown body (#header), or tags..."
                className="w-full h-8 pl-8 pr-16 bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-outline text-body-sm font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-[10px] text-outline font-mono">
                  ⌘F
                </span>
              </div>
            </div>

            {/* Markdown Import Button */}
            <label className="h-8 px-2.5 flex items-center gap-1.5 bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container rounded text-label-md font-label-md cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[16px]">
                file_upload
              </span>
              <span>
                {isImporting
                  ? t('markdownDocs.library.importing')
                  : t('markdownDocs.library.importMd')}
              </span>
              <input
                type="file"
                accept=".md,.markdown"
                className="hidden"
                disabled={isImporting}
                onChange={handleImportFile}
              />
            </label>

            {/* Primary CTA: 새 문서 작성 */}
            <button
              type="button"
              onClick={() => {
                const targetUrl = selectedFolderId
                  ? `/docs/new?folderId=${selectedFolderId}`
                  : '/docs/new';
                navigate(targetUrl);
              }}
              className="h-8 px-3 flex items-center gap-1.5 bg-on-background text-surface font-medium hover:bg-surface-bright hover:text-on-surface rounded text-label-md font-label-md transition-colors shadow-none"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>{t('markdownDocs.library.newDocument')}</span>
            </button>
          </div>

          {/* Filter Chips & Sort Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-label-sm font-label-sm text-outline mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => {
                  setFilterTab('all');
                  setSelectedFolderId(null);
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className={`px-2 py-0.5 rounded text-label-sm font-label-sm transition-colors ${
                  filterTab === 'all' && !selectedFolderId && !selectedTag && !searchQuery
                    ? 'bg-surface-container-highest text-on-surface border border-outline-variant'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                All ({documents.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('recent')}
                className={`px-2 py-0.5 rounded text-label-sm font-label-sm transition-colors ${
                  filterTab === 'recent'
                    ? 'bg-surface-container-highest text-on-surface border border-outline-variant'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                Recent
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('starred')}
                className={`px-2 py-0.5 rounded text-label-sm font-label-sm transition-colors flex items-center gap-1 ${
                  filterTab === 'starred'
                    ? 'bg-surface-container-highest text-on-surface border border-outline-variant'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] text-tertiary">
                  star
                </span>
                <span>Starred</span>
              </button>

              {selectedTag && (
                <>
                  <div className="h-3 w-[1px] bg-outline-variant mx-1" />
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-label-sm font-label-sm">
                    {selectedTag === '__untagged__' ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px]">label_off</span>
                        <span>{t('markdownDocs.common.untagged')}</span>
                      </span>
                    ) : (
                      <span>Tag: #{selectedTag}</span>
                    )}
                    <span
                      className="material-symbols-outlined text-[12px] cursor-pointer hover:text-on-surface"
                      onClick={() => setSelectedTag(null)}
                    >
                      close
                    </span>
                  </div>
                </>
              )}

              {searchQuery && (
                <>
                  <div className="h-3 w-[1px] bg-outline-variant mx-1" />
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-label-sm font-label-sm">
                    <span>Match: "{searchQuery}"</span>
                    <span
                      className="material-symbols-outlined text-[12px] cursor-pointer hover:text-on-surface"
                      onClick={() => setSearchQuery('')}
                    >
                      close
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Sort & View Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-label-sm font-label-sm text-outline">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    if (isSortField(e.target.value)) {
                      setSortBy(e.target.value);
                    }
                  }}
                  className="bg-transparent border-0 text-on-surface font-medium focus:outline-none cursor-pointer"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Created</option>
                  <option value="title">Title</option>
                </select>
              </div>

              <div className="flex items-center border border-outline-variant rounded p-0.5 bg-surface-container-low">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-surface-container text-on-surface'
                      : 'text-outline hover:text-on-surface'
                  }`}
                  title="List View"
                >
                  <span className="material-symbols-outlined text-[15px]">list</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-surface-container text-on-surface'
                      : 'text-outline hover:text-on-surface'
                  }`}
                  title="Grid View"
                >
                  <span className="material-symbols-outlined text-[15px]">grid_view</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Document List Body */}
        <div
          className={`flex-1 overflow-y-auto p-space-md ${
            viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3 content-start' : 'space-y-2'
          }`}
        >
          {isLoading && (
            <div className="p-8 text-center text-label-sm font-label-sm text-outline col-span-full">
              {t('markdownDocs.library.loadingList')}
            </div>
          )}

          {!isLoading && displayedDocuments.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-center col-span-full">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">
                description
              </span>
              <p className="text-body-md font-body-md text-on-surface-variant mb-3">
                {t('markdownDocs.library.emptyList')}
              </p>
              <button
                type="button"
                onClick={() => {
                  const targetUrl = selectedFolderId
                    ? `/docs/new?folderId=${selectedFolderId}`
                    : '/docs/new';
                  navigate(targetUrl);
                }}
                className="h-8 px-3 rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface text-label-md font-label-md border border-outline-variant transition-colors"
              >
                {t('markdownDocs.library.createFirstDoc')}
              </button>
            </div>
          )}

          {displayedDocuments.map((doc) => {
            const isSelected = selectedDocId === doc.id;
            const isDetailLoaded = doc.id === selectedDocId && selectedDocDetail;
            const snippet = isDetailLoaded
              ? selectedDocDetail.content.replace(/^#+.*$/gm, '').trim().slice(0, 140)
              : t('markdownDocs.library.defaultSnippet');
            const wordCountLabel = isDetailLoaded
              ? `${(selectedDocDetail.content.trim() ? selectedDocDetail.content.trim().split(/\s+/).length : 0).toLocaleString()} words`
              : '1,420 words';

            return (
              <DocumentCardItem
                key={doc.id}
                doc={doc}
                isSelected={isSelected}
                snippet={snippet}
                wordCountLabel={wordCountLabel}
                onSelect={setSelectedDocId}
              />
            );
          })}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-7 border-t border-outline-variant bg-surface-container-lowest px-3 flex items-center justify-between text-label-sm font-label-sm text-outline font-mono shrink-0">
          <div>
            {t('markdownDocs.library.selectedPrefix')}
            {selectedDocDetail
              ? selectedDocDetail.title
              : t('markdownDocs.library.noneSelected')}
          </div>
          <div>
            {t('markdownDocs.library.totalDocsCount', {
              count: displayedDocuments.length,
            })}
          </div>
        </div>
      </section>

      {/* PANE 3: Quick Details Preview Pane & Inspector */}
      <DocumentInspector
        document={selectedDocDetail}
        onEdit={(id) => navigate(`/docs/${id}/edit`)}
        onRead={(id) => navigate(`/docs/${id}`)}
        onExportPdf={async (id) => {
          try {
            await exportDocumentPdf(id, undefined, `${selectedDocDetail?.title || 'document'}.pdf`);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'PDF 다운로드에 실패했습니다.';
            alert(msg);
          }
        }}
        onDelete={handleDeleteDoc}
      />

      {/* Folder Create/Edit Modal */}
      <FolderFormModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSuccess={() => {
          reloadFoldersAndTags();
          reloadDocuments();
        }}
        folders={folders}
        targetFolder={targetFolderForEdit}
        initialParentId={createFolderParentId}
      />
    </div>
  );
};

export default DocumentLibraryView;
