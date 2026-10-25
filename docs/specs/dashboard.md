---
status: implemented
owner: Keunhyeok Lim
last-updated: 2026-09-25
---

# 대시보드 및 워크스페이스 셸 사양서 (Dashboard & Workspace Shell Specification)

## 1. 개요 (Summary)

`my-space` 개인 개발자 워크스페이스의 진입점이자 홈 화면인 **대시보드(Dashboard)**와 전체 웹 애플리케이션의 뼈대를 이루는 **공통 네비게이션 셸(SideNavBar + TopNavBar + BottomNavBar)**의 사용자 요구사항, 인터랙션 흐름 및 컴포넌트 구조를 정의합니다.

사용자는 대시보드를 통해 설치된 로컬 유틸리티(PDF, DBML, 마크다운 등)를 한눈에 파악하고 즉시 실행할 수 있으며, 시스템 리소스 및 최근 작업 이력을 직관적으로 모니터링할 수 있습니다.

시각적 스타일링(다크 모드, 징크 기반 토널 레이어, 색상 팔레트, Geist + Pretendard + JetBrains Mono 서체 체계, 1px 미세 보더 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 최우선 기준으로 준수합니다.

---

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 목표 (Goals)
* **공통 워크스페이스 셸 (Workspace Shell)**:
  * 좌측 고정 사이드바(`SideNavBar`, 너비 240px)와 상단 고정 헤더(`TopNavBar`, 높이 48px), 모바일 하단 네비게이션(`BottomNavBar`, 높이 56px)을 제공하는 레이아웃 구조 확립
  * React Router 6 기반의 중첩 라우팅(`ShellLayout` 및 `<Outlet />`) 구성
* **네비게이션 및 라우팅 (Navigation & Routing)**:
  * 대시보드(`/`), PDF 유틸리티(`/pdf-tools`), DBML 유틸리티(`/dbml-tools`), 마크다운 문서(`/docs`), AI 비서(`/ai`) 탭 간 매끄러운 화면 전환
  * 공통 네비게이션 메타데이터 단일 레지스트리(`WORKSPACE_NAV_ENTRIES`)를 통한 일관된 라우트 및 브레드크럼 메타데이터 관리
  * 현재 위치한 경로에 따른 사이드바 및 바텀 네비게이션 탭의 활성(Active) 상태 자동 시각화
* **설치된 유틸리티 빠른 실행 그리드 (Bento Grid)**:
  * PDF 유틸리티, DBML 유틸리티, 마크다운 문서, J.A.R.V.I.S. AI 비서의 4개 설치 유틸리티 카드를 3열 벤토 그리드로 배치
  * 카드별 아이콘, 최근 사용 시간, 설명 문구, 상태 태그, 원클릭 진입 링크 제공
* **대시보드 6:4 분할 모니터링 뷰 (Split View)**:
  * **좌측 60% (7열)**: 최근 로컬 작업 이력 목록 (파일별 아이콘, 파일명, 처리 결과 태그, 소요 시간/크기, 타임스탬프)
  * **로컬 스토리지 영속화**: 백엔드 연동 전까지 브라우저 `localStorage`에 최근 작업 이력을 보관하여 새로고침 후에도 유지
  * **우측 40% (5열)**: 로컬 런타임 환경 상태 (로컬 스토리지 캐시 용량, WASM 힙 메모리 사용률 미세 프로그레스 바, 엔진 상태 점)
* **다국어 서체 및 언어 토글**:
  * `i18next` 및 `react-i18next` 기반의 한국어(`KR`) / 영어(`EN`) 전체 UI 전환 지원 ([ADR-0004](../adr/0004-i18next-internationalization-strategy.md) 참조)
  * 상단 헤더의 `KR / EN` 세그먼트 버튼 인터페이스 제공 및 `localStorage`(`my-space:locale`) 영속화

### 제외 대상 (Non-goals)
* 원격 서버 전체 파일 인덱싱 검색 엔진
* 복잡한 백엔드 실시간 시스템 메트릭 데몬 수집 (초기에는 브라우저 스토리지 및 로컬 런타임 기본 지표 시각화에 집중)
* 각 유틸리티의 세부 기능 구현 (PDF, DBML, 마크다운, AI 워크스페이스의 독립 Spec에서 별도 정의)

---

## 3. 유스케이스 및 사용자 흐름 (Use Cases)

| 유스케이스 ID | 액터 | 목표 | 주요 인터랙션 흐름 |
| :--- | :--- | :--- | :--- |
| `UC-F-D01` | 사용자 | 대시보드 홈 진입 및 워크스페이스 상태 조망 | 1. 애플리케이션 진입(`/`) → 2. 고정 셸과 함께 대시보드 로드 → 3. 유틸리티 목록 및 최근 작업, 시스템 지표 확인 |
| `UC-F-D02` | 사용자 | 사이드바 탭을 통한 유틸리티 화면 전환 | 1. 사이드바의 'PDF 유틸리티' 탭 클릭 → 2. URL `/pdf-tools` 이동 → 3. 셸은 유지된 채 본문만 PDF 유틸리티 뷰로 전환 |
| `UC-F-D03` | 사용자 | 벤토 그리드 카드를 통한 유틸리티 실행 | 1. 대시보드의 'PDF 유틸리티' 카드 내 '유틸리티 실행' 클릭 → 2. `/pdf-tools` 화면으로 즉시 이동 |
| `UC-F-D04` | 사용자 | 상단 언어 전환 (KR / EN) 토글 | 1. 헤더 우측의 `KR` 또는 `EN` 버튼 클릭 → 2. 다국어 로케일 상태 변경 및 UI 텍스트 반영 |

---

## 4. 화면 및 컴포넌트 요구사항 (UI / Component Specs)

> 디자인 세부 사항(색상, 여백, 곡률 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 준수합니다.

### 4.1. 컴포넌트 계층 구조

```text
ShellLayout (전체 웹 애플리케이션 최상위 공통 셸)
 ├── SideNavBar (좌측 240px 고정 네비게이션)
 │    ├── BrandHeader (시스템 아바타 'μ', 버전 'v0.1.0')
 │    ├── NavTabList (대시보드, PDF 유틸리티, DBML 유틸리티, 마크다운 문서, AI STUDIO 섹션)
 │    └── EngineStatusFooter (로컬 엔진 인스턴스 상태 카드: localhost:8080, WASM, ACTIVE)
 ├── TopNavBar / Header (상단 48px 고정 헤더)
 │    ├── BreadcrumbNav (my-space / 워크스페이스 / 대시보드)
 │    └── TopActionCluster (KR/EN 토글, 버전/헬스체크 칩, 사용자 프로필 배지, 알림/테마 아이콘)
 ├── MainCanvas (본문 캔버스 영역)
 │    └── <Outlet />
 │         ├── DashboardPage (대시보드 메인 뷰: `/`)
 │         │    ├── WorkspaceHeader (H1 '워크스페이스 개요', 로컬 격리 환경 태그)
 │         │    ├── InstalledUtilitiesGrid (3열 벤토 그리드: PDF, DBML, Markdown, AI)
 │         │    └── SplitMonitoringSection (6:4 분할 그리드)
 │         │         ├── RecentTasksCard (최근 로컬 작업 리스트 및 비우기 액션)
 │         │         └── RuntimeEnvironmentCard (메모리/캐시 프로그레스 바)
 │         ├── PdfToolsPage (PDF 처리 엔진: `/pdf-tools`)
 │         ├── DbmlToolsPage (DBML 스키마 변환기: `/dbml-tools`)
 │         ├── MarkdownDocsPage (마크다운 문서 스튜디오: `/docs/*`)
 │         ├── AiWorkspacePage (J.A.R.V.I.S. AI 워크스페이스: `/ai`)
 │         └── NotFoundPage (404 안내 뷰: `*`)
 └── BottomNavBar (모바일 전용 56px 하단 네비게이션)
```

### 4.2. UI 상태 매트릭스 (UI States)

| 상태 | 화면 표현 및 동작 |
|---|---|
| **기본 대시보드 뷰 (Ready)** | 셸과 벤토 그리드(4개 설치 유틸리티), 최근 작업 내역, 런타임 지표가 모두 정상 렌더링됨 |
| **최근 작업 내역 없음 (Empty)** | 최근 작업 목록 대신 "최근 실행된 로컬 작업 이력이 없습니다" 안내 문구 및 inbox 아이콘 노출 |
| **도구 준비 중 (Placeholder)** | 재사용 가능한 `PlaceholderPage` 컴포넌트를 통해 향후 확장 도구의 안내 뷰 제공 가능 |
| **잘못된 경로 (404 NotFound)** | "요청하신 페이지를 찾을 수 없습니다" 문구 및 대시보드로 돌아가기 링크 노출 |

---

## 5. 클라이언트 상태 및 데이터 흐름 (State & Data Flow)

### 5.1. 네비게이션 메타데이터 레지스트리 단일화 (`navigation.ts`)

```typescript
export interface WorkspaceNavEntry {
  id: 'dashboard' | 'pdf-tools' | 'dbml-tools' | 'markdown-docs' | 'ai-workspace';
  path: string;
  title: string;
  shortLabel: string;
  icon: string;
  category: '워크스페이스' | '유틸리티' | '시스템' | '탐색';
  categoryKey: 'workspace' | 'utility' | 'system' | 'explore';
  breadcrumbPage: string;
  badge?: string;
  end?: boolean;
  commandDescription: string;
  isInstalledUtility: boolean;
  utilityTitle?: string;
  description?: string;
  statusTag?: string;
  lastUsed?: string;
}

// 벤토 그리드 노출 유틸리티 목록
export const INSTALLED_UTILITIES = WORKSPACE_NAV_ENTRIES.filter(
  (entry) => entry.isInstalledUtility
);

// URL 경로(pathname)에 대응하는 브레드크럼 정보 반환 (다국어 번역 함수 t 선택 지원)
export function getBreadcrumbByPath(
  pathname: string,
  t?: (key: string) => string
): {
  category: string;
  page: string;
};
```

### 5.2. 최근 작업 이력 영속화 모델 및 유틸리티 (`storage.ts` / `dashboard.ts`)

```typescript
export type UtilityType = 'pdf' | 'dbml' | 'markdown' | 'system';
export type TaskStatus = 'COMPLETED' | 'RUNNING' | 'FAILED';

export interface RecentTaskItem {
  id: string;
  title: string;
  type: UtilityType;
  status: TaskStatus;
  timestamp: string;
  detail: string;
}

// LocalStorage 영속화 키 및 정책 (초기 방문 시 시드 데이터 INITIAL_TASKS 제공)
export const STORAGE_KEY = 'my-space:recent-tasks';
export const RECENT_TASKS_UPDATED_EVENT = 'recent-tasks-updated';
export const MAX_TASKS = 10;

// 스토리지 접근 유틸리티 함수
export function getRecentTasks(): RecentTaskItem[];
export function addRecentTask(item: Omit<RecentTaskItem, 'id' | 'timestamp'>): RecentTaskItem[];
export function clearRecentTasks(): void;
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

* [x] **최근 작업 이력의 영속화**: 백엔드 DB 연동 전까지 브라우저의 **`localStorage`(`my-space:recent-tasks`)에 최대 10건의 최근 작업 이력을 영속화**하여 관리하기로 확정.
