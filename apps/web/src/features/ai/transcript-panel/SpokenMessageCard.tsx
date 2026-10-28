import React, { useEffect, useRef, useState } from 'react';
import { SpokenTranscriptMessage } from '../../../entities/ai';
import { AudioPlayerPill } from './AudioPlayerPill';
import { BenchmarkDeltaCard } from './BenchmarkDeltaCard';

interface SpokenMessageCardProps {
  message: SpokenTranscriptMessage;
  isPlayingAudio: boolean;
  onTogglePlayAudio: (messageId?: string) => void;
  onSaveToMarkdown?: (content: string) => void;
  onRetry?: (content: string) => void;
}

export const SpokenMessageCard: React.FC<SpokenMessageCardProps> = React.memo(
  ({
    message,
    isPlayingAudio,
    onTogglePlayAudio,
    onSaveToMarkdown,
    onRetry,
  }) => {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
    const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current);
        }
      };
    }, []);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current);
        }
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
      }
    };

    const isAssistant = message.role === 'assistant';

    if (!isAssistant) {
      return (
        <div className="spoken-message-user">
          <div className="user-message-bubble">
            <p className="user-message-text">{message.content}</p>
            <span className="user-message-time">{message.timestamp}</span>
          </div>
        </div>
      );
    }

    // 어시스턴트 답변 생성 중 (첫 토큰 수신 전)
    if (!message.content.trim()) {
      return (
        <div
          className="spoken-message-card thinking-placeholder-card"
          aria-label="J.A.R.V.I.S. 답변 생성 중"
        >
          <div className="thinking-card-header">
            <span className="thinking-pulse-lamp" />
            <span className="thinking-status-text">
              J.A.R.V.I.S.가 답변을 생성하고 있습니다...
            </span>
          </div>
          <div className="thinking-progress-track">
            <div className="thinking-progress-bar" />
          </div>
        </div>
      );
    }

    const formatLatency = (ms: number) => {
      return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
    };

    return (
      <div className="spoken-message-card" aria-label="J.A.R.V.I.S. 발화 내용">
        {/* Audio Player Scrubber Pill */}
        {message.audioDuration && (
          <AudioPlayerPill
            isPlaying={isPlayingAudio}
            currentTime={message.currentTime}
            duration={message.audioDuration}
            onTogglePlay={() => onTogglePlayAudio(message.id)}
          />
        )}

        {/* Spoken Transcript Content */}
        <div className="spoken-transcript-body">
          {message.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className={idx === 0 ? 'text-primary-lead' : 'text-body-flow'}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Benchmark Delta Telemetry Card */}
        {message.benchmarkDelta && (
          <BenchmarkDeltaCard metrics={message.benchmarkDelta} />
        )}

        {/* Context Referenced Chips */}
        {message.contexts && message.contexts.length > 0 && (
          <div className="context-referenced-section">
            <span className="context-ref-title">Context referenced</span>
            <div className="context-chips-group">
              {message.contexts.map((ctx) => (
                <a
                  key={ctx.id}
                  href={`#${ctx.filename}`}
                  className="context-chip-link"
                  title={`${ctx.title} 문서로 이동`}
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      ctx.type === 'architecture' ? 'text-tertiary' : 'text-primary'
                    }`}
                  >
                    {ctx.type === 'architecture' ? 'article' : 'description'}
                  </span>
                  <span>{ctx.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar & Quick Tools */}
        <div className="transcript-action-bar">
          <div className="action-left-group">
            <button
              type="button"
              className="action-btn"
              onClick={handleCopy}
              title="대화 내용 복사"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              type="button"
              className="action-btn btn-secondary-highlight"
              onClick={() => onSaveToMarkdown?.(message.content)}
              title="마크다운 문서로 저장"
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">
                bookmark
              </span>
              <span>Save to Markdown</span>
            </button>

            {message.latencyMs !== undefined && (
              <span
                className="message-latency-pill"
                title={`첫 응답 지연 시간: ${formatLatency(message.latencyMs)}${
                  message.totalDurationMs ? ` (총 ${formatLatency(message.totalDurationMs)})` : ''
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-tertiary">bolt</span>
                <span>{formatLatency(message.latencyMs)}</span>
              </span>
            )}
          </div>

          <div className="action-right-group">
            <button
              type="button"
              className={`action-icon-btn ${feedback === 'up' ? 'active-icon' : ''}`}
              onClick={() => setFeedback((prev) => (prev === 'up' ? null : 'up'))}
              title="도움이 됨 (Helpful)"
              aria-label="도움이 됨"
            >
              <span className="material-symbols-outlined text-[15px]">thumb_up</span>
            </button>
            <button
              type="button"
              className={`action-icon-btn ${feedback === 'down' ? 'active-icon' : ''}`}
              onClick={() => setFeedback((prev) => (prev === 'down' ? null : 'down'))}
              title="도움이 안 됨 (Unhelpful)"
              aria-label="도움이 안 됨"
            >
              <span className="material-symbols-outlined text-[15px]">thumb_down</span>
            </button>
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => onRetry?.(message.content)}
              title="답변 재생성 (Retry)"
              aria-label="답변 재생성"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);
