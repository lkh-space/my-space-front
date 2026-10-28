/**
 * Web Speech API (SpeechRecognition / webkitSpeechRecognition) 기반
 * 브라우저 네이티브 실시간 음성 인식 (STT) 헬퍼
 * - 외부 고비용 Whisper/클라우드 STT 백엔드 없이도 모던 브라우저(Chrome, Safari, Edge)의
 *   고품질 음성 인식 엔진을 통해 실시간 한국어/영어 음성 텍스트 변환을 제공합니다.
 * - 발화 중 중간 전사(Interim Transcription)와 확정 전사(Final Transcription)를 실시간 스트리밍합니다.
 */

// 브라우저 윈도우 SpeechRecognition 타입 확장
interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: new () => ISpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
}

export interface SpeechRecognitionOptions {
  lang?: string; // 기본값: 'ko-KR'
  onStart?: () => void;
  onInterimText?: (text: string) => void;
  onFinalText?: (text: string) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}

export interface SpeechRecognitionController {
  stop: () => void;
  abort: () => void;
}

/**
 * 현재 브라우저 환경에서 네이티브 SpeechRecognition(STT)이 지원되는지 검사합니다.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindowSpeechRecognition;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

/**
 * 실시간 브라우저 음성 인식을 시작합니다.
 */
export function startNativeSpeechRecognition(
  options: SpeechRecognitionOptions
): SpeechRecognitionController {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.('현재 브라우저에서 실시간 음성 인식(SpeechRecognition)을 지원하지 않습니다.');
    options.onEnd?.();
    return {
      stop: () => undefined,
      abort: () => undefined,
    };
  }

  const win = window as unknown as IWindowSpeechRecognition;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    options.onError?.('음성 인식 엔진을 초기화할 수 없습니다.');
    options.onEnd?.();
    return {
      stop: () => undefined,
      abort: () => undefined,
    };
  }

  let finalTranscriptAccumulator = '';
  let isStoppedManually = false;

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.lang || 'ko-KR';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    finalTranscriptAccumulator = '';
    console.log('[Web Speech STT] 음성 인식 청취 시작 (마이크 활성화)');
    options.onStart?.();
  };

  recognition.onresult = (event: ISpeechRecognitionEvent) => {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript || '';

      if (result.isFinal) {
        finalTranscriptAccumulator += (finalTranscriptAccumulator ? ' ' : '') + text.trim();
        console.log('[Web Speech STT] 확정 전사:', finalTranscriptAccumulator);
        options.onFinalText?.(finalTranscriptAccumulator);
      } else {
        interim += text;
      }
    }

    if (interim) {
      const fullInterim = finalTranscriptAccumulator
        ? `${finalTranscriptAccumulator} ${interim}`
        : interim;
      console.log('[Web Speech STT] 중간 전사(Interim):', fullInterim);
      options.onInterimText?.(fullInterim);
    }
  };

  recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
    if (isStoppedManually) return;
    console.warn('[Web Speech STT] 오류 이벤트:', event.error);

    // 'no-speech'는 사용자가 발화하지 않은 경우의 정상적 종료이므로 경고 수준 처리
    if (event.error === 'no-speech') {
      options.onInterimText?.('');
      return;
    }

    // 'aborted'는 사용자가 수동 취소한 경우
    if (event.error === 'aborted') {
      return;
    }

    let errorMsg = `음성 인식 오류: ${event.error}`;
    if (event.error === 'not-allowed') {
      errorMsg = '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크를 허용해주세요.';
    } else if (event.error === 'network') {
      errorMsg = '음성 인식 네트워크 연결에 실패했습니다.';
    }

    options.onError?.(errorMsg);
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  try {
    recognition.start();
  } catch (err) {
    options.onError?.(err instanceof Error ? err.message : '음성 인식 시작에 실패했습니다.');
    options.onEnd?.();
  }

  return {
    stop: () => {
      isStoppedManually = true;
      try {
        recognition.stop();
      } catch {
        // 이미 종료된 상태일 경우 무시
      }
    },
    abort: () => {
      isStoppedManually = true;
      try {
        recognition.abort();
      } catch {
        // 이미 종료된 상태일 경우 무시
      }
    },
  };
}
