import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAiStream } from './useAiStream';

function createMockSseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('useAiStream Hook', () => {
  let mockSpeak: ReturnType<typeof vi.fn>;
  let mockCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockSpeak = vi.fn();
    mockCancel = vi.fn();

    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        pause: vi.fn(),
        resume: vi.fn(),
        getVoices: vi.fn().mockReturnValue([
          { name: 'Yuna (Korean)', lang: 'ko-KR' },
          { name: 'Daniel (British)', lang: 'en-GB' },
        ]),
      },
    });

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
    vi.restoreAllMocks();
  });

  async function renderAiStreamHook() {
    let hookResult!: ReturnType<typeof renderHook<ReturnType<typeof useAiStream>, unknown>>;
    await act(async () => {
      hookResult = renderHook(() => useAiStream());
    });
    return hookResult;
  }

  it('초기 상태가 정상적으로 설정되어야 한다', async () => {
    const { result } = await renderAiStreamHook();

    expect(result.current.engineState).toBe('IDLE');
    expect(result.current.messages).toEqual([]);
    expect(result.current.audioSettings.isMicMuted).toBe(false);
    expect(result.current.audioSettings.speechSpeed).toBe(1.0);
  });

  it('toggleMicMute 호출 시 마이크 음소거 상태가 토글되어야 한다', async () => {
    const { result } = await renderAiStreamHook();

    act(() => {
      result.current.toggleMicMute();
    });
    expect(result.current.audioSettings.isMicMuted).toBe(true);

    act(() => {
      result.current.toggleMicMute();
    });
    expect(result.current.audioSettings.isMicMuted).toBe(false);
  });

  it('setSpeechSpeed 및 setSelectedVoice 호출 시 설정이 반영되어야 한다', async () => {
    const { result } = await renderAiStreamHook();

    act(() => {
      result.current.setSpeechSpeed(1.25);
      result.current.setSelectedVoice('JARVIS Deep Resonant');
    });

    expect(result.current.audioSettings.speechSpeed).toBe(1.25);
    expect(result.current.audioSettings.selectedVoice).toBe('JARVIS Deep Resonant');
  });

  it('startListening 호출 시 engineState가 LISTENING으로 전환되어야 한다', async () => {
    const { result } = await renderAiStreamHook();

    act(() => {
      result.current.startListening();
    });

    expect(result.current.engineState).toBe('LISTENING');
  });

  it('마이크가 음소거 상태이면 startListening을 호출해도 IDLE을 유지해야 한다', async () => {
    const { result } = await renderAiStreamHook();

    act(() => {
      result.current.toggleMicMute();
    });
    expect(result.current.audioSettings.isMicMuted).toBe(true);

    act(() => {
      result.current.startListening();
    });
    expect(result.current.engineState).toBe('IDLE');
  });

  it('stopListeningAndSend 호출 시 SSE 스트림을 수신하고 토큰과 텔레메트리가 반영되어야 한다', async () => {
    const mockSseChunks = [
      'event: transcription\ndata: {"text":"OPFS 구조 분석해줘"}\n\n',
      'event: benchmark\ndata: {"workerName":"local-storage-worker","opfsStream":"~1.8ms","remoteSse":"~8.4ms"}\n\n',
      'event: token\ndata: {"delta":"알겠습니다, "}\n\n',
      'event: token\ndata: {"delta":"분석을 시작합니다."}\n\n',
      'event: done\ndata: {"finished":true,"tokensUsed":42}\n\n',
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/v1/ai/voice/stream')) {
        return createMockSseResponse(mockSseChunks);
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const { result } = await renderAiStreamHook();

    act(() => {
      result.current.startListening();
    });
    expect(result.current.engineState).toBe('LISTENING');

    await act(async () => {
      result.current.stopListeningAndSend('OPFS 구조 분석해줘');
    });

    // 스트림 수신 완료 후 Web Speech 발화 시작으로 SPEAKING 상태 유지
    expect(result.current.engineState).toBe('SPEAKING');

    // 음성 발화 종료(onend) 시 IDLE 복귀
    act(() => {
      const lastUtterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
      lastUtterance.onend?.();
    });
    expect(result.current.engineState).toBe('IDLE');

    // 사용자 메시지가 전사된 텍스트로 반영되었는지 확인
    const userMsg = result.current.messages.find((m) => m.role === 'user');
    expect(userMsg?.content).toBe('OPFS 구조 분석해줘');

    // 어시스턴트 메시지가 토큰 누적 및 벤치마크 데이터를 포함하는지 확인
    const assistantMsg = result.current.messages.find(
      (m) => m.role === 'assistant' && m.content.includes('알겠습니다')
    );
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg?.content).toBe('알겠습니다, 분석을 시작합니다.');
    expect(assistantMsg?.benchmarkDelta?.workerName).toBe('local-storage-worker');
  });

  it('interruptSpeech 호출 시 진행 중인 스트림이 즉시 취소되고 IDLE로 돌아와야 한다', async () => {
    let cancelCalled = false;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/v1/ai/chat/interrupt')) {
        cancelCalled = true;
        return new Response(JSON.stringify({ status: 'ok', interrupted: true }), { status: 200 });
      }
      if (url.includes('/api/v1/ai/voice/stream')) {
        // 무한 대기 스트림 시뮬레이션
        return new Response(new ReadableStream(), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const { result } = await renderAiStreamHook();

    act(() => {
      result.current.startListening();
    });
    await act(async () => {
      result.current.stopListeningAndSend('Interrupt test');
    });
    expect(result.current.engineState).toBe('THINKING');

    await act(async () => {
      result.current.interruptSpeech();
    });

    expect(result.current.engineState).toBe('IDLE');
    expect(result.current.isPlayingAudio).toBe(false);
    expect(cancelCalled).toBe(true);
  });

  it('clearMessages 및 createNewSession이 정상 동작해야 한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/v1/ai/sessions')) {
        return new Response(
          JSON.stringify({
            id: 'session-new-999',
            title: 'New Neural Session',
            status: 'LIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
          { status: 201 }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const { result } = await renderAiStreamHook();

    act(() => {
      result.current.clearMessages();
    });
    expect(result.current.messages).toEqual([]);

    await act(async () => {
      await result.current.createNewSession();
    });

    expect(result.current.sessions.length).toBeGreaterThanOrEqual(1);
    expect(result.current.activeSessionId).toBe('session-new-999');
  });

  it('응답 스트림 수신 완료 시 Web Speech API가 자동으로 트리거되어야 한다', async () => {
    const mockSseChunks = [
      'event: token\ndata: {"delta":"네, 진단을 완료했습니다."}\n\n',
      'event: done\ndata: {"finished":true}\n\n',
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/v1/ai/voice/stream')) {
        return createMockSseResponse(mockSseChunks);
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const { result } = await renderAiStreamHook();

    await act(async () => {
      result.current.sendFollowUpText('시스템 진단해줘');
    });

    // Web Speech API speak 호출 확인
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const spokenUtterance = mockSpeak.mock.calls[0][0];
    expect(spokenUtterance.text).toBe('네, 진단을 완료했습니다.');
  });

  describe('에러 복구 및 예외 처리 (P1)', () => {
    it('백엔드 통신 실패 시 오류 안내 메시지를 생성하고 IDLE 상태로 안전하게 복구되어야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/api/v1/ai/voice/stream')) {
          return new Response(JSON.stringify({ error: 'Gateway Timeout' }), { status: 504 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const { result } = await renderAiStreamHook();

      await act(async () => {
        result.current.sendFollowUpText('장애 발생 테스트');
      });

      // 에러 발생 후 IDLE 상태 복구 확인
      expect(result.current.engineState).toBe('IDLE');
      expect(result.current.isPlayingAudio).toBe(false);

      // 시스템 알림 메시지 확인
      const errorMsg = result.current.messages.find(
        (m) => m.role === 'assistant' && m.content.includes('[J.A.R.V.I.S. 시스템 알림] 백엔드 응답에 실패했습니다')
      );
      expect(errorMsg).toBeDefined();
    });

    it('SSE 스트림 도중 onError 이벤트 수신 시 음성 발화를 멈추고 IDLE 상태로 복구되어야 한다', async () => {
      const mockErrorSseChunks = [
        'event: token\ndata: {"delta":"처리 중..."}\n\n',
        'event: error\ndata: {"message":"Rate limit exceeded"}\n\n',
      ];

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/api/v1/ai/voice/stream')) {
          return createMockSseResponse(mockErrorSseChunks);
        }
        return new Response(JSON.stringify([]), { status: 200 });
      });

      const { result } = await renderAiStreamHook();

      await act(async () => {
        result.current.sendFollowUpText('Rate limit test');
      });

      expect(result.current.engineState).toBe('IDLE');
      expect(result.current.isPlayingAudio).toBe(false);
    });
  });
});
