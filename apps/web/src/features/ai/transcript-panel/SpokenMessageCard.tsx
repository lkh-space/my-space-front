import React, { useState } from 'react';
import { SpokenTranscriptMessage } from '../../../entities/ai';
import { AudioPlayerPill } from './AudioPlayerPill';
import { BenchmarkDeltaCard } from './BenchmarkDeltaCard';

interface SpokenMessageCardProps {
  message: SpokenTranscriptMessage;
  isPlayingAudio: boolean;
  onTogglePlayAudio: () => void;
  onSaveToMarkdown?: (content: string) => void;
  onRetry?: () => void;
}

export const SpokenMessageCard: React.FC<SpokenMessageCardProps> = ({
  message,
  isPlayingAudio,
  onTogglePlayAudio,
  onSaveToMarkdown,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="spoken-message-card" aria-label="J.A.R.V.I.S. 발화 내용">
      {/* Audio Player Scrubber Pill */}
      {message.audioDuration && (
        <AudioPlayerPill
          isPlaying={isPlayingAudio}
          currentTime={message.currentTime}
          duration={message.audioDuration}
          onTogglePlay={onTogglePlayAudio}
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
            onClick={onRetry}
            title="답변 재생성 (Retry)"
            aria-label="답변 재생성"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
