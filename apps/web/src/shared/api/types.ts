/**
 * 백엔드 공통 API 에러 응답 객체 인터페이스
 * (PDF_API_SPEC.md 4.1절 참조)
 */
export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
  details?: Record<string, unknown>;
}

/**
 * PDF 메타데이터 인터페이스
 */
export interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

/**
 * PDF 검사 결과 응답 인터페이스 (POST /api/v1/pdf/inspect)
 */
export interface InspectPdfResponse {
  /** 암호화 보호 여부 */
  isEncrypted: boolean;
  /** 제공된 비밀번호 일치 여부 (암호화되지 않은 파일은 undefined) */
  isPasswordValid?: boolean;
  /** 문서 총 페이지 수 (복호화 성공 시 또는 일반 파일일 때 반환) */
  pageCount?: number;
  /** 문서 메타데이터 (복호화 성공 시 또는 일반 파일일 때 반환) */
  metadata?: PdfMetadata;
}

/**
 * 바이너리 다운로드 결과 객체
 */
export interface DownloadResult {
  blob: Blob;
  filename: string;
}

/**
 * 백엔드 도메인 비즈니스 에러 래핑 클래스
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly timestamp: string;
  readonly path: string;
  readonly details?: Record<string, unknown>;

  constructor(errorResponse: ApiErrorResponse) {
    super(errorResponse.message);
    this.name = 'ApiError';
    this.statusCode = errorResponse.statusCode;
    this.code = errorResponse.code;
    this.timestamp = errorResponse.timestamp;
    this.path = errorResponse.path;
    this.details = errorResponse.details;
  }
}
