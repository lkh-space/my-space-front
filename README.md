# my-space-frontend

개발자를 위한 개인 워크스페이스 프론트엔드 저장소입니다.  
데이터의 외부 유출 없이 로컬 환경에서 격리 실행(Zero Telemetry)되는 유틸리티(PDF 도구, DBML 변환기, 마크다운 뷰어 등)와 워크스페이스 대시보드를 제공합니다.

---

## 🛠️ 기술 스택

* **Monorepo**: Nx (pnpm workspace)
* **Application**: React 19, TypeScript
* **Bundler & Dev Server**: Vite
* **Test Runner**: Vitest (JSDOM)
* **Styling**: Vanilla CSS (토큰 기반 [DESIGN.md](./DESIGN.md) 준수)
* **Lint & Format**: ESLint (Flat Config) + Prettier

---

## 📂 프로젝트 구조

```text
my-space-front/
├── apps/
│   └── web/                   # 단일 웹 애플리케이션
│       ├── src/
│       │   ├── app/           # 루트 라우터 및 엔트리
│       │   ├── pages/         # 화면 컴포넌트 (대시보드, 유틸리티 등)
│       │   ├── shared/        # 공통 레이아웃 셸(SideNav, TopNav, ⌘K), 타입, 유틸
│       │   └── styles.css     # 시맨틱 디자인 토큰 및 글로벌 스타일
│       └── vite.config.mts
├── docs/                      # SDD(Spec-Driven Development) 문서 체계
│   ├── adr/                   # 아키텍처 결정 기록 (MADR)
│   └── specs/                 # 기능별 요구사항 및 인터랙션 사양서
├── AGENTS.md                  # 프로젝트 컨텍스트 및 에이전트/개발 원칙
└── DESIGN.md                  # UI 디자인 시스템 Single Source of Truth
```

---

## 🚀 빠른 시작

### 1. 의존성 설치
이 저장소는 `pnpm`을 기본 패키지 매니저로 사용합니다.

```bash
pnpm install
```

### 2. 개발 서버 실행
로컬 개발 서버를 기동합니다. 브라우저에서 `http://localhost:4200`으로 접속할 수 있습니다.

```bash
pnpm dev
# 또는
pnpm start
```

### 3. 검증 및 빌드

```bash
# 단위 테스트 실행
pnpm test

# 프로덕션 번들 빌드
pnpm build

# 코드 린트 검사
pnpm lint
```

---

## 📖 개발 규칙 및 참고 문서

* **UI 디자인 가이드**: 모든 화면 스타일링과 컴포넌트 구현은 [DESIGN.md](./DESIGN.md)의 색상 토큰, 타이포그래피, 레이아웃 규격을 최우선으로 따릅니다.
* **SDD 체계**: 새로운 기능 구현 전 명세서([`docs/specs/`](./docs/specs/)) 및 기술적 결정([`docs/adr/`](./docs/adr/))을 먼저 작성/확인합니다.
* **개발 원칙**: 불필요한 의존성(Tailwind, 컴포넌트 라이브러리 등)을 임의로 추가하지 않으며 최소주의(YAGNI)를 유지합니다. 자세한 사항은 [AGENTS.md](./AGENTS.md)를 참고하세요.
