import React from 'react';
import { NeuralStreamSession } from '../../../entities/ai';

interface NeuralStreamListProps {
  sessions: NeuralStreamSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export const NeuralStreamList: React.FC<NeuralStreamListProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
}) => {
  return (
    <div className="neural-streams-widget" aria-label="신경망 세션 스트림 목록">
      <div className="neural-streams-header">
        <span className="streams-header-title">NEURAL STREAMS</span>
        <button
          type="button"
          className="streams-add-btn"
          onClick={onNewSession}
          title="새 신경망 세션 시작"
          aria-label="새 신경망 세션 시작"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
        </button>
      </div>

      <div className="neural-streams-list" role="list">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isLive = session.status === 'LIVE';

          return (
            <div
              key={session.id}
              role="listitem"
              className={`neural-stream-item ${isActive ? 'stream-active' : ''}`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="stream-item-main">
                <span
                  className={`stream-status-dot ${
                    isLive ? 'dot-live' : 'dot-idle'
                  }`}
                />
                <span className="stream-title" title={session.title}>
                  {session.title}
                </span>
              </div>
              <span
                className={`stream-tag ${
                  isLive ? 'tag-live' : 'tag-muted'
                }`}
              >
                {session.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
