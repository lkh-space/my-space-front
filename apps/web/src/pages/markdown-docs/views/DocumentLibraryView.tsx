import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentDetail,
  DocumentSummary,
  FolderTreeNode,
  TagItem,
  deleteDocument,
  deleteFolder,
  fetchDocument,
  fetchDocuments,
  fetchFolders,
  fetchTags,
  getExportPdfUrl,
  importDocument,
  searchDocuments,
} from '../../../entities/markdown';
import { FolderTree } from '../../../features/markdown/folder/FolderTree';
import { FolderFormModal } from '../../../features/markdown/folder/FolderFormModal';
import { DocumentInspector } from '../components/DocumentInspector';

export const DocumentLibraryView: React.FC = () => {
  const navigate = useNavigate();

  // 1. Data States
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocDetail, setSelectedDocDetail] = useState<DocumentDetail | null>(null);

  // 2. Filter & Query States
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterTab, setFilterTab] = useState<'all' | 'recent' | 'starred'>('all');

  // 3. UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [targetFolderForEdit, setTargetFolderForEdit] = useState<FolderTreeNode | null>(null);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 폴더 & 태그 불러오기
  const reloadFoldersAndTags = useCallback(async () => {
    try {
      const [foldersRes, tagsRes] = await Promise.all([
        fetchFolders().catch(() => []),
        fetchTags().catch(() => []),
      ]);
      setFolders(foldersRes);
      setTags(tagsRes);
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    reloadFoldersAndTags();
  }, [reloadFoldersAndTags]);

  // 문서 목록 조회
  const reloadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      if (searchQuery.trim()) {
        const searchRes = await searchDocuments(searchQuery.trim());
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
        if (mapped.length > 0 && !selectedDocId) {
          setSelectedDocId(mapped[0].id);
        }
      } else {
        const docsRes = await fetchDocuments({
          folderId: selectedFolderId,
          tag: selectedTag || undefined,
          sortBy,
          limit: 50,
        });
        setDocuments(docsRes.items);
        if (docsRes.items.length > 0 && !selectedDocId) {
          setSelectedDocId(docsRes.items[0].id);
        }
      }
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolderId, selectedTag, sortBy, searchQuery, selectedDocId]);

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

  // .md 파일 가져오기
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const created = await importDocument(file, selectedFolderId);
      await reloadDocuments();
      setSelectedDocId(created.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '파일 가져오기에 실패했습니다.';
      alert(msg);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // 문서 삭제
  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm('정말 이 문서를 삭제하시겠습니까?')) return;
    try {
      await deleteDocument(id);
      setSelectedDocId(null);
      await reloadDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '문서 삭제 실패';
      alert(msg);
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm('폴더를 삭제하시겠습니까? (하위 문서는 미분류 상태로 보존됩니다)'))
      return;
    try {
      await deleteFolder(folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      await reloadFoldersAndTags();
      await reloadDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '폴더 삭제 실패';
      alert(msg);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* ========================================================================= */}
      {/* PANE 1: Sub-sidebar / Folder & Tag Navigation Panel (256px)               */}
      {/* ========================================================================= */}
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
                onClick={() => {
                  setTargetFolderForEdit(null);
                  setCreateFolderParentId(null);
                  setIsFolderModalOpen(true);
                }}
              >
                <span className="material-symbols-outlined text-[14px]">
                  create_new_folder
                </span>
              </button>
            </div>

            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={(fId) => setSelectedFolderId(fId)}
              onOpenCreateModal={(pId) => {
                setTargetFolderForEdit(null);
                setCreateFolderParentId(pId ?? null);
                setIsFolderModalOpen(true);
              }}
              onOpenEditModal={(folder) => {
                setTargetFolderForEdit(folder);
                setIsFolderModalOpen(true);
              }}
              onDeleteFolder={handleDeleteFolder}
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
                    onClick={() => setSelectedTag(isTagActive ? null : t.name)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm transition-colors ${
                      isTagActive
                        ? 'bg-primary/10 border border-primary/40 text-primary font-medium'
                        : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span>#{t.name}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded ${
                        isTagActive ? 'bg-primary/20 text-primary' : 'text-outline bg-surface-container-high'
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

        {/* Bottom Cache/Storage Stats (Stitch Exact Match) */}
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
          {/* Progress Bar */}
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mb-1.5">
            <div className="bg-primary h-full w-[28%] rounded-full" />
          </div>
          <div className="flex justify-between text-label-sm font-label-sm text-outline font-mono">
            <span>18.4 MB of 64 MB cached</span>
            <span>{documents.length} Docs</span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* PANE 2: Main Document Library & List Area                                */}
      {/* ========================================================================= */}
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
              <span>{isImporting ? '가져오는 중...' : 'Import .md'}</span>
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
              onClick={() => navigate('/docs/new')}
              className="h-8 px-3 flex items-center gap-1.5 bg-on-background text-surface font-medium hover:bg-surface-bright hover:text-on-surface rounded text-label-md font-label-md transition-colors shadow-none"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>새 문서 작성</span>
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

              {/* Active Filter Indicators */}
              {selectedTag && (
                <>
                  <div className="h-3 w-[1px] bg-outline-variant mx-1" />
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-label-sm font-label-sm">
                    <span>Tag: #{selectedTag}</span>
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
                  onChange={(e) =>
                    setSortBy(e.target.value as 'updatedAt' | 'createdAt' | 'title')
                  }
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

        {/* Document List Body with Stitch Cards */}
        <div className="flex-1 overflow-y-auto p-space-md space-y-2">
          {isLoading && (
            <div className="p-8 text-center text-label-sm font-label-sm text-outline">
              문서 목록을 불러오는 중...
            </div>
          )}

          {!isLoading && documents.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">
                description
              </span>
              <p className="text-body-md font-body-md text-on-surface-variant mb-3">
                작성된 문서가 없습니다.
              </p>
              <button
                type="button"
                onClick={() => navigate('/docs/new')}
                className="h-8 px-3 rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface text-label-md font-label-md border border-outline-variant transition-colors"
              >
                첫 문서 작성하기
              </button>
            </div>
          )}

          {documents.map((doc) => {
            const isSelected = selectedDocId === doc.id;
            const snippet =
              doc.id === selectedDocId && selectedDocDetail
                ? selectedDocDetail.content.replace(/^#+.*$/gm, '').trim().slice(0, 140)
                : 'Edge Worker 및 MinIO 기반의 고성능 문서 파이프라인. 오프라인 로컬 캐시와 실시간 동기화를 지원합니다.';

            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
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
                      <span className="text-outline text-label-sm font-label-sm">#general</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-outline font-mono">
                    <span>1,420 words</span>
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
          })}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-7 border-t border-outline-variant bg-surface-container-lowest px-3 flex items-center justify-between text-label-sm font-label-sm text-outline font-mono shrink-0">
          <div>선택: {selectedDocDetail ? selectedDocDetail.title : '선택 없음'}</div>
          <div>총 {documents.length}개 문서</div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PANE 3: Quick Details Preview Pane & Inspector (288px)                    */}
      {/* ========================================================================= */}
      <DocumentInspector
        document={selectedDocDetail}
        onEdit={(id) => navigate(`/docs/${id}/edit`)}
        onRead={(id) => navigate(`/docs/${id}`)}
        onExportPdf={(id) => window.open(getExportPdfUrl(id), '_blank')}
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
