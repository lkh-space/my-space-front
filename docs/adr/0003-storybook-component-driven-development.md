---
status: proposed
date: 2026-10-20
decision-makers: [개발팀, 프론트엔드 리드]
---

# 0003: 컴포넌트 주도 개발 및 디자인 시스템 문서화를 위한 Nx Storybook 도입

## 맥락과 문제 정의 (Context and Problem Statement)

`my-space` 프론트엔드는 다크 징크 테마와 6단계 토널 서피스 기반의 독자적인 디자인 시스템(`DESIGN.md`)을 구축하고 있습니다. 그러나 메인 애플리케이션 화면에 직접 종속된 형태로는 컴포넌트의 다양한 상태(Hover, Loading, Disabled, Empty 등)를 독립적으로 검증하고 시각적 회귀를 방지하기 어렵습니다. 

애플리케이션 런타임 및 라우팅 로직과 완전히 격리된 환경에서 UI 컴포넌트와 디자인 토큰(Colors, Typography, Spacing)을 체계적으로 개발·문서화·테스트할 수 있는 표준 도구를 어떻게 구성할 것인가?

## 의사결정 동기 (Decision Drivers)

* **컴포넌트 독립 개발(CDD)**: 백엔드 API 상태나 라우터 의존성 없이 UI 컴포넌트만 격리하여 개발 및 인터랙티브 테스트 지원
* **디자인 토큰 문서화(SSOT 연계)**: `DESIGN.md`에 명시된 시맨틱 토큰과 타이포그래피 스케일을 시각적으로 조망할 수 있는 대화형 카탈로그 제공
* **Nx 모노레포 아키텍처 정합성**: 기존 Nx 23.2 및 Vite 기반 빌드 파이프라인과 완벽히 호환되는 태스크 캐싱 및 설정 지원
* **프로덕션 번들 격리**: 스토리북 및 컴포넌트 문서화 번들이 실제 배포용 웹앱 번들에 일절 포함되지 않도록 빌드 타임 분리 보장

## 검토한 대안들 (Considered Options)

* **대안 1**: Nx 공식 플러그인(`@nx/storybook`) 기반의 Storybook 8 + Vite 통합
* **대안 2**: 메인 웹앱 내부의 인하우스 StyleGuide 페이지(`/design-system`) 유지
* **대안 3**: 독립형 순수 Storybook 8 CLI 직접 설치 (Nx 플러그인 미사용)

## 결정 내용 및 결과 (Decision Outcome)

선택한 안: **대안 1 — "Nx 공식 플러그인(`@nx/storybook`) 기반의 Storybook 8 + Vite 통합"**

이유: 기존 모노레포 도구인 Nx 23.2와의 일관성을 유지하면서 `nx storybook @my-space-front/web` 및 `nx build-storybook` 태스크를 통해 로컬 실행과 정적 빌드를 손쉽게 관리할 수 있고, 메인 프로덕션 웹앱 번들을 전혀 오염시키지 않기 때문입니다.

### 기대 효과 및 영향 (Consequences)

* **장점**:
  * 메인 웹앱과 완전히 분리된 독립 개발 서버(`localhost:6006`)에서 컴포넌트 격리 개발 가능
  * Props(Args)를 마우스로 실시간 조작할 수 있는 인터랙티브 컨트롤 패널 제공
  * 디자인 토큰(Colors, Typography, Spacing)을 MDX 및 스토리로 깔끔하게 문서화
  * 향후 컴포넌트 라이브러리(`packages/ui`) 분리 시 재사용 가능한 인프라 확보
* **단점**:
  * 개발 의존성(`devDependencies`) 패키지 증가 및 초기 의존성 설치 시간 발생
  * 컴포넌트 구현 시 `.stories.tsx` 작성 공수 수반

### 구현 검증 계획 (Confirmation)

1. `pnpm storybook` 명령으로 로컬 개발 서버가 정상 구동되고 디자인 토큰/컴포넌트 스토리가 렌더링되는지 확인
2. `pnpm build-storybook` 명령으로 정적 배포용 HTML/JS 번들이 정상 빌드되는지 검증
3. 메인 웹앱 빌드(`pnpm build`) 시 스토리북 관련 코드가 번들에 포함되지 않는지 번들 크기 확인

## 대안별 장단점 세부 비교 (Pros and Cons of the Options)

### 대안 1: Nx 공식 플러그인(@nx/storybook) 기반 Storybook 8 (선택안)

* 장점: Nx의 태스크 러너, 캐싱, Vite 설정 재사용이 가능하며 단일 명령어로 프로젝트 구성이 가능함.
* 단점: Nx 버전과의 호환성을 고려하여 플러그인 버전을 맞춰야 함.

### 대안 2: 메인 웹앱 내부 인하우스 StyleGuide 페이지 유지

* 장점: 추가적인 devDependencies 설치 없이 가볍고 빠른 라우팅 제공.
* 단점: 메인 웹앱의 라우터, 상태, 번들에 영향을 주며, 컴포넌트 Props를 마우스로 조작하는 등의 표준 스토리북 도구를 자체 구현해야 하는 한계가 존재함.

## 참고 및 관련 정보 (More Information)

* [Storybook for Vite 공식 문서](https://storybook.js.org/docs/builders/vite)
* [Nx Storybook Plugin 가이드](https://nx.dev/packages/storybook)
* [프로젝트 디자인 가이드라인 DESIGN.md](file:///Users/limkeunhyeok/workspace/my-space-front/DESIGN.md)
