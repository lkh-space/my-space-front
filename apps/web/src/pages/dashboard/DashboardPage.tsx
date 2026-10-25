import React, { useState, useEffect, useCallback } from 'react';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { InstalledUtilitiesGrid } from './components/InstalledUtilitiesGrid';
import { RecentTasksCard } from './components/RecentTasksCard';
import { RuntimeEnvironmentCard } from './components/RuntimeEnvironmentCard';
import {
  getRecentTasks,
  clearRecentTasks,
  RECENT_TASKS_UPDATED_EVENT,
} from '../../shared/utils/storage';
import { RecentTaskItem } from '../../shared/types/dashboard';
import './dashboard.css';

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<RecentTaskItem[]>([]);

  const loadTasks = useCallback(() => {
    setTasks(getRecentTasks());
  }, []);

  useEffect(() => {
    loadTasks();

    // 유틸리티(PDF, 마크다운 등) 외부에서 작업 기록이 추가/변경되었을 때 수신
    const handleUpdated = () => {
      loadTasks();
    };

    window.addEventListener(RECENT_TASKS_UPDATED_EVENT, handleUpdated);
    return () => window.removeEventListener(RECENT_TASKS_UPDATED_EVENT, handleUpdated);
  }, [loadTasks]);

  const handleClearTasks = () => {
    clearRecentTasks();
    setTasks([]);
  };

  return (
    <div className="dashboard-page">
      {/* 1. Header with Overview Title & Local Isolation Badge */}
      <WorkspaceHeader />

      {/* 2. Bento Grid of Installed Utilities */}
      <InstalledUtilitiesGrid />

      {/* 3. 60:40 Split Monitoring Section */}
      <section className="split-monitoring-section" aria-label="작업 이력 및 런타임 모니터링">
        {/* Left 60%: Recent Local Tasks */}
        <RecentTasksCard tasks={tasks} onClear={handleClearTasks} />

        {/* Right 40%: Runtime Environment & Resources */}
        <RuntimeEnvironmentCard />
      </section>
    </div>
  );
};

export default DashboardPage;
