---
status: review
owner: Keunhyeok Lim
last-updated: 2026-10-04
---

# 프론트엔드 버전 메타데이터 엔드포인트 명세서 (Specification)

## 1. 개요 (Summary)
백엔드(`my-space-backend`)의 `GET /api/v1/version` 엔드포인트와 일관된 사양으로, 프론트엔드(`my-space-frontend`) 또한 현재 배포된 애플리케이션의 버전, Git 브랜치, 단축 커밋 해시, 빌드 시각 및 환경 정보를 JSON 형식으로 제공하는 `/version` 및 `/version.json` 엔드포인트를 구축합니다.

## 2. 목표 및 응답 규격 (Goals & Response Schema)

### 목표 (Goals)
* **백엔드와 100% 동일한 필드 규격 제공**:
  * `name`: 애플리케이션 명칭 (`my-space-frontend`)
  * `version`: 패키지 버전 (`0.0.1`)
  * `gitBranch`: 빌드된 Git 브랜치명 (예: `main`)
  * `gitCommit`: Git 단축 커밋 해시 7자리 (예: `586e4d3`)
  * `buildTime`: ISO 8601 UTC 빌드 타임스탬프 (예: `2026-10-04T08:02:37Z`)
  * `env`: 배포 환경 식별자 (`production`, `development`, `local` 등)
* **다양한 환경 지원**:
  * **로컬 개발 (`pnpm dev`)**: Vite 개발 서버 미들웨어를 통해 실시간 로컬 Git 정보를 반영한 `/version` 및 `/version.json` 제공
  * **프로덕션 번들 빌드 (`pnpm build`)**: `dist/version.json` 정적 에셋으로 방출
  * **Nginx 컨테이너 배포**: `/version` 및 `/version.json` 요청 시 정적 `version.json`을 `application/json` 타입과 `no-cache` 헤더로 응답
  * **CI/CD 파이프라인 연동**: GitHub Actions Docker 빌드 시 `build-args`로 `GIT_COMMIT`, `GIT_BRANCH`, `BUILD_TIME` 자동 주입

### 응답 JSON 규격 예시
```json
{
  "name": "my-space-frontend",
  "version": "0.0.1",
  "gitBranch": "main",
  "gitCommit": "586e4d3",
  "buildTime": "2026-10-04T08:02:37Z",
  "env": "production"
}
```

## 3. 세부 아키텍처 및 구현 방식 (Implementation Details)

1. **Vite 플러그인 (`vite-plugin-version.ts`)**:
   - `configureServer`: 로컬 Vite 개발 서버 기동 시 `/version`과 `/version.json` 요청을 인터셉트하여 로컬 `git rev-parse` 결과 기반 JSON 응답.
   - `generateBundle`: 프로덕션 번들 빌드 시 주입된 환경변수(`GIT_COMMIT`, `GIT_BRANCH`, `BUILD_TIME`, `APP_ENV`)를 바탕으로 `dist/version.json` 생성.
2. **Nginx 설정 (`nginx/templates/default.conf.template`)**:
   - `location ~* ^/version(?:\.json)?$` 블록을 추가하여 확장자 유무에 상관없이 `/version.json`을 반환하도록 구성.
3. **도커 빌드 (`Dockerfile`) & 워크플로 (`docker-publish.yml`)**:
   - `ARG GIT_COMMIT`, `ARG GIT_BRANCH`, `ARG BUILD_TIME`, `ARG APP_ENV`를 받아 빌드 환경에 주입.
   - GitHub Actions의 `docker/build-push-action`에 `build-args` 단계 추가.
