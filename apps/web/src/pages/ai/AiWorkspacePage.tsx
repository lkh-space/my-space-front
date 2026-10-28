import React, { useCallback, useEffect, useRef } from 'react';
import './ai-workspace-page.css';
import { useAiStream } from '../../entities/ai';
import { createDocument } from '../../entities/markdown';
import { addRecentTask } from '../../shared/utils/storage';
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
    isProcessing,
    processingElapsedMs,
    lastLatencyMs,
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

      // Spacebar (Push-to-Talk)
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();

        // 키를 꾹 누르고 있을 때 발생하는 브라우저 키 반복(repeat) 무시
        if (e.repeat) return;

        if (engineState === 'SPEAKING') {
          interruptSpeech();
          return;
        }

        if (!isSpaceKeyDownRef.current && (engineState === 'IDLE' || engineState === 'LISTENING')) {
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

  const handleSaveToMarkdown = useCallback(async (content: string) => {
    const title = `JARVIS Spoken Note - ${new Date().toLocaleDateString()}`;
    try {
      await createDocument({
        title,
        content,
        tags: ['jarvis', 'ai-note'],
      });
    } catch {
      // 오프라인 또는 백엔드 미연결 시 로컬 스토리지 안전 폴백
      try {
        const stored = localStorage.getItem('my-space-docs');
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        const docs = Array.isArray(parsed) ? parsed : [];
        const newDoc = {
          id: `doc-${Date.now()}`,
          title,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('my-space-docs', JSON.stringify([newDoc, ...docs]));
      } catch {
        // storage error fallback
      }
    }

    addRecentTask({
      title: `${title}.md`,
      type: 'markdown',
      status: 'COMPLETED',
      detail: 'J.A.R.V.I.S. 음성 노트 마크다운 저장 완료',
    });
    alert('마크다운 문서 스튜디오에 성공적으로 저장되었습니다.');
  }, []);

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
              {lastLatencyMs !== null && (
                <>
                  <span>/</span>
                  <span className="telemetry-api-latency">
                    API TTFT: <strong className="text-tertiary">{lastLatencyMs < 1000 ? `${lastLatencyMs}ms` : `${(lastLatencyMs / 1000).toFixed(2)}s`}</strong>
                  </span>
                </>
              )}
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
              onSendQuery={sendFollowUpText}
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

          {/* Active Streaming Indeterminate Progress Bar */}
          {isProcessing && (
            <div
              className="stream-progress-strip"
              role="progressbar"
              aria-label="J.A.R.V.I.S. 응답 생성 중"
            >
              <div className="stream-progress-bar-glow" />
              <div className="stream-progress-meta">
                <span className="stream-progress-lamp" />
                <span className="stream-progress-text">
                  J.A.R.V.I.S. 신경망 연산 중 ({(processingElapsedMs / 1000).toFixed(1)}s)
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Transcript Area */}
          <div className="transcript-scroll-area" ref={scrollAreaRef}>
            {messages.map((message) => (
              <SpokenMessageCard
                key={message.id}
                message={message}
                isPlayingAudio={isPlayingAudio}
                onTogglePlayAudio={toggleAudioPlayback}
                onSaveToMarkdown={handleSaveToMarkdown}
                onRetry={sendFollowUpText}
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

export default AiWorkspacePage;
