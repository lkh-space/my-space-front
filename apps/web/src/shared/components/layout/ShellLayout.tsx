import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';
import { Header } from '../../../widgets/header';
import { BottomNavBar } from './BottomNavBar';
import { CommandPalette } from './CommandPalette';
import { ErrorBoundary } from '../error/ErrorBoundary';
import './layout.css';

export const ShellLayout: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleTasksCleared = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recent-tasks-updated'));
    }
  }, []);

  return (
    <div className="shell-container">
      {/* 1. Left Sidebar (Desktop 240px, Tablet 64px, Mobile Hidden) */}
      <SideNavBar onOpenCommandPalette={handleOpenCommandPalette} />

      {/* 2. Main Content Canvas */}
      <div className="main-canvas-area">
        <Header onOpenCommandPalette={handleOpenCommandPalette} />
        <main className="workspace-content bg-grid-dots">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation Bar (< 768px only) */}
      <BottomNavBar />

      {/* 4. Global Command Palette Modal */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onTasksCleared={handleTasksCleared}
      />
    </div>
  );
};
