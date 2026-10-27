import {
  AssetUploadResponse,
  CreateDocumentRequest,
  CreateFolderRequest,
  DocumentDetail,
  DocumentListResponse,
  DocumentQuery,
  FolderTreeNode,
  RevisionCompareResponse,
  RevisionDetail,
  RevisionSummary,
  SearchResponse,
  TagItem,
  UpdateDocumentRequest,
  UpdateFolderRequest,
} from '../model/types';
import {
  deleteRequest,
  getJson,
  patchJson,
  postFormData,
  postJson,
  putJson,
} from '../../../shared/api/client';

const BASE_URL = '/api/v1/markdown';

// ==========================================
// 1. Folders
// ==========================================

export async function fetchFolders(init?: RequestInit): Promise<FolderTreeNode[]> {
  return getJson<FolderTreeNode[]>(`${BASE_URL}/folders`, init);
}

export async function createFolder(
  req: CreateFolderRequest,
): Promise<FolderTreeNode> {
  return postJson<FolderTreeNode>(`${BASE_URL}/folders`, req);
}

export async function updateFolder(
  id: string,
  req: UpdateFolderRequest,
): Promise<FolderTreeNode> {
  return patchJson<FolderTreeNode>(
    `${BASE_URL}/folders/${encodeURIComponent(id)}`,
    req,
  );
}

export async function deleteFolder(id: string): Promise<void> {
  return deleteRequest(`${BASE_URL}/folders/${encodeURIComponent(id)}`);
}

// ==========================================
// 2. Tags
// ==========================================

export async function fetchTags(init?: RequestInit): Promise<TagItem[]> {
  return getJson<TagItem[]>(`${BASE_URL}/tags`, init);
}

// ==========================================
// 3. Documents
// ==========================================

export async function fetchDocuments(
  query: DocumentQuery = {},
  init?: RequestInit,
): Promise<DocumentListResponse> {
  const params = new URLSearchParams();
  if (query.folderId !== undefined && query.folderId !== null) {
    params.set('folderId', query.folderId);
  }
  if (query.tag) {
    params.set('tag', query.tag);
  }
  if (query.page) {
    params.set('page', String(query.page));
  }
  if (query.limit) {
    params.set('limit', String(query.limit));
  }
  if (query.sortBy) {
    params.set('sortBy', query.sortBy);
  }
  if (query.sortOrder) {
    params.set('sortOrder', query.sortOrder);
  }

  const queryStr = params.toString();
  const url = `${BASE_URL}/documents${queryStr ? `?${queryStr}` : ''}`;
  return getJson<DocumentListResponse>(url, init);
}

export async function fetchDocument(
  id: string,
  init?: RequestInit,
): Promise<DocumentDetail> {
  return getJson<DocumentDetail>(
    `${BASE_URL}/documents/${encodeURIComponent(id)}`,
    init,
  );
}

export async function createDocument(
  req: CreateDocumentRequest,
): Promise<DocumentDetail> {
  return postJson<DocumentDetail>(`${BASE_URL}/documents`, req);
}

export async function updateDocument(
  id: string,
  req: UpdateDocumentRequest,
): Promise<DocumentDetail> {
  return putJson<DocumentDetail>(
    `${BASE_URL}/documents/${encodeURIComponent(id)}`,
    req,
  );
}

export async function deleteDocument(id: string): Promise<void> {
  return deleteRequest(`${BASE_URL}/documents/${encodeURIComponent(id)}`);
}

export async function importDocument(
  file: File,
  folderId?: string | null,
): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', folderId);
  }

  return postFormData<DocumentDetail>(`${BASE_URL}/documents/import`, formData);
}

export function getExportMdUrl(id: string): string {
  return `${BASE_URL}/documents/${encodeURIComponent(id)}/export/md`;
}

export function getExportPdfUrl(id: string): string {
  return `${BASE_URL}/documents/${encodeURIComponent(id)}/export/pdf`;
}

/**
 * 마크다운 문서를 PDF 파일로 직접 다운로드합니다.
 * - 클라이언트에서 렌더링된 Mermaid 다이어그램 및 KaTeX 수식 그래픽 자산이 있을 경우 이를 포함하여 고품질 PDF를 생성합니다.
 * - window.print() 인쇄창 대신 브라우저의 기본 파일 다운로드 메커니즘을 트리거합니다.
 */
export async function exportDocumentPdf(
  id: string,
  renderedAssets?: Array<{
    type: string;
    code: string;
    imageBase64: string;
    width?: number;
    height?: number;
  }>,
  customFilename?: string,
): Promise<void> {
  const url = `${BASE_URL}/documents/${encodeURIComponent(id)}/export/pdf`;

  let blob: Blob;
  let filename = customFilename || 'document.pdf';

  if (renderedAssets && renderedAssets.length > 0) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
      },
      body: JSON.stringify({ renderedAssets }),
    });
    if (!res.ok) {
      throw new Error(`PDF 내보내기 실패: ${res.statusText}`);
    }
    const disposition = res.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }
    blob = await res.blob();
  } else {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
      },
    });
    if (!res.ok) {
      throw new Error(`PDF 내보내기 실패: ${res.statusText}`);
    }
    const disposition = res.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }
    blob = await res.blob();
  }

  // 브라우저 파일 다운로드 트리거 (window.print 배제, 순수 파일 저장)
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

export async function exportPdf(id: string): Promise<void> {
  return exportDocumentPdf(id);
}

export function downloadMarkdown(doc: { title: string; content: string }): void {
  const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title || 'document'}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 4. Revisions
// ==========================================

export async function fetchRevisions(
  documentId: string,
): Promise<RevisionSummary[]> {
  return getJson<RevisionSummary[]>(
    `${BASE_URL}/documents/${encodeURIComponent(documentId)}/revisions`,
  );
}

export async function fetchRevision(
  documentId: string,
  version: number,
): Promise<RevisionDetail> {
  return getJson<RevisionDetail>(
    `${BASE_URL}/documents/${encodeURIComponent(documentId)}/revisions/${version}`,
  );
}

export async function compareRevisions(
  documentId: string,
  targetOrV1: number,
  baseOrV2?: number,
): Promise<RevisionCompareResponse> {
  // 백엔드 계약: GET /api/v1/markdown/documents/:documentId/revisions/compare?targetVersion=:targetVersion
  // 백엔드는 ParseIntPipe로 targetVersion을 필수로 검증하므로, 과거 비교 대상 버전을 targetVersion 파라미터로 전달합니다.
  const targetVersion =
    baseOrV2 !== undefined ? Math.min(targetOrV1, baseOrV2) : targetOrV1;

  const res = await getJson<{
    baseVersion: number;
    baseContent: string;
    targetVersion: number;
    targetContent: string;
  }>(
    `${BASE_URL}/documents/${encodeURIComponent(documentId)}/revisions/compare?targetVersion=${targetVersion}`,
  );

  return {
    ...res,
    documentId,
    v1: {
      version: res.targetVersion,
      content: res.targetContent,
    },
    v2: {
      version: res.baseVersion,
      content: res.baseContent,
    },
  };
}

export async function restoreRevision(
  documentId: string,
  version: number,
): Promise<DocumentDetail> {
  return postJson<DocumentDetail>(
    `${BASE_URL}/documents/${encodeURIComponent(documentId)}/revisions/${version}/restore`,
  );
}

// ==========================================
// 5. Search
// ==========================================

export async function searchDocuments(
  q: string,
  page = 1,
  limit = 20,
  init?: RequestInit,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  return getJson<SearchResponse>(`${BASE_URL}/search?${params.toString()}`, init);
}

// ==========================================
// 6. Assets
// ==========================================

export async function uploadAsset(file: File): Promise<AssetUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return postFormData<AssetUploadResponse>(`${BASE_URL}/assets/upload`, formData);
}

// ==========================================
// 7. Unified API Client
// ==========================================

export const markdownApi = {
  fetchFolders,
  getFolders: fetchFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  fetchTags,
  getTags: fetchTags,
  fetchDocuments,
  getDocuments: fetchDocuments,
  fetchDocument,
  getDocument: fetchDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadMarkdown,
  exportPdf,
  importDocument,
  fetchRevisions,
  compareRevisions,
  restoreRevision,
  searchDocuments,
  uploadAsset,
};
