# AGENTS.md

이 문서는 `my-space-frontend` 저장소에서 작업하는 AI 에이전트와 개발자가 준수해야 하는 프로젝트 고유의 아키텍처, SDD(Spec-Driven Development) 체계, 개발 원칙 및 제약 사항을 정의합니다.

React, TypeScript, Nx 등 일반적인 도구의 기본 사용법은 다루지 않으며, 오직 이 프로젝트에서의 작업 방식과 의사결정 규칙에 집중합니다.

---

## 1. 프로젝트 컨텍스트 (Project Context)

### 1.1. 저장소 정체성 및 구조
* `my-space` 서비스를 위한 프론트엔드 모노레포 저장소입니다.
* **Nx + pnpm monorepo** 구조를 기반으로 합니다.
* 현재 개발 대상은 **단일 Web 애플리케이션(`apps/web`)** 하나뿐입니다.
* 향후 Mobile 및 Desktop 플랫폼 지원 가능성을 고려하되, **현재 단계에서 모바일/데스크톱 앱, 프레임워크 설정(React Native, Electron, Tauri 등), 또는 공통 패키지(`packages/*`)를 미리 생성하지 않습니다.**
* 실제 다중 플랫폼 지원이나 명확한 코드 공유 필요성이 발생했을 때 점진적으로 라이브러리를 분리합니다.

### 1.2. 백엔드 연동 관계
* 백엔드는 별도의 독립 저장소인 `my-space-backend`에서 관리합니다.
* 프론트엔드 저장소 내에 백엔드 코드를 복제하거나 결합하지 않으며, 백엔드 API 계약(Contract)에 맞춰 클라이언트 연동 계층을 구성합니다.
* 인증(Authelia 등) 및 통신 방식은 백엔드 설계와 인터페이스가 확정된 후 반영하며, 임의로 인증 체계를 선구현하지 않습니다.

### 1.3. 현재 실제 기술 스택
* **Monorepo**: Nx (플러그인 기반 태스크 추론 방식: `@nx/vite`, `@nx/eslint`, `@nx/vitest`)
* **Package Manager**: pnpm (pnpm workspace)
* **Web App**: React 19, TypeScript
* **Bundler & Dev Server**: Vite
* **Test Runner**: Vitest (JSDOM 환경)
* **Styling**: Vanilla CSS (Tailwind CSS, shadcn/ui 등은 현재 도입되어 있지 않으며 임의로 추가하지 않음)
* **Lint & Format**: ESLint (Flat Config) + Prettier

---

## 2. 문서와 구현의 관계 (Documentation Workflow)

모든 작업은 추측이 아닌 **문서와 실제 코드의 확인**에서 출발합니다.

### 2.1. 작업 시작 전 문서 확인 기준
요청받은 작업의 성격에 따라 다음 문서를 먼저 확인합니다:
* **기능 요구사항 및 화면 동작**: 관련 Specification (`docs/specs/*.md`) 확인
* **아키텍처 및 핵심 기술 결정**: 관련 ADR (`docs/adr/*.md`) 확인
* **UI 디자인 및 스타일링**: 프로젝트 루트의 `DESIGN.md` 확인 (존재하는 경우)

### 2.2. 문서와 구현의 불일치 해결 원칙
* 문서와 실제 코드/설정이 다를 경우, 어느 한쪽을 임의로 덮어쓰지 않습니다.
* 단순한 코드 변경에 따른 문서 최신화인지, 새로운 아키텍처/비즈니스 의사결정이 필요한 상황인지 판단합니다.
* 새로운 의사결정이 수반되는 경우, 구현 전에 사용자에게 확인하고 관련 ADR 또는 Specification을 먼저 개정합니다.

---

## 3. SDD(Spec-Driven Development) 체계

프론트엔드 프로젝트 또한 백엔드와 동일하게 **문서(명세)가 구현을 주도하는 SDD 원칙**을 엄격히 준수합니다.

### 3.1. 아키텍처 의사결정 기록 (ADR)

#### 작성 대상
* 프론트엔드 구조에 중대한 영향을 주는 아키텍처 변경 (예: 전역 상태 관리 도입, 라우팅 전략 변경, 공통 라이브러리 분리 등)
* 주요 기술 라이브러리 및 도구 선택/교체
* 되돌리기 어렵거나 번복 시 큰 공수가 발생하는 구조적 결정

#### 규칙 및 양식
* **위치**: `docs/adr/`
* **표준**: [MADR 4.0.0](https://adr.github.io/madr/) 준수
* **파일명**: `NNNN-kebab-case.md` (예: `0001-vite-react-bundler.md`, 4자리 제로패딩 순차 번호)
* **언어**: 한국어(한글) 작성 원칙
* **필수 프론트매터(Front-matter)**:
  ```yaml
  ---
  status: {proposed | rejected | accepted | deprecated | superseded by ADR-NNNN}
  date: YYYY-MM-DD
  decision-makers: [의사결정권자]
  ---
  ```

#### ADR 변경 원칙
* 기존 ADR의 결정을 수정하거나 번복할 때 기존 문서를 직접 덮어쓰거나 내용을 삭제하지 않습니다.
* **새로운 순번의 ADR을 작성**하고, 이전 ADR의 상태를 `superseded by ADR-NNNN`으로 갱신하여 의사결정의 역사적 맥락과 트레이드오프를 보존합니다.

---

### 3.2. 기능 명세서 (Specification)

#### 작성 대상
* 사용자가 경험하는 기능의 요구사항, 화면 인터랙션 흐름, 클라이언트 상태 및 백엔드 API 연동 규격 정의

#### 규칙 및 양식
* **위치**: `docs/specs/`
* **파일명**: `kebab-case.md` (예: `auth-flow.md`, `pdf-viewer.md`)
* **언어**: 한국어(한글) 작성 원칙
* **필수 프론트매터(Front-matter)**:
  ```yaml
  ---
  status: draft | review | approved | implemented | deprecated
  owner: <작성자 이름 / 핸들러>
  last-updated: YYYY-MM-DD
  ---
  ```

#### Specification 상태 수명주기 (Lifecycle)
* `draft`: 기능 요구사항 구상 및 초안 작성 단계
* `review`: 설계 및 상호작용 흐름 검토 단계
* `approved`: 구현을 시작해도 좋다고 승인된 단계
* `implemented`: 실제 컴포넌트, 로직 및 테스트가 코드베이스에 완전히 반영된 단계
* `deprecated`: 기능 개편 등으로 더 이상 유효하지 않은 명세

#### 프론트엔드 스펙 권장 섹션
1. **개요 (Summary)**: 기능의 목적과 사용자 가치
2. **목표 및 제외 대상 (Goals / Non-goals)**: 이번에 구현할 범위와 의도적으로 제외할 항목
3. **유스케이스 및 사용자 흐름 (Use Cases)**: 식별자(`UC-XX`) 기반 사용자 시나리오 및 인터랙션 흐름
4. **화면 및 컴포넌트 요구사항 (UI / Component Specs)**: UI 상태(로딩, 성공, 빈 화면, 에러)와 컴포넌트 계층
5. **클라이언트 상태 및 데이터 흐름 (State & Data Flow)**: 로컬/전역 상태 정의 및 흐름
6. **API 연동 규격 (API Integration)**: 호출할 백엔드 API 엔드포인트 및 요청/응답 처리 방식
7. **에러 핸들링 및 사용자 피드백 (Error Handling)**: 네트워크 오류, 유효성 실패 시 사용자 안내 방식 (토스트, 알림, 폼 에러 등)
8. **오픈 질문 (Open Questions)**: 미확정 사항 및 추가 검토 항목

> [!IMPORTANT]
> **ADR과 Specification의 책임 분리**
> 프레임워크 선택, 상태 관리 라이브러리 도입 등 아키텍처적 기술 결정은 Specification에 직접 포함하지 않고 별도의 **ADR**로 작성한 뒤, Specification에서는 해당 ADR을 링크로 참조합니다.

---

## 4. UI 디자인 기준 (`DESIGN.md`)

UI 디자인 및 스타일링의 단일 진실 공급원(Single Source of Truth)은 루트의 `DESIGN.md`입니다.

* **현재 상태**: 현재 저장소에는 `DESIGN.md`가 존재하지 않습니다. 이번 작업이나 다른 작업에서 **임의로 생성하지 않습니다.**
* **향후 계획**: 향후 Stitch 등을 활용해 초기 UI 디자인 시스템을 확정한 후 `DESIGN.md`를 작성할 예정입니다.
* **`DESIGN.md` 생성 후 준수 원칙**:
  * 색상 팔레트, Typography, Spacing, Layout, Border radius, 반응형 중단점(Breakpoints), 접근성(a11y) 등은 `DESIGN.md`를 최우선 기준으로 준수합니다.
  * 기존 `DESIGN.md`에 명시되지 않은 새로운 UI 패턴이 필요한 경우 기존 코드 패턴을 먼저 확인합니다.
  * 기존 규칙만으로 판단할 수 없는 중요한 디자인 변경은 임의로 결정하지 않고 사용자에게 확인을 요청합니다.

---

## 5. 핵심 개발 및 작업 원칙 (Core Principles)

### 5.1. 저장소 사실(Fact) 기반 작업
* 작업을 시작하기 전 디렉토리 구조, `package.json`, Nx 설정, 소스 코드 등 **실제 파일 내용을 먼저 확인**합니다.
* 확인되지 않은 관례나 라이브러리를 임의로 가정하거나 추측하여 작업하지 않습니다.

### 5.2. 최소주의와 점진적 추상화 (YAGNI)
* 현재 실제로 필요한 범위만 구현합니다.
* 사용 필요성이 입증되지 않은 shared library, generic abstraction, helper 계층을 미리 만들지 않습니다.
* 단순한 코드 중복만을 이유로 조기에 공통 패키지로 분리하지 않습니다.

### 5.3. 의존성 통제
* 새로운 패키지, 라이브러리, UI 프레임워크(Tailwind CSS, shadcn/ui 등)를 임의로 추가(`pnpm add`)하지 않습니다.
* 의존성 추가가 필요한 경우 기술적 필요성과 대안을 사용자에게 설명하고 승인을 받습니다.

### 5.4. 구조 변경 시 투명성
* 디렉토리 구조, Nx 설정, 빌드/린트 설정을 변경할 때는 **변경이 필요한 이유와 영향 범위**를 사전에 명확히 설명합니다.
* 기존 파일을 삭제하거나 대규모로 리팩터링할 때는 필요성을 먼저 검증하고 확인을 거칩니다.

---

## 6. Git 작업 원칙

* **Git commit 및 push는 사용자가 명시적으로 지시한 경우에만 수행합니다.**
* 작업 완료 후에는 변경 사항을 간결하게 요약하고, 필요한 경우 **Conventional Commits** 형식의 커밋 메시지 후보를 2~3개 제안합니다.
  * 예: `feat(web): ...`, `chore: ...`, `docs: ...`
