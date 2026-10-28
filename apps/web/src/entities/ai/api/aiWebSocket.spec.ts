import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiVoiceWebSocketClient } from './aiWebSocket';

describe('AiVoiceWebSocketClient', () => {
  let mockWebSocketInstances: MockWebSocket[] = [];

  class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    url: string;
    readyState = 0; // CONNECTING
    binaryType = 'blob';
    onopen: (() => void) | null = null;
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    onerror: ((ev: unknown) => void) | null = null;
    onclose: (() => void) | null = null;
    send = vi.fn();
    close = vi.fn(() => {
      this.readyState = 3; // CLOSED
      this.onclose?.();
    });

    constructor(url: string) {
      this.url = url;
      mockWebSocketInstances.push(this);
    }
  }

  beforeEach(() => {
    mockWebSocketInstances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('connect() 호출 시 WebSocket 인스턴스가 생성되고 상태 변경이 통지되어야 한다', () => {
    const onStatusChange = vi.fn();
    const client = new AiVoiceWebSocketClient('ws://localhost:4200/api/v1/ai/voice/ws', {
      onStatusChange,
    });

    client.connect();

    expect(mockWebSocketInstances.length).toBe(1);
    expect(onStatusChange).toHaveBeenCalledWith('CONNECTING');

    const ws = mockWebSocketInstances[0];
    ws.readyState = WebSocket.OPEN;
    ws.onopen?.();

    expect(onStatusChange).toHaveBeenCalledWith('OPEN');
    expect(client.getStatus()).toBe('OPEN');
  });

  it('sendSessionInit, sendAudioEnd, sendTextQuery, sendInterrupt가 JSON 메시지를 올바르게 전송해야 한다', () => {
    const client = new AiVoiceWebSocketClient('ws://localhost:4200/api/v1/ai/voice/ws');
    client.connect();
    const ws = mockWebSocketInstances[0];
    ws.readyState = WebSocket.OPEN;

    client.sendSessionInit('sess-123', { selectedVoice: 'JARVIS British AI' });
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'session_init',
        sessionId: 'sess-123',
        voiceSettings: { selectedVoice: 'JARVIS British AI' },
      })
    );

    client.sendAudioEnd('전사된 문장');
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'audio_end',
        transcribedText: '전사된 문장',
      })
    );

    client.sendTextQuery('텍스트 질문');
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'text_query',
        text: '텍스트 질문',
      })
    );

    client.sendInterrupt();
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'interrupt',
      })
    );
  });

  it('수신 메시지(interim_transcription, token, done) 파싱 및 콜백 방출이 정상 동작해야 한다', () => {
    const onTranscription = vi.fn();
    const onToken = vi.fn();
    const onDone = vi.fn();

    const client = new AiVoiceWebSocketClient('ws://localhost:4200/api/v1/ai/voice/ws', {
      onTranscription,
      onToken,
      onDone,
    });
    client.connect();
    const ws = mockWebSocketInstances[0];
    ws.readyState = WebSocket.OPEN;

    // 1. 중간 전사
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'interim_transcription',
        text: '안녕하세요',
      }),
    });
    expect(onTranscription).toHaveBeenCalledWith({
      type: 'interim_transcription',
      text: '안녕하세요',
    });

    // 2. 토큰 수신
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'token',
        delta: '반갑습니다.',
      }),
    });
    expect(onToken).toHaveBeenCalledWith('반갑습니다.');

    // 3. 완료
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'done',
        finished: true,
      }),
    });
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('disconnect() 호출 시 정상적으로 웹소켓이 종료되어야 한다', () => {
    const onStatusChange = vi.fn();
    const client = new AiVoiceWebSocketClient('ws://localhost:4200/api/v1/ai/voice/ws', {
      onStatusChange,
    });
    client.connect();
    const ws = mockWebSocketInstances[0];
    ws.readyState = WebSocket.OPEN;

    client.disconnect();
    expect(ws.close).toHaveBeenCalledTimes(1);
    expect(client.getStatus()).toBe('CLOSED');
  });
});
