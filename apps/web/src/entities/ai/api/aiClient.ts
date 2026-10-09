import { NeuralStreamSession, SpokenTranscriptMessage } from '../model/types';

export const INITIAL_NEURAL_SESSIONS: NeuralStreamSession[] = [
  {
    id: 'session-jarvis-diag',
    title: 'JARVIS System Diagnostics',
    status: 'LIVE',
    createdAt: '2026-10-09T10:00:00Z',
    updatedAt: '2026-10-09T10:42:00Z',
  },
  {
    id: 'session-ultron-sync',
    title: 'Ultron Neural Sync',
    status: 'idle',
    createdAt: '2026-10-08T18:30:00Z',
    updatedAt: '2026-10-08T19:10:00Z',
  },
  {
    id: 'session-mongo-opfs',
    title: 'MongoDB Streams vs OPFS',
    status: 'saved',
    createdAt: '2026-10-07T14:15:00Z',
    updatedAt: '2026-10-07T15:00:00Z',
  },
  {
    id: 'session-arch-analysis',
    title: 'Architecture Analysis',
    status: 'saved',
    createdAt: '2026-10-06T09:00:00Z',
    updatedAt: '2026-10-06T09:45:00Z',
  },
];

export const INITIAL_TRANSCRIPT_MESSAGES: SpokenTranscriptMessage[] = [
  {
    id: 'msg-jarvis-1',
    role: 'assistant',
    content:
      'Welcome back, sir. I have cross-referenced your local specification against the Origin Private File System (OPFS) edge streaming architecture.\n\nOur synthetic benchmarks indicate that local OPFS write locks yield a 4.2x reduction in thread stalls compared to polling remote change streams across high-latency webhooks. I have prepared the schema migration diagram in your DBML workspace.',
    audioDuration: '0:38',
    currentTime: '0:14',
    timestamp: '10:42 AM',
    isTtsVerified: true,
    benchmarkDelta: {
      workerName: 'local-storage-worker',
      opfsStream: '~1.8ms lat / 0 locks',
      remoteSse: '~8.4ms lat / 3 retries',
    },
    contexts: [
      {
        id: 'ctx-1',
        title: 'mongodb-streaming.md',
        filename: 'mongodb-streaming.md',
        type: 'doc',
      },
      {
        id: 'ctx-2',
        title: 'architecture-notes.md',
        filename: 'architecture-notes.md',
        type: 'architecture',
      },
    ],
  },
];

export async function fetchNeuralSessions(): Promise<NeuralStreamSession[]> {
  try {
    const res = await fetch('/api/v1/ai/sessions');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : INITIAL_NEURAL_SESSIONS;
  } catch {
    // 오프라인 / 개발 환경 안전 폴백
    return INITIAL_NEURAL_SESSIONS;
  }
}

export interface StreamResponseCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullMessage: SpokenTranscriptMessage) => void;
  onError?: (err: Error) => void;
}

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
