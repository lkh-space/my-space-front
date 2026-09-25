import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';
import { TopNavBar } from './TopNavBar';
import { CommandPalette } from './CommandPalette';
import './layout.css';

export const ShellLayout: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleTasksCleared = useCallback(() => {
    // 최근 작업 이력이 비워졌을 때 대시보드 화면 등이 즉시 반응할 수 있도록 이벤트 전파
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recent-tasks-updated'));
    }
  }, []);

  return (
    <div className="shell-container">
      {/* 1. Left Fixed Sidebar */}
      <SideNavBar onOpenCommandPalette={handleOpenCommandPalette} />

      {/* 2. Main Content Canvas */}
      <div className="main-canvas-area">
        <TopNavBar onOpenCommandPalette={handleOpenCommandPalette} />
        <main className="workspace-content bg-grid-dots">
          <Outlet />
        </main>
      </div>

      {/* 3. Global Command Palette Modal */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onTasksCleared={handleTasksCleared}
      />
    </div>
  );
};
