# ==============================================================================
# 1단계: 빌드 환경 (Node.js 24 Alpine + pnpm)
# ==============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# pnpm 경로 및 캐시 저장소 설정, corepack 활성화
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
RUN pnpm config set store-dir /pnpm/store

# 의존성 메타데이터 파일만 먼저 복사하여 레이어 캐시 적중률 극대화
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# BuildKit 캐시 마운트로 pnpm 스토어를 재사용하여 의존성 초고속 설치
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# 소스 코드 및 설정 파일 복사
COPY nx.json tsconfig.base.json tsconfig.json ./
COPY apps/web ./apps/web

# Git 메타데이터 및 빌드 시각 주입 (pnpm install 캐시를 해치지 않도록 소스 복사 직후 배치)
ARG GIT_COMMIT=unknown
ARG GIT_BRANCH=unknown
ARG BUILD_TIME=""
ARG APP_ENV=production
ARG APP_NAME=my-space-frontend

ENV GIT_COMMIT=$GIT_COMMIT
ENV GIT_BRANCH=$GIT_BRANCH
ENV BUILD_TIME=$BUILD_TIME
ENV APP_ENV=$APP_ENV
ENV APP_NAME=$APP_NAME

# BuildKit 캐시 마운트로 Nx 연산 캐시를 유지하며 프로덕션 번들 빌드
RUN --mount=type=cache,id=nx,target=/app/.nx/cache \
    pnpm build

# ==============================================================================
# 2단계: 런타임 환경 (Nginx Alpine - 약 25MB 초경량 서빙)
# ==============================================================================
FROM nginx:alpine AS runner

# 인프라 기본 환경변수 및 Nginx 템플릿 치환 대상 필터 지정 ($uri 등 Nginx 내장 변수 보호)
ENV PORT=80
ENV CLIENT_MAX_BODY_SIZE=50M
ENV NGINX_ENVSUBST_FILTER="PORT|CLIENT_MAX_BODY_SIZE"

# Nginx 환경변수 치환 템플릿 복사
COPY nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template

# 인프라 주입 환경변수(VITE_*)를 브라우저 런타임(env-config.js)으로 추출하는 엔트리포인트 스크립트 복사
COPY nginx/docker-entrypoint.d/40-generate-env.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh

# 1단계에서 생성된 정적 웹 에셋 복사
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# 인프라 기본 포트
EXPOSE 80

# Nginx 백그라운드 데몬 해제 후 포그라운드 실행
CMD ["nginx", "-g", "daemon off;"]
