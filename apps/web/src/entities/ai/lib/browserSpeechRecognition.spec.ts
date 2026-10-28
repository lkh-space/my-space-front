import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSpeechRecognitionSupported,
  startNativeSpeechRecognition,
} from './browserSpeechRecognition';

describe('browserSpeechRecognition (Web Speech STT)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  it('SpeechRecognition이 윈도우에 없으면 isSpeechRecognitionSupported는 false를 반환해야 한다', () => {
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it('SpeechRecognition이 존재하면 isSpeechRecognitionSupported는 true를 반환해야 한다', () => {
    (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = class {};
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it('지원되지 않는 브라우저 환경에서 startNativeSpeechRecognition 호출 시 onError 콜백을 방출해야 한다', () => {
    const onError = vi.fn();
    const onEnd = vi.fn();

    const controller = startNativeSpeechRecognition({
      onError,
      onEnd,
    });

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('지원하지 않습니다')
    );
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(typeof controller.stop).toBe('function');
    expect(typeof controller.abort).toBe('function');
  });

  it('음성 인식 시작 후 interim 및 final 텍스트를 정상적으로 콜백으로 전달해야 한다', () => {
    class MockRecognition {
      static lastInstance: MockRecognition | null = null;

      continuous = false;
      interimResults = false;
      lang = '';
      maxAlternatives = 1;
      onstart: (() => void) | null = null;
      onresult: ((ev: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();

      constructor() {
        MockRecognition.lastInstance = this;
      }
    }

    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = MockRecognition;

    const onStart = vi.fn();
    const onInterimText = vi.fn();
    const onFinalText = vi.fn();
    const onEnd = vi.fn();

    const controller = startNativeSpeechRecognition({
      lang: 'ko-KR',
      onStart,
      onInterimText,
      onFinalText,
      onEnd,
    });

    const instance = MockRecognition.lastInstance;
    expect(instance).toBeDefined();

    expect(instance?.start).toHaveBeenCalledTimes(1);

    // 1. onstart 트리거
    instance?.onstart?.();
    expect(onStart).toHaveBeenCalledTimes(1);

    // 2. 중간 인식 결과 (interim)
    instance?.onresult?.({
      resultIndex: 0,
      results: [
        {
          isFinal: false,
          length: 1,
          0: { transcript: '안녕', confidence: 0.9 },
        },
      ],
    });
    expect(onInterimText).toHaveBeenCalledWith('안녕');

    // 3. 확정 결과 (final)
    instance?.onresult?.({
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          length: 1,
          0: { transcript: '안녕하세요 자비스', confidence: 0.98 },
        },
      ],
    });
    expect(onFinalText).toHaveBeenCalledWith('안녕하세요 자비스');

    // 4. stop 호출
    controller.stop();
    expect(instance?.stop).toHaveBeenCalledTimes(1);

    // 5. onend 트리거
    instance?.onend?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
