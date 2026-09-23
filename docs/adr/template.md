---
# MADR 4.0.0 양식 — https://adr.github.io/madr/
status: {proposed | rejected | accepted | deprecated | superseded by ADR-NNNN}
date: { YYYY-MM-DD }
decision-makers: [의사결정권자]
---

# {짧은 제목 — 해결책 중심의 의사결정 내용 기술, 문제가 아님}

## 맥락과 문제 정의 (Context and Problem Statement)

{2~3문장으로 프론트엔드 시스템/사용자 경험 맥락과 해결해야 할 핵심 문제를 설명합니다. 질문 형식으로 문제를 정의해도 좋습니다.}

## 의사결정 동기 (Decision Drivers)

* {고려해야 할 강제력, 비기능 요구사항, 비즈니스/개발자 경험 목표 등}
* {예: 빠른 번들링/HMR 속도, 번들 사이즈 최소화, 타입 안정성, 일관된 상태 흐름 등}

## 검토한 대안들 (Considered Options)

* {대안 1}
* {대안 2}
* {대안 3}

## 결정 내용 및 결과 (Decision Outcome)

선택한 안: "{대안 이름}"
이유: {이 안이 동기(drivers)를 가장 잘 충족하는 근거를 1~2문장으로 간결하게 기재합니다.}

### 기대 효과 및 영향 (Consequences)

* 장점: {선택안이 가져올 구조적/개발 생산성/사용자 경험상의 이점}
* 단점: {받아들여야 하는 트레이드오프, 런타임 오버헤드나 학습 곡선 등 감수해야 할 한계}

### 구현 검증 계획 (Confirmation)

{이 결정이 코드에 올바르게 적용되었는지 어떻게 검증할지 기재합니다. (예: 빌드 산출물 크기 측정, 린트 룰, 단위/컴포넌트 테스트 검증 등)}

## 대안별 장단점 세부 비교 (Pros and Cons of the Options)

### {대안 1}

* 장점: {…}
* 단점: {…}

### {대안 2}

* 장점: {…}
* 단점: {…}

## 참고 및 관련 정보 (More Information)

{관련 공식 문서 링크, 벤치마크 자료, 의사결정 바탕이 된 회의록 등 (선택사항)}
