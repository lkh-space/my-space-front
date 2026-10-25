---
status: review
owner: Keunhyeok Lim
last-updated: 2026-10-24
standard: ISO/IEC/IEEE 29119-3:2021 (Agile Tailored Integrated Test Specification)
---

# 프론트엔드 통합 테스트 명세서 (ISO/IEC/IEEE 29119-3:2021 준수)

## 0. 문서 제어 및 표준 준수 선언 (Document Control & Standard Compliance)

본 문서는 국제 소프트웨어 테스트 문서화 표준인 **ISO/IEC/IEEE 29119-3:2021 (*Software and systems engineering — Software testing — Part 3: Test documentation*)**의 애자일/DevOps 테일러링(Tailoring) 가이드라인에 따라, **테스트 계획(Test Plan)**과 **테스트 설계·케이스·절차 명세(Test Design, Case & Procedure Specification)**를 단일 문서로 통합 정의한 실무 QA 명세서입니다.

| 항목 | 내용 |
| :--- | :--- |
| **문서 식별자 (Document ID)** | `QA-SPEC-FE-2026-001` |
| **대상 시스템 (SUT)** | `my-space-frontend` (`apps/web`, React 19 + TypeScript + Vite SPA) |
| **준수 표준 (Reference Standard)** | `ISO/IEC/IEEE 29119-3:2021` (Part 3: Test Documentation), `ISO/IEC/IEEE 29119-4:2021` (Part 4: Test Techniques) |
| **참조 명세 (Baseline Specs)** | [`docs/specs/*.md`](../specs/), [`docs/adr/*.md`](../adr/), [`DESIGN.md`](../../DESIGN.md) |

---

## 1. 테스트 범위 (Clause 1: Context & Test Scope)

### 1.1. 테스트 대상 기능 집합 (Features to be Tested — In-Scope)

| 기능 집합 ID | 기능 도메인 (Feature Set) | 참조 명세서 | 핵심 검증 범위 |
| :--- | :--- | :--- | :--- |
| **`FS-01`** | 공통 워크스페이스 셸 & 반응형 레이아웃 | [`dashboard.md`](../specs/dashboard.md), [`responsive-layout.md`](../specs/responsive-layout.md) | 중첩 라우팅, Lazy Chunk 로딩, 3단계 반응형 브레이크포인트, 다국어(`KR / EN`) 토글, 404 방어 |
| **`FS-02`** | 대시보드 & 로컬 작업 이력 영속화 | [`dashboard.md`](../specs/dashboard.md) | 벤토 그리드 런처, `localStorage` 최대 10건 FIFO 큐, 손상된 JSON 복원력 |
| **`FS-03`** | Authelia SSO 인증 & 시스템 버전 헬스체크 | [`authelia-sso-integration.md`](../specs/authelia-sso-integration.md), [`system-version-check.md`](../specs/system-version-check.md) | 권한별 배지(`guest`/`admin`/`local-admin`), 3초 타임아웃 독립 장애 격리, `/version.json` 검증 |
| **`FS-04`** | PDF 유틸리티 (사전검사/병합/분할/암호해제) | [`pdf-tools.md`](../specs/pdf-tools.md) | 파일 MIME/용량 경계값(50MB/100MB), 페이지 범위 정규식, 도메인 에러 핸들링, Blob 메모리 해제 |
| **`FS-05`** | DBML 스키마 변환기 & 인터랙티브 ERD | [`dbml-tools.md`](../specs/dbml-tools.md) | 즉시 동기(`useMemo`) DBML 파서, ERD 캔버스 줌/패닝, 다중 SQL 다이얼렉트 변환 및 오프라인 Fallback |
| **`FS-06`** | 마크다운 문서 스튜디오 & 리비전 관리 | [`markdown-docs.md`](../specs/markdown-docs.md) | 문서/폴더 CRUD, 순환 참조 방지, `DOMPurify` XSS 방어, OpenSearch 검색, 버전 Diff/복원 |
| **`FS-07`** | AI 워크스페이스 (J.A.R.V.I.S. Neural Core) | [`ai-workspace.md`](../specs/ai-workspace.md) | PTT(`MediaRecorder`) 상태 전이, SSE 스트리밍 파싱, 발화 즉시 중단(`AbortController`), 마크다운 연동 |
| **`FS-08`** | 런타임 환경변수 주입 & 전역 에러 복원력 | [`ADR-0001`](../adr/0001-api-client-and-proxy-strategy.md), [`ADR-0002`](../adr/0002-frontend-docker-deployment-and-runtime-env-strategy.md) | `window.__ENV__` 우선순위 해석, 전역 `ErrorBoundary` 격리, 비-JSON 502 응답 정규화 |

### 1.2. 테스트 제외 대상 (Features Not to be Tested — Out-of-Scope)

| 제외 항목 | 제외 사유 (Rationale) |
| :--- | :--- |
| 백엔드 QPDF CLI 바이너리 자체의 내부 암호학/압축 알고리즘 | `my-space-backend` 저장소의 통합 테스트 범위이며, 프론트엔드는 API 계약(Contract) 및 응답 처리에 집중 |
| 다자간 실시간 동시 편집 (CRDT / WebRTC 협업) | [`markdown-docs.md`](../specs/markdown-docs.md) Non-goal에 명시된 단일 사용자 워크스페이스 원칙에 따라 제외 |
| 브라우저 내 On-Device LLM 추론 (WebGPU/WASM 가중치 구동) | [`ai-workspace.md`](../specs/ai-workspace.md) Non-goal에 따라 백엔드 SSE 스트리밍 연동만 검증 |
| Authelia 자체 로그인 포털 폼 UI 및 2FA 인증 서버 내부 로직 | 인프라(`homelab-infra`) 영역이며, 프론트엔드는 ForwardAuth 세션 쿠키 기반 `/api/v1/auth/me` 연동만 검증 |

---

## 2. 리스크 기반 테스트 레지스터 (Clause 2: Risk Register & Mitigation)

`ISO/IEC/IEEE 29119`의 핵심 원칙인 **리스크 기반 테스팅(Risk-Based Testing)**에 따라 제품 및 기술 리스크를 식별하고, 각 리스크를 완화하기 위한 테스트 설계 기법과 테스트 케이스를 매핑합니다.

| 리스크 ID | 리스크 설명 (Product / Technical Risk) | 가능성 | 영향도 | 리스크 등급 | 적용 테스트 기법 (ISO 29119-4) | 완화 TC ID |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **`RISK-01`** | 마크다운 본문 및 검색 하이라이트에 삽입된 악성 스크립트로 인한 **Stored/DOM XSS 발생** | 중 | **치명** | **High (P0)** | Security Fuzzing / Error Guessing | `MD-02` |
| **`RISK-02`** | 대용량 PDF 업로드 또는 반복 다운로드 시 브라우저 **메모리 누수(OOM) 및 서버 과부하** | 상 | **높음** | **High (P0)** | 경계값 분석 (BVA) / 리소스 수명주기 검증 | `PDF-02`, `PDF-09` |
| **`RISK-03`** | 백엔드 일부 서비스 다운/지연 시 프론트엔드 전체가 멈추는 **연쇄 장애(Cascading Failure)** | 중 | **치명** | **High (P0)** | 장애 주입 (Fault Injection) / Timeout 검증 | `AU-03`, `VR-02`, `DBML-03`, `INF-02`, `INF-03` |
| **`RISK-04`** | AI 텍스트 입력 중 스페이스바 입력이 PTT 음성 녹음이나 발화 중단으로 오작동하는 **단축키 충돌** | 상 | **높음** | **High (P0)** | 상태 전이 테스팅 (State Transition) / BVA | `AI-01`, `AI-02`, `AI-04` |
| **`RISK-05`** | 계층형 폴더 이동 시 자기 자신 또는 하위 폴더를 부모로 지정하여 **트리 무한 루프(순환 참조) 발생** | 중 | **높음** | **Med (P1)** | 결정 테이블 (Decision Table) / BVA | `MD-04` |
| **`RISK-06`** | 모바일/태블릿 뷰포트에서 고정 바텀바(`56px`)나 사이드바가 본문 조작 버튼을 가리는 **레이아웃 결함** | 중 | **중간** | **Med (P1)** | 뷰포트 동등 분할 (Equivalence Partitioning) | `SH-04`, `DBML-06` |
| **`RISK-07`** | Kubernetes 파드 재기동 시 빌드 타임 환경변수가 덮어써지지 않아 **잘못된 API 서버로 요청 전송** | 하 | **치명** | **High (P0)** | 결정 테이블 (Decision Table) | `INF-01` |
| **`RISK-08`** | 브라우저 `localStorage` 오염 또는 마이크 권한 차단 시 **앱 초기화 크래시(White Screen)** | 중 | **높음** | **Med (P1)** | 부정 테스트 (Negative Testing) / Fault Injection | `DB-05`, `AI-05` |

---

## 3. 테스트 환경 및 표준 테스트 데이터 명세 (Clause 3: Environment & Test Data)

### 3.1. 테스트 환경 요구사항 (Test Environment Requirements)

| 구분 | 환경 구성 및 규격 |
| :--- | :--- |
| **자동화 테스트 런타임** | Node.js 24.x, pnpm workspace, Nx 태스크 러너, Vitest 4.x (JSDOM 환경), React Testing Library |
| **브라우저 호환성 매트릭스** | Chrome (최신), Safari (macOS/iOS WebKit), Edge (Chromium) |
| **반응형 뷰포트 기준 (`DESIGN.md`)** | • **Desktop**: `1440 × 900` (`≥ 1024px`)<br>• **Tablet**: `834 × 1112` (`768px ~ 1023px`)<br>• **Mobile**: `390 × 844` (`< 768px`, iPhone 규격) |
| **네트워크 프로파일** | Online (정상), Slow 3G (3초 타임아웃/로딩 스피너 검증), Offline (Fallback 및 에러 토스트 검증) |

### 3.2. 표준 테스트 데이터 카탈로그 (Test Data Requirements)

| 데이터 ID | 데이터 명칭 | 세부 규격 및 생성 방법 | 사용 TC |
| :--- | :--- | :--- | :--- |
| **`TD-PDF-01`** | 정상 다중 페이지 PDF | `sample-10p.pdf` (10페이지, 비암호화, 2MB, MIME `application/pdf`) | `PDF-03~07` |
| **`TD-PDF-02`** | 암호 보호 PDF | `encrypted-secret.pdf` (비밀번호: `"pass1234"`, `isEncrypted: true`) | `PDF-03`, `PDF-08` |
| **`TD-PDF-03`** | 단일 용량 초과 파일 | `oversize-51mb.pdf` (`50.1MB` 더미 Blob, 단일 한도 50MB 초과 경계값) | `PDF-02` |
| **`TD-PDF-04`** | 누적 용량 초과 파일셋 | `chunk-40mb-1.pdf`, `chunk-40mb-2.pdf`, `chunk-25mb-3.pdf` (합계 `105MB` > 100MB) | `PDF-02` |
| **`TD-PDF-05`** | 비-PDF 위장 파일 | `image.png`, `notes.txt` (비허용 MIME 타입) | `PDF-01` |
| **`TD-MD-01`** | XSS 공격 페이로드 셋 | `<script>window.__xss=1</script>`, `<img src=x onerror=alert(1)>`, `[click](javascript:alert(1))` | `MD-02` |
| **`TD-MD-02`** | 복합 마크다운 문서 | YAML Frontmatter + GFM 표/체크리스트 + KaTeX(`$$E=mc^2$$`) + Mermaid(`graph TD`) 포함 `.md` | `MD-03`, `MD-09`, `MD-10` |
| **`TD-DBML-01`** | 표준 관계형 DBML 스키마 | `users`, `projects`, `tasks` 3개 테이블 및 `Ref` 외래키 2개 포함 스키마 | `DBML-01`, `DBML-03`, `DBML-05` |
| **`TD-DBML-02`** | 문법 오류 DBML 입력 | `Table broken { id int` (닫는 중괄호 누락) 및 존재하지 않는 컬럼 참조 `Ref` | `DBML-02` |
| **`TD-AUTH-01`** | 권한별 Mock User DTO | `local-admin`(`["admins","dev"]`), `admin`(`["admins"]`), `guest`(`["guests"]`) JSON 응답 | `AU-01`, `AU-02` |

---

## 4. 진입·종료 및 중단·재개 기준 (Clause 4: Test Criteria)

| 기준 항목 | 세부 조건 (Criteria Definition) |
| :--- | :--- |
| **진입 기준 (Entry Criteria)** | 1. 대상 기능의 SDD 명세서(`docs/specs/*.md`)가 작성되어 있을 것<br>2. `pnpm typecheck` 및 `pnpm build`가 에러 없이 성공할 것 |
| **완료/종료 기준 (Exit / Completion Criteria)** | 1. 모든 **P0(Critical)** 및 **P1(High)** 테스트 케이스 `100% Pass`<br>2. 단위/컴포넌트 자동화 테스트(`pnpm test`) 통과율 `100%`<br>3. ESLint(`pnpm lint`) 위반 `0건` 및 프로덕션 빌드 시 `dist/version.json` 정상 생성 확인 |
| **중단 기준 (Suspension Criteria)** | 1. 애플리케이션 부팅 불가(White Screen) 또는 라우터 전체 먹통 등 **P0 Blocker 결함** 발생 시 하위 기능 테스트 일시 중단<br>2. API 프록시(`vite.config.mts`) 또는 공통 `apiClient` 계층 파손으로 전체 네트워크 모킹/통신이 불가능한 경우 |
| **재개 기준 (Resumption Criteria)** | 1. 원인 수정 패치 반영 후 스모크 테스트(`SH-01`, `VR-01`, `INF-02`)가 통과되었을 때 중단된 지점부터 테스트 재개 |

---

## 5. 도메인별 통합 테스트 설계·케이스·절차 명세 (Clause 5: Integrated Test Specifications)

> **설계 기법 약어 (ISO/IEC/IEEE 29119-4)**:
> * `EP`: 동등 분할 (Equivalence Partitioning)
> * `BVA`: 경계값 분석 (Boundary Value Analysis)
> * `ST`: 상태 전이 테스팅 (State Transition Testing)
> * `DT`: 결정 테이블 테스팅 (Decision Table Testing)
> * `FI`: 장애 주입 / 오류 추정 (Fault Injection / Error Guessing)

### 5.1. [`FS-01`] 공통 워크스페이스 셸 & 반응형 네비게이션
* **구현 코드**: [`ShellLayout.tsx`](../../apps/web/src/widgets/layout/ShellLayout.tsx), [`SideNavBar.tsx`](../../apps/web/src/widgets/layout/SideNavBar.tsx), [`Header.tsx`](../../apps/web/src/widgets/header/ui/Header.tsx), [`BottomNavBar.tsx`](../../apps/web/src/widgets/layout/BottomNavBar.tsx), [`navigation.ts`](../../apps/web/src/shared/constants/navigation.ts), [`i18n/index.ts`](../../apps/web/src/shared/i18n/index.ts)
* **자동화 테스트**: [`app.spec.tsx`](../../apps/web/src/app/app.spec.tsx), [`navigation.spec.ts`](../../apps/web/src/shared/constants/navigation.spec.ts), [`i18n.spec.tsx`](../../apps/web/src/shared/i18n/i18n.spec.tsx)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **SH-01** | `UC-F-D01`<br>`UC-F-D02` | 중첩 라우팅 전환 및 Suspense Lazy 로딩 검증 | **P0**<br>`ST` | 브라우저 `/` 초기 진입 완료 | 1. 좌측 사이드바에서 `/pdf-tools` 클릭<br>2. `/dbml-tools`, `/docs`, `/ai` 순차 클릭 | **[기대 결과]** 문서 전체 새로고침 없이 `<Outlet />`만 교체되며, 청크 로딩 중 `role="status"` (`PageLoadingFallback`) 노출 후 페이지 마운트<br>**[사후 조건]** `ShellLayout` DOM 인스턴스 유지 |
| **SH-02** | `UC-F-D02` | URL 경로에 따른 네비게이션 Active 상태 및 브레드크럼 동기화 | **P1**<br>`EP` | `/docs/new` 또는 `/pdf-tools` 진입 | 1. 상단 `Header` 브레드크럼 확인<br>2. `SideNavBar` 및 `BottomNavBar` 탭 클래스 확인 | **[기대 결과]** `getBreadcrumbByPath` 반환값과 일치하는 카테고리/페이지명이 표시되고, 현재 경로 탭에만 `active` 스타일이 부여됨 |
| **SH-04** | `UC-RESP-01`<br>`UC-RESP-02`<br>`RISK-06` | 3단계 뷰포트 브레이크포인트 전환 시 셸 리플로우 검증 | **P0**<br>`BVA` | `/` 또는 `/pdf-tools` 진입 | 뷰포트 너비를 경계값 기준으로 변경:<br>1. `1024px` (Desktop 하한)<br>2. `1023px` & `768px` (Tablet 구간)<br>3. `767px` & `390px` (Mobile 구간) | **[기대 결과]**<br>• `≥1024px`: 240px 사이드바 노출, 바텀바 `display: none`<br>• `768~1023px`: 64px 아이콘 전용 사이드바(라벨 숨김)<br>• `≤767px`: 사이드바 숨김, 56px 고정 `BottomNavBar` 노출, 본문 하단 `80px` 패딩 적용으로 컨텐츠 가림 없음 |
| **SH-06** | `UC-F-D04` | 상단 헤더 다국어(`KR / EN`) 전환 및 `localStorage` 영속화 | **P1**<br>`ST` | 데스크톱 뷰포트(`≥1024px`) | 우측 상단 `KR`, `EN` 세그먼트 버튼을 교차 클릭 | **[기대 결과]** 전역 UI 텍스트가 한국어(`ko`) ↔ 영어(`en`)로 즉시 전환되며, `localStorage` (`my-space:locale`) 및 `<html lang>` 속성이 동기화됨 |
| **SH-07** | `UC-F-D01` | 미정의 경로(404) 진입 시 Fallback 라우트 보호 | **P1**<br>`FI` | 브라우저 주소창 접근 | `/unknown-invalid-path` 입력 후 이동 | **[기대 결과]** `NotFoundPage`가 렌더링되며 '대시보드로 돌아가기' 클릭 시 `/`로 정상 복귀 |

---

### 5.2. [`FS-02`] 대시보드 & 로컬 작업 이력 영속화
* **구현 코드**: [`DashboardPage.tsx`](../../apps/web/src/pages/dashboard/DashboardPage.tsx), [`InstalledUtilitiesGrid.tsx`](../../apps/web/src/pages/dashboard/components/InstalledUtilitiesGrid.tsx), [`RecentTasksCard.tsx`](../../apps/web/src/pages/dashboard/components/RecentTasksCard.tsx), [`storage.ts`](../../apps/web/src/shared/utils/storage.ts)
* **자동화 테스트**: [`storage.spec.ts`](../../apps/web/src/shared/utils/storage.spec.ts)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **DB-01** | `UC-F-D03`<br>`UC-RESP-03` | 벤토 그리드 유틸리티 카드 원클릭 이동 및 반응형 열 조절 | **P1**<br>`EP` | 대시보드(`/`) 진입 | 1. 각 유틸리티 카드 클릭<br>2. Desktop/Tablet/Mobile 뷰포트별 그리드 열 수 확인 | **[기대 결과]** 지정된 경로(`/pdf-tools` 등)로 즉시 이동하며, 그리드가 3열 → 2열 → 1열로 적응형 리플로우됨 |
| **DB-02** | `UC-F-D01` | 최근 작업 이력이 없을 때의 Empty State 표현 | **P1**<br>`EP` | `localStorage.removeItem('my-space:recent-tasks')` | 대시보드 렌더링 후 '최근 로컬 작업' 카드 확인 | **[기대 결과]** `"최근 실행된 로컬 작업 이력이 없습니다"` 문구 및 Empty 아이콘 노출 |
| **DB-03** | `UC-F-D01` | 최근 작업 이력 최대 10건(`MAX_TASKS=10`) 경계값 및 FIFO 유지 | **P1**<br>`BVA` | `my-space:recent-tasks`에 10건의 이력이 저장된 상태 | `addRecentTask`로 11번째 신규 항목 추가 후 `getRecentTasks()` 및 UI 확인 | **[기대 결과]** 배열 길이는 정확히 `10`을 유지하며, 신규 항목이 index `0`(최상단)에 삽입되고 가장 오래된 1번째 항목이 제거됨<br>**[사후 조건]** `localStorage`에 10건의 JSON 문자열 영속화 |
| **DB-04** | `UC-F-D01` | 최근 작업 이력 전체 비우기(`clearRecentTasks`) | **P2**<br>`ST` | 작업 이력 1건 이상 존재 | '비우기' 버튼 클릭 | **[기대 결과]** 목록이 즉시 비워지고 Empty State로 전환됨<br>**[사후 조건]** `localStorage`의 해당 키 데이터 초기화 |
| **DB-05** | `RISK-08` | 손상된(Corrupted) `localStorage` JSON 문자열 방어 | **P1**<br>`FI` | `localStorage.setItem('my-space:recent-tasks', '{invalid_json')` | 대시보드 새로고침 및 `getRecentTasks()` 호출 | **[기대 결과]** `SyntaxError`로 앱이 중단되지 않고 `catch` 블록에서 빈 배열(`[]`)로 안전하게 복구됨 |

---

### 5.3. [`FS-03`] Authelia SSO 인증 연동 & 시스템 버전/헬스체크
* **구현 코드**: [`AuthContext.tsx`](../../apps/web/src/entities/auth/model/AuthContext.tsx), [`UserProfileBadge.tsx`](../../apps/web/src/widgets/header/ui/UserProfileBadge.tsx), [`VersionBadge.tsx`](../../apps/web/src/widgets/header/ui/VersionBadge.tsx), [`VersionPopover.tsx`](../../apps/web/src/widgets/header/ui/VersionPopover.tsx), [`useSystemVersion.ts`](../../apps/web/src/entities/version/api/useSystemVersion.ts)
* **자동화 테스트**: [`useCurrentUser.spec.tsx`](../../apps/web/src/entities/auth/api/useCurrentUser.spec.tsx), [`useSystemVersion.spec.ts`](../../apps/web/src/entities/version/api/useSystemVersion.spec.ts), [`VersionBadge.spec.tsx`](../../apps/web/src/widgets/header/ui/VersionBadge.spec.tsx), [`Header.spec.tsx`](../../apps/web/src/widgets/header/ui/Header.spec.tsx)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **AU-01** | `UC-01`<br>`UC-02` (SSO) | 사용자 계정 등급별 맞춤형 배지 렌더링 | **P0**<br>`DT` | `TD-AUTH-01` Mock 응답 준비 | `GET /api/v1/auth/me`에 대해 3가지 유저 응답을 각각 주입하여 헤더 확인 | **[기대 결과]**<br>• `local-admin`: 에메랄드 `[로컬 개발]` 배지<br>• `admin`: 퍼플 `[관리자]` 배지<br>• `guest`: 앰버 `[체험 모드]` 배지 표시 |
| **AU-02** | `UC-03` (SSO) | 사용자 프로필 드롭다운 상세 조회 및 중앙 로그아웃 이동 | **P1**<br>`ST` | 로그인 사용자 상태 | 1. 헤더 프로필 배지 클릭<br>2. 이메일/그룹 태그 확인<br>3. '로그아웃' 버튼 클릭 | **[기대 결과]** 팝오버에 `@username`, 이메일, 소속 그룹이 표시되며, 로그아웃 시 `https://auth.homelab.local/logout`으로 이동 |
| **AU-03** | `UC-01` (SSO)<br>`RISK-03` | 인증 API `401` 또는 네트워크 오류 시 Graceful Degradation | **P1**<br>`FI` | `GET /api/v1/auth/me`가 `401` 반환하도록 설정 | 애플리케이션 초기 접속 | **[기대 결과]** 화면 차단 없이 헤더에 미인증/게스트 상태 및 재시도 버튼이 노출되며 로컬 유틸리티 기능은 정상 사용 가능 |
| **VR-01** | `UC-VER-01`<br>`UC-VER-02` | 프론트엔드(`/version`) 및 백엔드(`/api/v1/version`) 병렬 정상 조회 | **P0**<br>`EP` | 두 엔드포인트 모두 HTTP 200 응답 | 1. 헤더 버전 칩 확인<br>2. 칩 클릭하여 `VersionPopover` 오픈 | **[기대 결과]** 헤더에 에메랄드 점과 `v0.0.1` 표시, 팝오버 내에 Frontend 및 Backend의 버전, 브랜치, 7자리 커밋 해시, 빌드 시각 표시 |
| **VR-02** | `UC-VER-04`<br>`RISK-03` | 백엔드 장애(502) 또는 3초 타임아웃 발생 시 독립 실패 격리 | **P0**<br>`FI` / `BVA` | `/version`은 200 정상, `/api/v1/version`은 4초 지연 또는 502 응답 | 마운트 후 3초 경과 시점의 헤더 칩 및 팝오버 상태 확인 | **[기대 결과]** `AbortController`에 의해 정확히 3초 후 요청이 취소되고 헤더 칩이 붉은색 `error`로 전환됨. 팝오버 내 Frontend 카드는 정상 유지되고 Backend 카드만 `error` 및 재시도 버튼 노출 |
| **VR-03** | `UC-VER-03`<br>`UC-VER-05` | 커밋 해시 클립보드 복사 및 수동 새로고침(`Refresh`) | **P2**<br>`ST` | `VersionPopover` 오픈 상태 | 1. 커밋 해시 클릭<br>2. 하단 '새로고침' 버튼 클릭 | **[기대 결과]** `navigator.clipboard.writeText`로 해시가 복사되고 피드백이 표시되며, 새로고침 클릭 시 버전 API 재조회 수행 |

---

### 5.4. [`FS-04`] PDF 유틸리티 (사전검사 / 병합 / 범위분할 / 낱장분할 / 암호해제)
* **구현 코드**: [`PdfToolsPage.tsx`](../../apps/web/src/pages/pdf-tools/PdfToolsPage.tsx), [`PdfDropzone.tsx`](../../apps/web/src/pages/pdf-tools/components/PdfDropzone.tsx), [`PdfFileList.tsx`](../../apps/web/src/pages/pdf-tools/components/PdfFileList.tsx), [`PdfOperationConfig.tsx`](../../apps/web/src/pages/pdf-tools/components/PdfOperationConfig.tsx), [`pdf.ts`](../../apps/web/src/shared/api/pdf.ts), [`download.ts`](../../apps/web/src/shared/api/download.ts)
* **자동화 테스트**: [`PdfToolsPage.spec.tsx`](../../apps/web/src/pages/pdf-tools/PdfToolsPage.spec.tsx), [`pdf.spec.ts`](../../apps/web/src/shared/api/pdf.spec.ts), [`download.spec.ts`](../../apps/web/src/shared/api/download.spec.ts)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **PDF-01** | `BR-F-P01` | 비-PDF 파일 업로드 차단 검증 | **P0**<br>`EP` | `/pdf-tools` 진입 | `TD-PDF-05` (`image.png`, `notes.txt`) 파일을 드롭존에 드롭 | **[기대 결과]** 파일 리스트에 추가되지 않으며, PDF 형식만 업로드 가능하다는 에러 피드백 표시 |
| **PDF-02** | `BR-F-P02`<br>`RISK-02` | 단일 파일(50MB) 및 총합(100MB) 용량 경계값 검증 | **P0**<br>`BVA` | `/pdf-tools` 진입 | 1. `50.0MB` 파일 업로드 (경계 이하)<br>2. `TD-PDF-03` (`50.1MB`) 업로드 시도<br>3. `TD-PDF-04` (총합 `105MB`) 업로드 시도 | **[기대 결과]** `50.0MB`는 정상 허용되나, 단일 `50MB` 초과 및 누적 `100MB` 초과 시 업로드가 즉시 차단되고 용량 제한 에러 메시지 노출 |
| **PDF-03** | `UC-F-P01` | 파일 선택 즉시 백엔드 사전 검사(`/inspect`) 및 암호 감지 | **P0**<br>`DT` | `TD-PDF-01`(일반), `TD-PDF-02`(암호) 준비 | 두 파일을 업로드하고 파일 카드 UI 변화 확인 | **[기대 결과]** `POST /api/v1/pdf/inspect` 호출 결과에 따라 `TD-PDF-01`은 `10 pages` 표시, `TD-PDF-02`는 자물쇠 배지와 비밀번호 입력 필드가 노출됨 |
| **PDF-04** | `UC-F-P02`<br>`BR-F-P03` | 병합(`merge`) 모드 파일 수 경계값(1개, 2~20개, 21개) 및 병합 실행 | **P0**<br>`BVA` | '병합' 탭 선택 | 1. 1개 업로드 시 실행 버튼 상태 확인<br>2. 2개 업로드 후 순서 변경 및 '작업 실행'<br>3. 21개 업로드 시도 | **[기대 결과]** 1개일 때 실행 비활성화, 21개 초과 차단. 2~20개일 때 `POST /api/v1/pdf/merge` 호출 후 `merged.pdf` 다운로드 트리거<br>**[사후 조건]** `my-space:recent-tasks`에 성공 이력 1건 추가 |
| **PDF-05** | `BR-F-P03` | 단일 파일 전용 모드(`split-range`, `split-all`, `unlock`) 파일 수 제약 | **P1**<br>`ST` | 병합 모드에 파일 3개가 등록된 상태 | '범위 분할' 또는 '암호 해제' 탭으로 모드 전환 | **[기대 결과]** 단일 파일 전용 규칙에 따라 1개 파일만 유지되거나 안내 메시지가 표시됨 |
| **PDF-06** | `UC-F-P03`<br>`BR-F-P04` | 범위 분할(`split-range`) 입력 정규식 및 최대 페이지 초과 검증 | **P0**<br>`BVA` / `EP` | `TD-PDF-01` (10페이지) 업로드 + '범위 분할' 탭 | 1. `"abc"`, `"1..3"`, `"0"` 입력<br>2. `"1-11"` (10페이지 초과) 입력<br>3. `"1-3, 5"` 입력 후 실행 | **[기대 결과]** 1, 2번은 인라인 에러 표시 및 실행 차단. 3번은 `POST /api/v1/pdf/split/range` 호출 후 추출된 PDF 다운로드 |
| **PDF-07** | `UC-F-P04` | 낱장 분할(`split-all`) 실행 및 ZIP 아카이브 다운로드 | **P1**<br>`EP` | `TD-PDF-01` 업로드 + '낱장 분할' 탭 | '작업 실행' 클릭 | **[기대 결과]** `POST /api/v1/pdf/split/all` 응답(`application/zip`)을 받아 `.zip` 파일 다운로드 실행 |
| **PDF-08** | `UC-F-P05` | 암호 해제(`unlock`) 및 백엔드 도메인 예외 코드(422) 매핑 검증 | **P0**<br>`DT` / `FI` | '암호 해제' 탭 | 1. `TD-PDF-02` + 오타 비밀번호 입력 (`PDF_INVALID_PASSWORD`)<br>2. `TD-PDF-01` 암호 없는 파일 실행 (`PDF_NOT_PASSWORD_PROTECTED`)<br>3. `TD-PDF-02` + `"pass1234"` 정상 실행 | **[기대 결과]** 각 도메인 에러 코드에 매핑된 한국어 안내 메시지가 정확히 표시되며, 3번 성공 시 복호화된 PDF 다운로드 |
| **PDF-09** | `RISK-02` | 변환 중 중복 요청 차단 및 `URL.revokeObjectURL` 메모리 해제 | **P1**<br>`ST` | 변환 API 응답 대기 중 (`isProcessing: true`) | 1. 실행 버튼 연속 클릭 시도<br>2. 다운로드 완료 후 `triggerBlobDownload` 내부 호출 확인 | **[기대 결과]** 처리 중 버튼/드롭존 `disabled`로 중복 요청 `0건` 보장<br>**[사후 조건]** 임시 생성된 `<a download>` DOM 제거 및 `URL.revokeObjectURL` 호출 완료 |

---

### 5.5. [`FS-05`] DBML 스키마 변환기 & 인터랙티브 ERD 시각화
* **구현 코드**: [`DbmlToolsPage.tsx`](../../apps/web/src/pages/dbml-tools/DbmlToolsPage.tsx), [`dbmlParser.ts`](../../apps/web/src/pages/dbml-tools/model/dbmlParser.ts), [`erdLayout.ts`](../../apps/web/src/pages/dbml-tools/model/erdLayout.ts), [`ErdCanvas.tsx`](../../apps/web/src/pages/dbml-tools/ui/ErdCanvas.tsx), [`SqlPreviewModal.tsx`](../../apps/web/src/pages/dbml-tools/ui/SqlPreviewModal.tsx)
* **자동화 테스트**: [`DbmlToolsPage.spec.tsx`](../../apps/web/src/pages/dbml-tools/DbmlToolsPage.spec.tsx), [`dbmlParser.spec.ts`](../../apps/web/src/pages/dbml-tools/model/dbmlParser.spec.ts), [`erdLayout.spec.ts`](../../apps/web/src/pages/dbml-tools/model/erdLayout.spec.ts), [`ErdCanvas.spec.tsx`](../../apps/web/src/pages/dbml-tools/ui/ErdCanvas.spec.tsx), [`SqlPreviewModal.spec.tsx`](../../apps/web/src/pages/dbml-tools/ui/SqlPreviewModal.spec.tsx)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **DBML-01** | `UC-DBML-01`<br>`UC-DBML-02` | 실시간 DBML 파싱 및 ERD 테이블/외래키 곡선 렌더링 | **P0**<br>`EP` | `/dbml-tools` 진입 | `TD-DBML-01` 샘플 스키마 로드 또는 직접 타이핑 | **[기대 결과]** 즉시 동기 파싱(`useMemo`, 0~10ms) 후 우측 캔버스에 테이블 카드 3개와 SVG 베지어 곡선 2개가 렌더링되고, 하단에 `Schema Valid (3 tables, 2 refs)` 표시 |
| **DBML-02** | `UC-DBML-01` | 비정상 DBML 구문 입력 시 에러 라인 감지 및 캔버스 보호 | **P0**<br>`FI` | `TD-DBML-01` 정상 렌더링 상태 | 에디터에 `TD-DBML-02` (문법 오류 구문) 입력 | **[기대 결과]** 에디터 하단 상태바에 `Line X` 에러 메시지와 붉은색 배지가 표시되며, 런타임 크래시 없이 ERD 뷰가 유지됨 |
| **DBML-03** | `UC-DBML-03`<br>`RISK-03` | 다중 SQL 다이얼렉트 변환 및 백엔드 오프라인 Fallback 검증 | **P1**<br>`DT` / `FI` | 유효한 DBML 작성 상태 | 1. `PostgreSQL`, `MySQL`, `SQLite`, `MSSQL` 선택 후 변환 실행<br>2. 백엔드 API 네트워크 차단 후 변환 실행 | **[기대 결과]** `SqlPreviewModal`이 열리며 각 DB 문법에 맞는 DDL이 출력됨. 백엔드 오프라인 시에도 내장 클라이언트 Fallback 엔진으로 즉시 DDL 생성 및 클립보드 복사 성공 |
| **DBML-04** | `UC-DBML-04` | SQL DDL → DBML 역변환 및 코드 포맷팅 | **P2**<br>`EP` | 유효한 `CREATE TABLE` SQL 준비 | SQL Import 실행 후 `Format Code` 클릭 | **[기대 결과]** SQL이 DBML 구문으로 역변환되어 에디터에 반영되고 ERD가 즉시 갱신됨 |
| **DBML-05** | `UC-DBML-05` | ERD 캔버스 배율(`50%~150%`), 드래그 패닝 및 테이블 검색 | **P1**<br>`BVA` | `TD-DBML-01` 로드 상태 | 1. 줌 인/아웃 경계(`50%`, `150%`), `Fit View`, `Recenter` 클릭<br>2. `Search tables...`에 `"users"` 입력 | **[기대 결과]** 배율이 `50%~150%` 범위 내에서 조절되고, `"users"` 입력 시 해당 테이블 카드가 하이라이트됨 |
| **DBML-06** | `RISK-06` | 모바일 뷰포트 플로팅 줌 컨트롤 및 하단 상태바 배치 | **P2**<br>`EP` | 모바일 뷰포트(`390px`) | `/dbml-tools` 진입 후 `MobileFloatingControls` 조작 | **[기대 결과]** 바텀바(`56px`) 위에 상태바(`bottom-14`)가 겹침 없이 배치되고 플로팅 줌 버튼이 정상 동작함 |

---

### 5.6. [`FS-06`] 마크다운 문서 스튜디오 (라이브러리 / 에디터 / 상세뷰 / 리비전)
* **구현 코드**: [`MarkdownDocsPage.tsx`](../../apps/web/src/pages/markdown-docs/MarkdownDocsPage.tsx), [`DocumentLibraryView.tsx`](../../apps/web/src/pages/markdown-docs/views/DocumentLibraryView.tsx), [`MarkdownEditorView.tsx`](../../apps/web/src/pages/markdown-docs/views/MarkdownEditorView.tsx), [`MarkdownDetailView.tsx`](../../apps/web/src/pages/markdown-docs/views/MarkdownDetailView.tsx), [`MarkdownPreview.tsx`](../../apps/web/src/features/markdown/renderer/MarkdownPreview.tsx), [`useAssetUpload.ts`](../../apps/web/src/features/markdown/editor/useAssetUpload.ts), [`RevisionHistoryModal.tsx`](../../apps/web/src/features/markdown/revision/RevisionHistoryModal.tsx), [`FolderFormModal.tsx`](../../apps/web/src/features/markdown/folder/FolderFormModal.tsx)
* **자동화 테스트**: [`MarkdownDocsPage.spec.tsx`](../../apps/web/src/pages/markdown-docs/MarkdownDocsPage.spec.tsx), [`MarkdownPreview.spec.tsx`](../../apps/web/src/features/markdown/renderer/MarkdownPreview.spec.tsx), [`useAssetUpload.spec.ts`](../../apps/web/src/features/markdown/editor/useAssetUpload.spec.ts), [`StickyToc.spec.tsx`](../../apps/web/src/pages/markdown-docs/components/StickyToc.spec.tsx), [`markdownApi.spec.ts`](../../apps/web/src/entities/markdown/api/markdownApi.spec.ts)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **MD-01** | `UC-MD-01`<br>`UC-MD-05` | 마크다운 문서 생성 → 상세 조회 → 수정(버전 증가) → 삭제 생명주기 | **P0**<br>`ST` | `/docs` 진입 | 1. `/docs/new`에서 문서 저장(`POST /documents`)<br>2. `/docs/:id/edit`에서 본문 수정 저장(`PUT /documents/:id`)<br>3. 삭제(`DELETE /documents/:id`) 실행 | **[기대 결과]** 생성 후 `/docs/:id`로 이동, 수정 후 버전이 `v1 → v2`로 증가하며, 삭제 후 `/docs` 목록에서 제거됨 |
| **MD-02** | `RISK-01` | 마크다운 렌더링 시 `DOMPurify` 기반 XSS 공격 무력화 검증 | **P0**<br>`FI` | 에디터(`/docs/new`) 진입 | `TD-MD-01` (`<script>`, `<img onerror>`, `javascript:` 링크) 입력 | **[기대 결과]** 렌더링된 프리뷰 DOM에서 악성 태그와 이벤트 핸들러가 100% 제거(Sanitize)되며 `window.__xss`가 실행되지 않음 |
| **MD-03** | `UC-MD-01` | Frontmatter, GFM, KaTeX 수식, Mermaid 다이어그램 통합 렌더링 | **P1**<br>`EP` | 에디터 진입 | `TD-MD-02` 입력 후 우측 프리뷰 및 코드 복사 버튼 확인 | **[기대 결과]** YAML Frontmatter 매니페스트 카드, GFM 표, KaTeX 수식, Mermaid SVG가 정상 렌더링되고 코드 블록 클립보드 복사가 동작함 |
| **MD-04** | `UC-MD-10`<br>`RISK-05` | 계층형 폴더 부모 변경 시 순환 참조(Circular Dependency) 차단 | **P1**<br>`DT` / `BVA` | 폴더 트리 `A` → `B`(자식) → `C`(손자) 존재 | 폴더 `A`의 수정 모달(`FolderFormModal`)을 열고 부모 폴더 선택 드롭다운 확인 | **[기대 결과]** 자기 자신(`A`) 및 하위 자손(`B`, `C`)은 부모 선택지에서 비활성화(`disabled`)되거나 제외되어 순환 참조가 원천 차단됨 |
| **MD-05** | `UC-MD-10` | 폴더 삭제 시 내부 문서 미분류(Root) 안전 이관 | **P1**<br>`ST` | 문서 2개가 속한 폴더 `A` 존재 | 폴더 `A` 삭제(`DELETE /folders/:id`) 실행 | **[기대 결과]** 폴더 `A`는 트리에서 제거되나, 내부 문서 2개는 삭제되지 않고 전체/미분류 목록에서 정상 조회됨 |
| **MD-06** | `UC-MD-03` | OpenSearch 전문 검색 250ms 디바운스 및 `<mark>` 스니펫 하이라이트 | **P1**<br>`BVA` | `/docs` 검색창 포커스 | 250ms 이내에 `"k3s"` 연속 타이핑 | **[기대 결과]** 타이핑 완료 250ms 후 `GET /search?q=k3s`가 단 1회 호출되며, 결과 카드 스니펫에 `<mark>k3s</mark>` 하이라이트가 표시됨 |
| **MD-07** | `UC-MD-04` | 에디터 이미지 드래그앤드롭 / 클립보드 붙여넣기 업로드 및 용량 검증 | **P1**<br>`BVA` / `EP` | 에디터 본문 포커스 | 1. 5MB PNG 이미지를 드롭 또는 Paste<br>2. 11MB(10MB 초과) 이미지 또는 `.exe` 파일 드롭 | **[기대 결과]** 1번은 `POST /assets/upload` 성공 후 커서 위치에 `![...](/api/v1/markdown/assets/...)`가 자동 삽입됨. 2번은 업로드 차단 및 에러 토스트 표시 |
| **MD-08** | `UC-MD-06`<br>`UC-MD-07` | 리비전 타임라인 조회, 두 버전 간 Diff 비교 및 과거 버전 복원 | **P1**<br>`ST` | `v1`, `v2` 리비전이 존재하는 문서 | 1. `RevisionHistoryModal` 오픈 후 `v1` vs `v2` Diff 조회<br>2. `v1` 선택 후 '이 버전으로 복원' 승인 | **[기대 결과]** 추가/삭제 라인이 색상별로 비교 표시되며, 복원 실행 시 `POST /revisions/:version/restore` 호출 후 본문이 복원됨 |
| **MD-09** | `UC-MD-01` | 상세 뷰 우측 스티키 목차(`StickyToc`) 자동 추출 및 스크롤 이동 | **P2**<br>`EP` | `TD-MD-02`로 생성된 문서 상세 뷰(`/docs/:id`) | 우측 `StickyToc`의 헤딩 링크 클릭 | **[기대 결과]** 문서 내 `H1~H3` 계층이 목차로 추출되며, 클릭 시 해당 앵커 위치로 스크롤 이동함 |
| **MD-10** | `UC-MD-08`<br>`UC-MD-09` | 로컬 `.md` 파일 Import 및 `.md` / `.pdf` Export 다운로드 | **P2**<br>`EP` | `/docs` 및 `/docs/:id` | 1. `TD-MD-02` 파일 Import<br>2. 상세 뷰에서 `.md` 및 `PDF` 내보내기 클릭 | **[기대 결과]** Import 시 제목/본문이 자동 로드되며, Export 시 브라우저 파일 다운로드가 트리거됨 |

---

### 5.7. [`FS-07`] AI 워크스페이스 (J.A.R.V.I.S. Neural Core 음성 비서)
* **구현 코드**: [`AiWorkspacePage.tsx`](../../apps/web/src/pages/ai/AiWorkspacePage.tsx), [`useAiStream.ts`](../../apps/web/src/entities/ai/hooks/useAiStream.ts), [`useMediaRecorderPtt.ts`](../../apps/web/src/entities/ai/hooks/useMediaRecorderPtt.ts), [`browserSpeech.ts`](../../apps/web/src/entities/ai/lib/browserSpeech.ts), [`TacticalAudioBar.tsx`](../../apps/web/src/features/ai/neural-core/TacticalAudioBar.tsx), [`SpokenMessageCard.tsx`](../../apps/web/src/features/ai/transcript-panel/SpokenMessageCard.tsx)
* **자동화 테스트**: [`AiWorkspacePage.spec.tsx`](../../apps/web/src/pages/ai/AiWorkspacePage.spec.tsx), [`AiFeatures.spec.tsx`](../../apps/web/src/features/ai/__tests__/AiFeatures.spec.tsx), [`useAiStream.spec.ts`](../../apps/web/src/entities/ai/hooks/useAiStream.spec.ts), [`browserSpeech.spec.ts`](../../apps/web/src/entities/ai/lib/browserSpeech.spec.ts), [`aiClient.spec.ts`](../../apps/web/src/entities/ai/api/aiClient.spec.ts)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **AI-01** | `UC-01` (AI)<br>`RISK-04` | PTT(Push-to-Talk) 음성 수음 및 상태 머신(`IDLE → LISTENING → THINKING`) 전이 | **P0**<br>`ST` | `/ai` 진입, 마이크 권한 허용, 상태 `IDLE` | 1. PTT 버튼 홀드 또는 `Space` 키 누르고 유지<br>2. 발화 후 키 해제(`keyup`) | **[기대 결과]** 홀드 중 `LISTENING` 전환 및 `MediaRecorder` 녹음 시작, 해제 시 `THINKING` 전환 후 `POST /api/v1/ai/voice/stream`으로 WebM Blob 전송<br>**[사후 조건]** 마이크 트랙 정리 완료 |
| **AI-02** | `UC-02` (AI)<br>`RISK-04` | 후속 질문 텍스트 인풋 포커스 중 `Space` 키 단축키 가로채기 방지 | **P0**<br>`BVA` / `ST` | 우측 하단 `FollowUpInputBar` (`<input>`/`<textarea>`)에 포커스 상태 | `"안녕 하세요"` 타이핑 (중간에 `Space` 키 입력) 후 `Enter` 전송 | **[기대 결과]** 인풋 포커스 중에는 `Space` 입력이 PTT나 Interrupt를 트리거하지 않고 정상 공백 문자로 입력되며, `Enter` 시 JSON 텍스트 쿼리 전송 |
| **AI-03** | `UC-01`<br>`UC-02` (AI) | SSE 멀티모달 스트리밍 청크 파싱 및 UI/TTS 동기화 | **P0**<br>`ST` | 질문 전송 후 `text/event-stream` 수신 | `transcription` → `benchmark` → `context_ref` → `token` → `audio_complete` → `done` 이벤트 순차 수신 | **[기대 결과]** `token` 수신 시 `SPEAKING` 전환 및 실시간 텍스트 누적, `BenchmarkDeltaCard` 지표 표시, `context_ref` 문서 칩 및 `AudioPlayerPill` 렌더링, 완료 시 `IDLE` 전환 |
| **AI-04** | `UC-03` (AI)<br>`RISK-04` | 발화 즉시 중단(`Interrupt Speech`) 시 스트림/TTS/백엔드 동시 종료 | **P1**<br>`ST` | AI 답변 출력 및 TTS 발화 중 (`SPEAKING`) | `Interrupt Speech` 버튼 클릭 또는 `Space` 키 입력 (인풋 비포커스 상태) | **[기대 결과]** 1. 클라이언트 SSE `AbortController.abort()` 실행<br>2. `speechSynthesis.cancel()` 및 오디오 정지<br>3. `POST /api/v1/ai/chat/interrupt` 호출 및 `IDLE` 즉시 전환 |
| **AI-05** | `RISK-08` | 브라우저 마이크 권한 거부(`NotAllowedError`) 시 텍스트 모드 안전 폴백 | **P1**<br>`FI` | `navigator.mediaDevices.getUserMedia`가 `NotAllowedError`를 던지도록 설정 | PTT 버튼 클릭 시도 후 우측 텍스트 인풋으로 질문 전송 | **[기대 결과]** 크래시 없이 마이크 권한 안내 상태가 표시되며, 텍스트 인풋(`FollowUpInputBar`)을 통한 질의응답은 100% 정상 동작함 |
| **AI-06** | `UC-03` (AI) | 전술 오디오 제어(`Alt+M` 음소거, 배속 `1.0x~1.5x`, 보이스 변경) | **P2**<br>`EP` | `/ai` 화면 | 1. `Alt+M` 입력하여 마이크 음소거 토글<br>2. 배속 및 보이스 셀렉터 변경 | **[기대 결과]** 음소거 시 붉은색 아이콘 표시 및 PTT 비활성화, 변경된 배속/보이스가 `browserSpeech` 합성기 및 요청 페이로드에 반영됨 |
| **AI-07** | `UC-04` (AI) | AI 답변 카드의 마크다운 스튜디오 즉시 저장(`Save to Markdown`) 및 복사 | **P1**<br>`EP` | AI 답변 메시지 카드 생성 완료 | 카드 하단 툴바에서 `Save to Markdown` 및 `Copy` 클릭 | **[기대 결과]** 마크다운 문서 생성 API가 호출되어 답변 본문과 벤치마크 델타가 새 문서로 저장되고 저장 완료 피드백 노출 |

---

### 5.8. [`FS-08`] 런타임 환경변수 주입 & 전역 에러 복원력 (Infra & Fault Tolerance)
* **구현 코드**: [`env.ts`](../../apps/web/src/shared/config/env.ts), [`client.ts`](../../apps/web/src/shared/api/client.ts), [`ErrorBoundary.tsx`](../../apps/web/src/shared/components/error/ErrorBoundary.tsx)
* **자동화 테스트**: [`env.spec.ts`](../../apps/web/src/shared/config/env.spec.ts), [`client.spec.ts`](../../apps/web/src/shared/api/client.spec.ts), [`ErrorBoundary.spec.tsx`](../../apps/web/src/shared/components/error/ErrorBoundary.spec.tsx)

| TC ID | 추적성 (Req / Risk) | 테스트 조건 (Test Condition) | 우선순위 / 기법 | 사전 조건 (Preconditions) | 입력 및 테스트 절차 (Inputs & Procedure) | 기대 결과 및 사후 조건 (Expected Results & Postconditions) |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **INF-01** | `ADR-0002`<br>`RISK-07` | Docker Nginx 런타임 환경변수(`window.__ENV__`) 우선순위 해석 검증 | **P0**<br>`DT` | `import.meta.env.VITE_API` = `"http://build-time"` 설정 | 1. `window.__ENV__.VITE_API = "https://runtime"`일 때 `getEnv` 호출<br>2. `window.__ENV__.VITE_API = ""` (빈 문자열)일 때 호출<br>3. 둘 다 없을 때 `getEnv('KEY', 'fallback')` 호출 | **[기대 결과]**<br>• 1번: `"https://runtime"` 반환<br>• 2번: 빈 문자열 무시 후 `"http://build-time"` 반환<br>• 3번: `'fallback'` 반환 |
| **INF-02** | `RISK-03` | 하위 컴포넌트 렌더링 예외 발생 시 전역 `ErrorBoundary` 격리 및 복구 | **P0**<br>`FI` | 하위 컴포넌트가 렌더링 중 `throw new Error('UI Crash')` 발생 | 1. 에러 화면(`role="alert"`) 및 에러 메시지 표시 확인<br>2. `'다시 시도'` 클릭<br>3. `'대시보드로 복귀'` 클릭 | **[기대 결과]** 백지 화면(WSOD) 없이 다크 테마 복구 카드가 노출되며, `'다시 시도'` 클릭 시 `hasError: false`로 리셋, `'대시보드로 복귀'` 시 `/`로 이동 |
| **INF-03** | `ADR-0001`<br>`RISK-03` | `apiClient`의 구조화된 JSON 에러 파싱 및 비-JSON(502 HTML) 방어 | **P1**<br>`FI` | Mock Fetch 구성 | 1. `422` + `{ code: "ERR_CODE", message: "상세 오류" }` 반환<br>2. `502 Bad Gateway` + `<html>...</html>` 반환 | **[기대 결과]** 1번은 `code`와 `message`를 보존한 에러 객체를 throw하며, 2번은 `response.json()` 파싱 실패로 죽지 않고 표준 HTTP 상태 에러로 안전하게 변환됨 |

---

## 6. 요구사항 양방향 추적성 매트릭스 (Clause 6: Requirements Traceability Matrix — RTM)

| 명세서 (Specification) | 요구사항 / 유스케이스 / 비즈니스 규칙 ID | 매핑된 테스트 케이스 (TC ID) | 커버리지 상태 |
| :--- | :--- | :--- | :---: |
| [`dashboard.md`](../specs/dashboard.md) | `UC-F-D01`, `UC-F-D02`, `UC-F-D03`, `UC-F-D04` | `SH-01`, `SH-02`, `SH-06`, `SH-07`, `DB-01~05` | ✅ 100% |
| [`responsive-layout.md`](../specs/responsive-layout.md) | `UC-RESP-01`, `UC-RESP-02`, `UC-RESP-03` | `SH-04`, `DB-01`, `DBML-06` | ✅ 100% |
| [`authelia-sso-integration.md`](../specs/authelia-sso-integration.md) | `UC-01`, `UC-02`, `UC-03` (SSO) | `AU-01`, `AU-02`, `AU-03` | ✅ 100% |
| [`system-version-check.md`](../specs/system-version-check.md) & [`version-endpoint.md`](../specs/version-endpoint.md) | `UC-VER-01`, `UC-VER-02`, `UC-VER-03`, `UC-VER-04`, `UC-VER-05` | `VR-01`, `VR-02`, `VR-03` | ✅ 100% |
| [`pdf-tools.md`](../specs/pdf-tools.md) | `UC-F-P01~P05`, `BR-F-P01~P04` | `PDF-01`, `PDF-02`, `PDF-03`, `PDF-04`, `PDF-05`, `PDF-06`, `PDF-07`, `PDF-08`, `PDF-09` | ✅ 100% |
| [`dbml-tools.md`](../specs/dbml-tools.md) | `UC-DBML-01~06` | `DBML-01`, `DBML-02`, `DBML-03`, `DBML-04`, `DBML-05`, `DBML-06` | ✅ 100% |
| [`markdown-docs.md`](../specs/markdown-docs.md) | `UC-MD-01~10` | `MD-01`, `MD-02`, `MD-03`, `MD-04`, `MD-05`, `MD-06`, `MD-07`, `MD-08`, `MD-09`, `MD-10` | ✅ 100% |
| [`ai-workspace.md`](../specs/ai-workspace.md) | `UC-01`, `UC-02`, `UC-03`, `UC-04` (AI) | `AI-01`, `AI-02`, `AI-03`, `AI-04`, `AI-05`, `AI-06`, `AI-07` | ✅ 100% |
| [`ADR-0001`](../adr/0001-api-client-and-proxy-strategy.md) & [`ADR-0002`](../adr/0002-frontend-docker-deployment-and-runtime-env-strategy.md) | API Client 정규화, Runtime Env 동적 주입, ErrorBoundary | `INF-01`, `INF-02`, `INF-03` | ✅ 100% |
