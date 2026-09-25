---
status: implemented
owner: limkeunhyeok
last-updated: 2026-09-25
---

# 반응형 워크스페이스 셸 및 대시보드 사양서 (Responsive Layout Specification)

## 1. 개요 (Summary)
본 문서는 [`DESIGN.md`](../../DESIGN.md)의 반응형 디자인 시스템 원칙(Desktop, Tablet, Mobile 3계층 티어)에 따라, 전체 애플리케이션의 **공통 워크스페이스 셸(`SideNavBar`, `TopNavBar`, `BottomNavBar`, `ShellLayout`)**과 **대시보드 메인 화면(`DashboardPage`)**이 다양한 뷰포트 크기와 디바이스 환경에서 자연스럽게 적응하도록 구조적 변화와 인터랙션 사양을 정의합니다.

외부 프레임워크(Tailwind CSS, 컴포넌트 라이브러리)의 추가 도입 없이, 프로젝트 고유의 Vanilla CSS 토큰과 시맨틱 미디어 쿼리를 기반으로 가볍고 일관된 반응형 경험을 제공하는 것을 목표로 합니다.

---

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 2.1. 목표 (Goals)
1. **애플리케이션 셸의 3단계 반응형 전환**:
   - **Desktop**: 240px 확장 사이드바 + 48px 표준 탑바 + `pl-60` 본문 캔버스 오프셋
   - **Tablet**: 64px 아이콘 전용(Icon-only) 사이드바 + 간소화 탑바 + `pl-16` 본문 캔버스 오프셋
   - **Mobile**: 사이드바 숨김 + 모바일 콤팩트 헤더 + **신규 하단 바텀바(`BottomNavBar`, 56px)** + `pl-0` 및 **`pb-20` 본문 캔버스 패딩**
2. **대시보드 화면 요소의 적응형 리플로우**:
   - 헤더(H1 및 로컬 격리 상태 칩)의 수평 배치 ↔ 수직 스택 전환
   - 설치된 유틸리티 그리드: 3열 벤토 그리드(Desktop) → 2열 리플로우(Tablet) → 1열 콤팩트 카드 리스트(Mobile)
   - 분할 모니터링 섹션: 6:4 비대칭 2열 분할(Desktop) → 2열/적층(Tablet) → 완전 수직 순차 스택(Mobile)
3. **모바일 터치 접근성 보장**:
   - 하단 바텀바를 통한 엄지손가락 원터치 네비게이션 지원
   - 버튼 및 인터랙티브 요소의 최소 터치 타깃(36px~40px) 및 시각적 터치 피드백(`active:scale-95`) 확보

### 2.2. 제외 대상 (Non-goals)
- PDF 유틸리티 및 DBML 유틸리티 화면 내부의 세부 기능 구현 (각 유틸리티 구현 단계의 개별 스펙에 따라 진행)
- 브라우저 윈도우 크기에 따라 별도의 JavaScript 리사이즈 이벤트 폴링을 통한 분기 처리 (순수 CSS 미디어 쿼리를 최우선으로 사용하여 깜빡임 및 레이아웃 시프트 방지)

---

## 3. 디바이스 티어 및 브레이크포인트 기준 (Device Tiers & Breakpoints)

[`DESIGN.md`](../../DESIGN.md)의 설계 원칙에 따라, 웹 표준 뷰포트 범위를 기준으로 아래 3개 구간의 레이아웃 전환점을 정립합니다.

| 티어 (Tier) | 뷰포트 범위 | 사이드바 (`aside`) | 탑바 (`header`) | 바텀바 (`nav`) | 본문 오프셋 및 여백 |
|:---|:---|:---|:---|:---|:---|
| **Mobile** | `< 768px` | 완전 숨김 (`display: none`) | 48px 콤팩트 헤더 (`backdrop-blur`) | **56px 고정 바텀바 (`fixed bottom-0`)** | `pl-0`, `px-3.5 pt-4 pb-20`, `max-w-lg` |
| **Tablet** | `768px ~ 1023px` | **64px 아이콘 전용 (`w-16`)** | 48px 간소화 탑바 | 숨김 (`display: none`) | `pl-16`, `p-4`, `max-w-[1024px]` |
| **Desktop** | `>= 1024px` | **240px 확장형 (`w-60`)** | 48px 표준 탑바 | 숨김 (`display: none`) | `pl-60`, `p-space-xl`, `max-w-7xl` |

---

## 4. 유스케이스 및 사용자 인터랙션 흐름 (Use Cases)

### UC-RESP-01: 브라우저 윈도우 리사이즈 시 매끄러운 셸 전환
- **시나리오**: 사용자가 데스크톱에서 브라우저 창의 가로폭을 줄이거나, 화면 분할(Split Screen) 모드를 활성화함.
- **동작**:
  1. 가로폭이 1024px 미만으로 줄어들면, 좌측 사이드바가 240px에서 64px 아이콘 전용 모드로 즉시 축소되며 본문 좌측 오프셋이 `64px`로 조정됨.
  2. 텍스트 라벨과 ⌘K 검색창은 부드럽게 사라지고, 아이콘 중심 탭으로 간결화됨.
  3. 가로폭이 768px 미만으로 줄어들면, 사이드바가 완전히 숨겨지고 화면 최하단에 56px 높이의 `BottomNavBar`가 표시됨. 본문 최하단에 `pb-20` 패딩이 유지되어 내용이 바텀바에 가려지지 않음.

### UC-RESP-02: 모바일 환경에서의 한 손 네비게이션
- **시나리오**: 스마트폰 브라우저에서 `my-space`에 접속함.
- **동작**:
  1. 상단에는 48px 반투명 헤더(터미널 아이콘 + 브랜드 로고 + `LOCAL` 점)가 고정 표시됨.
  2. 하단에는 화면 전체 너비의 고정 바텀바가 노출되며, 4개 도구(대시보드, PDF, DBML, Docs) 탭이 수평 배치됨.
  3. 현재 활성 탭은 에메랄드/블루 액센트(`text-primary`)와 채워진 아이콘(`FILL: 1`)으로 즉시 식별됨.
  4. 탭 클릭 시 페이지가 즉시 전환되며, 터치 시 미세한 축소 피드백(`scale(0.96)`)이 제공됨.

### UC-RESP-03: 모바일 대시보드 탐색 및 작업 확인
- **시나리오**: 모바일 환경에서 워크스페이스 현황 및 최근 작업을 확인함.
- **동작**:
  1. 상단 워크스페이스 개요 헤딩과 '로컬 격리 환경' 칩이 상하 수직 스택으로 정렬되어 좁은 폭에서도 텍스트가 잘리지 않음.
  2. 설치된 유틸리티 카드는 좌측 32px 정방형 아이콘 + 우측 텍스트/버전의 가로형 콤팩트 리스트 카드로 표시되어 한 화면에 여러 도구가 한눈에 들어옴.
  3. 최근 작업 이력과 런타임 환경 상태는 세로로 순차 적층되어 자연스러운 엄지 스크롤로 확인 가능함.

---

## 5. 화면 및 컴포넌트 요구사항 (UI / Component Specs)

### 5.1. 신규 컴포넌트: `BottomNavBar.tsx`
* **위치**: `apps/web/src/shared/components/layout/BottomNavBar.tsx`
* **규격**:
  * 높이 `56px` (`h-14`), 화면 최하단 고정 (`fixed bottom-0 left-0 w-full z-50`).
  * 배경: `var(--surface-container-lowest)` (`#0d0e15`), 상단 1px 경계선 `border-t border-outline-variant`.
  * 노출 조건: 뷰포트 너비 `< 768px`에서만 노출, 그 외 해상도에서는 `display: none`.
* **탭 항목 (4개 균등 분할)**:
  1. **대시보드**: 아이콘 `dashboard`, 라벨 `대시보드`, 링크 `/`
  2. **PDF 도구**: 아이콘 `picture_as_pdf`, 라벨 `PDF 도구`, 링크 `/pdf-tools`
  3. **DBML**: 아이콘 `schema`, 라벨 `DBML`, 링크 `/dbml-tools`
  4. **문서**: 아이콘 `description`, 라벨 `문서`, 링크 `/docs`
* **탭 UI 구조**:
  ```tsx
  <NavLink to={tab.path} className={({ isActive }) => `bottom-tab-item ${isActive ? 'active' : ''}`}>
    <span className="material-symbols-outlined tab-icon">{tab.icon}</span>
    <span className="tab-label">{tab.label}</span>
  </NavLink>
  ```
  * 활성 상태: `color: var(--primary)`, 아이콘 `FILL: 1`, 라벨 `font-medium`
  * 비활성 상태: `color: var(--text-muted)`

### 5.2. `SideNavBar.tsx` 반응형 사양 변경
* **데스크톱 (`>= 1024px`)**:
  * 너비 `240px` 고정 유지, 브랜드명, 버전 태그, ⌘K 검색 트리거, 텍스트 라벨 및 뱃지 표시.
* **태블릿 (`768px ~ 1023px`)**:
  * 너비 `64px` (`w-16`)로 축소 (`.side-navbar.tablet-mode` 또는 미디어 쿼리).
  * 헤더: `ms` 축소형 사각 아바타(36×36px)만 중앙 정렬, 텍스트 및 버전 태그 숨김 (`display: none`).
  * 검색창: ⌘K 인풋 트리거 숨김 (`display: none`).
  * 탭 아이템: 텍스트 라벨 및 우측 뱃지 숨김, 아이콘만 중앙 정렬 (`justify-content: center`, 패딩 `p-2`).
  * 푸터: 상세 텍스트 숨김, 컴팩트 텔레메트리 점만 표시.
* **모바일 (`< 768px`)**:
  * 사이드바 전체 숨김 (`display: none`).

### 5.3. `TopNavBar.tsx` 반응형 사양 변경
* **데스크톱 (`>= 1024px`)**: 전체 브레드크럼, 언어 토글, 터미널/알림/다크모드 아이콘, '작업 실행' 버튼 표시.
* **태블릿 (`768px ~ 1023px`)**: 브레드크럼의 중간 경로 생략 또는 타이틀 중심으로 간소화, 우측 액션 유지.
* **모바일 (`< 768px`)**:
  * 좌측: 28×28px 터미널 아이콘 + 브랜드명 `my-space` + 버전 캡슐(`v0.1`).
  * 우측: 에메랄드 상태 점(`LOCAL`) 및 알림 아이콘만 노출. 언어 토글과 풀사이즈 CTA 버튼은 숨김.
  * 배경: `var(--surface-container-low)`에 `backdrop-filter: blur(8px)` 적용.

### 5.4. `ShellLayout.tsx` 및 레이아웃 컨테이너 사양
* **본문 캔버스 오프셋 (`main-canvas-area`)**:
  * Desktop: `margin-left: var(--sidebar-width);` (240px)
  * Tablet: `margin-left: 64px;`
  * Mobile: `margin-left: 0;`
* **작업 영역 패딩 (`workspace-content`)**:
  * Desktop: `padding: var(--space-xl);` (24px)
  * Tablet: `padding: var(--space-lg);` (16px)
  * Mobile: `padding: 16px 14px 80px 14px;` (**하단 80px 패딩을 주어 56px 바텀바와 여유 간격 유지**)

### 5.5. `DashboardPage` 반응형 사양
1. **`WorkspaceHeader`**:
   * `< 768px`에서 `flex-direction: column; align-items: flex-start; gap: 8px;`
   * 상태 칩이 제목 아래에 자연스럽게 배치됨.
2. **`InstalledUtilitiesGrid`**:
   * Desktop: `grid-template-columns: repeat(3, 1fr);`
   * Tablet: `grid-template-columns: repeat(2, 1fr);` (3번째 카드는 2행 1열 배치)
   * Mobile: `grid-template-columns: 1fr;` (단일 열 수직 스택)
   * 모바일 유틸리티 카드 스타일: 상하 패딩을 줄이고, 좌측에 36px 아이콘 박스를 두고 우측에 제목과 설명을 인라인 배치하는 콤팩트 카드 레이아웃 적용.
3. **`split-monitoring-section`**:
   * Desktop: `grid-template-columns: 7fr 5fr; gap: 16px;`
   * Tablet / Mobile: `grid-template-columns: 1fr; gap: 16px;` (수직 순차 스택)

---

## 6. 클라이언트 상태 및 스타일링 전략 (State & Styling Strategy)

1. **CSS 미디어 쿼리 우선 원칙**:
   - 화면 깜빡임(FOUC)과 성능 저하를 방지하기 위해, 모든 셸 전환과 그리드 리플로우는 순수 CSS 미디어 쿼리(`layout.css`, `dashboard.css`)로 처리합니다.
2. **반응형 CSS 변수 및 클래스 구조**:
   - `styles.css`에 표준 미디어 쿼리 브레이크포인트 주석 및 공통 반응형 유틸리티 정의.
   - `layout.css`: `@media (max-width: 1023px)` (태블릿), `@media (max-width: 767px)` (모바일) 분기 작성.
3. **바텀 네비게이션 액티브 라우트 동기화**:
   - `BottomNavBar`는 React Router의 `NavLink`를 사용하여 현재 브라우저 URL 경로와 액티브 상태를 완벽히 동기화.

---

## 7. 테스트 및 검증 계획 (Testing & Verification Plan)

1. **자동화 단위 테스트 (`app.spec.tsx`)**:
   - `BottomNavBar` 컴포넌트 렌더링 및 네비게이션 탭 존재 여부 검증
   - 데스크톱/모바일 주요 요소의 DOM 안정성 검증
2. **빌드 및 린트 검증**:
   - `pnpm test`, `pnpm build`, `pnpm lint` 100% 통과 확인
3. **브라우저 뷰포트 에뮬레이션 검증 (`browser_subagent`)**:
   - Desktop 뷰포트 (1440 × 900): 240px 사이드바, 3열 벤토 그리드 확인
   - Tablet 뷰포트 (834 × 1112): 64px 아이콘 전용 사이드바, 2열 벤토 그리드 확인
   - Mobile 뷰포트 (390 × 844, iPhone 규격): 사이드바 숨김, 상단 콤팩트 헤더, 1열 스택, 하단 56px 바텀바 노출 및 탭 이동 확인

---

## 8. 확정된 설계 결정 (Resolved Decisions)

* **모바일 환경에서의 커맨드 팔레트 접근성**:
  - 모바일에서는 키보드 단축키(⌘K) 사용이 어려우므로, 모바일 상단 헤더의 좌측 '터미널 아이콘' 버튼을 탭(클릭)했을 때 커맨드 팔레트 모달이 바로 열리도록 연동합니다.
