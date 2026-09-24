---
status: review
owner: Keunhyeok Lim
last-updated: 2026-09-24
---

# PDF 유틸리티 화면 및 인터랙션 사양서 (PDF Tools Specification)

## 1. 개요 (Summary)

사용자가 외부 클라우드 서비스에 민감한 문서를 전송하지 않고, 개인 워크스페이스 환경에서 안전하게 PDF 파일을 **병합(Merge)**, **범위 분할(Split Range)**, **낱장 분할(Split All)** 및 **암호 해제(Unlock)**할 수 있는 웹 프론트엔드 UI 인터랙션과 백엔드 연동 규격을 정의합니다.

시각적 스타일링(다크 모드, 토널 레이어, 색상, 타이포그래피 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 최우선 기준으로 준수하며, 백엔드 통신 아키텍처는 [`ADR-0001`](../adr/0001-api-client-and-proxy-strategy.md)을 준수합니다.

---

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 목표 (Goals)
* **드롭존 기반 파일 업로드 UX**: 직관적인 드래그 앤 드롭 및 파일 탐색기 파일 선택
* **파일 사전 정보 및 암호 검사 (`inspect`)**: 파일 선택 즉시 백엔드 사전 검사를 통해 페이지 수, 파일 크기, 암호화 여부 및 메타데이터를 UI에 노출
* **4가지 핵심 PDF 작업 모드 탭 제공**:
  1. **병합 (Merge)**: 2개 이상의 PDF 파일 목록 관리, 순서 변경 및 결합 다운로드
  2. **범위 분할 (Split by Range)**: 페이지 범위(예: `1-3, 5`) 입력 및 특정 페이지 추출 다운로드
  3. **낱장 분할 (Split to Pages)**: 전체 페이지를 낱장 PDF로 분할한 ZIP 아카이브 다운로드
  4. **암호 해제 (Unlock)**: 비밀번호로 보호된 PDF의 비밀번호 입력 및 암호 없는 PDF 다운로드
* **암호화된 PDF 처리**: 암호화된 파일 감지 시 비밀번호 입력 인라인 폼 및 실시간 유효성 피드백 제공
* **반응형 처리 상태 피드백**: 업로드/변환 진행 중 로딩 스피너 및 에러 토스트 제공
* **브라우저 스트림 다운로드**: 백엔드로부터 수신한 바이너리(`Blob`)를 브라우저 파일 다운로드로 즉각 트리거

### 제외 대상 (Non-goals)
* 브라우저 내장 대형 PDF 렌더러(PDF.js 뷰어, 썸네일 그리드 뷰) 탑재 (초기 릴리즈 범위 제외)
* 클라이언트 측 로컬 WASM 직접 변환 (현재 단계에서는 백엔드 API 계약 연동에 집중)
* OCR, 워터마크 삽입, 텍스트 편집 등 백엔드 미지원 기능

---

## 3. 유스케이스 및 사용자 흐름 (Use Cases)

| 유스케이스 ID | 액터 | 목표 | 주요 인터랙션 흐름 |
| :--- | :--- | :--- | :--- |
| `UC-F-P01` | 사용자 | PDF 파일 선택 및 사전 정보 확인 | 1. 드롭존에 PDF 드롭 → 2. 파일 MIME 검증 → 3. 백엔드 사전 검사(`/inspect`) → 4. 페이지 수 및 암호 여부 표시 |
| `UC-F-P02` | 사용자 | 여러 PDF 파일 병합 | 1. '병합' 모드 선택 → 2. 2개 이상 PDF 추가 → 3. '작업 실행' 클릭 → 4. 병합된 `merged.pdf` 다운로드 |
| `UC-F-P03` | 사용자 | 특정 페이지 범위 분할 | 1. '범위 분할' 모드 선택 → 2. 페이지 범위 입력(예: `1-5`) → 3. '작업 실행' 클릭 → 4. `extracted.pdf` 다운로드 |
| `UC-F-P04` | 사용자 | 전체 페이지 분할 (ZIP) | 1. '낱장 분할' 모드 선택 → 2. 단일 PDF 업로드 → 3. '작업 실행' 클릭 → 4. `split_pages.zip` 다운로드 |
| `UC-F-P05` | 사용자 | PDF 암호 해제 | 1. '암호 해제' 모드 선택 → 2. 비밀번호 입력 → 3. '작업 실행' 클릭 → 4. 복호화된 `unlocked.pdf` 다운로드 |

### 세부 사용자 흐름 (Interaction Details)
* **암호화된 PDF 감지 흐름**:
  * 사용자가 암호화된 PDF를 올리면 사전 검사 응답(`isEncrypted: true`)에 따라 파일 프리뷰 카드에 자물쇠 아이콘과 함께 비밀번호 입력 필드가 노출됩니다.
  * 비밀번호 입력 후 포커스를 벗어나거나 엔터를 누르면 `/inspect` API를 재호출하여 비밀번호 일치 여부(`isPasswordValid`)를 실시간 검증합니다.

---

## 4. 화면 및 컴포넌트 요구사항 (UI / Component Specs)

> 디자인 세부 사항은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 준수합니다.

### 4.1. UI 상태 매트릭스 (UI States)

| 상태 | 화면 표현 및 피드백 | 사용자 액션 제약 |
|---|---|---|
| **초기 빈 화면 (Empty)** | 파일 드롭존 및 안내 문구 노출 (`Drag and drop documents...`) | '작업 실행' 버튼 비활성화 (disabled) |
| **파일 유효성 검사 중** | 파일 카드 내부 작은 인디케이터 표시 | 작업 실행 일시 대기 |
| **입력 완료 / 준비 (Ready)** | 선택된 파일 목록 카드, 모드별 파라미터 폼(범위, 비밀번호 등) 활성화 | '작업 실행' 버튼 활성화 |
| **처리 중 (Processing)** | '작업 실행' 버튼 로딩 스피너, 드롭존 비활성화 | 중복 클릭 방지 (버튼 disabled) |
| **성공 (Success)** | 브라우저 파일 다운로드 팝업 자동 실행 + 상단 성공 토스트 | 기존 파일 유지 또는 '초기화' 버튼 제공 |
| **에러 (Error)** | 해당 폼 하단 인라인 붉은색 에러 라벨 및 상단 에러 토스트 | 수정 후 재시도 가능 |

### 4.2. 주요 컴포넌트 계층 구조

```text
PdfToolsPage (최상위 화면 컨테이너)
 ├── ViewHeader (타이틀: PDF Processing Engine, v2.4-wasm 뱃지, 제로 텔레메트리 칩)
 └── WorkflowGrid (4-Zone 12열 그리드 레이아웃)
      ├── LeftColumn (7열: 입력 및 설정 영역)
      │    ├── DropzoneZone (드래그 앤 드롭 파일 선택 영역)
      │    ├── SelectedFileList (선택된 파일 목록 및 프리뷰 카드)
      │    │    └── FileItemCard (파일명, 크기, 페이지 수, 비밀번호 입력 필드, 삭제 버튼)
      │    └── ModeConfigPanel (작업 모드 탭: 병합/범위분할/낱장분할/암호해제 및 설정 폼)
      └── RightColumn (5열: 실행 및 상태 요약 영역)
           ├── ExecutionSummaryCard (선택된 작업 요약, 예상 산출물, 총 파일 크기)
           ├── SecurityNoticeCard (100% 로컬/개인 격리 환경 안내)
           └── ActionToolbar (초기화 버튼, 메인 '작업 실행' CTA 버튼)
```

---

## 5. 클라이언트 상태 및 데이터 흐름 (State & Data Flow)

### 5.1. 핵심 클라이언트 상태 모델

```typescript
export type PdfOperationMode = 'merge' | 'split-range' | 'split-all' | 'unlock';

export interface SelectedPdfFile {
  id: string; // 클라이언트 고유 식별자 (crypto.randomUUID())
  file: File;
  name: string;
  size: number;
  isEncrypted?: boolean;
  isPasswordValid?: boolean;
  pageCount?: number;
  password?: string;
  isInspecting?: boolean;
  error?: string;
}

export interface PdfToolsState {
  mode: PdfOperationMode;
  files: SelectedPdfFile[];
  splitRangeInput: string; // 예: "1-3, 5"
  isProcessing: boolean;
  globalError: string | null;
}
```

### 5.2. 상태 전이 및 유효성 검증 규칙 (Business Rules)
* **`BR-F-P01` (파일 형식)**: MIME 타입 `application/pdf` 또는 `.pdf` 확장자 파일만 업로드 허용 (비-PDF 드롭 시 에러 토스트 노출).
* **`BR-F-P02` (크기 제한)**: 단일 파일 50MB, 총합 100MB 초과 시 파일 추가 차단 및 안내 문구 노출.
* **`BR-F-P03` (모드별 파일 수 제약)**:
  * `merge`: 최소 2개 이상, 최대 20개 이하 파일 필요.
  * `split-range`, `split-all`, `unlock`: 정확히 1개의 파일만 필요 (추가 파일 선택 시 첫 번째 파일로 대체 안내).
* **`BR-F-P04` (페이지 범위 검증)**:
  * 1-based 숫자, 쉼표, 하이픈만 허용되는 정규식 검증 (`^[0-9,\s-]+$`).
  * 입력된 페이지가 단일 파일의 `pageCount`를 초과할 경우 인라인 경고 표시.

---

## 6. 백엔드 API 연동 규격 (API Integration)

> 연동 백엔드: `my-space-backend` (`docs/specs/pdf-tools.md` 계약 준수)  
> 모든 요청은 상대 경로 `/api/v1/pdf/*`로 호출 (Vite 프록시 처리, `ADR-0001` 참조).

### 6.1. 엔드포인트 매핑

| 기능 | HTTP 메서드 및 경로 | 요청 포맷 | 응답 포맷 |
|---|---|---|---|
| **사전 검사** | `POST /api/v1/pdf/inspect` | `multipart/form-data` | `application/json` |
| **PDF 병합** | `POST /api/v1/pdf/merge` | `multipart/form-data` | `application/pdf` (바이너리) |
| **범위 분할** | `POST /api/v1/pdf/split/range` | `multipart/form-data` | `application/pdf` (바이너리) |
| **전체 분할** | `POST /api/v1/pdf/split/all` | `multipart/form-data` | `application/zip` (바이너리) |
| **암호 해제** | `POST /api/v1/pdf/unlock` | `multipart/form-data` | `application/pdf` (바이너리) |

### 6.2. 클라이언트 요청 및 응답 인터페이스

```typescript
// 1. 사전 검사 응답
export interface InspectPdfResponse {
  isEncrypted: boolean;
  isPasswordValid?: boolean;
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
  };
}

// 2. 바이너리 다운로드 헬퍼
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
```

---

## 7. 에러 핸들링 및 사용자 피드백 (Error Handling)

백엔드 표준 에러 코드(도메인 예외)에 대응하는 프론트엔드 피드백 정책:

| 백엔드 에러 코드 | HTTP Status | 상황 설명 | 사용자 피드백 위치 및 메시지 |
|---|---|---|---|
| `PDF_PASSWORD_REQUIRED` | 422 | 암호화된 파일이나 비밀번호 미입력 | 파일 카드 내 비밀번호 입력 인풋 포커스 및 붉은색 안내 ("비밀번호가 필요합니다.") |
| `PDF_INVALID_PASSWORD` | 422 | 제공된 비밀번호 불일치 | 인라인 폼 에러 ("비밀번호가 올바르지 않습니다.") |
| `PDF_INVALID_PAGE_RANGE`| 422 | 페이지 범위 문법 오류/범위 초과 | 범위 입력 필드 하단 에러 ("올바른 페이지 범위를 입력해주세요.") |
| `PDF_NOT_PASSWORD_PROTECTED`| 422 | 암호 없는 파일에 암호 해제 요청 | 알림 토스트 ("암호로 보호되지 않은 파일입니다.") |
| `PDF_FILE_CORRUPTED` | 422 | 손상된 파일 | 파일 카드 에러 태그 ("손상되었거나 읽을 수 없는 PDF 파일입니다.") |
| `NETWORK_ERROR` / 500 | 500 | 서버 연결 실패 또는 내부 예외 | 상단 경고 토스트 및 "잠시 후 다시 시도해 주세요" 안내 |

---

## 8. 오픈 질문 (Open Questions)

* [x] **백엔드 통신 및 CORS 해결 방식**: Vite 개발 서버 프록시 규칙(`/api` -> `http://localhost:8080`)으로 해결 확정 ([ADR-0001](../adr/0001-api-client-and-proxy-strategy.md)).
* [ ] **다운로드 기본 파일명 규칙**: 병합 시 `merged.pdf` 외에 사용자가 파일명을 직접 지정할 수 있는 옵션 필드를 2차 개선 단계에 추가할지 여부 검토.
