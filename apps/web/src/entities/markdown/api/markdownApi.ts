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
