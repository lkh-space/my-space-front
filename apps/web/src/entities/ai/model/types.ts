export type AiEngineState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export interface AudioSettings {
  isMicMuted: boolean;
  speechSpeed: number; // e.g. 1.0, 1.25, 1.5
  selectedVoice: string; // e.g. 'JARVIS British AI'
  volumeDb: number; // e.g. -14.2
  pitchHz: number; // e.g. 118
  synthBufferMs: number; // e.g. 384
}

export interface BenchmarkMetrics {
  workerName: string; // e.g. 'local-storage-worker'
  opfsStream: string; // e.g. '~1.8ms lat / 0 locks'
  remoteSse: string; // e.g. '~8.4ms lat / 3 retries'
}

export type BenchmarkDelta = BenchmarkMetrics;

export interface ReferencedContext {
  id: string;
  title: string;
  filename: string;
  type?: 'doc' | 'architecture' | 'code';
}

export interface SpokenTranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioDuration?: string; // e.g. '0:38'
  currentTime?: string; // e.g. '0:14'
  timestamp: string; // e.g. '10:42 AM'
  isTtsVerified?: boolean;
  benchmarkDelta?: BenchmarkMetrics;
  contexts?: ReferencedContext[];
  audioUrl?: string;
  latencyMs?: number; // Time To First Token (첫 응답 수신까지 소요 시간, ms)
  totalDurationMs?: number; // 전체 응답 스트리밍 완료까지 소요 시간 (ms)
}

export interface NeuralStreamSession {
  id: string;
  title: string;
  status: 'LIVE' | 'idle' | 'saved';
  createdAt: string;
  updatedAt: string;
}

export interface CreateNeuralSessionDto {
  title?: string;
}

export interface VoiceSettings {
  selectedVoice?: 'JARVIS British AI' | 'JARVIS Fast Neural' | 'JARVIS Deep Resonant' | string;
  speechSpeed?: number;
  enableTelemetry?: boolean;
}

export interface StreamEventHandlers {
  onTranscription?: (text: string) => void;
  onBenchmark?: (benchmark: BenchmarkMetrics) => void;
  onContextRef?: (contexts: ReferencedContext[]) => void;
  onToken?: (delta: string) => void;
  onAudioComplete?: (audio: { audioUrl: string; duration: string }) => void;
  onDone?: (info: { finished: boolean; tokensUsed: number; contextLimit?: number; interrupted?: boolean }) => void;
  onError?: (errorMsg: string) => void;
}

export interface SendVoiceStreamParams {
  sessionId: string;
  textQuery?: string;
  audioBlob?: Blob;
  enableTools?: boolean;
  voiceSettings?: VoiceSettings;
  handlers: StreamEventHandlers;
  signal?: AbortSignal;
}

export interface SendVoiceQueryOptions {
  sessionId?: string;
  text?: string;
  audioBlob?: Blob;
}

export interface InterruptQueryDto {
  sessionId: string;
}

export interface InterruptResponseDto {
  status: string;
  interrupted: boolean;
}

export interface AiSearchQueryDto {
  query: string;
  limit?: number;
  folderId?: string;
  tags?: string[];
}

export interface AiSearchResultItem {
  documentId: string;
  title: string;
  heading?: string;
  content: string;
  score: number;
  tags?: string[];
}

export interface AiSearchResponseDto {
  results: AiSearchResultItem[];
  total: number;
}

// ============================================================================
// WebSocket Realtime Voice / STT Protocol Types (ADR-0005)
// ============================================================================

export type WsClientMessageType =
  | 'session_init'
  | 'audio_chunk'
  | 'audio_end'
  | 'text_query'
  | 'interrupt';

export interface WsSessionInitMessage {
  type: 'session_init';
  sessionId: string;
  voiceSettings?: VoiceSettings;
}

export interface WsAudioEndMessage {
  type: 'audio_end';
  transcribedText?: string;
}

export interface WsTextQueryMessage {
  type: 'text_query';
  text: string;
}

export interface WsInterruptMessage {
  type: 'interrupt';
}

export type WsClientMessage =
  | WsSessionInitMessage
  | WsAudioEndMessage
  | WsTextQueryMessage
  | WsInterruptMessage;

export type WsServerMessageType =
  | 'session_ready'
  | 'interim_transcription'
  | 'final_transcription'
  | 'token'
  | 'benchmark'
  | 'context_ref'
  | 'audio_chunk'
  | 'done'
  | 'error';

export interface WsTranscriptionEvent {
  type: 'interim_transcription' | 'final_transcription';
  text: string;
  isFinal?: boolean;
}

export interface WsTokenEvent {
  type: 'token';
  delta: string;
}

export interface WsBenchmarkEvent extends BenchmarkMetrics {
  type: 'benchmark';
}

export interface WsContextRefEvent {
  type: 'context_ref';
  contexts: ReferencedContext[];
}

export interface WsDoneEvent {
  type: 'done';
  finished: boolean;
  tokensUsed?: number;
}

export interface WsErrorEvent {
  type: 'error';
  error: string;
}

export type WsServerMessage =
  | { type: 'session_ready' }
  | WsTranscriptionEvent
  | WsTokenEvent
  | WsBenchmarkEvent
  | WsContextRefEvent
  | WsDoneEvent
  | WsErrorEvent;

