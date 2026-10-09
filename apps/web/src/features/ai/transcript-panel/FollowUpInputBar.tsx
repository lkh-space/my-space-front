import React, { useState } from 'react';

interface FollowUpInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const FollowUpInputBar: React.FC<FollowUpInputBarProps> = ({ onSend, disabled }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSend(query);
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="followup-input-container" aria-label="후속 질문 입력 영역">
      <form className="followup-input-box" onSubmit={handleSubmit}>
        <input
          type="text"
          className="followup-text-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Reply or ask follow-up..."
          disabled={disabled}
          aria-label="후속 질문 입력"
        />
        <div className="followup-actions">
          <button
            type="button"
            className="followup-attach-btn"
            title="첨부 파일"
            aria-label="첨부 파일"
          >
            <span className="material-symbols-outlined text-[16px]">attach_file</span>
          </button>
          <button
            type="submit"
            className="followup-send-btn"
            disabled={!query.trim() || disabled}
            title="후속 질문 전송"
            aria-label="후속 질문 전송"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
          </button>
        </div>
      </form>

      <div className="followup-hint-strip">
        <span className="hint-left">Shift + Return for newline</span>
        <span className="hint-right">GPT-4o / WASM</span>
      </div>
    </div>
  );
};
