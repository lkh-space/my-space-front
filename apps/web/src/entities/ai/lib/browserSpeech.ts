/**
 * Web Speech API (speechSynthesis) 기반 프론트엔드 네이티브 음성 합성(TTS) 헬퍼
 * - 외부 API 키/비용 없이 모던 브라우저 표준 엔진을 통해 고품질 무료 음성 합성 제공
 * - 한국어 및 영어 자동 감지 음성 선택, 실시간 발화 시간 추적, 음속/음높이 제어 지원
 */

export interface SpeechPlayOptions {
  text: string;
  speed?: number; // 0.5 ~ 2.0
  pitch?: number; // 0.5 ~ 1.5
  isMuted?: boolean;
  voiceName?: string;
  onStart?: () => void;
  onTimeUpdate?: (currentSeconds: number) => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

let activeIntervalId: ReturnType<typeof setInterval> | null = null;
let activeSpeechId = 0;

function clearActiveTimer(): void {
  if (activeIntervalId) {
    clearInterval(activeIntervalId);
    activeIntervalId = null;
  }
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

/**
 * 텍스트 길이와 발화 배속에 따른 예상 오디오 재생 시간(초 및 'M:SS' 포맷)을 계산합니다.
 */
export function estimateSpeechDuration(
  text: string,
  speed = 1.0
): { seconds: number; formatted: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { seconds: 0, formatted: '0:00' };
  }

  // 한글/영문 혼합 기준 초당 평균 5.5자 소요 가정
  const effectiveSpeed = Math.min(2.0, Math.max(0.5, speed));
  const charsPerSec = 5.5 * effectiveSpeed;
  const rawSeconds = Math.max(1, Math.round(trimmed.length / charsPerSec));

  const m = Math.floor(rawSeconds / 60);
  const s = Math.floor(rawSeconds % 60);
  const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;

  return { seconds: rawSeconds, formatted };
}

/**
 * 시스템에 설치된 브라우저 음성 목록 중 최적의 음성을 선별합니다.
 */
export function selectBestVoice(
  text: string,
  preferredVoiceName?: string
): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. 사용자가 명시적으로 선택한 음성 이름 매칭 시도
  if (preferredVoiceName) {
    const matched = voices.find((v) =>
      v.name.toLowerCase().includes(preferredVoiceName.toLowerCase())
    );
    if (matched) return matched;
  }

  // 2. 텍스트 내 한글 포함 여부 확인
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);

  if (hasKorean) {
    // macOS / iOS 프리미엄 한국어 (Yuna, Siri, Google 한국어) 우선 매칭
    const premiumKo = voices.find(
      (v) =>
        v.lang.startsWith('ko') &&
        (v.name.includes('Yuna') ||
          v.name.includes('Siri') ||
          v.name.includes('Google') ||
          v.name.includes('Natural'))
    );
    if (premiumKo) return premiumKo;

    const generalKo = voices.find((v) => v.lang.startsWith('ko'));
    if (generalKo) return generalKo;
  }

  // 3. 영문 또는 기본: 영국(British) / 미국(US) 고품질 음성 우선 매칭
  const premiumEn = voices.find(
    (v) =>
      (v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')) &&
      (v.name.includes('Daniel') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Natural'))
  );
  if (premiumEn) return premiumEn;

  const generalEn = voices.find((v) => v.lang.startsWith('en'));
  if (generalEn) return generalEn;

  return voices[0] || null;
}

/**
 * 현재 진행 중인 브라우저 음성 발화를 즉시 정지하고 타이머를 해제합니다.
 */
export function stopSpeaking(): void {
  activeSpeechId += 1;
  clearActiveTimer();
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * 브라우저 발화를 일시 정지합니다.
 */
export function pauseSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.pause();
    } catch {
      // ignore
    }
  }
}

/**
 * 일시 정지된 브라우저 발화를 재개합니다.
 */
export function resumeSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }
}

const noop = () => {
  // no-op for cancelled or unsupported speech
};

/**
 * 브라우저 Web Speech API를 통해 텍스트를 음성으로 재생합니다.
 */
export function speakBrowserSpeech(options: SpeechPlayOptions): { cancel: () => void } {
  stopSpeaking();

  const speechId = ++activeSpeechId;
  const trimmedText = options.text.trim();
  if (!isSpeechSynthesisSupported() || options.isMuted || !trimmedText) {
    options.onEnd?.();
    return { cancel: noop };
  }

  try {
    const utterance = new SpeechSynthesisUtterance(trimmedText);
    const speed = Math.min(2.0, Math.max(0.5, options.speed ?? 1.0));
    utterance.rate = speed;
    utterance.pitch = options.pitch ?? 1.0;

    const chosenVoice = selectBestVoice(trimmedText, options.voiceName);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmedText)) {
      utterance.lang = 'ko-KR';
    } else {
      utterance.lang = 'en-US';
    }

    let currentSec = 0;
    let localIntervalId: ReturnType<typeof setInterval> | null = null;

    const cleanupLocalTimer = () => {
      if (localIntervalId) {
        clearInterval(localIntervalId);
        if (activeIntervalId === localIntervalId) {
          activeIntervalId = null;
        }
        localIntervalId = null;
      }
    };

    utterance.onstart = () => {
      if (speechId !== activeSpeechId) return;
      options.onStart?.();
      currentSec = 0;
      options.onTimeUpdate?.(0);

      cleanupLocalTimer();
      clearActiveTimer();
      localIntervalId = setInterval(() => {
        if (speechId !== activeSpeechId) {
          cleanupLocalTimer();
          return;
        }
        currentSec += 1;
        options.onTimeUpdate?.(currentSec);
      }, 1000);
      activeIntervalId = localIntervalId;
    };

    utterance.onend = () => {
      cleanupLocalTimer();
      if (speechId !== activeSpeechId) return;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      cleanupLocalTimer();
      if (speechId !== activeSpeechId) return;
      // cancel() 호출로 인한 취소는 정상 흐름으로 간주
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        options.onError?.(event);
      }
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);

    return {
      cancel: () => {
        cleanupLocalTimer();
        if (speechId === activeSpeechId) {
          stopSpeaking();
        }
      },
    };
  } catch (err) {
    options.onError?.(err);
    options.onEnd?.();
    return { cancel: noop };
  }
}
