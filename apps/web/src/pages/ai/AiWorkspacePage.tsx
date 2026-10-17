import React, { useEffect, useRef } from 'react';
import './ai-workspace-page.css';
import { useAiStream } from '../../entities/ai';
import {
  JarvisHoloCore,
  VoiceVisualizer,
  TacticalAudioBar,
  PttInputBar,
  SpokenMessageCard,
  FollowUpInputBar,
} from '../../features/ai';

export const AiWorkspacePage: React.FC = () => {
  const {
    engineState,
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
  } = useAiStream();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isSpaceKeyDownRef = useRef<boolean>(false);

  // 메시지 업데이트 시 자동 스크롤
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 전역 단축키 (Space PTT & Alt+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 인풋 필드나 텍스트에어리어에 포커스가 있을 때는 단축키 무시
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      // Alt+M : 마이크 음소거 토글
      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) {
        e.preventDefault();
        toggleMicMute();
        return;
      }

      if (isInput) return;

      // Spacebar
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (engineState === 'SPEAKING') {
          interruptSpeech();
          return;
        }

        if (!isSpaceKeyDownRef.current && engineState === 'IDLE') {
          isSpaceKeyDownRef.current = true;
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (isInput) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (isSpaceKeyDownRef.current) {
          isSpaceKeyDownRef.current = false;
          stopListeningAndSend();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    engineState,
    interruptSpeech,
    startListening,
    stopListeningAndSend,
    toggleMicMute,
  ]);

  const handleSaveToMarkdown = (content: string) => {
    try {
      const stored = localStorage.getItem('my-space-docs');
      const docs = stored ? JSON.parse(stored) : [];
      const newDoc = {
        id: `doc-${Date.now()}`,
        title: `JARVIS Spoken Note - ${new Date().toLocaleDateString()}`,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('my-space-docs', JSON.stringify([newDoc, ...docs]));
      alert('마크다운 문서 스튜디오에 성공적으로 저장되었습니다.');
    } catch {
      // storage error fallback
    }
  };

  return (
    <div
      className="ai-workspace-container"
      aria-label="my-space AI Workspace - J.A.R.V.I.S. Neural Core"
    >
      <div className="ai-workspace-grid">
        {/* ======================================================== */}
        {/* 1. LEFT COLUMN: Holographic Neural Stage (7fr)           */}
        {/* ======================================================== */}
        <section
          className="ai-neural-stage-col"
          aria-label="신경망 홀로그래픽 코어 스테이지"
        >
          {/* Stage Header */}
          <header className="stage-header-bar">
            <div className="stage-persona-pill">
              <span className="persona-active-lamp" />
              <span>J.A.R.V.I.S. Core (Active)</span>
            </div>

            <div className="stage-telemetry-strip">
              <span className="telemetry-online-tag">
                <span className="tag-dot" />
                Neural Stream: Online
              </span>
              <span>/</span>
              <span>
                Local Latency: <strong className="text-on-surface">42ms</strong>
              </span>
              <span>/</span>
              <span className="telemetry-tag-synth">Holographic Synthesis</span>
            </div>
          </header>

          {/* Central JARVIS Holographic Core */}
          <JarvisHoloCore engineState={engineState} />

          {/* Bottom Audio Controls & PTT Input */}
          <div className="stage-bottom-controls-wrap">
            <VoiceVisualizer
              engineState={engineState}
              audioSettings={audioSettings}
            />

            <TacticalAudioBar
              audioSettings={audioSettings}
              isSpeaking={engineState === 'SPEAKING'}
              onToggleMicMute={toggleMicMute}
              onInterruptSpeech={interruptSpeech}
              onSpeedChange={setSpeechSpeed}
              onVoiceChange={setSelectedVoice}
            />

            <PttInputBar
              engineState={engineState}
              onStartListening={startListening}
              onStopListeningAndSend={stopListeningAndSend}
              onSendQuery={(query) => sendFollowUpText(query)}
            />
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. RIGHT COLUMN: Spoken Transcript & Telemetry (5fr)     */}
        {/* ======================================================== */}
        <section
          className="ai-transcript-col"
          aria-label="실시간 발화 트랜스크립트 및 텔레메트리"
        >
          {/* Header */}
          <header className="transcript-header-bar">
            <div className="transcript-header-left">
              <span className="online-glow-lamp" />
              <h2 className="transcript-header-title">J.A.R.V.I.S.</h2>
              <span className="model-badge-tag">Opus</span>
            </div>

            <div className="transcript-header-actions">
              <button
                type="button"
                className="header-icon-btn"
                onClick={createNewSession}
                title="새 스레드 시작"
                aria-label="새 스레드 시작"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
              <button
                type="button"
                className="header-icon-btn"
                onClick={clearMessages}
                title="대화 지우기"
                aria-label="대화 지우기"
              >
                <span className="material-symbols-outlined text-[16px]">
                  delete_sweep
                </span>
              </button>
              <button
                type="button"
                className="header-icon-btn"
                title="더보기 옵션"
                aria-label="더보기 옵션"
              >
                <span className="material-symbols-outlined text-[16px]">
                  more_horiz
                </span>
              </button>
            </div>
          </header>

          {/* Scrollable Transcript Area */}
          <div className="transcript-scroll-area" ref={scrollAreaRef}>
            {messages.map((message) => (
              <SpokenMessageCard
                key={message.id}
                message={message}
                isPlayingAudio={isPlayingAudio}
                onTogglePlayAudio={() => toggleAudioPlayback(message.id)}
                onSaveToMarkdown={handleSaveToMarkdown}
                onRetry={() => sendFollowUpText(message.content)}
              />
            ))}
          </div>

          {/* Follow-up Query Input Bar */}
          <FollowUpInputBar
            onSend={sendFollowUpText}
            disabled={engineState === 'THINKING'}
          />
        </section>
      </div>
    </div>
  );
};
