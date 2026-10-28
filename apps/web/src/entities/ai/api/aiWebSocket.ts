/**
 * J.A.R.V.I.S. Neural Core 실시간 음성/STT 웹소켓 클라이언트 (ADR-0005)
 * - 브라우저 네이티브 WebSocket API를 활용하여 오디오 바이너리 청크 및 JSON 제어 프레임을 양방향 송수신합니다.
 */

import {
  VoiceSettings,
  WsClientMessage,
  WsServerMessage,
  WsTranscriptionEvent,
} from '../model/types';

export type WsConnectionStatus = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export interface AiWebSocketCallbacks {
  onSessionReady?: () => void;
  onTranscription?: (event: WsTranscriptionEvent) => void;
  onToken?: (delta: string) => void;
  onDone?: (finished: boolean) => void;
  onError?: (errorMessage: string) => void;
  onStatusChange?: (status: WsConnectionStatus) => void;
}

export function getVoiceWebSocketUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:4200/api/v1/ai/voice/ws';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/v1/ai/voice/ws`;
}

export class AiVoiceWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: AiWebSocketCallbacks;
  private isExplicitDisconnect = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(url: string = getVoiceWebSocketUrl(), callbacks: AiWebSocketCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: AiWebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getStatus(): WsConnectionStatus {
    if (!this.ws) return 'CLOSED';
    switch (this.ws.readyState) {
      case 0: // WebSocket.CONNECTING
        return 'CONNECTING';
      case 1: // WebSocket.OPEN
        return 'OPEN';
      case 2: // WebSocket.CLOSING
        return 'CLOSING';
      case 3: // WebSocket.CLOSED
      default:
        return 'CLOSED';
    }
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitDisconnect = false;
    this.callbacks.onStatusChange?.('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.callbacks.onStatusChange?.('OPEN');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleIncomingMessage(event.data);
      };

      this.ws.onerror = () => {
        // 백엔드 웹소켓 미구동 시의 에러 안내
        this.callbacks.onError?.('웹소켓 서버 연결에 실패했습니다. (실시간 브라우저 로컬 STT 모드로 동작합니다)');
      };

      this.ws.onclose = () => {
        this.callbacks.onStatusChange?.('CLOSED');
        if (!this.isExplicitDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts += 1;
          setTimeout(() => {
            if (!this.isExplicitDisconnect) {
              this.connect();
            }
          }, 2000 * this.reconnectAttempts);
        }
      };
    } catch (err) {
      this.callbacks.onError?.(
        err instanceof Error ? err.message : 'WebSocket 초기화 실패'
      );
      this.callbacks.onStatusChange?.('CLOSED');
    }
  }

  public disconnect(): void {
    this.isExplicitDisconnect = true;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // 무시
      }
      this.ws = null;
    }
    this.callbacks.onStatusChange?.('CLOSED');
  }

  public sendSessionInit(sessionId: string, voiceSettings?: VoiceSettings): void {
    this.sendMessage({
      type: 'session_init',
      sessionId,
      voiceSettings,
    });
  }

  public sendAudioChunk(chunk: ArrayBuffer | Blob): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    if (chunk instanceof Blob) {
      chunk.arrayBuffer().then((buf) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(buf);
        }
      }).catch(() => undefined);
    } else {
      this.ws.send(chunk);
    }
  }

  public sendAudioEnd(transcribedText?: string): void {
    this.sendMessage({
      type: 'audio_end',
      transcribedText,
    });
  }

  public sendTextQuery(text: string): void {
    this.sendMessage({
      type: 'text_query',
      text,
    });
  }

  public sendInterrupt(): void {
    this.sendMessage({
      type: 'interrupt',
    });
  }

  private sendMessage(message: WsClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (err) {
      console.warn('[AiWebSocket] 메시지 전송 실패:', err);
    }
  }

  private handleIncomingMessage(raw: unknown): void {
    if (typeof raw !== 'string') {
      // 바이너리 데이터(오디오 등)
      return;
    }

    try {
      const parsed = JSON.parse(raw) as WsServerMessage;

      switch (parsed.type) {
        case 'session_ready':
          this.callbacks.onSessionReady?.();
          break;
        case 'interim_transcription':
        case 'final_transcription':
          this.callbacks.onTranscription?.(parsed);
          break;
        case 'token':
          this.callbacks.onToken?.(parsed.delta);
          break;
        case 'done':
          this.callbacks.onDone?.(parsed.finished);
          break;
        case 'error':
          this.callbacks.onError?.(parsed.error);
          break;
        default:
          break;
      }
    } catch {
      // JSON 파싱 무시
    }
  }
}
