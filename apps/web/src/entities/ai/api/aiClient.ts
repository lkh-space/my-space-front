import {
  AiSearchQueryDto,
  AiSearchResponseDto,
  InterruptResponseDto,
  NeuralStreamSession,
  SendVoiceStreamParams,
  SpokenTranscriptMessage,
  StreamEventHandlers,
} from '../model/types';
import { getJson, postJson } from '../../../shared/api/client';

export const INITIAL_NEURAL_SESSIONS: NeuralStreamSession[] = [];

export const INITIAL_TRANSCRIPT_MESSAGES: SpokenTranscriptMessage[] = [];

/**
 * 신경망 스트림 세션 목록 조회 (GET /api/v1/ai/sessions)
 */
export async function fetchNeuralSessions(): Promise<NeuralStreamSession[]> {
  try {
    const data = await getJson<NeuralStreamSession[]>('/api/v1/ai/sessions');
    return Array.isArray(data) ? data : [];
  } catch {
    // 오프라인 / 개발 환경 안전 폴백
    return [];
  }
}

/**
 * 신규 신경망 세션 생성 (POST /api/v1/ai/sessions)
 */
export async function createNeuralSession(title?: string): Promise<NeuralStreamSession> {
  try {
    return await postJson<NeuralStreamSession>('/api/v1/ai/sessions', { title });
  } catch {
    // 오프라인 / 실패 시 로컬 임시 세션 폴백
    const fallbackId = `session-jarvis-${Date.now()}`;
    return {
      id: fallbackId,
      title: title || 'Neural Stream Diagnostic Session',
      status: 'LIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

function processSseBlock(block: string, handlers: StreamEventHandlers): 'done' | 'error' | 'continue' {
  if (!block.trim()) return 'continue';

  const lines = block.split('\n');
  let eventType = '';
  let dataStr = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      eventType = line.replace('event: ', '').trim();
    } else if (line.startsWith('data: ')) {
      dataStr = line.replace('data: ', '').trim();
    }
  }

  if (!dataStr) return 'continue';

  try {
    const payload = JSON.parse(dataStr);

    switch (eventType) {
      case 'transcription':
        handlers.onTranscription?.(payload.text);
        return 'continue';
      case 'benchmark':
        handlers.onBenchmark?.(payload);
        return 'continue';
      case 'context_ref':
        handlers.onContextRef?.(payload.contexts || []);
        return 'continue';
      case 'token':
        handlers.onToken?.(payload.delta);
        return 'continue';
      case 'audio_complete':
        handlers.onAudioComplete?.(payload);
        return 'continue';
      case 'done':
        handlers.onDone?.(payload);
        return 'done';
      case 'error':
        handlers.onError?.(payload.error || payload.message || '알 수 없는 스트리밍 에러가 발생했습니다.');
        return 'error';
      default:
        return 'continue';
    }
  } catch (err) {
    console.warn('[SSE 파싱 경고]', err, dataStr);
    return 'continue';
  }
}

/**
 * PTT 음성/텍스트 멀티모달 실시간 SSE 스트리밍 (POST /api/v1/ai/voice/stream)
 */
export async function streamJarvisVoice(params: SendVoiceStreamParams): Promise<void> {
  const { sessionId, textQuery, audioBlob, voiceSettings, enableTools, handlers, signal } = params;

  let body: BodyInit;
  const headers: HeadersInit = {};

  if (audioBlob) {
    // 1. 오디오 녹음 파일 전달 시: multipart/form-data 전송
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('audio', audioBlob, 'ptt-recording.webm');
    if (textQuery) formData.append('textQuery', textQuery);
    if (enableTools !== undefined) formData.append('enableTools', String(enableTools));
    if (voiceSettings) formData.append('voiceSettings', JSON.stringify(voiceSettings));
    body = formData;
  } else {
    // 2. 순수 텍스트 질의 전달 시: application/json 전송
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      sessionId,
      textQuery: textQuery || '',
      enableTools: enableTools ?? true,
      voiceSettings,
    });
  }

  const response = await fetch('/api/v1/ai/voice/stream', {
    method: 'POST',
    credentials: 'same-origin',
    headers,
    body,
    signal,
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => '');
    const errMsg = `[J.A.R.V.I.S. 스트림 실패] HTTP ${response.status}: ${errorText || response.statusText}`;
    handlers.onError?.(errMsg);
    throw new Error(errMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let hasTerminated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const status = processSseBlock(block, handlers);
      if (status === 'done') {
        hasTerminated = true;
        return;
      }
      if (status === 'error') {
        hasTerminated = true;
      }
    }
  }

  // 잔여 버퍼가 남아 있는 경우 마지막 프레임 처리
  if (buffer.trim()) {
    const status = processSseBlock(buffer, handlers);
    if (status === 'done' || status === 'error') {
      hasTerminated = true;
    }
  }

  // 스트림이 명시적 done/error 이벤트 없이 닫힌 경우 안전하게 완료 콜백 호출 (상태 고착 방지)
  if (!hasTerminated && !signal?.aborted) {
    handlers.onDone?.({ finished: true, tokensUsed: 0 });
  }
}

/**
 * AI 발화 및 LLM/TTS 추론 즉시 중단 (POST /api/v1/ai/chat/interrupt)
 */
export async function interruptSpeech(sessionId: string): Promise<boolean> {
  try {
    const result = await postJson<InterruptResponseDto>('/api/v1/ai/chat/interrupt', {
      sessionId,
    });
    return Boolean(result?.interrupted);
  } catch {
    return false;
  }
}

/**
 * Qdrant 기반 마크다운 문서 시맨틱 검색 (POST /api/v1/ai/search)
 */
export async function searchAiDocuments(dto: AiSearchQueryDto): Promise<AiSearchResponseDto> {
  return postJson<AiSearchResponseDto>('/api/v1/ai/search', dto);
}

export interface StreamResponseCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullMessage: SpokenTranscriptMessage) => void;
  onError?: (err: Error) => void;
}

/**
 * 단위 테스트 및 개발 환경용 모의 스트리밍 시뮬레이터 (Fallback)
 */
export function simulateVoiceResponseStream(
  query: string,
  callbacks: StreamResponseCallbacks
): () => void {
  let isCancelled = false;
  const simulatedText = `I have processed your query regarding "${query}". Neural diagnostics are operating within optimal parameters at 98.4% synapse fidelity. All local caching layers are synchronized.`;
  const tokens = simulatedText.split(' ');
  let currentIndex = 0;
  let accumulated = '';

  const interval = setInterval(() => {
    if (isCancelled) {
      clearInterval(interval);
      return;
    }

    if (currentIndex < tokens.length) {
      const nextWord = tokens[currentIndex] + ' ';
      accumulated += nextWord;
      callbacks.onToken?.(nextWord);
      currentIndex++;
    } else {
      clearInterval(interval);
      callbacks.onComplete?.({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: accumulated.trim(),
        audioDuration: '0:24',
        currentTime: '0:00',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTtsVerified: true,
      });
    }
  }, 90);

  return () => {
    isCancelled = true;
    clearInterval(interval);
  };
}
