import React, { useState } from 'react';
import { AiEngineState } from '../../../entities/ai';

interface PttInputBarProps {
  engineState: AiEngineState;
  onStartListening: () => void;
  onStopListeningAndSend: (text?: string) => void;
  onSendQuery: (text: string) => void;
}

export const PttInputBar: React.FC<PttInputBarProps> = ({
  engineState,
  onStartListening,
  onStopListeningAndSend,
  onSendQuery,
}) => {
  const [inputText, setInputText] = useState('');
  const isListening = engineState === 'LISTENING';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendQuery(inputText);
      setInputText('');
    }
  };

  return (
    <div className="ptt-input-container" aria-label="음성 및 쿼리 입력 인터페이스">
      <form className="ptt-input-box" onSubmit={handleSubmit}>
        {/* PTT Hold Space Button */}
        <button
          type="button"
          className={`ptt-trigger-btn ${isListening ? 'ptt-listening-active' : ''}`}
          onMouseDown={onStartListening}
          onMouseUp={() => onStopListeningAndSend(inputText)}
          onTouchStart={onStartListening}
          onTouchEnd={() => onStopListeningAndSend(inputText)}
          title="길게 눌러 음성 입력 (Spacebar)"
        >
          <span className={`ptt-status-dot ${isListening ? 'dot-pulse' : ''}`} />
          <span className="material-symbols-outlined text-[15px]">mic</span>
          <span className="ptt-btn-label">{isListening ? 'Listening...' : 'PTT: Hold Space'}</span>
        </button>

        {/* Query Input Field */}
        <input
          type="text"
          className="ptt-query-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Voice listening or type query... ('Compare local OPFS caching with MongoDB change streams')"
          aria-label="음성 또는 텍스트 쿼리 입력"
        />

        {/* Trailing Action Controls */}
        <div className="ptt-action-group">
          <button
            type="button"
            className="ptt-icon-btn"
            title="파일 첨부"
            aria-label="파일 첨부"
          >
            <span className="material-symbols-outlined text-[18px]">attach_file</span>
          </button>
          <button
            type="button"
            className="ptt-icon-btn"
            title="오디오 웨이브폼"
            aria-label="오디오 웨이브폼"
          >
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
          </button>
          <button
            type="submit"
            className="ptt-send-btn"
            title="쿼리 전송"
            aria-label="쿼리 전송"
            disabled={!inputText.trim()}
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-[14px]">send</span>
          </button>
        </div>
      </form>

      {/* Security & Token Context Subtext */}
      <div className="ptt-footer-info">
        <span className="ptt-security-badge">
          <span className="material-symbols-outlined text-[13px]">lock</span>
          <span>Private Neural Engine running locally via WebGPU/WASM. Zero remote telemetry.</span>
        </span>
        <span className="ptt-token-metric">Tokens: 2,410 / 8,192 ctx</span>
      </div>
    </div>
  );
};
