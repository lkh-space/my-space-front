import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import { RecentTaskItem } from '../../../shared/types/dashboard';

interface RecentTasksCardProps {
  tasks: RecentTaskItem[];
  onClear: () => void;
}

export const RecentTasksCard: React.FC<RecentTasksCardProps> = ({ tasks, onClear }) => {
  const { t } = useTranslation();

  return (
    <div
      className="monitoring-card"
      aria-label={t('dashboard.recentTasks.panelAria')}
    >
      <div className="monitoring-card-header">
        <h2>
          <span className="material-symbols-outlined">
            history
          </span>
          <span>{t('dashboard.recentTasks.title')}</span>
        </h2>
        {tasks.length > 0 && (
          <button
            type="button"
            className="header-action-btn"
            onClick={onClear}
            title={t('dashboard.recentTasks.clearAllTitle')}
            aria-label={t('dashboard.recentTasks.clearBtn')}
          >
            <span className="material-symbols-outlined">
              delete_sweep
            </span>
            <span>{t('dashboard.recentTasks.clearBtn')}</span>
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-tasks-view">
          <span className="material-symbols-outlined">
            inbox
          </span>
          <p>{t('dashboard.recentTasks.emptyText')}</p>
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
