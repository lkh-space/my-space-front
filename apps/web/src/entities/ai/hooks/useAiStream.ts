import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AiEngineState,
  AudioSettings,
  SpokenTranscriptMessage,
} from '../model/types';
import {
  INITIAL_TRANSCRIPT_MESSAGES,
  streamJarvisVoice,
  interruptSpeech as apiInterruptSpeech,
} from '../api/aiClient';
import {
  speakBrowserSpeech,
  stopSpeaking,
  estimateSpeechDuration,
} from '../lib/browserSpeech';
import { useNeuralSessions } from './useNeuralSessions';
import { useMediaRecorderPtt } from './useMediaRecorderPtt';
import { AiVoiceWebSocketClient } from '../api/aiWebSocket';

function formatAudioTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function useAiStream() {
  const [engineState, setEngineState] = useState<AiEngineState>('IDLE');
  const [messages, setMessages] = useState<SpokenTranscriptMessage[]>(INITIAL_TRANSCRIPT_MESSAGES);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [processingElapsedMs, setProcessingElapsedMs] = useState<number>(0);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    isMicMuted: false,
    speechSpeed: 1.0,
    selectedVoice: 'JARVIS British AI',
    volumeDb: -14.2,
    pitchHz: 118,
    synthBufferMs: 384,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechCancelRef = useRef<(() => void) | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const assistantTextAccumulatorRef = useRef<string>('');
  const messagesRef = useRef<SpokenTranscriptMessage[]>(messages);
  messagesRef.current = messages;

  // 현재 청취 중인 활성 사용자 메시지 ID
  const activeUserMsgIdRef = useRef<string | null>(null);
  const recognizedTextBufferRef = useRef<string>('');

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    releaseMediaStream,
  } = useMediaRecorderPtt();

  // 웹소켓 클라이언트 인스턴스
  const wsClientRef = useRef<AiVoiceWebSocketClient | null>(null);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const stopAllAudioAndSpeech = useCallback(() => {
    stopSpeaking();
    speechCancelRef.current?.();
    speechCancelRef.current = null;
    stopElapsedTimer();
    setProcessingElapsedMs(0);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  }, [stopElapsedTimer]);

  // 1. 발화 즉시 중단 (Interrupt Speech)
  const interruptSpeechRef = useRef<() => void>(() => undefined);

  const handleSessionReset = useCallback(() => {
    interruptSpeechRef.current();
    setMessages([]);
  }, []);

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    currentSessionIdRef,
    ensureSessionId,
    createNewSession,
  } = useNeuralSessions(handleSessionReset);

  const interruptSpeech = useCallback(() => {
    cancelRecording();
    stopAllAudioAndSpeech();

    // 웹소켓 인터럽트 프레임 발송
    wsClientRef.current?.sendInterrupt();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setEngineState('IDLE');
    setIsPlayingAudio(false);

    // 백엔드 인터럽트 비동기 통지 (HTTP 폴백)
    const sessionIdToInterrupt = activeSessionId || currentSessionIdRef.current;
    if (sessionIdToInterrupt) {
      apiInterruptSpeech(sessionIdToInterrupt).catch(() => {
        // 무시
      });
    }
  }, [activeSessionId, cancelRecording, currentSessionIdRef, stopAllAudioAndSpeech]);

  interruptSpeechRef.current = interruptSpeech;

  // 웹소켓 초기화 및 수명주기 관리
  useEffect(() => {
    const wsClient = new AiVoiceWebSocketClient();

    wsClient.setCallbacks({
      onSessionReady: () => {
        // 세션 연결 준비 완료
      },
      onTranscription: (event) => {
        // 웹소켓 서버로부터 실시간 전사 수신 시 UI 반영
        const targetId = activeUserMsgIdRef.current;
        if (targetId && event.text) {
          recognizedTextBufferRef.current = event.text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === targetId ? { ...msg, content: event.text } : msg
            )
          );
        }
      },
      onToken: (delta) => {
        assistantTextAccumulatorRef.current += delta;
      },
      onError: (errMsg) => {
        console.warn('[J.A.R.V.I.S. WS]', errMsg);
      },
    });

    wsClient.connect();
    wsClientRef.current = wsClient;

    return () => {
      wsClient.disconnect();
      wsClientRef.current = null;
      cancelRecording();
      abortControllerRef.current?.abort();
      stopAllAudioAndSpeech();
      releaseMediaStream();
    };
  }, [cancelRecording, releaseMediaStream, stopAllAudioAndSpeech]);

  const toggleMicMute = useCallback(() => {
    const nextMuted = !audioSettings.isMicMuted;
    if (nextMuted) {
      stopSpeaking();
      speechCancelRef.current?.();
      speechCancelRef.current = null;
      setIsPlayingAudio(false);
      setEngineState((state) => (state === 'SPEAKING' ? 'IDLE' : state));
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.muted = nextMuted;
    }
    setAudioSettings((prev) => ({
      ...prev,
      isMicMuted: nextMuted,
    }));
  }, [audioSettings.isMicMuted]);

  const setSpeechSpeed = useCallback((speed: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = speed;
    }
    setAudioSettings((prev) => ({
      ...prev,
      speechSpeed: speed,
    }));
  }, []);

  const setSelectedVoice = useCallback((voice: string) => {
    setAudioSettings((prev) => ({
      ...prev,
      selectedVoice: voice,
    }));
  }, []);

  // 특정 메시지의 텍스트를 Web Speech API로 발화하는 공통 함수
  const playBrowserSpeechForMessage = useCallback(
    (targetMsgId: string, textToSpeak: string) => {
      const trimmed = textToSpeak.trim();
      if (!trimmed || audioSettings.isMicMuted) return;

      stopSpeaking();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const estimated = estimateSpeechDuration(trimmed, audioSettings.speechSpeed);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === targetMsgId
            ? {
                ...m,
                audioDuration: estimated.formatted,
                currentTime: '0:00',
                isTtsVerified: true,
              }
            : m
        )
      );

      const control = speakBrowserSpeech({
        text: trimmed,
        speed: audioSettings.speechSpeed,
        voiceName: audioSettings.selectedVoice,
        isMuted: audioSettings.isMicMuted,
        onStart: () => {
          setIsPlayingAudio(true);
          setEngineState('SPEAKING');
        },
        onTimeUpdate: (sec) => {
          const formatted = formatAudioTime(sec);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === targetMsgId ? { ...m, currentTime: formatted } : m
            )
          );
        },
        onEnd: () => {
          setIsPlayingAudio(false);
          setEngineState('IDLE');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === targetMsgId ? { ...m, currentTime: '0:00' } : m
            )
          );
        },
        onError: () => {
          setIsPlayingAudio(false);
          setEngineState('IDLE');
        },
      });

      speechCancelRef.current = control.cancel;
    },
    [audioSettings]
  );

  const toggleAudioPlayback = useCallback(
    (targetMessageId?: string) => {
      if (isPlayingAudio) {
        stopSpeaking();
        speechCancelRef.current?.();
        speechCancelRef.current = null;
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        setIsPlayingAudio(false);
        setEngineState('IDLE');
        return;
      }

      const currentList = messagesRef.current;
      const target = targetMessageId
        ? currentList.find((m) => m.id === targetMessageId)
        : [...currentList].reverse().find((m) => m.role === 'assistant' && m.content.trim());

      if (target && target.content) {
        playBrowserSpeechForMessage(target.id, target.content);
      }
    },
    [isPlayingAudio, playBrowserSpeechForMessage]
  );

  // 2. 실제 백엔드 스트리밍 처리 (HTTP SSE 또는 텍스트 질의)
  const triggerResponseStream = useCallback(
    async (params: { textQuery?: string; audioBlob?: Blob; existingUserMsgId?: string }) => {
      stopAllAudioAndSpeech();
      stopElapsedTimer();
      assistantTextAccumulatorRef.current = '';
      setProcessingElapsedMs(0);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setEngineState('THINKING');

      const userText = params.textQuery || '음성 질의';
      const userMsgId = params.existingUserMsgId || `msg-user-${Date.now()}`;
      const assistantMsgId = `msg-ai-${Date.now() + 1}`;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // API 호출 시작 시간 및 실시간 경과 타이머
      const requestStartTime = performance.now();
      elapsedTimerRef.current = setInterval(() => {
        setProcessingElapsedMs(Math.round(performance.now() - requestStartTime));
      }, 100);

      // 기존 사용자 메시지가 없다면 추가, 있으면 유지
      if (!params.existingUserMsgId) {
        setMessages((prev) => [
          ...prev,
          {
            id: userMsgId,
            role: 'user',
            content: userText,
            timestamp: nowTime,
          },
          {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: nowTime,
            currentTime: '0:00',
            isTtsVerified: false,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: nowTime,
            currentTime: '0:00',
            isTtsVerified: false,
          },
        ]);
      }

      const targetSessionId = ensureSessionId();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let hasReceivedTokens = false;

      try {
        await streamJarvisVoice({
          sessionId: targetSessionId,
          textQuery: params.textQuery,
          audioBlob: params.audioBlob,
          enableTools: true,
          voiceSettings: {
            selectedVoice: audioSettings.selectedVoice,
            speechSpeed: audioSettings.speechSpeed,
            enableTelemetry: true,
          },
          signal: abortController.signal,
          handlers: {
            onTranscription: (transcribedText) => {
              // 백엔드의 MockSttProvider가 보낸 하드코딩 더미 텍스트는 무시하고,
              // 클라이언트에서 실제 음성 인식을 하지 못했을 때만 백엔드 전사를 적용합니다.
              const isMockText =
                transcribedText === 'Compare local OPFS caching with MongoDB change streams';
              if (transcribedText && !isMockText && !recognizedTextBufferRef.current) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === userMsgId ? { ...msg, content: transcribedText } : msg
                  )
                );
              }
            },
            onBenchmark: (benchmark) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, benchmarkDelta: benchmark } : msg
                )
              );
            },
            onContextRef: (contexts) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, contexts } : msg
                )
              );
            },
            onToken: (delta) => {
              if (!hasReceivedTokens) {
                hasReceivedTokens = true;
                const ttft = Math.round(performance.now() - requestStartTime);
                setLastLatencyMs(ttft);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, latencyMs: ttft } : msg
                  )
                );
                setEngineState('SPEAKING');
              }
              assistantTextAccumulatorRef.current += delta;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + delta }
                    : msg
                )
              );
            },
            onAudioComplete: (audioData) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        audioUrl: audioData.audioUrl,
                        isTtsVerified: true,
                      }
                    : msg
                )
              );
            },
            onDone: () => {
              stopElapsedTimer();
              setProcessingElapsedMs(0);
              abortControllerRef.current = null;
              const totalDuration = Math.round(performance.now() - requestStartTime);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        totalDurationMs: totalDuration,
                        latencyMs: msg.latencyMs ?? totalDuration,
                      }
                    : msg
                )
              );
              const finalText = assistantTextAccumulatorRef.current.trim();
              if (finalText && !audioSettings.isMicMuted) {
                playBrowserSpeechForMessage(assistantMsgId, finalText);
              } else {
                setEngineState('IDLE');
                setIsPlayingAudio(false);
              }
            },
            onError: (errMsg) => {
              console.warn('[J.A.R.V.I.S. SSE 오류]', errMsg);
              stopElapsedTimer();
              setProcessingElapsedMs(0);
              stopSpeaking();
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: `[J.A.R.V.I.S. 시스템 알림] ${errMsg}`,
                      }
                    : msg
                )
              );
              setEngineState('IDLE');
              setIsPlayingAudio(false);
            },
          },
        });
      } catch (err) {
        stopElapsedTimer();
        setProcessingElapsedMs(0);
        if (abortController.signal.aborted) {
          return;
        }
        console.error('[J.A.R.V.I.S. 통신 실패]', err);
        stopSpeaking();
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `[J.A.R.V.I.S. 시스템 알림] 백엔드 응답에 실패했습니다: ${errorMsg}`,
                }
              : msg
          )
        );
        setEngineState('IDLE');
        setIsPlayingAudio(false);
      }
    },
    [
      audioSettings,
      ensureSessionId,
      playBrowserSpeechForMessage,
      stopAllAudioAndSpeech,
      stopElapsedTimer,
    ]
  );

  // 3. PTT 음성 녹음 및 실시간 STT 시작 (Spacebar 누름)
  const startListening = useCallback(() => {
    if (audioSettings.isMicMuted) return;
    if (engineState === 'SPEAKING') {
      interruptSpeech();
    }

    setEngineState('LISTENING');
    recognizedTextBufferRef.current = '';

    // 실시간 사용자 음성 카드 즉시 생성 (발화 중 실시간 전사용)
    const userMsgId = `msg-user-${Date.now()}`;
    activeUserMsgIdRef.current = userMsgId;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: '🎙️ 음성을 듣고 있습니다... (마이크에 말씀해 주세요)',
        timestamp: nowTime,
      },
    ]);

    // 녹음 및 실시간 STT 동시 가동
    startRecording({
      timesliceMs: 150,
      onAudioChunk: (chunk) => {
        // 웹소켓으로 오디오 바이너리 청크 실시간 송신
        wsClientRef.current?.sendAudioChunk(chunk);
      },
      onInterimText: (interimText) => {
        recognizedTextBufferRef.current = interimText;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMsgId ? { ...msg, content: `🎙️ ${interimText}` } : msg
          )
        );
      },
      onFinalText: (finalText) => {
        recognizedTextBufferRef.current = finalText;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMsgId ? { ...msg, content: finalText } : msg
          )
        );
      },
      onError: (err) => {
        console.warn('[PTT 에러]', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMsgId
              ? {
                  ...msg,
                  content: `⚠️ 마이크 인식 안내: ${err}`,
                }
              : msg
          )
        );
      },
    });
  }, [audioSettings.isMicMuted, engineState, interruptSpeech, startRecording]);

  // 4. PTT 음성 녹음 종료 및 STT 최종 확정 (Spacebar 뗌)
  const stopListeningAndSend = useCallback(
    (customText?: string) => {
      if (engineState !== 'LISTENING') return;
      setEngineState('THINKING');

      const userMsgId = activeUserMsgIdRef.current;

      stopRecording(({ recognizedText }) => {
        const finalQuery =
          customText?.trim() ||
          recognizedText?.trim() ||
          recognizedTextBufferRef.current.trim();

        // 웹소켓에 발화 종료 통지
        wsClientRef.current?.sendAudioEnd(finalQuery);

        if (finalQuery) {
          // 사용자 메시지를 최종 인식된 텍스트로 확정
          if (userMsgId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === userMsgId ? { ...msg, content: finalQuery } : msg
              )
            );
          }

          // 백엔드로 전송: 클라이언트에서 실제 인식된 텍스트가 있으므로 textQuery만 전송하여
          // 백엔드의 MockSttProvider('Compare local OPFS...')를 타지 않고 실제 질의로 처리합니다.
          triggerResponseStream({
            textQuery: finalQuery,
            existingUserMsgId: userMsgId || undefined,
          });
        } else {
          // 음성이 감지되지 않은 경우: 안내 메시지 표시 및 상태 복귀
          if (userMsgId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === userMsgId
                  ? {
                      ...msg,
                      content: '⚠️ 음성이 감지되지 않았습니다. (마이크를 켜고 스페이스바를 누른 채 말씀해 주세요)',
                    }
                  : msg
              )
            );
          }
          setEngineState('IDLE');
        }

        activeUserMsgIdRef.current = null;
        recognizedTextBufferRef.current = '';
      });
    },
    [engineState, stopRecording, triggerResponseStream]
  );

  // 5. 우측 후속 질문 전송 (Follow-up Text)
  const sendFollowUpText = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      triggerResponseStream({ textQuery: trimmed });
    },
    [triggerResponseStream]
  );

  // 6. 대화 초기화
  const clearMessages = useCallback(() => {
    interruptSpeech();
    setMessages([]);
  }, [interruptSpeech]);

  return {
    engineState,
    isProcessing: engineState === 'THINKING',
    processingElapsedMs,
    lastLatencyMs,
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    audioSettings,
    isPlayingAudio,
    toggleMicMute,
    setSpeechSpeed,
    setSelectedVoice,
    toggleAudioPlayback,
    interruptSpeech,
    startListening,
    stopListeningAndSend,
    sendFollowUpText,
    clearMessages,
    createNewSession,
  };
}
