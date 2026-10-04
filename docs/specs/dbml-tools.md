---
status: review
owner: Keunhyeok Lim
last-updated: 2026-10-04
---

# DBML 스키마 변환기 및 ERD 시각화 도구 사양서 (DBML Utility Specification)

## 1. 개요 (Summary)

`my-space` 개인 개발자 워크스페이스에서 데이터베이스 스키마를 신속하게 설계, 시각화 및 변환할 수 있는 **DBML 스키마 변환기(DBML Utility / DBML Editor & ERD Visualizer)**의 사용자 요구사항, 인터랙션 흐름 및 프론트엔드/백엔드 아키텍처를 정의합니다.

사용자는 간결하고 가독성 높은 DBML(Database Markup Language) 문법으로 데이터 모델을 작성하고, 실시간으로 인터랙티브 ERD(Entity-Relationship Diagram)를 시각화하여 테이블 간의 관계(외래키)를 탐색할 수 있습니다. 또한, 작성된 DBML을 PostgreSQL, MySQL, SQLite 등의 표준 SQL DDL로 변환하여 복사/다운로드하거나, 기존 SQL DDL을 입력받아 DBML로 역변환할 수 있습니다.

시각적 스타일링(다크 모드, 징크 기반 토널 레이어, 색상 팔레트, Geist + Pretendard + JetBrains Mono 서체, 점선 그리드 캔버스 등)은 프로젝트 루트의 [`DESIGN.md`](../../DESIGN.md)를 최우선 기준으로 준수합니다.

---

## 2. 목표 및 제외 대상 (Goals / Non-goals)

### 목표 (Goals)
* **실시간 브라우저 DBML 파싱 및 메타데이터 추출**:
  * 사용자가 DBML 코드를 타이핑할 때 네트워크 지연 없이 브라우저 내에서 즉각(10~20ms) 테이블, 컬럼(PK/FK/유니크/기본값), 관계(Ref)를 추출
  * 문법 유효성(`Schema Valid` / 에러 상태), 테이블 개수, 외래키 개수, 파싱 지연시간 실시간 표시
* **인터랙티브 2D ERD 다이어그램 캔버스**:
  * 점선 그리드 배경(`bg-grid-dots`) 위에 테이블 엔티티 카드를 시각화
  * 테이블 간 외래키(Ref) 관계를 베지어 곡선(SVG Curved Paths)과 화살표 마커로 연결
  * 줌 인/아웃(Zoom 50%~150%), 패닝(Drag Pan), 화면 맞춤(Fit View), 중앙 정렬(Recenter) 지원
  * 테이블 검색 필터링(`Search tables...`) 기능 지원
* **양방향 SQL 변환 및 내보내기 (DBML ↔ SQL)**:
  * 백엔드 API 연동을 통해 DBML을 PostgreSQL, MySQL, SQLite, MSSQL DDL로 정밀 변환
  * SQL DDL을 DBML 스키마로 역변환
  * 다이얼렉트 선택 드롭다운(`PostgreSQL`, `MySQL`, `SQLite`, `MSSQL`)
  * 생성된 SQL / DBML 원클릭 클립보드 복사(`Copy Schema`) 및 SQL 파일 다운로드
* **반응형 3단 뷰포트 적응 (DESIGN.md 준수)**:
  * **데스크톱**: 좌측 40% DBML 에디터 : 우측 60% ERD 캔버스의 수평 스플릿 뷰
  * **태블릿**: 좌우 1:1 대칭(50% : 50%) 분할 뷰
  * **모바일**: ERD 캔버스 전용 2차원 패닝 뷰포트 + 우측 상단 플로팅 줌 컨트롤 + 하단 고정 상태 바(`fixed bottom-14`)
* **생산성 유틸리티 도구**:
  * 샘플 DBML 스키마 즉시 로드 (`Load Example DBML`)
  * DBML 코드 자동 포맷팅 (`Format Code`)
  * ERD 다이어그램 SVG 이미지 내보내기 (`Export SVG/PNG`)

### 제외 대상 (Non-goals)
* 라이브 RDBMS 데이터베이스 직접 원격 접속 및 리버스 엔지니어링 (초기 범위 제외)
* 복잡한 수동 드래그 앤 드롭 테이블 위치 자유 영속화 (초기에는 안정적인 자동 계층 배치 알고리즘 적용)
* 마이그레이션 스크립트(Flyway, Liquibase 등) 자동 생성 (단순 DDL 생성에 집중)

---

## 3. 유스케이스 및 사용자 흐름 (Use Cases)

| 유스케이스 ID | 액터 | 목표 | 주요 인터랙션 흐름 |
| :--- | :--- | :--- | :--- |
| `UC-DBML-01` | 개발자 | DBML 코드 실시간 편집 및 ERD 확인 | 1. 에디터에 DBML 작성 → 2. 클라이언트 파서 즉시 구문 분석 → 3. 우측 캔버스에 테이블 카드 및 관계선 렌더링 → 4. 상태바에 유효성 및 개수 표시 |
| `UC-DBML-02` | 개발자 | 샘플 DBML 로드 | 1. 상단 'Load Example DBML' 클릭 → 2. 기본 사용자/프로젝트/태스크 3개 테이블 샘플이 에디터에 채워짐 → 3. ERD 즉시 동기화 |
| `UC-DBML-03` | 개발자 | DBML to SQL 변환 및 복사 | 1. 상단 다이얼렉트 선택(예: PostgreSQL) → 2. 'Execute Task' 또는 'Convert to SQL' 클릭 → 3. 변환된 SQL 모달/패널 확인 → 4. 'Copy Schema'로 클립보드 복사 |
| `UC-DBML-04` | 개발자 | SQL to DBML 역변환 | 1. 에디터 SQL 모드 또는 'Import SQL' 선택 → 2. SQL DDL 붙여넣기 → 3. 'Convert to DBML' 실행 → 4. DBML로 변환되어 에디터에 반영 |
| `UC-DBML-05` | 개발자 | ERD 캔버스 탐색 및 테이블 검색 | 1. 줌 버튼 또는 휠로 확대/축소 → 2. 드래그하여 패닝 → 3. 'Search tables'에 테이블명 입력 시 일치 테이블 하이라이트 |
| `UC-DBML-06` | 개발자 | ERD 다이어그램 이미지 내보내기 | 1. 'Export SVG/PNG' 클릭 → 2. 렌더링된 SVG 다이어그램을 브라우저 다운로드로 수신 |

---

## 4. 화면 및 컴포넌트 요구사항 (UI / Component Specs)

### 4.1. 컴포넌트 계층 구조
```
src/pages/dbml-tools/
├── DbmlToolsPage.tsx              # 최상위 컨테이너 및 상태 오케스트레이션
├── ui/
│   ├── DbmlHeader.tsx             # 상단 브레드크럼, 다이얼렉트 선택, 주요 액션 툴바
│   ├── DbmlSubHeader.tsx          # 뷰 타이틀, Live Synced 상태 뱃지, Docs 링크
│   ├── DbmlEditorPanel.tsx        # 좌측 CodeMirror 코드 에디터, 파일 탭, 유효성 푸터
│   ├── ErdCanvas.tsx              # 우측 인터랙티브 캔버스, 그리드, 줌/패닝 제어
│   ├── TableCard.tsx              # ERD 개별 테이블 엔티티 카드 (컬럼, 타입, 뱃지)
│   ├── SvgRelations.tsx           # 외래키 베지어 곡선 커넥터 및 마커 레이어
│   ├── SqlPreviewModal.tsx        # 변환된 SQL DDL 확인 및 복사 모달
│   └── MobileFloatingControls.tsx # 모바일 전용 플로팅 줌 컨트롤 및 하단 상태 바
├── model/
│   ├── types.ts                   # 스키마, 테이블, 컬럼, 관계 데이터 모델
│   ├── dbmlParser.ts              # 브라우저 전용 경량 DBML 실시간 파서
│   ├── erdLayout.ts               # 테이블 카드 자동 배치 및 커넥터 좌표 계산기
│   └── defaultSchema.ts           # 기본 샘플 스키마
└── api/
    └── dbmlApi.ts                 # 백엔드 DBML 변환 API 연동 클라이언트
```

### 4.2. UI 상태 매트릭스 (UI States)
* **Valid 상태 (정상)**:
  * 에디터 푸터에 초록색 체크 아이콘과 `Schema Valid` 표시
  * 테이블 N개, 외래키 N개 감지 안내
  * 우측 ERD에 모든 테이블 및 관계선 정상 렌더링
* **Invalid 상태 (문법 오류)**:
  * 에디터 푸터에 붉은색 경고 아이콘과 에러 라인/메시지 표시
  * ERD는 마지막으로 유효했던 스냅샷을 유지하거나 경고 배지 노출
* **변환 중 상태 (Loading)**:
  * 'Execute Task' 또는 'Convert to SQL' 클릭 시 스피너 표시 및 버튼 비활성화

---

## 5. 클라이언트 상태 및 데이터 흐름 (State & Data Flow)

```mermaid
graph TD
    User[사용자 입력] --> Editor[CodeMirror 에디터]
    Editor -->|onChange (Debounced 50ms)| LocalParser[경량 dbmlParser]
    LocalParser -->|성공| SchemaModel[Schema AST 모델]
    LocalParser -->|실패| ErrorState[에러 상태 업데이트]
    SchemaModel --> LayoutEngine[erdLayout 배치 엔진]
    LayoutEngine --> Canvas[ErdCanvas & SvgRelations 렌더링]
    
    User -->|변환 요청| BackendApi[POST /api/v1/dbml/export-sql]
    BackendApi -->|성공| SqlModal[SQL 프리뷰 모달 / 클립보드]
```

---

## 6. 백엔드 API 연동 규격 (API Integration)

* **`POST /api/v1/dbml/export-sql`**: DBML 스키마를 지정한 SQL 다이얼렉트 DDL로 변환
* **`POST /api/v1/dbml/import-sql`**: SQL DDL을 DBML로 역변환
* **`POST /api/v1/dbml/format`**: DBML 코드 포맷팅
* *참고*: 백엔드 API가 준비되지 않았거나 오프라인일 때도 프론트엔드 자체 기본 SQL 생성 엔진을 내장하여 클라이언트 단독으로도 기본 PostgreSQL DDL 생성이 가능하도록 Fallback을 구현합니다.

---

## 7. 에러 핸들링 및 사용자 피드백

* **문법 오류**: 에디터 하단 상태바에 `Line X: Expected ...` 형식으로 에러 위치 명시
* **네트워크 오류**: 백엔드 통신 실패 시 클라이언트 폴백 엔진으로 즉각 전환하여 작업 중단 방지
* **복사 완료**: 클립보드 복사 시 토스트 또는 버튼 피드백(`Copied!`) 제공

---

## 8. 오픈 질문 (Open Questions)

* 현재 백엔드 연동 전이라도 프론트엔드 자체 Fallback 변환 엔진으로 기본적인 DDL 복사 및 ERD 시각화가 완벽히 동작하도록 구성합니다.
