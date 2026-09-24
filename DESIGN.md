# Design System: My-Space Developer Workspace
**Project ID:** `1445796733451460523`

이 문서는 `my-space` 프론트엔드 프로젝트의 UI 디자인 및 스타일링의 단일 진실 공급원(Single Source of Truth)입니다. Stitch 프로젝트 `My-Space Developer Workspace`에 포함된 4개 화면(Dashboard, PDF Utility, DBML Utility, Dashboard 한글/영문 폰트 예시)의 실제 HTML 소스 코드와 디자인 테마를 분석하여 작성되었습니다.

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
| **최하단 바닥 (Lowest)** | `surface-container-lowest` | `#0d0e15` | 파일 드롭존 내부, 코드 캔버스, 스크롤바 트랙, 언어 전환기 베이스 |
| **기본 캔버스 (Base)** | `background` / `surface` | `#12131a` | 전체 애플리케이션 루트 바탕 배경 |
| **사이드바 (Low)** | `surface-container-low` | `#1a1b22` | 고정 좌측 네비게이션 사이드바(`aside`), 카드 리스트 컨테이너 |
| **기본 컨테이너 (Normal)** | `surface-container` | `#1e1f26` | 카드 본체, 탑 네비게이션 헤더, 패널 헤더, 뱃지 베이스 |
| **강조 컨테이너 (High)** | `surface-container-high` | `#292931` | 활성 파일 프리뷰 카드, 아바타/아이콘 백그라운드 |
| **최상단 컨테이너 (Highest)** | `surface-container-highest` | `#33343c` | 활성 탭 배경, `<kbd>` 단축키 캡슐, 프로그레스 바 트랙 |
| **호버 하이라이트 (Bright)** | `surface-bright` | `#383941` | 버튼 호버 및 상호작용 하이라이트 |

### 2.2. 경계선 및 구획 (Borders & Outlines)
| 역할 | 토큰명 | Hex 코드 | 실제 적용 대상 |
|---|---|---|---|
| **주요 경계선 (Primary Outline)** | `outline-variant` | `#424754` (`#27272a`) | 모든 카드 1px 테두리, 사이드바 우측 경계선, 테이블 구분선, 패널 헤더 분할선 |
| **보조 경계선 (Muted Outline)** | `outline` | `#8c909f` | 비활성 보더, 인풋 포커스 전 상태, 메타데이터 구분선 |

### 2.3. 텍스트 및 가독성 (Typography Colors)
| 역할 | 토큰명 | Hex 코드 | 실제 적용 대상 |
|---|---|---|---|
| **주 텍스트 (Primary Text)** | `on-surface` | `#e3e1ec` (`#fafafa`) | 헤딩(H1~H3), 주요 라벨, 활성 탭 텍스트, 카드 타이틀 |
| **보조 텍스트 (Secondary Text)**| `on-surface-variant` | `#c2c6d6` (`#a1a1aa`) | 본문 설명, 서브라벨, 비활성 탭 텍스트, 힌트 |
| **비활성/메타 텍스트 (Muted)** | `outline` | `#8c909f` (`#71717a`) | 타임스탬프, 파일 크기, 불릿 기호, 닫기 버튼 |

### 2.4. 액센트 및 상태 시그널 (Accents & Signals)
| 역할 | 토큰명 | Hex 코드 | 실제 적용 대상 |
|---|---|---|---|
| **기능/액센트 블루** | `primary` | `#adc6ff` (`#3b82f6`) | 활성 탭 아이콘, 포커스 링, 링크, 시스템 강조 요소 |
| **주요 액션 컨테이너** | `primary-container` | `#4d8eff` | 주요 실행 CTA 버튼, 브랜드 로고 뱃지 |
| **정상/성공 에메랄드** | `secondary` | `#4edea3` (`#10b981`) | '실행 중', 'ACTIVE', 'Zero Telemetry' 상태 인디케이터 점 및 태그 |
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
  * 코드 에디터, 단축키(`⌘K`), 파일 크기, 해시, 포트 번호, 타임스탬프, 텔레메트리 지표

### 3.2. 타입 스케일 (Type Scale)
| 스타일 명칭 | 크기 (Font Size) | 행간 (Line Height) | 자간 (Letter Spacing) | 굵기 (Weight) | 서체 | 주요 용도 |
|---|---|---|---|---|---|---|
| `headline-lg` | 24px | 32px | -0.02em | 600 (Semibold) | Geist / Pretendard | 메인 페이지 타이틀 (워크스페이스 개요) |
| `headline-md` | 18px | 26px | -0.015em | 600 (Semibold) | Geist / Pretendard | 유틸리티 메인 뷰 타이틀 (PDF Processing Engine 등) |
| `headline-sm` | 15px | 22px | -0.01em | 500 (Medium) | Geist / Pretendard | 브랜드 로고명(`my-space`), 섹션 카드 타이틀 |
| `body-lg` | 14px | 20px | normal | 400 (Regular) | Geist / Pretendard | 상세 모달, 리드 문단 본문 |
| `body-md` | 13px | 18px | normal | 400 (Regular) | Geist / Pretendard | 데스크톱 표준 본문 텍스트 |
| `body-sm` | 12px | 16px | normal | 400 (Regular) | Geist / Pretendard | 폼 가이드, 카드 설명, 서브 텍스트 |
| `code-md` | 13px | 18px | normal | 400 (Regular) | JetBrains Mono | 코드 스니펫, 파일명 (`auth-service.dbml`) |
| `code-sm` | 11px | 16px | -0.01em | 500 (Medium) | JetBrains Mono | 소형 단축키, 타임스탬프, 런타임 지표 |
| `label-md` | 12px | 16px | normal | 500 (Medium) | JetBrains Mono / Geist | 탭 네비게이션 라벨, 아바타 텍스트 |
| `label-sm` | 10px | 14px | +0.04em | 500 (Medium) | JetBrains Mono | 상태 뱃지 태그, 소형 캡슐 라벨 |

---

## 4. Component Stylings (컴포넌트 스타일링)

### 4.1. 사이드바 네비게이션 (`SideNavBar`)
* **구조 및 레이아웃**:
  * 너비 `240px` (`w-60`), 높이 `100vh`, 좌측 고정 (`fixed top-0 left-0`), `z-index: 30` 이상.
  * 배경: `bg-surface-container-low` (`#1a1b22`), 우측 1px 보더 `border-r border-outline-variant`.
* **브랜드 헤더**:
  * 시스템 아바타: `24×24px` 정사각형, `rounded-lg`, `bg-surface-container-highest border border-outline-variant text-primary font-label-md`.
  * 브랜드명 `my-space` (`text-headline-sm font-semibold`) + 버전 뱃지 (`v0.1.0-local`).
  * 시스템 상태 뱃지: `bg-surface-container-highest text-secondary border border-outline-variant` (`idle` 또는 `실행 중`).
* **퀵 커맨드 (Quick Command) 트리거**:
  * 인풋 스타일의 풀 너비 버튼 (`h-8`, `bg-surface-container-lowest border border-outline-variant rounded-lg`).
  * 돋보기 아이콘 + 플레이스홀더 (`Search tools...` 또는 `도구 및 명령어 검색...`).
  * 우측 단축키 캡슐: `<kbd class="px-1.5 py-0.5 rounded bg-surface-container-highest border border-outline-variant text-code-sm font-code-sm text-outline">⌘K</kbd>`.
* **네비게이션 탭**:
  * 기본 높이 `32px`, 패딩 `px-3 py-1.5`, 모서리 `rounded-lg`.
  * **기본/비활성**: `text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors`.
  * **활성(Active)**: `bg-surface-container-highest text-on-surface font-medium border border-outline-variant`.
  * 탭 텍스트는 **한글 우선 + 보조 영문** 구성 가능 (예: `대시보드 Dashboard`, `PDF 유틸리티`, `DBML 유틸리티`).

### 4.2. 상단 탑바 (`TopNavBar`)
* **구조**: 높이 `48px` (`h-12`), `sticky top-0`, `bg-surface border-b border-outline-variant px-space-lg`.
* **좌측 브레드크럼**: `my-space / 워크스페이스 / 대시보드` 계층 구조 표기 (`text-label-sm` 및 `text-body-sm`).
* **우측 액션 클러스터**:
  * **언어 전환기**: `KR / EN` 토글 캡슐 (`bg-surface-container-lowest border border-outline-variant p-0.5 rounded-lg`).
  * **유틸리티 아이콘**: 터미널, 알림(활성 알림 뱃지 점 포함), 다크모드 전환 아이콘 (`p-1.5 rounded-lg hover:bg-surface-container`).
  * **보조 버튼**: 문서(`Docs`) 버튼 (`border border-outline-variant text-on-surface hover:bg-surface-container`).
  * **메인 CTA 버튼**: `bg-on-surface text-surface-dim font-medium hover:bg-surface-bright rounded-lg px-3 py-1` (실행 아이콘 + 작업 실행 문구).

### 4.3. 버튼 (Buttons)
* **Primary Button**:
  * `bg-on-surface text-surface-dim font-medium hover:bg-surface-bright`
  * 그림자 없음(Zero shadow), 둥글기 `rounded` (4px).
* **Secondary / Outline Button**:
  * `bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container`
* **Ghost Button**:
  * `bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container`
* **규격**: 테이블용 콤팩트 `28px`, 기본 `32px`.

### 4.4. 카드 및 컨테이너 (Cards & Panels)
* **카드 프레임**: `bg-surface-container-low` 또는 `bg-surface-container`, `border border-outline-variant rounded-xl overflow-hidden`.
* **카드 헤더**: `px-space-md py-2 border-b border-outline-variant bg-surface-container flex items-center justify-between`.
* **벤토 그리드 타일 (Bento Grid)**:
  * 3열 균등 레이아웃: `grid grid-cols-1 md:grid-cols-3 gap-gutter`.
  * 호버 효과: `hover:border-outline transition-all duration-150` 및 화살표 아이콘 컬러 전환.

### 4.5. 드롭존 및 특수 뷰 (Dropzone & Canvas)
* **파일 드롭존 (Dropzone)**:
  * `border border-dashed border-outline-variant rounded-lg bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer`.
  * 중앙 업로드 아이콘 + 드래그 앤 드롭 안내 + 보안 상태 문구 (`Zero cloud transmission`).
* **도트 그리드 캔버스 (Grid Canvas)**:
  * `.bg-grid-dots`: `background-size: 24px 24px; background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px);`
* **마이크로 스크롤바**:
  * 너비 `6px`, 트랙 `#0d0e15`, 썸 `#27272a` (호버 시 `#424754`), 반경 `2px`.

### 4.6. 상태 뱃지 및 프로그레스 바 (Badges & Progress)
* **상태 칩 (Status Chip)**:
  * 기본: `px-2 py-0.5 rounded text-label-sm font-label-sm border border-outline-variant bg-surface-container`.
  * 펄스 인디케이터: 6px 원형 점 (`w-1.5 h-1.5 rounded-full bg-secondary animate-pulse`).
* **미세 프로그레스 바 (Mini Progress Bar)**:
  * 트랙: `w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden`.
  * 게이지: `h-full rounded-full bg-primary` (또는 `bg-secondary`).

---

## 5. Layout Principles (레이아웃 원칙)

### 5.1. 셸 및 워크스페이스 그리드
* **고정 사이드바 오프셋**: 본문 영역은 사이드바 너비만큼 좌측 패딩 적용 (`pl-60` = 240px).
* **최대 폭 제한**: `max-w-7xl mx-auto w-full` (고해상도 모니터에서도 안정적인 중앙 정렬 유지).
* **분할 레이아웃 (Split Layout)**:
  * 6:4 비율의 비대칭 분할: 7열(작업 내역/입력) : 5열(시스템 상태/미리보기) 구성 (`grid-cols-1 lg:grid-cols-12 gap-space-lg`).

### 5.2. 간격 체계 (Spacing Scale - 4px 배수)
| 토큰명 | 값 (rem / px) | 용도 |
|---|---|---|
| `space-xs` | `0.25rem` (4px) | 인라인 아이콘 간격, 뱃지 패딩 |
| `space-sm` | `0.5rem` (8px) | 콤팩트 리스트 아이템 간격, 서브 요소 여백 |
| `gutter` / `space-md` | `0.75rem` (12px) | 카드 내부 여백, 그리드 컬럼 거터 |
| `margin` / `space-lg` | `1rem` (16px) | 페이지 바깥 패딩, 주요 섹션 간격 |
| `space-xl` | `1.5rem` (24px) | 대형 섹션 헤더 및 블록 구분 |

### 5.3. 모서리 곡률 (Border Radius Scale)
| 토큰명 | 값 (rem / px) | 실제 적용 대상 |
|---|---|---|
| `DEFAULT` / `sm` | `0.125rem` (2px) | 스크롤바 썸, 아주 작은 태그 |
| `lg` / `md` | `0.25rem` (4px) | 버튼, 인풋 필드, 뱃지, 체크박스 |
| `xl` | `0.5rem` (8px) | 카드, 모달 팝오버, 코드 블록, 네비게이션 탭 |
| `full` | `0.75rem` (12px 이상) | 원형 상태 표시 점, 프로그레스 바 트랙, 아바타 |

---

## 6. Design System Notes for Stitch (향후 화면 생성 가이드)

향후 Stitch MCP(`generate_screen_from_text`, `generate_variants`, `edit_screens`)를 사용해 신규 화면을 생성하거나 수정할 때는 다음 프롬프트 규칙을 필히 준수해야 합니다.

1. **테마 프롬프트 키워드**:
   * `"Dark mode, deep zinc tones #12131a canvas and #0d0e15 lowest container"`
   * `"Minimalist utilitarian technical interface for software engineers"`
   * `"Zero heavy drop shadows, use crisp 1px borders (#424754) and tonal layer hierarchy"`
2. **타이포그래피 지정**:
   * `"Font stack: Geist for UI headings and body, Pretendard for Korean glyphs, JetBrains Mono for monospace, telemetry metrics, and keyboard shortcuts"`
   * `"Include <link> for Pretendard web font alongside Geist and JetBrains Mono"`
3. **셸 구조 포함**:
   * `"Fixed collapsible left sidebar (240px width) with my-space logo, ⌘K command trigger, and navigation links"`
   * `"Sticky top bar (48px height) with breadcrumbs and KR/EN language toggle"`
4. **컴포넌트 디테일**:
   * `"Card containers must use 8px rounded corners (rounded-xl) with 1px solid #424754 border and distinct header section"`
   * `"Buttons must be compact (28px - 32px height) with 4px tight radius (rounded-md)"`
   * `"Use 6px mini progress bars and .bg-grid-dots canvas for data streams and charts"`
