import React from 'react';
import { RecentTaskItem } from '../../../shared/types/dashboard';

interface RecentTasksCardProps {
  tasks: RecentTaskItem[];
  onClear: () => void;
}

export const RecentTasksCard: React.FC<RecentTasksCardProps> = ({ tasks, onClear }) => {
  return (
    <div className="monitoring-card" aria-label="최근 로컬 작업 이력 패널">
      <div className="monitoring-card-header">
        <h2>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-muted)' }}>
            history
          </span>
          <span>최근 로컬 작업 이력</span>
        </h2>
        {tasks.length > 0 && (
          <button
            type="button"
            className="header-action-btn"
            onClick={onClear}
            title="모든 로컬 작업 이력 삭제"
            aria-label="기록 비우기"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              delete_sweep
            </span>
            <span>기록 비우기</span>
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-tasks-view">
          <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.5 }}>
            inbox
          </span>
          <p>최근 실행된 로컬 작업 이력이 없습니다.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-main">
                <span className={`task-type-badge ${task.type}`}>
                  {task.type.toUpperCase()}
                </span>
                <div className="task-text-group">
                  <span className="task-title" title={task.title}>
                    {task.title}
                  </span>
                  {task.detail && <span className="task-detail">{task.detail}</span>}
                </div>
              </div>

              <div className="task-meta">
                <span className="task-status-tag">{task.status}</span>
                <span className="task-timestamp">{task.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
