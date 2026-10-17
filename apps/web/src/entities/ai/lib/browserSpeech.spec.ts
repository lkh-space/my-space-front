import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSpeechSynthesisSupported,
  estimateSpeechDuration,
  selectBestVoice,
  speakBrowserSpeech,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
} from './browserSpeech';

describe('browserSpeech Utility', () => {
  const originalSpeechSynthesis = window.speechSynthesis;
  const originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

  let mockSpeak: ReturnType<typeof vi.fn>;
  let mockCancel: ReturnType<typeof vi.fn>;
  let mockPause: ReturnType<typeof vi.fn>;
  let mockResume: ReturnType<typeof vi.fn>;
  let mockGetVoices: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    mockSpeak = vi.fn();
    mockCancel = vi.fn();
    mockPause = vi.fn();
    mockResume = vi.fn();
    mockGetVoices = vi.fn().mockReturnValue([
      { name: 'Yuna (Korean)', lang: 'ko-KR' },
      { name: 'Daniel (British)', lang: 'en-GB' },
      { name: 'Samantha (US)', lang: 'en-US' },
    ]);

    // Mock speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        pause: mockPause,
        resume: mockResume,
        getVoices: mockGetVoices,
      },
    });

    // Mock SpeechSynthesisUtterance
    class MockUtterance {
      text: string;
      rate = 1.0;
      pitch = 1.0;
      lang = '';
      voice: unknown = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      writable: true,
      value: MockUtterance,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    stopSpeaking();
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: originalSpeechSynthesis,
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      writable: true,
      value: originalSpeechSynthesisUtterance,
    });
  });

  it('브라우저 지원 여부를 올바르게 감지해야 한다', () => {
    expect(isSpeechSynthesisSupported()).toBe(true);
  });

  it('텍스트 길이에 따라 예상 음성 재생 시간을 정상 계산해야 한다', () => {
    // 55글자 -> 5.5자/초 -> 약 10초 -> '0:10'
    const text55 = '가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차';
    const result = estimateSpeechDuration(text55, 1.0);
    expect(result.seconds).toBeGreaterThanOrEqual(9);
    expect(result.formatted).toMatch(/^0:\d{2}$/);

    // 빈 텍스트
    const emptyResult = estimateSpeechDuration('   ');
    expect(emptyResult.seconds).toBe(0);
    expect(emptyResult.formatted).toBe('0:00');
  });

  it('한국어 텍스트는 ko 음성을, 영어 텍스트는 en 음성을 자동 선별해야 한다', () => {
    const koVoice = selectBestVoice('안녕하세요, 신경망 진단 결과입니다.');
    expect(koVoice?.lang).toBe('ko-KR');

    const enVoice = selectBestVoice('Hello sir, system diagnostics are nominal.');
    expect(enVoice?.lang).toBe('en-GB');
  });

  it('isMuted가 true이면 발화를 시작하지 않고 onEnd를 호출해야 한다', () => {
    const onEnd = vi.fn();
    speakBrowserSpeech({
      text: '테스트 발화',
      isMuted: true,
      onEnd,
    });

    expect(mockSpeak).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('speakBrowserSpeech 실행 시 onstart 및 시간 경과 타이머가 정상 동작해야 한다', () => {
    const onStart = vi.fn();
    const onTimeUpdate = vi.fn();
    const onEnd = vi.fn();

    speakBrowserSpeech({
      text: 'J.A.R.V.I.S. 시스템 상태를 브리핑합니다.',
      speed: 1.0,
      onStart,
      onTimeUpdate,
      onEnd,
    });

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const utterance = mockSpeak.mock.calls[0][0];

    // utterance.onstart 수동 트리거
    utterance.onstart?.();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onTimeUpdate).toHaveBeenCalledWith(0);

    // 2초 경과
    vi.advanceTimersByTime(2000);
    expect(onTimeUpdate).toHaveBeenCalledWith(2);

    // utterance.onend 트리거
    utterance.onend?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('pauseSpeaking 및 resumeSpeaking 호출 시 speechSynthesis 메서드가 실행되어야 한다', () => {
    pauseSpeaking();
    expect(mockPause).toHaveBeenCalledTimes(1);

    resumeSpeaking();
    expect(mockResume).toHaveBeenCalledTimes(1);

    stopSpeaking();
    expect(mockCancel).toHaveBeenCalled();
  });
});
