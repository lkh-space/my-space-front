---
status: draft
owner: Keunhyeok Lim
last-updated: YYYY-MM-DD
---

# {기능/화면 이름} 사양서 (Specification)

## 1. 개요 (Summary)
{1~2개 문장으로 이 기능/화면이 무엇이고 사용자에게 어떤 가치를 제공하는지 기술합니다.}

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 목표 (Goals)
* {구현하고자 하는 핵심 사용자 경험 및 기능 1}
* {구현하고자 하는 핵심 사용자 경험 및 기능 2}

### 제외 대상 (Non-goals)
* {이번 범위에서 의도적으로 제외하는 기능 1}
* {추후 확장 과제로 넘기는 화면이나 복잡한 인터랙션 2}

## 3. 유스케이스 및 사용자 흐름 (Use Cases)

| 유스케이스 ID | 액터 | 목표 | 주요 인터랙션 흐름 |
| :--- | :--- | :--- | :--- |
| `UC-XX01` | 사용자 | {예: 파일 목록 조회} | 1. 화면 진입 → 2. 로딩 표시 → 3. 목록 렌더링 |
| `UC-XX02` | 사용자 | {예: 항목 삭제} | 1. 삭제 버튼 클릭 → 2. 확인 모달 → 3. 요청 및 토스트 알림 |

### 세부 사용자 흐름 (Interaction Details)
1. **{흐름 1 제목}**: {세부 설명}
2. **{흐름 2 제목}**: {세부 설명}

## 4. 화면 및 컴포넌트 요구사항 (UI / Component Specs)

> [!NOTE]
> 디자인 세부 사항(색상, 타이포그래피, 여백 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 준수합니다.

### 4.1. UI 상태 매트릭스 (UI States)

| 상태 | 조건 | 화면 표현 및 동작 |
| :--- | :--- | :--- |
| **초기 로딩 (Loading)** | 데이터 페칭 중 | 스켈레톤 UI 또는 로딩 스피너 표시 |
| **성공 (Success)** | 데이터 페칭 완료 | 데이터 목록/상세 컴포넌트 렌더링 |
| **빈 화면 (Empty)** | 결과 데이터가 0건일 때 | 빈 상태 안내 문구 및 유도 액션 버튼 제공 |
| **에러 (Error)** | 네트워크 오류 또는 5xx 응답 | 오류 안내 메시지 및 '다시 시도' 버튼 표시 |

### 4.2. 주요 컴포넌트 계층 구조
* `ExamplePage`: 최상위 페이지 컴포넌트 (데이터 페칭 및 상태 조율)
  * `ExampleHeader`: 타이틀 및 액션 버튼
  * `ExampleList`: 목록 렌더링 컨테이너
    * `ExampleItem`: 개별 항목 카드
  * `ExampleEmptyView`: 빈 데이터 안내 뷰

## 5. 클라이언트 상태 및 데이터 흐름 (State & Data Flow)

### 5.1. 컴포넌트 로컬 상태
* `isModalOpen: boolean`: 확인 모달 표시 여부
* `selectedId: string | null`: 현재 선택된 항목 ID

### 5.2. 서버/전역 상태 및 데이터 흐름
* **캐싱 정책**: {예: TanStack Query 사용 시 캐시 키 `['examples']`, staleTime 등 기술}
* **데이터 갱신(Mutation) 흐름**: 삭제/생성 성공 시 캐시 무효화(invalidate) 후 목록 자동 재조회

## 6. 백엔드 API 연동 규격 (API Integration)

> 연동 대상 백엔드 저장소: `my-space-backend`

### 6.1. 호출 엔드포인트
* `GET /api/v1/{domain}`: {설명}
* `POST /api/v1/{domain}`: {설명}

### 6.2. 클라이언트 요청/응답 타입 정의

```typescript
// 요청 파라미터 / 바디
export interface ExampleRequest {
  title: string;
}

// 응답 모델
export interface ExampleResponse {
  id: string;
  title: string;
  createdAt: string;
}
```

## 7. 에러 핸들링 및 사용자 피드백 (Error Handling)

| 에러 시나리오 | HTTP 상태 / 조건 | 사용자 피드백 방식 |
| :--- | :--- | :--- |
| 입력값 유효성 실패 | `422 Unprocessable Entity` | 해당 입력 필드 하단에 붉은색 인라인 에러 문구 표시 |
| 인증 만료 | `401 Unauthorized` | 로그인 페이지로 리다이렉트 또는 재로그인 안내 모달 |
| 권한 없음 | `403 Forbidden` | '접근 권한이 없습니다' 경고 토스트 표시 |
| 서버 에러 / 네트워크 단절 | `500` 또는 Network Error | 상단 오류 토스트 및 화면 내 재시도 버튼 노출 |

## 8. 오픈 질문 (Open Questions)

* [ ] {기능/기획 측면에서 논의가 필요한 사항 1}
* [ ] {백엔드 API 규격 확정이 필요한 항목 2}
