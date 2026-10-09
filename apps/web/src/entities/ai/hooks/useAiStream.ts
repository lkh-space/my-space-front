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
  simulateVoiceResponseStream,
} from '../api/aiClient';

export function useAiStream() {
  const [engineState, setEngineState] = useState<AiEngineState>('IDLE');
  const [sessions, setSessions] = useState<NeuralStreamSession[]>(INITIAL_NEURAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-jarvis-diag');
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

  const cancelStreamRef = useRef<(() => void) | null>(null);

  // 스트림 중단 정리
  useEffect(() => {
    return () => {
      if (cancelStreamRef.current) {
        cancelStreamRef.current();
      }
    };
  }, []);

  const toggleMicMute = useCallback(() => {
    setAudioSettings((prev) => ({
      ...prev,
      isMicMuted: !prev.isMicMuted,
    }));
  }, []);

  const setSpeechSpeed = useCallback((speed: number) => {
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

  const toggleAudioPlayback = useCallback(() => {
    setIsPlayingAudio((prev) => !prev);
  }, []);

  // 1. 발화 중단 (Interrupt Speech)
  const interruptSpeech = useCallback(() => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }
    setEngineState('IDLE');
    setIsPlayingAudio(false);
  }, []);

  // 2. 음성 응답 스트리밍 트리거
  const triggerResponseStream = useCallback((queryText: string) => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
    }

    setEngineState('THINKING');

    // 0.6초 후 THINKING -> SPEAKING
    const thinkTimeout = setTimeout(() => {
      setEngineState('SPEAKING');
      setIsPlayingAudio(true);

      const tempId = `msg-stream-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: 'assistant',
          content: '',
          audioDuration: '0:24',
          currentTime: '0:01',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTtsVerified: true,
        },
      ]);

      const cancel = simulateVoiceResponseStream(queryText, {
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId ? { ...msg, content: msg.content + token } : msg
            )
          );
        },
        onComplete: (fullMessage) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempId ? fullMessage : msg))
          );
          setEngineState('IDLE');
          setIsPlayingAudio(false);
          cancelStreamRef.current = null;
        },
        onError: () => {
          setEngineState('IDLE');
          setIsPlayingAudio(false);
          cancelStreamRef.current = null;
        },
      });

      cancelStreamRef.current = cancel;
    }, 600);

    return () => clearTimeout(thinkTimeout);
  }, []);

  // 3. PTT 음성 시작 (Spacebar 누름)
  const startListening = useCallback(() => {
    if (audioSettings.isMicMuted) return;
    if (engineState === 'SPEAKING') {
      interruptSpeech();
    }
    setEngineState('LISTENING');
  }, [audioSettings.isMicMuted, engineState, interruptSpeech]);

  // 4. PTT 음성 종료 및 전송 (Spacebar 뗌)
  const stopListeningAndSend = useCallback(
    (customText?: string) => {
      if (engineState !== 'LISTENING') return;

      const userText =
        customText ||
        'Check neural diagnostic stream and analyze local cache telemetry';

      // 유저 메시지 추가
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-user-${Date.now()}`,
          role: 'user',
          content: userText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      triggerResponseStream(userText);
    },
    [engineState, triggerResponseStream]
  );

  // 5. 우측 후속 질문 전송 (Follow-up Text)
  const sendFollowUpText = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-user-${Date.now()}`,
          role: 'user',
          content: trimmed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      triggerResponseStream(trimmed);
    },
    [triggerResponseStream]
  );

  // 6. 대화 초기화
  const clearMessages = useCallback(() => {
    interruptSpeech();
    setMessages([]);
  }, [interruptSpeech]);

  // 7. 새 세션 생성
  const createNewSession = useCallback(() => {
    const newSession: NeuralStreamSession = {
      id: `session-${Date.now()}`,
      title: 'New Neural Session',
      status: 'LIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    clearMessages();
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
