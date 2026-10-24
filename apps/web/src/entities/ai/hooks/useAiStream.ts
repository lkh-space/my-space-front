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

function formatAudioTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function useAiStream() {
  const [engineState, setEngineState] = useState<AiEngineState>('IDLE');
  const [messages, setMessages] = useState<SpokenTranscriptMessage[]>(INITIAL_TRANSCRIPT_MESSAGES);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
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
  const assistantTextAccumulatorRef = useRef<string>('');
  const messagesRef = useRef<SpokenTranscriptMessage[]>(messages);
  messagesRef.current = messages;

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    releaseMediaStream,
  } = useMediaRecorderPtt();

  const stopAllAudioAndSpeech = useCallback(() => {
    stopSpeaking();
    speechCancelRef.current?.();
    speechCancelRef.current = null;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  }, []);

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setEngineState('IDLE');
    setIsPlayingAudio(false);

    // 백엔드 인터럽트 비동기 통지
    const sessionIdToInterrupt = activeSessionId || currentSessionIdRef.current;
    if (sessionIdToInterrupt) {
      apiInterruptSpeech(sessionIdToInterrupt).catch(() => {
        // 무시
      });
    }
  }, [activeSessionId, cancelRecording, currentSessionIdRef, stopAllAudioAndSpeech]);

  interruptSpeechRef.current = interruptSpeech;

  // 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
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

  // 2. 실제 백엔드 SSE 스트리밍 처리
  const triggerResponseStream = useCallback(
    async (params: { textQuery?: string; audioBlob?: Blob }) => {
      stopAllAudioAndSpeech();
      assistantTextAccumulatorRef.current = '';

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setEngineState('THINKING');

      const userText = params.textQuery || (params.audioBlob ? '음성 분석 중...' : 'System Query');
      const userMsgId = `msg-user-${Date.now()}`;
      const assistantMsgId = `msg-ai-${Date.now() + 1}`;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 사용자 메시지 및 빈 어시스턴트 메시지 즉시 추가
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
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === userMsgId ? { ...msg, content: transcribedText } : msg
                )
              );
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
              abortControllerRef.current = null;
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
              stopSpeaking();
              setEngineState('IDLE');
              setIsPlayingAudio(false);
            },
          },
        });
      } catch (err) {
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
    [audioSettings, ensureSessionId, playBrowserSpeechForMessage, stopAllAudioAndSpeech]
  );

  // 3. PTT 음성 녹음 시작 (Spacebar 누름)
  const startListening = useCallback(() => {
    if (audioSettings.isMicMuted) return;
    if (engineState === 'SPEAKING') {
      interruptSpeech();
    }

    setEngineState('LISTENING');
    startRecording();
  }, [audioSettings.isMicMuted, engineState, interruptSpeech, startRecording]);

  // 4. PTT 음성 녹음 종료 및 백엔드 전송 (Spacebar 뗌)
  const stopListeningAndSend = useCallback(
    (customText?: string) => {
      if (engineState !== 'LISTENING') return;
      setEngineState('THINKING');

      stopRecording((audioBlob) => {
        if (audioBlob) {
          triggerResponseStream({
            textQuery: customText,
            audioBlob,
          });
        } else {
          triggerResponseStream({
            textQuery:
              customText ||
              'Check neural diagnostic stream and analyze local cache telemetry',
          });
        }
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
