# Design System: My-Space Developer Workspace
**Project ID:** `1445796733451460523`

이 문서는 `my-space` 프론트엔드 프로젝트의 UI 디자인 및 스타일링의 단일 진실 공급원(Single Source of Truth)입니다. Stitch 프로젝트 `My-Space Developer Workspace`에 포함된 Desktop, Tablet, Mobile 화면의 실제 소스 코드와 디자인 테마를 분석하여 작성되었습니다.

---

## 1. Visual Theme & Atmosphere (시각적 테마 및 분위기)

* **철학 (Philosophy)**: **Minimalist / Utilitarian Technical**
  * 군더더기 없는 도구성과 높은 정보 밀도(Information Density)를 최우선으로 하는 개발자 중심의 개인 워크스페이스입니다.
  * 화려한 그라디언트, 강한 드롭 섀도우, 불필요한 장식 요소를 배제하고, 콘텐츠와 텔레메트리, 실행 상태가 전면에 드러나도록 설계되었습니다.
* **표면과 깊이감 (Elevation & Depth)**:
  * 무거운 그림자 대신 **토널 레이어링(Tonal Layering)**과 **1px 저대비 외곽선(Micro-borders)**만으로 깊이(z-index)와 영역을 구분합니다.
  * 초소형 스크롤바(6px)와 정밀한 도트 그리드(`bg-grid-dots`, 24px 간격)를 활용해 터미널 및 IDE와 같은 몰입감을 제공합니다.
* **디폴트 모드**: **Deep Dark Mode**
  * 장시간의 코딩과 모니터링 시 시각적 피로도를 낮추기 위해 징크(Zinc)와 딥 차콜 기반의 다크 팔레트를 기본으로 적용합니다.

---

## 2. Color Palette & Roles (색상 팔레트 및 역할)

모든 색상은 Material 3 및 Zinc 스펙트럼이 결합된 시맨틱 토큰으로 정의되어 있습니다.

### 2.1. 표면 및 배경 (Surface & Background Layers)
| 역할 | 토큰명 | Hex 코드 | 실제 적용 대상 |
|---|---|---|---|
| **최하단 바닥 (Lowest)** | `surface-container-lowest` | `#0d0e15` | 파일 드롭존 내부, 코드 캔버스, 스크롤바 트랙, 언어 전환기 베이스, 모바일 바텀바 |
| **기본 캔버스 (Base)** | `background` / `surface` | `#12131a` | 전체 애플리케이션 루트 바탕 배경 |
| **사이드바 (Low)** | `surface-container-low` | `#1a1b22` | 고정 좌측 네비게이션 사이드바(`aside`), 카드 리스트 컨테이너, 모바일 탑바 |
| **기본 컨테이너 (Normal)** | `surface-container` | `#1e1f26` | 카드 본체, 탑 네비게이션 헤더, 패널 헤더, 뱃지 베이스 |
| **강조 컨테이너 (High)** | `surface-container-high` | `#292931` | 활성 파일 프리뷰 카드, 아바타/아이콘 백그라운드 |
| **최상단 컨테이너 (Highest)** | `surface-container-highest` | `#33343c` | 활성 탭 배경, `<kbd>` 단축키 캡슐, 프로그레스 바 트랙 |
| **호버 하이라이트 (Bright)** | `surface-bright` | `#383941` | 버튼 호버 및 상호작용 하이라이트 |

### 2.2. 경계선 및 구획 (Borders & Outlines)
| 역할 | 토큰명 | Hex 코드 | 실제 적용 대상 |
|---|---|---|---|
| **주요 경계선 (Primary Outline)** | `outline-variant` | `#424754` (`#27272a`) | 모든 카드 1px 테두리, 사이드바 우측 경계선, 테이블 구분선, 패널 헤더 분할선, 모바일 바텀바 상단선 |
| **보조 경계선 (Muted Outline)** | `outline` | `#8c909f` | 비활성 보더, 인풋 포커스 전 상태, 메타데이터 구분선 |

### 2.3. 텍스트 및 가독성 (Typography Colors)
| 역할 | 토큰명 | Hex 코드 | 실제 적용 대상 |
|---|---|---|---|
| **주 텍스트 (Primary Text)** | `on-surface` | `#e3e1ec` (`#fafafa`) | 헤딩(H1~H3), 주요 라벨, 활성 탭 텍스트, 카드 타이틀 |
| **보조 텍스트 (Secondary Text)**| `on-surface-variant` | `#c2c6d6` (`#a1a1aa`) | 본문 설명, 서브라벨, 비활성 탭 텍스트, 힌트 |
| **비활성/메타 텍스트 (Muted)** | `outline` | `#8c909f` (`#71717a`) | 타임스탬프, 파일 크기, 불릿 기호, 닫기 버튼, 비활성 네비게이션 라벨 |

### 2.4. 액센트 및 상태 시그널 (Accents & Signals)
| 역할 | 토큰명 | Hex 코드 | 실제 적용 대상 |
|---|---|---|---|
| **기능/액센트 블루** | `primary` | `#adc6ff` (`#3b82f6`) | 활성 탭 아이콘/라벨, 포커스 링, 링크, 시스템 강조 요소 |
| **주요 액션 컨테이너** | `primary-container` | `#4d8eff` | 주요 실행 CTA 버튼, 브랜드 로고 뱃지 |
| **정상/성공 에메랄드** | `secondary` | `#4edea3` (`#10b981`) | '실행 중', 'ACTIVE', 'Zero Telemetry', 'Valid' 상태 인디케이터 점 및 태그 |
| **주의/진행 앰버** | `tertiary` | `#ffb95f` (`#f59e0b`) | 마크다운/문서 상태 태그, 로컬 저장됨 뱃지 |
| **에러/위험 레드** | `error` | `#ffb4ab` (`#ff5555`) | PDF 파일 포맷 아이콘, 삭제/초기화 위험 액션 |

---

## 3. Typography Rules (타이포그래피 규칙)

### 3.1. 글꼴 체계 (Font Families)
* **영문 및 UI 기본 서체**: **`Geist`** (Google Fonts)
  * UI 크롬, 네비게이션, 헤딩 및 본문 텍스트에 적용
* **한글 전용 서체**: **`Pretendard` v1.3.9** (CDN 정적 링크)
  * 다국어 한글 글립의 선명한 가독성 보장
  * CSS 선언: `font-family: 'Geist', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;`
* **모노스페이스 서체**: **`JetBrains Mono`**
  * 코드 에디터, 단축키(`⌘K`), 파일 크기, 해시, 포트 번호, 타임스탬프, 텔레메트리 지표, 상태 태그

### 3.2. 타입 스케일 (Type Scale)
| 스타일 명칭 | 크기 (Font Size) | 행간 (Line Height) | 자간 (Letter Spacing) | 굵기 (Weight) | 서체 | 주요 용도 |
|---|---|---|---|---|---|---|
| `headline-lg` | 24px | 32px | -0.02em | 600 (Semibold) | Geist / Pretendard | 메인 페이지 타이틀 (워크스페이스 개요) |
| `headline-md` | 18px | 26px | -0.015em | 600 (Semibold) | Geist / Pretendard | 유틸리티 메인 뷰 타이틀 (PDF Processing Engine 등) |
| `headline-sm` | 15px | 22px | -0.01em | 500 (Medium) | Geist / Pretendard | 브랜드 로고명(`my-space`), 섹션 카드 타이틀 |
| `body-lg` | 14px | 20px | normal | 400 (Regular) | Geist / Pretendard | 상세 모달, 리드 문단 본문 |
| `body-md` | 13px | 18px | normal | 400 (Regular) | Geist / Pretendard | 데스크톱/태블릿 표준 본문 텍스트 |
| `body-sm` | 12px | 16px | normal | 400 (Regular) | Geist / Pretendard | 폼 가이드, 카드 설명, 서브 텍스트 |
| `code-md` | 13px | 18px | normal | 400 (Regular) | JetBrains Mono | 코드 스니펫, 파일명 (`auth-service.dbml`) |
| `code-sm` | 11px | 16px | -0.01em | 500 (Medium) | JetBrains Mono | 소형 단축키, 타임스탬프, 런타임 지표, 모바일 태그 |
| `label-md` | 12px | 16px | normal | 500 (Medium) | JetBrains Mono / Geist | 탭 네비게이션 라벨, 아바타 텍스트 |
| `label-sm` | 10px | 14px | +0.04em | 500 (Medium) | JetBrains Mono / Geist | 상태 뱃지 태그, 소형 캡슐 라벨, 모바일 바텀바 라벨 |

---

## 4. Component Stylings (컴포넌트 스타일링)

### 4.1. 사이드바 네비게이션 (`SideNavBar`)
디바이스 화면 폭에 따라 데스크톱 확장형과 태블릿 아이콘 축소형으로 전환되며, 모바일에서는 완전히 숨겨집니다.

* **데스크톱 확장형 (Desktop Full)**:
  * 너비 `240px` (`w-60`), 높이 `100vh`, 좌측 고정 (`fixed top-0 left-0`), `z-index: 40`.
  * 배경: `bg-surface-container-low` (`#1a1b22`), 우측 1px 보더 `border-r border-outline-variant`.
  * **브랜드 헤더**:
    * 아바타 `24×24px`, 브랜드명 `my-space` (`headline-sm font-semibold`), 버전 뱃지(`v0.1.0-local`), 시스템 상태 태그(`IDLE`, 초록색 펄스 점).
  * **퀵 커맨드 트리거**:
    * 풀 너비 버튼 (`h-8`, `bg-surface-container-lowest border border-outline-variant rounded-lg`).
    * 돋보기 아이콘 + 플레이스홀더 + 단축키 `<kbd class="command-kbd">⌘K</kbd>`.
  * **네비게이션 탭**:
    * 높이 `34px`, 패딩 `px-3 py-1.5`, 모서리 `rounded-lg`.
    * 아이콘(18px) + 라벨 텍스트 + 우측 뱃지(`Home`, `v1.2`, `Docs` 등).
  * **푸터**:
    * `Zero Telemetry` 뱃지 및 로컬 프로세스 엔진 정보(`127.0.0.1:4200 (Strictly Local)`).
* **태블릿 아이콘 축소형 (Tablet Icon-Only)**:
  * 너비 `64px` (`w-16`), 높이 `100vh`, 좌측 고정 (`fixed top-0 left-0`), `z-index: 30`.
  * 배경: `bg-surface-container-low`, 우측 1px 보더 `border-r border-outline-variant`.
  * **브랜드 헤더**: `ms` 2글자 또는 심볼이 들어간 컴팩트 스퀘어 아바타(`36×36px`, `rounded-lg`). 텍스트/버전/상태 뱃지는 숨김.
  * **퀵 커맨드 트리거**: 가로 검색창 숨김.
  * **네비게이션 탭**: 텍스트 라벨과 뱃지를 숨기고, **아이콘 중심 단독 탭**(`p-2 rounded-lg`, `flex items-center justify-center`)으로 수직 배치.
  * **푸터**: 컴팩트 상태 점 또는 축소형 아이콘으로 최소화.
* **모바일**: 사이드바를 완전히 제거(숨김)하고, 하단 바텀 네비게이션으로 모든 기능을 이관합니다.

### 4.2. 상단 탑바 (`TopNavBar`) 및 모바일 바텀 네비게이션 (`BottomNavBar`)

* **데스크톱 및 태블릿 탑바 (`TopNavBar`)**:
  * 높이 `48px` (`h-12`), 상단 고정 (`sticky top-0`), `bg-surface border-b border-outline-variant px-space-lg`.
  * **브레드크럼**: `my-space / 워크스페이스 / 대시보드` 계층 구조 표시 (태블릿에서는 타이틀 + 상태 태그 중심으로 여백에 맞춰 압축).
  * **우측 액션 클러스터**:
    * `KR / EN` 언어 토글 캡슐 (`bg-surface-container-lowest border border-outline-variant`).
    * 유틸리티 아이콘(터미널, 알림 뱃지 점, 다크모드).
    * 메인 CTA 버튼 (`bg-on-surface text-surface-dim font-medium hover:bg-surface-bright rounded-lg px-3 py-1`).
* **모바일 탑바 (Mobile Compact Header)**:
  * 높이 `48px` (`h-12`), 상단 고정 (`sticky top-0 z-50`), `bg-surface-container-low/95 backdrop-blur border-b border-outline-variant px-3`.
  * 좌측: 28×28px 터미널 아이콘 박스 + 브랜드명 `my-space` + 버전 태그(`v0.1`).
  * 우측: 로컬 상태 칩(`LOCAL` 또는 점 인디케이터) 및 알림 아이콘으로 최소화 (언어 토글과 실행 버튼은 화면 맥락에 맞게 숨김/이동).
* **모바일 하단 바텀 네비게이션 (`BottomNavBar`)**:
  * 높이 `56px` (`h-14`), 화면 최하단 고정 (`fixed bottom-0 left-0 w-full z-50`).
  * 배경: `bg-surface-container-lowest border-t border-outline-variant`.
  * 4개 주요 도구 탭(Dashboard, PDF Tool, DBML, Docs)을 균등 수평 배치 (`flex items-center justify-around px-2`).
  * **탭 아이템 구성**: 상단 20px 아이콘 + 하단 10px 라벨(`font-label-sm`)의 모바일 친화적 수직 레이아웃 (`flex flex-col items-center gap-0.5`).
  * **활성 상태**: `text-primary`, 아이콘 `font-variation-settings: 'FILL' 1`, 라벨 `font-medium`.
  * **비활성 상태**: `text-outline`, 터치 피드백 `active:scale-95`.

### 4.3. 버튼 (Buttons)
* **Primary Button**: `bg-on-surface text-surface-dim font-medium hover:bg-surface-bright rounded` (4px).
* **Secondary / Outline Button**: `bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container rounded`.
* **Ghost Button**: `bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded`.
* **규격 및 터치 타깃**:
  * 데스크톱: 인라인/테이블용 콤팩트 `28px`, 기본 `32px`.
  * 모바일/태블릿: 터치 미스 방지를 위해 높이 `36px`~`40px`, 최소 터치 패딩 확보.

### 4.4. 카드 및 벤토 그리드 (Cards & Bento Grid)
* **카드 프레임**: `bg-surface-container-low` 또는 `bg-surface-container`, `border border-outline-variant rounded-xl overflow-hidden`.
* **카드 헤더**: `px-space-md py-2 border-b border-outline-variant bg-surface-container flex items-center justify-between`.
* **벤토 그리드 (Bento Grid)의 반응형 전환**:
  * **Desktop**: 3열 균등 그리드 (`grid grid-cols-1 md:grid-cols-3 gap-gutter`).
  * **Tablet**: **2열 그리드** (`grid grid-cols-1 md:grid-cols-2 gap-space-md`)로 리플로우. 세 번째 카드가 다음 행으로 자연스럽게 정렬.
  * **Mobile**: **단일 열 수직 스택** (`flex flex-col gap-3`)으로 전환.
    * 카드는 세로형 카드에서 **가로형 콤팩트 카드 리스트**(좌측 32px 아이콘 박스 + 중앙 타이틀/설명 + 우측 버전 태그) 형태로 압축되어 모바일 스크롤 효율 극대화.

### 4.5. 드롭존 및 특수 뷰포트 (Dropzone & Canvas)
* **파일 드롭존 (Dropzone)**:
  * `border border-dashed border-outline-variant rounded-lg bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer`.
  * 데스크톱: 넉넉한 중앙 업로드 영역, 드래그 앤 드롭 가이드, 보안 문구.
  * 모바일: 터치 파일 선택에 최적화된 컴팩트 패딩(`p-4` 내외), 간결한 안내 텍스트.
* **도트 그리드 캔버스 (Grid Canvas)**:
  * `.bg-grid-dots`: `background-size: 24px 24px; background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px);`
* **마이크로 스크롤바**: 너비 `6px`, 트랙 `#0d0e15`, 썸 `#27272a` (호버 시 `#424754`), 반경 `2px`.
* **모바일 2차원 패닝 캔버스 뷰포트 (`.erd-canvas-viewport`)**:
  * 모바일 DBML과 같은 대형 시각화 화면 전용 뷰포트.
  * `overflow-x-auto overflow-y-auto cursor-grab active:cursor-grabbing relative w-full`.
  * 다이어그램 캔버스(`w-[780px] h-[400px]` 등)를 고정 크기로 렌더링하고 사용자가 뷰포트 안에서 터치 드래그로 자유롭게 2차원 패닝 탐색.
  * 상단에 플로팅 줌 컨트롤 툴바(`zoom_in`, `zoom_out`, `fit_screen`) 오버레이 배치.

### 4.6. 상태 뱃지 및 프로그레스 바 (Badges & Progress)
* **상태 칩 (Status Chip)**:
  * 기본: `px-2 py-0.5 rounded text-label-sm font-label-sm border border-outline-variant bg-surface-container`.
  * 펄스 인디케이터: 6px 원형 점 (`w-1.5 h-1.5 rounded-full bg-secondary animate-pulse`).
* **미세 프로그레스 바 (Mini Progress Bar)**:
  * 트랙: `w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden`.
  * 게이지: `h-full rounded-full bg-primary` (또는 `bg-secondary`).

---

## 5. Responsive Layout & Multi-Device Adaptation (반응형 설계 및 레이아웃 원칙)

### 5.1. 디바이스 티어 체계 (Device Tier System)
Stitch 디자인 화면 분석에 근거하여 3가지 핵심 디바이스 티어의 설계 철학을 정의합니다. 임의의 고정 픽셀에 의존하기보다 **인터랙션 맥락과 레이아웃 전환(Layout Transition)**을 기준으로 합니다.

* **Desktop (데스크톱)**:
  * 마우스/키보드 기반의 고밀도 전문 개발자 환경.
  * 240px 확장 사이드바, 풍부한 메타데이터, 다열 벤토 그리드, 6:4 및 40:60 수평 스플릿 뷰를 온전히 제공.
* **Tablet (태블릿)**:
  * 공간 효율을 극대화한 컴팩트 워크스페이스.
  * 사이드바를 64px 아이콘 전용 모드로 축소하여 본문 작업 영역을 확보.
  * 다열 그리드는 2열로 리플로우되고, 스플릿 뷰는 1:1 대칭 또는 IDE 하단 상태바(`h-7`)와 조화롭게 적층.
* **Mobile (모바일)**:
  * 한 손 조작과 터치 접근성을 최우선으로 하는 모바일 유틸리티 환경.
  * 사이드바를 완전 제거하고 화면 하단 고정 바텀바(`h-14`)로 핵심 네비게이션 전환.
  * 모든 다열 그리드와 분할 패널을 단일 열 수직 스택으로 전환하거나, 대형 다이어그램은 2차원 패닝 뷰포트로 전환.

### 5.2. 애플리케이션 셸 반응형 전환 흐름 (Shell Transformation)
```text
[Desktop]
┌─────────────┬──────────────────────────────────────────────────────┐
│ Sidebar     │ TopNavBar (Breadcrumbs, Language, Icons, CTA)        │
│ (240px)     ├──────────────────────────────────────────────────────┤
│ Brand, Ver  │ Main Content Canvas                                  │
│ Quick ⌘K    │ (Offset: pl-60, max-w-7xl, 3-Col Bento / 6:4 Split) │
│ Text Tabs   │                                                      │
│ Engine Meta │                                                      │
└─────────────┴──────────────────────────────────────────────────────┘

[Tablet]
┌───────┬────────────────────────────────────────────────────────────┐
│SideNav│ TopNavBar (Compact Title, Sync Status, Icons)              │
│(64px) ├────────────────────────────────────────────────────────────┤
│ms Icon│ Main Content Canvas (Offset: pl-16, 2-Col Grid / 1:1 Split)│
│Icon-  ├────────────────────────────────────────────────────────────┤
│only   │ IDE Footer Bar (h-7: Telemetry, Encoding, Port Info)       │
└───────┴────────────────────────────────────────────────────────────┘

[Mobile]
┌────────────────────────────────────────────────────────────────────┐
│ Mobile Header (h-12: Terminal Icon, my-space, v0.1, Local Dot)     │
├────────────────────────────────────────────────────────────────────┤
│ Main Content Canvas (Offset: pl-0, max-w-lg, px-3.5, pb-20)        │
│ (1-Col Vertical Stack / Compact Cards / 2D Panning Viewport)       │
├────────────────────────────────────────────────────────────────────┤
│ Mobile BottomNavBar (h-14: Dashboard, PDF, DBML, Docs - Icon+Label)│
└────────────────────────────────────────────────────────────────────┘
```

### 5.3. 본문 캔버스 오프셋 및 여백 전환 규칙
* **좌측 오프셋 (Sidebar Offset)**:
  * Desktop: `pl-60` (240px 사이드바 너비만큼 본문 오프셋 확보).
  * Tablet: `pl-16` (64px 축소 사이드바 너비만큼 본문 오프셋 확보).
  * Mobile: `pl-0` (사이드바가 없으므로 좌측 오프셋 제거, 전폭 `w-full` 사용).
* **컨테이너 폭 및 중앙 정렬 (Container Width)**:
  * Desktop: `max-w-7xl mx-auto w-full`.
  * Tablet: `max-w-[1024px] mx-auto w-full` 또는 뷰포트 충진(`h-full overflow-y-auto`).
  * Mobile: `max-w-lg mx-auto w-full`.
* **하단 여백 (Bottom Padding)**:
  * Desktop / Tablet: 표준 패딩 (`pb-space-lg` 또는 상태바 연동).
  * Mobile: **`pb-20` (또는 하단 플로팅 바 존재 시 `pb-32`) 필수**. 56px 높이의 고정 바텀바와 콘텐츠가 겹쳐 가려지는 현상을 방지.

### 5.4. 주요 유틸리티별 반응형 인터랙션 동작

#### ① Dashboard (대시보드)
* **상단 헤더**:
  * Desktop / Tablet: H1 타이틀과 '로컬 격리 환경' 칩이 수평 정렬.
  * Mobile: H1 타이틀과 상태 칩이 상하 수직 스택(`flex-col gap-1.5`)으로 리플로우.
* **설치된 유틸리티 그리드**:
  * Desktop: **3열 벤토 그리드** (`grid-cols-1 md:grid-cols-3`).
  * Tablet: **2열 벤토 그리드** (`grid-cols-1 md:grid-cols-2`). 3번째 카드는 2행 1열로 유연하게 배치.
  * Mobile: **단일 열 수직 스택** (`flex-col gap-3`). 카드는 좌측 32px 정방형 아이콘 박스 + 우측 텍스트/뱃지의 가로형 콤팩트 리스트 카드로 변환.
* **모니터링 섹션**:
  * Desktop: **6:4 비대칭 분할** (최근 작업 7열 : 런타임 지표 5열).
  * Tablet: 화면 너비에 맞춰 2열 배치 또는 가로 정렬 적층.
  * Mobile: **완전 수직 순차 스택** (상단: 최근 로컬 작업 이력 -> 하단: 로컬 런타임 환경 상태).

#### ② PDF Utility (PDF 처리 엔진)
* **Desktop**: 좌측 7열(소스 파일 드롭존 + 파일 목록 + 정렬) : 우측 5열(작업 파라미터 + 옵션 토글 + 실행 버튼) 분할.
* **Tablet**: **1:1 대칭 2열 그리드** (`grid-cols-1 md:grid-cols-2 gap-3.5`).
  * 좌측 `01 소스 파일` 패널과 우측 `02 작업 파라미터` 패널이 상단에 나란히 배치.
  * 하단에 WASM 텔레메트리 콘솔과 산출물 다운로드 카드가 보조 배치.
* **Mobile**: **단일 열 순차 스택** (`space-y-3`).
  * 상단 파일 드롭존(터치 친화적 패딩) -> 파라미터 설정 카드 -> 하단 고정/스크롤 실행 CTA 버튼.

#### ③ DBML Utility (스키마 변환기 & ERD 시각화)
* **Desktop**: 좌측 40% DBML 코드 에디터 : 우측 60% 인터랙티브 ERD 다이어그램 캔버스의 수평 스플릿 뷰.
* **Tablet**: 좌우 1:1 대칭 분할 (`w-full md:w-1/2 flex md:flex-row`). 에디터와 ERD가 각각 50% 균등 분할.
* **Mobile (특화 인터랙션)**:
  * 작은 모바일 화면에서 에디터와 ERD를 동시 렌더링하지 않고, **ERD 캔버스 전용 뷰**를 전면에 배치.
  * **2차원 패닝 뷰포트**: 캔버스를 `overflow-x-auto overflow-y-auto cursor-grab`으로 구성하여 손가락 드래그로 넓은 ERD 테이블 관계도를 탐색.
  * **플로팅 줌 컨트롤**: 우측 상단에 줌 인/아웃/화면맞춤 버튼 클러스터를 반투명 오버레이(`backdrop-blur shadow-lg`)로 제공.
  * **하단 상태 플로팅 바**: 바텀 네비게이션 바로 위(`fixed bottom-14`)에 `Valid`, 테이블 수, `Export SQL` 액션 버튼을 고정 제공.

### 5.5. 간격 체계 (Spacing Scale - 4px 배수)
| 토큰명 | 값 (rem / px) | 데스크톱 용도 | 모바일/태블릿 적응 |
|---|---|---|---|
| `space-xs` | `0.25rem` (4px) | 인라인 아이콘 간격, 뱃지 패딩 | 동일 유지 |
| `space-sm` | `0.5rem` (8px) | 콤팩트 리스트 아이템 간격 | 콤팩트 카드 내부 여백 |
| `gutter` / `space-md` | `0.75rem` (12px) | 카드 내부 여백, 그리드 거터 | 모바일 표준 여백 (`px-3`, `gap-3`) |
| `margin` / `space-lg` | `1rem` (16px) | 페이지 바깥 패딩, 주요 섹션 간격 | 태블릿 표준 패딩 (`p-4`), 섹션 간격 |
| `space-xl` | `1.5rem` (24px) | 대형 섹션 헤더 및 블록 구분 | 모바일에서는 `space-lg`(16px)로 축소 적용 |

### 5.6. 모서리 곡률 (Border Radius Scale)
| 토큰명 | 값 (rem / px) | 실제 적용 대상 |
|---|---|---|
| `DEFAULT` / `sm` | `0.125rem` (2px) | 스크롤바 썸, 소형 상태 태그 |
| `lg` / `md` | `0.25rem` (4px) | 버튼, 인풋 필드, 뱃지, 체크박스 |
| `xl` | `0.5rem` (8px) | 카드, 모달 팝오버, 코드 블록, 네비게이션 탭, 아바타 |
| `full` | `0.75rem` (12px 이상) | 원형 상태 표시 점, 프로그레스 바 트랙, 모바일 둥근 아이콘 배경 |

---

## 6. Design System Notes for Stitch (향후 화면 생성 가이드)

향후 Stitch MCP(`generate_screen_from_text`, `generate_variants`, `edit_screens`)를 사용해 신규 화면을 생성하거나 수정할 때는 대상 디바이스 티어에 맞춰 다음 프롬프트 규칙을 준수해야 합니다.

### 6.1. 공통 테마 프롬프트 키워드
* `"Dark mode, deep zinc tones #12131a canvas and #0d0e15 lowest container"`
* `"Minimalist utilitarian technical interface for software engineers"`
* `"Zero heavy drop shadows, use crisp 1px borders (#424754) and tonal layer hierarchy"`
* `"Font stack: Geist for UI headings and body, Pretendard for Korean glyphs, JetBrains Mono for monospace, telemetry metrics, and keyboard shortcuts"`

### 6.2. 디바이스별 특화 셸 프롬프트 규칙
* **Desktop 화면 생성 시**:
  * `"Fixed left sidebar (240px width, w-60) with my-space logo, ⌘K command trigger, navigation links, and process engine footer"`
  * `"Sticky top bar (48px height) with full breadcrumbs, KR/EN language toggle, and action buttons"`
  * `"Main content with pl-60 offset, max-w-7xl centered container, and 3-column bento grid"`
* **Tablet 화면 생성 시**:
  * `"Fixed icon-only left sidebar (64px width, w-16) with ms square icon and vertical icon navigation tabs"`
  * `"Sticky compact top bar (48px height) with concise title and status badge"`
  * `"Main content with pl-16 offset, 2-column reflowed grid (grid-cols-2), and IDE-style bottom status bar (h-7)"`
* **Mobile 화면 생성 시**:
  * `"No sidebar (aside omitted). Fixed bottom navigation bar (56px height, h-14) with 4 horizontal items (icon + label stacked) in #0d0e15 background"`
  * `"Sticky mobile header (48px height) with 28px terminal icon, my-space title, and v0.1 badge"`
  * `"Main content with full width, max-w-lg centered, px-3.5 padding, and mandatory pb-20 bottom padding to prevent bottom nav overlap"`
  * `"Convert grids into 1-column vertical stack with compact horizontal cards"`
  * `"For complex diagrams like DBML ERD, provide a 2D panning viewport (overflow-x-auto overflow-y-auto cursor-grab) with a floating zoom toolbar"`
