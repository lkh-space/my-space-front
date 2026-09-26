---
# MADR 4.0.0 양식 — https://adr.github.io/madr/
status: proposed
date: 2026-09-24
decision-makers: [Keunhyeok Lim]
---

# Vite 개발 서버 프록시 및 경량 API 클라이언트 연동 전략

## 맥락과 문제 정의 (Context and Problem Statement)

`my-space-frontend`는 백엔드(`my-space-backend`)와 독립된 저장소로 분리되어 있으며, 로컬 개발 환경에서 각각 다른 포트(Vite Web App: `4200`, NestJS Backend: 환경 변수(`.env`) 및 인프라 설정에 따라 가변)로 실행됩니다. 첫 번째 기능인 PDF 유틸리티(`pdf-tools`)를 비롯하여 향후 백엔드 API(`/api/v1/*`)와 통신할 때, 브라우저의 교차 출처 리소스 공유(CORS) 문제를 해결하고 프로덕션 환경(Kubernetes Ingress / Authelia 인증 체계)과 일관된 통신 경로를 확보해야 합니다.

프론트엔드에서 백엔드 API를 호출하고 자격 증명(인증 쿠키)을 관리하는 통신 아키텍처를 어떻게 구성할 것인가?

## 의사결정 동기 (Decision Drivers)

* **환경 일관성**: 로컬 개발 환경과 프로덕션 배포 환경(단일 도메인 및 Ingress 기반 라우팅)의 API 호출 경로 일치
* **최소주의와 의존성 통제 (YAGNI)**: 검증되지 않은 무거운 HTTP 라이브러리(Axios 등)의 임의 추가 지양
* **인증 연동 대비**: 향후 Authelia(쿠키 기반 ForwardAuth / Session) 도입 시 CORS 복잡도 및 `SameSite` 쿠키 누락 문제 원천 차단
* **바이너리 스트림 처리 용이성**: 대용량 PDF 업로드(`multipart/form-data`) 및 변환 결과 다운로드(`Blob` 스트림)의 직관적 제어

## 검토한 대안들 (Considered Options)

* **대안 1**: Vite 개발 서버 프록시(`server.proxy`) + 네이티브 `fetch` 기반 경량 API 클라이언트
* **대안 2**: 환경 변수(`VITE_API_BASE_URL=http://localhost:<PORT>`) 절대 경로 호출 + 백엔드 CORS 전면 허용
* **대안 3**: 외부 서드파티 라이브러리(Axios + TanStack Query) 즉시 도입

## 결정 내용 및 결과 (Decision Outcome)

선택한 안: **대안 1 (Vite 개발 서버 프록시 + 네이티브 `fetch` 기반 경량 클라이언트)**

이유:
1. 프론트엔드 코드베이스는 절대 URL 대신 상대 경로(`/api/v1/...`)만 호출하므로, 소스 코드 내에 환경별 백엔드 호스트 주소가 하드코딩되지 않고 환경 독립성을 유지합니다.
2. 브라우저는 모든 API 호출을 동일 출처(Same-Origin)로 인식하므로, 복잡한 CORS Preflight 요청 오버헤드가 없고 향후 인증 쿠키(`credentials: 'same-origin'`)가 자동으로 동반됩니다.
3. 추가 외부 패키지 설치 없이 브라우저 표준 `fetch`와 TypeScript 제네릭을 결합한 얇은 클라이언트 계층(`src/shared/api/client.ts`)만으로 파일 업로드 및 Blob 다운로드를 깔끔하게 처리할 수 있습니다.

### 기대 효과 및 영향 (Consequences)

* **장점**:
  * 추가 라이브러리 설치(`pnpm add`) 없이 번들 사이즈를 최소화하고 React 19 / TypeScript 표준을 유지합니다.
  * 개발 환경에서 백엔드 포트가 변경되더라도 인프라 구성 또는 `vite.config.mts`의 프록시 타깃 1곳만 수정하면 됩니다.
  * 프로덕션 배포 시 Ingress가 `/api` 경로를 백엔드 서비스로 포워딩하므로 코드 수정이 전혀 필요 없습니다.
* **단점**:
  * Vite 개발 서버가 중계자 역할을 하므로 개발 서버 구동 중에만 프록시가 작동합니다 (단, 프로덕션은 Nginx/Ingress가 처리하므로 실질적 한계 없음).
  * 자동 재시도나 복잡한 캐시 무효화는 추후 필요성이 입증될 때 별도 유틸리티로 보완해야 합니다.

### 구현 검증 계획 (Confirmation)

* `apps/web/vite.config.mts`에 `/api` -> 실행 중인 백엔드 서버(환경 변수 및 인프라 구성 기반 포트) 프록시 규칙을 설정합니다.
* 경량 클라이언트 모듈(`src/shared/api/`)을 구성하고, 백엔드의 `POST /api/v1/pdf/inspect` 호출 시 상대 경로(`/api/v1/pdf/inspect`)를 통해 정상 응답이 수신되는지 단위/통합 테스트로 검증합니다.

## 대안별 장단점 세부 비교 (Pros and Cons of the Options)

### 대안 1: Vite 개발 서버 프록시 + 네이티브 fetch (선택됨)
* 장점: 동일 출처 처리로 CORS 불필요, 환경 변수 의존도 최소화, 제로 번들 오버헤드, Ingress 구조와 완벽 일치.
* 단점: 오프라인 캐싱, 윈도우 포커스 리페칭 등 고급 캐싱 기능은 수동 관리 필요.

### 대안 2: 환경 변수 절대 경로 + 백엔드 CORS 허용
* 장점: 프론트엔드 번들러 프록시 설정이 불필요함.
* 단점: 모든 요청에 Preflight(OPTIONS) 네트워크 왕복 발생, 로컬 환경에서 쿠키 전달 시 `SameSite=None; Secure` 제약으로 인한 로컬 개발 복잡도 증가, 코드에 호스트 환경변수 노출.

### 대안 3: Axios + TanStack Query 즉시 도입
* 장점: 풍부한 인터셉터 및 서버 상태 캐싱 기능 제공.
* 단점: 현재 첫 기능(PDF 도구)은 캐싱이 필요한 데이터 조회가 아니라 일회성 파일 변환/다운로드 파이프라인이 중심이므로 YAGNI 원칙에 위배되며 불필요한 의존성 증가.

## 참고 및 관련 정보 (More Information)

* 백엔드 API 명세: [`my-space-backend/docs/specs/pdf-tools.md`](file:///Users/limkeunhyeok/workspace/my-space-backend/docs/specs/pdf-tools.md)
* 프론트엔드 작업 지침: [`AGENTS.md`](file:///Users/limkeunhyeok/workspace/my-space-front/AGENTS.md) 5.3절 (의존성 통제)
