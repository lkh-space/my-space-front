import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AiEngineState,
  AudioSettings,
  NeuralStreamSession,
  SpokenTranscriptMessage,
} from '../model/types';
import {
  INITIAL_NEURAL_SESSIONS,
  INITIAL_TRANSCRIPT_MESSAGES,
  fetchNeuralSessions,
  createNeuralSession,
  streamJarvisVoice,
  interruptSpeech as apiInterruptSpeech,
} from '../api/aiClient';
import {
  speakBrowserSpeech,
  stopSpeaking,
  estimateSpeechDuration,
} from '../lib/browserSpeech';

function formatAudioTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function useAiStream() {
  const [engineState, setEngineState] = useState<AiEngineState>('IDLE');
  const [sessions, setSessions] = useState<NeuralStreamSession[]>(INITIAL_NEURAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentSessionIdRef = useRef<string>('');
  const speechCancelRef = useRef<(() => void) | null>(null);
  const assistantTextAccumulatorRef = useRef<string>('');
  const isListeningActiveRef = useRef<boolean>(false);

  // 세션 목록 초기 로드 (세션이 비어있는 경우 백엔드에 초기 세션 자동 생성)
  useEffect(() => {
    let isMounted = true;
    fetchNeuralSessions().then(async (fetched) => {
      if (!isMounted) return;
      if (fetched && fetched.length > 0) {
        setSessions(fetched);
        setActiveSessionId((prev) =>
          !fetched.some((s) => s.id === prev) ? fetched[0].id : prev
        );
      } else {
        try {
          const created = await createNeuralSession('Neural Stream Diagnostic Session');
          if (isMounted) {
            setSessions([created]);
            setActiveSessionId(created.id);
          }
        } catch (e) {
          console.warn('초기 세션 생성 실패:', e);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      isListeningActiveRef.current = false;
      abortControllerRef.current?.abort();
      stopSpeaking();
      speechCancelRef.current?.();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMicMute = useCallback(() => {
    setAudioSettings((prev) => {
      const nextMuted = !prev.isMicMuted;
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
      return {
        ...prev,
        isMicMuted: nextMuted,
      };
    });
  }, []);

  const setSpeechSpeed = useCallback((speed: number) => {
    setAudioSettings((prev) => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.playbackRate = speed;
      }
      return {
        ...prev,
        speechSpeed: speed,
      };
    });
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

      setMessages((prev) => {
        const target = targetMessageId
          ? prev.find((m) => m.id === targetMessageId)
          : [...prev].reverse().find((m) => m.role === 'assistant' && m.content.trim());

        if (target && target.content) {
          setTimeout(() => {
            playBrowserSpeechForMessage(target.id, target.content);
          }, 0);
        }
        return prev;
      });
    },
    [isPlayingAudio, playBrowserSpeechForMessage]
  );

  // 1. 발화 즉시 중단 (Interrupt Speech)
  const interruptSpeech = useCallback(() => {
    isListeningActiveRef.current = false;
    // Web Speech API 정지
    stopSpeaking();
    speechCancelRef.current?.();
    speechCancelRef.current = null;

    // 클라이언트 Abort & 오디오 정지
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
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
  }, [activeSessionId]);

  // 2. 실제 백엔드 SSE 스트리밍 처리
  const triggerResponseStream = useCallback(
    async (params: { textQuery?: string; audioBlob?: Blob }) => {
      // 기존 스트림 및 발화 중단
      stopSpeaking();
      speechCancelRef.current?.();
      speechCancelRef.current = null;
      assistantTextAccumulatorRef.current = '';

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }

      setEngineState('THINKING');

      const userText = params.textQuery || (params.audioBlob ? '음성 분석 중...' : 'System Query');
      const userMsgId = `msg-user-${Date.now()}`;
      const assistantMsgId = `msg-ai-${Date.now() + 1}`;

      // 사용자 메시지 및 빈 어시스턴트 메시지 즉시 추가
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          content: userText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          currentTime: '0:00',
          isTtsVerified: false,
        },
      ]);

      // 세션 ID 즉시 동기 확보 및 등록
      const targetSessionId =
        activeSessionId || currentSessionIdRef.current || `session-jarvis-${Date.now()}`;
      currentSessionIdRef.current = targetSessionId;
      if (!activeSessionId) {
        setActiveSessionId(targetSessionId);
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let hasReceivedTokens = false;

      // 실제 백엔드 스트리밍 시도
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
              // 사용자 발화 텍스트 업데이트
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
              // 백엔드 오디오 메타데이터 기록 (현재 백엔드 0.5초 비프음 대신 브라우저 Web Speech API 우선 발화)
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
                // 브라우저 Web Speech API로 자연스러운 무료 음성 발화 즉시 시작
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
    [activeSessionId, audioSettings, playBrowserSpeechForMessage]
  );

  // 3. PTT 음성 녹음 시작 (Spacebar 누름)
  const startListening = useCallback(() => {
    if (audioSettings.isMicMuted) return;
    if (engineState === 'SPEAKING') {
      interruptSpeech();
    }

    isListeningActiveRef.current = true;
    setEngineState('LISTENING');
    audioChunksRef.current = [];

    // 브라우저 MediaRecorder 초기화 시도
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // 비동기 권한 승인 / 스트림 확보 전 사용자가 이미 스페이스바를 뗐다면 즉시 트랙 종료
          if (!isListeningActiveRef.current) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          mediaStreamRef.current = stream;
          try {
            const mimeType =
              typeof MediaRecorder !== 'undefined' &&
              MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : undefined;
            const recorder = new MediaRecorder(
              stream,
              mimeType ? { mimeType } : undefined
            );
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
          } catch (e) {
            console.warn('MediaRecorder init failed, fallback to audio simulation:', e);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission denied or unavailable:', err);
        });
    }
  }, [audioSettings.isMicMuted, engineState, interruptSpeech]);

  // 4. PTT 음성 녹음 종료 및 백엔드 전송 (Spacebar 뗌)
  const stopListeningAndSend = useCallback(
    (customText?: string) => {
      isListeningActiveRef.current = false;
      if (engineState !== 'LISTENING') return;
      setEngineState('THINKING');

      const recorder = mediaRecorderRef.current;
      const stream = mediaStreamRef.current;

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          const audioBlob =
            audioChunksRef.current.length > 0
              ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
              : undefined;

          triggerResponseStream({
            textQuery: customText,
            audioBlob,
          });

          // 트랙 정리
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
        };
        recorder.stop();
      } else {
        // 마이크 스트림이 없거나 텍스트 전송인 경우
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        triggerResponseStream({
          textQuery:
            customText ||
            'Check neural diagnostic stream and analyze local cache telemetry',
        });
      }
    },
    [engineState, triggerResponseStream]
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

  // 7. 신규 신경망 세션 생성
  const createNewSession = useCallback(async () => {
    try {
      const created = await createNeuralSession('New Neural Session');
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      clearMessages();
    } catch {
      const fallbackId = `session-${Date.now()}`;
      const newSession: NeuralStreamSession = {
        id: fallbackId,
        title: 'New Neural Session',
        status: 'LIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      clearMessages();
    }
  }, [clearMessages]);

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
