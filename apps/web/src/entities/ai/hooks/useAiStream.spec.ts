import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAiStream } from './useAiStream';

describe('useAiStream Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('초기 상태가 정상적으로 설정되어야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    expect(result.current.engineState).toBe('IDLE');
    expect(result.current.activeSessionId).toBe('session-jarvis-diag');
    expect(result.current.sessions.length).toBeGreaterThanOrEqual(4);
    expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    expect(result.current.audioSettings.isMicMuted).toBe(false);
    expect(result.current.audioSettings.speechSpeed).toBe(1.0);
  });

  it('toggleMicMute 호출 시 마이크 음소거 상태가 토글되어야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    act(() => {
      result.current.toggleMicMute();
    });
    expect(result.current.audioSettings.isMicMuted).toBe(true);

    act(() => {
      result.current.toggleMicMute();
    });
    expect(result.current.audioSettings.isMicMuted).toBe(false);
  });

  it('setSpeechSpeed 및 setSelectedVoice 호출 시 설정이 반영되어야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    act(() => {
      result.current.setSpeechSpeed(1.25);
      result.current.setSelectedVoice('JARVIS Deep Voice');
    });

    expect(result.current.audioSettings.speechSpeed).toBe(1.25);
    expect(result.current.audioSettings.selectedVoice).toBe('JARVIS Deep Voice');
  });

  it('startListening 호출 시 engineState가 LISTENING으로 전환되어야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    act(() => {
      result.current.startListening();
    });

    expect(result.current.engineState).toBe('LISTENING');
  });

  it('마이크가 음소거 상태이면 startListening을 호출해도 IDLE을 유지해야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    act(() => {
      result.current.toggleMicMute();
    });
    expect(result.current.audioSettings.isMicMuted).toBe(true);

    act(() => {
      result.current.startListening();
    });
    expect(result.current.engineState).toBe('IDLE');
  });

  it('stopListeningAndSend 호출 시 THINKING 상태를 거쳐 응답 스트림이 완료되어야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    act(() => {
      result.current.startListening();
    });
    expect(result.current.engineState).toBe('LISTENING');

    act(() => {
      result.current.stopListeningAndSend('Test query');
    });
    expect(result.current.engineState).toBe('THINKING');

    // 600ms 경과 후 SPEAKING으로 전환
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(result.current.engineState).toBe('SPEAKING');
    expect(result.current.isPlayingAudio).toBe(true);

    // 스트림 진행
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.engineState).toBe('IDLE');
    expect(result.current.isPlayingAudio).toBe(false);
  });

  it('interruptSpeech 호출 시 진행 중인 스트림이 즉시 취소되고 IDLE로 돌아와야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    act(() => {
      result.current.startListening();
    });
    act(() => {
      result.current.stopListeningAndSend('Interrupt test');
    });
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(result.current.engineState).toBe('SPEAKING');

    act(() => {
      result.current.interruptSpeech();
    });
    expect(result.current.engineState).toBe('IDLE');
    expect(result.current.isPlayingAudio).toBe(false);
  });

  it('clearMessages 및 createNewSession이 정상 동작해야 한다', () => {
    const { result } = renderHook(() => useAiStream());

    act(() => {
      result.current.clearMessages();
    });
    expect(result.current.messages).toEqual([]);

    act(() => {
      result.current.createNewSession();
    });
    expect(result.current.sessions.length).toBe(5);
    expect(result.current.activeSessionId).toMatch(/^session-/);
  });
});
