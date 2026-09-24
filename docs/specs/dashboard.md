---
status: review
owner: Keunhyeok Lim
last-updated: 2026-09-24
---

# 대시보드 및 워크스페이스 셸 사양서 (Dashboard & Workspace Shell Specification)

## 1. 개요 (Summary)

`my-space` 개인 개발자 워크스페이스의 진입점이자 홈 화면인 **대시보드(Dashboard)**와 전체 웹 애플리케이션의 뼈대를 이루는 **공통 네비게이션 셸(SideNavBar + TopNavBar)**의 사용자 요구사항, 인터랙션 흐름 및 컴포넌트 구조를 정의합니다.

사용자는 대시보드를 통해 설치된 로컬 유틸리티(PDF, DBML, 마크다운 등)를 한눈에 파악하고 즉시 실행할 수 있으며, 시스템 리소스 및 최근 작업 이력을 직관적으로 모니터링할 수 있습니다.

시각적 스타일링(다크 모드, 징크 기반 토널 레이어, 색상 팔레트, Geist + Pretendard + JetBrains Mono 서체 체계, 1px 미세 보더 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 최우선 기준으로 준수합니다.

---

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 목표 (Goals)
* **공통 워크스페이스 셸 (Workspace Shell)**:
  * 좌측 고정 사이드바(`SideNavBar`, 너비 240px)와 상단 고정 헤더(`TopNavBar`, 높이 48px)를 모든 하위 페이지에 일관되게 제공하는 레이아웃 구조 확립
  * React Router 6 기반의 중첩 라우팅(`ShellLayout` 및 `<Outlet />`) 구성
* **네비게이션 및 라우팅 (Navigation & Routing)**:
  * 대시보드(`/`), PDF 유틸리티(`/pdf-tools`), DBML 유틸리티(`/dbml-tools` - 준비 중), 마크다운 문서(`/docs` - 준비 중) 탭 간 매끄러운 화면 전환
  * 현재 위치한 경로에 따른 사이드바 탭의 활성(Active) 상태 자동 시각화
* **퀵 커맨드 팔레트 (Quick Command & Palette)**:
  * 사이드바 내 검색창 형태의 퀵 커맨드 버튼 및 단축키 배지(`<kbd>⌘K</kbd>`) 노출
  * 키보드 단축키(`⌘K` / `Ctrl+K`) 입력 또는 버튼 클릭 시 열리는 경량 커맨드 팔레트(`cmdk` 기반) 모달 연동
* **설치된 유틸리티 빠른 실행 그리드 (3-Column Bento Grid)**:
  * PDF 유틸리티, DBML 유틸리티, 마크다운 문서의 3개 카드 배치
  * 카드별 아이콘, 최근 사용 시간, 설명 문구, 상태 태그, 원클릭 진입 링크 제공
* **대시보드 6:4 분할 모니터링 뷰 (Split View)**:
  * **좌측 60% (7열)**: 최근 로컬 작업 이력 목록 (파일별 아이콘, 파일명, 처리 결과 태그, 소요 시간/크기, 타임스탬프)
  * **로컬 스토리지 영속화**: 백엔드 연동 전까지 브라우저 `localStorage`에 최근 작업 이력을 보관하여 새로고침 후에도 유지
  * **우측 40% (5열)**: 로컬 런타임 환경 상태 (로컬 스토리지 캐시 용량, WASM 힙 메모리 사용률 미세 프로그레스 바, 엔진 상태 점)
* **다국어 서체 및 언어 토글**:
  * 한글 우선 표기 + 영문 보조 명칭 병기 (예: `대시보드 Dashboard`)
  * 상단 헤더의 `KR / EN` 세그먼트 버튼 인터페이스 제공

### 제외 대상 (Non-goals)
* 원격 서버 전체 파일 인덱싱 검색 엔진 (초기 ⌘K는 앱 내 라우트 이동 및 유틸리티 바로 실행에 집중)
* 복잡한 백엔드 실시간 시스템 메트릭 데몬 수집 (초기에는 브라우저 스토리지 및 로컬 런타임 기본 지표 시각화에 집중)
* DBML 및 마크다운 유틸리티의 세부 기능 구현 (각 유틸리티의 독립 Spec에서 별도 정의)

---

## 3. 유스케이스 및 사용자 흐름 (Use Cases)

| 유스케이스 ID | 액터 | 목표 | 주요 인터랙션 흐름 |
| :--- | :--- | :--- | :--- |
| `UC-F-D01` | 사용자 | 대시보드 홈 진입 및 워크스페이스 상태 조망 | 1. 애플리케이션 진입(`/`) → 2. 고정 셸과 함께 대시보드 로드 → 3. 유틸리티 목록 및 최근 작업, 시스템 지표 확인 |
| `UC-F-D02` | 사용자 | 사이드바 탭을 통한 유틸리티 화면 전환 | 1. 사이드바의 'PDF 유틸리티' 탭 클릭 → 2. URL `/pdf-tools` 이동 → 3. 셸은 유지된 채 본문만 PDF 유틸리티 뷰로 전환 |
| `UC-F-D03` | 사용자 | 벤토 그리드 카드를 통한 유틸리티 실행 | 1. 대시보드의 'PDF 유틸리티' 카드 내 '유틸리티 실행' 클릭 → 2. `/pdf-tools` 화면으로 즉시 이동 |
| `UC-F-D04` | 사용자 | 상단 언어 전환 (KR / EN) 토글 | 1. 헤더 우측의 `KR` 또는 `EN` 버튼 클릭 → 2. 다국어 로케일 상태 변경 및 UI 텍스트 반영 |
| `UC-F-D05` | 사용자 | 퀵 커맨드 트리거 클릭 | 1. 사이드바의 검색창/⌘K 버튼 클릭 → 2. 커맨드 팔레트 열기 이벤트 트리거 |

---

## 4. 화면 및 컴포넌트 요구사항 (UI / Component Specs)

> 디자인 세부 사항(색상, 여백, 곡률 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 준수합니다.

### 4.1. 컴포넌트 계층 구조

```text
ShellLayout (전체 웹 애플리케이션 최상위 공통 셸)
 ├── SideNavBar (좌측 240px 고정 네비게이션)
 │    ├── BrandHeader (시스템 아바타 'm', 버전 'v0.1.0-local', 상태 뱃지 'idle')
 │    ├── QuickCommandTrigger (검색창 형태 버튼 + <kbd>⌘K</kbd>)
 │    ├── NavTabList (대시보드, PDF 유틸리티, DBML 유틸리티, 마크다운 문서 링크)
 │    └── EngineStatusFooter (로컬 엔진 상태 점 '실행 중', 환경설정 링크)
 ├── TopNavBar (상단 48px 고정 헤더)
 │    ├── BreadcrumbNav (my-space / 워크스페이스 / 대시보드)
 │    └── TopActionCluster (KR/EN 토글, 터미널/알림/테마 아이콘, Docs 버튼, 작업 실행 CTA)
 └── MainCanvas (본문 영역, pl-60 오프셋, max-w-7xl 중앙 정렬)
      └── <Outlet />
           └── DashboardPage (대시보드 메인 뷰)
                ├── WorkspaceHeader (H1 '워크스페이스 개요', 로컬 격리 환경 태그)
                ├── InstalledUtilitiesSection (3열 벤토 그리드: PDF, DBML, Markdown)
                │    └── UtilityCard (아이콘, 최근 사용, 설명, 태그, 실행 링크)
                └── MonitoringSplitSection (6:4 분할 그리드)
                     ├── RecentTasksCard (좌측 7열: 최근 로컬 작업 리스트)
                     └── RuntimeEnvironmentCard (우측 5열: 메모리/캐시 미세 프로그레스 바)
```

### 4.2. UI 상태 매트릭스 (UI States)

| 상태 | 화면 표현 및 동작 |
|---|---|
| **기본 대시보드 뷰 (Ready)** | 셸과 3열 벤토 그리드, 최근 작업 내역, 런타임 지표가 모두 정상 렌더링됨 |
| **최근 작업 내역 없음 (Empty)** | 최근 작업 목록 대신 "최근 수행된 로컬 작업이 없습니다" 안내 문구 노출 |
| **엔진 오프라인 (Offline/Error)** | 사이드바 하단 엔진 상태 점이 회색/적색으로 변경되고 '로컬 엔진 중단됨' 표시 |

---

## 5. 클라이언트 상태 및 데이터 흐름 (State & Data Flow)

### 5.1. 라우팅 구조 (React Router 6)

```typescript
// 앱 전역 라우트 구성 규격
export const appRoutes = [
  {
    path: '/',
    element: <ShellLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pdf-tools', element: <PdfToolsPage /> },
      { path: 'dbml-tools', element: <PlaceholderPage title="DBML 유틸리티" /> },
      { path: 'docs', element: <PlaceholderPage title="마크다운 문서" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
```

### 5.2. 대시보드 데이터 모델

```typescript
export interface RecentTaskItem {
  id: string;
  toolType: 'pdf' | 'dbml' | 'markdown' | 'system';
  title: string;
  statusBadge: string;
  description: string;
  timestamp: string;
}

// LocalStorage 영속화 키 및 정책
export const RECENT_TASKS_STORAGE_KEY = 'my-space:recent-tasks';
export const MAX_RECENT_TASKS_COUNT = 10;

export interface RuntimeMetrics {
  storageCacheUsedMB: number;
  storageCacheTotalMB: number;
  wasmHeapUsedMB: number;
  wasmHeapTotalMB: number;
  isEngineActive: boolean;
  engineVersion: string;
}
```

---

## 6. 백엔드 API 연동 규격 (API Integration)

대시보드는 기본적으로 독립적인 프론트엔드 워크스페이스 셸로 동작하며, 향후 백엔드 헬스체크 API 확정 시 아래 엔드포인트를 통해 상태를 연동합니다:

* `GET /api/v1/health`: 로컬 백엔드 서버 상태 및 버전 확인 (옵셔널 연동)
* 백엔드가 오프라인 상태이더라도 프론트엔드 UI 셸 및 클라이언트 전용 기능은 정상 구동되어야 합니다 (우아한 성능 저하 - Graceful Degradation).

---

## 7. 에러 핸들링 및 피드백 (Error Handling)

| 에러 시나리오 | 화면 피드백 및 대응 |
|---|---|
| 존재하지 않는 경로 진입 (`404`) | `NotFoundPage` 렌더링 및 '대시보드로 돌아가기' 버튼 제공 |
| 백엔드 연결 불가 (네트워크 단절) | 사이드바 엔진 상태를 '오프라인'으로 전환하되, 화면 인터랙션은 유지 |
| LocalStorage 용량 초과 또는 읽기 오류 | 오류 발생 시 기본 빈 배열로 안전하게 폴백(Fallback) |

---

## 8. 오픈 질문 및 결정 사항 (Decisions & Open Questions)

* [x] **커맨드 팔레트 모달 라이브러리 도입**: ⌘K 단축키 입력 시 열리는 모달에 경량 커맨드 메뉴 라이브러리인 **`cmdk`를 도입**하여 접근성 높은 키보드 네비게이션 및 빠른 화면 이동 지원 확정.
* [x] **최근 작업 이력의 영속화**: 백엔드 DB 연동 전까지 브라우저의 **`localStorage`(`my-space:recent-tasks`)에 최대 10건의 최근 작업 이력을 영속화**하여 관리하기로 확정.
