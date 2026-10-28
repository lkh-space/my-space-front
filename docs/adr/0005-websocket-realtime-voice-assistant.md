---
status: proposed
date: 2026-10-28
decision-makers: [Keunhyeok Lim, AI Assistant]
---

# 0005. 웹소켓(WebSocket) 기반 실시간 양방향 음성 비서(STT/TTS) 스트리밍 전환

## 맥락과 문제 정의 (Context and Problem Statement)

기존 `my-space`의 J.A.R.V.I.S. AI 워크스페이스는 사용자가 스페이스바를 누르고 있는 동안 마이크 입력을 로컬에서 일괄 녹음한 뒤, 스페이스바를 떼면 `POST /api/v1/ai/voice/stream`으로 단발 업로드하고 그 결과를 HTTP Server-Sent Events(SSE)로 수신하는 구조였습니다.

이 구조는 다음과 같은 명확한 한계를 가집니다:
1. **발화 중 실시간 피드백 부재**: 사용자가 말을 마칠 때까지 백엔드로 오디오가 전달되지 않아, 발화 중 실시간 부분 전사(Interim STT) 결과를 사용자에게 보여줄 수 없습니다.
2. **턴어라운드 지연 시간 (Turn-around Latency)**: 발화가 종료된 후에야 비로소 업로드 및 STT 처리가 시작되므로, 즉각적인 응답을 요구하는 '실시간 음성 비서'의 사용자 경험이 저하됩니다.
3. **단방향 통신의 제약**: 음성 발화 중단(Interrupt / Barge-in)을 위해 별도의 HTTP POST 엔드포인트를 호출해야 하며, 연결 상태 관리가 파편화됩니다.

진정한 실시간 대화형 AI 음성 비서 인터랙션을 구현하기 위해 클라이언트와 서버 간의 음성/텍스트 통신 방식을 어떻게 재설계해야 할까요?

## 의사결정 동기 (Decision Drivers)

* **초저지연 실시간성**: 사용자가 말을 하는 도중에도 음성 청크가 즉시 서버로 스트리밍되어 STT 전사가 실시간으로 진행되어야 함
* **실시간 부분 전사(Interim Transcription) 표시**: 발화 중에도 내가 한 말이 화면에 실시간으로 타이핑되어 음성 인식 상태를 즉각 확신할 수 있어야 함
* **즉각적인 발화 중단 (Barge-in / Interrupt)**: 단일 전이중(Full-duplex) 채널을 통해 언제든 지연 없이 AI의 발화를 끊고 새 입력을 전달할 수 있어야 함
* **최소주의 및 의존성 통제 (YAGNI)**: Socket.io 등의 대규모 외부 라이브러리를 추가하지 않고, 모던 브라우저 네이티브 `WebSocket` API를 활용하여 번들 크기를 보호해야 함

## 검토한 대안들 (Considered Options)

* **대안 1: 브라우저 네이티브 WebSocket 기반 전이중 양방향 스트리밍 (선택안)**
* **대안 2: WebRTC (Web Real-Time Communication) 미디어 스트림**
* **대안 3: 기존 HTTP POST 업로드 + SSE 단방향 스트리밍 유지**

## 결정 내용 및 결과 (Decision Outcome)

선택한 안: **대안 1: 브라우저 네이티브 WebSocket 기반 전이중 양방향 스트리밍**

이유: 추가적인 외부 라이브러리 도입 없이 브라우저 표준 `WebSocket` API를 통해 단일 지속 연결을 유지하고, 음성 녹음 시 `timeslice` 기반 청크 전송과 서버의 실시간 STT 부분 결과 및 TTS 스트리밍을 단일 채널에서 가장 가볍고 빠르게 처리할 수 있기 때문입니다.

---

### 웹소켓 프로토콜 계약 (WebSocket Protocol Contract)

#### 1. 엔드포인트 및 연결
* **URL**: `/api/v1/ai/voice/ws` (Vite Proxy: `ws://localhost:3001/api/v1/ai/voice/ws`)
* **프로토콜**: Binary(오디오 청크 ArrayBuffer) + JSON 텍스트 프레임 복합 지원

#### 2. 클라이언트 ➡️ 서버 메시지 규격
* **`session_init` (JSON)**: 세션 시작 및 음성 설정
  ```json
  {
    "type": "session_init",
    "sessionId": "session-jarvis-1234",
    "voiceSettings": {
      "selectedVoice": "JARVIS British AI",
      "speechSpeed": 1.0
    }
  }
  ```
* **오디오 데이터 (Binary Frame or JSON)**:
  * 마이크 입력 중 일정 간격(예: 100ms~250ms 단위)으로 생성되는 오디오 청크(`ArrayBuffer` 또는 `Blob`) 전송
* **`audio_end` (JSON)**: 사용자가 스페이스바를 뗐을 때 발화 종료 알림
  ```json
  {
    "type": "audio_end"
  }
  ```
* **`text_query` (JSON)**: 우측 패널의 텍스트 후속 질문 전송
  ```json
  {
    "type": "text_query",
    "text": "MongoDB 캐싱 성능에 대해 알려줘"
  }
  ```
* **`interrupt` (JSON)**: 발화 즉시 중단 (스페이스바 다시 누름 또는 수동 중단)
  ```json
  {
    "type": "interrupt"
  }
  ```

#### 3. 서버 ➡️ 클라이언트 메시지 규격
* **`session_ready` (JSON)**: 웹소켓 세션 준비 완료
* **`interim_transcription` (JSON)**: 발화 도중 실시간 중간 전사 텍스트
  ```json
  {
    "type": "interim_transcription",
    "text": "Check local cache..."
  }
  ```
* **`final_transcription` (JSON)**: 확정된 사용자 발화 텍스트
  ```json
  {
    "type": "final_transcription",
    "text": "Check local cache telemetry"
  }
  ```
* **`token` (JSON)**: AI 답변 실시간 텍스트 토큰
  ```json
  {
    "type": "token",
    "delta": "Systems "
  }
  ```
* **`benchmark` (JSON)**: 텔레메트리 벤치마크 지표
* **`context_ref` (JSON)**: RAG 참조 문서 목록
* **`audio_chunk` (Binary or JSON)**: 백엔드 TTS 오디오 스트림 (또는 브라우저 네이티브 TTS 폴백)
* **`done` (JSON)**: 턴 종료
* **`error` (JSON)**: 오류 통지

---

### 기대 효과 및 영향 (Consequences)

* **장점**:
  * 사용자가 말을 마치는 순간 이미 STT의 대부분이 서버에서 처리되어 있어 **응답 체감 대기 시간이 극적으로 단축**됩니다.
  * 발화 중 내가 말한 단어가 화면에 실시간으로 뜨므로 음성 인식 정상 작동 여부를 즉시 확인할 수 있습니다.
  * 단일 웹소켓 채널에서 인터럽트(`interrupt`) 신호를 즉각 보내므로 양방향 반응성이 향상됩니다.
* **단점 (트레이드오프)**:
  * HTTP 단발 요청에 비해 네트워크 연결 유실(재연결) 및 백오프(exponential backoff) 처리가 클라이언트에 요구됩니다.
  * Vite 프록시 및 배포 시 웹소켓 업그레이드 헤더(`Upgrade: websocket`, `Connection: Upgrade`) 설정이 필요합니다.

### 구현 검증 계획 (Confirmation)

1. **단위 테스트**: Mock WebSocket을 활용하여 `useAiWebSocket` 훅의 연결, 오디오 청크 전송, 부분/최종 전사 수신, 인터럽트 흐름을 100% 검증
2. **정적 검증**: `pnpm typecheck`, `pnpm lint`, `pnpm build` 무결성 검증
3. **네트워크 단절 방어**: 웹소켓 오류 또는 미연결 시 사용자에게 즉각 상태를 안내하고 기존 텍스트 입력 및 안전 재연결 폴백 지원

## 대안별 장단점 세부 비교 (Pros and Cons of the Options)

### 대안 1: 브라우저 네이티브 WebSocket (선택안)
* 장점: 번들 크기 0KB 증가(외부 의존성 없음), 텍스트/바이너리 오디오 전송 모두 지원, 서버 구현 용이
* 단점: 재연결 핸들링 로직 구현 필요

### 대안 2: WebRTC
* 장점: 극단적인 초저지연 오디오 스트리밍
* 단점: ICE Candidate 교환, STUN/TURN 서버 등 인프라 비용과 구현 복잡도가 지나치게 높음 (YAGNI 위반)

### 대안 3: 기존 HTTP POST + SSE 유지
* 장점: 이미 구현되어 있어 추가 작업 공수 적음
* 단점: 발화 중 실시간 STT 불가, 턴어라운드 지연 시간 극복 불가

## 참고 및 관련 정보 (More Information)
* [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
* [MDN MediaRecorder.start(timeslice)](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start)
