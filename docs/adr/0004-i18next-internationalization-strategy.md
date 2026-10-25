---
status: proposed
date: 2026-10-25
decision-makers: [Keunhyeok Lim]
---

# 0004: 다국어(KR/EN) 지원을 위한 i18next 및 react-i18next 도입

## 맥락과 문제 정의 (Context and Problem Statement)

`my-space` 프론트엔드 워크스페이스 셸 상단 헤더(`Header.tsx`)에는 한국어(`KR`)와 영어(`EN`)를 전환하는 세그먼트 토글 인터페이스가 설계되어 있습니다([`docs/specs/dashboard.md`](../specs/dashboard.md) `UC-F-D04`). 초기 구현에서는 해당 토글이 헤더 내부의 로컬 상태만 변경하고 실제 화면의 내비게이션, 대시보드, 유틸리티 도메인 UI 텍스트를 전환하지 못했습니다.

실무 프론트엔드 표준에 부합하면서도 TypeScript 타입 안전성, 브라우저 `localStorage` 언어 설정 영속화, 기존 단위/컴포넌트 테스트와의 완벽한 호환성을 보장하는 다국어(i18n) 아키텍처를 어떻게 구성할 것인가?

## 의사결정 동기 (Decision Drivers)

* **실무 표준 생태계 준수**: 업계 표준 다국어 라이브러리(`i18next`, `react-i18next`)를 활용하여 일관된 번역 리소스 관리, 보간(Interpolation), 네임스페이스 확장성 확보
* **한국어(KR) 기본값 및 무결성 유지**: 기존 한국어 문구와 단위 테스트 스위트(34개 spec 파일)가 별도의 복잡한 테스트 수정 없이도 기본 로케일(`ko`)에서 100% 그대로 동작해야 함
* **사용자 언어 설정 영속화**: 사용자가 선택한 언어(`ko` / `en`)를 `localStorage`(`my-space:locale`)에 보존하고 `<html lang>` 속성과 실시간 동기화
* **TypeScript 기반 번역 키 관리**: 한국어(`ko.ts`)와 영어(`en.ts`) 리소스 구조의 일관성을 유지하여 번역 누락 방지

## 검토한 대안들 (Considered Options)

* **대안 1**: `i18next` + `react-i18next` 기반 다국어 아키텍처 도입
* **대안 2**: 외부 패키지 없는 자체 `React Context` 기반 경량 사전 구현
* **대안 3**: `react-intl` (FormatJS) 도입

## 결정 내용 및 결과 (Decision Outcome)

선택한 안: **대안 1 — "`i18next` + `react-i18next` 기반 다국어 아키텍처 도입"**

이유: 실무 프로덕션 환경에서 가장 널리 검증된 표준 조합이며, 향후 다국어 리소스 분리나 동적 보간(`{{count}}` 등), 플러그인 확장이 필요할 때 아키텍처 재설계 없이 유연하게 대응할 수 있기 때문입니다.

### 기대 효과 및 영향 (Consequences)

* **장점**:
  * `useTranslation` 훅과 `i18n.changeLanguage`를 통해 헤더 `KR / EN` 토글 클릭 즉시 전체 워크스페이스 셸(사이드바, 브레드크럼, 바텀바) 및 모든 주요 유틸리티 페이지가 실시간 전환됨
  * `apps/web/src/shared/i18n` 단일 모듈에서 초기화되어 애플리케이션 진입점(`main.tsx` / `app.tsx`) 및 테스트 환경에서도 자동으로 한국어(`ko`) 기본 리소스가 로드됨
* **단점**:
  * `i18next`, `react-i18next` 런타임 의존성이 `package.json`에 추가됨

### 구현 검증 계획 (Confirmation)

1. 상단 헤더 `EN` 버튼 클릭 시 브레드크럼, 사이드바/바텀바 메뉴, 대시보드 및 주요 유틸리티 UI가 영문으로 즉시 전환되는지 확인
2. `localStorage`의 `my-space:locale`에 선택 언어가 저장되고 새로고침 시 복원되는지 단위 테스트로 검증
3. `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm lint` 4대 검증 통과 확인
