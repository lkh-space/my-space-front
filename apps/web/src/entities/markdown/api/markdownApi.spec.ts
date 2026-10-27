import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from './markdownApi';

describe('markdownApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchFolders는 GET /api/v1/markdown/folders를 호출해야 한다', async () => {
    const mockData = [{ id: 'f1', name: 'Docs', parentId: null, children: [] }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const res = await api.fetchFolders();
    expect(res).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/markdown/folders', expect.anything());
  });

  it('fetchDocuments는 쿼리 파라미터를 올바르게 인코딩하여 호출해야 한다', async () => {
    const mockData = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const res = await api.fetchDocuments({
      folderId: 'f1',
      tag: 'arch',
      page: 2,
      sortBy: 'title',
    });

    expect(res).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/markdown/documents?folderId=f1&tag=arch&page=2&sortBy=title',
      expect.anything(),
    );
  });

  it('createDocument는 POST /api/v1/markdown/documents를 올바른 payload로 전송해야 한다', async () => {
    const mockCreated = { id: 'd1', title: 'New Doc', content: '# Hello' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCreated,
    });

    const res = await api.createDocument({
      title: 'New Doc',
      content: '# Hello',
    });

    expect(res).toEqual(mockCreated);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/markdown/documents',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New Doc', content: '# Hello' }),
      }),
    );
  });

  it('compareRevisions는 targetVersion 쿼리 스트링으로 비교 요청을 수행해야 한다', async () => {
    const mockBackendDto = {
      baseVersion: 2,
      baseContent: 'B',
      targetVersion: 1,
      targetContent: 'A',
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBackendDto,
    });

    const res = await api.compareRevisions('d1', 1, 2);
    expect(res.baseVersion).toBe(2);
    expect(res.targetVersion).toBe(1);
    expect(res.v1?.content).toBe('A');
    expect(res.v2?.content).toBe('B');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/markdown/documents/d1/revisions/compare?targetVersion=1',
      expect.anything(),
    );
  });

  it('searchDocuments는 /api/v1/markdown/search?q=...를 호출해야 한다', async () => {
    const mockSearchRes = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchRes,
    });

    const res = await api.searchDocuments('test query');
    expect(res).toEqual(mockSearchRes);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/markdown/search?q=test+query&page=1&limit=20',
      expect.anything(),
    );
  });

  it('exportDocumentPdf는 자산이 있을 때 POST로 PDF를 요청하고 다운로드를 트리거해야 한다', async () => {
    const mockBlob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (h: string) => (h === 'Content-Disposition' ? 'attachment; filename="doc.pdf"' : null),
      },
      blob: async () => mockBlob,
    });

    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const elem = origCreateElement(tag);
      if (tag === 'a') {
        elem.click = mockClick;
      }
      return elem;
    });

    await api.exportDocumentPdf('d1', [
      {
        type: 'mermaid',
        code: 'graph TD',
        imageBase64: 'data:image/png;base64,123',
        width: 100,
        height: 50,
      },
    ]);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/markdown/documents/d1/export/pdf',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(mockClick).toHaveBeenCalled();
  });
});
