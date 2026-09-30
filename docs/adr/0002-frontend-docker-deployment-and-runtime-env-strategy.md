---
# MADR 4.0.0 양식 — https://adr.github.io/madr/
status: proposed
date: 2026-09-27
decision-makers: [Keunhyeok Lim]
---

# 프론트엔드 Docker 멀티 스테이지 배포 및 인프라 런타임 환경변수 주입 전략

## 맥락과 문제 정의 (Context and Problem Statement)

백엔드 서비스(`my-space-backend`)가 Docker 컨테이너 이미지 기반으로 패키징 및 배포됨에 따라, 프론트엔드(`apps/web`) 또한 컨테이너 기반 인프라(Kubernetes / Cloud Container Service / Docker Compose 등)에서 일관성 있고 격리된 방식으로 배포되어야 합니다.

Vite + React 기반의 Single Page Application(SPA)은 일반적인 백엔드 애플리케이션과 달리 서버 프로세스가 아닌 브라우저에서 실행되는 정적 파일(HTML, JS, CSS)들의 묶음입니다. 따라서 다음과 같은 기술적 과제를 해결해야 합니다:
1. 배포 이미지의 용량을 최소화하고, 프로덕션 컨테이너에 불필요한 Node.js 런타임 및 개발 의존성을 포함시키지 않는 방법
2. CI/CD 파이프라인 및 로컬 컨테이너 빌드 속도를 극대화하는 계층 캐싱 전략
3. 브라우저 SPA 클라이언트 라우팅(HTML5 History API) 시 발생하는 404 오류 방지 및 정적 파일 캐시 제어
4. "환경별로 이미지를 새로 빌드하지 않고, 단일 이미지를 인프라(ConfigMap/환경변수)를 통해 주입하여 실행"하는 Twelve-Factor 원칙 충족 방안

## 의사결정 동기 (Decision Drivers)

* **초경량 컨테이너 크기**: 불필요한 런타임을 배제하여 30MB 미만의 가벼운 이미지 유지
* **고속 빌드 성능**: 의존성 파일 선행 분리, BuildKit 캐시 마운트(`pnpm store`, `Nx cache`)를 통한 레이어 캐시 적중률 극대화
* **인프라 주입형 환경변수 지원 (Build Once, Run Anywhere)**: 단일 빌드 이미지를 개발, 스테이징, 프로덕션 환경에 재빌드 없이 인프라 환경변수(`VITE_*`)만 변경하여 배포 가능
* **SPA 라우팅 및 웹 표준 준수**: React Router 새로고침 시 404 방지(`try_files`) 및 정적 파일 불변 캐싱(`immutable`), `index.html` 즉시 갱신(`no-cache`)
* **일관된 보안 및 헬스체크**: Kubernetes Liveness/Readiness Probe를 위한 `/healthz` 및 보안 헤더(CSP, X-Frame-Options 등) 기본 탑재

## 검토한 대안들 (Considered Options)

* **대안 1: Node.js 24 빌더 + Nginx Alpine 경량 서빙 + 런타임 환경변수 주입 엔트리포인트 (선택안)**
* **대안 2: Node.js 기반 프로덕션 서빙 (Express / `serve` 패키지 사용)**
* **대안 3: 빌드 시점에 환경변수를 하드코딩하는 정적 Nginx 이미지 (`--build-arg` 방식)**

## 결정 내용 및 결과 (Decision Outcome)

선택한 안: **대안 1 (Node.js 24 빌더 + Nginx Alpine 경량 서빙 + 런타임 환경변수 주입 엔트리포인트)**

### 핵심 아키텍처 구성

1. **빌드 스테이지 (`node:24-alpine`)**:
   - `corepack`을 통해 공식 `pnpm 12.x` 활성화
   - `package.json`, `pnpm-lock.yaml`, `apps/web/package.json`을 먼저 복사하여 소스 코드 수정 시에도 `pnpm install` 레이어가 100% 캐시 히트되도록 분리
   - Docker BuildKit의 `--mount=type=cache,id=pnpm,target=/pnpm/store`를 적용하여 의존성 재다운로드 시간 단축
   - `--mount=type=cache,id=nx,target=/app/.nx/cache`를 통해 Nx 빌드 캐시 유지

2. **런타임 스테이지 (`nginx:alpine`)**:
   - Node.js 및 빌드 도구를 완전히 배제한 순수 `nginx:alpine` 베이스 이미지 (최종 이미지 약 25MB)
   - Nginx 공식 이미지 내장 템플릿 기능(`/etc/nginx/templates/default.conf.template`)을 통해 인프라의 `PORT`, `CLIENT_MAX_BODY_SIZE` 환경변수 자동 치환
   - `location /`에 `try_files $uri $uri/ /index.html;`을 설정하여 SPA 라우팅 지원
   - 해시 에셋 장기 캐시(`max-age=31536000, immutable`), `index.html` 및 `env-config.js` 노캐시(`no-cache`) 적용

3. **인프라 런타임 환경변수 주입 메커니즘**:
   - 컨테이너 시작 시 `/docker-entrypoint.d/40-generate-env.sh`가 실행되어 인프라에서 주입된 `VITE_*` 환경변수를 추출하고 `/usr/share/nginx/html/env-config.js` (`window.__ENV__ = { ... }`)를 동적으로 생성
   - `apps/web/src/shared/config/env.ts`의 `getEnv(key, fallback)` 유틸리티를 통해 브라우저 코드에서 `window.__ENV__`를 우선 조회하고 `import.meta.env`로 폴백
   - 이를 통해 개발, 검증, 운영 환경에 동일한 컨테이너 이미지를 그대로 승격(Promote) 배포 가능

### 기대 효과 및 영향 (Consequences)

* **장점**:
  * 컨테이너 이미지가 극도로 가볍고 메모리 사용량이 미미하여 인프라 비용 절감 및 빠른 파드(Pod) 기동 보장
  * 코드 수정 후 재빌드 시 `pnpm install`이 생략되어 빌드 속도가 수 초 이내로 대폭 단축됨
  * 인프라 단에서 `VITE_*` 환경변수만 설정하면 컨테이너 재시작만으로 동적 설정 적용 가능
  * 쿠버네티스 Ingress, 로드밸런서와 연동할 수 있는 표준 `/healthz` 엔드포인트 기본 제공
* **단점 / 제약 사항**:
  * 브라우저 초기 로드 시 `index.html` 외에 `env-config.js`를 위한 추가 네트워크 요청 1회가 발생 (단, 로컬 컨테이너 내부 서빙이므로 수 밀리초 이내 완료)

## 대안별 장단점 세부 비교 (Pros and Cons of the Options)

### 대안 1: Node 24 멀티스테이지 + Nginx Alpine + 런타임 주입 (선택됨)
* 장점: 최소 크기(~25MB), 최고 서빙 성능, 재빌드 없는 단일 이미지 환경 배포, 레이어 캐시 극대화.
* 단점: 엔트리포인트 쉘 스크립트 유지 관리 필요.

### 대안 2: Node.js 기반 프로덕션 서빙 (Express / `serve`)
* 장점: Node 환경변수(`process.env`)를 서버 사이드에서 바로 접근 가능.
* 단점: 정적 파일 서빙에 불필요한 Node.js 런타임이 상주하여 메모리 점유율이 수백 MB로 증가하고 이미지 용량이 200MB 이상으로 비대해짐.

### 대안 3: 빌드 시 환경변수 고정 (`--build-arg`)
* 장점: `env-config.js` 스크립트 불필요.
* 단점: 환경별(Dev, Stage, Prod)로 매번 새로운 이미지를 따로 빌드해야 하므로 Twelve-Factor 원칙에 위배되고 CI/CD 파이프라인 시간이 N배로 늘어남.

## 참고 및 관련 정보 (More Information)

* 이전 결정: [`docs/adr/0001-api-client-and-proxy-strategy.md`](file:///Users/limkeunhyeok/workspace/my-space-front/docs/adr/0001-api-client-and-proxy-strategy.md)
* 템플릿 설정: [`nginx/templates/default.conf.template`](file:///Users/limkeunhyeok/workspace/my-space-front/nginx/templates/default.conf.template)
* 런타임 스크립트: [`nginx/docker-entrypoint.d/40-generate-env.sh`](file:///Users/limkeunhyeok/workspace/my-space-front/nginx/docker-entrypoint.d/40-generate-env.sh)
* 도커 빌드 파일: [`Dockerfile`](file:///Users/limkeunhyeok/workspace/my-space-front/Dockerfile)
