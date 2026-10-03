---
status: implemented
owner: Keunhyeok Lim
last-updated: 2026-10-03
---

# Authelia SSO 연동 및 현재 로그인 사용자 헤더 UI 명세서 (Specification)

## 1. 개요 (Summary)
본 명세서는 인프라 레벨의 **Authelia SSO + Traefik ForwardAuth** 게이트웨이 인증 체계와 프론트엔드(`my-space-frontend`) 간의 세션 연동 및 사용자 프로필 UI 사양을 정의합니다. 백엔드의 `GET /api/v1/auth/me` API를 통해 현재 로그인한 사용자 정보(`CurrentUser`)를 조회하고, 상단 헤더 네비게이션에 사용자 등급(체험 모드, 관리자, 로컬 개발)별 맞춤형 배지를 노출하며 단일 클릭 로그아웃 기능을 제공합니다.

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 목표 (Goals)
* **세션 쿠키 기반 무인증 헤더 연동**: 동일 Origin 기반 브라우저 세션 쿠키(`authelia_session`) 자동 동반을 활용하여 별도 JWT 토큰 수동 관리 없이 사용자 정보 조회
* **사용자 권한별 배지 UI**:
  * `guest`: `[체험 모드] Guest Reviewer` (노란색/연하늘색 톤)
  * `admin`: `[관리자] Administrator` (보라색 톤)
  * `local-admin`: `[로컬 개발] Local Developer` (에메랄드/청록 톤)
* **로그아웃 흐름 구현**: 클릭 시 `https://auth.homelab.local/logout`으로 이동하여 Authelia 중앙 세션 해제
* **로컬 개발 DX 보장**: `npm run dev` 실행 시 Vite 개발 프록시(`/api -> http://localhost:3000`)를 통해 백엔드의 `local-admin` 모킹 유저 정보를 자동으로 받아 로그인 절차 없이 즉시 개발 가능

### 제외 대상 (Non-goals)
* 프론트엔드 내 독자적인 아이디/비밀번호 로그인 폼 구현 (모든 인증은 중앙 Authelia 포털에서 전담)
* 클라이언트 사이드 권한 가드에 의한 페이지 접근 차단 (게이트웨이 및 백엔드 가드가 1차 통제)

## 3. 유스케이스 및 사용자 흐름 (Use Cases)

### UC-01: 초기 진입 시 사용자 정보 로드
1. 사용자가 웹 애플리케이션에 접속합니다.
2. `AuthProvider`가 마운트되면서 `GET /api/v1/auth/me`를 호출합니다.
3. 로딩 중에는 헤더 프로필 영역에 미세 펄스 스켈레톤 인디케이터가 표시됩니다.
4. 사용자 정보 수신 성공 시:
   * 사용자 권한 배지와 표시 이름(displayName)이 헤더 우측에 렌더링됩니다.
   * 사용자 정보는 전역 Context 캐시에 저장되어 페이지 전환 시 중복 네트워크 요청을 발생시키지 않습니다.

### UC-02: 사용자 권한별 배지 식별
* **체험 모드 게스트(`user.username === 'guest'`)**:
  * 채용 담당자나 외부 평가자가 방문한 상태임을 직관적으로 알 수 있도록 `[체험 모드] Guest Reviewer` 배지가 눈에 띄게 표시됩니다.
* **관리자(`user.username === 'admin'`)**:
  * 시스템 관리자 권한임을 알리는 `[관리자] Administrator` 보라색 배지가 표시됩니다.
* **로컬 개발자(`user.username === 'local-admin'`)**:
  * 로컬 개발 서버(`localhost:4200`)에서 구동 중임을 알리는 `[로컬 개발]` 배지가 표시됩니다.

### UC-03: 사용자 상세 정보 확인 및 로그아웃
1. 사용자가 헤더의 프로필 칩을 클릭합니다.
2. 드롭다운 팝오버가 열리며 다음 정보가 표시됩니다:
   * 아바타, 표시 이름, 사용자명(@username)
   * 이메일 주소
   * 소속 그룹 태그 (예: `admins`, `guests`, `dev`)
   * 세션 만료 안내 및 '로그아웃' 버튼
3. '로그아웃' 버튼 클릭 시 `window.location.href = 'https://auth.homelab.local/logout'`으로 이동하여 세션을 정리합니다.

## 4. UI / 컴포넌트 요구사항 (UI / Component Specs)

### 4.1. 컴포넌트 계층 구조
```text
apps/web/src/
├── entities/auth/
│   ├── api/
│   │   ├── authApi.ts          # GET /api/v1/auth/me 호출
│   │   └── useCurrentUser.ts   # 현재 로그인 유저 정보 조회 커스텀 훅
│   └── model/
│       ├── types.ts            # CurrentUser 인터페이스 정의
│       └── AuthContext.tsx     # 전역 인증 상태 Provider
└── widgets/header/
    ├── ui/
    │   ├── Header.tsx          # 상단 글로벌 네비게이션 헤더
    │   ├── UserProfileBadge.tsx # 사용자 배지 및 프로필 드롭다운 컴포넌트
    │   └── header.css          # DESIGN.md 준수 스타일시트
    └── index.ts
```

### 4.2. 디자인 시스템 준수 (`DESIGN.md`)
* **색상 팔레트**:
  * 기본 서페이스: `bg-surface-container` (`#1e1f26`)
  * 보더: `border-outline-variant` (`#424754` / `#27272a`)
  * 게스트 배지: 앰버/스카이 톤 (`#fcd34d` / `#7dd3fc`, 배경 `rgba(245, 158, 11, 0.12)`)
  * 관리자 배지: 퍼플 톤 (`#c084fc`, 배경 `rgba(168, 85, 247, 0.15)`)
  * 로컬 개발 배지: 에메랄드 톤 (`#4edea3`, 배경 `rgba(78, 222, 163, 0.15)`)
* **타이포그래피**: `Geist`, `Pretendard`, 모노스페이스 `JetBrains Mono`

## 5. API 연동 규격 (API Integration)

### `GET /api/v1/auth/me`
* **요청 방식**: `GET`, `credentials: 'same-origin'`
* **성공 응답 (200 OK)**:
  ```json
  {
    "username": "local-admin",
    "displayName": "Local Developer",
    "email": "dev@homelab.local",
    "groups": ["admins", "dev"]
  }
  ```
* **미인증 응답 (401 Unauthorized)**:
  ```json
  {
    "statusCode": 401,
    "message": "인증 정보가 없습니다."
  }
  ```

## 6. 에러 핸들링 및 사용자 피드백
* API 호출 실패 또는 401 반환 시:
  * 앱 전체를 차단하지 않고, 헤더에 `[미인증]` 또는 게스트 모드 안내 칩을 표시하며 재시도 액션을 제공합니다.
* 로그아웃 시:
  * 이동 전 사용자에게 간단한 확인 피드백 또는 직관적인 버튼 상태를 제공합니다.
