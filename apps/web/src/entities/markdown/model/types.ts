// ==========================================
// 1. Folder (계층형 폴더)
// ==========================================
export interface FolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children: FolderTreeNode[];
}

export type FolderDto = FolderTreeNode;

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
}

// ==========================================
// 2. Tag (태그)
// ==========================================
export interface TagItem {
  id: string;
  name: string;
  documentCount: number;
}

// ==========================================
// 3. Document (문서)
// ==========================================
export interface DocumentSummary {
  id: string;
  title: string;
  folderId: string | null;
  folderName: string | null;
  currentVersion: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail {
  id: string;
  title: string;
  content: string; // MinIO에서 불러온 원문 마크다운 본문
  frontmatter: Record<string, unknown>; // 파싱된 YAML 메타데이터
  folderId: string | null;
  currentVersion: number;
  version?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentListResponse {
  items: DocumentSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateDocumentRequest {
  title?: string;
  content: string;
  folderId?: string | null;
  tags?: string[];
  frontmatter?: Record<string, unknown>;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  folderId?: string | null;
  tags?: string[];
  frontmatter?: Record<string, unknown>;
}

export interface DocumentQuery {
  folderId?: string | null;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ==========================================
// 4. Revision (수정 이력)
// ==========================================
export interface RevisionSummary {
  id: string;
  documentId: string;
  version: number;
  title: string;
  createdAt: string;
}

export interface RevisionDetail {
  id: string;
  documentId: string;
  version: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface RevisionCompareResponse {
  documentId: string;
  v1: {
    version: number;
    title: string;
    content: string;
    createdAt: string;
  };
  v2: {
    version: number;
    title: string;
    content: string;
    createdAt: string;
  };
}

// ==========================================
// 5. Search (OpenSearch 검색)
// ==========================================
export interface SearchItem {
  id: string;
  title: string;
  folderId: string | null;
  tags: string[];
  snippet: string; // 검색어 주변 100자 스니펫 (<mark> 하이라이트 포함)
  updatedAt: string;
}

export interface SearchResponse {
  items: SearchItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// 6. Asset (이미지/첨부파일)
// ==========================================
export interface AssetUploadResponse {
  url: string; // 예: /api/v1/markdown/assets/images/...
  key: string;
  filename: string;
  size: number;
  contentType: string;
}
