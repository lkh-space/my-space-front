---
status: review
owner: Keunhyeok Lim
last-updated: 2026-10-04
---

# 시스템 버전 확인 및 서버 헬스체크 사양서 (System Version Check Specification)

## 1. 개요 (Summary)

`my-space` 개인 개발자 워크스페이스 상단 네비게이션 헤더에서 프론트엔드(`Web App`) 및 백엔드 서비스들의 현재 배포 버전, Git 브랜치, 커밋 해시, 빌드 시각 및 서버 연결 상태를 한눈에 파악하고 상세 검토할 수 있는 **버전 확인 칩(Button) 및 드롭다운 팝오버(Popover)**의 기능 사양을 정의합니다.

현재는 단일 백엔드(`my-space-backend`)와 통신하지만, 향후 마이크로서비스 또는 다중 서버 환경으로 확장될 수 있도록 **확장 가능한 서비스 레지스트리 아키텍처**를 적용합니다. 서버 중 하나라도 연결이 끊기거나 응답하지 않을 경우 헤더 칩에 즉시 `error` 상태를 표시하여 개발자가 인프라 장애나 배포 문제를 직관적으로 인지할 수 있도록 돕습니다.

시각적 스타일링(다크 모드, 징크 기반 토널 레이어, 색상 팔레트, JetBrains Mono 서체, 1px 미세 보더 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 최우선 기준으로 준수합니다.

---

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 목표 (Goals)
* **헤더 인라인 버전 칩 (Header Version Badge)**:
  * 상단 헤더 우측 액션 클러스터에 컴팩트한 칩 버튼 형태로 배치
  * 모든 서버 정상 연결 시: 대표 버전(예: `v0.0.1`)과 에메랄드 상태 점(`online`) 노출
  * 서버 연결 실패/장애 감지 시: 붉은색/앰버 경고 점과 함께 `error` 텍스트 노출
* **다중 서버 확장 지원 (Multi-Server Readiness)**:
  * 향후 서버가 여러 개로 분리되더라도 서비스 설정 배열(`SERVICE_REGISTRY`)에 엔드포인트만 등록하면 자동으로 상태를 집계하고 팝오버 목록에 렌더링되도록 설계
  * 각 서비스는 독립적인 비동기 요청(`Promise.allSettled`)으로 검사되어 한 서버의 지연/장애가 다른 서버의 버전 표시에 영향을 주지 않음
* **상세 버전 정보 드롭다운 팝오버 (Version Popover)**:
  * 칩 클릭 시 헤더 바로 아래에 렌더링되는 모던 팝오버 UI
  * **Frontend (Web App)**: 버전, Git 브랜치, 커밋 해시(클릭 시 복사), 빌드 시각, 환경(`env`) 표시
  * **Backend Services**: 등록된 각 서버 카드 목록 (서버명, 엔드포인트, 상태 태그, 버전, 커밋, 브랜치, 빌드 시각, 에러 메시지)
  * **외부 클릭 / ESC 닫기**: 팝오버 바깥 영역 클릭 또는 ESC 키 입력 시 자연스럽게 닫힘
* **새로고침 및 실시간 재검사**:
  * 팝오버 하단에 '새로고침(Refresh)' 버튼을 제공하여 페이지 새로고침 없이 즉시 모든 서버의 상태와 버전을 재조회

### 제외 대상 (Non-goals)
* 초단위 WebSocket 실시간 지속 핑 데몬 (초기에는 마운트 시 1회 조회 + 팝오버 오픈/수동 새로고침 기반으로 경량화)
* 원격 서버 로그 스트리밍 또는 상세 텔레메트리 모니터링 (별도 메트릭 페이지에서 다룰 범위)

---

## 3. 유스케이스 및 사용자 흐름 (Use Cases)

| 유스케이스 ID | 액터 | 목표 | 주요 인터랙션 흐름 |
| :--- | :--- | :--- | :--- |
| `UC-VER-01` | 개발자 | 헤더에서 전체 시스템 상태 요약 확인 | 1. 웹 앱 접속 → 2. 프론트엔드 및 백엔드 버전 비동기 병렬 조회 → 3. 모두 정상이면 `v0.0.1` (초록 점), 하나라도 실패 시 `error` (빨간 점) 표시 |
| `UC-VER-02` | 개발자 | 팝오버를 열어 상세 버전 정보 확인 | 1. 헤더의 버전 칩 클릭 → 2. 드롭다운 팝오버 오픈 → 3. 프론트엔드와 백엔드의 커밋 해시, 빌드 시간, 환경 메타데이터 확인 |
| `UC-VER-03` | 개발자 | 커밋 해시 복사 | 1. 팝오버 내 커밋 해시(예: `586e4d3`) 클릭 → 2. 클립보드 복사 및 '복사됨' 토스트/피드백 노출 |
| `UC-VER-04` | 개발자 | 서버 장애 발생 시 에러 확인 | 1. 백엔드 서버 다운 상태 → 2. 헤더에 `error` 뱃지 노출 → 3. 칩 클릭 시 팝오버에서 해당 백엔드 카드에 `Connection Failed (502 / Offline)` 원인 안내 |
| `UC-VER-05` | 개발자 | 수동 새로고침 실행 | 1. 팝오버 하단 '새로고침' 버튼 클릭 → 2. 로딩 스피너 회전 → 3. 모든 서버 상태 최신화 반영 |

---

## 4. 화면 및 컴포넌트 요구사항 (UI / Component Specs)

### 4.1. 컴포넌트 계층 구조
```
src/
├── entities/
│   └── version/
│       ├── model/
│       │   └── types.ts            # ServiceConfig, ServiceVersionInfo, SystemVersionState
│       └── api/
│           ├── registry.ts         # 등록된 서비스 엔드포인트 목록
│           └── useSystemVersion.ts # 다중 서비스 병렬 조회 훅
└── widgets/
    └── header/
        └── ui/
            ├── Header.tsx          # 버전 칩 마운트
            ├── VersionBadge.tsx    # 헤더 인라인 칩 (v0.0.1 또는 error)
            ├── VersionPopover.tsx  # 드롭다운 상세 버전 팝오버
            └── header.css          # 순수 Vanilla CSS 스타일링
```

### 4.2. UI 상태 매트릭스 (UI States)

| 상태 | 헤더 칩(Badge) 외형 | 팝오버 내 서버 카드 외형 |
| :--- | :--- | :--- |
| **All Online (정상)** | `v0.0.1` + 에메랄드 원형 점 (`#10b981`) | 각 서버별 녹색 `online` 뱃지 및 메타데이터 정상 노출 |
| **Partial / Full Error (장애)** | `error` + 붉은색 원형 점 (`#ffb4ab`) | 해당 서버 카드에 빨간색 `error` 뱃지 및 에러 안내(`서버 연결 실패`) 노출 |
| **Loading (조회 중)** | `checking...` 또는 버전 텍스트 + 깜빡이는 점 | 팝오버 내 스켈레톤 로더 또는 반투명 오버레이 노출 |

### 4.3. 다중 서비스 레지스트리 구조
```typescript
export interface ServiceEndpointConfig {
  id: string;
  name: string;        // UI 표시 명칭 (예: 'Backend API')
  endpoint: string;    // 버전 API 주소 (예: '/api/v1/version')
  isCritical?: boolean;
}

// 등록된 서비스 목록 (향후 서비스 추가 시 이 배열만 확장)
export const DEFAULT_SERVICE_REGISTRY: ServiceEndpointConfig[] = [
  {
    id: 'backend-core',
    name: 'Backend Core API',
    endpoint: '/api/v1/version',
    isCritical: true,
  },
  // 추후 추가 예시:
  // { id: 'auth-service', name: 'Auth Daemon', endpoint: '/api/v1/auth/version' },
];
```

---

## 5. API 연동 규격 (API Integration)

### 5.1. 프론트엔드 버전 (`GET /version`)
* **응답 규격 (HTTP 200)**:
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

### 5.2. 백엔드 서비스 버전 (`GET /api/v1/version`)
* **응답 규격 (HTTP 200)**:
  ```json
  {
    "name": "my-space-backend",
    "version": "0.0.1",
    "gitBranch": "main",
    "gitCommit": "586e4d3",
    "buildTime": "2026-10-04T08:02:37Z",
    "env": "production"
  }
  ```
* **연결 실패 시 (네트워크 오류 / 5xx / 타임아웃)**:
  - 훅 내부에서 `catch` 처리하여 `{ status: 'error', errorMessage: '서버 연결 실패' }`로 변환

---

## 6. 에러 핸들링 및 복구성 (Fault Tolerance)

1. **독립 실패 격리**:
   - 프론트엔드 정적 번들은 정상이지만 백엔드만 죽은 경우, 프론트엔드 버전 정보는 그대로 정상 표시되고 백엔드 서비스만 `error`로 격리 표시됩니다.
2. **타임아웃 보호**:
   - `AbortController`를 통해 각 서비스 요청에 3초 타임아웃을 적용하여, 특정 서버가 응답하지 않아도 무한 대기하지 않고 3초 후 `error (Timeout)`으로 확정합니다.
3. **사용자 액션 가이드**:
   - `error` 발생 시 팝오버 내에서 재시도할 수 있도록 `다시 시도 (Retry)` 버튼을 제공합니다.

---

## 7. 검토 및 피드백 요청 항목 (Review Questions)

1. 헤더 칩에 표시되는 텍스트:
   - 정상 시: `v0.0.1` (프론트/백엔드 버전이 동일한 경우) 또는 서비스가 여러 개일 때 대표 버전을 표시
   - 미연결 시: `error` 로 표기
2. 팝오버 레이아웃:
   - 상단: Web App (Frontend)
   - 하단: Backend Services (카드 리스트)
   - 최하단: 새로고침 버튼 및 커밋 복사 피드백
