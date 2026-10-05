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
import { getJson, postFormData } from '../../../shared/api/client';

const BASE_URL = '/api/v1/markdown';

// ==========================================
// 1. Folders
// ==========================================

export async function fetchFolders(): Promise<FolderTreeNode[]> {
  return getJson<FolderTreeNode[]>(`${BASE_URL}/folders`);
}

export async function createFolder(
  req: CreateFolderRequest,
): Promise<FolderTreeNode> {
  const res = await fetch(`${BASE_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '폴더 생성 실패');
  }
  return res.json();
}

export async function updateFolder(
  id: string,
  req: UpdateFolderRequest,
): Promise<FolderTreeNode> {
  const res = await fetch(`${BASE_URL}/folders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '폴더 수정 실패');
  }
  return res.json();
}

export async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/folders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '폴더 삭제 실패');
  }
}

// ==========================================
// 2. Tags
// ==========================================

export async function fetchTags(): Promise<TagItem[]> {
  return getJson<TagItem[]>(`${BASE_URL}/tags`);
}

// ==========================================
// 3. Documents
// ==========================================

export async function fetchDocuments(
  query: DocumentQuery = {},
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
  return getJson<DocumentListResponse>(url);
}

export async function fetchDocument(id: string): Promise<DocumentDetail> {
  return getJson<DocumentDetail>(
    `${BASE_URL}/documents/${encodeURIComponent(id)}`,
  );
}

export async function createDocument(
  req: CreateDocumentRequest,
): Promise<DocumentDetail> {
  const res = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '문서 생성 실패');
  }
  return res.json();
}

export async function updateDocument(
  id: string,
  req: UpdateDocumentRequest,
): Promise<DocumentDetail> {
  const res = await fetch(`${BASE_URL}/documents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '문서 저장 실패');
  }
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '문서 삭제 실패');
  }
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

export async function exportPdf(id: string): Promise<void> {
  const url = getExportPdfUrl(id);
  window.open(url, '_blank');
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
  v1: number,
  v2: number,
): Promise<RevisionCompareResponse> {
  return getJson<RevisionCompareResponse>(
    `${BASE_URL}/documents/${encodeURIComponent(documentId)}/revisions/compare?v1=${v1}&v2=${v2}`,
  );
}

export async function restoreRevision(
  documentId: string,
  version: number,
): Promise<DocumentDetail> {
  const res = await fetch(
    `${BASE_URL}/documents/${encodeURIComponent(documentId)}/revisions/${version}/restore`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '버전 복원 실패');
  }
  return res.json();
}

// ==========================================
// 5. Search
// ==========================================

export async function searchDocuments(
  q: string,
  page = 1,
  limit = 20,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  return getJson<SearchResponse>(`${BASE_URL}/search?${params.toString()}`);
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

