---
status: review
owner: Keunhyeok Lim
last-updated: 2026-10-05
---

# 마크다운 문서 스튜디오 및 지식 저장소 사양서 (Markdown Docs Specification)

## 1. 개요 (Summary)

`my-space` 개인 개발자 워크스페이스의 핵심 기능 중 하나로, 개발자가 로컬 및 배포 환경에서 Markdown 문서를 작성, 실시간 렌더링(GFM, KaTeX 수식, Mermaid 다이어그램, 코드 하이라이트), 폴더/태그 기반 체계적 분류, OpenSearch 전문 검색, 버전 이력(Revision) 관리, 마크다운/PDF 내보내기, 이미지 에셋 첨부를 원스톱으로 수행할 수 있는 **마크다운 문서 스튜디오(Markdown Docs Studio)**의 프론트엔드 기능 명세서입니다.

UI 디자인 및 컴포넌트 레이아웃은 **Stitch의 3대 핵심 디자인 화면**(`my-space Markdown Library`, `my-space Markdown Editor & Preview`, `my-space Markdown Detail (Post View)`)을 최우선 기준으로 준수하며, 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md) 토큰 체계(다크 모드 징크 테마, Geist/JetBrains Mono 서체, 1px 미세 보더, 4px 그리드)를 엄격히 따릅니다.

---

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 2.1. 목표 (Goals)
* **독립 라우트 기반 3대 핵심 화면 구성**:
  * `/docs`: 3단 분할(Tri-Pane) 문서 라이브러리 및 탐색 뷰 (계층형 폴더 트리 + 검색/목록 + 인스펙터 패널)
  * `/docs/new`, `/docs/:id/edit`: 50:50 좌우 분할(Split View) 마크다운 에디터 & 실시간 라이브 프리뷰
  * `/docs/:id`: 노션/블로그 스타일의 깔끔한 가독성 중심 읽기 전용 포스트 뷰 + 스티키 우측 목차(TOC)
* **풍부한 마크다운 렌더링 엔진 지원**:
  * CommonMark & GitHub Flavored Markdown (GFM) 완벽 지원 (표, 체크리스트, 취소선, 인라인 코드)
  * YAML Frontmatter 파싱 및 시각적 매니페스트 카드 표시
  * Mermaid 다이어그램(v10+) 및 KaTeX 수학 수식 렌더링
  * 코드 블록 신택스 하이라이팅 및 원클릭 클립보드 복사
* **스마트 문서 자산 및 버전 관리**:
  * 에디터 내 이미지 드래그 앤 드롭 / 클립보드 붙여넣기(`POST /api/v1/markdown/assets/upload`)를 통한 MinIO 자동 업로드 및 인라인 마크다운 삽입
  * 본문 변경 시 백엔드 자동 리비전 누적 생성 및 과거 버전 조회 / 비교(Diff) / 복원(Restore) 모달 연동
* **체계적 탐색 및 검색**:
  * 계층형 폴더(Tree View) 생성/수정/삭제 (순환 참조 방지 적용)
  * 다중 태그 필터링 및 카운트 배지 표출
  * OpenSearch 연동 실시간 전문 검색(디바운스 300ms) 및 `<mark>` 하이라이트 스니펫 노출
* **파일 Import / Export**:
  * `.md` 파일 로컬 가져오기(Import)
  * 원본 마크다운(`.md`) 다운로드 및 렌더링 결과물 기반 PDF 내보내기

### 2.2. 제외 대상 (Non-goals)
* 다자간 실시간 동시 편집(CRDT/WebRTC 협업 편집) - 개인용 워크스페이스 원칙에 따라 단일 사용자 모델 유지
* 외부 공개 블로그 퍼블리싱 또는 소셜 댓글/좋아요 기능
* 복잡한 Git 수준의 3-Way 머지 충돌 해결 인터페이스

---

## 3. 라우팅 및 화면 구조 (Routing & Layout)

| 경로 (Route) | 뷰 명칭 | 주요 레이아웃 | 설명 |
| :--- | :--- | :--- | :--- |
| `/docs` | `MarkdownLibraryView` | **Tri-Pane (3단 패널)** | 좌측 폴더/태그 트리(256px) + 중앙 검색/목록 + 우측 문서 인스펙터(288px) |
| `/docs/new` | `MarkdownEditorView` | **Split View (50:50)** | 상단 서브헤더 + 좌측 CodeMirror 에디터 + 우측 실시간 렌더 프리뷰 + 하단 상태바 |
| `/docs/:id` | `MarkdownDetailView` | **Article & Sticky TOC** | 상단 메타 스트립 & 액션바 + 중앙 읽기 뷰(최대 896px) + 우측 플로팅 TOC(256px) |
| `/docs/:id/edit` | `MarkdownEditorView` | **Split View (50:50)** | 기존 문서 데이터 불러오기 후 수정 모드 |

---

## 4. 유스케이스 및 사용자 흐름 (Use Cases)

| 유스케이스 ID | 액터 | 목표 | 주요 인터랙션 흐름 |
| :--- | :--- | :--- | :--- |
| `UC-MD-01` | 개발자 | 새 마크다운 문서 작성 및 저장 | 1. `/docs`에서 `+ 새 문서 작성` 클릭 → 2. `/docs/new` 에디터 이동 → 3. 제목/폴더/태그 설정 및 본문 작성 → 4. 실시간 프리뷰 확인 → 5. `저장 (Save)` 클릭 → 6. 생성 완료 후 상세 뷰(`/docs/:id`)로 이동 |
| `UC-MD-02` | 개발자 | 폴더 및 태그 기반 문서 탐색 | 1. `/docs` 좌측 패널에서 폴더 트리 확장/클릭 → 2. 해당 폴더 문서 목록 필터링 → 3. 특정 태그(`#architecture`) 클릭하여 교집합 필터링 |
| `UC-MD-03` | 개발자 | OpenSearch 전문 검색 수행 | 1. 검색창에 검색어 입력(또는 ⌘F 단축키) → 2. 300ms 디바운스 후 백엔드 검색 호출 → 3. `<mark>` 하이라이트 스니펫 확인 → 4. 카드 클릭 시 상세 페이지 이동 |
| `UC-MD-04` | 개발자 | 에디터에 이미지 첨부 | 1. 에디터 영역에 로컬 이미지 파일 드래그앤드롭 또는 클립보드 이미지 붙여넣기(Paste) → 2. `POST /assets/upload` 호출 → 3. `![파일명](/api/v1/markdown/assets/...)` 자동 삽입 |
| `UC-MD-05` | 개발자 | 문서 수정 및 새 버전 생성 | 1. `/docs/:id`에서 `수정하기 (Edit Document)` 클릭 → 2. `/docs/:id/edit` 이동 → 3. 본문 수정 후 저장 → 4. 백엔드에서 버전 증가(v1 → v2) 및 리비전 생성 확인 |
| `UC-MD-06` | 개발자 | 버전 이력 조회 및 Diff 비교 | 1. 상단 `버전 이력 (History)` 버튼 클릭 → 2. 리비전 모달 오픈 → 3. 두 버전(v1 vs v2) 선택 후 비교 요청 → 4. 변경된 텍스트 Diff 시각화 확인 |
| `UC-MD-07` | 개발자 | 과거 버전으로 복원 (Restore) | 1. 리비전 모달에서 과거 버전 선택 → 2. `이 버전으로 복원` 클릭 → 3. 확인 다이얼로그 승인 → 4. 최신 버전으로 복원된 내용이 갱신 반영 |
| `UC-MD-08` | 개발자 | 마크다운 파일 Import / Export | 1. 상단 `가져오기 (Import .md)` 클릭하여 로컬 파일 선택 → 2. 본문 및 제목 자동 채움 → 3. `내보내기 (Export .md)` 클릭 시 `.md` 파일 다운로드 |
| `UC-MD-09` | 개발자 | PDF 내보내기 | 1. 상단 `PDF 내보내기` 클릭 → 2. 백엔드 PDF 변환 API(`GET /documents/:id/export/pdf`) 호출 또는 브라우저 렌더 인쇄 뷰어 실행 |
| `UC-MD-10` | 개발자 | 계층형 폴더 관리 | 1. 좌측 파일시스템 영역에서 `+` 버튼 클릭 → 2. 폴더명 입력하여 생성 → 3. 우클릭/메뉴로 이름 수정 및 부모 폴더 변경(순환 참조 방지) |

---

## 5. 컴포넌트 계층 및 모듈 아키텍처 (Component Architecture)

```
apps/web/src/
├── entities/
│   └── markdown/
│       ├── model/
│       │   └── types.ts             # Folder, Tag, Document, Revision, Search DTO 타입
│       ├── api/
│       │   ├── markdownApi.ts       # REST 클라이언트 (fetch 기반 엔드포인트 연동)
│       │   ├── useFolders.ts        # 폴더 트리 조회/생성/수정/삭제 훅
│       │   ├── useTags.ts           # 태그 목록 훅
│       │   ├── useDocuments.ts      # 문서 목록 및 페이징/필터링 훅
│       │   ├── useDocumentDetail.ts # 단일 문서 상세 조회 훅
│       │   ├── useRevisions.ts      # 리비전 이력 및 Diff 비교 훅
│       │   └── useSearch.ts         # OpenSearch 디바운스 검색 훅
│       └── index.ts
├── features/
│   └── markdown/
│       ├── editor/
│       │   ├── MarkdownCodeEditor.tsx  # CodeMirror 기반 마크다운 입력기
│       │   ├── MarkdownPreview.tsx     # GFM + KaTeX + Mermaid 렌더러
│       │   └── useAssetUpload.ts       # 이미지 드래그/드롭/붙여넣기 업로드 훅
│       ├── revision/
│       │   ├── RevisionHistoryModal.tsx # 버전 타임라인 모달
│       │   └── RevisionDiffViewer.tsx   # 두 버전 간 텍스트 차이 뷰어
│       └── folder/
│           ├── FolderTree.tsx          # 계층형 트리 컴포넌트
│           └── FolderFormModal.tsx     # 폴더 생성/수정 모달
├── pages/
│   └── markdown-docs/
│       ├── MarkdownDocsPage.tsx        # 라우트 분기 컨테이너 (/docs, /docs/new, /docs/:id, /docs/:id/edit)
│       ├── views/
│       │   ├── DocumentLibraryView.tsx # Stitch 화면 1 (Tri-Pane 탐색)
│       │   ├── MarkdownEditorView.tsx  # Stitch 화면 2 (Split View 에디터)
│       │   └── MarkdownDetailView.tsx  # Stitch 화면 3 (독서 모드 포스트 뷰)
│       ├── components/
│       │   ├── DocumentInspector.tsx   # 라이브러리 우측 메타데이터 인스펙터
│       │   ├── DocumentCard.tsx        # 문서 리스트 아이템 카드
│       │   └── StickyToc.tsx           # 상세 뷰 우측 플로팅 목차
│       ├── styles/
│       │   ├── markdown-docs.css       # 라이브러리 및 레이아웃 CSS (DESIGN.md 준수)
│       │   ├── markdown-editor.css     # 스플릿 에디터 CSS
│       │   └── markdown-preview.css    # 마크다운 렌더링 타이포그래피 CSS
│       └── index.ts
```

---

## 6. UI 디자인 및 인터랙션 사양 (DESIGN.md 반영)

### 6.1. 색상 및 다크 모드 징크 스펙트럼
* **기본 배경 (`bg-background`)**: `#09090b` (zinc-950) / `#12131a`
* **컨테이너 레이어 (`surface-container-low`)**: `#121215` / `#1a1b22` (사이드바 및 패널)
* **카드 및 에디터 표면 (`surface-container`)**: `#18181b` / `#1e1f26`
* **경계선 (`border`)**: `1px solid #27272a` (기본), 호버/포커스 시 `#3f3f46` 또는 `#adc6ff` (Primary)
* **포커스 링**: `2px solid #3b82f6` (`offset: 2px`)

### 6.2. 타이포그래피 및 서체
* **제목 및 본문**: `Geist`, `-apple-system`, `sans-serif`
* **코드 블록, 줄번호, 메타데이터, 단축키 뱃지**: `JetBrains Mono`

### 6.3. 반응형 중단점 (Responsive Behavior)
* **Desktop (≥ 1024px)**: Tri-Pane 전체 노출 (폴더 트리 256px + 중앙 목록 + 인스펙터 288px), 에디터 50:50 분할
* **Tablet (768px ~ 1023px)**: 우측 인스펙터는 오버레이 시트/모달로 축소, 폴더 트리는 접기/펼치기 지원, 에디터 분할 비율 조절 가능
* **Mobile (< 768px)**: 단일 컬럼 모드; 폴더 트리는 바텀시트로 전환; 에디터 화면에서는 `[ Edit ] [ Preview ]` 탭 토글 형태로 전환

---

## 7. 백엔드 API 연동 규격 (`MARKDOWN_API_SPEC.md` 준수)

* **Base URL**: `/api/v1/markdown` (Vite 프록시를 통해 로컬에서 `https://api.homelab.local/api/v1/markdown`으로 중계)
* **로컬 개발 인증**: 백엔드 `IS_LOCAL=true` 설정에 의해 인증 헤더 생략 시 `dev-admin`으로 자동 처리됨

### 주요 엔드포인트 매핑
1. **폴더 API**:
   - `GET /folders`: 계층형 트리 조회
   - `POST /folders`: 신규 폴더 생성 (`{ name, parentId? }`)
   - `PATCH /folders/:id`: 이름 변경 및 부모 이동
   - `DELETE /folders/:id`: 삭제 (자식 문서는 미분류로 안전 이동)
2. **태그 API**:
   - `GET /tags`: 태그 목록 및 `documentCount`
3. **문서 API**:
   - `GET /documents?folderId=&tag=&page=&limit=&sortBy=`: 목록 조회
   - `GET /documents/:id`: 상세 조회 (원문 마크다운 + 프론트매터 메타데이터)
   - `POST /documents`: 새 문서 생성
   - `PUT /documents/:id`: 문서 수정 (본문 변경 시 자동 리비전 누적)
   - `DELETE /documents/:id`: 문서 삭제
   - `POST /documents/import`: `.md` 파일 업로드 (`multipart/form-data`)
   - `GET /documents/:id/export/md`: 원본 다운로드
   - `GET /documents/:id/export/pdf`: PDF 다운로드
4. **리비전 API**:
   - `GET /documents/:id/revisions`: 리비전 이력 목록
   - `GET /documents/:id/revisions/:version`: 특정 버전 본문 조회
   - `GET /documents/:id/revisions/compare?v1=A&v2=B`: 두 버전 간 Diff 응답
   - `POST /documents/:id/revisions/:version/restore`: 해당 버전으로 복원
5. **검색 API**:
   - `GET /search?q=`: OpenSearch 전문 검색 및 하이라이트 스니펫
6. **에셋 API**:
   - `POST /assets/upload`: 이미지 업로드 (최대 10MB, PNG/JPG/WebP/SVG/GIF)
   - `GET /assets/*key`: 이미지 스트리밍 URL (프리뷰에서 `<img src="...">` 바로 렌더링)

---

## 8. 보안 및 에러 핸들링 (Security & Fault Tolerance)

1. **XSS 방어**:
   - 사용자가 작성한 마크다운을 렌더링할 때 `DOMPurify`를 반드시 통과시켜 악성 스크립트 실행 방지
2. **순환 참조 방지 (Circular Dependency)**:
   - 폴더 이동 시 자기 자신이나 자신의 하위 자식 폴더를 부모로 선택하지 못하도록 UI 셀렉트 박스에서 비활성화(`disabled`) 처리
3. **에러 피드백**:
   - 백엔드 에러 응답(`{ statusCode, message, code }`) 수신 시 토스트 알림으로 사용자에게 즉시 안내
4. **입력 지연 방지 (Performance)**:
   - 수천 줄의 긴 마크다운 작성 시 타이핑 지연을 방지하기 위해 실시간 프리뷰 렌더링에 150ms 디바운스 또는 `startTransition` 적용

---

## 9. 외부 라이브러리 도입 계획

`AGENTS.md`의 의존성 관리 원칙에 따라, 실시간 렌더링 및 에디터 구현에 꼭 필요한 최소한의 검증된 경량 패키지만 선별하여 설치합니다:

| 패키지명 | 버전 권장 | 용도 |
| :--- | :--- | :--- |
| `@codemirror/lang-markdown` | `^6.3.0` | CodeMirror 마크다운 구문 강조 및 에디터 지원 (기존 `@uiw/react-codemirror`와 결합) |
| `marked` | `^15.0.0` | 고속 마크다운 / GFM 파싱 |
| `dompurify` / `@types/dompurify` | `^3.2.0` | 렌더링된 HTML에 대한 XSS 방어 새니타이저 |
| `katex` / `@types/katex` | `^0.16.0` | 수학 수식 렌더링 |
| `mermaid` | `^11.4.0` | 다이어그램(Flowchart, Sequence 등) 렌더링 |
| `yaml` | `^2.7.0` | Frontmatter 파싱 및 직렬화 |
| `diff` / `@types/diff` | `^7.0.0` | 리비전 버전 비교 시 텍스트 차이점 계산 |

---

## 10. 검토 및 피드백 요청 항목 (Review Questions)

1. **에디터 분할 스플릿 방식**:
   - 데스크톱 기준 50:50 좌우 고정 분할 또는 마우스 드래그 리사이즈 디바이더 지원
2. **오프라인/에러 대비 캐시**:
   - 네트워크 단절 시에도 작성 중인 초안이 유실되지 않도록 LocalStorage에 자동 임시 저장(Draft Autosave) 지원
