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
