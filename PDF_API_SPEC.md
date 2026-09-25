# PDF 유틸리티 API 명세서 (API Specification)

본 문서는 백엔드에 구현된 PDF 조작 유틸리티 API의 엔드포인트 규격, 파라미터, 응답 데이터 및 에러 코드 명세입니다.

---

## 1. 공통 규약

- **Content-Type**: 모든 요청은 파일 업로드를 포함하므로 `multipart/form-data` 포맷을 사용합니다.
- **페이지 번호 규격**: **1-based 인덱스** (첫 번째 페이지는 1)
- **파일 제약 사항**:
  - 단일 파일 최대 용량: **50MB**
  - 복수 파일 총합 최대 용량: **100MB**
  - 유효한 PDF 파일 시그니처(`%PDF-`) 필수

---

## 2. 데이터 모델 및 인터페이스 (TypeScript)

```typescript
/** PDF 메타데이터 */
export interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

/** PDF 검사 결과 응답 */
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

/** 공통 에러 응답 객체 */
export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
  details?: Record<string, unknown>;
}
```

---

## 3. 엔드포인트 명세

### 3.1. PDF 정보 및 암호화 여부 사전 검사

- **Method**: `POST`
- **Path**: `/api/v1/pdf/inspect`
- **Content-Type**: `multipart/form-data`

#### Request (FormData)
| Key | Type | 필수 여부 | 설명 | 예시 |
| :--- | :--- | :---: | :--- | :--- |
| `file` | `File` | **필수** | 검사할 PDF 파일 (최대 50MB) | `document.pdf` |
| `password` | `string` | 선택 | 암호화된 PDF 파일인 경우 일치 여부를 검증할 비밀번호 | `"1234"` |

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/json`
- **Body**: `InspectPdfResponse`
```json
{
  "isEncrypted": true,
  "isPasswordValid": true,
  "pageCount": 12,
  "metadata": {
    "title": "연간 보고서",
    "author": "홍길동"
  }
}
```

---

### 3.2. PDF 암호 해제 (Clean PDF)

- **Method**: `POST`
- **Path**: `/api/v1/pdf/unlock`
- **Content-Type**: `multipart/form-data`

#### Request (FormData)
| Key | Type | 필수 여부 | 설명 | 예시 |
| :--- | :--- | :---: | :--- | :--- |
| `file` | `File` | **필수** | 암호 해제 대상 PDF 파일 | `protected.pdf` |
| `password` | `string` | **필수** | PDF 잠금 해제 비밀번호 | `"secret1234"` |

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/pdf`
- **Headers**: `Content-Disposition: attachment; filename="unlocked.pdf"`
- **Body**: 암호가 제거된 PDF 바이너리

---

### 3.3. PDF 병합 (2~20개)

- **Method**: `POST`
- **Path**: `/api/v1/pdf/merge`
- **Content-Type**: `multipart/form-data`

#### Request (FormData)
| Key | Type | 필수 여부 | 설명 | 예시 |
| :--- | :--- | :---: | :--- | :--- |
| `files` | `File[]` | **필수** | 병합할 PDF 파일 목록 (**최소 2개 ~ 최대 20개**, 전송 순서대로 결합) | `file1.pdf`, `file2.pdf` |
| `passwords` | `string` | 선택 | 각 파일 인덱스에 1:1 매칭되는 **JSON 배열 문자열**.<br>암호가 없는 파일은 빈 문자열(`""`)로 설정 | `'["pw1", "", "pw3"]'` |

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/pdf`
- **Headers**: `Content-Disposition: attachment; filename="merged.pdf"`
- **Body**: 결합된 단일 PDF 바이너리

---

### 3.4. PDF 특정 페이지 범위 추출/분할

- **Method**: `POST`
- **Path**: `/api/v1/pdf/split/range`
- **Content-Type**: `multipart/form-data`

#### Request (FormData)
| Key | Type | 필수 여부 | 설명 | 예시 |
| :--- | :--- | :---: | :--- | :--- |
| `file` | `File` | **필수** | 분할 대상 PDF 파일 | `sample.pdf` |
| `ranges` | `string` | **필수** | 추출할 페이지 범위 (**1-based 인덱스**, 쉼표 및 대시 조합) | `"1-3, 5, 8-10"` |
| `password` | `string` | 선택 | 암호화된 파일인 경우 비밀번호 | `"1234"` |

> **페이지 범위 규격**:
> - 콤마(`,`)와 하이픈(`-`) 지원 (예: `1-3, 5`)
> - 중복 번호는 자동 제거 및 오름차순 정렬 처리
> - 총 페이지 수를 초과하거나 유효하지 않은 범위 입력 시 `PDF_INVALID_PAGE_RANGE` 에러 반환

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/pdf`
- **Headers**: `Content-Disposition: attachment; filename="extracted.pdf"`
- **Body**: 지정 범위 페이지만 추출 결합된 PDF 바이너리

---

### 3.5. PDF 전체 페이지 낱장 분할 (ZIP 압축)

- **Method**: `POST`
- **Path**: `/api/v1/pdf/split/all`
- **Content-Type**: `multipart/form-data`

#### Request (FormData)
| Key | Type | 필수 여부 | 설명 | 예시 |
| :--- | :--- | :---: | :--- | :--- |
| `file` | `File` | **필수** | 낱장 분할할 PDF 파일 | `slides.pdf` |
| `password` | `string` | 선택 | 암호화된 파일인 경우 비밀번호 | `"1234"` |

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/zip`
- **Headers**: `Content-Disposition: attachment; filename="split-pages.zip"`
- **Body**: 페이지별 분할 PDF들이 포함된 ZIP 압축 아카이브 바이너리

---

## 4. 에러 응답 규격 및 비즈니스 에러 코드

요청 처리 실패 시 HTTP 상태 코드와 함께 아래 규격의 JSON 객체가 반환됩니다.

### 4.1. 에러 응답 포맷
```json
{
  "statusCode": 400,
  "code": "PDF_INVALID_PASSWORD",
  "message": "PDF 비밀번호가 일치하지 않습니다.",
  "timestamp": "2026-09-26T07:30:00.000Z",
  "path": "/api/v1/pdf/unlock",
  "details": {}
}
```

### 4.2. 도메인 비즈니스 에러 코드표
| 에러 코드 (`code`) | HTTP Status | 설명 및 원인 |
| :--- | :---: | :--- |
| `PDF_PASSWORD_REQUIRED` | `400` | 암호화된 PDF 파일이나 비밀번호를 전달하지 않음 |
| `PDF_INVALID_PASSWORD` | `400` | 제공된 비밀번호가 일치하지 않음 |
| `PDF_NOT_PASSWORD_PROTECTED` | `400` | 암호화되지 않은 일반 PDF에 암호 해제(`unlock`) 요청을 보냄 |
| `PDF_MIN_FILE_COUNT_NOT_MET` | `400` | 병합(`merge`) 요청 시 파일 개수가 2개 미만임 |
| `PDF_MAX_FILE_COUNT_EXCEEDED` | `400` | 병합(`merge`) 요청 시 파일 개수가 20개를 초과함 |
| `PDF_INVALID_PAGE_RANGE` | `400` | 페이지 범위 형식 오류 또는 전체 페이지 수를 초과하는 번호 입력 |
| `PDF_FILE_SIZE_EXCEEDED` | `413` | 단일 파일(50MB) 또는 총 파일(100MB) 용량 한도 초과 |
| `PDF_CORRUPTED_FILE` | `422` | 파일이 손상되었거나 유효한 PDF 시그니처(`%PDF-`)가 아님 |
