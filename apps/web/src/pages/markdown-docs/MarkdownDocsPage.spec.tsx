import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MarkdownDocsPage } from './MarkdownDocsPage';

const { mockFolders, mockTags, mockDocs, mockDocDetail } = vi.hoisted(() => {
  return {
    mockFolders: [
      { id: 'f-1', name: '아키텍처', parentId: null, createdAt: '', updatedAt: '', children: [] },
    ],
    mockTags: [
      { id: 't-1', name: 'architecture', documentCount: 3 },
    ],
    mockDocs: [
      {
        id: 'doc-1',
        title: '시스템 아키텍처 명세서',
        folderId: 'f-1',
        folderName: '아키텍처',
        tags: ['architecture'],
        currentVersion: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    mockDocDetail: {
      id: 'doc-1',
      title: '시스템 아키텍처 명세서',
      folderId: 'f-1',
      tags: ['architecture'],
      content: '# 시스템 아키텍처 명세서\n본문 내용입니다.',
      currentVersion: 2,
      frontmatter: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
});

// Mock markdown entity & api
vi.mock('../../entities/markdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../entities/markdown')>();
  const fetchFolders = vi.fn().mockResolvedValue(mockFolders);
  const fetchTags = vi.fn().mockResolvedValue(mockTags);
  const fetchDocuments = vi.fn().mockResolvedValue({ items: mockDocs, total: 1 });
  const fetchDocument = vi.fn().mockResolvedValue(mockDocDetail);
  const searchDocuments = vi.fn().mockResolvedValue({ items: [], total: 0 });
  const deleteDocument = vi.fn().mockResolvedValue(undefined);
  const createDocument = vi.fn().mockResolvedValue({ id: 'new-doc', title: '새 문서' });
  const updateDocument = vi.fn().mockResolvedValue({ id: 'doc-1', title: '시스템 아키텍처 명세서' });
  const exportPdf = vi.fn().mockResolvedValue(undefined);
  const downloadMarkdown = vi.fn();

  return {
    ...actual,
    fetchFolders,
    fetchTags,
    fetchDocuments,
    fetchDocument,
    searchDocuments,
    deleteDocument,
    createDocument,
    updateDocument,
    exportPdf,
    downloadMarkdown,
    markdownApi: {
      fetchFolders,
      getFolders: fetchFolders,
      fetchTags,
      getTags: fetchTags,
      fetchDocuments,
      getDocuments: fetchDocuments,
      fetchDocument,
      getDocument: fetchDocument,
      searchDocuments,
      deleteDocument,
      createDocument,
      updateDocument,
      exportPdf,
      downloadMarkdown,
    },
  };
});

describe('MarkdownDocsPage Component & Sub-routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    if (typeof Range !== 'undefined') {
      Range.prototype.getClientRects = () =>
        ({
          item: () => null,
          length: 0,
          [Symbol.iterator]: () => [][Symbol.iterator](),
        } as unknown as DOMRectList);
      Range.prototype.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          toJSON: () => ({ x: 0, y: 0 }),
        } as DOMRect);
    }
  });

  it('/docs 경로에서 DocumentLibraryView가 정상 마운트되어 문서 목록을 표출해야 한다', async () => {
    render(
      <MemoryRouter initialEntries={['/docs']}>
        <Routes>
          <Route path="docs/*" element={<MarkdownDocsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('새 문서 작성')).toBeTruthy();
      expect(screen.getByText('Import .md')).toBeTruthy();
      expect(screen.getAllByText('시스템 아키텍처 명세서').length).toBeGreaterThan(0);
      expect(screen.getByText('아키텍처')).toBeTruthy();
    });
  });

  it(
    '/docs/new 경로에서 MarkdownEditorView가 정상 마운트되어야 한다',
    async () => {
      render(
        <MemoryRouter initialEntries={['/docs/new']}>
          <Routes>
            <Route path="docs/*" element={<MarkdownDocsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('저장 (Save)')).toBeTruthy();
        expect(screen.getByText('Live Render Canvas')).toBeTruthy();
        expect(screen.getByText('GFM + KaTeX + Mermaid')).toBeTruthy();
      });
    },
    15000
  );

  it('/docs/doc-1 경로에서 MarkdownDetailView(독서 모드)가 마운트되어야 한다', async () => {
    render(
      <MemoryRouter initialEntries={['/docs/doc-1']}>
        <Routes>
          <Route path="docs/*" element={<MarkdownDocsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('시스템 아키텍처 명세서').length).toBeGreaterThan(0);
      expect(screen.getByText('수정하기')).toBeTruthy();
      expect(screen.getByText('v2 이력')).toBeTruthy();
      expect(screen.getByText('On This Page')).toBeTruthy();
    });
  });

  describe('에디터 비즈니스 인터랙션 및 저장 흐름 (P1)', () => {
    it('/docs/new 에서 저장 버튼 클릭 시 createDocument가 호출되어야 한다', async () => {
      const markdown = await import('../../entities/markdown');
      const createSpy = vi.spyOn(markdown, 'createDocument').mockResolvedValueOnce({
        id: 'new-doc-123',
        title: '새 문서',
        folderId: null,
        tags: [],
        content: '',
        currentVersion: 1,
        frontmatter: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(
        <MemoryRouter initialEntries={['/docs/new']}>
          <Routes>
            <Route path="docs/*" element={<MarkdownDocsPage />} />
          </Routes>
        </MemoryRouter>
      );

      const saveBtn = await screen.findByRole('button', { name: /저장 \(Save\)/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('/docs/doc-1/edit 에서 수정 후 저장 클릭 시 updateDocument가 호출되어야 한다', async () => {
      const markdown = await import('../../entities/markdown');
      const updateSpy = vi.spyOn(markdown, 'updateDocument').mockResolvedValueOnce({
        id: 'doc-1',
        title: '수정된 아키텍처 명세서',
        folderId: 'f-1',
        tags: ['architecture'],
        content: '수정된 내용',
        currentVersion: 3,
        frontmatter: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(
        <MemoryRouter initialEntries={['/docs/doc-1/edit']}>
          <Routes>
            <Route path="docs/*" element={<MarkdownDocsPage />} />
          </Routes>
        </MemoryRouter>
      );

      const saveBtn = await screen.findByRole('button', { name: /저장 \(Save\)/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith('doc-1', expect.objectContaining({
          folderId: 'f-1',
        }));
      });
    });

    it('저장 실패 시 alert를 호출하고 버튼이 다시 활성화되어야 한다', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
      const markdown = await import('../../entities/markdown');
      vi.spyOn(markdown, 'createDocument').mockRejectedValueOnce(new Error('서버 저장 실패'));

      render(
        <MemoryRouter initialEntries={['/docs/new']}>
          <Routes>
            <Route path="docs/*" element={<MarkdownDocsPage />} />
          </Routes>
        </MemoryRouter>
      );

      const saveBtn = await screen.findByRole('button', { name: /저장 \(Save\)/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('서버 저장 실패');
      });
      expect(saveBtn.hasAttribute('disabled')).toBe(false);
    });
  });
});

