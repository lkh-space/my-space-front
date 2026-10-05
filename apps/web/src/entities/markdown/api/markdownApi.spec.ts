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

  it('compareRevisions는 올바른 쿼리 스트링으로 비교 요청을 수행해야 한다', async () => {
    const mockDiff = {
      documentId: 'd1',
      v1: { version: 1, title: 'v1', content: 'A' },
      v2: { version: 2, title: 'v2', content: 'B' },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDiff,
    });

    const res = await api.compareRevisions('d1', 1, 2);
    expect(res).toEqual(mockDiff);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/markdown/documents/d1/revisions/compare?v1=1&v2=2',
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
});
